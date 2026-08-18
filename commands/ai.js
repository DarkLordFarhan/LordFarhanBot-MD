'use strict';

const axios = require('axios');
require('dotenv').config();

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const MODELS = {
    gpt: 'openai/gpt-oss-120b',
    gptoss120: 'openai/gpt-oss-120b',
    gptoss20: 'openai/gpt-oss-20b',
    gemini: 'qwen/qwen3.6-27b',
    qwen: 'qwen/qwen3.6-27b',
    compound: 'groq/compound',
    compoundmini: 'groq/compound-mini',
    llama2: 'llama-2-7b'
};

const memory = new Map();

function getText(message) {
    return (
        message?.message?.conversation ||
        message?.message?.extendedTextMessage?.text ||
        message?.message?.imageMessage?.caption ||
        message?.message?.videoMessage?.caption ||
        ''
    ).trim();
}

function getCommand(text) {
    return (text.split(/\s+/)[0] || '')
        .replace(/^\./, '')
        .toLowerCase();
}

function getQuestion(text) {
    return text.replace(/^\.[^\s]+\s*/i, '').trim();
}

function getUserId(message, chatId) {
    return message?.key?.participant ||
           message?.key?.remoteJid ||
           chatId;
}

function getModel(command) {
    if (
        command === 'gpt' ||
        command === 'gpt4' ||
        command === 'gpt4o' ||
        command === 'gptoss120'
    ) {
        return MODELS.gpt;
    }

    if (command === 'gptoss20') {
        return MODELS.gptoss20;
    }

    if (
        command === 'gemini' ||
        command === 'qwen'
    ) {
        return MODELS.qwen;
    }

    if (command === 'compound') {
        return MODELS.compound;
    }

    if (command === 'compoundmini') {
        return MODELS.compoundmini;
    }

    if (command === 'llama2') {
        return MODELS.llama2;
    }

    return null;
}

async function askGroq(model, userId, question) {

    if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is missing');
    }

    const memoryKey = `${userId}:${model}`;

    let history = memory.get(memoryKey) || [];

    history.push({
        role: 'user',
        content: question
    });

    history = history.slice(-12);

    const response = await axios.post(
        GROQ_URL,
        {
            model,
            messages: [
                {
                    role: 'system',
                    content:
                        "You are Lord Farhan MD's friendly general AI assistant. " +
                        "Answer naturally, accurately and clearly. " +
                        "Help with general knowledge, education, coding, writing, " +
                        "translations, explanations, ideas and everyday questions. " +
                        "Be conversational and helpful. " +
                        "Use previous messages as context when appropriate. " +
                        "Do not claim to be ChatGPT or Gemini."
                },
                ...history
            ],
            temperature: 0.7,
            max_tokens: 4096
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 90000
        }
    );

    const answer =
        response.data?.choices?.[0]?.message?.content?.trim();

    if (!answer) {
        throw new Error('Groq returned an empty response');
    }

    history.push({
        role: 'assistant',
        content: answer
    });

    memory.set(
        memoryKey,
        history.slice(-12)
    );

    return answer;
}

function aiMenu() {
    return `🤖 *LORD FARHAN AI*

🧠 *General AI*
• .ai <question>
• .ask <question>

🚀 *GPT-OSS*
• .gpt <question>
• .gptoss120 <question>
• .gptoss20 <question>

🧩 *Qwen*
• .qwen <question>

🔄 *Gemini alias*
• .gemini <question>

⚡ *Groq Compound*
• .compound <question>
• .compoundmini <question>

🦙 *Llama*
• .llama2 <question>

💡 Example:
.ai explain photosynthesis simply`;
}

async function aiCommand(sock, chatId, message) {

    const text = getText(message);
    const command = getCommand(text);

    if (
        command === 'aimenu' ||
        command === 'ailist'
    ) {
        await sock.sendMessage(
            chatId,
            { text: aiMenu() },
            { quoted: message }
        );

        return true;
    }

    const model = getModel(command);

    if (!model) {
        return false;
    }

    const question = getQuestion(text);

    if (!question) {
        await sock.sendMessage(
            chatId,
            {
                text:
                    '🤖 *LORD FARHAN AI*\n\n' +
                    'Ask me anything.\n\n' +
                    'Example:\n' +
                    '.ai explain diabetes'
            },
            { quoted: message }
        );

        return true;
    }

    try {

        await sock.sendMessage(
            chatId,
            { text: '🤖 Thinking...' },
            { quoted: message }
        );

        const userId = getUserId(
            message,
            chatId
        );

        let answer;

        try {

            answer = await askGroq(
                model,
                userId,
                question
            );

        } catch (primaryError) {

            console.error(
                `Groq model ${model} failed:`,
                primaryError.response?.data ||
                primaryError.message
            );

            // GPT-OSS 120B is the model we already
            // confirmed works with your key.
            if (model !== MODELS.gpt) {

                answer = await askGroq(
                    MODELS.gpt,
                    userId,
                    question
                );

            } else {
                throw primaryError;
            }
        }

        await sock.sendMessage(
            chatId,
            { text: answer },
            { quoted: message }
        );

        return true;

    } catch (error) {

        console.error(
            '❌ Groq AI error:',
            error.response?.data ||
            error.message
        );

        await sock.sendMessage(
            chatId,
            {
                text:
                    '❌ *AI failed to respond.*\n\n' +
                    'Please try `.ai` again.'
            },
            { quoted: message }
        );

        return true;
    }
}

module.exports = aiCommand;
