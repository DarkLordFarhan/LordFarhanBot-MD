/**
 * .pair command — generates a WhatsApp pairing code using Baileys directly.
 * Usage: .pair <phone_number_with_country_code>
 * Example: .pair 917023950000
 *
 * The code is delivered back to the chat so the user can enter it on WhatsApp
 * (Linked Devices → Link with phone number).
 */

const { sleep } = require('../lib/myfunc');

/**
 * Normalise a raw phone string into a bare E.164 number (digits only, no +).
 * Returns null if the result looks too short or too long to be real.
 */
function normaliseNumber(raw) {
    const digits = raw.replace(/[^0-9]/g, '');
    if (digits.length < 7 || digits.length > 15) return null;
    return digits;
}

async function pairCommand(sock, chatId, message, q) {
    try {
        // ── 1. Validate input ────────────────────────────────────────────────
        if (!q || !q.trim()) {
            return await sock.sendMessage(
                chatId,
                {
                    text:
                        '📲 *Pair Command*\n\n' +
                        'Please provide a phone number with country code.\n\n' +
                        '*Usage:* .pair <number>\n' +
                        '*Example:* .pair 917023950000\n\n' +
                        '_Enter the code in WhatsApp → Linked Devices → Link with phone number_',
                    contextInfo: { forwardingScore: 1, isForwarded: true }
                },
                { quoted: message }
            );
        }

        const number = normaliseNumber(q.trim());

        if (!number) {
            return await sock.sendMessage(
                chatId,
                {
                    text: '❌ Invalid number. Include your country code and digits only.\n*Example:* .pair 917023950000',
                    contextInfo: { forwardingScore: 1, isForwarded: true }
                },
                { quoted: message }
            );
        }

        // ── 2. Check the number exists on WhatsApp ───────────────────────────
        const jid = number + '@s.whatsapp.net';
        let exists = false;
        try {
            const result = await sock.onWhatsApp(jid);
            exists = result?.[0]?.exists ?? false;
        } catch (_) {
            // onWhatsApp can throw; treat as unknown — still attempt code generation
            exists = true;
        }

        if (!exists) {
            return await sock.sendMessage(
                chatId,
                {
                    text: '❌ That number is not registered on WhatsApp.',
                    contextInfo: { forwardingScore: 1, isForwarded: true }
                },
                { quoted: message }
            );
        }

        // ── 3. Acknowledge and generate the code ─────────────────────────────
        await sock.sendMessage(
            chatId,
            {
                text: '⏳ Generating your pairing code, please wait…',
                contextInfo: { forwardingScore: 1, isForwarded: true }
            },
            { quoted: message }
        );

        // requestPairingCode is available directly on the Baileys socket.
        // It requires the phone number as plain digits (no +, no @s.whatsapp.net).
        let code;
        try {
            code = await sock.requestPairingCode(number);
        } catch (err) {
            console.error('[pair] requestPairingCode error:', err);
            return await sock.sendMessage(
                chatId,
                {
                    text:
                        '❌ Failed to generate pairing code.\n\n' +
                        'Make sure:\n' +
                        '• The bot is not already fully connected on another device for this number\n' +
                        '• The number is correct (with country code)\n\n' +
                        `_Error: ${err?.message || err}_`,
                    contextInfo: { forwardingScore: 1, isForwarded: true }
                },
                { quoted: message }
            );
        }

        // Some Baileys builds return the code with a hyphen already; normalise.
        const formatted = String(code).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        const display = formatted.length === 8
            ? formatted.slice(0, 4) + '-' + formatted.slice(4)
            : formatted;

        // ── 4. Send the code ─────────────────────────────────────────────────
        await sleep(1500);
        await sock.sendMessage(
            chatId,
            {
                text:
                    '✅ *Your Pairing Code*\n\n' +
                    `\`\`\`${display}\`\`\`\n\n` +
                    '📲 *How to use:*\n' +
                    '1. Open WhatsApp on your phone\n' +
                    '2. Go to *Settings → Linked Devices*\n' +
                    '3. Tap *Link a Device*\n' +
                    '4. Tap *Link with phone number* instead\n' +
                    '5. Enter the code above\n\n' +
                    '⏱️ _Code expires in ~60 seconds_',
                contextInfo: { forwardingScore: 1, isForwarded: true }
            },
            { quoted: message }
        );
    } catch (error) {
        console.error('[pair] Unexpected error:', error);
        try {
            await sock.sendMessage(
                chatId,
                {
                    text: '❌ An unexpected error occurred. Please try again.',
                    contextInfo: { forwardingScore: 1, isForwarded: true }
                },
                { quoted: message }
            );
        } catch (_) {}
    }
}

module.exports = pairCommand;
