using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace CozeScheduler.Services;

public class CozeService
{
    private readonly HttpClient _httpClient;
    private const string CozeApiUrl = "https://api.coze.cn/v3/chat";

    public CozeService()
    {
        _httpClient = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(60)
        };
    }

    public async Task<bool> CallAgentAsync(string accessToken, string botId, string query)
    {
        try
        {
            _httpClient.DefaultRequestHeaders.Authorization = 
                new AuthenticationHeaderValue("Bearer", accessToken);

            var requestBody = new
            {
                bot_id = botId,
                user_id = "coze_scheduler",
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
                    return true;
                }
                else
                {
                    var msg = result["msg"]?.Value<string>() ?? "未知错误";
                    throw new Exception($"Coze API 错误: {msg}");
                }
            }
            else
            {
                throw new Exception($"HTTP 错误: {response.StatusCode} - {responseString}");
            }
        }
        catch (Exception ex)
        {
            throw new Exception($"调用 Coze 智能体失败: {ex.Message}");
        }
    }

    public async Task<string> CallAgentWithResultAsync(string accessToken, string botId, string query)
    {
        try
        {
            _httpClient.DefaultRequestHeaders.Authorization = 
                new AuthenticationHeaderValue("Bearer", accessToken);

            var requestBody = new
            {
                bot_id = botId,
                user_id = "coze_scheduler",
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
                    var data = result["data"];
                    var messages = data?["messages"] as JArray;
                    
                    if (messages != null && messages.Count > 0)
                    {
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