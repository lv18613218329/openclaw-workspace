# Coze Chat SDK 转人工功能及对话记录可视化（浏览器插件）后续实施需求文档

# 一、文档概述

## 1.1 文档目的

明确现有已接入Coze Chat SDK的网页，后续需完成的"转人工客服"功能、浏览器插件开发（对话记录拉取+可视化）的全部实施细节、要求、流程及验收标准，确保开发人员可按文档直接落地，无歧义、无遗漏。

## 1.2 前置条件

- 现有网页已成功接入 Coze Chat SDK，可正常实现用户与Coze智能体的文字、图片、文件等消息类型的对话交互。

- 已获取 Coze 相关核心信息：botId（机器人ID）、Coze Token（接口调用凭证）。

- 已确定人工客服系统网页地址（后续转人工跳转目标地址）。

- 开发环境：Chrome/Edge浏览器（用于插件开发及测试）、前端开发工具（如VS Code）。

## 1.3 核心目标

1. 在现有网页的Coze聊天界面中，实现"机器人无法回答时提示转人工"功能，点击转人工可跳转至人工客服页面，并携带 conversation_id（对话ID）和 user_id（用户ID）参数。

2. 开发浏览器插件（Chrome/Edge通用），实现"检测人工客服页面URL中的 conversation_id 和 user_id → 调用Coze接口拉取完整对话记录 → 悬浮窗可视化展示"功能，支持文字、图片、文件的正常渲染及操作。

3. 确保整个流程闭环：用户转人工 → 客服页面接收参数 → 插件自动拉取并展示对话（含图片/文件），不侵入现有客服系统，不泄露Coze Token，保障数据安全及操作便捷性。

# 二、需求范围

## 2.1 现有网页改造（核心需求）

基于已接入Coze Chat SDK的现有网页，新增/修改以下功能，不改动原有聊天交互逻辑，仅新增转人工相关功能。

## 2.2 浏览器插件开发（核心需求）

开发标准Chrome Manifest V3浏览器插件，实现对话记录拉取、悬浮窗可视化、图片预览、文件下载等功能，适配现有人工客服系统页面。

## 2.3 测试验证（必备需求）

完成功能测试、兼容性测试、异常场景处理测试，确保转人工流程、插件功能正常可用，无bug。

## 2.4 交付物（必备需求）

提供改造后的网页代码、浏览器插件完整源码包、插件安装说明、测试报告。

# 三、详细功能需求（分模块）

## 模块一：现有网页改造（Coze转人工功能）

### 3.1.1 user_id 生成与传入（必做）

1. 功能描述：在现有网页的Coze SDK初始化代码中，新增user_id的生成逻辑，并传入SDK，确保每个用户（游客/登录用户）有唯一标识。

2. 具体要求：


    - 若网页支持用户登录：user_id 采用平台现有用户唯一标识（如用户ID、手机号、账号名），确保同一用户多次访问时，user_id 一致（便于追溯对话）。

    - 若网页为游客模式（无需登录）：自动生成临时user_id，格式为"user_+随机字符串"（如 user_abc123def456），确保每次访问生成唯一ID，刷新页面后重新生成（视为新游客）。

    - user_id 需全局存储（如全局变量），便于后续转人工时调用。

    - 初始化SDK时，必须将生成的user_id传入 userId 参数，不可遗漏（否则SDK无法正常工作，无法获取conversation_id）。

3. 代码示例（需嵌入现有网页Coze SDK初始化代码中）：
        `// 示例1：游客模式（自动生成临时user_id）
let user_id = "user_" + Math.random().toString(36).slice(2, 12); // 生成10位随机字符串，确保唯一

// 示例2：登录用户模式（获取平台现有用户ID）
// let user_id = 登录用户的唯一标识; // 替换为实际获取逻辑（如从cookie、localStorage中获取）

// 现有Coze SDK初始化代码（修改userId参数）
const cozeClient = new CozeWebSDK.ChatClient("#coze-chat-container", {
  botId: "你的botId", // 已存在，无需修改
  userId: user_id, // 新增：传入生成的user_id
  // 其他原有配置（如i18n、样式等），保持不变
});`

