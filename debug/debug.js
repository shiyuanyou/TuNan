document.addEventListener('DOMContentLoaded', function() {
  const keyNameInput = document.getElementById('keyName');
  const apiKeyInput = document.getElementById('apiKey');
  const saveKeyBtn = document.getElementById('saveKey');
  const promptTemplate = document.getElementById('promptTemplate');
  const savePromptBtn = document.getElementById('savePrompt');
  const debugLog = document.getElementById('debugLog');
  const savedKeysList = document.getElementById('savedKeys');
  const clearLogBtn = document.getElementById('clearLog');

  // 加载默认 prompt 模板
  chrome.storage.local.get(['promptTemplate'], function(result) {
    if (result.promptTemplate) {
      promptTemplate.value = result.promptTemplate;
    } else {
      const defaultPrompt = `分析这个目标: {goal}\n请提供：\n1. 目标可行性分析\n2. 实现步骤建议\n3. 潜在风险提示`;
      promptTemplate.value = defaultPrompt;
      chrome.storage.local.set({ promptTemplate: defaultPrompt });
    }
  });

  // 保存 Prompt 模板
  savePromptBtn.addEventListener('click', function() {
    const template = promptTemplate.value;
    chrome.storage.local.set({ promptTemplate: template }, function() {
      logDebug('Prompt 模板已保存');
    });
  });

  // 加载已保存的 API Keys
  function loadSavedKeys() {
    chrome.storage.local.get(['apiKeys'], function(result) {
      const keys = result.apiKeys || {};
      savedKeysList.innerHTML = '';
      Object.entries(keys).forEach(([name, key]) => {
        const li = document.createElement('li');
        li.innerHTML = `
          <span>${name}</span>
          <div>
            <button class="copy-key" data-key="${key}">复制</button>
            <button class="delete-key" data-name="${name}">删除</button>
          </div>
        `;
        savedKeysList.appendChild(li);
      });
      
      // 添加事件监听
      document.querySelectorAll('.copy-key').forEach(btn => {
        btn.addEventListener('click', function() {
          const key = this.getAttribute('data-key');
          navigator.clipboard.writeText(key).then(() => {
            logDebug('API Key 已复制到剪贴板');
          });
        });
      });
      
      document.querySelectorAll('.delete-key').forEach(btn => {
        btn.addEventListener('click', function() {
          const name = this.getAttribute('data-name');
          deleteApiKey(name);
        });
      });
    });
  }

  // 删除 API Key
  function deleteApiKey(name) {
    chrome.storage.local.get(['apiKeys'], function(result) {
      const keys = result.apiKeys || {};
      delete keys[name];
      chrome.storage.local.set({ apiKeys: keys }, function() {
        loadSavedKeys();
        logDebug(`已删除 API Key: ${name}`);
      });
    });
  }

  // 保存 API Key
  saveKeyBtn.addEventListener('click', function() {
    const keyName = keyNameInput.value.trim();
    const apiKey = apiKeyInput.value.trim();
    
    if (!keyName || !apiKey) {
      alert('请输入 API Key 名称和值');
      return;
    }
    
    chrome.storage.local.get(['apiKeys'], function(result) {
      const keys = result.apiKeys || {};
      keys[keyName] = apiKey;
      chrome.storage.local.set({ apiKeys: keys }, function() {
        keyNameInput.value = '';
        apiKeyInput.value = '';
        loadSavedKeys();
        logDebug(`已保存 API Key: ${keyName}`);
      });
    });
  });

  // 清除日志
  clearLogBtn.addEventListener('click', function() {
    debugLog.innerHTML = '';
    logDebug('日志已清除');
  });

  // 调试日志函数
  function logDebug(message) {
    const time = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.textContent = `[${time}] ${message}`;
    debugLog.appendChild(logEntry);
    debugLog.scrollTop = debugLog.scrollHeight;
  }

  // 初始化加载
  loadSavedKeys();
  logDebug('调试面板已加载');
}); 