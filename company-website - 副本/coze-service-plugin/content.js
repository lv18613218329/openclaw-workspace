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
    // 等待一小段时间确保DOM完全渲染
    setTimeout(() => {
      // 策略1: 查找role="tab"且文本包含"客户信息"的元素
      let customerTab = null;
      
      // 先尝试通过tablist和tab role属性查找
      const tabList = document.querySelector('[role="tablist"]');
      
      if (tabList) {
        const tabs = tabList.querySelectorAll('[role="tab"]');
        for (const tab of tabs) {
          const text = (tab.textContent?.trim() || tab.innerText?.trim() || '').replace(/\s+/g, ' ');
          if (text.includes('客户信息')) {
            // 检查是否已经是选中状态
            const isSelected = tab.getAttribute('aria-selected') === 'true' || 
                tab.classList.contains('ant-tabs-tab-active') ||
                tab.classList.contains('selected') ||
                tab.classList.contains('active');
            
            if (isSelected) {
              console.log("Coze对话查看插件：客户信息tab已经是选中状态");
              resolve();
              return;
            }
            
            // 找到未选中的客户信息tab，点击它
            customerTab = tab;
            console.log("Coze对话查看插件：找到客户信息tab，准备点击切换");
            tab.click();
            
            // 等待tab切换完成（多次等待确保切换成功）
            setTimeout(() => {
              // 再次检查是否切换成功
              const afterClickTab = Array.from(tabs).find(t => 
                (t.textContent?.trim() || t.innerText?.trim() || '').replace(/\s+/g, ' ').includes('客户信息')
              );
              if (afterClickTab) {
                const isNowSelected = afterClickTab.getAttribute('aria-selected') === 'true' || 
                    afterClickTab.classList.contains('ant-tabs-tab-active');
                if (isNowSelected) {
                  console.log("Coze对话查看插件：客户信息tab切换成功");
                } else {
                  console.log("Coze对话查看插件：客户信息tab点击后未选中，尝试再次点击");
                  afterClickTab.click();
                  setTimeout(resolve, 500);
                  return;
                }
              }
              resolve();
            }, 600);
            return;
          }
        }
      }
      
      // 策略2: 直接查找包含"客户信息"的元素（更广泛的搜索）
      if (!customerTab) {
        const allElements = document.querySelectorAll('div, span, li, a, button, p');
        for (const el of allElements) {
          const text = (el.textContent?.trim() || el.innerText?.trim() || '').replace(/\s+/g, ' ');
          if (text === '客户信息' && el.offsetParent !== null && el.isVisible?.() !== false) {
            // 尝试找父级tablist
            let parent = el.parentElement;
            let foundTabList = false;
            for (let i = 0; i < 5; i++) {
              if (parent && parent.getAttribute?.('role') === 'tablist') {
                foundTabList = true;
                break;
              }
              parent = parent?.parentElement;
            }
            if (foundTabList) {
              customerTab = el;
              console.log("Coze对话查看插件：策略2找到客户信息tab，点击切换");
              el.click();
              setTimeout(resolve, 600);
              return;
            }
          }
        }
      }
      
      // 策略3: 如果找不到且当前不是客户信息tab，则尝试通过tabpanel查找
      if (!customerTab) {
        // 查找当前显示的tabpanel对应的tab
        const visiblePanel = document.querySelector('[role="tabpanel"]:not([aria-hidden="true"])');
        if (visiblePanel) {
          const panelId = visiblePanel.id;
          if (panelId) {
            const linkedTab = document.querySelector(`[role="tab"][aria-controls="${panelId}"], [role="tab"][href="#${panelId}"]`);
            if (linkedTab) {
              const tabText = (linkedTab.textContent?.trim() || linkedTab.innerText?.trim() || '').replace(/\s+/g, ' ');
              // 如果当前不是客户信息tab，查找客户信息tab
              if (!tabText.includes('客户信息')) {
                const allTabs = document.querySelectorAll('[role="tab"]');
                for (const t of allTabs) {
                  const tText = (t.textContent?.trim() || t.innerText?.trim() || '').replace(/\s+/g, ' ');
                  if (tText.includes('客户信息')) {
                    console.log("Coze对话查看插件：策略3找到客户信息tab，点击切换");
                    t.click();
                    setTimeout(resolve, 600);
                    return;
                  }
                }
              }
            }
          }
        }
      }
      
      console.log("Coze对话查看插件：未找到客户信息tab");
      resolve();
    }, 300); // 初始延迟
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
      
      // 添加"AI聊天记录"按钮
      injectAIChatButton(descriptionTextarea);
      
      resolve(descriptionTextarea);
    }, 800); // 等待DOM渲染
  });
}

