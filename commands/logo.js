// 🎨 LORD FARHAN MD — WORKING EPHOTO360 LOGOS
// .env is NOT read, written, created, deleted or modified here.

const { execFile } = require('child_process');
const path = require('path');

const STYLES = {
    neonlogo: 'neon',
    silverlogo: 'silver',
    blackpinklogo: 'blackpink',
    narutologo: 'naruto',
    glitchlogo: 'glitch',
    gaminglogo: 'gaming',
    luxurylogo: 'luxury',
    dragonlogo: 'dragon',
    angelwinglogo: 'angelwing',
    goldlogo: 'gold',
    underwaterlogo: 'underwater',
    fireworklogo: 'firework',
    zodiaclogo: 'zodiac',
    typographylogo: 'typography',
    teamlogo: 'team'
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

function generateLogo(style, text) {
    return new Promise((resolve, reject) => {
        execFile(
            'python3',
            [
                path.join(process.cwd(), 'ephoto360_logo.py'),
                style,
                text
            ],
            {
                timeout: 180000,
                maxBuffer: 2 * 1024 * 1024
            },
            (error, stdout, stderr) => {
                if (error) {
                    return reject(
                        new Error(
                            stderr?.trim() ||
                            error.message ||
                            'Ephoto360 failed'
                        )
                    );
                }

                try {
                    resolve(JSON.parse(stdout.trim()));
                } catch {
                    reject(
                        new Error(
                            `Invalid Ephoto360 response: ${stdout}`
                        )
                    );
                }
            }
        );
    });
}

async function makeLogo(sock, chatId, message, commandName, style) {
    const text = getText(message, `.${commandName}`);

    if (!text) {
        return sock.sendMessage(
            chatId,
            {
                text:
                    `🎨 *.${commandName}*\n\n` +
                    `Usage:\n` +
                    `.${commandName} Your Text\n\n` +
                    `Example:\n` +
                    `.${commandName} Lord Farhan`
            },
            { quoted: message }
        );
    }

    await sock.sendMessage(
        chatId,
        {
            text:
                `🎨 *LORD FARHAN LOGO STUDIO*\n\n` +
                `✨ Style: *${style}*\n` +
                `✏️ Text: *${text}*\n\n` +
                `⏳ Generating...`
        },
        { quoted: message }
    );

    try {
        const result = await generateLogo(style, text);

        if (!result?.ok || !result.url) {
            throw new Error(
                result?.error ||
                'No working Ephoto360 effect'
            );
        }

        await sock.sendMessage(
            chatId,
            {
                image: { url: result.url },
                caption:
                    `🎨 *LORD FARHAN LOGO*\n\n` +
                    `✏️ Text: *${text}*\n` +
                    `✨ Effect: *${result.effect || style}*`
            },
            { quoted: message }
        );

    } catch (error) {
        console.error(
            `Ephoto360 .${commandName}:`,
            error
        );

        await sock.sendMessage(
            chatId,
            {
                text:
                    `❌ *Logo generation failed*\n\n` +
                    `Style: *${style}*\n` +
                    `Text: *${text}*\n\n` +
                    `Please try again.`
            },
            { quoted: message }
        );
    }
}

const exported = {};

for (const [name, style] of Object.entries(STYLES)) {
    exported[`${name}Command`] =
        (sock, chatId, message) =>
            makeLogo(
                sock,
                chatId,
                message,
                name,
                style
            );
}

// .logo TEXT = automatic working effect
exported.logoCommand = async (
    sock,
    chatId,
    message
) => {
    const text = getText(message, '.logo');

    if (!text) {
        return exported.logoMenuCommand(
            sock,
            chatId,
            message
        );
    }

    await sock.sendMessage(
        chatId,
        {
            text:
                `🎨 *LORD FARHAN LOGO STUDIO*\n\n` +
                `✏️ Text: *${text}*\n` +
                `⏳ Choosing a working effect...`
        },
        { quoted: message }
    );

    try {
        const result =
            await generateLogo('random', text);

        if (!result?.ok || !result.url) {
            throw new Error(
                result?.error ||
                'No working effect available'
            );
        }

        await sock.sendMessage(
            chatId,
            {
                image: { url: result.url },
                caption:
                    `🎨 *LORD FARHAN LOGO*\n\n` +
                    `✏️ Text: *${text}*\n` +
                    `✨ Effect: *${result.effect || 'Ephoto360'}*`
            },
            { quoted: message }
        );

    } catch (error) {
        console.error('.logo:', error);

        await sock.sendMessage(
            chatId,
            {
                text:
                    `❌ *Logo generation failed*\n\n` +
                    `Please try again.`
            },
            { quoted: message }
        );
    }
};

exported.logoMenuCommand = async (
    sock,
    chatId,
    message
) => {
    const menu =
        `🎨 *LORD FARHAN — EPHOTO360 LOGO STUDIO*\n\n` +
        `🔹 *.logo Your Text* — automatic working logo\n\n` +
        Object.keys(STYLES)
            .map(
                name =>
                    `🔹 .${name} Your Text`
            )
            .join('\n') +
        `\n\nExample:\n` +
        `.logo Lord Farhan\n` +
        `.neonlogo DarkLord Farhan\n` +
        `.dragonlogo Lord Farhan`;

    await sock.sendMessage(
        chatId,
        { text: menu },
        { quoted: message }
    );
};

module.exports = exported;
