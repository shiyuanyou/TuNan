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
      chrome.storage.local.get(['todos'], function(result) {
        const todos = result.todos || [];
        const newTodo = {
          id: Date.now(),
          text: todoText,
          completed: false
        };
        todos.push(newTodo);
        chrome.storage.local.set({ todos: todos }, function() {
          newTodoInput.value = '';
          loadTodos();
        });
      });
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
          <span>${todo.text}</span>
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

// OpenAI API 调用函数
async function callOpenAI(prompt) {
  const apiKey = await new Promise(resolve => {
    chrome.storage.local.get(['apiKey'], result => resolve(result.apiKey));
  });

  if (!apiKey) {
    throw new Error('请先设置 OpenAI API Key');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "user",
        content: prompt
      }]
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
} 