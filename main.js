// 🧹 Fix for ENOSPC / temp overflow in hosted panels
const fs = require('fs');
const path = require('path');

// Redirect temp storage away from system /tmp
const customTemp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(customTemp)) fs.mkdirSync(customTemp, { recursive: true });
process.env.TMPDIR = customTemp;
process.env.TEMP = customTemp;
process.env.TMP = customTemp;

// Auto-cleaner every 3 hours
setInterval(() => {
    fs.readdir(customTemp, (err, files) => {
        if (err) return;
        for (const file of files) {
            const filePath = path.join(customTemp, file);
            fs.stat(filePath, (err, stats) => {
                if (!err && Date.now() - stats.mtimeMs > 3 * 60 * 60 * 1000) {
                    fs.unlink(filePath, () => { });
                }
            });
        }
    });
    console.log('🧹 Temp folder auto-cleaned');
}, 3 * 60 * 60 * 1000);

const settings = require('./settings');
require('./config.js');
const { isBanned } = require('./lib/isBanned');
const yts = require('yt-search');
const { getBuffer: fetchBuffer } = require('./lib/myfunc');
const fetch = require('node-fetch');
const ytdl = require('ytdl-core');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const { isSudo } = require('./lib/index');
const isOwnerOrSudo = require('./lib/isOwner');
const { autotypingCommand, isAutotypingEnabled, handleAutotypingForMessage, handleAutotypingForCommand, showTypingAfterCommand } = require('./commands/autotyping');
const { autoreadCommand, isAutoreadEnabled, handleAutoread } = require('./commands/autoread');

// Command imports
const tagAllCommand = require('./commands/tagall');
const helpCommand = require('./commands/help');
const banCommand = require('./commands/ban');
const { promoteCommand } = require('./commands/promote');
const { demoteCommand } = require('./commands/demote');
const muteCommand = require('./commands/mute');
const unmuteCommand = require('./commands/unmute');
const stickerCommand = require('./commands/sticker');
const isAdmin = require('./lib/isAdmin');
const warnCommand = require('./commands/warn');
const warningsCommand = require('./commands/warnings');
const ttsCommand = require('./commands/tts');
const { tictactoeCommand, handleTicTacToeMove } = require('./commands/tictactoe');
const { incrementMessageCount, topMembers } = require('./commands/topmembers');
const ownerCommand = require('./commands/owner');
const deleteCommand = require('./commands/delete');
const { handleAntilinkCommand, handleLinkDetection } = require('./commands/antilink');
const { handleAntitagCommand, handleTagDetection } = require('./commands/antitag');
const { Antilink } = require('./lib/antilink');
const { handleMentionDetection, mentionToggleCommand, setMentionCommand } = require('./commands/mention');
const memeCommand = require('./commands/meme');
const tagCommand = require('./commands/tag');
const tagNotAdminCommand = require('./commands/tagnotadmin');
const hideTagCommand = require('./commands/hidetag');
const jokeCommand = require('./commands/joke');
const quoteCommand = require('./commands/quote');
const factCommand = require('./commands/fact');
const weatherCommand = require('./commands/weather');
const newsCommand = require('./commands/news');
const kickCommand = require('./commands/kick');
const simageCommand = require('./commands/simage');
const attpCommand = require('./commands/attp');
const { startHangman, guessLetter } = require('./commands/hangman');
const { startTrivia, answerTrivia } = require('./commands/trivia');
const { complimentCommand } = require('./commands/compliment');
const { insultCommand } = require('./commands/insult');
const { eightBallCommand } = require('./commands/eightball');
const { lyricsCommand } = require('./commands/lyrics');
const { dareCommand } = require('./commands/dare');
const { truthCommand } = require('./commands/truth');
const { clearCommand } = require('./commands/clear');
const pingCommand = require('./commands/ping');
const aliveCommand = require('./commands/alive');
const blurCommand = require('./commands/img-blur');
const { welcomeCommand, handleJoinEvent } = require('./commands/welcome');
const { goodbyeCommand, handleLeaveEvent } = require('./commands/goodbye');
const githubCommand = require('./commands/github');
const { handleAntiBadwordCommand, handleBadwordDetection } = require('./lib/antibadword');
const antibadwordCommand = require('./commands/antibadword');
const { handleChatbotCommand, handleChatbotResponse } = require('./commands/chatbot');
const takeCommand = require('./commands/take');
const { flirtCommand } = require('./commands/flirt');
const characterCommand = require('./commands/character');
const wastedCommand = require('./commands/wasted');
const shipCommand = require('./commands/ship');
const groupInfoCommand = require('./commands/groupinfo');
const resetlinkCommand = require('./commands/resetlink');
const staffCommand = require('./commands/staff');
const unbanCommand = require('./commands/unban');
const emojimixCommand = require('./commands/emojimix');
const { handlePromotionEvent } = require('./commands/promote');
const { handleDemotionEvent } = require('./commands/demote');
const viewOnceCommand = require('./commands/viewonce');
const clearSessionCommand = require('./commands/clearsession');
const { autoStatusCommand, handleStatusUpdate } = require('./commands/autostatus');
const { simpCommand } = require('./commands/simp');
const { stupidCommand } = require('./commands/stupid');
const stickerTelegramCommand = require('./commands/stickertelegram');
const textmakerCommand = require('./commands/textmaker');
const { handleAntideleteCommand, handleMessageRevocation, storeMessage } = require('./commands/antidelete');
const clearTmpCommand = require('./commands/cleartmp');
const setProfilePicture = require('./commands/setpp');
const { setGroupDescription, setGroupName, setGroupPhoto } = require('./commands/groupmanage');
const instagramCommand = require('./commands/instagram');
const facebookCommand = require('./commands/facebook');
const spotifyCommand = require('./commands/spotify');
const playCommand = require('./commands/play');
const tiktokCommand = require('./commands/tiktok');
const songCommand = require('./commands/song');
const aiCommand = require('./commands/ai');
const urlCommand = require('./commands/url');
const { handleTranslateCommand } = require('./commands/translate');
const { handleSsCommand } = require('./commands/ss');
const { addCommandReaction, handleAreactCommand } = require('./lib/reactions');
const { goodnightCommand } = require('./commands/goodnight');
const { shayariCommand } = require('./commands/shayari');
const { rosedayCommand } = require('./commands/roseday');
const imagineCommand = require('./commands/imagine');
const videoCommand = require('./commands/video');
const sudoCommand = require('./commands/sudo');
const { miscCommand, handleHeart } = require('./commands/misc');
const { animeCommand } = require('./commands/anime');
const { piesCommand, piesAlias } = require('./commands/pies');
const stickercropCommand = require('./commands/stickercrop');
const updateCommand = require('./commands/update');
const removebgCommand = require('./commands/removebg');
const { reminiCommand } = require('./commands/remini');
const { igsCommand } = require('./commands/igs');
const { anticallCommand, readState: readAnticallState } = require('./commands/anticall');
const { pmblockerCommand, readState: readPmBlockerState } = require('./commands/pmblocker');
const settingsCommand = require('./commands/settings');
const soraCommand = require('./commands/sora');
const pairCommand = require('./commands/pair');
const { botimageCommand } = require('./commands/botimage');
const { prefixToggleCommand, applyPrefixLogic } = require('./commands/prefixtoggle');
const igstalkCommand = require('./commands/igstalk');
const tiktokstalkCommand = require('./commands/tiktokstalk');
const gitstalkCommand = require('./commands/gitstalk');

