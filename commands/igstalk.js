'use strict';
const axios = require('axios');

/**
 * .igstalk <username>
 * Fetches public Instagram profile info via Instagrapi-style public API.
 * Falls back gracefully if the account is private or not found.
 */
async function igstalkCommand(sock, chatId, message) {
    try {
        const text =
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text || '';
        const username = text.split(' ').slice(1).join(' ').trim().replace(/^@/, '');

        if (!username) {
            await sock.sendMessage(
                chatId,
                { text: '❌ Usage: .igstalk <username>\nExample: .igstalk cristiano' },
                { quoted: message }
            );
            return;
        }

        await sock.sendMessage(
            chatId,
            { text: `🔍 Fetching Instagram profile for *@${username}*...` },
            { quoted: message }
        );

        // Use Instagram's unofficial oEmbed endpoint for basic public data
        const oembedUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;
        const headers = {
            'User-Agent':
                'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
            'x-ig-app-id': '936619743392459',
            Referer: 'https://www.instagram.com/',
        };

        let user;
        try {
            const { data } = await axios.get(oembedUrl, { headers, timeout: 15000 });
            user = data?.data?.user;
        } catch (err) {
            // fallback: try public oEmbed to at least confirm account exists
            try {
                const oembed = await axios.get(
                    `https://api.instagram.com/oembed?url=https://www.instagram.com/${encodeURIComponent(username)}/`,
                    { timeout: 10000 }
                );
                if (oembed.data?.author_name) {
                    const msg =
                        `📸 *INSTAGRAM PROFILE*\n\n` +
                        `👤 *Username:* @${username}\n` +
                        `📝 *Name:* ${oembed.data.author_name}\n` +
                        `🔗 *Profile:* https://www.instagram.com/${username}/\n\n` +
                        `_ℹ️ Full profile details are not available for this account._`;
                    await sock.sendMessage(chatId, { text: msg }, { quoted: message });
                    return;
                }
            } catch {}
            throw err;
        }

        if (!user) {
            await sock.sendMessage(
                chatId,
                { text: `❌ Instagram user *@${username}* not found or the account may be private.` },
                { quoted: message }
            );
            return;
        }

        const formatNum = (n) => {
            if (n === undefined || n === null) return 'N/A';
            if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
            if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
            return String(n);
        };

        const isPrivate = user.is_private ? '🔒 Private' : '🌐 Public';
        const isVerified = user.is_verified ? ' ✅ Verified' : '';

        const result =
            `📸 *INSTAGRAM STALKER*\n` +
            `${'─'.repeat(28)}\n` +
            `👤 *Username:* @${user.username || username}${isVerified}\n` +
            `📝 *Name:* ${user.full_name || 'N/A'}\n` +
            `🔐 *Account:* ${isPrivate}\n` +
            `👥 *Followers:* ${formatNum(user.edge_followed_by?.count)}\n` +
            `➡️  *Following:* ${formatNum(user.edge_follow?.count)}\n` +
            `📷 *Posts:* ${formatNum(user.edge_owner_to_timeline_media?.count)}\n` +
            `📖 *Bio:* ${user.biography?.trim() || 'N/A'}\n` +
            `🔗 *Link:* ${user.external_url || 'N/A'}\n` +
            `🌐 *Profile:* https://www.instagram.com/${user.username || username}/\n` +
            `${'─'.repeat(28)}\n` +
            `> 🤖 _LordFarhan Bot_`;

        // Try to send with profile picture
        const picUrl = user.profile_pic_url_hd || user.profile_pic_url;
        if (picUrl) {
            try {
                await sock.sendMessage(
                    chatId,
                    { image: { url: picUrl }, caption: result },
                    { quoted: message }
                );
                return;
            } catch {
                // fall through to text-only
            }
        }

        await sock.sendMessage(chatId, { text: result }, { quoted: message });
    } catch (error) {
        console.error('Error in igstalk command:', error?.message || error);
        await sock.sendMessage(
            chatId,
            {
                text:
                    '❌ Failed to fetch Instagram profile.\n' +
                    '_Instagram may be blocking the request. Try again in a moment._',
            },
            { quoted: message }
        );
    }
}

module.exports = igstalkCommand;