### 3.1.2 conversation_id 获取（必做）

1. 功能描述：监听Coze SDK的conversation事件，获取系统自动生成的conversation_id（对话唯一标识），并全局存储，用于转人工时携带。

2. 具体要求：


    - 新增全局变量 conversation_id，初始值为null。

    - 添加conversation事件监听，事件触发后，将data.conversationId赋值给全局conversation_id，并在控制台打印日志（便于测试排查）。

    - 确保事件监听代码在Coze SDK初始化之后执行，避免监听失败。

    - conversation_id 仅在用户发送第一条消息后触发生成（新对话创建），刷新页面后，新对话会生成新的conversation_id，无需手动干预。

3. 代码示例（嵌入现有网页Coze SDK代码之后）：
        `// 全局存储conversation_id
let conversation_id = null;

// 监听Coze SDK的conversation事件，获取对话ID
cozeClient.on("conversation", (data) => {
  conversation_id = data.conversationId; // 拿到对话ID并存储
  console.log("当前对话ID：", conversation_id); // 控制台打印，便于测试
  console.log("当前用户ID：", user_id); // 同时打印用户ID，便于核对
});`

### 3.1.3 机器人无法回答判断逻辑（必做）

1. 功能描述：监听Coze智能体的回复消息，判断是否为"无法回答"场景，若满足则显示转人工按钮。

2. 具体要求：


    - 监听Coze SDK的message事件，仅判断角色为"assistant"（智能体）的消息。

    - 定义"无法回答"关键词列表，可灵活扩展，默认包含：无法回答、不知道、无法理解、暂不支持、无法帮你、没有找到、超出能力、不清楚、无法回答，建议咨询对应主题的专业渠道、转人工、转人工客服、请稍后再试（可根据实际Coze智能体话术调整）。

    - 判断逻辑：智能体回复内容中包含任意一个关键词，即视为"无法回答"，触发转人工提示；若回复内容不包含任何关键词，不显示转人工按钮。

    - 避免重复判断：同一轮对话中，若智能体连续回复无法回答，仅显示一次转人工按钮，不重复创建。

3. 代码示例（嵌入现有网页，与conversation事件监听同级）：
        `// 监听Coze消息事件，判断是否无法回答
cozeClient.on("message", (message) => {
  // 仅判断智能体（assistant）的回复
  if (message.role !== "assistant") return;

  // 无法回答关键词列表（可自定义扩展）
  const noAnswerKeywords = [
    "无法回答", "不知道", "无法理解", "暂不支持",
    "无法帮你", "没有找到", "超出能力", "不清楚", 
    "无法回答，建议咨询对应主题的专业渠道", "转人工", "转人工客服", "请稍后再试"
  ];

  // 判断是否包含关键词
  const isNoAnswer = noAnswerKeywords.some(keyword => {
    return message.content?.includes(keyword); // 兼容content为null的情况
  });

  // 若无法回答，显示转人工按钮；否则不显示（若已显示则删除）
  if (isNoAnswer) {
    showTransferHumanButton(); // 显示转人工按钮（后续实现）
  } else {
    removeTransferHumanButton(); // 移除转人工按钮（后续实现）
  }
});

// 辅助函数：移除转人工按钮（避免重复显示）
function removeTransferHumanButton() {
  const btn = document.getElementById("coze-transfer-human-btn");
  if (btn) btn.remove();
}`

### 3.1.4 转人工按钮渲染（必做）

1. 功能描述：当智能体无法回答时，在Coze聊天容器下方（或聊天输入框上方）渲染转人工按钮，样式美观，不影响原有聊天界面。

