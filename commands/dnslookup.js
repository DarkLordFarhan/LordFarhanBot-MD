const fetch = require('node-fetch');

async function dnslookupCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const domain = text.split(' ').slice(1).join(' ');
        
        if (!domain) {
            await sock.sendMessage(chatId, { text: '❌ Usage: .dnslookup <domain>' }, { quoted: message });
            return;
        }
        
        await sock.sendMessage(chatId, { text: '🔍 Fetching DNS records...' }, { quoted: message });
        const response = await fetch(`https://dns.google/resolve?name=${domain}`);
        const data = await response.json();
        
        let result = '*🔍 DNS LOOKUP*\n\n';
        result += `📍 Domain: ${domain}\n`;
        
        if (data.Answer) {
            data.Answer.forEach(record => {
                result += `📌 ${record.name} (${record.type}): ${record.data}\n`;
            });
        } else {
            result += 'No DNS records found\n';
        }
        
        await sock.sendMessage(chatId, { text: result }, { quoted: message });
    } catch (error) {
        console.error('Error in dnslookup command:', error);
        await sock.sendMessage(chatId, { text: '❌ Error fetching DNS data' }, { quoted: message });
    }
}

module.exports = dnslookupCommand;