const fetch = require('node-fetch');

async function tennisCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { text: '🎾 Fetching tennis matches...' }, { quoted: message });
        await sock.sendMessage(chatId, { text: '*🎾 TENNIS MATCHES*\n\nNo API available. Try .tennis [player name]' }, { quoted: message });
    } catch (error) {
        console.error('Error in tennis command:', error);
        await sock.sendMessage(chatId, { text: '❌ Error fetching tennis data' }, { quoted: message });
    }
}

module.exports = tennisCommand;