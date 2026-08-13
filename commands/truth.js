async function truthCommand(sock, chatId, message) {
    try {
        const truths = [
            'What is the most embarrassing thing you have done recently?',
            'Who was the last person you searched for online?',
            'What is one secret talent you have?',
            'What is the strangest dream you remember?',
            'What is one thing you would change about yourself?'
        ];
        const truthMessage = '💬 *TRUTH*\n\n' + truths[Math.floor(Math.random() * truths.length)];

        // Send the truth message
        await sock.sendMessage(chatId, { text: truthMessage }, { quoted: message });
    } catch (error) {
        console.error('Error in truth command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to get truth. Please try again later!' }, { quoted: message });
    }
}

module.exports = { truthCommand };
