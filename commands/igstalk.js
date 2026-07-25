const fetch = require('node-fetch');

async function igstalkCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const username = text.split(' ').slice(1).join(' ');
        
        if (!username) {
            await sock.sendMessage(chatId, { text: '❌ Usage: .igstalk <username>' }, { quoted: message });
            return;
        }
        
        await sock.sendMessage(chatId, { text: '🔍 Fetching Instagram profile...' }, { quoted: message });
        
        let result = '*🔍 INSTAGRAM STALKER*\n\n';
        result += `👤 Username: @${username}\n`;
        result += `📝 Feature coming soon...\n`;
        
        await sock.sendMessage(chatId, { text: result }, { quoted: message });
    } catch (error) {
        console.error('Error in igstalk command:', error);
        await sock.sendMessage(chatId, { text: '❌ Error fetching Instagram data' }, { quoted: message });
    }
}

module.exports = igstalkCommand;