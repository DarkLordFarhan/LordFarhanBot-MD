'use strict';

const sessions = new Map();

const CATEGORIES = {
  1: {
    name: '🌐 GENERAL',
    commands: [
      ['ping', '.ping'],
      ['alive', '.alive'],
      ['owner', '.owner'],
      ['joke', '.joke'],
      ['quote', '.quote'],
      ['fact', '.fact'],
      ['weather', '.weather'],
      ['news', '.news'],
      ['lyrics', '.lyrics'],
      ['tts', '.tts'],
      ['groupinfo', '.groupinfo'],
      ['staff', '.staff'],
      ['github', '.github'],
      ['vv', '.vv']
    ]
  },

  2: {
    name: '🛡️ GROUP MANAGEMENT',
    commands: [
      ['ban', '.ban'],
      ['unban', '.unban'],
      ['kick', '.kick'],
      ['promote', '.promote'],
      ['demote', '.demote'],
      ['mute', '.mute'],
      ['unmute', '.unmute'],
      ['warn', '.warn'],
      ['warnings', '.warnings'],
      ['delete', '.delete'],
      ['tagall', '.tagall'],
      ['tag', '.tag'],
      ['hidetag', '.hidetag'],
      ['antilink', '.antilink'],
      ['antitag', '.antitag'],
      ['antibadword', '.antibadword'],
      ['welcome', '.welcome'],
      ['goodbye', '.goodbye'],
      ['add', '.add'],
      ['promoteall', '.promoteall'],
      ['demoteall', '.demoteall'],
      ['kickall', '.kickall'],
      ['grouplink', '.grouplink'],
      ['tagadmin', '.tagadmin'],
      ['getgpp', '.getgpp'],
      ['getparticipants', '.getparticipants'],
      ['approveall', '.approveall'],
      ['rejectall', '.rejectall'],
      ['leave', '.leave'],
      ['creategroup', '.creategroup']
    ]
  },

  3: {
    name: '👑 OWNER / BOT',
    commands: [
      ['settings', '.settings'],
      ['autostatus', '.autostatus'],
      ['autotyping', '.autotyping'],
      ['autoread', '.autoread'],
      ['anticall', '.anticall'],
      ['pmblocker', '.pmblocker'],
      ['antidelete', '.antidelete'],
      ['clearsession', '.clearsession'],
      ['cleartmp', '.cleartmp'],
      ['setpp', '.setpp'],
      ['broadcast', '.broadcast'],
      ['restart', '.restart'],
      ['shutdown', '.shutdown'],
      ['sudo', '.sudo'],
      ['pair', '.pair']
    ]
  },

  4: {
    name: '🎨 MEDIA / STICKERS',
    commands: [
      ['sticker', '.sticker'],
      ['simage', '.simage'],
      ['attp', '.attp'],
      ['take', '.take'],
      ['emojimix', '.emojimix'],
      ['stickercrop', '.stickercrop'],
      ['stickertelegram', '.stickertelegram'],
      ['textmaker', '.textmaker'],
      ['blur', '.blur'],
      ['removebg', '.removebg'],
      ['remini', '.remini']
    ]
  },

  5: {
    name: '🤖 AI',
    commands: [
      ['ai', '.ai'],
      ['ask', '.ask'],
      ['chat', '.chat'],
      ['gpt', '.gpt'],
      ['groq', '.groq'],
      ['deepseek', '.deepseek'],
      ['grok', '.grok'],
      ['copilot', '.copilot'],
      ['claude', '.claude'],
      ['perplexity', '.perplexity'],
      ['qwen', '.qwen'],
      ['vision', '.vision'],
      ['summarize', '.summarize'],
      ['humanizer', '.humanizer'],
      ['aimenu', '.aimenu']
    ]
  },

  6: {
    name: '📥 DOWNLOADERS',
    commands: [
      ['play', '.play'],
      ['song', '.song'],
      ['video', '.video'],
      ['tiktok', '.tiktok'],
      ['instagram', '.instagram'],
      ['facebook', '.facebook'],
      ['spotify', '.spotify'],
      ['url', '.url'],
      ['ss', '.ss']
    ]
  },

  7: {
    name: '🎮 FUN / GAMES',
    commands: [
      ['ttt', '.ttt'],
      ['hangman', '.hangman'],
      ['trivia', '.trivia'],
      ['truth', '.truth'],
      ['dare', '.dare'],
      ['8ball', '.8ball'],
      ['compliment', '.compliment'],
      ['insult', '.insult'],
      ['flirt', '.flirt'],
      ['ship', '.ship'],
      ['simp', '.simp'],
      ['stupid', '.stupid'],
      ['coin', '.coin'],
      ['dice', '.dice'],
      ['rps', '.rps'],
      ['roast', '.roast']
    ]
  },

  8: {
    name: '🛠️ UTILITIES',
    commands: [
      ['time', '.time'],
      ['define', '.define'],
      ['remind', '.remind'],
      ['sessioninfo', '.sessioninfo'],
      ['wiki', '.wiki'],
      ['iplookup', '.iplookup'],
      ['getip', '.getip'],
      ['onwhatsapp', '.onwhatsapp'],
      ['qrencode', '.qrencode'],
      ['fetch', '.fetch'],
      ['inspect', '.inspect'],
      ['country', '.country'],
      ['platform', '.platform'],
      ['calc', '.calc'],
      ['password', '.password'],
      ['uptime', '.uptime']
    ]
  },

  9: {
    name: '⚡ STATUS / AUTOMATION',
    commands: [
      ['autostatus', '.autostatus'],
      ['autoread', '.autoread'],
      ['autotyping', '.autotyping'],
      ['autoreact', '.autoreact'],
      ['anticall', '.anticall'],
      ['antidelete', '.antidelete'],
      ['pmblocker', '.pmblocker']
    ]
  }
};

