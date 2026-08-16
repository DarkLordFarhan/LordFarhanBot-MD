const fetch = require('node-fetch');

async function getJson(url) {
    const res = await fetch(url, {
        timeout: 20000,
        headers: {
            'User-Agent': 'LordFarhan-MD/1.0'
        }
    });

    if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
    }

    return await res.json();
}

async function lyricsCommand(sock, chatId, songTitle, message) {
    if (!songTitle || !songTitle.trim()) {
        return sock.sendMessage(chatId, {
            text: '🔍 Please enter the song name.\n\nExample:\n*.lyrics Perfect Ed Sheeran*'
        }, { quoted: message });
    }

    const query = songTitle.trim();

    try {
        let lyrics = null;
        let title = query;
        let artist = '';

        // -------------------------------------------------
        // 1. LRCLIB search
        // -------------------------------------------------
        try {
            const searchUrl =
                `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;

            const results = await getJson(searchUrl);

            if (Array.isArray(results) && results.length > 0) {
                // Prefer an exact title/artist match when possible
                const track =
                    results.find(x =>
                        x?.plainLyrics ||
                        x?.syncedLyrics
                    );

                if (track) {
                    lyrics = track.plainLyrics || null;
                    title = track.trackName || title;
                    artist = track.artistName || '';
                }
            }
        } catch (error) {
            console.log('LRCLIB search failed:', error.message);
        }

        // -------------------------------------------------
        // 2. LRCLIB direct get
        // Supports: Artist - Song
        // -------------------------------------------------
        if (!lyrics && query.includes(' - ')) {
            try {
                const parts = query.split(/\s+-\s+/);

                const directArtist = parts[0].trim();
                const directTitle = parts.slice(1).join(' - ').trim();

                const url =
                    `https://lrclib.net/api/get?artist_name=${encodeURIComponent(directArtist)}&track_name=${encodeURIComponent(directTitle)}`;

                const data = await getJson(url);

                if (data?.plainLyrics) {
                    lyrics = data.plainLyrics;
                    title = data.trackName || directTitle;
                    artist = data.artistName || directArtist;
                }
            } catch (error) {
                console.log('LRCLIB direct lookup failed:', error.message);
            }
        }

        // -------------------------------------------------
        // 3. lyrics.ovh fallback
        // -------------------------------------------------
        if (!lyrics && query.includes(' - ')) {
            try {
                const parts = query.split(/\s+-\s+/);

                const fallbackArtist = parts[0].trim();
                const fallbackTitle = parts.slice(1).join(' - ').trim();

                const url =
                    `https://api.lyrics.ovh/v1/${encodeURIComponent(fallbackArtist)}/${encodeURIComponent(fallbackTitle)}`;

                const data = await getJson(url);

                if (data?.lyrics) {
                    lyrics = data.lyrics;
                    title = fallbackTitle;
                    artist = fallbackArtist;
                }
            } catch (error) {
                console.log('lyrics.ovh failed:', error.message);
            }
        }

        // -------------------------------------------------
        // No lyrics found
        // -------------------------------------------------
        if (!lyrics || !lyrics.trim()) {
            return sock.sendMessage(chatId, {
                text:
                    `❌ I couldn't find lyrics for:\n` +
                    `🎵 *${query}*\n\n` +
                    `💡 Try:\n` +
                    `*.lyrics Artist - Song Name*`
            }, { quoted: message });
        }

        // -------------------------------------------------
        // WhatsApp message limit
        // -------------------------------------------------
        const maxChars = 6000;

        let output = lyrics.trim();

        if (output.length > maxChars) {
            output =
                output.slice(0, maxChars - 100) +
                '\n\n... ✂️ Lyrics truncated.';
        }

        const header =
            `🎵 *${title}*` +
            (artist ? `\n👤 *${artist}*` : '') +
            `\n\n`;

        await sock.sendMessage(chatId, {
            text: header + output
        }, { quoted: message });

    } catch (error) {
        console.error('Lyrics command error:', error);

        await sock.sendMessage(chatId, {
            text:
                `❌ Failed to fetch lyrics for:\n` +
                `🎵 *${query}*\n\n` +
                `Please try again or use:\n` +
                `*.lyrics Artist - Song Name*`
        }, { quoted: message });
    }
}

module.exports = { lyricsCommand };