2. 具体要求：


    - 按钮ID固定为"coze-transfer-human-btn"，便于后续移除和操作。

    - 按钮样式：背景色#007fff，文字色#fff，padding为10px 20px，边框半径6px，鼠标悬浮时指针变为手型，字体大小14px，居中显示在聊天容器下方。

    - 按钮文案："💁‍♀️ 机器人无法解答，点击转人工客服"。

    - 避免重复创建：每次显示按钮前，先判断是否已存在，若存在则不重复创建。

    - 按钮位置：优先插入到Coze聊天容器的下方，若聊天容器有固定父容器，插入到父容器内，确保在聊天界面可见区域。

3. 代码示例（新增showTransferHumanButton函数）：
        `// 显示转人工按钮
function showTransferHumanButton() {
  // 避免重复创建
  if (document.getElementById("coze-transfer-human-btn")) return;

  // 创建按钮元素
  const btn = document.createElement("button");
  btn.id = "coze-transfer-human-btn";
  btn.innerText = "💁‍♀️ 机器人无法解答，点击转人工客服";
  // 按钮样式
  btn.style.cssText = `
    margin: 10px auto;
    display: block;
    padding: 10px 20px;
    background: #007fff;
    color: #fff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
  `;
  // 绑定点击事件（转人工跳转，后续实现）
  btn.onclick = goToHumanService;

  // 插入到Coze聊天容器下方（替换为你的聊天容器ID）
  const chatContainer = document.getElementById("coze-chat-container");
  if (chatContainer) {
    chatContainer.parentNode.insertBefore(btn, chatContainer.nextSibling);
  } else {
    // 若聊天容器未找到，插入到body中（兜底方案）
    document.body.appendChild(btn);
  }
}`

### 3.1.5 转人工跳转逻辑（必做）

1. 功能描述：用户点击转人工按钮后，跳转至指定的人工客服系统网页，并在URL中携带 user_id 和 conversation_id 两个参数，确保插件可检测到。

2. 具体要求：


    - 跳转地址：替换为实际的人工客服系统网页地址（如 https://kefu.yourcompany.com）。

    - 参数拼接：URL格式为"人工客服地址?user_id=xxx&conversation_id=xxx"，参数名严格一致（不可修改大小写）。

    - 异常处理：跳转前判断 conversation_id 是否为null（即用户未发送任何消息就点击转人工），若为null，弹出提示"请先发送一条消息后再转人工"，不执行跳转。

    - 跳转方式：使用新标签页打开（window.open(url, "_blank")），不影响用户原有聊天页面。

3. 代码示例（新增goToHumanService函数）：
        `// 转人工跳转函数
function goToHumanService() {
  // 异常处理：未获取到对话ID（用户未发消息）
  if (!conversation_id) {
    alert("请先发送一条消息后再转人工");
    return;
  }

  // 人工客服系统网页地址（替换为你的实际地址）
  const humanServiceUrl = "https://kefu.yourcompany.com";

  // 拼接URL参数（user_id和conversation_id）
  const targetUrl = new URL(humanServiceUrl);
  targetUrl.searchParams.append("user_id", user_id);
  targetUrl.searchParams.append("conversation_id", conversation_id);

  // 新标签页打开人工客服页面
  window.open(targetUrl.toString(), "_blank");
}`

### 3.1.6 网页改造注意事项（必做）

- 所有新增代码需嵌入现有网页的Coze SDK相关代码中，与原有代码兼容，不改动原有聊天逻辑（如消息发送、接收、样式等）。

- 全局变量（user_id、conversation_id）需避免与网页现有全局变量重名，可在变量名前加前缀（如 coze_user_id、coze_conversation_id）。

- 代码注释：所有新增函数、关键逻辑需添加注释，说明功能、参数含义，便于后续维护。

- 兼容性：确保新增代码兼容主流浏览器（Chrome、Edge、Firefox），无语法错误。

