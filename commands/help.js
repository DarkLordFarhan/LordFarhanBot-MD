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
    const timeStr = now.format('hh:mm A');
    const dateStr = now.format('ddd, DD MMM YYYY');
    const mode = (settings.commandMode || 'public') === 'public' ? '🟢 Public' : '🔴 Private';
    const rawName = settings.botName || 'LordFarhan Bot';
    // Bot name: serif bold italic unicode + WhatsApp bold markdown
    const name = '*' + toSerifBold(rawName) + '*';
    const owner = settings.botOwner || 'DarkLord Farhan';
    const ver = settings.version || '3.0.7';

    const W = 34; // inner width
    const line = '═'.repeat(W);

    // Centre text inside box (raw = visual char count when unicode differs)
    const centre = (str, raw) => {
        const len = raw !== undefined ? raw : str.length;
        const pad = Math.max(0, W - len);
        const l = Math.floor(pad / 2);
        const r = pad - l;
        return '║' + ' '.repeat(l) + str + ' '.repeat(r) + '║';
    };
    // Left-align inside box
    const left = (str, rawLen) => {
        const len = rawLen !== undefined ? rawLen : str.length;
        const pad = Math.max(0, W - len);
        return '║  ' + str + ' '.repeat(Math.max(0, pad - 2)) + '║';
    };

    // Section header helper — emoji + serif-bold title
    const section = (emoji, title) => {
        const serif = toSerifBold(title);
        const raw = 2 + 2 + title.length; // emoji(2) + spaces(2) + title visual len
        return centre(emoji + '  ' + serif, raw);
    };

    const nameRawLen = rawName.length + 2; // +2 for * bold markers (not visible)

    const helpMessage =
`╔${line}╗
${centre('⚡  ' + name + '  ⚡', 6 + rawName.length)}
${centre('v' + ver + '  •  ' + owner)}
╠${line}╣
${centre('🕐 ' + timeStr + '   📅 ' + dateStr)}
${centre('🌍 Nairobi, Kenya   ' + mode)}
╚${line}╝

╔${line}╗
${section('🌐', 'General')}
╠${line}╣
${left('🕷️  .help')}
${left('🕷️  .alive')}
${left('🕷️  .ping')}
${left('🕷️  .owner')}
${left('🕷️  .tts')}
${left('🕷️  .weather')}
${left('🕷️  .news')}
${left('🕷️  .joke')}
${left('🕷️  .lyrics')}
${left('🕷️  .8ball')}
${left('🕷️  .attp')}
${left('🕷️  .quote')}
${left('🕷️  .fact')}
${left('🕷️  .ss')}
${left('🕷️  .jid')}
╚${line}╝

╔${line}╗
${section('👮', 'Admin')}
╠${line}╣
${left('🕷️  .ban')}
${left('🕷️  .kick')}
${left('🕷️  .promote')}
${left('🕷️  .demote')}
${left('🕷️  .mute')}
${left('🕷️  .unmute')}
${left('🕷️  .warn')}
${left('🕷️  .delete')}
${left('🕷️  .antilink')}
${left('🕷️  .antibadword')}
${left('🕷️  .antitag')}
${left('🕷️  .tag')}
${left('🕷️  .tagall')}
${left('🕷️  .hidetag')}
${left('🕷️  .chatbot')}
${left('🕷️  .welcome')}
${left('🕷️  .goodbye')}
${left('🕷️  .setgname')}
${left('🕷️  .setgdesc')}
╚${line}╝

╔${line}╗
${section('🔒', 'Owner')}
╠${line}╣
${left('🕷️  .mode')}
${left('🕷️  .settings')}
${left('🕷️  .autostatus')}
${left('🕷️  .autoreact')}
${left('🕷️  .autotyping')}
${left('🕷️  .autoread')}
${left('🕷️  .anticall')}
${left('🕷️  .pmblocker')}
${left('🕷️  .antidelete')}
╚${line}╝

╔${line}╗
${section('🎨', 'Media & Stickers')}
╠${line}╣
${left('🕷️  .sticker')}
${left('🕷️  .simage')}
${left('🕷️  .blur')}
${left('🕷️  .meme')}
${left('🕷️  .removebg')}
${left('🕷️  .remini')}
${left('🕷️  .emojimix')}
${left('🕷️  .tgsticker')}
╚${line}╝

╔${line}╗
${section('🤖', 'Artificial Intelligence')}
╠${line}╣
${left('🕷️  .gpt')}
${left('🕷️  .gemini')}
${left('🕷️  .imagine')}
${left('🕷️  .flux')}
${left('🕷️  .sora')}
╚${line}╝

╔${line}╗
${section('📥', 'Downloader')}
╠${line}╣
${left('🕷️  .play')}
${left('🕷️  .song')}
${left('🕷️  .video')}
${left('🕷️  .spotify')}
${left('🕷️  .tiktok')}
${left('🕷️  .instagram')}
${left('🕷️  .facebook')}
╚${line}╝

╔${line}╗
${section('🎮', 'Games & Fun')}
╠${line}╣
${left('🕷️  .tictactoe')}
${left('🕷️  .truth')}
${left('🕷️  .dare')}
${left('🕷️  .trivia')}
${left('🕷️  .ship')}
${left('🕷️  .hangman')}
╚${line}╝

╔${line}╗
${centre('💻  ' + toSerifBold('LordFarhanXMDTech'), 4 + 17)}
╚${line}╝`;

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
