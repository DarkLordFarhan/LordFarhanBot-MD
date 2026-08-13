async function rosedayCommand(sock, chatId, message) {
    try {
        const messages = [
            '🌹 A rose for someone who makes every day brighter.',
            '🌹 Love grows when it is shared. Happy Rose Day!',
            '🌹 May your life always be filled with the fragrance of happiness.'
        ];
        const rosedayMessage = messages[Math.floor(Math.random() * messages.length)];

        // Send the roseday message
        await sock.sendMessage(chatId, { text: rosedayMessage }, { quoted: message });
    } catch (error) {
        console.error('Error in roseday command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to get roseday quote. Please try again later!' }, { quoted: message });
    }
}

module.exports = { rosedayCommand };
