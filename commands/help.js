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
        ' ':' '
    };
    return text.split('').map(c => map[c] || c).join('');
}

async function helpCommand(sock, chatId, message) {
    const now = moment().tz('Africa/Nairobi');
    const timeStr = now.format('hh:mm A');
    const dateStr = now.format('ddd, DD MMM YYYY');
    const mode = (settings.commandMode || 'public') === 'public' ? '🟢 Public' : '🔴 Private';
    const rawName = settings.botName || 'LordFarhan Bot';
    const name = toSerifBold(rawName);
    const owner = settings.botOwner || 'DarkLord Farhan';
    const ver = settings.version || '3.0.7';

    const W = 34; // inner width
    const line = '═'.repeat(W);
    const thin = '─'.repeat(W);

    // Helper: pad a string to inner width, centred
    const centre = (str, raw) => {
        const len = raw !== undefined ? raw : str.length;
        const pad = Math.max(0, W - len);
        const l = Math.floor(pad / 2);
        const r = pad - l;
        return '║' + ' '.repeat(l) + str + ' '.repeat(r) + '║';
    };
    // Helper: left-align
    const left = (str, rawLen) => {
        const len = rawLen !== undefined ? rawLen : str.length;
        const pad = Math.max(0, W - len);
        return '║  ' + str + ' '.repeat(Math.max(0, pad - 2)) + '║';
    };

    // Bot name raw length (Unicode serif chars display as 1 glyph each)
    const nameRawLen = rawName.length;

    const helpMessage =
`╔${line}╗
${centre('⚡  ' + name + '  ⚡', 6 + nameRawLen)}
${centre('v' + ver + '  •  ' + owner)}
╠${line}╣
${centre('🕐 ' + timeStr + '   📅 ' + dateStr)}
${centre('🌍 Nairobi, Kenya   ' + mode)}
╚${line}╝

╔${line}╗
${centre('🌐  G E N E R A L')}
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
${centre('👮  A D M I N')}
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
${centre('🔒  O W N E R')}
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
${centre('🎨  M E D I A  &  S T I C K E R S')}
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
${centre('🤖  A R T I F I C I A L  I N T E L L I G E N C E')}
╠${line}╣
${left('🕷️  .gpt')}
${left('🕷️  .gemini')}
${left('🕷️  .imagine')}
${left('🕷️  .flux')}
${left('🕷️  .sora')}
╚${line}╝

╔${line}╗
${centre('📥  D O W N L O A D E R')}
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
${centre('🎮  G A M E S  &  F U N')}
╠${line}╣
${left('🕷️  .tictactoe')}
${left('🕷️  .truth')}
${left('🕷️  .dare')}
${left('🕷️  .trivia')}
${left('🕷️  .ship')}
${left('🕷️  .hangman')}
╚${line}╝

╔${line}╗
${centre('💻  𝑳𝒐𝒓𝒅𝑭𝒂𝒓𝒉𝒂𝒏𝑿𝑴𝑫𝑻𝒆𝒄𝒉')}
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