// ========== 3.1 添加AI聊天记录按钮 ==========
function injectAIChatButton(descriptionTextarea) {
  // 检查按钮是否已存在
  if (document.getElementById("coze-ai-chat-btn")) {
    return;
  }
  
  if (!descriptionTextarea || !descriptionTextarea.value) return;
  
  // 检查是否为有效的Base64 JSON数据
  let channelData;
  try {
    const decoded = base64Decode(descriptionTextarea.value);
    channelData = JSON.parse(decoded);
    // 检查是否包含必要的字段
    if (!channelData.conversation_id) {
      console.log("Coze对话查看插件：描述字段数据无效（无conversation_id）");
      return;
    }
  } catch (e) {
    console.log("Coze对话查看插件：描述字段不是有效的Base64 JSON");
    return;
  }
  
  // 找到描述字段的容器
  const container = descriptionTextarea.closest('tr, .ant-form-item, .form-item, .field-container, div');
  if (!container) return;
  
  // 创建按钮
  const btn = document.createElement("button");
  btn.id = "coze-ai-chat-btn";
  btn.innerText = "📋 AI聊天记录";
  btn.style.cssText = `
    margin-left: 10px;
    padding: 4px 12px;
    background: #1890ff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  `;
  
  // 点击事件
  btn.onclick = async () => {
    console.log("Coze对话查看插件：点击了AI聊天记录按钮");
    
    const textboxValue = descriptionTextarea.value;
    if (!textboxValue || !textboxValue.trim()) {
      alert("未找到描述字段数据");
      return;
    }
    
    // 解析数据
    let channelData;
    try {
      const decoded = base64Decode(textboxValue);
      console.log("Coze对话查看插件：解码后的字符串=", decoded);
      channelData = JSON.parse(decoded);
      console.log("Coze对话查看插件：解析后的channelData=", channelData);
    } catch (e) {
      console.error("Coze对话查看插件：解析失败", e);
      alert("解析描述字段失败");
      return;
    }
    
    const { conversation_id, user_id, chat_id, botId } = channelData;
    
    if (!conversation_id) {
      alert("未找到conversation_id");
      return;
    }
    
    console.log("Coze对话查看插件：提取的conversation_id=", conversation_id);
    console.log("Coze对话查看插件：提取的user_id=", user_id);
    console.log("Coze对话查看插件：提取的chat_id=", chat_id);
    console.log("Coze对话查看插件：提取的botId=", botId);
    
    // 加载聊天记录
    await loadCozeChat(conversation_id, chat_id, user_id);
  };
  
  // 插入按钮
  const parent = descriptionTextarea.parentElement;
  if (parent) {
    parent.style.display = 'flex';
    parent.style.alignItems = 'center';
    parent.appendChild(btn);
  }
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

    // 拉取成功，检查是否有消息
    console.log("Coze消息列表:", responseData.data);
    
    const messages = responseData.data || [];
    
    // 如果没有消息，不显示悬浮窗
    if (messages.length === 0) {
      console.log("Coze对话查看插件：没有消息记录，隐藏窗口");
      return;
    }
    
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

// ========== 7. 监听左侧会话列表点击 ==========
let lastInitTime = 0;
const INIT_INTERVAL = 2000; // 2秒内不重复执行

function setupConversationListener() {
  // 监听整个文档的点击事件
  document.addEventListener('click', (e) => {
    const now = Date.now();
    const target = e.target;
    
    // 检查是否在左侧会话列表区域
    // 通过检查点击元素是否在特定的容器内来判断
    let clickedInConversationArea = false;
    
    // 方法1: 检查点击的元素是否在带有cursor:pointer的元素内（会话列表项的特征）
    let element = target;
    let depth = 0;
    while (element && depth < 15) {
      if (element.nodeType === 1) {
        const style = element.getAttribute?.('style') || '';
        const className = element.className || '';
        
        // 检查是否有cursor:pointer（会话列表项通常有这个属性）
        if (style.includes('cursor') && style.includes('pointer')) {
          // 进一步检查是否在左侧面板区域 - 向上查找更多层级
          let parent = element;
          let foundLeftPanel = false;
          for (let i = 0; i < 12; i++) {
            if (!parent) break;
            const pClass = parent.className || '';
            const pId = parent.id || '';
            if (typeof pClass === 'string') {
              if (pClass.includes('left') || pClass.includes('panel') || 
                  pClass.includes('list') || pClass.includes('sidebar') ||
                  pClass.includes('conversation') || pClass.includes('item') ||
                  pClass.includes('content') || pClass.includes('main')) {
                foundLeftPanel = true;
                break;
              }
            }
            // 也检查id
            if (typeof pId === 'string' && pId.length > 0) {
              if (pId.includes('left') || pId.includes('panel') || 
                  pId.includes('list') || pId.includes('sidebar') ||
                  pId.includes('conversation')) {
                foundLeftPanel = true;
                break;
              }
            }
            parent = parent.parentElement;
          }
          if (foundLeftPanel) {
            clickedInConversationArea = true;
            console.log("Coze对话查看插件：检测到左侧会话列表点击 (cursor:pointer)");
            break;
          }
        }
        
        // 方法2: 检查class名称
        if (typeof className === 'string' && className.length > 0) {
          if (className.includes('list-item') || 
              className.includes('conversation') ||
              className.includes('List') ||
              className.includes('item') ||
              className.includes('sidebar') ||
              className.includes('left')) {
            clickedInConversationArea = true;
            console.log("Coze对话查看插件：检测到左侧会话列表点击 (class匹配):", className);
            break;
          }
        }
      }
      element = element.parentElement;
      depth++;
    }
    
    // 方法3: 检查是否点击了tab按钮（我的/留言/同事/排队）
    if (!clickedInConversationArea) {
      const tabButton = target.closest?.('button');
      if (tabButton) {
        const tabText = tabButton.textContent?.trim() || '';
        if (['我的', '留言', '同事', '排队'].includes(tabText)) {
          clickedInConversationArea = true;
          console.log("Coze对话查看插件：检测到tab切换:", tabText);
        }
      }
    }
    
    // 方法4: 检查是否点击了当前/历史/回访切换
    if (!clickedInConversationArea) {
      const currentHistoryBtn = target.closest?.('[class*="current"], [class*="history"], [class*="visit"]');
      if (currentHistoryBtn) {
        clickedInConversationArea = true;
        console.log("Coze对话查看插件：检测到当前/历史/回访切换");
      }
    }
    
    // 方法5: 如果以上都没匹配，但点击了会话列表中的具体项（通过位置判断）
    // 检查点击的元素是否在tablist上方（左侧面板）
    if (!clickedInConversationArea) {
      const tabList = document.querySelector('[role="tablist"]');
      if (tabList) {
        const rect = tabList.getBoundingClientRect();
        // 如果点击位置在tablist左边，说明是左侧面板
        if (target !== tabList && e.clientX < rect.left && e.clientY > rect.top) {
          clickedInConversationArea = true;
          console.log("Coze对话查看插件：检测到左侧会话列表点击 (位置判断)");
        }
      }
    }
    
    if (clickedInConversationArea) {
      // 2秒内不重复执行
      if (now - lastInitTime < INIT_INTERVAL) {
        console.log("Coze对话查看插件：距离上次执行不足2秒，跳过");
        return;
      }
      
      lastInitTime = now;
      
      // 防抖：延迟执行，等待页面切换完成
      clearTimeout(window.cozeReinitTimer);
      window.cozeReinitTimer = setTimeout(() => {
        console.log("Coze对话查看插件：开始重新初始化...");
        init();
      }, 1200);
    }
  });
  
  console.log("Coze对话查看插件：已设置会话列表点击监听");
}

// ========== 8. 监听页面变化（MutationObserver）============
function setupObserver() {
  // 监听页面变化，当会话列表更新时自动触发
  const observer = new MutationObserver((mutations) => {
    let shouldReinit = false;
    
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          // 检查是否添加了会话列表项
          if (node.nodeType === 1) {
            const isConversationItem = node.classList?.contains('ant-list-item') || 
              node.classList?.contains('conversation-item') ||
              node.querySelector?.('.ant-list-item, .conversation-item');
            
            if (isConversationItem) {
              console.log("Coze对话查看插件：检测到会话列表变化");
              shouldReinit = true;
              break;
            }
          }
        }
      }
      
      if (shouldReinit) break;
    }
    
    if (shouldReinit) {
      const now = Date.now();
      // 2秒防抖
      if (now - lastInitTime > 2000) {
        clearTimeout(window.cozeObserverTimer);
        window.cozeObserverTimer = setTimeout(() => {
          init();
        }, 500);
      }
    }
  });
  
  // 观察整个文档区域
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log("Coze对话查看插件：已设置MutationObserver监听");
}

// ========== 9. 启动 ==========
// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      init();
      setupObserver();
      setupConversationListener();
    }, 1500);
  });
} else {
  setTimeout(() => {
    init();
    setupObserver();
    setupConversationListener();
  }, 1500);
}

// 额外的窗口加载完成事件
window.addEventListener('load', () => {
  setTimeout(() => {
    init();
    setupConversationListener();
  }, 2000);
});
