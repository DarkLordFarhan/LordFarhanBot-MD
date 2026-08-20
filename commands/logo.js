const mumaker = require('mumaker');

const EFFECTS = {
    neonlogo: 'https://en.ephoto360.com/create-colorful-neon-light-text-effects-online-797.html',
    silverlogo: 'https://en.ephoto360.com/create-glossy-silver-3d-text-effect-online-802.html',
    blackpinklogo: 'https://en.ephoto360.com/create-a-blackpink-style-logo-with-members-signatures-810.html',
    narutologo: 'https://en.ephoto360.com/naruto-shippuden-logo-style-text-effect-online-808.html',
    glitchlogo: 'https://en.ephoto360.com/create-digital-glitch-text-effects-online-767.html',
    gaminglogo: 'https://en.ephoto360.com/free-gaming-logo-maker-for-fps-game-team-546.html',
    luxurylogo: 'https://en.ephoto360.com/free-luxury-logo-maker-create-logo-online-458.html',
    dragonlogo: 'https://en.ephoto360.com/dragon-fire-text-effect-111.html',
    angelwinglogo: 'https://en.ephoto360.com/create-colorful-angel-wing-avatars-731.html',
    goldlogo: 'https://en.ephoto360.com/create-avatar-gold-online-303.html',
    underwaterlogo: 'https://en.ephoto360.com/3d-underwater-text-effect-online-682.html',
    fireworklogo: 'https://en.ephoto360.com/text-firework-effect-356.html',
    zodiaclogo: 'https://en.ephoto360.com/free-zodiac-online-logo-maker-491.html',
    typographylogo: 'https://en.ephoto360.com/make-typography-text-online-338.html',
    teamlogo: 'https://en.ephoto360.com/make-team-logo-online-free-432.html'
};

const FALLBACKS = [
    'neonlogo',
    'silverlogo',
    'glitchlogo',
    'gaminglogo',
    'luxurylogo',
    'dragonlogo',
    'goldlogo',
    'underwaterlogo',
    'fireworklogo',
    'typographylogo',
    'teamlogo',
    'blackpinklogo',
    'narutologo',
    'angelwinglogo',
    'zodiaclogo'
];

function getText(message, command) {
    const raw =
        message?.message?.conversation ||
        message?.message?.extendedTextMessage?.text ||
        message?.message?.imageMessage?.caption ||
        message?.message?.videoMessage?.caption ||
        '';

    return raw.trim().slice(command.length).trim();
}

async function makeEffect(effectName, text) {
    const url = EFFECTS[effectName];

    if (!url) {
        throw new Error(`Unknown effect: ${effectName}`);
    }

    const result = await mumaker.ephoto(url, text);

    if (!result || !result.image) {
        throw new Error('Ephoto360 returned no image');
    }

    return result.image;
}

async function generate(preferred, text) {
    const effects = [
        preferred,
        ...FALLBACKS.filter(x => x !== preferred)
    ];

    let lastError;

    for (const effect of effects) {
        try {
            console.log(`🎨 Trying Ephoto360: ${effect}`);

            const image = await makeEffect(effect, text);

            return {
                image,
                effect
            };
        } catch (error) {
            lastError = error;
            console.log(`❌ ${effect} failed`);
        }
    }

    throw lastError || new Error('All logo effects failed');
}

async function sendLogo(sock, chatId, message, commandName) {
    const text = getText(message, `.${commandName}`);

    if (!text) {
        return sock.sendMessage(
            chatId,
            {
                text:
                    `🎨 *.${commandName}*\\n\\n` +
                    `Usage:\\n` +
                    `.${commandName} Your Text\\n\\n` +
                    `Example:\\n` +
                    `.${commandName} Lord Farhan`
            },
            { quoted: message }
        );
    }

    await sock.sendMessage(
        chatId,
        {
            text:
                `🎨 *LORD FARHAN LOGO STUDIO*\\n\\n` +
                `✏️ Text: *${text}*\\n` +
                `⏳ Generating logo...`
        },
        { quoted: message }
    );

    try {
        const result = await generate(commandName, text);

        await sock.sendMessage(
            chatId,
            {
                image: {
                    url: result.image
                },
                caption:
                    `🎨 *LORD FARHAN LOGO*\\n\\n` +
                    `✏️ Text: *${text}*\\n` +
                    `✨ Effect: *${result.effect}*`
            },
            { quoted: message }
        );

    } catch (error) {
        console.error(`Logo error:`, error);

        await sock.sendMessage(
            chatId,
            {
                text:
                    `❌ *Logo generation failed*\\n\\n` +
                    `Ephoto360 is temporarily unavailable.\\n` +
                    `Please try again shortly.`
            },
            { quoted: message }
        );
    }
}

const exported = {};

for (const name of Object.keys(EFFECTS)) {
    exported[`${name}Command`] =
        (sock, chatId, message) =>
            sendLogo(sock, chatId, message, name);
}

exported.logoCommand = async (sock, chatId, message) => {
    const text = getText(message, '.logo');

    if (!text) {
        return exported.logoMenuCommand(sock, chatId, message);
    }

    await sock.sendMessage(
        chatId,
        {
            text:
                `🎨 *LORD FARHAN LOGO STUDIO*\\n\\n` +
                `✏️ Text: *${text}*\\n` +
                `⏳ Finding a working effect...`
        },
        { quoted: message }
    );

    try {
        const result = await generate(FALLBACKS[0], text);

        await sock.sendMessage(
            chatId,
            {
                image: {
                    url: result.image
                },
                caption:
                    `🎨 *LORD FARHAN LOGO*\\n\\n` +
                    `✏️ Text: *${text}*\\n` +
                    `✨ Effect: *${result.effect}*`
            },
            { quoted: message }
        );

    } catch (error) {
        console.error('.logo error:', error);

        await sock.sendMessage(
            chatId,
            {
                text:
                    `❌ *Logo generation failed*\\n\\n` +
                    `Please try again shortly.`
            },
            { quoted: message }
        );
    }
};

exported.logoMenuCommand = async (sock, chatId, message) => {
    const menu =
        `🎨 *LORD FARHAN — LOGO STUDIO*\\n\\n` +
        `🔹 *.logo Your Text* — automatic logo\\n\\n` +
        FALLBACKS
            .map((name, i) =>
                `${String(i + 1).padStart(2, '0')} 🔹 .${name} Your Text`
            )
            .join('\\n') +
        `\\n\\n📝 Examples:\\n` +
        `.logo Lord Farhan\\n` +
        `.neonlogo DarkLord Farhan\\n` +
        `.dragonlogo Lord Farhan`;

    await sock.sendMessage(
        chatId,
        { text: menu },
        { quoted: message }
    );
};

module.exports = exported;
