const fetch = require('node-fetch');

async function requestJSON(url) {
    const response = await fetch(url, {
        timeout: 20000,
        headers: {
            'User-Agent': 'LordFarhan-MD/1.0'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
}

async function searchLRCLIB(query) {
    try {
        const results = await requestJSON(
            `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`
        );

        if (!Array.isArray(results)) return null;

        const track = results.find(item =>
            item &&
            (item.plainLyrics || item.syncedLyrics)
        );

        if (!track) return null;

        return {
            lyrics: track.plainLyrics || null,
            title: track.trackName || query,
            artist: track.artistName || ''
        };
    } catch (error) {
        console.log('LRCLIB search error:', error.message);
        return null;
    }
}

async function directLRCLIB(artist, title) {
    try {
        const data = await requestJSON(
            `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`
        );

        if (!data?.plainLyrics && !data?.syncedLyrics) return null;

        return {
            lyrics: data.plainLyrics || null,
            title: data.trackName || title,
            artist: data.artistName || artist
        };
    } catch (error) {
        return null;
    }
}

async function lyricsOVH(artist, title) {
    try {
        const data = await requestJSON(
            `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
        );

        if (!data?.lyrics) return null;

        return {
            lyrics: data.lyrics,
            title,
            artist
        };
    } catch (error) {
        return null;
    }
}

async function lyricsCommand(sock, chatId, songTitle, message) {
    if (!songTitle || !songTitle.trim()) {
        return sock.sendMessage(chatId, {
            text:
                '🔍 *LYRICS SEARCH*\n\n' +
                'Use:\n' +
                '*.lyrics <song name>*\n\n' +
                'Example:\n' +
                '*.lyrics Die With A Smile*\n' +
                '*.lyrics Perfect Ed Sheeran*'
        }, { quoted: message });
    }

    const query = songTitle.trim();

    try {
        let result = null;

        // 1. Search any song using LRCLIB
        result = await searchLRCLIB(query);

        // 2. If user supplied "Artist - Song", try direct lookup
        if (!result && query.includes(' - ')) {
            const parts = query.split(/\s+-\s+/);

            const artist = parts.shift().trim();
            const title = parts.join(' - ').trim();

            result = await directLRCLIB(artist, title);

            // 3. lyrics.ovh fallback
            if (!result) {
                result = await lyricsOVH(artist, title);
            }
        }

        if (!result || !result.lyrics) {
            return sock.sendMessage(chatId, {
                text:
                    `❌ *Lyrics not found*\n\n` +
                    `🎵 Search: *${query}*\n\n` +
                    `Try the song title together with the artist name.`
            }, { quoted: message });
        }

        let lyrics = result.lyrics.trim();

        // Remove excessive blank lines
        lyrics = lyrics.replace(/\n{4,}/g, '\n\n');

        // WhatsApp-friendly limit
        const MAX_LENGTH = 6000;

        if (lyrics.length > MAX_LENGTH) {
            lyrics =
                lyrics.substring(0, MAX_LENGTH - 120) +
                '\n\n... ✂️ *Lyrics shortened because the message is too long.*';
        }

        const header =
            `🎵 *${result.title}*` +
            (result.artist ? `\n👤 *${result.artist}*` : '') +
            `\n\n`;

        await sock.sendMessage(chatId, {
            text: header + lyrics
        }, { quoted: message });

    } catch (error) {
        console.error('Lyrics command error:', error);

        await sock.sendMessage(chatId, {
            text:
                `❌ Unable to search lyrics right now.\n\n` +
                `🎵 *${query}*\n\n` +
                `Please try again shortly.`
        }, { quoted: message });
    }
}

module.exports = { lyricsCommand };
