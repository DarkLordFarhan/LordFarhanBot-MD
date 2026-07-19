const axios = require('axios');
const yts = require('yt-search');

const AXIOS_DEFAULTS = {
    timeout: 60000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*'
    }
};

async function tryRequest(getter, attempts = 2) {
    let lastError;
    for (let i = 1; i <= attempts; i++) {
        try { return await getter(); } catch (err) {
            lastError = err;
            if (i < attempts) await new Promise(r => setTimeout(r, 800 * i));
        }
    }
    throw lastError;
}

// ── API providers ──────────────────────────────────────────────────────────────
async function getGiftedTech(url) {
    const r = await tryRequest(() => axios.get(
        `https://api.giftedtech.web.id/api/download/ytmp4?apikey=gifted&url=${encodeURIComponent(url)}`,
        AXIOS_DEFAULTS
    ));
    if (r.data?.success && r.data?.result?.download_url)
        return { download: r.data.result.download_url, title: r.data.result.title };
    throw new Error('giftedtech no url');
}

async function getEliteProTech(url) {
    const r = await tryRequest(() => axios.get(
        `https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(url)}&format=mp4`,
        AXIOS_DEFAULTS
    ));
    if (r.data?.success && r.data?.downloadURL)
        return { download: r.data.downloadURL, title: r.data.title };
    throw new Error('eliteprotech no url');
}

async function getYupra(url) {
    const r = await tryRequest(() => axios.get(
        `https://api.yupra.my.id/api/downloader/ytmp4?url=${encodeURIComponent(url)}`,
        AXIOS_DEFAULTS
    ));
    if (r.data?.success && r.data?.data?.download_url)
        return { download: r.data.data.download_url, title: r.data.data.title, thumbnail: r.data.data.thumbnail };
    throw new Error('yupra no url');
}

async function getOkatsu(url) {
    const r = await tryRequest(() => axios.get(
        `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp4?url=${encodeURIComponent(url)}`,
        AXIOS_DEFAULTS
    ));
    if (r.data?.result?.mp4)
        return { download: r.data.result.mp4, title: r.data.result.title };
    throw new Error('okatsu no mp4');
}

// ── Main command ───────────────────────────────────────────────────────────────
async function videoCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const query = text.split(' ').slice(1).join(' ').trim();

        if (!query) {
            return await sock.sendMessage(chatId, {
                text: '🎬 Usage: .video <video name or YouTube link>'
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, { react: { text: '🎬', key: message.key } });

        // Resolve YouTube URL
        let videoUrl = '', videoTitle = '', videoThumb = '';
        if (query.startsWith('http://') || query.startsWith('https://')) {
            videoUrl = query;
        } else {
            const { videos } = await yts(query);
            if (!videos?.length) {
                return await sock.sendMessage(chatId, { text: '❌ No videos found.' }, { quoted: message });
            }
            videoUrl = videos[0].url;
            videoTitle = videos[0].title;
            videoThumb = videos[0].thumbnail;
        }

        // Validate YouTube URL
        if (!/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/i.test(videoUrl)) {
            return await sock.sendMessage(chatId, { text: '❌ Not a valid YouTube link.' }, { quoted: message });
        }

        // Show thumbnail while downloading
        try {
            const ytId = (videoUrl.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/) || [])[1];
            const thumb = videoThumb || (ytId ? `https://i.ytimg.com/vi/${ytId}/sddefault.jpg` : null);
            if (thumb) {
                await sock.sendMessage(chatId, {
                    image: { url: thumb },
                    caption: `🎬 *${videoTitle || query}*\n\n_Downloading..._`
                }, { quoted: message });
            }
        } catch (_) {}

        // Try each API
        const providers = [getGiftedTech, getEliteProTech, getYupra, getOkatsu];
        let videoData;

        for (const provider of providers) {
            try {
                videoData = await provider(videoUrl);
                if (videoData?.download) break;
            } catch (_) { /* try next */ }
        }

        if (!videoData?.download) throw new Error('All video download APIs failed');

        await sock.sendMessage(chatId, {
            video: { url: videoData.download },
            mimetype: 'video/mp4',
            fileName: `${(videoData.title || videoTitle || 'video').replace(/[^\w\s-]/g, '')}.mp4`,
            caption: `🎬 *${videoData.title || videoTitle || 'Video'}*\n\n> _Downloaded by LordFarhan Bot_`
        }, { quoted: message });

    } catch (error) {
        console.error('[video] error:', error.message);
        await sock.sendMessage(chatId, {
            text: error.message?.includes('blocked') || error.message?.includes('451')
                ? '❌ This content is blocked in your region.'
                : '❌ Failed to download video. Please try again or try a different video.'
        }, { quoted: message });
    }
}

module.exports = videoCommand;