## 模块二：浏览器插件开发（对话记录可视化）

### 3.2.1 插件基础配置（必做）

1. 插件规范：采用Chrome Manifest V3标准（主流浏览器兼容，安全性更高）。

2. 插件结构：固定以下文件夹结构，文件名称不可修改，确保插件正常加载。
        `coze-service-plugin/  // 插件根文件夹（名称可自定义）
 ├─ manifest.json       // 插件核心配置文件（必选）
 ├─ content.js          // 核心逻辑文件（监听URL、拉取数据、渲染UI）
 ├─ style.css           // 悬浮窗及组件样式文件（必选）
 └─ popup.html          // 插件点击图标显示的页面（可选，仅用于展示插件信息）`

3. manifest.json 配置要求（需替换占位符）：
        `{
  "manifest_version": 3,
  "name": "Coze对话查看插件",
  "version": "1.0.0",
  "description": "自动检测人工客服页面URL中的对话ID，拉取Coze完整对话记录，悬浮窗可视化展示（支持文字、图片、文件）",
  "permissions": ["activeTab", "storage"], // 必要权限：激活当前标签页、本地存储（可选）
  "host_permissions": ["https://api.coze.cn/*"], // 允许插件调用Coze接口
  "content_scripts": [
    {
      "matches": ["https://kefu.yourcompany.com/*"], // 替换为你的人工客服系统域名（仅在该域名下生效）
      "js": ["content.js"], // 注入页面的核心逻辑
      "css": ["style.css"], // 注入页面的样式
      "run_at": "document_end" // 页面加载完成后注入，避免DOM未渲染完成
    }
  ],
  "icons": { // 可选，插件图标（建议添加，便于识别）
    "16": "icon16.png",
    "48": "icon48.png",
    "128": "icon128.png"
  }
}`

4. 注意事项：


    - matches 配置：必须准确填写人工客服系统的域名（如 https://kefu.yourcompany.com/*），确保插件仅在人工客服页面生效，不影响其他网页。

    - host_permissions：必须包含 https://api.coze.cn/*，否则插件无法调用Coze接口拉取对话记录。

    - icons：可选，若不需要图标，可删除该字段；若添加，需准备16x16、48x48、128x128尺寸的图片，放入插件根文件夹。

### 3.2.2 插件核心逻辑（content.js，必做）

1. 核心功能：


    - 检测当前人工客服页面URL中的 user_id 和 conversation_id 参数。

    - 调用Coze接口（GET https://api.coze.cn/v1/chat/messages），传入 conversation_id 和 botId，拉取完整对话记录。

    - 创建悬浮窗，将拉取到的对话记录（文字、图片、文件）可视化渲染。

    - 支持图片预览、文件下载功能。

    - 异常处理：参数缺失、接口调用失败、无对话记录等场景，给出明确提示。

