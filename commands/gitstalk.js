const fetch = require('node-fetch');

async function gitstalkCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const username = text.split(' ').slice(1).join(' ');
        
        if (!username) {
            await sock.sendMessage(chatId, { text: '❌ Usage: .gitstalk <username>' }, { quoted: message });
            return;
        }
        
        await sock.sendMessage(chatId, { text: '🔍 Fetching GitHub profile...' }, { quoted: message });
        const response = await fetch(`https://api.github.com/users/${username}`);
        const data = await response.json();
        
        if (data.message === 'Not Found') {
            await sock.sendMessage(chatId, { text: '❌ GitHub user not found' }, { quoted: message });
            return;
        }
        
        let result = '*🔍 GITHUB PROFILE*\n\n';
        result += `👤 Username: ${data.login}\n`;
        result += `📝 Name: ${data.name || 'N/A'}\n`;
        result += `📍 Location: ${data.location || 'N/A'}\n`;
        result += `📧 Email: ${data.email || 'N/A'}\n`;
        result += `👥 Followers: ${data.followers}\n`;
        result += `📌 Following: ${data.following}\n`;
        result += `📚 Public Repos: ${data.public_repos}\n`;
        result += `🔗 Profile: ${data.html_url}\n`;
        
        await sock.sendMessage(chatId, { text: result }, { quoted: message });
    } catch (error) {
        console.error('Error in gitstalk command:', error);
        await sock.sendMessage(chatId, { text: '❌ Error fetching GitHub data' }, { quoted: message });
    }
}

module.exports = gitstalkCommand;