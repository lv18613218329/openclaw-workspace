// 弹出界面脚本

document.addEventListener('DOMContentLoaded', async () => {
  const enableToggle = document.getElementById('enableToggle');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const videoStatus = document.getElementById('videoStatus');
  const nextBtnStatus = document.getElementById('nextBtnStatus');
  const remainingTime = document.getElementById('remainingTime');
  const debugBtn = document.getElementById('debugBtn');
  const debugPanel = document.getElementById('debugPanel');
  const debugOutput = document.getElementById('debugOutput');
  const listBtnsBtn = document.getElementById('listBtnsBtn');
  const listCoursesBtn = document.getElementById('listCoursesBtn');
  const testNextBtn = document.getElementById('testNextBtn');
  
  // 获取当前标签页
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // 检查是否在目标网站
  const isTargetSite = tab.url?.includes('cdyineng.weijiangshi.cn');
  
  if (!isTargetSite) {
    statusText.textContent = '非目标网站';
    statusDot.classList.remove('active');
    statusDot.style.background = '#ff9800';
    videoStatus.textContent = '请访问微讲师平台';
    return;
  }
  
  // 更新状态
  async function updateStatus() {
    try {
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const video = document.querySelector('video');
          const plugin = window.autoNextVideo;
          
          return {
            hasVideo: !!video,
            videoDuration: video?.duration || 0,
            videoCurrentTime: video?.currentTime || 0,
            videoPaused: video?.paused ?? true,
            videoEnded: video?.ended || false,
            hasNextBtn: !!plugin?.findNextButton?.(),
            hasNextCourse: !!plugin?.findNextCourse?.()
          };
        }
      });
      
      const status = result[0].result;
      
      // 视频状态
      if (status.hasVideo) {
        if (status.videoEnded) {
          videoStatus.textContent = '已结束';
          videoStatus.style.color = '#f44336';
        } else if (status.videoPaused) {
          videoStatus.textContent = '已暂停';
          videoStatus.style.color = '#ff9800';
        } else {
          videoStatus.textContent = '播放中';
          videoStatus.style.color = '#4CAF50';
        }
        
        // 剩余时间
        const remaining = status.videoDuration - status.videoCurrentTime;
        const mins = Math.floor(remaining / 60);
        const secs = Math.floor(remaining % 60);
        remainingTime.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
      } else {
        videoStatus.textContent = '未检测到视频';
        videoStatus.style.color = '#999';
        remainingTime.textContent = '--:--';
      }
      
      // 下一集按钮状态
      if (status.hasNextBtn) {
        nextBtnStatus.textContent = '已找到';
        nextBtnStatus.style.color = '#4CAF50';
      } else if (status.hasNextCourse) {
        nextBtnStatus.textContent = '有下一课程';
        nextBtnStatus.style.color = '#ff9800';
      } else {
        nextBtnStatus.textContent = '未找到';
        nextBtnStatus.style.color = '#999';
      }
      
    } catch (e) {
      console.error('获取状态失败:', e);
      videoStatus.textContent = '获取失败';
    }
  }
  
  // 切换启用状态
  enableToggle.addEventListener('change', async () => {
    const enabled = enableToggle.checked;
    statusText.textContent = enabled ? '插件运行中' : '已禁用';
    statusDot.classList.toggle('active', enabled);
    
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (enabled) => {
        if (window.autoNextVideo) {
          window.autoNextVideo.config.debug = enabled;
        }
        console.log('[自动下一集]', enabled ? '已启用' : '已禁用');
      },
      args: [enabled]
    });
  });
  
  // 调试模式
  debugBtn.addEventListener('click', () => {
    debugPanel.classList.toggle('show');
    debugBtn.textContent = debugPanel.classList.contains('show') ? '🔍 隐藏调试' : '🔍 调试模式';
  });
  
  // 列出所有按钮
  listBtnsBtn.addEventListener('click', async () => {
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const buttons = document.querySelectorAll('button, [role="button"], a, [onclick], [class*="btn"], [class*="button"]');
        const list = [];
        buttons.forEach((btn, i) => {
          const text = btn.textContent?.trim().slice(0, 30);
          const cls = btn.className?.slice(0, 50);
          list.push(`[${i}] ${text || '(空)'} | ${cls || '(无class)'}`);
        });
        return list.join('\n');
      }
    });
    debugOutput.textContent = '所有按钮:\n' + result[0].result;
  });
  
  // 列出课程列表
  listCoursesBtn.addEventListener('click', async () => {
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // 尝试多种可能的选择器
        const selectors = [
          '.course-item', '.chapter-item', '.lesson-item',
          '[class*="lesson"]', '[class*="chapter"]', '[class*="course"]',
          '.list-item', '.item', 'li'
        ];
        
        let items = [];
        for (const sel of selectors) {
          const found = document.querySelectorAll(sel);
          if (found.length > items.length) {
            items = found;
          }
        }
        
        const list = [];
        items.forEach((item, i) => {
          const isActive = item.classList.contains('active') || 
                         item.classList.contains('current') ||
                         item.classList.contains('playing') ||
                         item.querySelector('.active, .current, .playing');
          const text = item.textContent?.trim().slice(0, 40);
          list.push(`${isActive ? '▶ ' : '  '}[${i}] ${text || '(空)'}`);
        });
        
        return `找到 ${items.length} 个项目:\n` + list.join('\n');
      }
    });
    debugOutput.textContent = result[0].result;
  });
  
  // 测试下一集跳转
  testNextBtn.addEventListener('click', async () => {
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        if (window.autoNextVideo) {
          const success = window.autoNextVideo.goToNext();
          return success ? '跳转成功！' : '未找到下一集按钮';
        }
        return '插件未加载';
      }
    });
    debugOutput.textContent = '测试结果: ' + result[0].result;
  });
  
  // 初始化
  updateStatus();
  
  // 定期更新状态
  setInterval(updateStatus, 1000);
});