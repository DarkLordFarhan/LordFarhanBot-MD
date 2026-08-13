const axios = require('axios');

async function tennisCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { text: '🎾 Fetching tennis matches...' }, { quoted: message });
        const response = await axios.get(`https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${new Date().toISOString().slice(0,10)}&s=Tennis`, { timeout: 15000 });
        const matches = response.data?.events || [];
        const text = matches.length
            ? '*🎾 TENNIS MATCHES*\n\n' + matches.slice(0, 8).map((m, i) => `${i + 1}. *${m.strHomeTeam || 'Player 1'}* vs *${m.strAwayTeam || 'Player 2'}*\n${m.strStatus || 'Scheduled'}\n`).join('\n')
            : '*🎾 TENNIS MATCHES*\n\nNo tennis matches scheduled today.';
        await sock.sendMessage(chatId, { text }, { quoted: message });
    } catch (error) {
        console.error('Error in tennis command:', error);
        await sock.sendMessage(chatId, { text: '❌ Error fetching tennis data' }, { quoted: message });
    }
}

module.exports = tennisCommand;