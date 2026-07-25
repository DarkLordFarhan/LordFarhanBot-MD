const fetch = require('node-fetch');

async function whoisCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const domain = text.split(' ').slice(1).join(' ');
        
        if (!domain) {
            await sock.sendMessage(chatId, { text: '❌ Usage: .whois <domain>' }, { quoted: message });
            return;
        }
        
        await sock.sendMessage(chatId, { text: '🔍 Fetching WHOIS data...' }, { quoted: message });
        const response = await fetch(`https://api.whoisxmlapi.com/v1?domain=${domain}&apiKey=demo`);
        const data = await response.json();
        
        let result = '*🔍 WHOIS INFORMATION*\n\n';
        result += `📍 Domain: ${data.domain}\n`;
        result += `🏢 Registrar: ${data.registrar || 'N/A'}\n`;
        result += `📅 Created: ${data.createdDate || 'N/A'}\n`;
        result += `🔄 Updated: ${data.updatedDate || 'N/A'}\n`;
        result += `⏰ Expires: ${data.expiresDate || 'N/A'}\n`;
        
        await sock.sendMessage(chatId, { text: result }, { quoted: message });
    } catch (error) {
        console.error('Error in whois command:', error);
        await sock.sendMessage(chatId, { text: '❌ Error fetching WHOIS data' }, { quoted: message });
    }
}

module.exports = whoisCommand;