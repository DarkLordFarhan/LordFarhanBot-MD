const fetch = require('node-fetch');

async function cricketCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { text: '🏏 Fetching cricket scores...' }, { quoted: message });
        const response = await fetch('https://api.cricapi.com/v1/currentMatches?apikey=demo');
        const data = await response.json();
        
        if (!data.data || data.data.length === 0) {
            await sock.sendMessage(chatId, { text: '❌ No cricket matches found' }, { quoted: message });
            return;
        }
        
        let result = '*🏏 CRICKET SCORES*\n\n';
        data.data.slice(0, 5).forEach(match => {
            result += `🏟️ ${match.t1} vs ${match.t2}\n`;
            result += `📊 Status: ${match.status}\n`;
            result += `🎯 Type: ${match.matchType}\n\n`;
        });
        
        await sock.sendMessage(chatId, { text: result }, { quoted: message });
    } catch (error) {
        console.error('Error in cricket command:', error);
        await sock.sendMessage(chatId, { text: '❌ Error fetching cricket scores' }, { quoted: message });
    }
}

module.exports = cricketCommand;