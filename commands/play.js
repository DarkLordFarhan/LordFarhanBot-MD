const yts = require('yt-search');
const axios = require('axios');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: '*/*',
    'Accept-Encoding': 'identity'
};

async function tryGet(url, timeout = 20000) {
    const res = await axios.get(url, { timeout, headers: { ...HEADERS, Accept: 'application/json' } });
    return res.data;
}

// Returns { download, title } or throws
async function resolveAudioUrl(youtubeUrl) {
    const u = encodeURIComponent(youtubeUrl);
    const apis = [
        async () => {
            const d = await tryGet(`https://api.giftedtech.web.id/api/download/ytmp3?apikey=gifted&url=${u}`);
            if (d?.success && d?.result?.download_url) return { download: d.result.download_url, title: d.result.title };
            throw new Error('giftedtech no url');
        },
        async () => {
            const d = await tryGet(`https://eliteprotech-apis.zone.id/ytdown?url=${u}&format=mp3`);
            if (d?.success && d?.downloadURL) return { download: d.downloadURL, title: d.title };
            throw new Error('eliteprotech no url');
        },
        async () => {
            const d = await tryGet(`https://api.yupra.my.id/api/downloader/ytmp3?url=${u}`);
            if (d?.success && d?.data?.download_url) return { download: d.data.download_url, title: d.data.title };
            throw new Error('yupra no url');
        },
        async () => {
            const d = await tryGet(`https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${u}`);
            if (d?.dl) return { download: d.dl, title: d.title };
            throw new Error('okatsu no url');
        },
        async () => {
            const d = await tryGet(`https://apis-keith.vercel.app/download/dlmp3?url=${u}`);
            if (d?.status && d?.result?.downloadUrl) return { download: d.result.downloadUrl, title: d.result.title };
            throw new Error('keith no url');
        },
    ];

    for (const api of apis) {
        try { return await api(); } catch (_) { /* try next */ }
    }
    throw new Error('All audio download APIs failed');
}

async function playCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const query = text.split(' ').slice(1).join(' ').trim();

        if (!query) {
            return await sock.sendMessage(chatId, {
                text: '🎵 What song do you want?\nUsage: .play <song name>'
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, { react: { text: '🎵', key: message.key } });

        // Search YouTube
        const { videos } = await yts(query);
        if (!videos?.length) {
            return await sock.sendMessage(chatId, { text: '❌ No songs found for that query.' }, { quoted: message });
        }

        const video = videos[0];

        // Notify user
        await sock.sendMessage(chatId, {
            text: `🎵 *${video.title}*\n⏱ ${video.timestamp}\n\n_Downloading..._`
        }, { quoted: message });

        const audioData = await resolveAudioUrl(video.url);

        // Download the audio buffer
        const resp = await axios.get(audioData.download, {
            responseType: 'arraybuffer',
            timeout: 90000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            headers: HEADERS
        });

        const audioBuffer = Buffer.from(resp.data);
        if (!audioBuffer.length) throw new Error('Empty audio buffer');

        await sock.sendMessage(chatId, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            fileName: `${(audioData.title || video.title).replace(/[^\w\s-]/g, '')}.mp3`,
            ptt: false
        }, { quoted: message });

    } catch (error) {
        console.error('[play] error:', error.message);
        await sock.sendMessage(chatId, {
            text: '❌ Download failed. Try .song instead for a more reliable download.'
        }, { quoted: message });
    }
}

module.exports = playCommand;