2. 具体要求：
        （1）参数获取（2）Coze接口调用（3）悬浮窗渲染（4）对话记录渲染（核心）（5）辅助功能

    - 通过 URLSearchParams 读取当前页面URL中的 user_id 和 conversation_id 参数。

    - 若未检测到 conversation_id，控制台打印日志（未检测到Coze对话ID），不执行后续操作，不影响人工客服页面正常使用。

    - 若检测到 conversation_id，立即执行接口调用逻辑，拉取对话记录。

    - 接口地址：GET https://api.coze.cn/v1/chat/messages

    - 请求参数：conversation_id（从URL获取）、bot_id（你的Coze机器人ID，硬编码在插件中，不暴露）。

    - 请求头：Authorization: Bearer 你的Coze Token（硬编码在插件中，不暴露在网页中，保障安全）。

    - 接口响应处理：


        - 若响应code=0，说明拉取成功，获取data数组（对话记录），反转数组（最新消息在下方），执行渲染逻辑。

        - 若响应code≠0，弹出提示"对话记录拉取失败：xxx"（xxx为接口返回的msg），控制台打印错误信息，便于排查。

        - 网络异常：捕获fetch请求异常，提示"网络异常，无法拉取对话记录"。

    - 悬浮窗位置：固定在页面右侧（或左侧，可配置），距离顶部20px，距离右侧20px，不遮挡人工客服系统的核心操作区域。

    - 悬浮窗结构：包含头部（显示用户ID、关闭按钮）、聊天主体（渲染对话记录）。

    - 头部要求：背景色#007fff，文字色#fff，左侧显示"用户ID：xxx"，右侧显示关闭按钮（点击可关闭悬浮窗），字体大小14px，padding 12px。

    - 聊天主体要求：背景色#f5f7fa，高度固定为600px，宽度380px，支持垂直滚动（对话过多时），padding 10px。

    - 角色区分：user（用户）消息显示在右侧，背景色#007fff，文字色#fff；assistant（智能体）消息显示在左侧，背景色#fff，边框1px solid #eee。

    - 文字消息：直接渲染文本，自动换行，保留原始格式，边框半径12px，padding 8px 12px，最大宽度70%。

    - 图片消息：渲染图片缩略图，最大宽度100%，边框半径8px，点击图片可放大预览（弹出全屏弹窗）。

    - 文件消息：渲染文件卡片，显示文件名、文件大小（单位KB），提供下载按钮（点击可跳转至文件URL下载），卡片背景色#fff，边框1px solid #eee，padding 6px 10px，边框半径8px。

    - 无对话记录：若拉取到的对话记录为空，在聊天主体中显示"暂无对话记录"，居中显示，文字色#999。

    - 图片预览：点击图片弹出全屏弹窗，显示原图，点击弹窗任意位置关闭预览。

    - 文件下载：下载按钮点击后，新标签页打开文件URL，支持直接下载/预览文件。

    - 悬浮窗关闭：点击头部关闭按钮，悬浮窗彻底移除，不残留DOM元素。

