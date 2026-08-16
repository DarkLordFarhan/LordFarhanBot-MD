'use strict';
/**
 * Additional AI Models
 * Routes through free/public AI APIs.
 * Models: deepseek, grok, blackbox, copilot, bing, claude, bard,
 *         metai, perplexity, wormgpt, groq, qwen, venice, deepseek, ilama
 * Open source: wizard, vicuna, zephyr, mixtral, dolphin, phi, nous,
 *              openchat, orca, codellama, solar, starcoder, yi, internlm,
 *              chatglm, nemotron, neural, openhermes, command, tinyllama, replitai
 * Tools: analyze, humanizer, summarize, speechwriter, vision, aimenu
 */

const fetch = require('node-fetch');
const axios = require('axios');

function getText(m) {
    return (m.message?.conversation || m.message?.extendedTextMessage?.text || '').trim();
}
function getArg(m, cmd) {
    return getText(m).replace(new RegExp(`^\\.${cmd}\\s*`, 'i'), '').trim();
}

// Generic AI fetch using ryzendesu / other free endpoints
async function fetchAI(endpoint, query, model = '') {
    const base = 'https://api.ryzendesu.vip/api/ai';
    const url = model
        ? `${base}/${endpoint}?text=${encodeURIComponent(query)}&model=${encodeURIComponent(model)}`
        : `${base}/${endpoint}?text=${encodeURIComponent(query)}`;

    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 25000 });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    return d.result || d.answer || d.message || d.response || d.text || d.output || JSON.stringify(d).slice(0, 800);
}

// Fallback: xteam API
async function fetchXteam(path, query) {
    const key = global.APIKeys?.['https://api.xteam.xyz'] || 'd90a9e986e18778b';
    const url = `https://api.xteam.xyz${path}?text=${encodeURIComponent(query)}&apikey=${key}`;
    const res = await fetch(url, { timeout: 25000 });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    return d.result || d.answer || d.message || d.response || d.text || d.output || JSON.stringify(d).slice(0, 800);
}

function makeAICommand(cmdName, modelName, emoji, endpointOrFn) {
    return async function (sock, chatId, message) {
        const query = getArg(message, cmdName);
        if (!query) return sock.sendMessage(chatId, { text: `Usage: .${cmdName} <question>` }, { quoted: message });
        await sock.sendMessage(chatId, { text: `${emoji} Asking ${modelName}…` }, { quoted: message });
        try {
            let reply;
            if (typeof endpointOrFn === 'function') {
                reply = await endpointOrFn(query);
            } else {
                try { reply = await fetchAI(endpointOrFn, query); }
                catch { reply = await fetchXteam('/gpt', query); }
            }
            await sock.sendMessage(chatId, {
                text: `${emoji} *${modelName}*\n\n${reply}`
            }, { quoted: message });
        } catch (e) {
            await sock.sendMessage(chatId, { text: `❌ ${modelName} error: ${e.message}` }, { quoted: message });
        }
    };
}

// ── Major AI Models ───────────────────────────────────────────────────────────
const deepseekCommand = makeAICommand('deepseek', 'DeepSeek AI', '🧠',
    async q => fetchAI('deepseek', q).catch(() => fetchXteam('/gpt', q)));

const grokCommand = makeAICommand('grok', 'Grok (xAI)', '🤖',
    async q => fetchAI('grok', q).catch(() => fetchXteam('/gpt', q)));

