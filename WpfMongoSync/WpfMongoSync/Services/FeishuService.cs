using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using WpfMongoSync.Models;

namespace WpfMongoSync.Services;

/// <summary>
/// 飞书服务 - 负责多维表格操作
/// </summary>
public class FeishuService
{
    private readonly HttpClient _httpClient;
    private string? _accessToken;
    private DateTime _tokenExpireTime;

    public FeishuService()
    {
        _httpClient = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(30)
        };
    }

    /// <summary>
    /// 获取访问令牌
    /// </summary>
    public async Task<string> GetAccessTokenAsync(string appId, string appSecret)
    {
        // 检查缓存的token是否有效
        if (!string.IsNullOrEmpty(_accessToken) && DateTime.UtcNow < _tokenExpireTime)
        {
            return _accessToken;
        }

        try
        {
            var requestBody = new
            {
                app_id = appId,
                app_secret = appSecret
            };

            var content = new StringContent(
                JsonConvert.SerializeObject(requestBody),
                Encoding.UTF8,
                "application/json");

            var response = await _httpClient.PostAsync(
                "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
                content);

            var responseString = await response.Content.ReadAsStringAsync();
            var result = JObject.Parse(responseString);

            if (result["code"]?.Value<int>() == 0)
            {
                _accessToken = result["tenant_access_token"]?.Value<string>();
                var expire = result["expire"]?.Value<int>() ?? 7200;
                _tokenExpireTime = DateTime.UtcNow.AddSeconds(expire - 300);
                return _accessToken!;
            }
            else
            {
                throw new Exception($"获取Token失败: {result["msg"]}");
            }
        }
        catch (Exception ex)
        {
            throw new Exception($"飞书认证失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 清空表格数据
    /// </summary>
    public async Task<bool> ClearTableAsync(string appToken, string tableId, string accessToken)
    {
        try
        {
            _httpClient.DefaultRequestHeaders.Authorization = 
                new AuthenticationHeaderValue("Bearer", accessToken);

            // 获取所有记录
            var listUrl = $"https://open.feishu.cn/open-apis/bitable/v1/apps/{appToken}/tables/{tableId}/records?page_size=500";
            var listResponse = await _httpClient.GetAsync(listUrl);
            var listString = await listResponse.Content.ReadAsStringAsync();
            var listResult = JObject.Parse(listString);

            if (listResult["code"]?.Value<int>() != 0)
            {
                return false;
            }

            var items = listResult["data"]?["items"] as JArray;
            if (items == null || items.Count == 0)
            {
                return true;
            }

            // 批量删除记录
            var recordIds = new List<string>();
            foreach (var item in items)
            {
                recordIds.Add(item["record_id"]?.Value<string>() ?? "");
            }

            // 每次最多删除500条
            for (int i = 0; i < recordIds.Count; i += 500)
            {
                var batch = recordIds.GetRange(i, Math.Min(500, recordIds.Count - i));
                var deleteBody = new { records = batch };
                var deleteContent = new StringContent(
                    JsonConvert.SerializeObject(deleteBody),
                    Encoding.UTF8,
                    "application/json");

                var deleteUrl = $"https://open.feishu.cn/open-apis/bitable/v1/apps/{appToken}/tables/{tableId}/records/batch_delete";
                var deleteResponse = await _httpClient.PostAsync(deleteUrl, deleteContent);
            }

            return true;
        }
        catch (Exception ex)
        {
            throw new Exception($"清空表格失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 插入数据到多维表格（追加模式）
    /// </summary>
    public async Task<bool> InsertRecordsAsync(
        string appToken, 
        string tableId, 
        string accessToken,
        List<Dictionary<string, object>> data)
    {
        try
        {
            _httpClient.DefaultRequestHeaders.Authorization = 
                new AuthenticationHeaderValue("Bearer", accessToken);

            // 转换数据格式
            var records = new List<object>();
            foreach (var row in data)
            {
                records.Add(new { fields = row });
            }

            // 每次最多插入500条
            int batchSize = 500;
            for (int i = 0; i < records.Count; i += batchSize)
            {
                var batch = records.GetRange(i, Math.Min(batchSize, records.Count - i));
                var requestBody = new { records = batch };

                var content = new StringContent(
                    JsonConvert.SerializeObject(requestBody),
                    Encoding.UTF8,
                    "application/json");

                var url = $"https://open.feishu.cn/open-apis/bitable/v1/apps/{appToken}/tables/{tableId}/records/batch_create";
                var response = await _httpClient.PostAsync(url, content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorString = await response.Content.ReadAsStringAsync();
                    throw new Exception($"插入失败: {errorString}");
                }
            }

            return true;
        }
        catch (Exception ex)
        {
            throw new Exception($"插入数据失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 同步数据（清空后插入）- 全量同步模式
    /// </summary>
    public async Task<bool> SyncDataAsync(FeishuConfig config, List<Dictionary<string, object>> data)
    {
        try
        {
            // 获取token
            var token = await GetAccessTokenAsync(config.AppId, config.AppSecret);

            // 清空表格
            await ClearTableAsync(config.AppToken, config.TableId, token);

            // 插入数据
            await InsertRecordsAsync(config.AppToken, config.TableId, token, data);

            return true;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// 追加数据（不清空表格）- 增量同步模式
    /// </summary>
    public async Task<bool> AppendDataAsync(FeishuConfig config, List<Dictionary<string, object>> data)
    {
        try
        {
            // 获取token
            var token = await GetAccessTokenAsync(config.AppId, config.AppSecret);

            // 直接插入数据（不清空）
            await InsertRecordsAsync(config.AppToken, config.TableId, token, data);

            return true;
        }
        catch
        {
            return false;
        }
    }
}