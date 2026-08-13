const gTTS = require('gtts');
const fs = require('fs');
const path = require('path');

async function ttsCommand(sock, chatId, text, message, language = 'en') {
    if (!text?.trim()) return sock.sendMessage(chatId, { text: 'Usage: .tts <text>' }, { quoted: message });

    const fileName = `tts-${Date.now()}.mp3`;
    const tempDir = path.join(process.cwd(), 'temp');
    fs.mkdirSync(tempDir, { recursive: true });
    const filePath = path.join(tempDir, fileName);

    const gtts = new gTTS(text, language);
    gtts.save(filePath, async function (err) {
        if (err) {
            await sock.sendMessage(chatId, { text: 'Error generating TTS audio.' });
            return;
        }

        await sock.sendMessage(chatId, {
            audio: fs.readFileSync(filePath),
            mimetype: 'audio/mpeg'
        }, { quoted: message });

        fs.unlinkSync(filePath);
    });
}

module.exports = ttsCommand;
