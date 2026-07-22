const settings = require('../settings');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

// Times New Roman style — Mathematical Serif Bold Italic Unicode
function toSerifBold(text) {
    const map = {
        A:'𝑨',B:'𝑩',C:'𝑪',D:'𝑫',E:'𝑬',F:'𝑭',G:'𝑮',H:'𝑯',I:'𝑰',J:'𝑱',
        K:'𝑲',L:'𝑳',M:'𝑴',N:'𝑵',O:'𝑶',P:'𝑷',Q:'𝑸',R:'𝑹',S:'𝑺',T:'𝑻',
        U:'𝑼',V:'𝑽',W:'𝑾',X:'𝑿',Y:'𝒀',Z:'𝒁',
        a:'𝒂',b:'𝒃',c:'𝒄',d:'𝒅',e:'𝒆',f:'𝒇',g:'𝒈',h:'𝒉',i:'𝒊',j:'𝒋',
        k:'𝒌',l:'𝒍',m:'𝒎',n:'𝒏',o:'𝒐',p:'𝒑',q:'𝒒',r:'𝒓',s:'𝒔',t:'𝒕',
        u:'𝒖',v:'𝒗',w:'𝒘',x:'𝒙',y:'𝒚',z:'𝒛',
        ' ':' ','&':'&'
    };
    return text.split('').map(c => map[c] || c).join('');
}

