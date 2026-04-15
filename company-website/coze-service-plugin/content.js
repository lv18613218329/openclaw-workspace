// ========== 插件核心配置 ==========
const COZE_TOKEN = "pat_pQIrwCjHqjxkx0j2CcP2cHhd9JCGxTFkcL0hWtSP6Sj7A2KRm3LnpOGXs9o5KMpN";
let BOT_ID = "7614096304390094889";
const FLOAT_POSITION = "right";

// ========== 1. 从当前页面URL的channel参数获取参数 ==========
const currentUrl = new URL(window.location.href);
const channelParam = currentUrl.searchParams.get("channel");

console.log("Coze对话查看插件：当前页面URL=", window.location.href);
console.log("Coze对话查看插件：channel参数=", channelParam);

let conversation_id = null;
let user_id = null;
let chat_id = null;  // 新增 chat_id

if (channelParam) {
  try {
    const channelData = JSON.parse(channelParam);
    console.log("Coze对话查看插件：解析后的channelData=", channelData);
    conversation_id = channelData.conversation_id;
    user_id = channelData.user_Token || channelData.user_id;
    chat_id = channelData.chat_id || null;  // 获取 chat_id
    if (channelData.botId) {
      BOT_ID = channelData.botId;
    }
    console.log("Coze对话查看插件：提取的conversation_id=", conversation_id);
    console.log("Coze对话查看插件：提取的user_id=", user_id);
    console.log("Coze对话查看插件：提取的chat_id=", chat_id);
    console.log("Coze对话查看插件：提取的botId=", BOT_ID);
  } catch (e) {
    console.error("Coze对话查看插件：解析channel参数失败", e);
  }
} else {
  console.log("Coze对话查看插件：未找到channel参数");
}

// 若未检测到conversation_id，不执行后续操作
if (!conversation_id) {
  console.log("Coze对话查看插件：未检测到conversation_id，不执行拉取操作");
} else {
  console.log("Coze对话查看插件：检测到对话ID，开始拉取记录");
  // 拉取对话记录并渲染（传入 chat_id）
  loadCozeChat(conversation_id, user_id, chat_id);
}

// ========== 2. 调用Coze接口拉取对话记录 ==========
async function loadCozeChat(conversationId, userId, chatId) {
  try {
    // 清理token可能的隐藏字符
    const cleanToken = COZE_TOKEN.replace(/[^\x20-\x7E]/g, '');
    const cleanBotId = String(BOT_ID).replace(/[^\x20-\x7E]/g, '');
    const cleanConvId = String(conversationId).replace(/[^\x20-\x7E]/g, '');
    const cleanChatId = chatId ? String(chatId).replace(/[^\x20-\x7E]/g, '') : '';

    console.log("Coze对话查看插件：准备请求API，conversation_id=", cleanConvId, "chat_id=", cleanChatId);

    // 通过代理调用 Coze 官方 API
    // GET /v1/conversations?conversation_ids=xxx
    const apiPaths = [
      { url: `http://localhost:8888/api/coze?conversation_id=${encodeURIComponent(cleanConvId)}`, method: "GET" }
    ];

    const commonHeaders = {
      "Authorization": "Bearer " + cleanToken,
      "Content-Type": "application/json"
    };

    let responseData = null;
    let lastError = null;

    for (const api of apiPaths) {
      try {
        let url = api.url;
        
        // GET请求添加query参数
        if (api.method === "GET" && api.query) {
          const params = new URLSearchParams(api.query).toString();
          url += (url.includes('?') ? '&' : '?') + params;
        }
        
        console.log("Coze对话查看插件：尝试API=", api.method, url);
        
        const fetchOptions = {
          method: api.method,
          headers: commonHeaders
        };
        
        if (api.body) {
          fetchOptions.body = JSON.stringify(api.body);
        }
        
        const resp = await fetch(url, fetchOptions);
        const data = await resp.json();
        
        console.log("Coze对话查看插件：响应=", data);
        
        if (resp.ok && data.code === 0) {
          console.log("Coze对话查看插件：API成功=", api.url);
          responseData = data;
          break;
        } else {
          console.log("Coze对话查看插件：API失败=", api.url, resp.status, data.msg);
          lastError = data.msg || `HTTP ${resp.status}`;
        }
      } catch (e) {
        console.log("Coze对话查看插件：API异常=", api.url, e.message);
        lastError = e.message;
      }
    }

    if (!responseData) {
      throw new Error("API调用失败: " + lastError);
    }
    // 接口返回异常处理
    if (responseData.code !== 0) {
      throw new Error(responseData.msg || "对话记录拉取失败");
    }

    // 拉取成功，显示会话信息
    console.log("Coze消息列表:", responseData.data);
    
    // 消息列表渲染
    const messages = responseData.data || [];
    const infoText = `共 ${messages.length} 条消息`;
    
    // 渲染悬浮窗显示消息列表
    renderFloatWindow(messages, userId);
  } catch (error) {
    // 异常提示
    alert(`Coze对话查看插件：${error.message}`);
    console.error("Coze对话拉取失败：", error);
  }
}

