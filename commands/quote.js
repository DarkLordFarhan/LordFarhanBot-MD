const fetch = require('node-fetch');

module.exports = async function quoteCommand(sock, chatId, message) {
    try {
        let quoteMessage;
        try {
            const res = await fetch('https://api.quotable.io/random', { timeout: 12000 });
            const json = await res.json();
            if (json.content) quoteMessage = `“${json.content}”\n\n— ${json.author || 'Unknown'}`;
        } catch (_) {}
        if (!quoteMessage) {
            quoteMessage = '“Success is the sum of small efforts, repeated day in and day out.”\n\n— Robert Collier';
        }

        // Send the quote message
        await sock.sendMessage(chatId, { text: quoteMessage }, { quoted: message });
    } catch (error) {
        console.error('Error in quote command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to get quote. Please try again later!' }, { quoted: message });
    }
};
