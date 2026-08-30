'use strict';

const axios = require('axios');

const sessions = new Map();

/*
 * Change this URL later if you want another menu image.
 */
const MENU_IMAGE_URL =
    'https://github.com/DarkLordFarhan.png?size=512';

const CATEGORIES = {

    1: {
        name: '🌐 GENERAL',
        commands: [
            ['weather', '.weather <city>'],
            ['news', '.news'],
            ['attp', '.attp <text>'],
            ['lyrics', '.lyrics <song_title>'],
            ['8ball', '.8ball <question>'],
            ['groupinfo', '.groupinfo'],
            ['staff', '.staff'],
            ['vv', '.vv'],
            ['translate', '.trt <text> <lang>'],
            ['ss', '.ss <link>'],
            ['jid', '.jid']
        ]
    },

    2: {
        name: '👮 ADMIN COMMANDS',
        commands: [
            ['ban', '.ban @user'],
            ['promote', '.promote @user'],
            ['demote', '.demote @user'],
            ['mute', '.mute <minutes>'],
            ['unmute', '.unmute'],
            ['delete', '.delete / .del'],
            ['kick', '.kick @user'],
            ['warn', '.warn @user'],
            ['antilink', '.antilink'],
            ['antibadword', '.antibadword'],
            ['antitag', '.antitag'],
            ['tag', '.tag'],
            ['tagall', '.tagall'],
            ['hidetag', '.hidetag'],
            ['chatbot', '.chatbot'],
            ['welcome', '.welcome'],
            ['goodbye', '.goodbye'],
            ['setname', '.setgname'],
            ['setdesc', '.setgdesc']
        ]
    },

    3: {
        name: '🔒 OWNER COMMANDS',
        commands: [
            ['mode', '.mode'],
            ['settings', '.settings'],
            ['autostatus', '.autostatus'],
            ['autoreact', '.autoreact'],
            ['autotyping', '.autotyping'],
            ['autoread', '.autoread'],
            ['anticall', '.anticall'],
            ['pmblocker', '.pmblocker'],
            ['antidelete', '.antidelete'],
            ['clearsession', '.clearsession'],
            ['cleartmp', '.cleartmp'],
            ['restart', '.restart'],
            ['shutdown', '.shutdown'],
            ['sudo', '.sudo'],
            ['pair', '.pair']
        ]
    },

    4: {
        name: '🎨 MEDIA & STICKERS',
        commands: [
            ['sticker', '.sticker'],
            ['simage', '.simage'],
            ['blur', '.blur'],
            ['meme', '.meme'],
            ['removebg', '.removebg'],
            ['remini', '.remini'],
            ['emojimix', '.emojimix'],
            ['tgsticker', '.tgsticker'],
            ['take', '.take'],
            ['attp', '.attp']
        ]
    },

    5: {
        name: '🤖 ARTIFICIAL INTELLIGENCE',
        commands: [
            ['gpt', '.gpt'],
            ['ai', '.ai'],
            ['deepseek', '.deepseek'],
            ['grok', '.grok'],
            ['groq', '.groq'],
            ['copilot', '.copilot'],
            ['claude', '.claude'],
            ['perplexity', '.perplexity'],
            ['qwen', '.qwen'],
            ['vision', '.vision'],
            ['imagine', '.imagine'],
            ['sora', '.sora'],
            ['summarize', '.summarize'],
            ['humanizer', '.humanizer']
        ]
    },

    6: {
        name: '📥 DOWNLOADER',
        commands: [
            ['play', '.play'],
            ['song', '.song'],
            ['video', '.video'],
            ['spotify', '.spotify'],
            ['tiktok', '.tiktok'],
            ['tiktokstalk', '.tiktokstalk <username>'],
            ['instagram', '.instagram'],
            ['igstalk', '.igstalk <username>'],
            ['facebook', '.facebook'],
            ['url', '.url'],
            ['ss', '.ss <link>']
        ]
    },

    7: {
        name: '🎮 GAMES & FUN',
        commands: [
            ['tictactoe', '.tictactoe'],
            ['truth', '.truth'],
            ['dare', '.dare'],
            ['trivia', '.trivia'],
            ['ship', '.ship'],
            ['hangman', '.hangman'],
            ['coin', '.coin / .flip'],
            ['dice', '.dice / .roll'],
            ['rps', '.rps <r/p/s>'],
            ['riddle', '.riddle'],
            ['wyr', '.wyr'],
            ['nhie', '.nhie'],
            ['flirt', '.flirt'],
            ['simp', '.simp'],
            ['roast', '.roast']
        ]
    },

    8: {
        name: '✨ FANCY FONTS',
        commands: [
            ['fancyfonts', '.fancyfonts <text>'],
            ['ff bold', '.ff bold <text>'],
            ['ff italic', '.ff italic <text>'],
            ['ff script', '.ff script <text>'],
            ['ff boldscript', '.ff boldscript <text>'],
            ['ff fraktur', '.ff fraktur <text>'],
            ['ff doublestruck', '.ff doublestruck <text>'],
            ['ff bubble', '.ff bubble <text>'],
            ['ff square', '.ff square <text>'],
            ['ff aesthetic', '.ff aesthetic <text>'],
            ['ff smallcaps', '.ff smallcaps <text>'],
            ['ff upsidedown', '.ff upsidedown <text>'],
            ['ff mock', '.ff mock <text>'],
            ['ff strikethrough', '.ff strikethrough <text>'],
            ['ff underline', '.ff underline <text>']
        ]
    },

    9: {
        name: '🔤 TEXT TOOLS',
        commands: [
            ['reverse', '.reverse / .rev <text>'],
            ['upper', '.upper <text>'],
            ['lower', '.lower <text>'],
            ['mock', '.mock <text>'],
            ['clap', '.clap <text>'],
            ['more', '.more <text>'],
            ['binary', '.binary <text>'],
            ['base64', '.base64 <text>'],
            ['unbase64', '.unbase64 <text>'],
            ['snake', '.snake <text>'],
            ['camel', '.camel <text>'],
            ['calc', '.calc <expression>'],
            ['password', '.password <length>']
        ]
    }
};

