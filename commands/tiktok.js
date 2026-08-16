'use strict';
const axios = require('axios');

const processedMessages = new Set();

// ── Helpers ───────────────────────────────────────────────────────────────────
function extractUrl(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/i;
    const m = text.match(urlRegex);
    return m ? m[1] : null;
}

function isTiktokUrl(url) {
    return /tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com/i.test(url);
}

// ── API 1: tikwm.com (most reliable) ─────────────────────────────────────────
async function tryTikwm(url) {
    const res = await axios.post('https://www.tikwm.com/api/', null, {
        params: { url, count: 12, cursor: 0, web: 1, hd: 1 },
        timeout: 20000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const d = res.data?.data;
    if (!d || !d.play) throw new Error('tikwm: no video');
    return {
        videoUrl: d.hdplay || d.play,
        audioUrl: d.music,
        title: d.title || 'TikTok Video',
        author: d.author?.nickname || '',
        duration: d.duration || 0,
        likes: d.digg_count || 0,
    };
}

// ── API 2: tikmate / douyin.wtf ───────────────────────────────────────────────
async function tryDouyinWtf(url) {
    const res = await axios.get(`https://api.douyin.wtf/api?url=${encodeURIComponent(url)}&minimal=false`, {
        timeout: 20000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const d = res.data;
    if (!d?.video_data?.nwm_video_url_HQ) throw new Error('douyin.wtf: no video');
    return {
        videoUrl: d.video_data.nwm_video_url_HQ,
        audioUrl: d.video_data.music_url || null,
        title: d.desc || 'TikTok Video',
        author: d.author?.nickname || '',
        duration: 0,
        likes: 0,
    };
}

// ── API 3: SnapTik fallback ───────────────────────────────────────────────────
async function trySnaptik(url) {
    const res = await axios.get(`https://api.snapmdown.xyz/api?url=${encodeURIComponent(url)}`, {
        timeout: 20000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const d = res.data;
    const videoUrl = d?.data?.[0]?.url || d?.url;
    if (!videoUrl) throw new Error('snaptik: no video');
    return {
        videoUrl,
        audioUrl: null,
        title: d?.title || 'TikTok Video',
        author: '',
        duration: 0,
        likes: 0,
    };
}

// ── Download buffer with retry ────────────────────────────────────────────────
async function downloadBuffer(url, type = 'video') {
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 45000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://www.tiktok.com/'
        }
    });
    return Buffer.from(res.data);
}

// ── Main command ──────────────────────────────────────────────────────────────
async function tiktokCommand(sock, chatId, message) {
    try {
        if (processedMessages.has(message.key.id)) return;
        processedMessages.add(message.key.id);
        setTimeout(() => processedMessages.delete(message.key.id), 5 * 60 * 1000);

        const text = (
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text || ''
        ).trim();

        const url = extractUrl(text);
        if (!url || !isTiktokUrl(url)) {
            return sock.sendMessage(chatId, {
                text: '📱 *TikTok Downloader*\n\nUsage: *.tiktok* <link>\nExample: .tiktok https://vm.tiktok.com/xxxxx\n\n✅ Supports: all TikTok & vm.tiktok links'
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });
        await sock.sendMessage(chatId, { text: '⬇️ Downloading TikTok video…' }, { quoted: message });

        // Try APIs in order
        let info = null;
        const errors = [];
        for (const fn of [tryTikwm, tryDouyinWtf, trySnaptik]) {
            try { info = await fn(url); break; }
            catch (e) { errors.push(e.message); }
        }

        if (!info) {
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
            return sock.sendMessage(chatId, {
                text: `❌ Could not download TikTok video.\n\nAll sources failed:\n${errors.join('\n')}\n\nTry a different link or make sure the video is public.`
            }, { quoted: message });
        }

        const caption = `🎵 *${info.title}*\n👤 ${info.author}${info.likes ? `\n❤️ ${Number(info.likes).toLocaleString()} likes` : ''}\n\n🤖 _🌑༒𓆩『𝕃𝕆ℝ𝔻 𝔽𝔸ℝℍ𝔸ℕ 𝕄𝔻』𓆪༒☠️_`;

        // Download & send video
        try {
            const vidBuf = await downloadBuffer(info.videoUrl, 'video');
            await sock.sendMessage(chatId, {
                video: vidBuf,
                mimetype: 'video/mp4',
                caption
            }, { quoted: message });
        } catch (dlErr) {
            // Fallback: send as URL
            await sock.sendMessage(chatId, {
                video: { url: info.videoUrl },
                mimetype: 'video/mp4',
                caption
            }, { quoted: message });
        }

        // Also send audio if available
        if (info.audioUrl) {
            try {
                const audBuf = await downloadBuffer(info.audioUrl, 'audio');
                await sock.sendMessage(chatId, {
                    audio: audBuf,
                    mimetype: 'audio/mpeg',
                    ptt: false
                }, { quoted: message });
            } catch (_) {}
        }

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (err) {
        console.error('TikTok command error:', err.message);
        await sock.sendMessage(chatId, {
            text: '❌ An error occurred. Please try again.'
        }, { quoted: message });
    }
}

module.exports = tiktokCommand;
