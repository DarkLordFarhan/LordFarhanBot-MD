'use strict';

const fs = require('fs');
const path = require('path');
const settings = require('../settings');

// Keep the menu image in the repository. A remote image made the menu fail
// when the image host was unavailable and made deployments depend on a third
// party URL.
const MENU_IMAGE = path.join(__dirname, '..', 'assets', 'bot_image.jpg');

function command(name) {
    const prefix = global.prefix || settings.prefixChar || '.';
    return `${prefix}${name}`;
}

function getMenuText() {
    const botName = settings.botName || 'Lord Farhan MD';
    const version = settings.version || '3.0.7';
    const p = (name) => command(name);

    return `
╭────────────────────────────╮
│  🌑  *${botName}*  🌑
│  ✨ *Version ${version}* · ready to help
╰────────────────────────────╯

╭─〔 🌐 QUICK START 〕
│  ${p('menu')} / ${p('help')}  · show this menu
│  ${p('ping')} / ${p('alive')}  · check status
│  ${p('owner')}              · contact owner
│  ${p('groupinfo')}          · group details
╰────────────────────────────╯

╭─〔 👮 GROUP CARE 〕
│  ${p('warn')} @user       ${p('kick')} @user
│  ${p('ban')} @user        ${p('promote')} @user
│  ${p('demote')} @user     ${p('mute')} [minutes]
│  ${p('antilink')}         ${p('antibadword')}
│  ${p('tagall')} / ${p('hidetag')} · mention tools
│  ${p('welcome')} / ${p('goodbye')}
╰────────────────────────────╯

╭─〔 🎨 MEDIA 〕
│  ${p('sticker')} · make a sticker from an image/video
│  ${p('simage')}  · turn a sticker into an image
│  ${p('meme')} · ${p('blur')} · ${p('removebg')}
│  ${p('remini')} · ${p('emojimix')} · ${p('tgsticker')}
╰────────────────────────────╯

╭─〔 🤖 AI & DOWNLOADS 〕
│  ${p('ai')} / ${p('gpt')} / ${p('gemini')}
│  ${p('imagine')} / ${p('flux')} / ${p('sora')}
│  ${p('play')} / ${p('song')} / ${p('video')}
│  ${p('tiktok')} / ${p('instagram')} / ${p('facebook')}
╰────────────────────────────╯

╭─〔 🎮 FUN & TOOLS 〕
│  ${p('tictactoe')} · ${p('truth')} · ${p('dare')} · ${p('hangman')}
│  ${p('joke')} · ${p('fact')} · ${p('quote')} · ${p('8ball')}
│  ${p('fancyfonts')} <text> · ${p('reverse')} <text>
│  ${p('upper')} <text> · ${p('lower')} <text> · ${p('calc')} <expression>
│  ${p('tts')} <text> · ${p('weather')} <city> · ${p('news')}
╰────────────────────────────╯

╭─〔 🔒 OWNER SETTINGS 〕
│  ${p('mode')} · ${p('settings')} · ${p('restart')}
│  ${p('autoread')} · ${p('autotyping')} · ${p('autostatus')}
│  ${p('anticall')} · ${p('pmblocker')} · ${p('antidelete')}
│  ${p('setbotpic')}  · reply to a photo to change this image
╰────────────────────────────╯

> 🛡️ Admin/owner commands are permission-checked.
> ⚡ Fast · reliable · deployment-friendly
> 💜 Built for responsible WhatsApp automation
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