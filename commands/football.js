const fetch = require('node-fetch');

async function footballCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { text: '⚽ Fetching football scores...' }, { quoted: message });
        const response = await fetch('https://api.football-data.org/v4/matches?status=LIVE');
        const data = await response.json();
        
        if (!data.matches || data.matches.length === 0) {
            await sock.sendMessage(chatId, { text: '❌ No live matches found' }, { quoted: message });
            return;
        }
        
        let result = '*⚽ LIVE FOOTBALL SCORES*\n\n';
        data.matches.slice(0, 10).forEach(match => {
            result += `🏟️ ${match.homeTeam.name} vs ${match.awayTeam.name}\n`;
            result += `📊 ${match.score.fullTime.home || '-'} - ${match.score.fullTime.away || '-'}\n`;
            result += `🕐 Status: ${match.status}\n\n`;
        });
        
        await sock.sendMessage(chatId, { text: result }, { quoted: message });
    } catch (error) {
        console.error('Error in football command:', error);
        await sock.sendMessage(chatId, { text: '❌ Error fetching football scores' }, { quoted: message });
    }
}

module.exports = footballCommand;