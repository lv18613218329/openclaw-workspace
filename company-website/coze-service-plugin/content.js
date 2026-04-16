// ========== 插件核心配置 ==========
const COZE_TOKEN = "pat_iTZYL67lEmWkaTODMfRlegntBpqjTZ2AtqjdTvdW6si2SNZhvwMZY1F5da1fipyR";
let BOT_ID = "7614096304390094889";
const FLOAT_POSITION = "right";

console.log("Coze对话查看插件：已加载");

// ========== 1. Base64解码函数 ==========
function base64Decode(str) {
  try {
    // 处理URL安全的Base64
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    // 补齐 padding
    while (base64.length % 4) {
      base64 += '=';
    }
    return decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  } catch (e) {
    console.error("Coze对话查看插件：Base64解码失败", e);
    return null;
  }
}

// ========== 2. 查找并切换到客户信息tab ==========
function switchToCustomerTab() {
  return new Promise((resolve) => {
    // 查找客户信息tab
    const tabs = document.querySelectorAll('[role="tab"], .tab-item, .ant-tabs-tab, .tabs div');
    let customerTab = null;
    
    for (const tab of tabs) {
      if (tab.textContent.includes('客户信息') || tab.innerText.includes('客户信息')) {
        customerTab = tab;
        break;
      }
    }
    
    // 如果没找到，更广泛搜索
    if (!customerTab) {
      const allElements = document.querySelectorAll('div, span, li, a');
      for (const el of allElements) {
        if (el.textContent.includes('客户信息') && el.offsetParent !== null) {
          // 找到可能接近tablist的元素
          const parent = el.closest('[role="tablist"]') || el.parentElement;
          if (parent) {
            customerTab = el;
            break;
          }
        }
      }
    }
    
    if (customerTab) {
      console.log("Coze对话查看插件：找到客户信息tab，点击切换");
      customerTab.click();
      // 等待tab切换
      setTimeout(resolve, 500);
    } else {
      console.log("Coze对话查看插件：未找到客户信息tab");
      resolve();
    }
  });
}

// ========== 3. 从描述字段获取数据 ==========
function getChannelDataFromDescription() {
  return new Promise((resolve) => {
    // 延迟一下等待DOM渲染
    setTimeout(() => {
      let descriptionTextarea = null;
      
      // 策略1: 直接通过ID查找（最快最准）
      descriptionTextarea = document.getElementById('description');
      
      // 策略2: 通过name属性查找
      if (!descriptionTextarea || !descriptionTextarea.value) {
        descriptionTextarea = document.querySelector('textarea[name="description"]');
      }
      
      // 策略3: 查找包含"描述"文字的元素附近的textarea
      if (!descriptionTextarea || !descriptionTextarea.value) {
        const labels = document.querySelectorAll('label, .label, .field-label, .ant-form-item-label');
        for (const label of labels) {
          if (label.textContent.includes('描述') || label.innerText.includes('描述')) {
            const container = label.closest('.ant-form-item, .form-item, .field-container, tr, div');
            if (container) {
              const textarea = container.querySelector('textarea, input[type="text"]');
              if (textarea && textarea.value) {
                descriptionTextarea = textarea;
                break;
              }
            }
          }
        }
      }
      
      // 策略4: 查找所有可见的textarea，检查value是否为Base64格式
      if (!descriptionTextarea || !descriptionTextarea.value) {
        const allInputs = document.querySelectorAll('textarea, input[type="text"]');
        for (const input of allInputs) {
          if (input.value && input.value.length > 20) {
            try {
              const decoded = base64Decode(input.value);
              if (decoded && decoded.includes('conversation_id')) {
                descriptionTextarea = input;
                break;
              }
            } catch (e) {
              // 继续查找
            }
          }
        }
      }
      
      console.log("Coze对话查看插件：找到描述字段=", descriptionTextarea ? (descriptionTextarea.id || 'unknown') : "未找到");
      resolve(descriptionTextarea);
    }, 800); // 等待DOM渲染
  });
}

