const axios = require('axios');
const fetch = require('node-fetch');

// ── Helpers ────────────────────────────────────────────────────────────────────
async function tryFetch(url, timeout = 12000) {
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
    // Handle various API response shapes
    return data?.result || data?.answer || data?.message || data?.data ||
           data?.response || data?.text || data?.output || data?.content || null;
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
    ];
    for (const url of apis) {
        try {
            const data = await tryFetch(url);
            const text = extractText(data);
            if (text && String(text).trim().length > 0) return String(text).trim();
        } catch (_) { /* try next */ }
    }
    throw new Error('All GPT APIs failed');
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
    ];
    for (const url of apis) {
        try {
            const data = await tryFetch(url);
            const text = extractText(data);
            if (text && String(text).trim().length > 0) return String(text).trim();
        } catch (_) { /* try next */ }
    }
    throw new Error('All Gemini APIs failed');
}

// ── Main command handler ───────────────────────────────────────────────────────
async function aiCommand(sock, chatId, message) {
    try {
        const text =
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text || '';

        const parts = text.trim().split(/\s+/);
        const command = parts[0].toLowerCase();
        const query = parts.slice(1).join(' ').trim();

        if (!query) {
            return await sock.sendMessage(chatId, {
                text: `Please provide a question.\nExample: ${command} write a basic HTML page`
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

    } catch (error) {
        console.error('[AI] error:', error.message);
        await sock.sendMessage(chatId, {
            text: '❌ Failed to get a response. Please try again in a moment.'
        }, { quoted: message });
    }
}

module.exports = aiCommand;
