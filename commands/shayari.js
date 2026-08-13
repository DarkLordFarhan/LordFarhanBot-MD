const fetch = require('node-fetch');

async function shayariCommand(sock, chatId, message) {
    try {
        const verses = [
            'रात की खामोशी में भी एक आवाज़ आती है,\nतेरी याद हर पल मेरे पास आती है।',
            'कुछ रिश्ते बारिश की बूंदों जैसे होते हैं,\nछूते ही दिल को सुकून दे जाते हैं।',
            'मंज़िल उन्हीं को मिलती है जिनके सपनों में जान होती है।'
        ];
        const data = { result: verses[Math.floor(Math.random() * verses.length)] };

        const buttons = [
            { buttonId: '.shayari', buttonText: { displayText: 'Shayari 🪄' }, type: 1 },
            { buttonId: '.roseday', buttonText: { displayText: '🌹 RoseDay' }, type: 1 }
        ];

        await sock.sendMessage(chatId, { 
            text: data.result,
            buttons: buttons,
            headerType: 1
        }, { quoted: message });
    } catch (error) {
        console.error('Error in shayari command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Failed to fetch shayari. Please try again later.',
        }, { quoted: message });
    }
}

module.exports = { shayariCommand }; 