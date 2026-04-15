using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace WpfMongoSync.Services;

/// <summary>
/// Coze 智能体服务 - 调用扣子 API
/// </summary>
public class CozeService
{
    private readonly HttpClient _httpClient;
    
    // Coze API 地址
    private const string CozeApiUrl = "https://api.coze.cn/v3/chat";

    public CozeService()
    {
        _httpClient = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(60)
        };
    }

    /// <summary>
    /// 调用 Coze 智能体
    /// </summary>
    /// <param name="accessToken">个人访问令牌 (Personal Access Token)</param>
    /// <param name="botId">Bot ID</param>
    /// <param name="query">查询内容</param>
    /// <returns>是否调用成功</returns>
    public async Task<bool> CallAgentAsync(string accessToken, string botId, string query)
    {
        try
        {
            // 设置请求头
            _httpClient.DefaultRequestHeaders.Authorization = 
                new AuthenticationHeaderValue("Bearer", accessToken);

            // 构建请求体
            var requestBody = new
            {
                bot_id = botId,
                user_id = "wpf_mongo_sync",  // 用户标识，固定值
                stream = false,  // 不使用流式输出
                additional_messages = new[]
                {
                    new
                    {
                        role = "user",
                        content = query,
                        content_type = "text"
                    }
                }
            };

            var content = new StringContent(
                JsonConvert.SerializeObject(requestBody),
                Encoding.UTF8,
                "application/json");

            // 发送请求
            var response = await _httpClient.PostAsync(CozeApiUrl, content);
            var responseString = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                var result = JObject.Parse(responseString);
                var code = result["code"]?.Value<int>();
                
                if (code == 0)
                {
                    // 调用成功
                    return true;
                }
                else
                {
                    // API 返回错误
                    var msg = result["msg"]?.Value<string>() ?? "未知错误";
                    throw new Exception($"Coze API 错误: {msg}");
                }
            }
            else
            {
                throw new Exception($"HTTP 错误: {response.StatusCode}");
            }
        }
        catch (Exception ex)
        {
            throw new Exception($"调用 Coze 智能体失败: {ex.Message}");
        }
    }

    /// <summary>
    /// 调用 Coze 智能体并返回结果
    /// </summary>
    /// <param name="accessToken">个人访问令牌</param>
    /// <param name="botId">Bot ID</param>
    /// <param name="query">查询内容</param>
    /// <returns>智能体返回的文本内容</returns>
    public async Task<string> CallAgentWithResultAsync(string accessToken, string botId, string query)
    {
        try
        {
            _httpClient.DefaultRequestHeaders.Authorization = 
                new AuthenticationHeaderValue("Bearer", accessToken);

            var requestBody = new
            {
                bot_id = botId,
                user_id = "wpf_mongo_sync",
                stream = false,
                additional_messages = new[]
                {
                    new
                    {
                        role = "user",
                        content = query,
                        content_type = "text"
                    }
                }
            };

            var content = new StringContent(
                JsonConvert.SerializeObject(requestBody),
                Encoding.UTF8,
                "application/json");

            var response = await _httpClient.PostAsync(CozeApiUrl, content);
            var responseString = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                var result = JObject.Parse(responseString);
                var code = result["code"]?.Value<int>();
                
                if (code == 0)
                {
                    // 提取返回内容
                    var data = result["data"];
                    var messages = data?["messages"] as JArray;
                    
                    if (messages != null && messages.Count > 0)
                    {
                        // 获取助手回复的内容
                        foreach (var msg in messages)
                        {
                            var type = msg["type"]?.Value<string>();
                            if (type == "answer")
                            {
                                return msg["content"]?.Value<string>() ?? "";
                            }
                        }
                    }
                    return "";
                }
                else
                {
                    var msg = result["msg"]?.Value<string>() ?? "未知错误";
                    throw new Exception($"Coze API 错误: {msg}");
                }
            }
            else
            {
                throw new Exception($"HTTP 错误: {response.StatusCode}");
            }
        }
        catch (Exception ex)
        {
            throw new Exception($"调用 Coze 智能体失败: {ex.Message}");
        }
    }
}