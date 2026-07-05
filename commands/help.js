const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message) {
    const helpMessage = `
╔▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄╗
║  🖤 *${settings.botName || 'LordFarhan Bot'}* 🖤
║  ⚔️  Version: *${settings.version || '3.0.0'}*
║  👑 ${settings.botOwner || 'DarkLordFarhanXMDTech'}
╚▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀╝

*𝕬𝖛𝖆𝖎𝖑𝖆𝖇𝖑𝖊 𝕮𝖔𝖒𝖒𝖆𝖓𝖉𝖘:*

╔═══════════════════╗
🌐 *𝕲𝖊𝖓𝖊𝖗𝖆𝖑 𝕮𝖔𝖒𝖒𝖆𝖓𝖉𝖘*
║ 🦠 .help or .menu
║ 🦠 .ping
║ 🦠 .alive
║ 🦠 .tts <text>
║ 🦠 .owner
║ 🦠 .joke
║ 🦠 .quote
║ 🦠 .fact
║ 🦠 .weather <city>
║ 🦠 .news
║ 🦠 .attp <text>
║ 🦠 .lyrics <song_title>
║ 🦠 .8ball <question>
║ 🦠 .groupinfo
║ 🦠 .staff or .admins
║ 🦠 .vv
║ 🦠 .trt <text> <lang>
║ 🦠 .ss <link>
║ 🦠 .jid
║ 🦠 .url
╚═══════════════════╝

╔═══════════════════╗
👮‍♂️ *𝕬𝖉𝖒𝖎𝖓 𝕮𝖔𝖒𝖒𝖆𝖓𝖉𝖘*
║ 🦠 .ban @user
║ 🦠 .promote @user
║ 🦠 .demote @user
║ 🦠 .mute <minutes>
║ 🦠 .unmute
║ 🦠 .delete or .del
║ 🦠 .kick @user
║ 🦠 .warnings @user
║ 🦠 .warn @user
║ 🦠 .antilink
║ 🦠 .antibadword
║ 🦠 .clear
║ 🦠 .tag <message>
║ 🦠 .tagall
║ 🦠 .tagnotadmin
║ 🦠 .hidetag <message>
║ 🦠 .chatbot
║ 🦠 .resetlink
║ 🦠 .antitag <on/off>
║ 🦠 .welcome <on/off>
║ 🦠 .goodbye <on/off>
║ 🦠 .setgdesc <description>
║ 🦠 .setgname <new name>
║ 🦠 .setgpp (reply to image)
╚═══════════════════╝

╔═══════════════════╗
🔒 *𝕺𝖜𝖓𝖊𝖗 𝕮𝖔𝖒𝖒𝖆𝖓𝖉𝖘*
║ 🦠 .mode <public/private>
║ 🦠 .clearsession
║ 🦠 .antidelete
║ 🦠 .cleartmp
║ 🦠 .update
║ 🦠 .settings
║ 🦠 .setpp <reply to image>
║ 🦠 .autoreact <on/off>
║ 🦠 .autostatus <on/off>
║ 🦠 .autotyping <on/off>
║ 🦠 .autoread <on/off>
║ 🦠 .anticall <on/off>
║ 🦠 .pmblocker <on/off/status>
║ 🦠 .setmention <reply to msg>
║ 🦠 .mention <on/off>
╚═══════════════════╝

╔═══════════════════╗
🎨 *𝕴𝖒𝖆𝖌𝖊/𝕾𝖙𝖎𝖈𝖐𝖊𝖗 𝕮𝖔𝖒𝖒𝖆𝖓𝖉𝖘*
║ 🦠 .blur <image>
║ 🦠 .simage <reply to sticker>
║ 🦠 .sticker <reply to image>
║ 🦠 .removebg
║ 🦠 .remini
║ 🦠 .crop <reply to image>
║ 🦠 .tgsticker <Link>
║ 🦠 .meme
║ 🦠 .take <packname>
║ 🦠 .emojimix <emj1>+<emj2>
║ 🦠 .igs <insta link>
╚═══════════════════╝

╔═══════════════════╗
🖼️ *𝕻𝖎𝖊𝖘 𝕮𝖔𝖒𝖒𝖆𝖓𝖉𝖘*
║ 🦠 .pies <country>
║ 🦠 .china
║ 🦠 .indonesia
║ 🦠 .japan
║ 🦠 .korea
║ 🦠 .malaysia
╚═══════════════════╝

╔═══════════════════╗
🎮 *𝕲𝖆𝖒𝖊 𝕮𝖔𝖒𝖒𝖆𝖓𝖉𝖘*
║ 🦠 .tictactoe @user
║ 🦠 .hangman
║ 🦠 .guess <letter>
║ 🦠 .trivia
║ 🦠 .answer <answer>
║ 🦠 .truth
║ 🦠 .dare
╚═══════════════════╝

╔═══════════════════╗
🤖 *𝕬𝕴 𝕮𝖔𝖒𝖒𝖆𝖓𝖉𝖘*
║ 🦠 .gpt <question>
║ 🦠 .gemini <question>
║ 🦠 .imagine <prompt>
║ 🦠 .flux <prompt>
║ 🦠 .sora <prompt>
╚═══════════════════╝

╔═══════════════════╗
🎯 *𝕱𝖚𝖓 𝕮𝖔𝖒𝖒𝖆𝖓𝖉𝖘*
║ 🦠 .compliment @user
║ 🦠 .insult @user
║ 🦠 .flirt
║ 🦠 .shayari
║ 🦠 .goodnight
║ 🦠 .roseday
║ 🦠 .character @user
║ 🦠 .wasted @user
║ 🦠 .ship @user
║ 🦠 .simp @user
║ 🦠 .stupid @user [text]
╚═══════════════════╝

╔═══════════════════╗
📥 *𝕯𝖔𝖜𝖓𝖑𝖔𝖆𝖉𝖊𝖗*
║ 🦠 .play <song_name>
║ 🦠 .song <song_name>
║ 🦠 .spotify <query>
║ 🦠 .instagram <link>
║ 🦠 .facebook <link>
║ 🦠 .tiktok <link>
║ 🦠 .video <song name>
╚═══════════════════╝

╔═══════════════════╗
💻 *𝕲𝖎𝖙𝖍𝖚𝖇 𝕮𝖔𝖒𝖒𝖆𝖓𝖉𝖘*
║ 🦠 .git
║ 🦠 .github
╚═══════════════════╝
`;

    try {
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
        
        if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: helpMessage,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true
                }
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, {
                text: helpMessage,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true
                }
            }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, { text: helpMessage });
    }
}

module.exports = helpCommand;
