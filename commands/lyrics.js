const fetch = require('node-fetch');

async function lyricsCommand(sock, chatId, songTitle, message) {
    if (!songTitle) {
        await sock.sendMessage(chatId, { 
            text: '🔍 Please enter the song name to get the lyrics! Usage: *lyrics <song name>*'
        },{ quoted: message });
        return;
    }

    try {
        let lyrics = null;
        // lyrics.ovh requires separate artist/title values.
        const parts = songTitle.split(/\s+-\s+/, 2);
        if (parts.length === 2) {
            try {
                const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(parts[0])}/${encodeURIComponent(parts[1])}`, { timeout: 20000 });
                const data = await res.json();
                if (data.lyrics) lyrics = data.lyrics;
            } catch (_) {}
        }
        // For a title-only query, use the keyless suggestion endpoint first.
        if (!lyrics) {
            const suggest = await fetch(`https://api.lyrics.ovh/suggest/${encodeURIComponent(songTitle)}`, { timeout: 20000 });
            const data = await suggest.json();
            const track = data?.data?.find(t => t?.artist?.name && t?.title);
            if (track) {
                const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(track.artist.name)}/${encodeURIComponent(track.title)}`, { timeout: 20000 });
                const lyricData = await res.json();
                lyrics = lyricData.lyrics || null;
            }
        }
        if (!lyrics) {
            await sock.sendMessage(chatId, {
                text: `❌ Sorry, I couldn't find any lyrics for "${songTitle}".`
            },{ quoted: message });
            return;
        }

        const maxChars = 4096;
        const output = lyrics.length > maxChars ? lyrics.slice(0, maxChars - 3) + '...' : lyrics;

        await sock.sendMessage(chatId, { text: output }, { quoted: message });
    } catch (error) {
        console.error('Error in lyrics command:', error);
        await sock.sendMessage(chatId, { 
            text: `❌ An error occurred while fetching the lyrics for "${songTitle}".`
        },{ quoted: message });
    }
}

module.exports = { lyricsCommand };
