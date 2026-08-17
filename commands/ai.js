const axios = require('axios');
require('dotenv').config();

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/*
 * Models confirmed available from this Groq API key.
 *
 * Audio / guard models are intentionally NOT used as normal chat models.
 */
const MODELS = {
    'gptoss120': 'openai/gpt-oss-120b',
    'gptoss20': 'openai/gpt-oss-20b',
    'qwen': 'qwen/qwen3.6-27b',
    'compound': 'groq/compound',
    'compoundmini': 'groq/compound-mini',
    'llama2': 'llama-2-7b',
};

const ALIASES = {
    ai: 'openai/gpt-oss-120b',
    ask: 'openai/gpt-oss-120b',
    gpt: 'openai/gpt-oss-120b',
    gpt4: 'openai/gpt-oss-120b',
    gpt4o: 'openai/gpt-oss-120b',
    gemini: 'qwen/qwen3.6-27b',

    gptoss120: 'openai/gpt-oss-120b',
    gptoss20: 'openai/gpt-oss-20b',
    qwen: 'qwen/qwen3.6-27b',
    compound: 'groq/compound',
    compoundmini: 'groq/compound-mini',
    llama2: 'llama-2-7b'
};

const memory = new Map();

const SYSTEM_PROMPT =
    'You are a friendly, intelligent general-purpose AI assistant inside a WhatsApp bot. ' +
    'Answer naturally and clearly. Help with education, general knowledge, coding, writing, ' +
    'calculations, explanations, translations, ideas and everyday questions. ' +
    'Be conversational and helpful. When the user asks a follow-up question, use the conversation context. ' +
    'Never pretend to be ChatGPT or Gemini.';

function getUserId(message) {
    return message.key.participant || message.key.remoteJid;
}

function getModelFromCommand(command) {
    return ALIASES[command.toLowerCase()];
}

function trimMemory(history) {
    if (history.length > 12) {
        return history.slice(-12);
    }
    return history;
}

async function askGroq(model, userId, question) {
    if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is missing');
    }

    let history = memory.get(`${userId}:${model}`) || [];

    history.push({
        role: 'user',
        content: question
    });

    history = trimMemory(history);

    const response = await axios.post(
        GROQ_URL,
        {
            model,
            messages: [
                {
                    role: 'system',
                    content: SYSTEM_PROMPT
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

    memory.set(`${userId}:${model}`, trimMemory(history));

    return answer;
}

function menuText() {
    return (
        '🤖 *GROQ AI MODEL MENU*\n\n' +

        '🧠 *General AI*\n' +
        '• `.ai <question>`\n' +
        '• `.ask <question>`\n\n' +

        '🚀 *GPT-OSS*\n' +
        '• `.gptoss120 <question>`\n' +
        '• `.gptoss20 <question>`\n\n' +

        '🧩 *Qwen*\n' +
        '• `.qwen <question>`\n\n' +

        '⚡ *Groq Compound*\n' +
        '• `.compound <question>`\n' +
        '• `.compoundmini <question>`\n\n' +

        '🦙 *Llama*\n' +
        '• `.llama2 <question>`\n\n' +

        '🔄 *Compatibility aliases*\n' +
        '• `.gpt <question>`\n' +
        '• `.gpt4 <question>`\n' +
        '• `.gpt4o <question>`\n' +
        '• `.gemini <question>`\n\n' +

        '💡 *Example*\n' +
        '`.ai explain diabetes simply`'
    );
}

async function execute(sock, message, args) {
    const command =
        (message.body || '')
            .trim()
            .split(/\s+/)[0]
            .replace(/^[.!]/, '')
            .toLowerCase();

    const jid = message.key.remoteJid;

    if (command === 'aimenu') {
        return sock.sendMessage(
            jid,
            { text: menuText() },
            { quoted: message }
        );
    }

    const model = getModelFromCommand(command);

    if (!model) {
        return;
    }

    const question = args.join(' ').trim();

    if (!question) {
        return sock.sendMessage(
            jid,
            {
                text:
                    '🤖 *AI Assistant*\n\n' +
                    'Ask me anything.\n\n' +
                    'Example:\n' +
                    '`.ai explain photosynthesis`'
            },
            { quoted: message }
        );
    }

    try {
        await sock.sendMessage(
            jid,
            { text: '🤖 Thinking...' },
            { quoted: message }
        );

        const userId = getUserId(message);

        let answer;

        try {
            answer = await askGroq(model, userId, question);
        } catch (primaryError) {
            console.error(
                `Primary model ${model} failed:`,
                primaryError.response?.data || primaryError.message
            );

            /*
             * Strong fallback.
             * GPT-OSS 120B is currently supported by Groq and is
             * intended for high-capability reasoning/chat use.
             */
            if (model !== 'openai/gpt-oss-120b') {
                answer = await askGroq(
                    'openai/gpt-oss-120b',
                    userId,
                    question
                );
            } else {
                throw primaryError;
            }
        }

        await sock.sendMessage(
            jid,
            { text: answer },
            { quoted: message }
        );

    } catch (error) {
        console.error(
            'Groq AI error:',
            error.response?.data || error.message
        );

        await sock.sendMessage(
            jid,
            {
                text:
                    '❌ *AI failed to respond.*\n\n' +
                    'The selected model may be temporarily unavailable. ' +
                    'Try `.ai` again.'
            },
            { quoted: message }
        );
    }
}

module.exports = {
    name: 'ai',
    aliases: [
        'ai',
        'ask',
        'gpt',
        'gpt4',
        'gpt4o',
        'gemini',
        'gptoss120',
        'gptoss20',
        'qwen',
        'compound',
        'compoundmini',
        'llama2',
        'aimenu'
    ],
    execute
};