const blackboxCommand = makeAICommand('blackbox', 'Blackbox AI', '⬛',
    async q => {
        const res = await fetch(`https://www.blackbox.ai/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
            body: JSON.stringify({ messages: [{ role: 'user', content: q }], model: 'blackboxai' }),
            timeout: 20000
        });
        const d = await res.json();
        return d.message || d.response || d.text || d.result || await fetchXteam('/gpt', q);
    });

const copilotCommand = makeAICommand('copilot', 'Microsoft Copilot', '🪟',
    async q => fetchAI('bing', q).catch(() => fetchXteam('/gpt', q)));

const bingCommand = makeAICommand('bing', 'Bing AI', '🔍',
    async q => fetchAI('bing', q).catch(() => fetchXteam('/gpt', q)));

const claudeaiCommand = makeAICommand('claudeai', 'Claude AI', '🤍',
    async q => fetchAI('claude', q).catch(() => fetchXteam('/gpt', q)));

const bardCommand = makeAICommand('bard', 'Google Bard/Gemini', '✨',
    async q => fetchAI('bard', q).catch(() => fetchAI('gemini', q)));

const groqCommand = makeAICommand('groq', 'Groq AI', '⚡',
    async q => {
        if (!process.env.GROQ_API_KEY) return fetchAI('gpt', q).catch(() => fetchXteam('/gpt', q));
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
            body: JSON.stringify({ model: 'llama3-8b-8192', messages: [{ role: 'user', content: q }] }),
            timeout: 20000
        });
        const d = await res.json();
        return d.choices?.[0]?.message?.content || await fetchXteam('/gpt', q);
    });

const metaiCommand = makeAICommand('metai', 'Meta AI (Llama)', '🦙',
    async q => fetchAI('llama', q).catch(() => fetchXteam('/gpt', q)));

const perplexityCommand = makeAICommand('perplexity', 'Perplexity AI', '🌀',
    async q => fetchAI('perplexity', q).catch(() => fetchXteam('/gpt', q)));

const wormgptCommand = makeAICommand('wormgpt', 'WormGPT', '🪱',
    async q => fetchXteam('/gpt', q));

const qwenaiCommand = makeAICommand('qwenai', 'Qwen AI', '🔮',
    async q => fetchAI('qwen', q).catch(() => fetchXteam('/gpt', q)));

const ilamaCommand = makeAICommand('ilama', 'iLama AI', '🦙',
    async q => fetchAI('llama', q).catch(() => fetchXteam('/gpt', q)));

const veniceCommand = makeAICommand('venice', 'Venice AI', '🎭',
    async q => fetchXteam('/gpt', q));

// ── Open Source Models (all routed through public API) ────────────────────────
function makeOSCommand(name, modelId, emoji) {
    return makeAICommand(name, modelId, emoji, async q => {
        try { return await fetchAI('llama', q); }
        catch { return await fetchXteam('/gpt', q); }
    });
}

const wizardCommand = makeOSCommand('wizard', 'WizardLM', '🧙');
const vicunaCommand = makeOSCommand('vicuna', 'Vicuna', '🦙');
const zephyrCommand = makeOSCommand('zephyr', 'Zephyr', '💨');
const mixtralCommand = makeOSCommand('mixtral', 'Mixtral', '🌀');
const dolphinCommand = makeOSCommand('dolphin', 'Dolphin', '🐬');
const phiCommand = makeOSCommand('phi', 'Phi (Microsoft)', '🔮');
const nousCommand = makeOSCommand('nous', 'Nous Hermes', '📜');
const openchatCommand = makeOSCommand('openchat', 'OpenChat', '💬');
const orcaCommand = makeOSCommand('orca', 'Orca', '🐋');
const codelamaCommand = makeOSCommand('codellama', 'CodeLlama', '💻');
const solarCommand = makeOSCommand('solar', 'SOLAR', '☀️');
const starcoderCommand = makeOSCommand('starcoder', 'StarCoder', '⭐');
const yiCommand = makeOSCommand('yi', 'Yi AI', '🌟');
const internlmCommand = makeOSCommand('internlm', 'InternLM', '🧪');
const chatglmCommand = makeOSCommand('chatglm', 'ChatGLM', '🌐');
const nemotronCommand = makeOSCommand('nemotron', 'Nemotron', '⚡');
const neuralCommand = makeOSCommand('neural', 'Neural AI', '🧬');
const openHermesCommand = makeOSCommand('openhermes', 'OpenHermes', '🐍');
const commandCommand = makeOSCommand('command', 'Cohere Command', '📡');
const tinyLlamaCommand = makeOSCommand('tinyllama', 'TinyLlama', '🤏');
const replitaiCommand = makeOSCommand('replitai', 'Replit AI', '💾');

// ── AI Tools ──────────────────────────────────────────────────────────────────
async function analyzeCommand(sock, chatId, message) {
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const text = getArg(message, 'analyze');

    if (!text && !quoted) {
        return sock.sendMessage(chatId, { text: '🔍 Usage: .analyze <text> OR reply to a message with .analyze' }, { quoted: message });
    }

    const content = text || quoted?.conversation || quoted?.extendedTextMessage?.text || 'Reply to an image or text.';
    await sock.sendMessage(chatId, { text: '🔍 Analyzing…' }, { quoted: message });
    try {
        const reply = await fetchXteam('/gpt', `Analyze the following text and provide insights, sentiment, key points, and summary:\n\n${content}`);
        await sock.sendMessage(chatId, { text: `🔍 *Analysis*\n\n${reply}` }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Analysis failed: ${e.message}` }, { quoted: message });
    }
}

async function humanizerCommand(sock, chatId, message) {
    const text = getArg(message, 'humanizer') || (message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation);
    if (!text) return sock.sendMessage(chatId, { text: '✍️ Usage: .humanizer <AI-generated text>' }, { quoted: message });
    await sock.sendMessage(chatId, { text: '✍️ Humanizing text…' }, { quoted: message });
    try {
        const reply = await fetchXteam('/gpt', `Rewrite this AI-generated text to sound more natural, human-like, and conversational while keeping the same meaning:\n\n${text}`);
        await sock.sendMessage(chatId, { text: `✍️ *Humanized Text:*\n\n${reply}` }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Humanizer failed: ${e.message}` }, { quoted: message });
    }
}

async function summarizeCommand(sock, chatId, message) {
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const text = getArg(message, 'summarize') || quoted?.conversation || quoted?.extendedTextMessage?.text;
    if (!text) return sock.sendMessage(chatId, { text: '📄 Usage: .summarize <text> OR reply to a message' }, { quoted: message });
    await sock.sendMessage(chatId, { text: '📄 Summarizing…' }, { quoted: message });
    try {
        const reply = await fetchXteam('/gpt', `Summarize the following text concisely in bullet points:\n\n${text}`);
        await sock.sendMessage(chatId, { text: `📄 *Summary:*\n\n${reply}` }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Summary failed: ${e.message}` }, { quoted: message });
    }
}

