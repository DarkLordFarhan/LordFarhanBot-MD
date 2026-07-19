const settings = require('../settings');
const moment = require('moment-timezone');

async function aliveCommand(sock, chatId, message) {
    try {
        const now = moment().tz('Africa/Nairobi');
        const timeStr = now.format('hh:mm A');
        const dateStr = now.format('ddd, DD MMM YYYY');

        const message1 =
            '✅ *LordFarhan Bot is Online!*\n\n' +
            '> 🤖 *Bot:* ' + (settings.botName || 'LordFarhan Bot') + '\n' +
            '> ⚡ *Version:* ' + settings.version + '\n' +
            '> 🟢 *Status:* Active\n' +
            '> 🌐 *Mode:* ' + ((settings.commandMode || 'public') === 'public' ? 'Public' : 'Private') + '\n' +
            '> 🕐 *Time:* ' + timeStr + '\n' +
            '> 📅 *Date:* ' + dateStr + '\n' +
            '> 📍 *Timezone:* Nairobi, Kenya\n\n' +
            '💡 Type *.menu* for all commands';

        await sock.sendMessage(chatId, {
            text: message1,
            contextInfo: { forwardingScore: 999, isForwarded: true }
        }, { quoted: message });
    } catch (error) {
        console.error('Error in alive command:', error);
        await sock.sendMessage(chatId, { text: '✅ Bot is alive and running!' }, { quoted: message });
    }
}

module.exports = aliveCommand;
