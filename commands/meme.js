const fetch = require('node-fetch');

async function memeCommand(sock, chatId, message) {
    try {
        const response = await fetch('https://meme-api.com/gimme/wholesomememes', { timeout: 20000 });
        const data = await response.json();
        if (data?.url) {
            const imageResponse = await fetch(data.url, { timeout: 30000 });
            const imageBuffer = await imageResponse.buffer();
            
            const buttons = [
                { buttonId: '.meme', buttonText: { displayText: '🎭 Another Meme' }, type: 1 },
                { buttonId: '.joke', buttonText: { displayText: '😄 Joke' }, type: 1 }
            ];

            await sock.sendMessage(chatId, { 
                image: imageBuffer,
                caption: `> ${data.title || 'Here is your meme!'} 😂`,
                buttons: buttons,
                headerType: 1
            },{ quoted: message});
        } else throw new Error('Meme provider returned no image');
    } catch (error) {
        console.error('Error in meme command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Failed to fetch meme. Please try again later.'
        },{ quoted: message });
    }
}

module.exports = memeCommand;
