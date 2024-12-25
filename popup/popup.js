const { OpenAI } = require('openai');

document.addEventListener('DOMContentLoaded', function() {
  // 获取元素
  const apiKeyInput = document.getElementById('apiKey');
  const saveKeyBtn = document.getElementById('saveKey');
  const newTodoInput = document.getElementById('newTodo');
  const addTodoBtn = document.getElementById('addTodo');
  const todoList = document.getElementById('todoList');

  // 加载保存的 API Key
  chrome.storage.local.get(['apiKey'], function(result) {
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    }
  });

  // 加载保存的待办事项
  loadTodos();

  // 保存 API Key
  saveKeyBtn.addEventListener('click', function() {
    const apiKey = apiKeyInput.value;
    chrome.storage.local.set({ apiKey: apiKey }, function() {
      alert('API Key 已保存！');
    });
  });

  // 添加新待办事项
  addTodoBtn.addEventListener('click', function() {
    addTodo();
  });

  newTodoInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addTodo();
    }
  });

  function addTodo() {
    const todoText = newTodoInput.value.trim();
    if (todoText) {
      try {
        // 调用 OpenAI 进行分析
        const aiAnalysis = await callOpenAI(`分析这个目标: ${todoText}`);
        
        chrome.storage.local.get(['todos'], function(result) {
          const todos = result.todos || [];
          const newTodo = {
            id: Date.now(),
            text: todoText,
            aiAnalysis: aiAnalysis, // 保存 AI 分析结果
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

// 修改 OpenAI API 调用函数
async function callOpenAI(prompt) {
  const apiKey = await new Promise(resolve => {
    chrome.storage.local.get(['apiKey'], result => resolve(result.apiKey));
  });

  if (!apiKey) {
    throw new Error('请先设置 OpenAI API Key');
  }

  const openai = new OpenAI({
    apiKey: apiKey,
  });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "user",
        content: prompt
      }],
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API 调用错误:', error);
    throw error;
  }
} 