const fetch = require('node-fetch');

async function tiktokstalkCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const username = text.split(' ').slice(1).join(' ');
        
        if (!username) {
            await sock.sendMessage(chatId, { text: '❌ Usage: .tiktokstalk <username>' }, { quoted: message });
            return;
        }
        
        await sock.sendMessage(chatId, { text: '🔍 Fetching TikTok profile...' }, { quoted: message });
        const response = await fetch(`https://www.tiktok.com/api/user/detail/?uniqueId=${username}`);
        const data = await response.json();
        
        if (!data.userDetail) {
            await sock.sendMessage(chatId, { text: '❌ User not found' }, { quoted: message });
            return;
        }
        
        const user = data.userDetail.user;
        let result = '*🔍 TIKTOK PROFILE*\n\n';
        result += `👤 Username: @${user.uniqueId}\n`;
        result += `📝 Bio: ${user.signature || 'N/A'}\n`;
        result += `❤️ Followers: ${user.followerCount}\n`;
        result += `👁️ Views: ${user.heartCount}\n`;
        result += `📱 Videos: ${user.videoCount}\n`;
        
        await sock.sendMessage(chatId, { text: result }, { quoted: message });
    } catch (error) {
        console.error('Error in tiktokstalk command:', error);
        await sock.sendMessage(chatId, { text: '❌ Error fetching TikTok data' }, { quoted: message });
    }
}

module.exports = tiktokstalkCommand;