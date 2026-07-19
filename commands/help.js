const settings = require('../settings');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

async function helpCommand(sock, chatId, message) {
    const now = moment().tz('Africa/Nairobi');
    const timeStr = now.format('hh:mm A');
    const dateStr = now.format('ddd, DD MMM YYYY');
    const mode = (settings.commandMode || 'public') === 'public' ? '🟢 Public' : '🔴 Private';

    const helpMessage =
`╔══════════════════════════╗
║   🤖 *${settings.botName || 'LordFarhan Bot'}*   ║
║  ⚡ v${settings.version || '3.0.7'}  •  ${mode}
║  👑 ${settings.botOwner || 'DarkLordFarhan'}
║  🕐 ${timeStr}  •  Nairobi, Kenya
║  📅 ${dateStr}
╚══════════════════════════╝

*▸ 🌐 GENERAL*
› .help / .menu — This menu
› .alive — Bot status
› .ping — Response time
› .owner — Contact owner
› .tts <text> — Text to speech
› .weather <city> — Weather
› .news — Latest headlines
› .joke / .quote / .fact
› .lyrics <song> — Song lyrics
› .8ball <question>
› .attp <text> — Animated text
› .trt <text> <lang> — Translate
› .ss <url> — Screenshot
› .vv — View-once reveal
› .groupinfo / .staff / .jid

*▸ 👮 ADMIN*
› .ban / .kick @user
› .promote / .demote @user
› .mute <mins> / .unmute
› .warn / .warnings @user
› .delete / .del / .clear
› .antilink / .antibadword
› .antitag <on/off>
› .tag <msg> / .tagall / .hidetag
› .chatbot / .resetlink
› .welcome / .goodbye <on/off>
› .setgdesc / .setgname / .setgpp

*▸ 🔒 OWNER*
› .mode <public/private>
› .settings / .setpp
› .clearsession / .cleartmp
› .antidelete / .update
› .autostatus <on/off>
› .autoreact / .autotyping
› .autoread / .anticall
› .pmblocker <on/off>
› .setmention / .mention <on/off>

*▸ 🎨 MEDIA & STICKERS*
› .sticker — Image to sticker
› .simage — Sticker to image
› .blur — Blur image
› .removebg — Remove background
› .remini — Enhance image
› .crop — Crop image
› .meme — Random meme
› .take <packname>
› .emojimix <e1>+<e2>
› .tgsticker <link>
› .igs <instagram link>

*▸ 🤖 AI*
› .gpt <question>
› .gemini <question>
› .imagine <prompt>
› .flux <prompt>
› .sora <prompt>

*▸ 📥 DOWNLOADER*
› .play <song name>
› .song <song name/link>
› .video <name/link>
› .spotify <query>
› .tiktok <link>
› .instagram <link>
› .facebook <link>

*▸ 🎮 GAMES*
› .tictactoe @user
› .hangman / .guess <letter>
› .trivia / .answer <answer>
› .truth / .dare

*▸ 😄 FUN*
› .compliment / .insult @user
› .flirt / .shayari
› .goodnight / .roseday
› .character / .wasted @user
› .ship / .simp / .stupid @user

*▸ 🌍 COUNTRY PICS*
› .china .indonesia .japan
› .korea .malaysia .pies

> 💻 *LordFarhan Bot* by DarkLordFarhanXMDTech`;

    try {
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
        if (fs.existsSync(imagePath)) {
            await sock.sendMessage(chatId, {
                image: fs.readFileSync(imagePath),
                caption: helpMessage,
                contextInfo: { forwardingScore: 1, isForwarded: true }
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, {
                text: helpMessage,
                contextInfo: { forwardingScore: 1, isForwarded: true }
            }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, { text: helpMessage });
    }
}

module.exports = helpCommand;
