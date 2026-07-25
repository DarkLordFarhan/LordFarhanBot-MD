const fetch = require('node-fetch');

async function ipinfoCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const ip = text.split(' ').slice(1).join(' ');
        
        if (!ip) {
            await sock.sendMessage(chatId, { text: '❌ Usage: .ipinfo <IP>' }, { quoted: message });
            return;
        }
        
        await sock.sendMessage(chatId, { text: '🔍 Fetching IP information...' }, { quoted: message });
        const response = await fetch(`https://ipapi.co/${ip}/json/`);
        const data = await response.json();
        
        let result = '*📍 IP INFORMATION*\n\n';
        result += `🌐 IP: ${data.ip}\n`;
        result += `📍 Location: ${data.city}, ${data.region} (${data.country_name})\n`;
        result += `🗺️ Coordinates: ${data.latitude}, ${data.longitude}\n`;
        result += `🏢 ISP: ${data.org}\n`;
        result += `🕐 Timezone: ${data.timezone}\n`;
        
        await sock.sendMessage(chatId, { text: result }, { quoted: message });
    } catch (error) {
        console.error('Error in ipinfo command:', error);
        await sock.sendMessage(chatId, { text: '❌ Error fetching IP information' }, { quoted: message });
    }
}

module.exports = ipinfoCommand;