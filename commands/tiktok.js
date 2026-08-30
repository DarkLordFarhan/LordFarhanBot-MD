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

function isTikTokUrl(url) {
    return /^https?:\/\/(?:www\.)?(?:tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)\//i.test(url);
}

function safeName() {
    return crypto.randomBytes(8).toString('hex');
}

function runYtDlp(url, output) {
    return new Promise((resolve, reject) => {
        const args = [
            '--no-playlist',
            '--no-warnings',
            '--no-progress',
            '--restrict-filenames',
            '--merge-output-format',
            'mp4',
            '-f',
            'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b',
            '-o',
            output,
            url
        ];

        const proc = spawn('yt-dlp', args, {
            stdio: ['ignore', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', chunk => {
            stdout += chunk.toString();
        });

        proc.stderr.on('data', chunk => {
            stderr += chunk.toString();
        });

        proc.on('error', err => {
            reject(err);
        });

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
                        `yt-dlp exited with code ${code}`
                    )
                );
            }
        });
    });
}

function cleanup(file) {
    try {
        if (file && fs.existsSync(file)) {
            fs.unlinkSync(file);
        }
    } catch {}
}

async function tiktokCommand(sock, chatId, message) {
    let output = null;

    try {
        const text = getText(message);
        const url = extractTikTokUrl(text);

        if (!url || !isTikTokUrl(url)) {
            await sock.sendMessage(
                chatId,
                {
                    text:
`🎵 *TikTok Downloader*

Usage:
.tiktok <TikTok link>

Example:
.tiktok https://www.tiktok.com/@user/video/123456789

Also supports:
• tiktok.com
• vm.tiktok.com
• vt.tiktok.com`
                },
                { quoted: message }
            );

            return;
        }

        await sock.sendMessage(chatId, {
            react: {
                text: '⏳',
                key: message.key
            }
        });

        const id = safeName();

        output = path.join(
            TMP_DIR,
            `${id}.%(ext)s`
        );

        /*
         * First get metadata so we can show
         * the TikTok title/uploader.
         */
        let info = null;

        try {
            const meta = await new Promise((resolve, reject) => {
                const proc = spawn('yt-dlp', [
                    '--dump-single-json',
                    '--no-playlist',
                    '--no-warnings',
                    '--no-progress',
                    url
                ]);

                let out = '';
                let err = '';

                proc.stdout.on('data', d => {
                    out += d.toString();
                });

                proc.stderr.on('data', d => {
                    err += d.toString();
                });

                proc.on('error', reject);

                proc.on('close', code => {
                    if (code !== 0) {
                        reject(new Error(err || `metadata failed: ${code}`));
                        return;
                    }

                    try {
                        resolve(JSON.parse(out));
                    } catch {
                        reject(new Error('Invalid yt-dlp metadata'));
                    }
                });
            });

            info = meta;
        } catch (err) {
            console.log(
                'TikTok metadata warning:',
                err.message
            );
        }

        await sock.sendMessage(chatId, {
            text: '⬇️ Downloading TikTok video...'
        }, { quoted: message });

        await runYtDlp(url, output);

        /*
         * yt-dlp may produce .mp4, .webm, etc.
         * Find the actual generated file.
         */
        const files = fs.readdirSync(TMP_DIR)
            .filter(file => file.startsWith(id + '.'));

        if (!files.length) {
            throw new Error('Downloaded file was not found');
        }

        const actualFile = path.join(
            TMP_DIR,
            files[0]
        );

        const stat = fs.statSync(actualFile);

        if (!stat.size) {
            cleanup(actualFile);
            throw new Error('Downloaded file is empty');
        }

        /*
         * WhatsApp has practical media-size limits.
         * Refuse unusually huge files rather than
         * crashing the bot.
         */
        const MAX_SIZE = 90 * 1024 * 1024;

        if (stat.size > MAX_SIZE) {
            cleanup(actualFile);

            await sock.sendMessage(
                chatId,
                {
                    text:
`❌ TikTok video is too large to send.

Size:
${(stat.size / 1024 / 1024).toFixed(1)} MB`
                },
                { quoted: message }
            );

            return;
        }

        const title =
            info?.title ||
            info?.description ||
            'TikTok Video';

        const uploader =
            info?.uploader ||
            info?.creator ||
            info?.channel ||
            '';

        const caption =
`🎵 *${String(title).slice(0, 500)}*
${uploader ? `👤 ${uploader}\n` : ''}
🤖 🌑༒『𝕃𝕆ℝ𝔻 𝔽𝔸ℝℍ𝔸ℕ 𝕄𝔻』༒☠️`;

        await sock.sendMessage(
            chatId,
            {
                video: {
                    url: actualFile
                },
                mimetype: 'video/mp4',
                caption
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

    } catch (err) {
        console.error(
            'TikTok downloader error:',
            err?.message || err
        );

        if (output) {
            try {
                const prefix = path.basename(output)
                    .split('.%(ext)s')[0];

                for (const file of fs.readdirSync(TMP_DIR)) {
                    if (file.startsWith(prefix)) {
                        cleanup(path.join(TMP_DIR, file));
                    }
                }
            } catch {}
        }

        await sock.sendMessage(
            chatId,
            {
                text:
`❌ *TikTok download failed.*

Possible reasons:
• TikTok link is unavailable
• Video is private/deleted
• TikTok changed its page
• yt-dlp needs updating
• Network connection failed

Try another public TikTok link.`
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
