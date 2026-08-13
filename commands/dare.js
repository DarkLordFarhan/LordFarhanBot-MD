async function dareCommand(sock, chatId, message) {
    try {
        const dares = [
            'Send a funny voice note using your best celebrity impression.',
            'Change your profile picture to a cartoon for 10 minutes.',
            'Compliment the last person you chatted with.',
            'Send a selfie with your funniest facial expression.',
            'Type your next message with your eyes closed.'
        ];
        const dareMessage = '🎯 *DARE*\n\n' + dares[Math.floor(Math.random() * dares.length)];

        // Send the dare message
        await sock.sendMessage(chatId, { text: dareMessage }, { quoted: message });
    } catch (error) {
        console.error('Error in dare command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to get dare. Please try again later!' }, { quoted: message });
    }
}

module.exports = { dareCommand };
