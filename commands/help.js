const settings = require('../settings');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

async function helpCommand(sock, chatId, message) {
    const now = moment().tz('Africa/Nairobi');
    const timeStr = now.format('hh:mm A');
    const dateStr = now.format('ddd, DD MMM YYYY');
    const mode = (settings.commandMode || 'public') === 'public' ? '🟢 Public' : '🔴 Private';
    const name = settings.botName || 'LordFarhan Bot';
    const owner = settings.botOwner || 'DarkLord Farhan';
    const ver = settings.version || '3.0.7';

    const helpMessage =
`╭━━━━━━━━━━━━━━━━━━━━━━━━╮
      ⚡ *${name}* ⚡
    _v${ver}  •  ${owner}_
╰━━━━━━━━━━━━━━━━━━━━━━━━╯
🕐 *${timeStr}*  📅 ${dateStr}
🌍 Nairobi, Kenya  •  ${mode}

┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅

*🌐 GENERAL*
┌ .help  .alive  .ping  .owner
├ .tts  .weather  .news  .joke
├ .lyrics  .8ball  .attp  .quote
└ .trt  .ss  .vv  .jid  .fact

*👮 ADMIN*
┌ .ban  .kick  .promote  .demote
├ .mute  .unmute  .warn  .delete
├ .antilink  .antibadword  .antitag
├ .tag  .tagall  .hidetag  .chatbot
└ .welcome  .goodbye  .setgname  .setgdesc

*🔒 OWNER*
┌ .mode  .settings  .autostatus
├ .autoreact  .autotyping  .autoread
└ .anticall  .pmblocker  .antidelete

*🎨 MEDIA & STICKERS*
┌ .sticker  .simage  .blur  .meme
└ .removebg  .remini  .emojimix  .tgsticker

*🤖 AI*
└ .gpt  .gemini  .imagine  .flux  .sora

*📥 DOWNLOADER*
┌ .play  .song  .video  .spotify
└ .tiktok  .instagram  .facebook

*🎮 GAMES & FUN*
└ .tictactoe  .truth  .dare  .trivia  .ship

┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅
    💻 _LordFarhanXMDTech_`;

    try {
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
        if (fs.existsSync(imagePath)) {
            await sock.sendMessage(chatId, {
                image: fs.readFileSync(imagePath),
                caption: helpMessage
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: helpMessage }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, { text: helpMessage });
    }
}

module.exports = helpCommand;