async function helpCommand(sock, chatId, message) {
    const now = moment().tz('Africa/Nairobi');
    const timeStr = now.format('hh:mm:ss A');
    const dateStr = now.format('dddd, DD MMM YYYY');
    const mode = (settings.commandMode || 'public') === 'public' ? '🟢 Public' : '🔴 Private';
    const rawName = settings.botName || 'LordFarhan Bot';
    const owner = settings.botOwner || 'DarkLord Farhan';
    const ver = settings.version || '3.0.7';

    const bar = '─'.repeat(30);

    const helpMessage =
`┌${bar}┐
┃  *『 ${toSerifBold(rawName)} 』*
┃  ✂️  *Version:* ${ver}
┃  👑  *Owner:* ${owner}
┃  🕐  *Time:* ${timeStr}
┃  📅  *Date:* ${dateStr}
┃  🌍  *Zone:* Nairobi, Kenya (EAT)
┃  📶  *Mode:* ${mode}
└${bar}┘

*${toSerifBold('Available Commands')}:*

┌${bar}┐
🌐  *${toSerifBold('General Commands')}*
┃  🇰🇪  .help or .menu
┃  🇰🇪  .ping
┃  🇰🇪  .alive
┃  🇰🇪  .tts <text>
┃  🇰🇪  .owner
┃  🇰🇪  .joke
┃  🇰🇪  .quote
┃  🇰🇪  .fact
┃  🇰🇪  .weather <city>
┃  🇰🇪  .news
┃  🇰🇪  .attp <text>
┃  🇰🇪  .lyrics <song_title>
┃  🇰🇪  .8ball <question>
┃  🇰🇪  .groupinfo
┃  🇰🇪  .staff or .admins
┃  🇰🇪  .vv
┃  🇰🇪  .trt <text> <lang>
┃  🇰🇪  .ss <link>
┃  🇰🇪  .jid
└${bar}┘

┌${bar}┐
👮  *${toSerifBold('Admin Commands')}*
┃  🇰🇪  .ban @user
┃  🇰🇪  .promote @user
┃  🇰🇪  .demote @user
┃  🇰🇪  .mute <minutes>
┃  🇰🇪  .unmute
┃  🇰🇪  .delete or .del
┃  🇰🇪  .kick @user
┃  🇰🇪  .warn @user
┃  🇰🇪  .antilink
┃  🇰🇪  .antibadword
┃  🇰🇪  .antitag
┃  🇰🇪  .tag
┃  🇰🇪  .tagall
┃  🇰🇪  .hidetag
┃  🇰🇪  .chatbot
┃  🇰🇪  .welcome
┃  🇰🇪  .goodbye
┃  🇰🇪  .setgname
┃  🇰🇪  .setgdesc
└${bar}┘

┌${bar}┐
🔒  *${toSerifBold('Owner Commands')}*
┃  🇰🇪  .mode
┃  🇰🇪  .settings
┃  🇰🇪  .autostatus
┃  🇰🇪  .autoreact
┃  🇰🇪  .autotyping
┃  🇰🇪  .autoread
┃  🇰🇪  .anticall
┃  🇰🇪  .pmblocker
┃  🇰🇪  .antidelete
└${bar}┘

┌${bar}┐
🎨  *${toSerifBold('Media & Stickers')}*
┃  🇰🇪  .sticker
┃  🇰🇪  .simage
┃  🇰🇪  .blur
┃  🇰🇪  .meme
┃  🇰🇪  .removebg
┃  🇰🇪  .remini
┃  🇰🇪  .emojimix
┃  🇰🇪  .tgsticker
└${bar}┘

┌${bar}┐
🤖  *${toSerifBold('Artificial Intelligence')}*
┃  🇰🇪  .gpt
┃  🇰🇪  .gemini
┃  🇰🇪  .imagine
┃  🇰🇪  .flux
┃  🇰🇪  .sora
└${bar}┘

┌${bar}┐
📥  *${toSerifBold('Downloader')}*
┃  🇰🇪  .play
┃  🇰🇪  .song
┃  🇰🇪  .video
┃  🇰🇪  .spotify
┃  🇰🇪  .tiktok
┃  🇰🇪  .instagram
┃  🇰🇪  .facebook
└${bar}┘

┌${bar}┐
🎮  *${toSerifBold('Games & Fun')}*
┃  🇰🇪  .tictactoe
┃  🇰🇪  .truth
┃  🇰🇪  .dare
┃  🇰🇪  .trivia
┃  🇰🇪  .ship
┃  🇰🇪  .hangman
┃  🇰🇪  .coin / .flip
┃  🇰🇪  .dice / .roll
┃  🇰🇪  .rps <r/p/s>
┃  🇰🇪  .riddle
┃  🇰🇪  .wyr
┃  🇰🇪  .nhie
└${bar}┘

┌${bar}┐
✨  *${toSerifBold('Fancy Fonts')}*
┃  🇰🇪  .fancyfonts <text>
┃  🇰🇪  .ff bold <text>
┃  🇰🇪  .ff italic <text>
┃  🇰🇪  .ff script <text>
┃  🇰🇪  .ff boldscript <text>
┃  🇰🇪  .ff fraktur <text>
┃  🇰🇪  .ff doublestruck <text>
┃  🇰🇪  .ff bubble <text>
┃  🇰🇪  .ff square <text>
┃  🇰🇪  .ff aesthetic <text>
┃  🇰🇪  .ff smallcaps <text>
┃  🇰🇪  .ff upsidedown <text>
┃  🇰🇪  .ff mock <text>
┃  🇰🇪  .ff strikethrough <text>
┃  🇰🇪  .ff underline <text>
└${bar}┘

┌${bar}┐
🔤  *${toSerifBold('Text Tools')}*
┃  🇰🇪  .reverse / .rev <text>
┃  🇰🇪  .upper <text>
┃  🇰🇪  .lower <text>
┃  🇰🇪  .mock <text>
┃  🇰🇪  .clap <text>
┃  🇰🇪  .morse <text>
┃  🇰🇪  .binary <text>
┃  🇰🇪  .base64 <text>
┃  🇰🇪  .unbase64 <text>
┃  🇰🇪  .snake <text>
┃  🇰🇪  .camel <text>
┃  🇰🇪  .calc <expression>
┃  🇰🇪  .password <length>
└${bar}┘

┌${bar}┐
🎲  *${toSerifBold('Fun & Random')}*
┃  🇰🇪  .pickup
┃  🇰🇪  .roast
┃  🇰🇪  .yomama
┃  🇰🇪  .catfact / .cat
┃  🇰🇪  .dogfact / .dog
┃  🇰🇪  .motivate / .inspire
┃  🇰🇪  .zodiac <dd/mm>
┃  🇰🇪  .bmi <kg> <cm>
┃  🇰🇪  .numberfact <n>
┃  🇰🇪  .color
┃  🇰🇪  .uptime
└${bar}┘

> 💻 _${toSerifBold('LordFarhanXMDTech')}_`;

    try {
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
        if (fs.existsSync(imagePath)) {
            await sock.sendMessage(chatId, {
                image: fs.readFileSync(imagePath),
                caption: helpMessage
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: helpMessage }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, { text: helpMessage });
    }
}

module.exports = helpCommand;
