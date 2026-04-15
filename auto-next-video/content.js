// 视频自动下一集插件 - 内容脚本
// 适用于微讲师云管理平台 / 依能内训平台

(function() {
  'use strict';

  // ========== 配置 ==========
  const CONFIG = {
    // 视频选择器
    videoSelector: 'video',
    
    // 播放按钮选择器 (Video.js 大播放按钮)
    playButtonSelector: '.vjs-big-play-button',
    
    // 视频列表项选择器 (依能平台的实际结构)
    sessionItemSelector: '.session-item',
    
    // 检测间隔
    checkInterval: 1500,
    
    // 播放结束后等待时间（毫秒）
    waitBeforeNext: 2000,
    
    // 跳转后等待播放按钮的时间（毫秒）
    waitBeforePlay: 1500,
    
    // 调试模式
    debug: true
  };

  // ========== 状态管理 ==========
  let currentVideo = null;
  let hasEnded = false;
  let isTransitioning = false;
  let lastVideoSrc = null;

  // ========== 工具函数 ==========
  function log(...args) {
    if (CONFIG.debug) {
      console.log('[自动下一集]', new Date().toLocaleTimeString(), ...args);
    }
  }

  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function findVideo() {
    return document.querySelector(CONFIG.videoSelector);
  }

  function findPlayButton() {
    return document.querySelector(CONFIG.playButtonSelector);
  }

  // 获取所有视频项
  function getAllSessionItems() {
    return Array.from(document.querySelectorAll(CONFIG.sessionItemSelector));
  }

  // 获取当前播放的视频项索引
  function getCurrentIndex() {
    const items = getAllSessionItems();
    for (let i = 0; i < items.length; i++) {
      if (items[i].classList.contains('active')) {
        return i;
      }
    }
    return -1;
  }

  // 获取下一个视频项
  function getNextItem() {
    const items = getAllSessionItems();
    const currentIndex = getCurrentIndex();
    
    log('视频总数:', items.length, '当前索引:', currentIndex);
    
    if (currentIndex === -1) {
      log('未找到当前播放项');
      return null;
    }
    
    if (currentIndex >= items.length - 1) {
      log('已经是最后一个视频了');
      return null;
    }
    
    return items[currentIndex + 1];
  }

  // ========== 自动播放功能 ==========
  function tryAutoPlay() {
    log('尝试自动播放...');
    
    // 查找播放按钮
    const playButton = findPlayButton();
    
    if (playButton && playButton.offsetParent !== null) {
      // 按钮可见，点击播放
      log('找到播放按钮，点击播放');
      playButton.click();
      return true;
    }
    
    // 尝试直接播放视频
    const video = findVideo();
    if (video && video.paused) {
      log('尝试直接播放视频');
      video.play().catch(e => {
        log('自动播放被阻止，等待用户交互');
      });
      return true;
    }
    
    log('未找到播放按钮或视频');
    return false;
  }

  // 监控新视频并自动播放
  function monitorNewVideo() {
    const video = findVideo();
    if (!video) return;
    
    const currentSrc = video.src || video.currentSrc;
    
    // 检测视频源是否变化（新视频加载）
    if (currentSrc && currentSrc !== lastVideoSrc) {
      log('检测到新视频:', currentSrc.slice(-50));
      lastVideoSrc = currentSrc;
      hasEnded = false;
      isTransitioning = false;
      
      // 等待视频加载后尝试自动播放
      setTimeout(() => {
        tryAutoPlay();
      }, CONFIG.waitBeforePlay);
      
      // 设置视频监听器
      setupVideoListeners(video);
    }
  }

  // ========== 跳转功能 ==========
  function goToNext() {
    log('准备跳转到下一集...');
    
    const nextItem = getNextItem();
    if (!nextItem) {
      log('未找到下一个视频');
      return false;
    }
    
    const nextName = nextItem.querySelector('.session-name')?.textContent?.trim().slice(0, 40);
    log('点击跳转:', nextName);
    
    // 点击下一个视频的 session-name 元素
    const clickTarget = nextItem.querySelector('.session-name') || nextItem;
    clickTarget.click();
    
    return true;
  }

  // ========== 视频监听 ==========
  function setupVideoListeners(video) {
    if (video === currentVideo) return;
    
    if (currentVideo) {
      currentVideo.removeEventListener('ended', onVideoEnded);
      currentVideo.removeEventListener('timeupdate', onTimeUpdate);
      currentVideo.removeEventListener('play', onVideoPlay);
      currentVideo.removeEventListener('pause', onVideoPause);
    }
    
    currentVideo = video;
    
    log('设置视频监听器, 时长:', video.duration ? formatTime(video.duration) : '加载中...');
    
    video.addEventListener('ended', onVideoEnded);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('play', onVideoPlay);
    video.addEventListener('pause', onVideoPause);
  }

  function onVideoEnded(e) {
    if (hasEnded || isTransitioning) return;
    hasEnded = true;
    
    log('🎉 视频播放结束！');
    
    // 等待一段时间后自动跳转
    setTimeout(() => {
      isTransitioning = true;
      const success = goToNext();
      if (success) {
        log('✅ 已跳转到下一集，等待自动播放...');
      } else {
        log('❌ 没有下一个视频了');
        isTransitioning = false;
      }
    }, CONFIG.waitBeforeNext);
  }

  function onTimeUpdate(e) {
    const video = e.target;
    if (!video.duration) return;
    
    const remaining = video.duration - video.currentTime;
    
    // 最后 5 秒时提示
    if (remaining > 0 && remaining < 5 && !hasEnded) {
      log(`⏱️ 剩余 ${formatTime(remaining)} 秒`);
    }
  }

  function onVideoPlay(e) {
    log('▶️ 视频开始播放');
    hasEnded = false;
    isTransitioning = false;
  }

  function onVideoPause(e) {
    log('⏸️ 视频已暂停');
  }

  // ========== 页面监控 ==========
  let checkTimer = null;

  function monitorPage() {
    checkTimer = setInterval(() => {
      const video = findVideo();
      
      // 检测新视频
      monitorNewVideo();
      
      // 设置视频监听器
      if (video && video !== currentVideo) {
        setupVideoListeners(video);
      }
      
      // 检查视频是否已经结束（备用检测）
      if (video && video.ended && !hasEnded && !isTransitioning) {
        log('检测到视频已结束');
        onVideoEnded({ target: video });
      }
    }, CONFIG.checkInterval);
  }

  // 使用 MutationObserver 监控 DOM 变化
  function observeDOM() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          // 检测播放按钮
          const playButton = findPlayButton();
          if (playButton && isTransitioning) {
            log('检测到播放按钮出现');
            setTimeout(() => tryAutoPlay(), 500);
          }
          
          // 检测视频元素
          const video = findVideo();
          if (video) {
            monitorNewVideo();
          }
        }
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    log('DOM 监控已启动');
  }

  // ========== 调试接口 ==========
  window.autoNextVideo = {
    config: CONFIG,
    findVideo,
    findPlayButton,
    getAllSessionItems,
    getCurrentIndex,
    getNextItem,
    goToNext,
    tryAutoPlay,
    
    // 调试：显示当前状态
    status: () => {
      const video = findVideo();
      const items = getAllSessionItems();
      const currentIndex = getCurrentIndex();
      const playButton = findPlayButton();
      
      const status = {
        hasVideo: !!video,
        videoSrc: video?.src?.slice(-50) || video?.currentSrc?.slice(-50),
        videoState: video ? {
          duration: video.duration,
          currentTime: video.currentTime,
          remaining: video.duration - video.currentTime,
          paused: video.paused,
          ended: video.ended
        } : null,
        hasPlayButton: !!playButton,
        playButtonVisible: playButton ? playButton.offsetParent !== null : false,
        totalVideos: items.length,
        currentIndex: currentIndex,
        currentVideo: currentIndex >= 0 ? items[currentIndex]?.querySelector('.session-name')?.textContent?.trim().slice(0, 40) : null,
        nextVideo: currentIndex >= 0 && currentIndex < items.length - 1 ? items[currentIndex + 1]?.querySelector('.session-name')?.textContent?.trim().slice(0, 40) : null
      };
      
      log('=== 当前状态 ===');
      log('视频元素:', status.hasVideo ? '✅' : '❌');
      log('播放按钮:', status.hasPlayButton ? (status.playButtonVisible ? '✅ 可见' : '⚠️ 隐藏') : '❌');
      if (status.videoState) {
        log('视频时长:', formatTime(status.videoState.duration));
        log('当前进度:', formatTime(status.videoState.currentTime));
        log('剩余时间:', formatTime(status.videoState.remaining));
        log('播放状态:', status.videoState.paused ? '⏸️ 暂停' : '▶️ 播放中');
      }
      log('视频总数:', status.totalVideos);
      log('当前索引:', status.currentIndex);
      log('当前视频:', status.currentVideo);
      log('下一个视频:', status.nextVideo);
      
      return status;
    },
    
    // 调试：列出所有视频
    listVideos: () => {
      const items = getAllSessionItems();
      const currentIndex = getCurrentIndex();
      
      log('=== 视频列表 ===');
      items.forEach((item, i) => {
        const name = item.querySelector('.session-name')?.textContent?.trim().slice(0, 40);
        const marker = i === currentIndex ? '▶️ ' : '   ';
        log(`${marker}[${i}] ${name}`);
      });
      
      return items.length;
    },
    
    // 手动测试跳转
    test: () => {
      log('测试跳转到下一个视频...');
      return goToNext();
    },
    
    // 手动测试自动播放
    testPlay: () => {
      log('测试自动播放...');
      return tryAutoPlay();
    },
    
    // 设置配置
    setConfig: (key, value) => {
      CONFIG[key] = value;
      log('配置已更新:', key, '=', value);
    }
  };

  // ========== 初始化 ==========
  function init() {
    log('🚀 插件已加载 v1.2');
    log('页面 URL:', window.location.href);
    
    // 记录初始视频源
    const video = findVideo();
    if (video) {
      lastVideoSrc = video.src || video.currentSrc;
      log('初始视频源:', lastVideoSrc?.slice(-50));
    }
    
    // 等待页面加载
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        observeDOM();
        monitorPage();
      });
    } else {
      observeDOM();
      monitorPage();
    }
    
    // 初始检查
    setTimeout(() => {
      const video = findVideo();
      if (video) {
        log('✅ 找到视频元素');
        setupVideoListeners(video);
      } else {
        log('⏳ 等待视频元素加载...');
      }
      
      window.autoNextVideo.status();
    }, 2000);
  }

  // 监听 URL 变化 (SPA 页面)
  let lastUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      log('URL 已变化:', window.location.href);
      hasEnded = false;
      isTransitioning = false;
      
      // 重新检查视频
      setTimeout(() => {
        monitorNewVideo();
      }, 1000);
    }
  }, 1000);

  init();
})();