const { OpenAI } = require('openai');

class OpenAIService {
    constructor() {
        this.client = null;
    }

    initialize(apiKey) {
        this.client = new OpenAI({
            baseURL: 'https://api.deepseek.com',
            apiKey: apiKey,
            dangerouslyAllowBrowser: true
        });
    }

    async analyzeGoal(goal, motivation) {
        if (!this.client) {
            throw new Error('OpenAI client not initialized');
        }

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
    "tasks": ["任务1", "任务2", ...],
    "simpleToHard": ["最简单的任务", "第二简单的任务", ...],
    "impactOrder": ["影响最大的任务", "影响第二大的任务", ...],
    "coordinates": [
        {"task": "任务1", "difficulty": 0.3, "impact": 0.8},
        {"task": "任务2", "difficulty": 0.5, "impact": 0.6}
    ]
}`;

        try {
            const completion = await this.client.chat.completions.create({
                messages: [
                    { role: "system", content: "你是一个目标拆解专家，帮助用户分析和拆解他们的目标。" },
                    { role: "user", content: prompt }
                ],
                model: "deepseek-chat",
                temperature: 0.7,
                max_tokens: 2000
            });

            return JSON.parse(completion.choices[0].message.content);
        } catch (error) {
            console.error('OpenAI API Error:', error);
            throw new Error('AI 分析失败: ' + (error.response?.data?.error?.message || error.message));
        }
    }
}

module.exports = new OpenAIService(); 