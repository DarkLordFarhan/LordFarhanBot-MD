const axios = require('axios');

async function soraCommand(sock, chatId, message) {
    try {
        const rawText = message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            '';

        // Extract prompt after command keyword or use quoted text
        const used = (rawText || '').split(/\s+/)[0] || '.sora';
        const args = rawText.slice(used.length).trim();
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
        const input = args || quotedText;

        if (!input) {
            await sock.sendMessage(chatId, { text: 'Provide a prompt. Example: .sora anime girl with short blue hair' }, { quoted: message });
            return;
        }

        let videoUrl;
        for (const url of [
            `https://okatsu-rolezapiiz.vercel.app/ai/txt2video?text=${encodeURIComponent(input)}`,
            `https://api.ryzendesu.vip/api/ai/txt2video?text=${encodeURIComponent(input)}`
        ]) {
            try {
                const { data } = await axios.get(url, { timeout: 60000, headers: { 'user-agent': 'Mozilla/5.0' } });
                videoUrl = data?.videoUrl || data?.result || data?.data?.videoUrl || data?.url;
                if (videoUrl) break;
            } catch (_) {}
        }
        if (!videoUrl) {
            await sock.sendMessage(chatId, { text: '⚠️ Video providers are unavailable; generating a preview image instead…' }, { quoted: message });
            const image = await axios.get(`https://image.pollinations.ai/prompt/${encodeURIComponent(input + ', cinematic motion scene, high quality') }?width=1280&height=720&nologo=true&model=flux`, { responseType: 'arraybuffer', timeout: 90000 });
            return sock.sendMessage(chatId, { image: Buffer.from(image.data), caption: `🎨 Sora preview for: ${input}` }, { quoted: message });
        }

        await sock.sendMessage(chatId, {
            video: { url: videoUrl },
            mimetype: 'video/mp4',
            caption: `Prompt: ${input}`
        }, { quoted: message });

    } catch (error) {
        console.error('[SORA] error:', error?.message || error);
        await sock.sendMessage(chatId, { text: 'Failed to generate video. Try a different prompt later.' }, { quoted: message });
    }
}

module.exports = soraCommand;


