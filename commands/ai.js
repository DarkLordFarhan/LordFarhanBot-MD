'use strict';

const axios = require('axios');
require('dotenv').config();

const GROQ_URL =
    'https://api.groq.com/openai/v1/chat/completions';

const MODEL =
    process.env.GROQ_MODEL ||
    'openai/gpt-oss-120b';

const conversations = new Map();

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
    return (
        text
            .trim()
            .split(/\s+/)[0] ||
        ''
    )
        .replace(/^[.!#]/, '')
        .toLowerCase();
}

function getQuestion(text) {
    return text
        .trim()
        .replace(/^[.!#][^\s]+\s*/i, '')
        .trim();
}

function getUserId(message, chatId) {
    return (
        message?.key?.participant ||
        message?.key?.remoteJid ||
        chatId
    );
}

function clearMemory(userId) {
    for (const key of conversations.keys()) {
        if (key.startsWith(`${userId}:`)) {
            conversations.delete(key);
        }
    }
}

async function askAI(userId, question) {

    if (!process.env.GROQ_API_KEY) {
        throw new Error(
            'GROQ_API_KEY is not configured'
        );
    }

    const memoryKey =
        `${userId}:groq`;

    let history =
        conversations.get(memoryKey) || [];

    history.push({
        role: 'user',
        content: question
    });

    // Keep conversations small and stable
    history = history.slice(-10);

    const response = await axios.post(
        GROQ_URL,
        {
            model: MODEL,

            messages: [
                {
                    role: 'system',
                    content:
                        'You are Lord Farhan MD AI, a friendly ' +
                        'general-purpose WhatsApp AI assistant. ' +
                        'Answer questions naturally and accurately. ' +
                        'Help with education, general knowledge, ' +
                        'coding, mathematics, writing, translation, ' +
                        'explanations, ideas and everyday questions. ' +
                        'Be conversational and helpful. ' +
                        'Do not claim to be ChatGPT or Gemini.'
                },
                ...history
            ],

            temperature: 0.7,
            max_tokens: 4096
        },

        {
            headers: {
                Authorization:
                    `Bearer ${process.env.GROQ_API_KEY}`,

                'Content-Type':
                    'application/json'
            },

            timeout: 90000
        }
    );

    const answer =
        response.data
            ?.choices
            ?. [0]
            ?.message
            ?.content
            ?.trim();

    if (!answer) {
        throw new Error(
            'AI returned an empty response'
        );
    }

    history.push({
        role: 'assistant',
        content: answer
    });

    conversations.set(
        memoryKey,
        history.slice(-10)
    );

    return answer;
}

function menu() {
    return `
╭━━━〔 🤖 LORD FARHAN AI 〕━━━╮

🧠 *GENERAL AI*

• .ai <question>
• .ask <question>
• .chat <question>

🚀 *GROQ AI*

• .gpt <question>
• .groq <question>

🧹 *AI MEMORY*

• .aireset

📌 *Example*

.ai explain photosynthesis
.ai who discovered electricity?
.ai write me a love message
.ai help me with JavaScript

╰━━━━━━━━━━━━━━━━━━━━╯
`;
}

async function aiCommand(
    sock,
    chatId,
    message
) {

    const text =
        getText(message);

    const command =
        getCommand(text);

    // AI menu
    if (
        command === 'aimenu'
    ) {

        await sock.sendMessage(
            chatId,
            {
                text: menu()
            },
            {
                quoted: message
            }
        );

        return true;
    }

    // Clear AI memory
    if (
        command === 'aireset'
    ) {

        clearMemory(
            getUserId(
                message,
                chatId
            )
        );

        await sock.sendMessage(
            chatId,
            {
                text:
                    '🧹 *AI memory cleared successfully.*'
            },
            {
                quoted: message
            }
        );

        return true;
    }

    // Only these commands belong to the new AI
    const allowed = [
        'ai',
        'ask',
        'chat',
        'gpt',
        'groq'
    ];

    if (
        !allowed.includes(command)
    ) {
        return false;
    }

    const question =
        getQuestion(text);

    if (!question) {

        await sock.sendMessage(
            chatId,
            {
                text:
                    '🤖 *LORD FARHAN AI*\n\n' +
                    'Ask me anything.\n\n' +
                    'Example:\n' +
                    '.ai explain photosynthesis'
            },
            {
                quoted: message
            }
        );

        return true;
    }

    try {

        const userId =
            getUserId(
                message,
                chatId
            );

        await sock.sendMessage(
            chatId,
            {
                text:
                    '🤖 Thinking...'
            },
            {
                quoted: message
            }
        );

        const answer =
            await askAI(
                userId,
                question
            );

        await sock.sendMessage(
            chatId,
            {
                text:
                    `🤖 *LORD FARHAN AI*\n\n${answer}`
            },
            {
                quoted: message
            }
        );

        return true;

    } catch (error) {

        console.error(
            '❌ GROQ AI ERROR:',
            error.response?.data ||
            error.message
        );

        await sock.sendMessage(
            chatId,
            {
                text:
                    '❌ *AI failed to respond.*\n\n' +
                    'Please try again.'
            },
            {
                quoted: message
            }
        );

        return true;
    }
}

module.exports = aiCommand;
