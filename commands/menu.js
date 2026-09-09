'use strict';

const fs = require('fs');
const path = require('path');
const settings = require('../settings');

// Keep the menu image in the repository so deployments do not depend on a
// third-party image host.
const MENU_IMAGE = path.join(__dirname, '..', 'assets', 'bot_image.jpg');
const OWNER_NAME = 'FÆRHÁÑ_MR $AVÆGÈ';

function command(name) {
    const prefix = global.prefix || settings.prefixChar || '.';
    return `${prefix}${name}`;
}

function getDateTime() {
    const timezone = settings.timezone || 'Africa/Nairobi';
    const now = new Date();

    return {
        day: new Intl.DateTimeFormat('en-KE', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            timeZone: timezone
        }).format(now),
        time: new Intl.DateTimeFormat('en-KE', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: timezone
        }).format(now)
    };
}

function getMenuText() {
    const botName = settings.botName || 'Lord Farhan MD';
    const version = settings.version || '3.0.7';
    const ownerNumber = settings.ownerNumber || '254795463911';
    const { day, time } = getDateTime();
    const p = (name) => command(name);

    return `
╭────────────────────────────╮
│  🌑  *${botName}*  🌑
│  ✨ *Version ${version}*
│  📅 *Day:* ${day}
│  🕒 *Time:* ${time} EAT
│  🌦️ *Weather:* ${p('weather')} <city>
│  👑 *Owner:* ${OWNER_NAME}
│  📞 *Owner number:* ${ownerNumber}
╰────────────────────────────╯

╭─〔 🌐 QUICK START 〕
│  ${p('menu')}
│  ${p('help')}
│  ${p('ping')}
│  ${p('alive')}
│  ${p('owner')}
│  ${p('groupinfo')}
╰────────────────────────────╯

╭─〔 👮 GROUP CARE 〕
│  ${p('warn')} @user
│  ${p('kick')} @user
│  ${p('ban')} @user
│  ${p('promote')} @user
│  ${p('demote')} @user
│  ${p('mute')} [minutes]
│  ${p('unmute')}
│  ${p('antilink')}
│  ${p('antibadword')}
│  ${p('tagall')}
│  ${p('hidetag')}
│  ${p('welcome')}
│  ${p('goodbye')}
╰────────────────────────────╯

╭─〔 🎨 MEDIA 〕
│  ${p('sticker')}
│  ${p('simage')}
│  ${p('meme')}
│  ${p('blur')}
│  ${p('removebg')}
│  ${p('remini')}
│  ${p('emojimix')}
│  ${p('tgsticker')}
╰────────────────────────────╯

╭─〔 🤖 AI & DOWNLOADS 〕
│  ${p('ai')}
│  ${p('gpt')}
│  ${p('gemini')}
│  ${p('imagine')}
│  ${p('flux')}
│  ${p('sora')}
│  ${p('play')}
│  ${p('song')}
│  ${p('video')}
│  ${p('tiktok')}
│  ${p('instagram')}
│  ${p('facebook')}
╰────────────────────────────╯

╭─〔 🎮 FUN & TOOLS 〕
│  ${p('tictactoe')}
│  ${p('truth')}
│  ${p('dare')}
│  ${p('hangman')}
│  ${p('joke')}
│  ${p('fact')}
│  ${p('quote')}
│  ${p('8ball')}
│  ${p('fancyfonts')} <text>
│  ${p('reverse')} <text>
│  ${p('upper')} <text>
│  ${p('lower')} <text>
│  ${p('calc')} <expression>
│  ${p('tts')} <text>
│  ${p('weather')} <city>
│  ${p('news')}
╰────────────────────────────╯

╭─〔 🔒 OWNER SETTINGS 〕
│  ${p('mode')}
│  ${p('settings')}
│  ${p('restart')}
│  ${p('autoread')}
│  ${p('autotyping')}
│  ${p('autostatus')}
│  ${p('anticall')}
│  ${p('pmblocker')}
│  ${p('antidelete')}
│  ${p('setbotpic')}
╰────────────────────────────╯

> 🛡️ Admin and owner commands are permission-checked.
> ⚡ Fast · reliable · deployment-friendly
`;
}

async function openMenu(sock, chatId, message) {
    const menu = getMenuText();

    try {
        if (!fs.existsSync(MENU_IMAGE)) throw new Error('Menu image is missing');
        await sock.sendMessage(
            chatId,
            { image: fs.readFileSync(MENU_IMAGE), caption: menu },
            { quoted: message }
        );
    } catch (error) {
        console.error('[menu] Could not send local image:', error.message);
        await sock.sendMessage(chatId, { text: menu }, { quoted: message });
    }
}

async function handleMenuNumber() {
    return false;
}

module.exports = {
    openMenu,
    handleMenuNumber,
    getMenuText
};