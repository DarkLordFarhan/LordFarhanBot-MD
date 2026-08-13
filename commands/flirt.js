async function flirtCommand(sock, chatId, message) {
    try {
        const lines = [
            'Are you a magician? Whenever I see you, everyone else disappears. 😉',
            'I was going to send a clever pickup line, but your smile distracted me. 😊',
            'You must be Wi‑Fi, because I am feeling a connection. ✨',
            'If compliments were stars, you would have your own galaxy. 🌟'
        ];
        const flirtMessage = lines[Math.floor(Math.random() * lines.length)];

        // Send the flirt message
        await sock.sendMessage(chatId, { text: flirtMessage }, { quoted: message });
    } catch (error) {
        console.error('Error in flirt command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to get flirt message. Please try again later!' }, { quoted: message });
    }
}

module.exports = { flirtCommand }; 