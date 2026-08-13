async function goodnightCommand(sock, chatId, message) {
    try {
        const messages = [
            'Good night 🌙 May your dreams be peaceful and your morning bright.',
            'Sleep well and recharge. Tomorrow is another chance to shine. ✨',
            'Close your eyes, let the worries go, and have a beautiful night. 😴'
        ];
        const goodnightMessage = messages[Math.floor(Math.random() * messages.length)];

        // Send the goodnight message
        await sock.sendMessage(chatId, { text: goodnightMessage }, { quoted: message });
    } catch (error) {
        console.error('Error in goodnight command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to get goodnight message. Please try again later!' }, { quoted: message });
    }
}

module.exports = { goodnightCommand }; 