// ========== 3. 渲染悬浮窗 ==========
function renderFloatWindow(messages, userId) {
  // 避免重复创建悬浮窗
  if (document.getElementById("coze-float-window")) {
    document.getElementById("coze-float-window").remove();
  }

  // 1. 创建悬浮窗容器
  const floatWindow = document.createElement("div");
  floatWindow.id = "coze-float-window";
  // 设置悬浮窗位置（根据配置）
  const positionStyle = FLOAT_POSITION === "left" ? "left: 20px;" : "right: 20px;";
  floatWindow.style.cssText = `
    position: fixed;
    top: 20px;
    ${positionStyle}
    width: 380px;
    height: 600px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 0 20px rgba(0,0,0,0.2);
    z-index: 999999;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `;

  // 2. 悬浮窗头部（用户ID + 关闭按钮）
  const floatHeader = document.createElement("div");
  floatHeader.className = "coze-float-header";
  floatHeader.innerHTML = `
    <span>用户ID：${userId || "未知用户"}</span>
    <span class="coze-close-btn">✕</span>
  `;

  // 3. 悬浮窗聊天主体
  const chatBody = document.createElement("div");
  chatBody.className = "coze-chat-body";

  // 4. 渲染对话记录
  if (messages.length === 0) {
    // 无对话记录
    chatBody.innerHTML = '<div class="coze-empty-chat">暂无对话记录</div>';
  } else {
    // 渲染每条消息
    messages.forEach(msg => {
      const msgItem = document.createElement("div");
      msgItem.className = `coze-msg coze-msg-${msg.role}`;

      // 根据消息类型渲染不同内容
      if (msg.type === "image" || (msg.content && msg.content.startsWith("http") && /\.(png|jpg|jpeg|gif|webp)/i.test(msg.content))) {
        // 图片消息
        msgItem.innerHTML = `<img src="${msg.content}" class="coze-msg-img" onclick="previewImage('${msg.content}')" />`;
      } else if (msg.type === "file") {
        // 文件消息
        try {
          const fileInfo = JSON.parse(msg.content);
          const fileName = fileInfo.file_name || "未知文件";
          const fileSize = (fileInfo.size / 1024).toFixed(1) + "KB";
          const fileUrl = fileInfo.url || "#";
          msgItem.innerHTML = `
            <div class="coze-file-box">
              <div>
                <div class="coze-file-name">${fileName}</div>
                <div class="coze-file-size">${fileSize}</div>
              </div>
              <a href="${fileUrl}" target="_blank" class="coze-file-download">下载</a>
            </div>
          `;
        } catch (e) {
          // 文件解析失败，显示文本
          msgItem.innerText = "文件解析失败，无法显示";
        }
      } else {
        // 文字消息（转义特殊字符，避免XSS）
        msgItem.innerText = msg.content || "无内容";
      }

      chatBody.appendChild(msgItem);
    });
  }

  // 5. 组装悬浮窗
  floatWindow.appendChild(floatHeader);
  floatWindow.appendChild(chatBody);
  document.body.appendChild(floatWindow);

  // 6. 绑定关闭按钮事件
  floatWindow.querySelector(".coze-close-btn").onclick = () => {
    floatWindow.remove();
  };

  // 7. 绑定图片预览事件（全局函数，供图片点击调用）
  window.previewImage = function(url) {
    // 创建图片预览弹窗
    const previewModal = document.createElement("div");
    previewModal.id = "coze-preview-modal";
    previewModal.innerHTML = `<img src="${url}" class="coze-preview-img" />`;
    document.body.appendChild(previewModal);
    
    // 点击弹窗关闭预览
    previewModal.onclick = () => {
      previewModal.remove();
      delete window.previewImage; // 移除全局函数，避免残留
    };
  };
}