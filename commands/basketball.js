const fetch = require('node-fetch');

async function basketballCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { text: '🏀 Fetching basketball scores...' }, { quoted: message });
        const response = await fetch('https://www.thesportsdb.com/api/v1/eventslast.php?idteam=133601');
        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
            await sock.sendMessage(chatId, { text: '❌ No basketball games found' }, { quoted: message });
            return;
        }
        
        let result = '*🏀 Basketball Scores*\n\n';
        data.results.slice(0, 5).forEach(game => {
            result += `🏀 ${game.strHomeTeam} vs ${game.strAwayTeam}\n`;
            result += `📊 ${game.intHomeScore} - ${game.intAwayScore}\n`;
            result += `📅 ${game.dateEvent}\n\n`;
        });
        
        await sock.sendMessage(chatId, { text: result }, { quoted: message });
    } catch (error) {
        console.error('Error in basketball command:', error);
        await sock.sendMessage(chatId, { text: '❌ Error fetching basketball scores' }, { quoted: message });
    }
}

module.exports = basketballCommand;