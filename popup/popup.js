const OpenAI = require('openai');

document.addEventListener('DOMContentLoaded', function() {
  // 获取元素
  const apiKeyInput = document.getElementById('apiKey');
  const keyNameInput = document.getElementById('keyName');
  const saveKeyBtn = document.getElementById('saveKey');
  const newTodoInput = document.getElementById('newTodo');
  const addTodoBtn = document.getElementById('addTodo');
  const todoList = document.getElementById('todoList');
  const toggleDebugBtn = document.getElementById('toggleDebug');
  const debugPanel = document.getElementById('debugPanel');
  const promptTemplate = document.getElementById('promptTemplate');
  const savePromptBtn = document.getElementById('savePrompt');
  const debugLog = document.getElementById('debugLog');
  const savedKeysList = document.getElementById('savedKeys');

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

  // 切换调试面板
  toggleDebugBtn.addEventListener('click', function() {
    debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
    if (debugPanel.style.display === 'block') {
      loadSavedKeys();
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
            <button class="use-key" data-name="${name}">使用</button>
            <button class="delete-key" data-name="${name}">删除</button>
          </div>
        `;
        savedKeysList.appendChild(li);
      });
      
      // 添加事件监听
      document.querySelectorAll('.use-key').forEach(btn => {
        btn.addEventListener('click', function() {
          const name = this.getAttribute('data-name');
          useApiKey(name);
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

  // 使用选中的 API Key
  function useApiKey(name) {
    chrome.storage.local.get(['apiKeys'], function(result) {
      const keys = result.apiKeys || {};
      if (keys[name]) {
        keyNameInput.value = name;
        apiKeyInput.value = keys[name];
        logDebug(`已选择 API Key: ${name}`);
      }
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

  // 调试日志函数
  function logDebug(message) {
    const time = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.textContent = `[${time}] ${message}`;
    debugLog.appendChild(logEntry);
    debugLog.scrollTop = debugLog.scrollHeight;
  }

  // 加载保存的 API Key
  chrome.storage.local.get(['apiKey'], function(result) {
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    }
  });

  // 加载保存的待办事项
  loadTodos();

  // 修改保存 API Key 的逻辑
  saveKeyBtn.addEventListener('click', function() {
    const keyName = keyNameInput.value.trim();
    const apiKey = apiKeyInput.value;
    
    if (!keyName) {
      alert('请输入 API Key 名称');
      return;
    }
    
    chrome.storage.local.get(['apiKeys'], function(result) {
      const keys = result.apiKeys || {};
      keys[keyName] = apiKey;
      chrome.storage.local.set({ apiKeys: keys }, function() {
        alert('API Key 已保存！');
        loadSavedKeys();
        logDebug(`已保存 API Key: ${keyName}`);
      });
    });
  });

  // 添加新待办事项
  addTodoBtn.addEventListener('click', async function() {
    await addTodo();
  });

  newTodoInput.addEventListener('keypress', async function(e) {
    if (e.key === 'Enter') {
      await addTodo();
    }
  });

  async function addTodo() {
    const todoText = newTodoInput.value.trim();
    if (todoText) {
      try {
        // 调用 DeepSeek 进行分析
        const aiAnalysis = await callDeepSeek(todoText);
        
        chrome.storage.local.get(['todos'], function(result) {
          const todos = result.todos || [];
          const newTodo = {
            id: Date.now(),
            text: todoText,
            aiAnalysis: aiAnalysis,
            completed: false
          };
          todos.push(newTodo);
          chrome.storage.local.set({ todos: todos }, function() {
            newTodoInput.value = '';
            loadTodos();
          });
        });
      } catch (error) {
        alert('AI 分析失败: ' + error.message);
      }
    }
  }

  function loadTodos() {
    chrome.storage.local.get(['todos'], function(result) {
      const todos = result.todos || [];
      todoList.innerHTML = '';
      todos.forEach(function(todo) {
        const li = document.createElement('li');
        li.className = 'todo-item';
        li.innerHTML = `
          <div>
            <span>${todo.text}</span>
            ${todo.aiAnalysis ? `<p class="ai-analysis">AI 分析: ${todo.aiAnalysis}</p>` : ''}
          </div>
          <span class="delete-btn" data-id="${todo.id}">×</span>
        `;
        todoList.appendChild(li);
      });

      // 添加删除事件监听
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const todoId = parseInt(this.getAttribute('data-id'));
          deleteTodo(todoId);
        });
      });
    });
  }

  function deleteTodo(todoId) {
    chrome.storage.local.get(['todos'], function(result) {
      const todos = result.todos || [];
      const newTodos = todos.filter(todo => todo.id !== todoId);
      chrome.storage.local.set({ todos: newTodos }, function() {
        loadTodos();
      });
    });
  }
});

// DeepSeek API 调用函数
async function callDeepSeek(todoText) {
  const template = await new Promise(resolve => {
    chrome.storage.local.get(['promptTemplate'], result => 
      resolve(result.promptTemplate || '分析这个目标: {goal}')
    );
  });

  const prompt = template.replace('{goal}', todoText);
  logDebug(`发送请求: ${prompt}`);
  
  const apiKey = await new Promise(resolve => {
    chrome.storage.local.get(['apiKey'], result => resolve(result.apiKey));
  });

  if (!apiKey) {
    throw new Error('请先设置 DeepSeek API Key');
  }

  const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: apiKey
  });

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt }
      ],
      model: "deepseek-chat",
    });

    logDebug('收到响应');
    return completion.choices[0].message.content;
  } catch (error) {
    logDebug(`错误: ${error.message}`);
    throw error;
  }
} 