3. content.js 完整代码（需替换占位符）：
        [`下载`](https://www.doubao.cn) `// ========== 插件核心配置（替换为你的实际信息） ==========
const COZE_TOKEN = "你的Coze Token"; // 硬编码在插件中，不暴露
const BOT_ID = "你的Coze botId"; // 硬编码在插件中，不暴露
const FLOAT_POSITION = "right"; // 悬浮窗位置：right（右侧）/ left（左侧），可修改

// ========== 1. 从当前页面URL获取参数 ==========
const currentUrl = new URL(window.location.href);
const conversation_id = currentUrl.searchParams.get("conversation_id");
const user_id = currentUrl.searchParams.get("user_id");

// 若未检测到conversation_id，不执行后续操作
if (!conversation_id) {
  console.log("Coze对话查看插件：未检测到conversation_id，不执行拉取操作");
} else {
  console.log("Coze对话查看插件：检测到对话ID，开始拉取记录");
  // 拉取对话记录并渲染
  loadCozeChat(conversation_id, user_id);
}

// ========== 2. 调用Coze接口拉取对话记录 ==========
async function loadCozeChat(conversationId, userId) {
  try {
    // 接口请求配置
    const response = await fetch(
      `https://api.coze.cn/v1/chat/messages?conversation_id=${conversationId}&bot_id=${BOT_ID}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${COZE_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    const responseData = await response.json();
    // 接口返回异常处理
    if (responseData.code !== 0) {
      throw new Error(responseData.msg || "对话记录拉取失败");
    }

    // 拉取成功，获取对话列表（反转数组，最新消息在下方）
    const chatMessages = responseData.data.reverse();
    // 渲染悬浮窗
    renderFloatWindow(chatMessages, userId);
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
    z-index: 999999; // 确保悬浮窗在最上层，不被遮挡
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `;

  // 2. 悬浮窗头部（用户ID + 关闭按钮）
  const floatHeader = document.createElement("div");
  floatHeader.className = "coze-float-header";
  floatHeader.innerHTML = `
    用户ID：${userId || "未知用户"}关闭
  `;

  // 3. 悬浮窗聊天主体
  const chatBody = document.createElement("div");
  chatBody.className = "coze-chat-body";

  // 4. 渲染对话记录
  if (messages.length === 0) {
    // 无对话记录
    chatBody.innerHTML = '暂无对话记录';
  } else {
    // 渲染每条消息
    messages.forEach(msg => {
      const msgItem = document.createElement("div");
      msgItem.className = `coze-msg coze-msg-${msg.role}`;

      // 根据消息类型渲染不同内容
      if (msg.type === "image" || (msg.content && msg.content.startsWith("http") && /\.(png|jpg|jpeg|gif|webp)/i.test(msg.content))) {
        // 图片消息
        msgItem.innerHTML = ``;
      } else if (msg.type === "file") {
        // 文件消息
        try {
          const fileInfo = JSON.parse(msg.content);
          const fileName = fileInfo.file_name || "未知文件";
          const fileSize = (fileInfo.size / 1024).toFixed(1) + "KB";
          const fileUrl = fileInfo.url || "#";
          msgItem.innerHTML = `
            ${fileName}${fileSize}
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
    previewModal.innerHTML = ``;
    document.body.appendChild(previewModal);
    / 点击弹窗关闭预览
    previewModal.onclick = () => {
      previewModal.remove();
      delete window.previewImage; // 移除全局函数，避免残留
    };
  };
}`

### 3.2.3 插件样式（style.css，必做）

1. 功能：定义悬浮窗、聊天消息、图片、文件等组件的样式，确保界面美观、清晰，与人工客服系统页面风格协调。

2. 具体要求：


    - 悬浮窗头部：背景色#007fff，文字色#fff，flex布局，justify-content: space-between，padding 12px，字体大小14px，font-weight: bold。

    - 关闭按钮：鼠标悬浮时指针变为手型，hover时颜色变浅（#e6f0ff）。

    - 聊天主体：背景色#f5f7fa，flex:1，overflow-y: auto，padding 10px。

    - 消息样式：margin 6px 0，padding 8px 12px，border-radius 12px，max-width 70%，font-size 14px，line-height 1.5。

    - 用户消息：margin-left auto，背景色#007fff，文字色#fff。

    - 智能体消息：margin-right auto，背景色#fff，border 1px solid #eee。

    - 图片消息：max-width 100%，border-radius 8px，cursor pointer，hover时轻微放大（scale: 1.02）。

    - 文件卡片：flex布局，align-items: center，justify-content: space-between，background #fff，border 1px solid #eee，border-radius 8px，padding 6px 10px。

    - 文件名称：font-weight 500，font-size 13px。

    - 文件大小：font-size 12px，color #666。

    - 下载按钮：background #007fff，color #fff，padding 4px 8px，border-radius 4px，font-size 12px，text-decoration none，hover时背景色#0066cc。

    - 无对话记录：text-align center，padding 40px 0，color #999，font-size 14px。

    - 图片预览弹窗：position fixed，top 0，left 0，width 100%，height 100%，background rgba(0,0,0,0.8)，display grid，place-items center，z-index 1000000。

    - 预览图片：max-width 90%，max-height 90vh，border-radius 8px。

3. style.css 完整代码：
        `/* 悬浮窗头部 */
.coze-float-header {
  padding: 12px;
  background: #007fff;
  color: #fff;
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  font-size: 14px;
}

/* 关闭按钮 */
.coze-close-btn {
  cursor: pointer;
  transition: color 0.2s;
}
.coze-close-btn:hover {
  color: #e6f0ff;
}

/* 聊天主体 */
.coze-chat-body {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  background: #f5f7fa;
}

/* 消息容器 */
.coze-msg {
  margin: 6px 0;
  padding: 8px 12px;
  border-radius: 12px;
  max-width: 70%;
  font-size: 14px;
  line-height: 1.5;
}

/* 用户消息（右侧） */
.coze-msg-user {
  background: #007fff;
  color: #fff;
  margin-left: auto;
}

/* 智能体消息（左侧） */
.coze-msg-assistant {
  background: #fff;
  border: 1px solid #eee;
  margin-right: auto;
}

/* 图片消息 */
.coze-msg-img {
  max-width: 100%;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}
.coze-msg-img:hover {
  transform: scale(1.02);
}

/* 文件卡片 */
.coze-file-box {
  background: #fff;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

/* 文件名称 */
.coze-file-name {
  font-weight: 500;
  font-size: 13px;
}

/* 文件大小 */
.coze-file-size {
  font-size: 12px;
  color: #666;
}

/* 下载按钮 */
.coze-file-download {
  padding: 4px 8px;
  background: #007fff;
  color: #fff;
  border-radius: 4px;
  font-size: 12px;
  text-decoration: none;
  transition: background 0.2s;
}
.coze-file-download:hover {
  background: #0066cc;
}

/* 无对话记录 */
.coze-empty-chat {
  text-align: center;
  padding: 40px 0;
  color: #999;
  font-size: 14px;
}

/* 图片预览弹窗 */
#coze-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.8);
  display: grid;
  place-items: center;
  z-index: 1000000;
  cursor: pointer;
}

/* 预览图片 */
.coze-preview-img {
  max-width: 90%;
  max-height: 90vh;
  border-radius: 8px;
}`

### 3.2.4 可选功能（popup.html）

1. 功能：插件点击图标后显示的页面，可用于展示插件版本、使用说明、联系方式等信息，非必需。

2. 代码示例（popup.html）：
        `<!DOCTYPE html>
Coze对话查看插件Coze对话查看插件
    自动拉取Coze对话记录，支持文字、图片、文件展示。



    版本：1.0.0
  `

### 3.2.5 插件开发注意事项（必做）

- Coze Token 和 botId 硬编码在 content.js 中，不暴露在网页中，避免泄露（插件运行在浏览器本地，无法被网页脚本获取）。

- 所有DOM操作需避免影响人工客服系统的原有DOM结构，悬浮窗使用独立ID（coze-float-window），避免ID冲突。

- 图片预览弹窗使用独立ID（coze-preview-modal），关闭后彻底移除DOM元素，避免残留。

- 兼容性：确保插件兼容Chrome 90+、Edge 90+版本（主流最新版本）。

- 日志打印：关键操作（参数获取、接口调用、渲染完成）需在控制台打印日志，便于测试和排查问题。

- 异常处理：覆盖所有可能的异常场景（参数缺失、接口失败、网络异常、文件解析失败、图片加载失败），给出明确提示，不影响人工客服页面正常使用。

## 模块三：测试验证（必做）

### 3.3.1 网页改造测试

1. 测试场景1：用户未登录（游客模式）


    - 打开网页，检查是否自动生成user_id，并传入Coze SDK。

    - 发送第一条消息，检查控制台是否打印 conversation_id 和 user_id。

    - 发送智能体无法回答的问题（如"开发票"），检查是否显示转人工按钮。

    - 点击转人工按钮，检查是否弹出提示（若未发消息）或跳转至人工客服页面，URL是否携带两个参数。

2. 测试场景2：用户已登录（平台用户）


    - 登录平台，检查user_id是否为平台用户唯一标识。

    - 重复场景1的2-4步，验证功能正常。

3. 测试场景3：智能体可回答


    - 发送智能体可回答的问题（如"你好"），检查是否不显示转人工按钮。

4. 测试场景4：重复点击转人工


    - 智能体无法回答后，检查是否只显示一个转人工按钮，不重复创建。

### 3.3.2 插件测试

1. 测试场景1：插件安装


    - 打开Chrome/Edge浏览器，进入扩展程序，开启开发者模式，加载已解压的插件文件夹，检查插件是否成功安装（无报错）。

2. 测试场景2：参数检测与对话拉取


    - 打开人工客服页面（URL携带 user_id 和 conversation_id 参数），检查插件是否自动拉取对话记录。

    - 检查悬浮窗是否正常显示，用户ID是否正确。

3. 测试场景3：不同消息类型渲染


    - 文字消息：检查文字是否正常渲染，角色区分是否正确。

    - 图片消息：检查图片是否正常显示，点击是否可放大预览，预览后是否可关闭。

    - 文件消息：检查文件卡片是否显示文件名、大小，下载按钮是否可正常下载文件。

4. 测试场景4：异常场景


    - URL无conversation_id：检查插件是否不执行拉取操作，不显示悬浮窗，不影响人工客服页面。

    - Coze Token错误：检查是否弹出"拉取失败"提示，控制台打印错误日志。

    - 网络异常：检查是否弹出"网络异常"提示。

    - 无对话记录：检查悬浮窗是否显示"暂无对话记录"。

5. 测试场景5：插件操作


    - 点击悬浮窗关闭按钮，检查悬浮窗是否彻底移除，无DOM残留。

    - 拖动人工客服页面滚动条，检查悬浮窗是否固定在指定位置，不跟随滚动。

### 3.3.3 兼容性测试

1. 浏览器兼容性：测试Chrome 90+、Edge 90+版本，确保功能正常，无样式错乱。

2. 分辨率兼容性：测试不同屏幕分辨率（1920×1080、1366×768），确保悬浮窗位置合理，不遮挡核心内容。

## 模块四：交付物要求（必做）

1. 网页改造交付物：


    - 改造后的完整网页代码（HTML文件，标注新增代码位置）。

    - 网页改造说明文档（说明新增功能、代码修改位置、注意事项）。

2. 插件交付物：


    - 完整插件源码包（包含manifest.json、content.js、style.css、popup.html，若有图标需包含图标文件）。

    - 插件安装说明（详细步骤：如何开启浏览器开发者模式、如何加载插件、如何测试）。

3. 测试交付物：


    - 测试报告（包含测试场景、测试结果、异常情况及处理方案）。

# 四、验收标准（必须全部满足）

## 4.1 网页改造验收

- user_id 生成正常：游客模式自动生成，登录模式使用平台用户ID，可在控制台打印查看。

- conversation_id 获取正常：用户发送第一条消息后，控制台可打印 conversation_id，且不为null。

- 转人工按钮显示正常：智能体无法回答时显示，可回答时不显示，不重复创建。

- 转人工跳转正常：点击按钮后，若未发消息弹出提示；若已发消息，跳转至人工客服页面，URL携带 user_id 和 conversation_id 参数。

- 原有聊天功能正常：改造后，用户与Coze智能体的文字、图片、文件聊天不受影响。

## 4.2 插件验收

- 插件安装正常：Chrome/Edge浏览器可成功加载，无报错。

- 参数检测正常：人工客服页面URL携带 conversation_id 时，插件自动拉取对话记录；无参数时不执行操作。

- 对话渲染正常：文字、图片、文件消息均可正常渲染，角色区分正确。

- 辅助功能正常：图片可放大预览、文件可下载、悬浮窗可关闭。

- 异常处理正常：各种异常场景（参数缺失、接口失败、网络异常）均有提示，不影响人工客服页面使用。

- 安全性：Coze Token 不暴露在网页中，无法被网页脚本获取。

## 4.3 交付物验收

- 交付物齐全：网页代码、插件源码、安装说明、测试报告均完整。

- 代码规范：代码有注释，结构清晰，无语法错误，可直接运行。

- 说明文档清晰：安装说明、改造说明步骤详细，可按说明完成安装和测试。

#
> （注：文档部分内容可能由 AI 生成）