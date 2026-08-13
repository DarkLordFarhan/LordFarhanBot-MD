const axios = require('axios');

async function whoisCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const domain = text.split(' ').slice(1).join(' ');
        
        if (!domain) {
            await sock.sendMessage(chatId, { text: '❌ Usage: .whois <domain>' }, { quoted: message });
            return;
        }
        
        await sock.sendMessage(chatId, { text: '🔍 Fetching WHOIS data...' }, { quoted: message });
        const response = await axios.get(`https://api.hackertarget.com/whois/?q=${encodeURIComponent(domain)}`, { timeout: 15000 });
        const raw = String(response.data || '');
        if (!raw || /error/i.test(raw)) throw new Error('WHOIS lookup unavailable');
        const find = (...keys) => {
            const line = raw.split('\n').find(l => keys.some(k => l.toLowerCase().startsWith(k.toLowerCase())));
            return line ? line.split(':').slice(1).join(':').trim() : 'N/A';
        };
        
        let result = '*🔍 WHOIS INFORMATION*\n\n';
        result += `📍 Domain: ${domain}\n`;
        result += `🏢 Registrar: ${find('registrar')}\n`;
        result += `📅 Created: ${find('creation date', 'created')}\n`;
        result += `🔄 Updated: ${find('updated date', 'updated')}\n`;
        result += `⏰ Expires: ${find('expiry date', 'expiration date', 'registry expiry')}\n`;
        
        await sock.sendMessage(chatId, { text: result }, { quoted: message });
    } catch (error) {
        console.error('Error in whois command:', error);
        await sock.sendMessage(chatId, { text: '❌ Error fetching WHOIS data' }, { quoted: message });
    }
}

module.exports = whoisCommand;