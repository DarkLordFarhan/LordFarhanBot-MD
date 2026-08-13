const fetch = require('node-fetch');

async function ask(query) {
    const q = encodeURIComponent(query);
    const urls = [
        `https://api.ryzendesu.vip/api/ai/mistral?text=${q}`,
        `https://api.giftedtech.my.id/api/ai/gptv4o?apikey=gifted&q=${q}`,
        `https://api.giftedtech.my.id/api/ai/geminiaipro?apikey=gifted&q=${q}`,
        `https://api.siputzx.my.id/api/ai/chatgpt?content=${q}`,
        `https://api.dreaded.site/api/chatgpt?text=${q}`
    ];
    for (const url of urls) {
        try {
            const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 });
            if (!r.ok) continue;
            const d = await r.json();
            const answer = d?.result || d?.answer || d?.message || d?.response || d?.data;
            if (typeof answer === 'string' && answer.trim()) return answer.trim();
        } catch (_) {}
    }
    throw new Error('All AI providers failed');
}

async function mistralCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const query = text.split(/\s+/).slice(1).join(' ').trim();
        
        if (!query) {
            await sock.sendMessage(chatId, { text: '❌ Usage: .mistral <query>' }, { quoted: message });
            return;
        }
        
        await sock.sendMessage(chatId, { text: '🤖 Asking Mistral AI...' }, { quoted: message });
        const answer = await ask(query);
        const result = `*✨ MISTRAL AI RESPONSE*\n\n${answer}`;
        
        await sock.sendMessage(chatId, { text: result }, { quoted: message });
    } catch (error) {
        console.error('Error in mistral command:', error);
        await sock.sendMessage(chatId, { text: '❌ Error communicating with Mistral AI' }, { quoted: message });
    }
}

module.exports = mistralCommand;