const openaiService = require('../services/openaiService');

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
        
        // 设置链接
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

    async loadApiKey() {
        const result = await chrome.storage.local.get(['apiKeys', 'activeKey']);
        const apiKeys = result.apiKeys || {};
        const activeKey = result.activeKey;

        if (!activeKey || !apiKeys[activeKey]) {
            const settingsUrl = chrome.runtime.getURL('options/options.html');
            alert(`请先设置并选择要使用的DeepSeek API Key\n\n点击确定打开设置页面`);
            chrome.tabs.create({ url: settingsUrl });
            throw new Error('API Key not found');
        }

        openaiService.initialize(apiKeys[activeKey]);
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
                
                // 显示加载状态
                this.step3.innerHTML += '<div id="loading">分析中...</div>';
                
                const results = await openaiService.analyzeGoal(
                    this.goalInput.value,
                    this.motivationInput.value
                );
                
                // 移除加载状态
                document.getElementById('loading')?.remove();
                
                this.displayResults(results);
                this.drawCoordinateSystem(results.coordinates);
            } catch (error) {
                this.step2.classList.add('active');
                this.step3.classList.remove('active');
                document.getElementById('loading')?.remove();
                alert(error.message);
                console.error('Analysis failed:', error);
            }
        }
    }

    // ... 其余方法保持不变 ...
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new GoalAnalyzer();
}); 