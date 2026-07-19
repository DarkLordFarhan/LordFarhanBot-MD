const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const { toAudio } = require('../lib/converter');

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
        `https://api.giftedtech.web.id/api/download/ytmp3?apikey=gifted&url=${encodeURIComponent(url)}`,
        AXIOS_DEFAULTS
    ));
    if (r.data?.success && r.data?.result?.download_url)
        return { download: r.data.result.download_url, title: r.data.result.title, thumbnail: r.data.result.thumbnail };
    throw new Error('giftedtech no url');
}

async function getEliteProTech(url) {
    const r = await tryRequest(() => axios.get(
        `https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(url)}&format=mp3`,
        AXIOS_DEFAULTS
    ));
    if (r.data?.success && r.data?.downloadURL)
        return { download: r.data.downloadURL, title: r.data.title };
    throw new Error('eliteprotech no url');
}

async function getYupra(url) {
    const r = await tryRequest(() => axios.get(
        `https://api.yupra.my.id/api/downloader/ytmp3?url=${encodeURIComponent(url)}`,
        AXIOS_DEFAULTS
    ));
    if (r.data?.success && r.data?.data?.download_url)
        return { download: r.data.data.download_url, title: r.data.data.title, thumbnail: r.data.data.thumbnail };
    throw new Error('yupra no url');
}

async function getOkatsu(url) {
    const r = await tryRequest(() => axios.get(
        `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${encodeURIComponent(url)}`,
        AXIOS_DEFAULTS
    ));
    if (r.data?.dl)
        return { download: r.data.dl, title: r.data.title, thumbnail: r.data.thumb };
    throw new Error('okatsu no url');
}

async function getKeith(url) {
    const r = await tryRequest(() => axios.get(
        `https://apis-keith.vercel.app/download/dlmp3?url=${encodeURIComponent(url)}`,
        AXIOS_DEFAULTS
    ));
    if (r.data?.status && r.data?.result?.downloadUrl)
        return { download: r.data.result.downloadUrl, title: r.data.result.title };
    throw new Error('keith no url');
}

// ── Buffer downloader ──────────────────────────────────────────────────────────
async function downloadBuffer(url) {
    // Try arraybuffer first, fall back to stream
    try {
        const r = await axios.get(url, {
            responseType: 'arraybuffer', timeout: 90000,
            maxContentLength: Infinity, maxBodyLength: Infinity,
            validateStatus: s => s >= 200 && s < 400,
            headers: { 'User-Agent': AXIOS_DEFAULTS.headers['User-Agent'], Accept: '*/*', 'Accept-Encoding': 'identity' }
        });
        const buf = Buffer.from(r.data);
        if (buf.length > 0) return buf;
        throw new Error('empty arraybuffer');
    } catch (_) {}

    const r = await axios.get(url, {
        responseType: 'stream', timeout: 90000,
        maxContentLength: Infinity, maxBodyLength: Infinity,
        validateStatus: s => s >= 200 && s < 400,
        headers: { 'User-Agent': AXIOS_DEFAULTS.headers['User-Agent'], Accept: '*/*', 'Accept-Encoding': 'identity' }
    });
    const chunks = [];
    await new Promise((res, rej) => {
        r.data.on('data', c => chunks.push(c));
        r.data.on('end', res);
        r.data.on('error', rej);
    });
    const buf = Buffer.concat(chunks);
    if (!buf.length) throw new Error('empty stream');
    return buf;
}

// ── Format detection ───────────────────────────────────────────────────────────
function detectFormat(buf) {
    const h = buf.slice(0, 12).toString('hex');
    const a4 = buf.slice(4, 8).toString('ascii');
    if (buf.slice(0, 3).toString('ascii') === 'ID3' || (buf[0] === 0xFF && (buf[1] & 0xE0) === 0xE0))
        return { mime: 'audio/mpeg', ext: 'mp3' };
    if (a4 === 'ftyp') return { mime: 'audio/mp4', ext: 'm4a' };
    if (buf.slice(0, 4).toString('ascii') === 'OggS') return { mime: 'audio/ogg; codecs=opus', ext: 'ogg' };
    if (buf.slice(0, 4).toString('ascii') === 'RIFF') return { mime: 'audio/wav', ext: 'wav' };
    return { mime: 'audio/mp4', ext: 'm4a' };
}

// ── Main command ───────────────────────────────────────────────────────────────
async function songCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const query = text.split(' ').slice(1).join(' ').trim();

        if (!query) {
            return await sock.sendMessage(chatId, {
                text: '🎵 Usage: .song <song name or YouTube link>'
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, { react: { text: '🎵', key: message.key } });

        // Resolve YouTube URL
        let video;
        if (query.includes('youtube.com') || query.includes('youtu.be')) {
            video = { url: query, title: query, thumbnail: null, timestamp: '' };
        } else {
            const search = await yts(query);
            if (!search?.videos?.length) {
                return await sock.sendMessage(chatId, { text: '❌ No results found.' }, { quoted: message });
            }
            video = search.videos[0];
        }

        // Notify
        const thumb = video.thumbnail;
        if (thumb) {
            await sock.sendMessage(chatId, {
                image: { url: thumb },
                caption: `🎵 *${video.title}*\n⏱ ${video.timestamp || ''}\n\n_Downloading..._`
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, {
                text: `🎵 *${video.title}*\n_Downloading..._`
            }, { quoted: message });
        }

        // Try each API
        const providers = [getGiftedTech, getEliteProTech, getYupra, getOkatsu, getKeith];
        let audioData, audioBuffer;

        for (const provider of providers) {
            try {
                audioData = await provider(video.url);
                if (!audioData?.download) continue;
                audioBuffer = await downloadBuffer(audioData.download);
                if (audioBuffer?.length > 0) break;
            } catch (_) { /* try next */ }
        }

        if (!audioBuffer?.length) throw new Error('All download sources failed');

        // Detect format and convert if needed
        const fmt = detectFormat(audioBuffer);
        let finalBuffer = audioBuffer;
        let finalMime = 'audio/mpeg';
        let finalExt = 'mp3';

        if (fmt.ext !== 'mp3') {
            try {
                finalBuffer = await toAudio(audioBuffer, fmt.ext);
                if (!finalBuffer?.length) throw new Error('empty conversion');
            } catch (e) {
                // Send in native format rather than failing
                finalMime = fmt.mime;
                finalExt = fmt.ext;
                finalBuffer = audioBuffer;
            }
        }

        await sock.sendMessage(chatId, {
            audio: finalBuffer,
            mimetype: finalMime,
            fileName: `${(audioData?.title || video.title || 'song').replace(/[^\w\s-]/g, '')}.${finalExt}`,
            ptt: false
        }, { quoted: message });

        // Async temp cleanup
        setImmediate(() => {
            try {
                const tempDir = path.join(__dirname, '../temp');
                if (!fs.existsSync(tempDir)) return;
                const now = Date.now();
                for (const file of fs.readdirSync(tempDir)) {
                    const fp = path.join(tempDir, file);
                    try {
                        if (now - fs.statSync(fp).mtimeMs > 10000 &&
                            /\.(mp3|m4a|ogg|wav)$/.test(file)) {
                            fs.unlinkSync(fp);
                        }
                    } catch (_) {}
                }
            } catch (_) {}
        });

    } catch (err) {
        console.error('[song] error:', err.message);
        await sock.sendMessage(chatId, {
            text: err.message?.includes('blocked') || err.message?.includes('451')
                ? '❌ This content is blocked in your region.'
                : '❌ Failed to download song. Please try again or try a different song.'
        }, { quoted: message });
    }
}

module.exports = songCommand;
