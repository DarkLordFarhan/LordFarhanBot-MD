'use strict';

const fs = require('fs');
const path = require('path');
const settings = require('../settings');

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

function section(title, entries) {
    return [
        `╭━━━〔 ${title} 〕━━━╮`,
        '┃',
        ...entries.map((entry) => `┃ 🔹 ${command(entry)}`),
        '╰━━━━━━━━━━━━━━━━━━━━╯'
    ].join('\n');
}

function getMenuIntro() {
    const botName = settings.botName || 'Lord Farhan MD';
    const version = settings.version || '3.0.7';
    const ownerNumber = settings.ownerNumber || '254795463911';
    const { day, time } = getDateTime();
    const mode = settings.commandMode === 'private' ? 'Private' : 'Public';

    return `
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃ 🌑  *${botName}*  🌑
┃ ✨ *Version:* ${version}
┃ 👑 *Owner:* ${OWNER_NAME}
┃ 🕒 *Time:* ${time} EAT
┃ 📅 *Date:* ${day}
┃ 🌐 *Zone:* Nairobi, Kenya (EAT)
┃ ⚙️ *Mode:* ${mode}
┃ 🌦️ *Weather:* ${command('weather')} <city>
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
}

function getCommandsText() {
    const sections = [
        section('🌐 GENERAL COMMANDS', [
            'help',
            'menu',
            'ping',
            'alive',
            'tts <text>',
            'owner',
            'joke',
            'quote',
            'fact',
            'weather <city>',
            'news',
            'attp <text>',
            'lyrics <song_title>',
            '8ball <question>',
            'groupinfo',
            'staff',
            'admins',
            'vv',
            'trt <text> <lang>',
            'ss <link>',
            'jid'
        ]),
        section('👮 ADMIN COMMANDS', [
            'ban @user',
            'unban @user',
            'promote @user',
            'demote @user',
            'mute <minutes>',
            'unmute',
            'delete',
            'del',
            'kick @user',
            'warn @user',
            'warnings',
            'antilink',
            'antibadword',
            'antitag',
            'tag',
            'tagall',
            'hidetag',
            'chatbot',
            'welcome',
            'goodbye',
            'setgname',
            'setgdesc'
        ]),
        section('🔒 OWNER COMMANDS', [
            'mode',
            'settings',
            'autostatus',
            'autoreact',
            'autotyping',
            'autoread',
            'anticall',
            'pmblocker',
            'antidelete',
            'antibot',
            'setstatusreact',
            'setbotpic',
            'restart'
        ]),
        section('🎨 MEDIA & STICKERS', [
            'sticker',
            's',
            'simage',
            'blur',
            'meme',
            'removebg',
            'remini',
            'emojimix',
            'tgsticker',
            'attp <text>',
            'take <name>',
            'stickerpack',
            'stickercrop'
        ]),
        section('🤖 ARTIFICIAL INTELLIGENCE', [
            'gpt',
            'gemini',
            'ai',
            'imagine',
            'flux',
            'sora',
            'cohere',
            'mistral',
            'moreai',
            'aimenu'
        ]),
        section('📥 DOWNLOADER', [
            'play <query>',
            'song <query>',
            'video <query>',
            'spotify <query>',
            'tiktok <url>',
            'tiktokstalk <username>',
            'instagram <url>',
            'igstalk <username>',
            'facebook <url>',
            'gif <query>'
        ]),
        section('🎮 GAMES & FUN', [
            'tictactoe',
            'truth',
            'dare',
            'trivia',
            'ship',
            'hangman',
            'coin',
            'flip',
            'dice',
            'roll',
            'rps <r/p/s>',
            'riddle',
            'wyr',
            'nhie',
            'compliment',
            'flirt',
            'insult',
            'simp',
            'stupid',
            'shayari',
            'roseday'
        ]),
        section('✨ FANCY FONTS', [
            'fancyfonts <text>',
            'ff bold <text>',
            'ff italic <text>',
            'ff script <text>',
            'ff boldscript <text>',
            'ff fraktur <text>',
            'ff doublestruck <text>',
            'ff bubble <text>',
            'ff square <text>',
            'ff aesthetic <text>',
            'ff smallcaps <text>',
            'ff upsidedown <text>',
            'ff mock <text>',
            'ff strikethrough <text>',
            'ff underline <text>'
        ]),
        section('🔤 TEXT TOOLS', [
            'reverse <text>',
            'rev <text>',
            'upper <text>',
            'lower <text>',
            'mock <text>',
            'clap <text>',
            'morse <text>',
            'binary <text>',
            'base64 <text>',
            'unbase64 <text>',
            'snake <text>',
            'camel <text>',
            'calc <expression>',
            'password <length>'
        ]),
        section('🎲 FUN & RANDOM', [
            'pickup',
            'roast',
            'yomama',
            'catfact',
            'cat',
            'dogfact',
            'dog',
            'motivate',
            'inspire',
            'zodiac <dd/mm>',
            'bmi <kg> <cm>',
            'numberfact <n>',
            'color',
            'uptime',
            'bf',
            'gf',
            'couple',
            'movie <title>',
            'trailer <title>',
            'genmusic <prompt>',
            'genlyrics <topic>',
            'goodmorning',
            'gm',
            'goodnight'
        ]),
        section('🛡️ GROUP MANAGEMENT+', [
            'add <number>',
            'leave',
            'creategroup',
            'promoteall',
            'demoteall',
            'kickall',
            'grouplink',
            'tagadmin',
            'getgpp',
            'antileave on/off',
            'gctime',
            'addbadword',
            'removebadword',
            'listbadword',
            'approveall',
            'rejectall',
            'disp',
            'fangtrace',
            'ex'
        ]),
        section('🤖 AUTO-MOD', [
            'automod',
            'antisticker',
            'antiimage',
            'antivideo',
            'antiaudio',
            'antimention',
            'antispam',
            'antigrouplink',
            'antidemote',
            'antipromote',
            'antistatusmention',
            'antigroupcall'
        ]),
        section('🧠 MORE AI MODELS', [
            'deepseek',
            'grok',
            'blackbox',
            'copilot',
            'bing',
            'claudeai',
            'bard',
            'groq',
            'metai',
            'perplexity',
            'wormgpt',
            'qwenai',
            'ilama',
            'venice',
            'wizard',
            'vicuna',
            'zephyr',
            'mixtral',
            'analyze',
            'humanizer',
            'summarize',
            'speechwriter',
            'vision',
            'totext'
        ]),
        section('🕵️ STALKER & INFO', [
            'igstalk',
            'tiktokstalk',
            'gitstalk',
            'twitterstalk',
            'ipstalk',
            'npmstalk',
            'wachannel',
            'stalkermenu'
        ]),
        section('🔐 SECURITY & NETWORK TOOLS', [
            'whois',
            'dnslookup',
            'subdomain',
            'reverseip',
            'geoip',
            'asnlookup',
            'portscan',
            'nmap',
            'pinghost',
            'traceroute',
            'sslcheck',
            'headers',
            'hashidentify',
            'hashcheck',
            'passwordstrength',
            'urlscan',
            'phishcheck',
            'techstack',
            'securitymenu'
        ]),
        section('🛠️ UTILITY+', [
            'wiki <query>',
            'define <word>',
            'covid <country>',
            'country <name>',
            'qr <text>',
            'shazam',
            'vcf <name> <number>',
            'remind <time> <text>',
            'sessioninfo',
            'iplookup',
            'getip',
            'platform',
            'github <query>',
            'dnslookup <host>'
        ]),
        section('👑 OWNER+', [
            'setbotname',
            'resetbotname',
            'about',
            'setowner',
            'resetowner',
            'iamowner',
            'broadcast',
            'bc',
            'shutdown',
            'disk',
            'hostip',
            'getsettings',
            'silent',
            'privacy',
            'lastseen',
            'setchannel',
            'setfooter',
            'test'
        ]),
        section('🏆 SPORTS', [
            'football',
            'matchstats',
            'teamnews',
            'sportsnews',
            'f1',
            'nfl',
            'mma',
            'baseball',
            'hockey',
            'golf',
            'sportsmenu',
            'basketball',
            'cricket',
            'tennis'
        ]),
        section('🎨 LOGO STUDIO', [
            'goldlogo',
            'silverlogo',
            'firelogo',
            'neonlogo',
            'icelogo',
            'dragonlogo',
            'rainbowlogo',
            'shadowlogo',
            'bloodlogo',
            'logomenu'
        ])
    ];

    return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*Available Commands:*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${sections.join('\n')}
`;
}

function getMenuText() {
    return `${getMenuIntro()}\n\n${getCommandsText()}`;
}

async function openMenu(sock, chatId, message) {
    const menu = getMenuText();

    try {
        if (!fs.existsSync(MENU_IMAGE)) throw new Error('Menu image is missing');
        const imageBuffer = fs.readFileSync(MENU_IMAGE);
        await sock.sendMessage(
            chatId,
            { image: imageBuffer, mimetype: 'image/jpeg', caption: menu },
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