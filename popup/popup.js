import { OpenAI } from 'openai';

class GoalAnalyzer {
    constructor() {
        this.initializeElements();
        this.addEventListeners();
        this.loadApiKey();
    }

    initializeElements() {
        // 步骤元素
        this.step1 = document.getElementById('step1');
        this.step2 = document.getElementById('step2');
        this.step3 = document.getElementById('step3');
        
        // 按钮
        this.submitGoalBtn = document.getElementById('submitGoal');
        this.submitMotivationBtn = document.getElementById('submitMotivation');
        
        // 输入框
        this.goalInput = document.getElementById('goalInput');
        this.motivationInput = document.getElementById('motivationInput');
        
        // 结果展示区域
        this.taskItems = document.getElementById('taskItems');
        this.simpleToDifficult = document.getElementById('simpleToDifficult');
        this.impactOrder = document.getElementById('impactOrder');
        this.canvas = document.getElementById('taskCanvas');
        
        // 添加设置链接
        this.settingsLink = document.getElementById('settingsLink');
        this.settingsLink.addEventListener('click', () => {
            const settingsUrl = chrome.runtime.getURL('options/options.html');
            chrome.tabs.create({ url: settingsUrl });
        });
    }

    addEventListeners() {
        this.submitGoalBtn.addEventListener('click', () => this.handleGoalSubmit());
        this.submitMotivationBtn.addEventListener('click', () => this.handleMotivationSubmit());
    }

    handleGoalSubmit() {
        if (this.goalInput.value.trim()) {
            this.step1.classList.remove('active');
            this.step2.classList.add('active');
        }
    }

    async handleMotivationSubmit() {
        if (this.motivationInput.value.trim()) {
            try {
                this.step2.classList.remove('active');
                this.step3.classList.add('active');
                await this.analyzeGoal();
            } catch (error) {
                this.step2.classList.add('active');
                this.step3.classList.remove('active');
                console.error('Analysis failed:', error);
            }
        }
    }

    async loadApiKey() {
        const result = await chrome.storage.local.get(['apiKeys', 'activeKey']);
        const apiKeys = result.apiKeys || {};
        const activeKey = result.activeKey;

        if (!activeKey || !apiKeys[activeKey]) {
            const settingsUrl = chrome.runtime.getURL('options/options.html');
            alert(`请先设置并选择要使用的 DeepSeek API Key\n\n点击确定打开设置页面`);
            chrome.tabs.create({ url: settingsUrl });
            throw new Error('API Key not found');
        }

        this.apiKey = apiKeys[activeKey];
    }

    async callDeepSeek(prompt) {
        if (!this.apiKey) {
            throw new Error('请先在设置中配置 DeepSeek API Key');
        }

        try {
            const openai = new OpenAI({
                baseURL: 'https://api.deepseek.com/v1',
                apiKey: this.apiKey,
                defaultHeaders: {
                    'Content-Type': 'application/json'
                }
            });

            const completion = await openai.chat.completions.create({
                messages: [
                    { role: "system", content: "你是一个目标拆解专家，帮助用户分析和拆解他们的目标。" },
                    { role: "user", content: prompt }
                ],
                model: "deepseek-chat",
                temperature: 0.7,
                max_tokens: 2000
            });

            return completion.choices[0].message.content;
        } catch (error) {
            console.error('DeepSeek API Error:', error);
            if (error.response) {
                throw new Error(`AI 分析失败: ${error.response.data.error.message}`);
            } else {
                throw new Error('AI 分析失败: ' + error.message);
            }
        }
    }

    async analyzeGoal() {
        const goal = this.goalInput.value;
        const motivation = this.motivationInput.value;
        
        try {
            // 显示加载状态
            this.step3.innerHTML += '<div id="loading">分析中...</div>';
            
            const prompt = `
用户目标：${goal}
实现目标的原动力：${motivation}

请帮我：
1. 出实现这个目标可以做的15项具体事情
2. 将这15项事情按照从简单到难排序
3. 将这15项事情按照影响程度从大到小排序
4. 在坐标系中标注这些事项的位置（X轴是难度，Y轴是影响程度）

请按照以下格式返回：
{
    "tasks": [
        "任务1",
        "任务2",
        // ...其他任务
    ],
    "simpleToHard": [
        "最简单的任务",
        "第二简单的任务",
        // ...由易到难排序
    ],
    "impactOrder": [
        "影响最大的任务",
        "影响第二大的任务",
        // ...按影响程度排序
    ],
    "coordinates": [
        {"task": "任务1", "difficulty": 0.3, "impact": 0.8},
        {"task": "任务2", "difficulty": 0.5, "impact": 0.6},
        // ...其他任务的坐标
    ]
}`;

            const response = await this.callDeepSeek(prompt);
            
            // 移除加载状态
            document.getElementById('loading')?.remove();
            
            const results = JSON.parse(response);
            this.displayResults(results);
            this.drawCoordinateSystem(results.coordinates);
        } catch (error) {
            // 移除加载状态
            document.getElementById('loading')?.remove();
            alert(error.message);
            throw error; // 让上层错误处理来处理页面状态
        }
    }

    displayResults(results) {
        // 显示15项任务
        this.taskItems.innerHTML = results.tasks
            .map((task, index) => `<div class="task-item">${index + 1}. ${task}</div>`)
            .join('');

        // 显示简单到难的排序
        this.simpleToDifficult.innerHTML = results.simpleToHard
            .map((task, index) => `<li>${task}</li>`)
            .join('');

        // 显示影响程度排序
        this.impactOrder.innerHTML = results.impactOrder
            .map((task, index) => `<li>${task}</li>`)
            .join('');
    }

    drawCoordinateSystem(coordinates) {
        const ctx = this.canvas.getContext('2d');
        const width = this.canvas.width;
        const height = this.canvas.height;
        const padding = 40;

        // 清空画布
        ctx.clearRect(0, 0, width, height);

        // 绘制坐标轴
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding); // X轴
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(padding, padding); // Y轴
        ctx.stroke();

        // 添加轴标签
        ctx.font = '12px Arial';
        ctx.fillText('难度', width - padding, height - padding/2);
        ctx.fillText('影响程度', padding/2, padding/2);

        // 绘制数据点
        coordinates.forEach(({task, difficulty, impact}) => {
            const x = padding + difficulty * (width - 2 * padding);
            const y = height - (padding + impact * (height - 2 * padding));

            // 绘制点
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();

            // 添加任务标签
            ctx.fillText(task, x + 5, y - 5);
        });
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new GoalAnalyzer();
}); 