const axios = require('axios');

const MENU_IMAGE = 'https://h.uguu.se/DDYNcHpT.jpg';

const MENU = `
╭━━━━━━━━━━━━━━━━━━━━━━╮
│ 👿🌑༒ 𝕷𝖔𝖗𝖉 𝕱𝖆𝖗𝖍𝖆𝖓 𝕸𝕯  ༒🌑👿
╰━━━━━━━━━━━━━━━━━━━━━━╯

╭─〔 🌐 GENERAL 〕
│ 🔹 .weather <city>
│ 🔹 .news
│ 🔹 .attp <text>
│ 🔹 .lyrics <song>
│ 🔹 .8ball <question>
│ 🔹 .groupinfo
│ 🔹 .staff / .admins
│ 🔹 .vv
│ 🔹 .trt <text> <lang>
│ 🔹 .ss <link>
│ 🔹 .jid
╰━━━━━━━━━━━━━━━━━━━━━━╯

╭─〔 👮 ADMIN COMMANDS 〕
│ 🔹 .ban @user
│ 🔹 .promote @user
│ 🔹 .demote @user
│ 🔹 .mute <minutes>
│ 🔹 .unmute
│ 🔹 .delete / .del
│ 🔹 .kick @user
│ 🔹 .warn @user
│ 🔹 .antilink
│ 🔹 .antibadword
│ 🔹 .antitag
│ 🔹 .tag
│ 🔹 .tagall
│ 🔹 .hidetag
│ 🔹 .chatbot
│ 🔹 .welcome
│ 🔹 .goodbye
│ 🔹 .setgname
│ 🔹 .setgdesc
╰━━━━━━━━━━━━━━━━━━━━━━╯

╭─〔 🔒 OWNER COMMANDS 〕
│ 🔹 .mode
│ 🔹 .settings
│ 🔹 .autostatus
│ 🔹 .autoreact
│ 🔹 .autotyping
│ 🔹 .autoread
│ 🔹 .anticall
│ 🔹 .pmblocker
│ 🔹 .antidelete
│ 🔹 .antibot
│ 🔹 .setstatusreact
│ 🔹 .restart
╰━━━━━━━━━━━━━━━━━━━━━━╯

╭─〔 🎨 MEDIA & STICKERS 〕
│ 🔹 .sticker
│ 🔹 .simage
│ 🔹 .blur
│ 🔹 .meme
│ 🔹 .removebg
│ 🔹 .remini
│ 🔹 .emojimix
│ 🔹 .tgsticker
╰━━━━━━━━━━━━━━━━━━━━━━╯

╭─〔 🤖 ARTIFICIAL INTELLIGENCE 〕
│ 🔹 .gpt
│ 🔹 .gemini
│ 🔹 .ai
│ 🔹 .imagine
│ 🔹 .flux
│ 🔹 .sora
╰━━━━━━━━━━━━━━━━━━━━━━╯

╭─〔 📥 DOWNLOADER 〕
│ 🔹 .play
│ 🔹 .song
│ 🔹 .video
│ 🔹 .spotify
│ 🔹 .tiktok
│ 🔹 .tiktokstalk <username>
│ 🔹 .instagram
│ 🔹 .igstalk <username>
│ 🔹 .facebook
╰━━━━━━━━━━━━━━━━━━━━━━╯

╭─〔 🎮 GAMES & FUN 〕
│ 🔹 .tictactoe
│ 🔹 .truth
│ 🔹 .dare
│ 🔹 .trivia
│ 🔹 .ship
│ 🔹 .hangman
│ 🔹 .coin / .flip
│ 🔹 .dice / .roll
│ 🔹 .rps <r/p/s>
│ 🔹 .riddle
│ 🔹 .wyr
╰━━━━━━━━━━━━━━━━━━━━━━╯

╭─〔 ✨ FANCY FONTS 〕
│ 🔹 .fancyfonts <text>
│ 🔹 .ff bold <text>
│ 🔹 .ff italic <text>
│ 🔹 .ff script <text>
│ 🔹 .ff fraktur <text>
│ 🔹 .ff bubble <text>
│ 🔹 .ff square <text>
│ 🔹 .ff aesthetic <text>
│ 🔹 .ff smallcaps <text>
│ 🔹 .ff mock <text>
│ 🔹 .ff underline <text>
╰━━━━━━━━━━━━━━━━━━━━━━╯

╭─〔 🔤 TEXT TOOLS 〕
│ 🔹 .reverse / .rev
│ 🔹 .upper
│ 🔹 .lower
│ 🔹 .mock
│ 🔹 .clap
│ 🔹 .binary
│ 🔹 .base64
│ 🔹 .unbase64
│ 🔹 .snake
│ 🔹 .camel
│ 🔹 .calc
│ 🔹 .password
╰━━━━━━━━━━━━━━━━━━━━━━╯

> 👿 LORD FARHAN MD
> ⚡ Fast • Powerful • Reliable
`;

async function openMenu(sock, chatId, message) {
  try {
    const r = await axios.get(MENU_IMAGE, {
      responseType: 'arraybuffer',
      timeout: 15000
    });

    await sock.sendMessage(chatId, {
      image: Buffer.from(r.data),
      caption: MENU
    }, { quoted: message });

  } catch (e) {
    await sock.sendMessage(chatId, {
      text: MENU
    }, { quoted: message });
  }
}

async function handleMenuNumber() {
  return false;
}

module.exports = {
  openMenu,
  handleMenuNumber
};