// ========== 4. 主逻辑 ==========
async function init() {
  console.log("Coze对话查看插件：开始检测客户信息...");
  
  // 切换会话时，先移除旧的悬浮窗
  const existingWindow = document.getElementById("coze-float-window");
  if (existingWindow) {
    existingWindow.remove();
  }
  
  // 切换到客户信息tab
  await switchToCustomerTab();
  
  // 查找描述字段
  const descriptionTextarea = await getChannelDataFromDescription();
  
  if (!descriptionTextarea) {
    console.log("Coze对话查看插件：未找到描述字段的文本框或文本框为空，不执行拉取操作");
    return;
  }
  
  const textboxValue = descriptionTextarea.value;
  console.log("Coze对话查看插件：描述字段原始值=", textboxValue);
  
  // 检查内容是否为空
  if (!textboxValue || !textboxValue.trim()) {
    console.log("Coze对话查看插件：描述字段内容为空，不执行拉取操作");
    return;
  }
  
  // Base64解码
  const decodedStr = base64Decode(textboxValue);
  if (!decodedStr) {
    console.error("Coze对话查看插件：Base64解码失败");
    return;
  }
  
  console.log("Coze对话查看插件：解码后的字符串=", decodedStr);
  
  // 解析JSON
  let channelData;
  try {
    channelData = JSON.parse(decodedStr);
    console.log("Coze对话查看插件：解析后的channelData=", channelData);
  } catch (e) {
    console.error("Coze对话查看插件：解析JSON失败", e);
    return;
  }
  
  // 提取参数
  let conversation_id = channelData.conversation_id;
  let user_id = channelData.user_Token || channelData.user_id;
  let chat_id = channelData.chat_id || null;
  
  if (channelData.botId) {
    BOT_ID = channelData.botId;
  }
  
  console.log("Coze对话查看插件：提取的conversation_id=", conversation_id);
  console.log("Coze对话查看插件：提取的user_id=", user_id);
  console.log("Coze对话查看插件：提取的chat_id=", chat_id);
  console.log("Coze对话查看插件：提取的botId=", BOT_ID);
  
  // 若未检测到conversation_id，不执行后续操作
  if (!conversation_id) {
    console.log("Coze对话查看插件：未检测到conversation_id，不执行拉取操作");
    return;
  }
  
  console.log("Coze对话查看插件：检测到对话ID，开始拉取记录");
  loadCozeChat(conversation_id, user_id, chat_id);
}

// ========== 5. 调用Coze接口拉取对话记录 ==========
async function loadCozeChat(conversationId, userId, chatId) {
  try {
    // 清理token可能的隐藏字符
    const cleanToken = COZE_TOKEN.replace(/[^\x20-\x7E]/g, '');
    const cleanBotId = String(BOT_ID).replace(/[^\x20-\x7E]/g, '');
    const cleanConvId = String(conversationId).replace(/[^\x20-\x7E]/g, '');
    const cleanChatId = chatId ? String(chatId).replace(/[^\x20-\x7E]/g, '') : '';

    console.log("Coze对话查看插件：准备请求API，conversation_id=", cleanConvId, "chat_id=", cleanChatId);

    // 通过代理调用 Coze 官方 API
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
    
    if (responseData.code !== 0) {
      throw new Error(responseData.msg || "对话记录拉取失败");
    }

    // 拉取成功，显示会话信息
    console.log("Coze消息列表:", responseData.data);
    
    const messages = responseData.data || [];
    const infoText = `共 ${messages.length} 条消息`;
    
    // 渲染悬浮窗显示消息列表
    renderFloatWindow(messages, userId);
  } catch (error) {
    alert(`Coze对话查看插件：${error.message}`);
    console.error("Coze对话拉取失败：", error);
  }
}

