const fetch = require('node-fetch');

async function falconCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const query = text.split(' ').slice(1).join(' ');
        
        if (!query) {
            await sock.sendMessage(chatId, { text: '❌ Usage: .falcon <query>' }, { quoted: message });
            return;
        }
        
        await sock.sendMessage(chatId, { text: '🤖 Asking Falcon AI...' }, { quoted: message });
        const response = await fetch(`https://api.ryzendesu.vip/api/ai/falcon?text=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        let result = '*🦅 FALCON AI RESPONSE*\n\n';
        result += data.result || 'No response received';
        
        await sock.sendMessage(chatId, { text: result }, { quoted: message });
    } catch (error) {
        console.error('Error in falcon command:', error);
        await sock.sendMessage(chatId, { text: '❌ Error communicating with Falcon AI' }, { quoted: message });
    }
}

module.exports = falconCommand;