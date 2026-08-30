'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

const TMP_DIR = path.join(process.cwd(), 'temp', 'tiktok');

if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
}

function getText(message) {
    return (
        message?.message?.conversation ||
        message?.message?.extendedTextMessage?.text ||
        message?.message?.imageMessage?.caption ||
        message?.message?.videoMessage?.caption ||
        ''
    ).trim();
}

function extractTikTokUrl(text) {
    const match = text.match(
        /https?:\/\/(?:www\.)?(?:tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)\/[^\s]+/i
    );

    if (!match) return null;

    return match[0].replace(/[),.!?]+$/, '');
}

function safeName() {
    return crypto.randomBytes(10).toString('hex');
}

function getYtDlpCommand() {
    try {
        const result = spawn('yt-dlp', ['--version']);

        return new Promise(resolve => {
            result.on('error', () => resolve(null));

            result.on('close', code => {
                resolve(code === 0 ? 'yt-dlp' : null);
            });
        });
    } catch {
        return Promise.resolve(null);
    }
}

function runProcess(command, args) {
    return new Promise((resolve, reject) => {
        const proc = spawn(command, args, {
            stdio: ['ignore', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', data => {
            stdout += data.toString();
        });

        proc.stderr.on('data', data => {
            stderr += data.toString();
        });

        proc.on('error', reject);

        proc.on('close', code => {
            if (code === 0) {
                resolve({
                    stdout,
                    stderr
                });
            } else {
                reject(
                    new Error(
                        stderr.trim() ||
                        stdout.trim() ||
                        `${command} exited with code ${code}`
                    )
                );
            }
        });
    });
}

async function runYtDlp(args) {
    const direct = await getYtDlpCommand();

    if (direct) {
        return runProcess(direct, args);
    }

    return runProcess(
        'python',
        ['-m', 'yt_dlp', ...args]
    );
}

function cleanup(file) {
    try {
        if (file && fs.existsSync(file)) {
            fs.unlinkSync(file);
        }
    } catch {}
}

async function tiktokCommand(sock, chatId, message) {
    let actualFile = null;

    try {
        const text = getText(message);
        const url = extractTikTokUrl(text);

        if (!url) {
            await sock.sendMessage(
                chatId,
                {
                    text:
`🎵 *LORD FARHAN MD — TIKTOK*

Use:

.tiktok <TikTok URL>

Example:

.tiktok https://www.tiktok.com/@user/video/123456789`
                },
                { quoted: message }
            );

            return;
        }

        await sock.sendMessage(chatId, {
            react: {
                text: '⬇️',
                key: message.key
            }
        });

        const id = safeName();

        const outputTemplate = path.join(
            TMP_DIR,
            `${id}.%(ext)s`
        );

        /*
         * Download the best available MP4.
         * FFmpeg is installed by the setup block,
         * so separate audio/video can be merged.
         */

        const args = [
            '--no-playlist',
            '--no-warnings',
            '--no-progress',
            '--restrict-filenames',
            '--retries',
            '3',
            '--fragment-retries',
            '3',
            '--socket-timeout',
            '30',
            '--merge-output-format',
            'mp4',
            '-f',
            'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b',
            '-o',
            outputTemplate,
            url
        ];

        console.log('🎵 TikTok URL:', url);

        await runYtDlp(args);

        /*
         * Find whatever yt-dlp actually created.
         */

        const files = fs.readdirSync(TMP_DIR)
            .filter(file => file.startsWith(id + '.'));

        if (!files.length) {
            throw new Error(
                'yt-dlp completed but no video file was created'
            );
        }

        actualFile = path.join(
            TMP_DIR,
            files[0]
        );

        const stat = fs.statSync(actualFile);

        if (!stat.isFile() || stat.size === 0) {
            throw new Error(
                'Downloaded TikTok file is empty'
            );
        }

        /*
         * Keep WhatsApp media size reasonable.
         */

        const MAX_SIZE = 95 * 1024 * 1024;

        if (stat.size > MAX_SIZE) {
            throw new Error(
                `Video is too large: ${(stat.size / 1024 / 1024).toFixed(1)} MB`
            );
        }

        await sock.sendMessage(
            chatId,
            {
                video: {
                    url: actualFile
                },
                mimetype: 'video/mp4',
                caption:
`🎵 *TikTok Downloaded Successfully*

🤖 🌑༒『𝕃𝕆ℝ𝔻 𝔽𝔸ℝℍ𝔸ℕ 𝕄𝔻』༒☠️`
            },
            { quoted: message }
        );

        await sock.sendMessage(chatId, {
            react: {
                text: '✅',
                key: message.key
            }
        });

        cleanup(actualFile);
        actualFile = null;

        console.log('✅ TikTok sent successfully.');

    } catch (error) {

        console.error(
            '❌ TikTok downloader:',
            error?.message || error
        );

        cleanup(actualFile);

        /*
         * Clean temporary files belonging to this command.
         */

        try {
            const all = fs.readdirSync(TMP_DIR);

            for (const file of all) {
                if (actualFile && file === path.basename(actualFile)) {
                    cleanup(path.join(TMP_DIR, file));
                }
            }
        } catch {}

        await sock.sendMessage(
            chatId,
            {
                text:
`❌ *TikTok download failed.*

Possible causes:

• Link is private/deleted
• TikTok blocked the request
• Invalid TikTok URL
• yt-dlp needs an update
• Network problem
• Video is too large

Try another PUBLIC TikTok video.`
            },
            { quoted: message }
        );

        try {
            await sock.sendMessage(chatId, {
                react: {
                    text: '❌',
                    key: message.key
                }
            });
        } catch {}
    }
}

module.exports = tiktokCommand;