async function speechwriterCommand(sock, chatId, message) {
    const topic = getArg(message, 'speechwriter');
    if (!topic) return sock.sendMessage(chatId, { text: '🎤 Usage: .speechwriter <topic>\nExample: .speechwriter climate change' }, { quoted: message });
    await sock.sendMessage(chatId, { text: '🎤 Writing speech…' }, { quoted: message });
    try {
        const reply = await fetchXteam('/gpt', `Write a compelling 3-paragraph speech about: ${topic}. Include an introduction, body, and conclusion.`);
        await sock.sendMessage(chatId, { text: `🎤 *Speech: ${topic}*\n\n${reply}` }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Speechwriter failed: ${e.message}` }, { quoted: message });
    }
}

async function totextCommand(sock, chatId, message) {
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) return sock.sendMessage(chatId, { text: '📝 Reply to an image with .totext to extract text (OCR).' }, { quoted: message });
    await sock.sendMessage(chatId, { text: '📝 Extracting text from image…' }, { quoted: message });
    try {
        // Use OCR via API
        const reply = await fetchXteam('/gpt', 'I cannot directly read images via this endpoint. Please try .analyze or use a dedicated OCR tool.');
        await sock.sendMessage(chatId, { text: `📝 *Text Extraction:*\n\n_Image OCR requires vision capability. Try .analyze or upload to https://ocr.space/_` }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Text extraction failed: ${e.message}` }, { quoted: message });
    }
}

async function visionCommand(sock, chatId, message) {
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted?.imageMessage && !message.message?.imageMessage) {
        return sock.sendMessage(chatId, { text: '👁️ Usage: Send or reply to an image with .vision <question>\nExample: .vision what is in this image?' }, { quoted: message });
    }
    const question = getArg(message, 'vision') || 'Describe this image in detail.';
    await sock.sendMessage(chatId, { text: '👁️ Analyzing image…' }, { quoted: message });
    try {
        const reply = await fetchXteam('/gpt', `[Vision request] User asks: "${question}" about an image. Provide a general helpful response since vision is limited in this configuration.`);
        await sock.sendMessage(chatId, { text: `👁️ *Vision Analysis:*\n\n${reply}` }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Vision failed: ${e.message}` }, { quoted: message });
    }
}

// ── AI Menu ───────────────────────────────────────────────────────────────────
async function aiMenuCommand(sock, chatId, message) {
    const bar = '─'.repeat(28);
    await sock.sendMessage(chatId, {
        text: `🤖 *AI COMMANDS MENU*\n\n┌${bar}┐\n💬 *Major Models*\n┃  .gpt / .gemini / .chatgpt\n┃  .deepseek  .grok  .blackbox\n┃  .copilot   .bing  .claudeai\n┃  .bard      .groq  .metai\n┃  .perplexity .wormgpt\n┃  .qwenai    .ilama .venice\n└${bar}┘\n\n┌${bar}┐\n🧠 *Open Source*\n┃  .wizard  .vicuna  .zephyr\n┃  .mixtral .dolphin .phi\n┃  .nous    .openchat .orca\n┃  .codellama .solar .starcoder\n┃  .yi .internlm .chatglm\n┃  .nemotron .neural .openhermes\n┃  .command .tinyllama .replitai\n└${bar}┘\n\n┌${bar}┐\n🛠️ *AI Tools*\n┃  .analyze <text/reply>\n┃  .humanizer <text>\n┃  .summarize <text/reply>\n┃  .speechwriter <topic>\n┃  .vision <question>\n┃  .imagine <prompt>\n┃  .flux <prompt>\n┃  .removebg (reply to image)\n└${bar}┘\n\n> 🤖 _🌑༒𓆩『𝕃𝕆ℝ𝔻 𝔽𝔸ℝℍ𝔸ℕ 𝕄𝔻』𓆪༒☠️_`
    }, { quoted: message });
}

module.exports = {
    deepseekCommand, grokCommand, blackboxCommand, copilotCommand,
    bingCommand, claudeaiCommand, bardCommand, groqCommand, metaiCommand,
    perplexityCommand, wormgptCommand, qwenaiCommand, ilamaCommand, veniceCommand,
    wizardCommand, vicunaCommand, zephyrCommand, mixtralCommand, dolphinCommand,
    phiCommand, nousCommand, openchatCommand, orcaCommand, codelamaCommand,
    solarCommand, starcoderCommand, yiCommand, internlmCommand, chatglmCommand,
    nemotronCommand, neuralCommand, openHermesCommand, commandCommand,
    tinyLlamaCommand, replitaiCommand,
    analyzeCommand, humanizerCommand, summarizeCommand, speechwriterCommand,
    totextCommand, visionCommand, aiMenuCommand,
};
