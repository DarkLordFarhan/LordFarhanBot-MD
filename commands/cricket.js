const axios = require('axios');

async function cricketCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { text: '🏏 Fetching cricket scores...' }, { quoted: message });
        let matches = [];
        try {
            const r = await axios.get(`https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${new Date().toISOString().slice(0,10)}&s=Cricket`, { timeout: 15000 });
            matches = r.data?.events || [];
        } catch (_) {}
        if (!matches.length) {
            const response = await axios.get('https://api.cricapi.com/v1/currentMatches?apikey=a52ea237-09e7-4d69-b7cc-e4f0e2a8b060', { timeout: 15000 });
            matches = response.data?.data || [];
        }
        
        if (!matches.length) {
            await sock.sendMessage(chatId, { text: '❌ No cricket matches found' }, { quoted: message });
            return;
        }
        
        let result = '*🏏 CRICKET SCORES*\n\n';
        matches.slice(0, 5).forEach(match => {
            result += `🏟️ ${match.t1 || match.strHomeTeam} vs ${match.t2 || match.strAwayTeam}\n`;
            result += `📊 Status: ${match.status}\n`;
            result += `🎯 Type: ${match.matchType || match.strLeague || 'Cricket'}\n\n`;
        });
        
        await sock.sendMessage(chatId, { text: result }, { quoted: message });
    } catch (error) {
        console.error('Error in cricket command:', error);
        await sock.sendMessage(chatId, { text: '❌ Error fetching cricket scores' }, { quoted: message });
    }
}

module.exports = cricketCommand;