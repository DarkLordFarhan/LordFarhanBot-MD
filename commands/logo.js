const { execFile } = require('child_process');
const path = require('path');

function runEphoto(text) {
    return new Promise((resolve, reject) => {
        const script = path.join(process.cwd(), 'ephoto360_logo.py');

        execFile(
            'python3',
            [script, text],
            {
                timeout: 120000,
                maxBuffer: 1024 * 1024
            },
            (error, stdout, stderr) => {
                if (error) {
                    return reject(
                        new Error(stderr?.trim() || error.message)
                    );
                }

                try {
                    resolve(JSON.parse(stdout.trim()));
                } catch (e) {
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

async function logoCommand(sock, chatId, text, message) {
    if (!text || !text.trim()) {
        return sock.sendMessage(
            chatId,
            {
                text:
                    '🎨 *EPHOTO360 LOGO MAKER*\n\n' +
                    'Use:\n' +
                    '*.logo Your Text*\n\n' +
                    'You can request any style:\n' +
                    '*.logo neon Lord Farhan*\n' +
                    '*.logo gaming DarkLord*\n' +
                    '*.logo gold King Farhan*\n' +
                    '*.logo 3D Farhan*\n\n' +
                    'No fixed logo list is used.'
            },
            { quoted: message }
        );
    }

    const query = text.trim();

    await sock.sendMessage(
        chatId,
        {
            text:
                `🎨 *EPHOTO360*\n\n` +
                `✏️ ${query}\n` +
                `⏳ Generating your logo...`
        },
        { quoted: message }
    );

    try {
        const result = await runEphoto(query);

        if (!result.ok || !result.url) {
            throw new Error(result.error || 'No image returned');
        }

        await sock.sendMessage(
            chatId,
            {
                image: { url: result.url },
                caption:
                    `🎨 *Logo Generated*\n\n` +
                    `✏️ Text: *${query}*\n` +
                    `✨ Style: *${result.effect || 'Ephoto360'}*`
            },
            { quoted: message }
        );

    } catch (error) {
        console.error('Ephoto360 error:', error);

        await sock.sendMessage(
            chatId,
            {
                text:
                    `❌ *Ephoto360 generation failed*\n\n` +
                    `Requested: *${query}*\n\n` +
                    `Please try again in a few seconds.`
            },
            { quoted: message }
        );
    }
}

module.exports = logoCommand;
