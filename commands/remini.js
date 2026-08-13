const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { uploadImage } = require('../lib/uploadImage');

async function getQuotedOrOwnImageUrl(sock, message) {
    // 1) Quoted image (highest priority)
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (quoted?.imageMessage) {
        const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        return await uploadImage(buffer);
    }

    // 2) Image in the current message
    if (message.message?.imageMessage) {
        const stream = await downloadContentFromMessage(message.message.imageMessage, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        return await uploadImage(buffer);
    }

    return null;
}

async function reminiCommand(sock, chatId, message, args) {
    try {
        let imageUrl = null;
        
        // Check if args contain a URL
        if (args.length > 0) {
            const url = args.join(' ');
            if (isValidUrl(url)) {
                imageUrl = url;
            } else {
                return sock.sendMessage(chatId, { 
                    text: '❌ Invalid URL provided.\n\nUsage: `.remini https://example.com/image.jpg`' 
                }, { quoted: message });
            }
        } else {
            // Try to get image from message or quoted message
            imageUrl = await getQuotedOrOwnImageUrl(sock, message);
            
            if (!imageUrl) {
                return sock.sendMessage(chatId, { 
                    text: '📸 *Remini AI Enhancement Command*\n\nUsage:\n• `.remini <image_url>`\n• Reply to an image with `.remini`\n• Send image with `.remini`\n\nExample: `.remini https://example.com/image.jpg`' 
                }, { quoted: message });
            }
        }

        // Try multiple public image-enhancement providers.
        const providers = [
            () => axios.get(`https://api.princetechn.com/api/tools/remini?apikey=prince_tech_api_azfsbshfb&url=${encodeURIComponent(imageUrl)}`, { timeout: 60000, headers: { 'User-Agent': 'Mozilla/5.0' } }),
            () => axios.get(`https://api.siputzx.my.id/api/tools/remini?image=${encodeURIComponent(imageUrl)}`, { timeout: 60000, headers: { 'User-Agent': 'Mozilla/5.0' } })
        ];
        let result;
        for (const provider of providers) {
            try {
                const response = await provider();
                const data = response.data;
                const candidate = data?.result || data?.data || data;
                if (candidate && (candidate.image_url || candidate.url || candidate.image)) {
                    result = candidate;
                    break;
                }
            } catch (_) {}
        }
        if (result) {
            
            const enhancedUrl = result.image_url || result.url || result.image;
            if (enhancedUrl) {
                // Download the enhanced image
                const imageResponse = await axios.get(enhancedUrl, {
                    responseType: 'arraybuffer',
                    timeout: 30000
                });
                
                if (imageResponse.status === 200 && imageResponse.data) {
                    // Send the enhanced image
                    await sock.sendMessage(chatId, {
                        image: imageResponse.data,
                        caption: '✨ *Image enhanced successfully!*\n\n𝗘𝗡𝗛𝗔𝗡𝗖𝗘𝗗 𝗕𝗬 𝗟𝗼𝗿𝗱𝗕𝗢𝗧𝘀'
                    }, { quoted: message });
                } else {
                    throw new Error('Failed to download enhanced image');
                }
            } else {
                throw new Error(result.message || 'Failed to enhance image');
            }
        } else throw new Error('All image enhancement providers failed');

    } catch (error) {
        console.error('Remini Error:', error.message);
        
        let errorMessage = '❌ Failed to enhance image.';
        
        if (error.response?.status === 429) {
            errorMessage = '⏰ Rate limit exceeded. Please try again later.';
        } else if (error.response?.status === 400) {
            errorMessage = '❌ Invalid image URL or format.';
        } else if (error.response?.status === 500) {
            errorMessage = '🔧 Server error. Please try again later.';
        } else if (error.code === 'ECONNABORTED') {
            errorMessage = '⏰ Request timeout. Please try again.';
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
            errorMessage = '🌐 Network error. Please check your connection.';
        } else if (error.message.includes('Error processing image')) {
            errorMessage = '❌ Image processing failed. Please try with a different image.';
        }
        
        await sock.sendMessage(chatId, { 
            text: errorMessage 
        }, { quoted: message });
    }
}

// Helper function to validate URL
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

module.exports = { reminiCommand };
