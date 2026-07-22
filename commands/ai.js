'use strict';
const fetch = require('node-fetch');

const TIMEOUT = 15000;

async function tryFetch(url, timeout = TIMEOUT) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } finally {
        clearTimeout(timer);
    }
}

function extractText(data) {
    if (!data) return null;
    // Handle nested structures
    if (typeof data.result === 'string' && data.result.trim()) return data.result.trim();
    if (typeof data.answer === 'string' && data.answer.trim()) return data.answer.trim();
    if (typeof data.message === 'string' && data.message.trim()) return data.message.trim();
    if (typeof data.response === 'string' && data.response.trim()) return data.response.trim();
    if (typeof data.text === 'string' && data.text.trim()) return data.text.trim();
    if (typeof data.output === 'string' && data.output.trim()) return data.output.trim();
    if (typeof data.content === 'string' && data.content.trim()) return data.content.trim();
    if (typeof data.data === 'string' && data.data.trim()) return data.data.trim();
    // OpenAI-compatible shape
    if (data.choices?.[0]?.message?.content) return data.choices[0].message.content.trim();
    if (data.choices?.[0]?.text) return data.choices[0].text.trim();
    return null;
}

// ── GPT fallback chain ─────────────────────────────────────────────────────────
async function askGPT(query) {
    const q = encodeURIComponent(query);
    const apis = [
        `https://api.giftedtech.my.id/api/ai/gptv4o?apikey=gifted&q=${q}`,
        `https://api.giftedtech.my.id/api/ai/geminiaipro?apikey=gifted&q=${q}`,
        `https://api.ryzendesu.vip/api/ai/chatgpt?text=${q}`,
        `https://vapis.my.id/api/chatgpt?q=${q}`,
        `https://zellapi.autos/ai/chatbot?text=${q}`,
        `https://api.siputzx.my.id/api/ai/chatgpt?content=${q}`,
        `https://api.dreaded.site/api/chatgpt?text=${q}`,
        `https://fastrestapis.fasturl.cloud/ai/gpt-4o?ask=${q}`,
    ];
    for (const url of apis) {
        try {
            const data = await tryFetch(url);
            const text = extractText(data);
            if (text && text.length > 0) return text;
        } catch (_) { /* try next */ }
    }
    throw new Error('All GPT APIs are currently unavailable. Please try again later.');
}

// ── Gemini fallback chain ──────────────────────────────────────────────────────
async function askGemini(query) {
    const q = encodeURIComponent(query);
    const apis = [
        `https://api.giftedtech.my.id/api/ai/geminiaipro?apikey=gifted&q=${q}`,
        `https://api.giftedtech.my.id/api/ai/geminiai?apikey=gifted&q=${q}`,
        `https://vapis.my.id/api/gemini?q=${q}`,
        `https://api.siputzx.my.id/api/ai/gemini-pro?content=${q}`,
        `https://api.ryzendesu.vip/api/ai/gemini?text=${q}`,
        `https://zellapi.autos/ai/chatbot?text=${q}`,
        `https://api.dreaded.site/api/gemini?text=${q}`,
        `https://fastrestapis.fasturl.cloud/ai/gemini?ask=${q}`,
    ];
    for (const url of apis) {
        try {
            const data = await tryFetch(url);
            const text = extractText(data);
            if (text && text.length > 0) return text;
        } catch (_) { /* try next */ }
    }
    throw new Error('All Gemini APIs are currently unavailable. Please try again later.');
}

// ── Main command handler ───────────────────────────────────────────────────────
async function aiCommand(sock, chatId, message) {
    try {
        const text =
            message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() || '';

        const parts = text.split(/\s+/);
        const command = parts[0].toLowerCase();
        const query = parts.slice(1).join(' ').trim();

        if (!query) {
            return await sock.sendMessage(chatId, {
                text: `🤖 Please provide a question.\n\nExamples:\n  ${command} explain quantum physics\n  ${command} write a poem about Kenya`
            }, { quoted: message });
        }

        // React to show processing
        await sock.sendMessage(chatId, { react: { text: '🤖', key: message.key } });

        let answer;
        if (command === '.gpt') {
            answer = await askGPT(query);
        } else if (command === '.gemini') {
            answer = await askGemini(query);
        } else {
            return;
        }

        await sock.sendMessage(chatId, { text: answer }, { quoted: message });
        // Success reaction
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('[AI] error:', error.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
            text: `❌ ${error.message || 'Failed to get a response. Please try again in a moment.'}`
        }, { quoted: message });
    }
}

module.exports = aiCommand;