// ── New command modules ───────────────────────────────────────────────────────
const {
    addCommand: mgAddCommand, promoteAllCommand, demoteAllCommand, kickAllCommand,
    exCommand, clearBanListCommand, resetWarnCommand, setWarnCommand,
    gctimeCommand, antileaveCommand, addBadwordCommand, removeBadwordCommand,
    listBadwordCommand, leaveCommand, createGroupCommand, groupLinkCommand,
    tagAdminCommand, getGppCommand, getPpCommand, togStatusCommand,
    getParticipantsCommand, listOnlineCommand, listInactiveCommand,
    approveAllCommand, rejectAllCommand, stickerPackCommand, dispCommand,
    fangtraceCommand,
} = require('./commands/moregroup');
const {
    antiStickerCommand, antiImageCommand, antiVideoCommand, antiAudioCommand,
    antiMentionCommand, antiStatusMentionCommand, antiGroupLinkCommand,
    antiDemoteCommand, antiPromoteCommand, antiGroupCallCommand, antiSpamCommand,
    enforceAutomod,
} = require('./commands/automod');
const {
    subdomainCommand, reverseIpCommand, geoipCommand, portScanCommand,
    headersCommand, pingHostCommand, tracerouteCommand, asnLookupCommand,
    sslCheckCommand, hashIdentifyCommand, hashCheckCommand, bcryptCheckCommand,
    passwordStrengthCommand, urlScanCommand, phishCheckCommand, robotsCheckCommand,
    sitemapCommand, cmsDetectCommand, techStackCommand, macLookupCommand,
    securityHeadersCommand, nmapCommand, securityMenuCommand,
} = require('./commands/security2');
const {
    waChannelCommand, twitterStalkCommand, ipStalkCommand,
    npmStalkCommand, stalkerMenuCommand,
} = require('./commands/stalker');
const {
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
} = require('./commands/moreai');
const {
    ping2Command, timeCommand, defineCommand, remindCommand,
    sessionInfoCommand, covidCommand, wikiCommand, ipLookupCommand,
    getIpCommand, onWhatsappCommand, qrEncodeCommand, fetchCommand,
    inspectCommand, shazamCommand, vcfCommand, viewVcfCommand,
    vv2Command, countryCommand, platformCommand,
} = require('./commands/utility2');
const {
    setBotNameCommand, resetBotNameCommand, setOwnerCommand, resetOwnerCommand,
    iAmOwnerCommand, aboutCommand, blockCommand, unblockCommand,
    silentCommand, isSilent, broadcastCommand, shutdownCommand, restartCommand,
    getSettingsCommand, setSettingCommand, diskCommand, hostIpCommand,
    findCommandsCommand, latestUpdatesCommand, onlineCommand, privacyCommand,
    lastSeenCommand, setChannelCommand, resetChannelCommand, setFooterCommand, testCommand,
} = require('./commands/owner2');
const {
    matchStatsCommand, sportsNewsCommand, teamNewsCommand,
    f1Command, nflCommand, mmaCommand, baseballCommand,
    hockeyCommand, golfCommand, sportsMenuCommand,
} = require('./commands/sports2');
const {
    bfCommand, gfCommand, coupleCommand, gayCommand: gay2Command, deviceCommand,
    movieCommand, trailerCommand, readSiteCommand, goodMorningCommand,
    channelStatusCommand, hackCommand, genMusicCommand, genLyricsCommand,
} = require('./commands/fun2');
const logoCommands = require('./commands/logo');

// ── New commands ──────────────────────────────────────────────────────────────
const fancyfontsCommand = require('./commands/fancyfonts');
const {
    reverseCommand, upperCommand, lowerCommand, mockCommand,
    clapCommand, morseCommand, binaryCommand, base64Command,
    unbase64Command, snakeCommand, camelCommand, uptimeCommand,
    calcCommand, passwordCommand,
} = require('./commands/texttools');
const {
    coinCommand, diceCommand, rpsCommand, riddleCommand,
    pickupCommand, roastCommand, yomomaCommand, catfactCommand,
    dogfactCommand, wyrCommand, nhieCommand, zodiacCommand,
    bmiCommand, numberfactCommand, motivateCommand, colorCommand,
} = require('./commands/funtools');

// Global settings
global.packname = settings.packname;
global.author = settings.author;
global.channelLink = "";
global.ytch = "Dark Lord Farhan";

// Add this near the top of main.js with other global configurations
const channelInfo = {
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true
    }
};