function keyFor(chatId, message) {
  return `${chatId}:${message?.key?.participant || message?.key?.remoteJid || ''}`;
}

function rootMenu() {
  return `
╭━━━〔 🌑 LORD FARHAN MD 〕━━━╮
┃
┃       📚 COMMAND CENTER
┃
┃  1️⃣ General
┃  2️⃣ Group Management
┃  3️⃣ Owner / Bot
┃  4️⃣ Media / Stickers
┃  5️⃣ AI
┃  6️⃣ Downloaders
┃  7️⃣ Fun / Games
┃  8️⃣ Utilities
┃  9️⃣ Status / Automation
┃
┃  Reply with a number
┃
┃  0️⃣ Close
╰━━━━━━━━━━━━━━━━━━━━╯
`;
}

function categoryMenu(id) {
  const category = CATEGORIES[id];

  let out = `
╭━━━〔 ${category.name} 〕━━━╮
┃
`;

  category.commands.forEach((cmd, i) => {
    out += `┃ ${i + 1}. ${cmd[1]}\n`;
  });

  out += `┃
┃ 0. ↩️ Back
┃ 00. ❌ Close
╰━━━━━━━━━━━━━━━━━━━━╯`;

  return out;
}

async function openMenu(sock, chatId, message) {
  sessions.set(keyFor(chatId, message), {
    page: 'root',
    category: null
  });

  await sock.sendMessage(
    chatId,
    { text: rootMenu() },
    { quoted: message }
  );
}

async function handleMenuNumber(sock, chatId, message, input) {
  const key = keyFor(chatId, message);
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
        text: '❌ Invalid category.'
      });
      return true;
    }

    session.page = 'category';
    session.category = category;

    await sock.sendMessage(chatId, {
      text: categoryMenu(category)
    });

    return true;
  }

  if (session.page === 'category') {
    if (n === '0') {
      session.page = 'root';
      session.category = null;

      await sock.sendMessage(chatId, {
        text: rootMenu()
      });

      return true;
    }

    const index = Number(n) - 1;
    const list = CATEGORIES[session.category].commands;

    if (!Number.isInteger(index) || index < 0 || index >= list.length) {
      await sock.sendMessage(chatId, {
        text: '❌ Invalid command number.'
      });
      return true;
    }

    const command = list[index][1];

    sessions.delete(key);

    /*
     * Return the REAL command to main.js.
     * No fake command execution here.
     */
    return command;
  }

  return false;
}

module.exports = {
  openMenu,
  handleMenuNumber,
  CATEGORIES
};
