// 常量定义
const CONSTANTS = {
  PROTECTED_POLICY: 'disable_non_proxied_udp',
  DEFAULT_POLICY: 'default',
  ERROR_DISPLAY_TIME: 3000,
  DEBOUNCE_DELAY: 300,
  STATUS: {
    ENABLED: {
      TEXT: 'WebRTC 功能已开启',
      DESC: '您的IP地址可能会泄漏',
      ICON: '../assets/icons/warning.svg'
    },
    DISABLED: {
      TEXT: 'WebRTC 功能已关闭',
      DESC: '您的IP地址已受到保护',
      ICON: '../assets/icons/safe.svg'
    }
  }
};

// 工具函数 - 防抖
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 检查 WebRTC 隐私保护状态
async function checkWebRTCProtection() {
  try {
    const result = await chrome.privacy.network.webRTCIPHandlingPolicy.get({});
    const isProtected = result.value === CONSTANTS.PROTECTED_POLICY;
    updateUI(isProtected);
    return isProtected;
  } catch (error) {
    handleError('检查保护状态时发生错误', error);
    return false;
  }
}

// 更新界面显示
function updateUI(isProtected) {
  const statusIcon = document.getElementById('status-icon');
  const statusText = document.getElementById('status-text');
  const statusDesc = document.getElementById('status-desc');
  const toggle = document.getElementById('protectionToggle');

  if (!statusIcon || !statusText || !statusDesc || !toggle) {
    console.error('UI 元素未找到');
    return;
  }

  const status = isProtected ? CONSTANTS.STATUS.DISABLED : CONSTANTS.STATUS.ENABLED;
  statusText.textContent = status.TEXT;
  statusDesc.textContent = status.DESC;
  statusIcon.src = status.ICON;
  toggle.checked = isProtected;

  // 更新状态样式
  const statusItem = statusDesc.closest('.status-item');
  if (statusItem) {
    if (isProtected) {
      statusItem.classList.remove('warning');
      statusItem.classList.add('success');
    } else {
      statusItem.classList.add('warning');
      statusItem.classList.remove('success');
    }
  }
}

// 错误处理
function handleError(message, error) {
  console.error(`${message}:`, error);
  showError(message);
}

// 显示错误信息
function showError(message) {
  const errorDiv = document.getElementById('error-message') || createErrorElement();
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  
  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, CONSTANTS.ERROR_DISPLAY_TIME);
}

// 创建错误信息元素
function createErrorElement() {
  const errorDiv = document.createElement('div');
  errorDiv.id = 'error-message';
  errorDiv.className = 'error-message';
  document.body.appendChild(errorDiv);
  return errorDiv;
}

// 切换 WebRTC 保护状态
const toggleProtection = debounce(async function(enable) {
  try {
    await chrome.privacy.network.webRTCIPHandlingPolicy.set({
      value: enable ? CONSTANTS.PROTECTED_POLICY : CONSTANTS.DEFAULT_POLICY
    });
    updateUI(enable);
  } catch (error) {
    handleError('更改保护设置时发生错误', error);
    const toggle = document.getElementById('protectionToggle');
    if (toggle) toggle.checked = !enable;
  }
}, CONSTANTS.DEBOUNCE_DELAY);

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  await checkWebRTCProtection();
  
  // 设置开关监听器
  const toggle = document.getElementById('protectionToggle');
  if (toggle) {
    toggle.addEventListener('change', (e) => toggleProtection(e.target.checked));
  }
}); 