// ========== 6. 渲染悬浮窗 ==========
function renderFloatWindow(messages, userId) {
  // 避免重复创建悬浮窗
  if (document.getElementById("coze-float-window")) {
    document.getElementById("coze-float-window").remove();
  }

  // 1. 创建悬浮窗容器
  const floatWindow = document.createElement("div");
  floatWindow.id = "coze-float-window";
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

  // 2. 悬浮窗头部
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
    chatBody.innerHTML = '<div class="coze-empty-chat">暂无对话记录</div>';
  } else {
    messages.forEach(msg => {
      const msgItem = document.createElement("div");
      msgItem.className = `coze-msg coze-msg-${msg.role}`;
      
      const content = msg.content || "";
      
      // 策略1: 检测Markdown图片格式 ![文字](URL)
      const markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
      let match;
      const imageUrls = [];
      let processedContent = content;
      
      while ((match = markdownImageRegex.exec(content)) !== null) {
        imageUrls.push(match[2]); // URL在第二个捕获组
      }
      
      // 如果有Markdown图片，移除图片语法，只保留文字部分
      processedContent = processedContent.replace(markdownImageRegex, '');
      
      // 策略2: 直接检测URL是否为图片（以常见图片扩展名结尾）
      const imageUrlRegex = /(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp)[^\s]*)/gi;
      while ((match = imageUrlRegex.exec(content)) !== null) {
        if (!imageUrls.includes(match[1])) {
          imageUrls.push(match[1]);
        }
      }
      
      // 渲染图片（如果有）
      imageUrls.forEach(imgUrl => {
        const imgElem = document.createElement("img");
        imgElem.src = imgUrl;
        imgElem.className = "coze-msg-img";
        imgElem.onclick = function() { previewImage(this.src); };
        imgElem.style.maxWidth = "100%";
        imgElem.style.borderRadius = "8px";
        imgElem.style.marginTop = "8px";
        imgElem.style.cursor = "pointer";
        chatBody.appendChild(imgElem);
      });
      
      // 渲染文字内容（移除图片语法后）
      if (processedContent.trim()) {
        // 检测是否为纯URL（没有其他文字）
        const urlOnlyRegex = /^https?:\/\/[^\s]+$/;
        if (urlOnlyRegex.test(processedContent.trim()) && imageUrls.length === 0) {
          // 纯URL，渲染成可点击链接
          msgItem.innerHTML = `<a href="${processedContent.trim()}" target="_blank">${processedContent.trim()}</a>`;
        } else {
          // 换行处理
          const textContent = processedContent.trim().replace(/\n/g, '<br>');
          msgItem.innerHTML = textContent;
        }
        chatBody.appendChild(msgItem);
      }
    });
  }

  floatWindow.appendChild(floatHeader);
  floatWindow.appendChild(chatBody);
  document.body.appendChild(floatWindow);

  floatWindow.querySelector(".coze-close-btn").onclick = () => {
    floatWindow.remove();
  };

  window.previewImage = function(url) {
    const previewModal = document.createElement("div");
    previewModal.id = "coze-preview-modal";
    previewModal.innerHTML = `<img src="${url}" class="coze-preview-img" />`;
    document.body.appendChild(previewModal);
    
    previewModal.onclick = () => {
      previewModal.remove();
      delete window.previewImage;
    };
  };
}

// ========== 7. 监听页面和右侧面板变化 ==========
function setupObserver() {
  // 监听整个页面变化（检测新的会话）
  const bodyObserver = new MutationObserver((mutations) => {
    // 检查是否需要重新初始化
    // 当检测到会话列表变化时，触发检测
    let shouldReinit = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) {
            // 检测是否添加到对话列表区域
            if (node.classList?.contains('ant-list-item') || 
                node.tagName === 'LI' ||
                node.textContent?.includes('客户信息') ||
                node.textContent?.includes('描述')) {
              shouldReinit = true;
              break;
            }
          }
        }
      }
      if (shouldReinit) break;
    }
    
    if (shouldReinit) {
      console.log("Coze对话查看插件：检测到页面变化，重新执行检测");
      // 防抖：延迟执行
      clearTimeout(window.cozeReinitTimer);
      window.cozeReinitTimer = setTimeout(() => {
        init();
      }, 1000);
    }
  });

  bodyObserver.observe(document.body, { 
    childList: true, 
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'data-state']
  });
  
  console.log("Coze对话查看插件：已设置MutationObserver监听");
}

// ========== 8. 启动 ==========
// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      init();
      setupObserver();
    }, 1500);
  });
} else {
  setTimeout(() => {
    init();
    setupObserver();
  }, 1500);
}

// 额外的窗口加载完成事件
window.addEventListener('load', () => {
  setTimeout(() => {
    init();
    setupObserver();
  }, 2000);
});
