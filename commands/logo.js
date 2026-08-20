'use strict';

const mumaker = require('mumaker');

const EFFECTS = {
  neonlogo: 'https://en.ephoto360.com/create-colorful-neon-light-text-effects-online-797.html',
  hackerlogo: 'https://en.ephoto360.com/create-anonymous-hacker-avatars-cyan-neon-677.html',
  silverlogo: 'https://en.ephoto360.com/create-glossy-silver-3d-text-effect-online-802.html',
  blackpinklogo: 'https://en.ephoto360.com/create-a-blackpink-style-logo-with-members-signatures-810.html',
  narutologo: 'https://en.ephoto360.com/naruto-shippuden-logo-style-text-effect-online-808.html',
  glitchlogo: 'https://en.ephoto360.com/create-digital-glitch-text-effects-online-767.html',
  gaminglogo: 'https://en.ephoto360.com/free-gaming-logo-maker-for-fps-game-team-546.html',
  luxurylogo: 'https://en.ephoto360.com/free-luxury-logo-maker-create-logo-online-458.html',
  dragonlogo: 'https://en.ephoto360.com/dragon-fire-text-effect-111.html',
  goldlogo: 'https://en.ephoto360.com/create-avatar-gold-online-303.html',
  underwaterlogo: 'https://en.ephoto360.com/3d-underwater-text-effect-online-682.html',
  fireworklogo: 'https://en.ephoto360.com/text-firework-effect-356.html',
  zodiaclogo: 'https://en.ephoto360.com/free-zodiac-online-logo-maker-491.html',
  typographylogo: 'https://en.ephoto360.com/make-typography-text-online-338.html',
  teamlogo: 'https://en.ephoto360.com/create-logo-team-logo-gaming-assassin-style-574.html',
  scifilogo: 'https://en.ephoto360.com/create-a-awesome-logo-sci-fi-effects-492.html',
  mascotlogo: 'https://en.ephoto360.com/create-a-gaming-mascot-logo-free-560.html',
  circlelogo: 'https://en.ephoto360.com/create-a-circle-mascot-team-logo-483.html',
  textlogo: 'https://en.ephoto360.com/text-logo-maker-online-free-474.html'
};

function getText(message, command) {
  const raw =
    message?.message?.conversation ||
    message?.message?.extendedTextMessage?.text ||
    message?.message?.imageMessage?.caption ||
    message?.message?.videoMessage?.caption ||
    '';

  return raw.trim().slice(command.length).trim();
}

async function generate(name, text) {
  const result = await mumaker.ephoto(EFFECTS[name], text);

  if (!result || !result.image) {
    throw new Error('Ephoto360 returned no image');
  }

  return result.image;
}

async function sendLogo(sock, chatId, message, name) {
  const command = `.${name}`;
  const text = getText(message, command);

  if (!text) {
    return sock.sendMessage(
      chatId,
      {
        text:
          `🎨 *${command}*\n\n` +
          `Usage:\n${command} Your Text\n\n` +
          `Example:\n${command} Lord Farhan`
      },
      { quoted: message }
    );
  }

  await sock.sendMessage(
    chatId,
    {
      text:
        `🎨 *LORD FARHAN EPHOTO360*\n\n` +
        `✏️ ${text}\n` +
        `✨ ${name}\n` +
        `⏳ Creating...`
    },
    { quoted: message }
  );

  try {
    const image = await generate(name, text);

    await sock.sendMessage(
      chatId,
      {
        image: { url: image },
        caption:
          `🎨 *LORD FARHAN LOGO*\n\n` +
          `✏️ ${text}\n` +
          `✨ ${name}`
      },
      { quoted: message }
    );
  } catch (e) {
    console.error(`Logo ${name}:`, e);

    await sock.sendMessage(
      chatId,
      {
        text:
          `❌ *${name} failed*\n\n` +
          `Ephoto360 did not return an image.\n` +
          `Try another command from *.logomenu*.`
      },
      { quoted: message }
    );
  }
}

/*
 * .logomenu = LIST ONLY
 * It NEVER generates a logo.
 */
async function logoMenuCommand(sock, chatId, message) {
  const names = Object.keys(EFFECTS);

  const list = names.map(
    (x, i) =>
      `${String(i + 1).padStart(2, '0')} 🔹 .${x} <text>`
  ).join('\n');

  const text =
    `🎨 *LORD FARHAN — EPHOTO360*\n\n` +
    `📋 *ALL LOGO COMMANDS*\n\n` +
    `${list}\n\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📝 Example:\n` +
    `.hackerlogo Lord Farhan\n` +
    `.gaminglogo DarkLord\n` +
    `.scifilogo Lord Farhan\n\n` +
    `💡 *.logomenu* only shows this list.`;

  return sock.sendMessage(
    chatId,
    { text },
    { quoted: message }
  );
}

/*
 * .logo = neon shortcut
 */
async function logoCommand(sock, chatId, message) {
  const text = getText(message, '.logo');

  if (!text) {
    return logoMenuCommand(sock, chatId, message);
  }

  return sendLogo(
    sock,
    chatId,
    message,
    'neonlogo'
  );
}

const exported = {
  logoCommand,
  logoMenuCommand
};

for (const name of Object.keys(EFFECTS)) {
  exported[`${name}Command`] =
    (sock, chatId, message) =>
      sendLogo(sock, chatId, message, name);
}

module.exports = exported;