async function handleMessages(sock, messageUpdate, printLog) {
    try {
        const { messages, type } = messageUpdate;
        const message = messages?.[0];
        // Baileys emits messages sent from the bot's linked device as `append`
        // instead of `notify`. Process those only when they are fromMe so
        // commands sent into another person's DM are not silently ignored,
        // while avoiding processing unrelated history-sync messages.
        if (type !== 'notify' && type !== 'append') return;

        if (!message?.message) return;

        // Handle autoread functionality
        await handleAutoread(sock, message);

        // Store message for antidelete feature
        if (message.message) {
            storeMessage(sock, message);
        }

        // Handle message revocation
        if (message.message?.protocolMessage?.type === 0) {
            await handleMessageRevocation(sock, message);
            return;
        }

        const chatId = message.key.remoteJid;
        console.log("📩 DM DEBUG:", JSON.stringify({ jid: message.key.remoteJid, fromMe: message.key.fromMe, type, hasMessage: !!message.message }));
        const senderId = message.key.participant || message.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        const senderIsSudo = await isSudo(senderId);
        const senderIsOwnerOrSudo = await isOwnerOrSudo(senderId, sock, chatId);

        // Handle button responses
        if (message.message?.buttonsResponseMessage) {
            const buttonId = message.message.buttonsResponseMessage.selectedButtonId;
            const chatId = message.key.remoteJid;
        console.log("📩 DM DEBUG:", JSON.stringify({ jid: message.key.remoteJid, fromMe: message.key.fromMe, type, hasMessage: !!message.message }));

            if (buttonId === 'channel') {
                await sock.sendMessage(chatId, {
                    text: '📢 *Join our Channel:*\nPowered by LordBOTs'
                }, { quoted: message });
                return;
            } else if (buttonId === 'owner') {
                const ownerCommand = require('./commands/owner');
                await ownerCommand(sock, chatId);
                return;
            } else if (buttonId === 'support') {
                await sock.sendMessage(chatId, {
                    text: `🔗 *Support*\n\nPowered by LordBOTs`
                }, { quoted: message });
                return;
            }
        }

        let userMessage = (
            message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            message.message?.buttonsResponseMessage?.selectedButtonId?.trim() ||
            ''
        ).toLowerCase().replace(/\.\s+/g, '.').trim();

        // Preserve raw message for commands like .tag that need original casing
        const rawText = message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            '';

        // Only log command usage
        if (userMessage.startsWith('.')) {
            console.log(`📝 Command used in ${isGroup ? 'group' : 'private'}: ${userMessage}`);
        }
        // Read bot mode once; don't early-return so moderation can still run in private mode
        let isPublic = true;
        try {
            const data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
            if (typeof data.isPublic === 'boolean') isPublic = data.isPublic;
        } catch (error) {
            console.error('Error checking access mode:', error);
            // default isPublic=true on error
        }
        const isOwnerOrSudoCheck = message.key.fromMe || senderIsOwnerOrSudo;
        // Check if user is banned (skip ban check for unban command)
        if (isBanned(senderId) && !userMessage.startsWith('.unban')) {
            // Only respond occasionally to avoid spam
            if (Math.random() < 0.1) {
                await sock.sendMessage(chatId, {
                    text: '❌ You are banned from using the bot. Contact an admin to get unbanned.',
                    ...channelInfo
                });
            }
            return;
        }

        // First check if it's a game move
        if (/^[1-9]$/.test(userMessage) || userMessage.toLowerCase() === 'surrender') {
            await handleTicTacToeMove(sock, chatId, senderId, userMessage);
            return;
        }

        /*  // Basic message response in private chat
          if (!isGroup && (userMessage === 'hi' || userMessage === 'hello' || userMessage === 'bot' || userMessage === 'hlo' || userMessage === 'hey' || userMessage === 'bro')) {
              await sock.sendMessage(chatId, {
                  text: 'Hi, How can I help you?\nYou can use .menu for more info and commands.',
                  ...channelInfo
              });
              return;
          } */

        if (!message.key.fromMe) incrementMessageCount(chatId, senderId);

        // Check for bad words and antilink FIRST, before ANY other processing
        // Always run moderation in groups, regardless of mode
        if (isGroup) {
            if (userMessage) {
                await handleBadwordDetection(sock, chatId, message, userMessage, senderId);
            }
            // Antilink checks message text internally, so run it even if userMessage is empty
            await Antilink(message, sock);
            // Automod enforcement (antisticker, antiimage, antivideo, antispam, etc.)
            await enforceAutomod(sock, chatId, senderId, message);
        }

        // Universal DM handling:
// Never silently block direct messages here.
// Public/private command authorization is handled below.

        // Apply prefix logic
        userMessage = applyPrefixLogic(userMessage);

        // Then check for command prefix
        if (!userMessage.startsWith('.')) {
            // Show typing indicator if autotyping is enabled
            await handleAutotypingForMessage(sock, chatId, userMessage);

            if (isGroup) {
                // Always run moderation features (antitag) regardless of mode
                await handleTagDetection(sock, chatId, message, senderId);
                await handleMentionDetection(sock, chatId, message);

                // Only run chatbot in public mode or for owner/sudo
                if (isPublic || isOwnerOrSudoCheck) {
                    await handleChatbotResponse(sock, chatId, message, userMessage, senderId);
                }
            }
            return;
        }
        // In private mode, only owner/sudo can run commands
        if (!isPublic && !isOwnerOrSudoCheck) {
            return;
        }

        // List of admin commands
        const adminCommands = ['.mute', '.unmute', '.ban', '.unban', '.promote', '.demote', '.kick', '.tagall', '.tagnotadmin', '.hidetag', '.antilink', '.antitag', '.setgdesc', '.setgname', '.setgpp'];
        const isAdminCommand = adminCommands.some(cmd => userMessage.startsWith(cmd));

        // List of owner commands
        const ownerCommands = ['.mode', '.autostatus', '.antidelete', '.cleartmp', '.setpp', '.clearsession', '.areact', '.autoreact', '.autotyping', '.autoread', '.pmblocker'];
        const isOwnerCommand = ownerCommands.some(cmd => userMessage.startsWith(cmd));

        let isSenderAdmin = false;
        let isBotAdmin = false;

        // Check admin status only for admin commands in groups
        if (isGroup && isAdminCommand) {
            const adminStatus = await isAdmin(sock, chatId, senderId);
            isSenderAdmin = adminStatus.isSenderAdmin;
            isBotAdmin = adminStatus.isBotAdmin;

            if (!isBotAdmin) {
                await sock.sendMessage(chatId, { text: 'Please make the bot an admin to use admin commands.', ...channelInfo }, { quoted: message });
                return;
            }

            if (
                userMessage.startsWith('.mute') ||
                userMessage === '.unmute' ||
                userMessage.startsWith('.ban') ||
                userMessage.startsWith('.unban') ||
                userMessage.startsWith('.promote') ||
                userMessage.startsWith('.demote')
            ) {
                if (!isSenderAdmin && !message.key.fromMe) {
                    await sock.sendMessage(chatId, {
                        text: 'Sorry, only group admins can use this command.',
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }
            }
        }

        // Check owner status for owner commands
        if (isOwnerCommand) {
            if (!message.key.fromMe && !senderIsOwnerOrSudo) {
                await sock.sendMessage(chatId, { text: '❌ This command is only available for the owner or sudo!' }, { quoted: message });
                return;
            }
        }

        // Command handlers - Execute commands immediately without waiting for typing indicator
        // We'll show typing indicator after command execution if needed
        let commandExecuted = false;

        switch (true) {
            // ── Prefix toggle ────────────────────────────────────────────────
            case userMessage === '.prefixtoggle' || userMessage.startsWith('.setprefix') || userMessage === '.prefixinfo': {
                const _pfArgs = userMessage.split(' ').slice(1);
                await prefixToggleCommand(sock, chatId, message, userMessage.split(' ')[0], _pfArgs, senderId);
                break;
            }

            // ── Bot image ────────────────────────────────────────────────────
            case userMessage === '.setbotpic' || userMessage.startsWith('.setbotpic '):
                await botimageCommand(sock, chatId, message, '.setbotpic', senderId);
                break;

            case userMessage === '.simage': {
                const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                if (quotedMessage?.stickerMessage) {
                    await simageCommand(sock, quotedMessage, chatId);
                } else {
                    await sock.sendMessage(chatId, { text: 'Please reply to a sticker with the .simage command to convert it.', ...channelInfo }, { quoted: message });
                }
                commandExecuted = true;
                break;
            }
            case userMessage.startsWith('.kick'):
                const mentionedJidListKick = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await kickCommand(sock, chatId, senderId, mentionedJidListKick, message);
                break;
            case userMessage.startsWith('.mute'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const muteArg = parts[1];
                    const muteDuration = muteArg !== undefined ? parseInt(muteArg, 10) : undefined;
                    if (muteArg !== undefined && (isNaN(muteDuration) || muteDuration <= 0)) {
                        await sock.sendMessage(chatId, { text: 'Please provide a valid number of minutes or use .mute with no number to mute immediately.', ...channelInfo }, { quoted: message });
                    } else {
                        await muteCommand(sock, chatId, senderId, message, muteDuration);
                    }
                }
                break;
            case userMessage === '.unmute':
                await unmuteCommand(sock, chatId, senderId);
                break;
            case userMessage.startsWith('.ban'):
                if (!isGroup) {
                    if (!message.key.fromMe && !senderIsSudo) {
                        await sock.sendMessage(chatId, { text: 'Only owner/sudo can use .ban in private chat.' }, { quoted: message });
                        break;
                    }
                }
                await banCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.unban'):
                if (!isGroup) {
                    if (!message.key.fromMe && !senderIsSudo) {
                        await sock.sendMessage(chatId, { text: 'Only owner/sudo can use .unban in private chat.' }, { quoted: message });
                        break;
                    }
                }
                await unbanCommand(sock, chatId, message);
                break;
            case userMessage === '.help' || userMessage === '.menu' || userMessage === '.bot' || userMessage === '.list':
                await helpCommand(sock, chatId, message, global.channelLink);
                commandExecuted = true;
                break;
            case userMessage === '.sticker' || userMessage === '.s':
                await stickerCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.warnings'):
                const mentionedJidListWarnings = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await warningsCommand(sock, chatId, mentionedJidListWarnings);
                break;
            case userMessage.startsWith('.warn'):
                const mentionedJidListWarn = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await warnCommand(sock, chatId, senderId, mentionedJidListWarn, message);
                break;
            case userMessage.startsWith('.tts'):
                const text = userMessage.slice(4).trim();
                await ttsCommand(sock, chatId, text, message);
                break;
            case userMessage.startsWith('.delete') || userMessage.startsWith('.del'):
                await deleteCommand(sock, chatId, message, senderId);
                break;
            case userMessage.startsWith('.attp'):
                await attpCommand(sock, chatId, message);
                break;

            case userMessage === '.settings':
                await settingsCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.mode'):
                // Check if sender is the owner
                if (!message.key.fromMe && !senderIsOwnerOrSudo) {
                    await sock.sendMessage(chatId, { text: 'Only bot owner can use this command!', ...channelInfo }, { quoted: message });
                    return;
                }
                // Read current data first
                let data;
                try {
                    data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
                } catch (error) {
                    console.error('Error reading access mode:', error);
                    await sock.sendMessage(chatId, { text: 'Failed to read bot mode status', ...channelInfo });
                    return;
                }

                const action = userMessage.split(' ')[1]?.toLowerCase();
                // If no argument provided, show current status
                if (!action) {
                    const currentMode = data.isPublic ? 'public' : 'private';
                    await sock.sendMessage(chatId, {
                        text: `Current bot mode: *${currentMode}*\n\nUsage: .mode public/private\n\nExample:\n.mode public - Allow everyone to use bot\n.mode private - Restrict to owner only`,
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }

                if (action !== 'public' && action !== 'private') {
                    await sock.sendMessage(chatId, {
                        text: 'Usage: .mode public/private\n\nExample:\n.mode public - Allow everyone to use bot\n.mode private - Restrict to owner only',
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }

                try {
                    // Update access mode
                    data.isPublic = action === 'public';

                    // Save updated data
                    fs.writeFileSync('./data/messageCount.json', JSON.stringify(data, null, 2));

                    await sock.sendMessage(chatId, { text: `Bot is now in *${action}* mode`, ...channelInfo });
                } catch (error) {
                    console.error('Error updating access mode:', error);
                    await sock.sendMessage(chatId, { text: 'Failed to update bot access mode', ...channelInfo });
                }
                break;
            case userMessage.startsWith('.anticall'):
                if (!message.key.fromMe && !senderIsOwnerOrSudo) {
                    await sock.sendMessage(chatId, { text: 'Only owner/sudo can use anticall.' }, { quoted: message });
                    break;
                }
                {
                    const args = userMessage.split(' ').slice(1).join(' ');
                    await anticallCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.pmblocker'):
                {
                    const args = userMessage.split(' ').slice(1).join(' ');
                    await pmblockerCommand(sock, chatId, message, args);
                }
                commandExecuted = true;
                break;
            case userMessage === '.owner':
                await ownerCommand(sock, chatId);
                break;
            case userMessage === '.tagall':
                await tagAllCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.tagnotadmin':
                await tagNotAdminCommand(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.hidetag'):
                {
                    const messageText = rawText.slice(8).trim();
                    const replyMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
                    await hideTagCommand(sock, chatId, senderId, messageText, replyMessage, message);
                }
                break;
            case userMessage.startsWith('.tag'):
                const messageText = rawText.slice(4).trim();  // use rawText here, not userMessage
                const replyMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
                await tagCommand(sock, chatId, senderId, messageText, replyMessage, message);
                break;
            case userMessage.startsWith('.antilink'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, {
                        text: 'This command can only be used in groups.',
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }
                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, {
                        text: 'Please make the bot an admin first.',
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }
                await handleAntilinkCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message);
                break;
            case userMessage.startsWith('.antitag'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, {
                        text: 'This command can only be used in groups.',
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }
                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, {
                        text: 'Please make the bot an admin first.',
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }
                await handleAntitagCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message);
                break;
            case userMessage === '.meme':
                await memeCommand(sock, chatId, message);
                break;
            case userMessage === '.joke':
                await jokeCommand(sock, chatId, message);
                break;
            case userMessage === '.quote':
                await quoteCommand(sock, chatId, message);
                break;
            case userMessage === '.fact':
                await factCommand(sock, chatId, message, message);
                break;
            case userMessage.startsWith('.weather'):
                const city = userMessage.slice(9).trim();
                if (city) {
                    await weatherCommand(sock, chatId, message, city);
                } else {
                    await sock.sendMessage(chatId, { text: 'Please specify a city, e.g., .weather London', ...channelInfo }, { quoted: message });
                }
                break;
            case userMessage === '.news':
                await newsCommand(sock, chatId);
                break;
            case userMessage.startsWith('.ttt') || userMessage.startsWith('.tictactoe'):
                const tttText = userMessage.split(' ').slice(1).join(' ');
                await tictactoeCommand(sock, chatId, senderId, tttText);
                break;
            case userMessage.startsWith('.move'):
                const position = parseInt(userMessage.split(' ')[1]);
                if (isNaN(position)) {
                    await sock.sendMessage(chatId, { text: 'Please provide a valid position number for Tic-Tac-Toe move.', ...channelInfo }, { quoted: message });
                } else {
                    handleTicTacToeMove(sock, chatId, senderId, position);
                }
                break;
            case userMessage === '.topmembers':
                topMembers(sock, chatId, isGroup);
                break;
            case userMessage.startsWith('.hangman'):
                startHangman(sock, chatId);
                break;
            case userMessage.startsWith('.guess'):
                const guessedLetter = userMessage.split(' ')[1];
                if (guessedLetter) {
                    guessLetter(sock, chatId, guessedLetter);
                } else {
                    sock.sendMessage(chatId, { text: 'Please guess a letter using .guess <letter>', ...channelInfo }, { quoted: message });
                }
                break;
            case userMessage.startsWith('.trivia'):
                startTrivia(sock, chatId);
                break;
            case userMessage.startsWith('.answer'):
                const answer = userMessage.split(' ').slice(1).join(' ');
                if (answer) {
                    answerTrivia(sock, chatId, answer);
                } else {
                    sock.sendMessage(chatId, { text: 'Please provide an answer using .answer <answer>', ...channelInfo }, { quoted: message });
                }
                break;
            case userMessage.startsWith('.compliment'):
                await complimentCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.insult'):
                await insultCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.8ball'):
                const question = userMessage.split(' ').slice(1).join(' ');
                await eightBallCommand(sock, chatId, question);
                break;
            case userMessage.startsWith('.lyrics'):
                const songTitle = userMessage.split(' ').slice(1).join(' ');
                await lyricsCommand(sock, chatId, songTitle, message);
                break;
            case userMessage.startsWith('.simp'):
                const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await simpCommand(sock, chatId, quotedMsg, mentionedJid, senderId);
                break;
            case userMessage.startsWith('.stupid') || userMessage.startsWith('.itssostupid') || userMessage.startsWith('.iss'):
                const stupidQuotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const stupidMentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                const stupidArgs = userMessage.split(' ').slice(1);
                await stupidCommand(sock, chatId, stupidQuotedMsg, stupidMentionedJid, senderId, stupidArgs);
                break;
            case userMessage === '.dare':
                await dareCommand(sock, chatId, message);
                break;
            case userMessage === '.truth':
                await truthCommand(sock, chatId, message);
                break;
            case userMessage === '.clear':
                if (isGroup) await clearCommand(sock, chatId);
                break;
            case userMessage.startsWith('.promote'):
                const mentionedJidListPromote = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await promoteCommand(sock, chatId, mentionedJidListPromote, message);
                break;
            case userMessage.startsWith('.demote'):
                const mentionedJidListDemote = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await demoteCommand(sock, chatId, mentionedJidListDemote, message);
                break;
            case userMessage === '.ping':
                await pingCommand(sock, chatId, message);
                break;
            case userMessage === '.alive':
                await aliveCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.mention '):
                {
                    const args = userMessage.split(' ').slice(1).join(' ');
                    const isOwner = message.key.fromMe || senderIsSudo;
                    await mentionToggleCommand(sock, chatId, message, args, isOwner);
                }
                break;
            case userMessage === '.setmention':
                {
                    const isOwner = message.key.fromMe || senderIsSudo;
                    await setMentionCommand(sock, chatId, message, isOwner);
                }
                break;
            case userMessage.startsWith('.blur'):
                const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                await blurCommand(sock, chatId, message, quotedMessage);
                break;
            case userMessage.startsWith('.welcome'):
                if (isGroup) {
                    // Check admin status if not already checked
                    if (!isSenderAdmin) {
                        const adminStatus = await isAdmin(sock, chatId, senderId);
                        isSenderAdmin = adminStatus.isSenderAdmin;
                    }

                    if (isSenderAdmin || message.key.fromMe) {
                        await welcomeCommand(sock, chatId, message);
                    } else {
                        await sock.sendMessage(chatId, { text: 'Sorry, only group admins can use this command.', ...channelInfo }, { quoted: message });
                    }
                } else {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message });
                }
                break;
            case userMessage.startsWith('.goodbye'):
                if (isGroup) {
                    // Check admin status if not already checked
                    if (!isSenderAdmin) {
                        const adminStatus = await isAdmin(sock, chatId, senderId);
                        isSenderAdmin = adminStatus.isSenderAdmin;
                    }

                    if (isSenderAdmin || message.key.fromMe) {
                        await goodbyeCommand(sock, chatId, message);
                    } else {
                        await sock.sendMessage(chatId, { text: 'Sorry, only group admins can use this command.', ...channelInfo }, { quoted: message });
                    }
                } else {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message });
                }
                break;
            case userMessage === '.git':
            case userMessage === '.github':
            case userMessage === '.sc':
            case userMessage === '.script':
            case userMessage === '.repo':
                await githubCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.antibadword'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message });
                    return;
                }

                const adminStatus = await isAdmin(sock, chatId, senderId);
                isSenderAdmin = adminStatus.isSenderAdmin;
                isBotAdmin = adminStatus.isBotAdmin;

                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, { text: '*Bot must be admin to use this feature*', ...channelInfo }, { quoted: message });
                    return;
                }

                await antibadwordCommand(sock, chatId, message, senderId, isSenderAdmin);
                break;
            case userMessage.startsWith('.chatbot'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message });
                    return;
                }

                // Check if sender is admin or bot owner
                const chatbotAdminStatus = await isAdmin(sock, chatId, senderId);
                if (!chatbotAdminStatus.isSenderAdmin && !message.key.fromMe) {
                    await sock.sendMessage(chatId, { text: '*Only admins or bot owner can use this command*', ...channelInfo }, { quoted: message });
                    return;
                }

                const match = userMessage.slice(8).trim();
                await handleChatbotCommand(sock, chatId, message, match);
                break;
            case userMessage.startsWith('.take') || userMessage.startsWith('.steal'):
                {
                    const isSteal = userMessage.startsWith('.steal');
                    const sliceLen = isSteal ? 6 : 5; // '.steal' vs '.take'
                    const takeArgs = rawText.slice(sliceLen).trim().split(' ');
                    await takeCommand(sock, chatId, message, takeArgs);
                }
                break;
            case userMessage === '.flirt':
                await flirtCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.character'):
                await characterCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.waste'):
                await wastedCommand(sock, chatId, message);
                break;
            case userMessage === '.ship':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups!', ...channelInfo }, { quoted: message });
                    return;
                }
                await shipCommand(sock, chatId, message);
                break;
            case userMessage === '.groupinfo' || userMessage === '.infogp' || userMessage === '.infogrupo':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups!', ...channelInfo }, { quoted: message });
                    return;
                }
                await groupInfoCommand(sock, chatId, message);
                break;
            case userMessage === '.resetlink' || userMessage === '.revoke' || userMessage === '.anularlink':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups!', ...channelInfo }, { quoted: message });
                    return;
                }
                await resetlinkCommand(sock, chatId, senderId);
                break;
            case userMessage === '.staff' || userMessage === '.admins' || userMessage === '.listadmin':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups!', ...channelInfo }, { quoted: message });
                    return;
                }
                await staffCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.tourl') || userMessage.startsWith('.url'):
                await urlCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.emojimix') || userMessage.startsWith('.emix'):
                await emojimixCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.tg') || userMessage.startsWith('.stickertelegram') || userMessage.startsWith('.tgsticker') || userMessage.startsWith('.telesticker'):
                await stickerTelegramCommand(sock, chatId, message);
                break;

            case userMessage === '.vv':
                await viewOnceCommand(sock, chatId, message);
                break;
            case userMessage === '.clearsession' || userMessage === '.clearsesi':
                await clearSessionCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.autostatus'):
                const autoStatusArgs = userMessage.split(' ').slice(1);
                await autoStatusCommand(sock, chatId, message, autoStatusArgs);
                break;
            case userMessage.startsWith('.metallic'):
                await textmakerCommand(sock, chatId, message, userMessage, 'metallic');
                break;
            case userMessage.startsWith('.ice'):
                await textmakerCommand(sock, chatId, message, userMessage, 'ice');
                break;
            case userMessage.startsWith('.snow'):
                await textmakerCommand(sock, chatId, message, userMessage, 'snow');
                break;
            case userMessage.startsWith('.impressive'):
                await textmakerCommand(sock, chatId, message, userMessage, 'impressive');
                break;
            case userMessage.startsWith('.matrix'):
                await textmakerCommand(sock, chatId, message, userMessage, 'matrix');
                break;
            case userMessage.startsWith('.light'):
                await textmakerCommand(sock, chatId, message, userMessage, 'light');
                break;
            case userMessage.startsWith('.neon'):
                await textmakerCommand(sock, chatId, message, userMessage, 'neon');
                break;
            case userMessage.startsWith('.devil'):
                await textmakerCommand(sock, chatId, message, userMessage, 'devil');
                break;
            case userMessage.startsWith('.purple'):
                await textmakerCommand(sock, chatId, message, userMessage, 'purple');
                break;
            case userMessage.startsWith('.thunder'):
                await textmakerCommand(sock, chatId, message, userMessage, 'thunder');
                break;
            case userMessage.startsWith('.leaves'):
                await textmakerCommand(sock, chatId, message, userMessage, 'leaves');
                break;
            case userMessage.startsWith('.1917'):
                await textmakerCommand(sock, chatId, message, userMessage, '1917');
                break;
            case userMessage.startsWith('.arena'):
                await textmakerCommand(sock, chatId, message, userMessage, 'arena');
                break;
            case userMessage.startsWith('.hacker'):
                await textmakerCommand(sock, chatId, message, userMessage, 'hacker');
                break;
            case userMessage.startsWith('.sand'):
                await textmakerCommand(sock, chatId, message, userMessage, 'sand');
                break;
            case userMessage.startsWith('.blackpink'):
                await textmakerCommand(sock, chatId, message, userMessage, 'blackpink');
                break;
            case userMessage.startsWith('.glitch'):
                await textmakerCommand(sock, chatId, message, userMessage, 'glitch');
                break;
            case userMessage.startsWith('.fire'):
                await textmakerCommand(sock, chatId, message, userMessage, 'fire');
                break;
            case userMessage.startsWith('.antidelete'):
                const antideleteMatch = userMessage.slice(11).trim();
                await handleAntideleteCommand(sock, chatId, message, antideleteMatch);
                break;
            case userMessage === '.surrender':
                // Handle surrender command for tictactoe game
                await handleTicTacToeMove(sock, chatId, senderId, 'surrender');
                break;
            case userMessage === '.cleartmp':
                await clearTmpCommand(sock, chatId, message);
                break;
            case userMessage === '.setpp':
                await setProfilePicture(sock, chatId, message);
                break;
            case userMessage.startsWith('.setgdesc'):
                {
                    const text = rawText.slice(9).trim();
                    await setGroupDescription(sock, chatId, senderId, text, message);
                }
                break;
            case userMessage.startsWith('.setgname'):
                {
                    const text = rawText.slice(9).trim();
                    await setGroupName(sock, chatId, senderId, text, message);
                }
                break;
            case userMessage.startsWith('.setgpp'):
                await setGroupPhoto(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.instagram') || userMessage.startsWith('.insta') || (userMessage === '.ig' || userMessage.startsWith('.ig ')):
                await instagramCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.igsc'):
                await igsCommand(sock, chatId, message, true);
                break;
            case userMessage.startsWith('.igs'):
                await igsCommand(sock, chatId, message, false);
                break;
            case userMessage.startsWith('.igstalk'):
                await igstalkCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.tiktokstalk') || userMessage.startsWith('.ttstalk'):
                await tiktokstalkCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.gitstalk'):
                await gitstalkCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.fb') || userMessage.startsWith('.facebook'):
                await facebookCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.music'):
                await playCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.spotify'):
                await spotifyCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.play') || userMessage.startsWith('.mp3') || userMessage.startsWith('.ytmp3') || userMessage.startsWith('.song'):
                await songCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.video') || userMessage.startsWith('.ytmp4'):
                await videoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.tiktok') || userMessage.startsWith('.tt'):
                await tiktokCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.ai') ||
                 userMessage.startsWith('.ask') ||
                 userMessage.startsWith('.chat') ||
                 userMessage.startsWith('.gpt') ||
                 userMessage.startsWith('.groq') ||
                 userMessage === '.aimenu' ||
                 userMessage === '.aireset':
                await aiCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.translate') || userMessage.startsWith('.trt'):
                const commandLength = userMessage.startsWith('.translate') ? 10 : 4;
                await handleTranslateCommand(sock, chatId, message, userMessage.slice(commandLength));
                return;
            case userMessage.startsWith('.ss') || userMessage.startsWith('.ssweb') || userMessage.startsWith('.screenshot'):
                const ssCommandLength = userMessage.startsWith('.screenshot') ? 11 : (userMessage.startsWith('.ssweb') ? 6 : 3);
                await handleSsCommand(sock, chatId, message, userMessage.slice(ssCommandLength).trim());
                break;
            case userMessage.startsWith('.areact') || userMessage.startsWith('.autoreact') || userMessage.startsWith('.autoreaction'):
                await handleAreactCommand(sock, chatId, message, isOwnerOrSudoCheck);
                break;
            case userMessage.startsWith('.sudo'):
                await sudoCommand(sock, chatId, message);
                break;
            case userMessage === '.goodnight' || userMessage === '.lovenight' || userMessage === '.gn':
                await goodnightCommand(sock, chatId, message);
                break;
            case userMessage === '.shayari' || userMessage === '.shayri':
                await shayariCommand(sock, chatId, message);
                break;
            case userMessage === '.roseday':
                await rosedayCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.imagine') || userMessage.startsWith('.flux') || userMessage.startsWith('.dalle'): await imagineCommand(sock, chatId, message);
                break;
            case userMessage === '.jid': await groupJidCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.autotyping'):
                await autotypingCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.autoread'):
                await autoreadCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.heart'):
                await handleHeart(sock, chatId, message);
                break;
            case userMessage.startsWith('.horny'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['horny', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.circle'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['circle', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.lgbt'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['lgbt', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.lolice'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['lolice', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.simpcard'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['simpcard', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.tonikawa'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['tonikawa', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.its-so-stupid'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['its-so-stupid', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.namecard'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['namecard', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;

            case userMessage.startsWith('.oogway2'):
            case userMessage.startsWith('.oogway'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const sub = userMessage.startsWith('.oogway2') ? 'oogway2' : 'oogway';
                    const args = [sub, ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.tweet'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['tweet', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.ytcomment'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['youtube-comment', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.comrade'):
            case userMessage.startsWith('.gay'):
            case userMessage.startsWith('.glass'):
            case userMessage.startsWith('.jail'):
            case userMessage.startsWith('.passed'):
            case userMessage.startsWith('.triggered'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const sub = userMessage.slice(1).split(/\s+/)[0];
                    const args = [sub, ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.animu'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = parts.slice(1);
                    await animeCommand(sock, chatId, message, args);
                }
                break;
            // animu aliases
            case userMessage.startsWith('.nom'):
            case userMessage.startsWith('.poke'):
            case userMessage.startsWith('.cry'):
            case userMessage.startsWith('.kiss'):
            case userMessage.startsWith('.pat'):
            case userMessage.startsWith('.hug'):
            case userMessage.startsWith('.wink'):
            case userMessage.startsWith('.facepalm'):
            case userMessage.startsWith('.face-palm'):
            case userMessage.startsWith('.animuquote'):
            case userMessage.startsWith('.quote'):
            case userMessage.startsWith('.loli'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    let sub = parts[0].slice(1);
                    if (sub === 'facepalm') sub = 'face-palm';
                    if (sub === 'quote' || sub === 'animuquote') sub = 'quote';
                    await animeCommand(sock, chatId, message, [sub]);
                }
                break;
            case userMessage === '.crop':
                await stickercropCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.pies'):
                {
                    const parts = rawText.trim().split(/\s+/);
                    const args = parts.slice(1);
                    await piesCommand(sock, chatId, message, args);
                    commandExecuted = true;
                }
                break;
            case userMessage === '.china':
                await piesAlias(sock, chatId, message, 'china');
                commandExecuted = true;
                break;
            case userMessage === '.indonesia':
                await piesAlias(sock, chatId, message, 'indonesia');
                commandExecuted = true;
                break;
            case userMessage === '.japan':
                await piesAlias(sock, chatId, message, 'japan');
                commandExecuted = true;
                break;
            case userMessage === '.korea':
                await piesAlias(sock, chatId, message, 'korea');
                commandExecuted = true;
                break;
            case userMessage === '.india':
                await piesAlias(sock, chatId, message, 'india');
                commandExecuted = true;
                break;
            case userMessage === '.malaysia':
                await piesAlias(sock, chatId, message, 'malaysia');
                commandExecuted = true;
                break;
            case userMessage === '.thailand':
                await piesAlias(sock, chatId, message, 'thailand');
                commandExecuted = true;
                break;
            case userMessage.startsWith('.update'):
                {
                    const parts = rawText.trim().split(/\s+/);
                    const zipArg = parts[1] && parts[1].startsWith('http') ? parts[1] : '';
                    await updateCommand(sock, chatId, message, zipArg);
                }
                commandExecuted = true;
                break;
            case userMessage.startsWith('.removebg') || userMessage.startsWith('.rmbg') || userMessage.startsWith('.nobg'):
                await removebgCommand.exec(sock, message, userMessage.split(' ').slice(1));
                break;
            case userMessage.startsWith('.remini') || userMessage.startsWith('.enhance') || userMessage.startsWith('.upscale'):
                await reminiCommand(sock, chatId, message, userMessage.split(' ').slice(1));
                break;
            case userMessage.startsWith('.sora'):
                await soraCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.pair'): {
                const q = userMessage.slice(5).trim();
                await pairCommand(sock, chatId, message, q);
                commandExecuted = true;
                break;
            }

            // ── Fancy Fonts ────────────────────────────────────────────────
            case userMessage.startsWith('.fancyfonts') || userMessage.startsWith('.ff ') || userMessage === '.ff':
                await fancyfontsCommand(sock, chatId, message);
                commandExecuted = true;
                break;

            // ── Text Tools ─────────────────────────────────────────────────
            case userMessage.startsWith('.reverse') || userMessage.startsWith('.rev ') || userMessage === '.rev':
                await reverseCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.upper'):
                await upperCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.lower'):
                await lowerCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.mock') || userMessage.startsWith('.spongebob'):
                await mockCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.clap'):
                await clapCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.morse'):
                await morseCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.binary') || userMessage.startsWith('.bin ') || userMessage === '.bin':
                await binaryCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.base64') || userMessage.startsWith('.b64 ') || userMessage === '.b64':
                await base64Command(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.unbase64') || userMessage.startsWith('.ub64 ') || userMessage === '.ub64':
                await unbase64Command(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.snake'):
                await snakeCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.camel'):
                await camelCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage === '.uptime' || userMessage === '.runtime':
                await uptimeCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.calc') || userMessage.startsWith('.calculate'):
                await calcCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.password') || userMessage.startsWith('.genpass') || userMessage.startsWith('.passgen'):
                await passwordCommand(sock, chatId, message);
                commandExecuted = true;
                break;

            // ── Fun Tools ──────────────────────────────────────────────────
            case userMessage === '.coin' || userMessage === '.flipcoin' || userMessage === '.flip':
                await coinCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.dice') || userMessage.startsWith('.roll'):
                await diceCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.rps') || userMessage.startsWith('.rockpaperscissors'):
                await rpsCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.riddle'):
                await riddleCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage === '.pickup' || userMessage === '.pickupline' || userMessage === '.flirtline':
                await pickupCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage === '.roast':
                await roastCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage === '.yomama' || userMessage === '.ymj' || userMessage === '.yomomma':
                await yomomaCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage === '.catfact' || userMessage === '.cat':
                await catfactCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage === '.dogfact' || userMessage === '.dog':
                await dogfactCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage === '.wyr' || userMessage === '.wouldyourather':
                await wyrCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage === '.nhie' || userMessage === '.neverhaveiever':
                await nhieCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.zodiac'):
                await zodiacCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.bmi'):
                await bmiCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.numberfact') || userMessage.startsWith('.numfact'):
                await numberfactCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage === '.motivate' || userMessage === '.inspire' || userMessage === '.motivation':
                await motivateCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage === '.color' || userMessage === '.colour' || userMessage === '.randomcolor':
                await colorCommand(sock, chatId, message);
                commandExecuted = true;
                break;

            // ── moregroup commands ─────────────────────────────────────────
            case userMessage.startsWith('.add '):
                await mgAddCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.promoteall':
                await promoteAllCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.demoteall':
                await demoteAllCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.kickall':
                await kickAllCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.ex':
                await exCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.clearbanlist':
                await clearBanListCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.resetwarn':
                await resetWarnCommand(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.setwarn'):
                await setWarnCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.gctime':
                await gctimeCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.antileave'):
                await antileaveCommand(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.addbadword'):
                await addBadwordCommand(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.removebadword'):
                await removeBadwordCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.listbadword' || userMessage === '.listbadwords':
                await listBadwordCommand(sock, chatId, message);
                break;
            case userMessage === '.leave':
                await leaveCommand(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.creategroup') || userMessage.startsWith('.newgroup'):
                await createGroupCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.grouplink' || userMessage === '.invitelink':
                await groupLinkCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.tagadmin':
                await tagAdminCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.getgpp':
                await getGppCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.getpp'):
                await getPpCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.togstatus') || userMessage.startsWith('.togglestatus'):
                await togStatusCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.getparticipants' || userMessage === '.members':
                await getParticipantsCommand(sock, chatId, message);
                break;
            case userMessage === '.listonline':
                await listOnlineCommand(sock, chatId, message);
                break;
            case userMessage === '.listinactive':
                await listInactiveCommand(sock, chatId, message);
                break;
            case userMessage === '.approveall':
                await approveAllCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.rejectall':
                await rejectAllCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.stickerpack':
                await stickerPackCommand(sock, chatId, message);
                break;
            case userMessage === '.disp' || userMessage === '.groupsettings':
                await dispCommand(sock, chatId, message);
                break;
            case userMessage === '.fangtrace':
                await fangtraceCommand(sock, chatId, message);
                break;

            // ── automod commands ───────────────────────────────────────────
            case userMessage.startsWith('.antisticker'):
                await antiStickerCommand(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.antiimage'):
                await antiImageCommand(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.antivideo'):
                await antiVideoCommand(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.antiaudio'):
                await antiAudioCommand(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.antimention'):
                await antiMentionCommand(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.antistatusmention'):
                await antiStatusMentionCommand(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.antigrouplink'):
                await antiGroupLinkCommand(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.antidemote'):
                await antiDemoteCommand(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.antipromote'):
                await antiPromoteCommand(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.antigroupcall'):
                await antiGroupCallCommand(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.antispam'):
                await antiSpamCommand(sock, chatId, senderId, message);
                break;

            // ── security2 commands ─────────────────────────────────────────
            case userMessage.startsWith('.subdomain'):
                await subdomainCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.reverseip'):
                await reverseIpCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.geoip'):
                await geoipCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.portscan'):
                await portScanCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.headers'):
                await headersCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.pinghost'):
                await pingHostCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.traceroute'):
                await tracerouteCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.asnlookup'):
                await asnLookupCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.sslcheck'):
                await sslCheckCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.hashidentify'):
                await hashIdentifyCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.hashcheck'):
                await hashCheckCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.bcryptcheck'):
                await bcryptCheckCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.passwordstrength'):
                await passwordStrengthCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.urlscan'):
                await urlScanCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.phishcheck'):
                await phishCheckCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.robotscheck'):
                await robotsCheckCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.sitemap'):
                await sitemapCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.cmsdetect'):
                await cmsDetectCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.techstack'):
                await techStackCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.maclookup'):
                await macLookupCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.securityheaders'):
                await securityHeadersCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.nmap'):
                await nmapCommand(sock, chatId, message);
                break;
            case userMessage === '.securitymenu' || userMessage === '.hackermenu' || userMessage === '.ethicalmenu':
                await securityMenuCommand(sock, chatId, message);
                break;

            // ── stalker commands ───────────────────────────────────────────
            case userMessage.startsWith('.wachannel'):
                await waChannelCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.twitterstalk') || userMessage.startsWith('.xstalk'):
                await twitterStalkCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.ipstalk'):
                await ipStalkCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.npmstalk'):
                await npmStalkCommand(sock, chatId, message);
                break;
            case userMessage === '.stalkermenu' || userMessage === '.stalkmenu':
                await stalkerMenuCommand(sock, chatId, message);
                break;

            // ── utility2 commands ──────────────────────────────────────────
            case userMessage === '.ping2' || userMessage === '.speed':
                await ping2Command(sock, chatId, message);
                break;
            case userMessage === '.time' || userMessage === '.clock':
                await timeCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.define') || userMessage.startsWith('.meaning'):
                await defineCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.remind'):
                await remindCommand(sock, chatId, message);
                break;
            case userMessage === '.sessioninfo' || userMessage === '.session':
                await sessionInfoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.covid'):
                await covidCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.wiki') || userMessage.startsWith('.wikipedia'):
                await wikiCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.iplookup'):
                await ipLookupCommand(sock, chatId, message);
                break;
            case userMessage === '.getip' || userMessage === '.myip':
                await getIpCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.onwhatsapp') || userMessage.startsWith('.isonwa'):
                await onWhatsappCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.qrencode') || userMessage.startsWith('.qr ') || userMessage === '.qr':
                await qrEncodeCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.fetch ') || userMessage === '.fetch':
                await fetchCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.inspect'):
                await inspectCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.shazam'):
                await shazamCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.vcf ') || userMessage === '.vcf':
                await vcfCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.viewvcf'):
                await viewVcfCommand(sock, chatId, message);
                break;
            case userMessage === '.vv2':
                await vv2Command(sock, chatId, message);
                break;
            case userMessage.startsWith('.country'):
                await countryCommand(sock, chatId, message);
                break;
            case userMessage === '.platform' || userMessage === '.sysinfo':
                await platformCommand(sock, chatId, message);
                break;

            // ── owner2 commands ────────────────────────────────────────────
            case userMessage.startsWith('.setbotname'):
                await setBotNameCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.resetbotname':
                await resetBotNameCommand(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.setowner'):
                await setOwnerCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.resetowner':
                await resetOwnerCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.iamowner':
                await iAmOwnerCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.about' || userMessage === '.aboutbot':
                await aboutCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.block '):
                await blockCommand(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.unblock '):
                await unblockCommand(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.silent'):
                await silentCommand(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.broadcast') || userMessage.startsWith('.bc '):
                await broadcastCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.shutdown':
                await shutdownCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.restart':
                await restartCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.getsettings':
                await getSettingsCommand(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.setsetting'):
                await setSettingCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.disk' || userMessage === '.storage':
                await diskCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.hostip':
                await hostIpCommand(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.findcommands') || userMessage.startsWith('.search '):
                await findCommandsCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.latestupdates' || userMessage === '.changelog':
                await latestUpdatesCommand(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.online'):
                await onlineCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.privacy':
                await privacyCommand(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.lastseen'):
                await lastSeenCommand(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.setchannel'):
                await setChannelCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.resetchannel':
                await resetChannelCommand(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.setfooter'):
                await setFooterCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.test':
                await testCommand(sock, chatId, senderId, message);
                break;

            // ── sports2 commands ───────────────────────────────────────────
            case userMessage.startsWith('.matchstats'):
                await matchStatsCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.sportsnews'):
                await sportsNewsCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.teamnews'):
                await teamNewsCommand(sock, chatId, message);
                break;
            case userMessage === '.f1' || userMessage === '.formula1':
                await f1Command(sock, chatId, message);
                break;
            case userMessage === '.nfl':
                await nflCommand(sock, chatId, message);
                break;
            case userMessage === '.mma' || userMessage === '.ufc':
                await mmaCommand(sock, chatId, message);
                break;
            case userMessage === '.baseball' || userMessage === '.mlb':
                await baseballCommand(sock, chatId, message);
                break;
            case userMessage === '.hockey' || userMessage === '.nhl':
                await hockeyCommand(sock, chatId, message);
                break;
            case userMessage === '.golf' || userMessage === '.pga':
                await golfCommand(sock, chatId, message);
                break;
            case userMessage === '.sportsmenu':
                await sportsMenuCommand(sock, chatId, message);
                break;

            // ── fun2 commands ──────────────────────────────────────────────
            case userMessage === '.bf':
                await bfCommand(sock, chatId, message);
                break;
            case userMessage === '.gf':
                await gfCommand(sock, chatId, message);
                break;
            case userMessage === '.couple':
                await coupleCommand(sock, chatId, message);
                break;
            case userMessage === '.device':
                await deviceCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.movie ') || userMessage === '.movie':
                await movieCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.trailer ') || userMessage === '.trailer':
                await trailerCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.readsite') || userMessage.startsWith('.readweb'):
                await readSiteCommand(sock, chatId, message);
                break;
            case userMessage === '.goodmorning' || userMessage === '.gm':
                await goodMorningCommand(sock, chatId, message);
                break;
            case userMessage === '.channelstatus':
                await channelStatusCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.hack ') || userMessage === '.hack':
                await hackCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.genmusic'):
                await genMusicCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.genlyrics'):
                await genLyricsCommand(sock, chatId, message);
                break;

            // ── logo commands ──────────────────────────────────────────────
            case userMessage.startsWith('.goldlogo'):
                await logoCommands.goldlogoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.silverlogo'):
                await logoCommands.silverlogoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.firelogo'):
                await logoCommands.firelogoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.neonlogo'):
                await logoCommands.neonlogoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.icelogo'):
                await logoCommands.icelogoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.iceglowlogo'):
                await logoCommands.iceglowlogoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.lightninglogo'):
                await logoCommands.lightninglogoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.rainbowlogo'):
                await logoCommands.rainbowlogoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.shadowlogo'):
                await logoCommands.shadowlogoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.smokelogo'):
                await logoCommands.smokelogoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.bloodlogo'):
                await logoCommands.bloodlogoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.dragonlogo'):
                await logoCommands.dragonlogoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.platinumlogo'):
                await logoCommands.platinumlogoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.chromelogo'):
                await logoCommands.chromelogoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.diamondlogo'):
                await logoCommands.diamondlogoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.bronzelogo'):
                await logoCommands.bronzelogoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.steelogo') || userMessage.startsWith('.steellogo'):
                await (logoCommands.steelogoCommand || logoCommands.steellogCommand)(sock, chatId, message);
                break;
            case userMessage.startsWith('.copperlogo'):
                await logoCommands.copperlogoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.titaniumlogo'):
                await logoCommands.titaniumlogoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.sunlogo'):
                await logoCommands.sunlogoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.moonlogo'):
                await logoCommands.moonlogoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.aqualogo'):
                await logoCommands.aqualogoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.phoenixlogo'):
                await logoCommands.phoenixlogoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.wizardlogo'):
                await logoCommands.wizardlogoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.crystallogo'):
                await logoCommands.crystallogoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.darkmagiclogo'):
                await logoCommands.darkmagiclogoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.glowlogo'):
                await logoCommands.glowlogoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.gradientlogo'):
                await logoCommands.gradientlogoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.matrixlogo'):
                await logoCommands.matrixlogoCommand(sock, chatId, message);
                break;
            case userMessage === '.logomenu':
                await logoCommands.logoMenuCommand(sock, chatId, message);
                break;

            default:
                if (isGroup) {
                    // Handle non-command group messages
                    if (userMessage) {  // Make sure there's a message
                        await handleChatbotResponse(sock, chatId, message, userMessage, senderId);
                    }
                    await handleTagDetection(sock, chatId, message, senderId);
                    await handleMentionDetection(sock, chatId, message);
                }
                commandExecuted = false;
                break;
        }

        // If a command was executed, show typing status after command execution
        if (commandExecuted !== false) {
            // Command was executed, now show typing status after command execution
            await showTypingAfterCommand(sock, chatId);
        }

        // Function to handle .groupjid command
        async function groupJidCommand(sock, chatId, message) {
            const groupJid = message.key.remoteJid;

            if (!groupJid.endsWith('@g.us')) {
                return await sock.sendMessage(chatId, {
                    text: "❌ This command can only be used in a group."
                });
            }

            await sock.sendMessage(chatId, {
                text: `✅ Group JID: ${groupJid}`
            }, {
                quoted: message
            });
        }

        if (userMessage.startsWith('.')) {
            // After command is processed successfully
            await addCommandReaction(sock, message);
        }
    } catch (error) {
        console.error('❌ Error in message handler:', error.message);
        // chatId may not be in scope if the error occurred early, so derive it safely
        const _catchChatId = messageUpdate?.messages?.[0]?.key?.remoteJid;
        if (_catchChatId) {
            await sock.sendMessage(_catchChatId, {
                text: '❌ Failed to process command!',
                ...channelInfo
            }).catch(() => {});
        }
    }
}

async function handleGroupParticipantUpdate(sock, update) {
    try {
        const { id, participants, action, author } = update;

        // Check if it's a group
        if (!id.endsWith('@g.us')) return;

        // Respect bot mode: only announce promote/demote in public mode
        let isPublic = true;
        try {
            const modeData = JSON.parse(fs.readFileSync('./data/messageCount.json'));
            if (typeof modeData.isPublic === 'boolean') isPublic = modeData.isPublic;
        } catch (e) {
            // If reading fails, default to public behavior
        }

        // Handle promotion events
        if (action === 'promote') {
            if (!isPublic) return;
            await handlePromotionEvent(sock, id, participants, author);
            return;
        }

        // Handle demotion events
        if (action === 'demote') {
            if (!isPublic) return;
            await handleDemotionEvent(sock, id, participants, author);
            return;
        }

        // Handle join events
        if (action === 'add') {
            await handleJoinEvent(sock, id, participants);
        }

        // Handle leave events
        if (action === 'remove') {
            await handleLeaveEvent(sock, id, participants);
        }
    } catch (error) {
        console.error('Error in handleGroupParticipantUpdate:', error);
    }
}

// Instead, export the handlers along with handleMessages
module.exports = {
    handleMessages,
    handleGroupParticipantUpdate,
    handleStatus: async (sock, status) => {
        await handleStatusUpdate(sock, status);
    }
};