document.addEventListener('DOMContentLoaded', () => {
    const keyNameInput = document.getElementById('keyName');
    const apiKeyInput = document.getElementById('apiKey');
    const saveButton = document.getElementById('save');
    const keysListDiv = document.getElementById('keysList');
    const messageDiv = document.getElementById('message');

    // 加载所有保存的 API Keys
    loadApiKeys();

    // 保存新的 API Key
    saveButton.addEventListener('click', () => {
        const keyName = keyNameInput.value.trim();
        const apiKey = apiKeyInput.value.trim();
        
        if (!keyName || !apiKey) {
            showMessage('请输入 Key 名称和值', 'error');
            return;
        }

        chrome.storage.local.get(['apiKeys', 'activeKey'], (result) => {
            const apiKeys = result.apiKeys || {};
            
            // 检查名称是否已存在
            if (apiKeys[keyName]) {
                showMessage('该名称已存在', 'error');
                return;
            }

            // 保存新的 key
            apiKeys[keyName] = apiKey;
            
            // 如果是第一个 key，设置为活动 key
            const activeKey = result.activeKey || keyName;

            chrome.storage.local.set({ 
                apiKeys,
                activeKey
            }, () => {
                showMessage('API Key 已保存', 'success');
                keyNameInput.value = '';
                apiKeyInput.value = '';
                loadApiKeys();
            });
        });
    });

    function loadApiKeys() {
        chrome.storage.local.get(['apiKeys', 'activeKey'], (result) => {
            const apiKeys = result.apiKeys || {};
            const activeKey = result.activeKey;
            
            keysListDiv.innerHTML = '';
            
            Object.entries(apiKeys).forEach(([name, key]) => {
                const keyItem = document.createElement('div');
                keyItem.className = `key-item ${name === activeKey ? 'active-key' : ''}`;
                
                const maskedKey = `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
                
                keyItem.innerHTML = `
                    <div class="key-info">
                        <div class="key-name">
                            ${name}
                            ${name === activeKey ? '<span class="active-badge">当前使用</span>' : ''}
                        </div>
                        <div class="key-value">${maskedKey}</div>
                    </div>
                    <div class="key-actions">
                        <button class="use-key" data-name="${name}">
                            ${name === activeKey ? '正在使用' : '使用此Key'}
                        </button>
                        <button class="delete-key" data-name="${name}">删除</button>
                    </div>
                `;
                
                keysListDiv.appendChild(keyItem);
            });

            // 添加事件监听
            document.querySelectorAll('.use-key').forEach(button => {
                button.addEventListener('click', (e) => {
                    const keyName = e.target.dataset.name;
                    setActiveKey(keyName);
                });
            });

            document.querySelectorAll('.delete-key').forEach(button => {
                button.addEventListener('click', (e) => {
                    const keyName = e.target.dataset.name;
                    deleteKey(keyName);
                });
            });
        });
    }

    function setActiveKey(keyName) {
        chrome.storage.local.set({ activeKey: keyName }, () => {
            showMessage(`已切换到 ${keyName}`, 'success');
            loadApiKeys();
        });
    }

    function deleteKey(keyName) {
        chrome.storage.local.get(['apiKeys', 'activeKey'], (result) => {
            const apiKeys = result.apiKeys || {};
            const activeKey = result.activeKey;

            delete apiKeys[keyName];
            
            // 如果删除的是当前活动的 key，重置活动 key
            const newActiveKey = keyName === activeKey 
                ? Object.keys(apiKeys)[0] || null
                : activeKey;

            chrome.storage.local.set({ 
                apiKeys,
                activeKey: newActiveKey
            }, () => {
                showMessage(`已删除 ${keyName}`, 'success');
                loadApiKeys();
            });
        });
    }

    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
    }
}); 