function sessionKey(chatId, message) {
    return `${chatId}:${message?.key?.participant || 'private'}`;
}

function rootMenu() {
    return `
╭──────────────────────────╮
│ 🌑 *LORD FARHAN MD*      │
│                          │
│      📚 *MAIN MENU*      │
╰──────────────────────────╯

┌─〔 📂 CATEGORIES 〕
│
│ 🔹 1. 🌐 General
│ 🔹 2. 👮 Admin Commands
│ 🔹 3. 🔒 Owner Commands
│ 🔹 4. 🎨 Media & Stickers
│ 🔹 5. 🤖 Artificial Intelligence
│ 🔹 6. 📥 Downloader
│ 🔹 7. 🎮 Games & Fun
│ 🔹 8. ✨ Fancy Fonts
│ 🔹 9. 🔤 Text Tools
│
└──────────────────────────

💬 *Reply with a number to open a category.*

0️⃣ Close

🤖 *LORD FARHAN MD*
`;
}

function categoryMenu(id) {
    const category = CATEGORIES[id];

    if (!category) return rootMenu();

    let out = `
╭──────────────────────────╮
│ ${category.name}
╰──────────────────────────╯

`;

    category.commands.forEach((cmd, index) => {
        out += `│ 🔹 ${index + 1}. ${cmd[1]}\n`;
    });

    out += `
└──────────────────────────

0️⃣ Back
00️⃣ Close

💬 *Reply with a number to use a command.*
`;

    return out;
}

async function getMenuImage() {
    try {
        const response = await axios.get(
            MENU_IMAGE_URL,
            {
                responseType: 'arraybuffer',
                timeout: 15000
            }
        );

        return Buffer.from(response.data);
    } catch {
        return null;
    }
}

async function openMenu(sock, chatId, message) {

    const key = sessionKey(chatId, message);

    sessions.set(key, {
        page: 'root',
        category: null
    });

    const image = await getMenuImage();

    if (image) {

        await sock.sendMessage(
            chatId,
            {
                image,
                caption: rootMenu()
            },
            { quoted: message }
        );

    } else {

        await sock.sendMessage(
            chatId,
            {
                text: rootMenu()
            },
            { quoted: message }
        );
    }
}

async function handleMenuNumber(
    sock,
    chatId,
    message,
    input
) {

    const key = sessionKey(chatId, message);

    const session = sessions.get(key);

    if (!session) return false;

    const n = String(input).trim();

    if (n === '00') {

        sessions.delete(key);

        return true;
    }

    if (session.page === 'root') {

        if (n === '0') {

            sessions.delete(key);

            return true;
        }

        const category = Number(n);

        if (!CATEGORIES[category]) {

            await sock.sendMessage(chatId, {
                text: '❌ Invalid category number.'
            });

            return true;
        }

        session.page = 'category';
        session.category = category;

        await sock.sendMessage(
            chatId,
            {
                text: categoryMenu(category)
            },
            { quoted: message }
        );

        return true;
    }

    if (session.page === 'category') {

        if (n === '0') {

            session.page = 'root';
            session.category = null;

            await sock.sendMessage(
                chatId,
                {
                    text: rootMenu()
                },
                { quoted: message }
            );

            return true;
        }

        const index = Number(n) - 1;

        const list =
            CATEGORIES[session.category].commands;

        if (
            !Number.isInteger(index) ||
            index < 0 ||
            index >= list.length
        ) {

            await sock.sendMessage(chatId, {
                text: '❌ Invalid command number.'
            });

            return true;
        }

        /*
         * Return the REAL command to main.js.
         * main.js then executes its existing handler.
         */

        const command = list[index][1]
            .split(' ')[0];

        sessions.delete(key);

        return command;
    }

    return false;
}

module.exports = {
    openMenu,
    handleMenuNumber,
    CATEGORIES
};
