'use strict';
/**
 * Fun/utility commands:
 * .coin / .flipcoin        — flip a coin
 * .dice / .roll            — roll dice
 * .rps <r/p/s>             — rock paper scissors vs bot
 * .riddle                  — random riddle
 * .pickup / .pickupline    — pickup line
 * .roast                   — roast someone
 * .yomama / .ymj           — yo mama joke
 * .catfact / .cat          — cat fact
 * .dogfact / .dog          — dog fact
 * .wyr / .wouldyourather   — would you rather
 * .nhie / .neverhaveiever  — never have I ever
 * .zodiac <date>           — zodiac sign from birthday
 * .bmi <weight> <height>   — BMI calculator
 * .numberfact <n>          — fact about a number
 * .motivate / .inspire     — motivational quote
 * .country <name>          — basic country info
 * .color                   — random color
 */

const fetch = require('node-fetch');

function getText(message) {
    return (
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text || ''
    ).trim();
}

// ── coin flip ─────────────────────────────────────────────────────────────────
async function coinCommand(sock, chatId, message) {
    const result = Math.random() < 0.5 ? '🪙 *HEADS*' : '🪙 *TAILS*';
    await sock.sendMessage(chatId, { text: `Flipping coin...\n\n${result}!` }, { quoted: message });
}

// ── dice roll ─────────────────────────────────────────────────────────────────
async function diceCommand(sock, chatId, message) {
    const args = getText(message).replace(/^\.(dice|roll)\s*/i, '').trim();
    // Format: .dice 2d6 or .dice 6
    let sides = 6, count = 1;
    if (args.includes('d')) {
        [count, sides] = args.split('d').map(Number);
    } else if (args) {
        sides = parseInt(args) || 6;
    }
    count = Math.min(Math.max(count || 1, 1), 10);
    sides = Math.min(Math.max(sides || 6, 2), 100);

    const rolls = Array.from({ length: count }, () => Math.ceil(Math.random() * sides));
    const total = rolls.reduce((a, b) => a + b, 0);
    const diceEmoji = ['⚀','⚁','⚂','⚃','⚄','⚅'];
    const display = count === 1 ? (diceEmoji[rolls[0] - 1] || `[${rolls[0]}]`) : rolls.join(', ');
    await sock.sendMessage(chatId, {
        text: `🎲 *Rolled ${count}d${sides}*\n${display}${count > 1 ? `\nTotal: *${total}*` : ''}`
    }, { quoted: message });
}

// ── rock paper scissors ───────────────────────────────────────────────────────
async function rpsCommand(sock, chatId, message) {
    const args = getText(message).replace(/^\.(rps|rockpaperscissors)\s*/i, '').toLowerCase().trim();
    const choices = { r: 'Rock 🪨', p: 'Paper 📄', s: 'Scissors ✂️', rock: 'Rock 🪨', paper: 'Paper 📄', scissors: 'Scissors ✂️' };
    const key = ['rock','r'].includes(args) ? 'r' : ['paper','p'].includes(args) ? 'p' : ['scissors','s'].includes(args) ? 's' : null;
    if (!key) return sock.sendMessage(chatId, { text: '✂️ Usage: .rps rock / .rps paper / .rps scissors\n(or r / p / s)' }, { quoted: message });
    const botKey = ['r','p','s'][Math.floor(Math.random() * 3)];
    const wins = { r: 's', p: 'r', s: 'p' };
    let outcome;
    if (key === botKey) outcome = '🤝 *Draw!*';
    else if (wins[key] === botKey) outcome = '🎉 *You win!*';
    else outcome = '🤖 *Bot wins!*';
    await sock.sendMessage(chatId, {
        text: `✊ *Rock Paper Scissors*\nYou: ${choices[key]}\nBot: ${choices[botKey]}\n\n${outcome}`
    }, { quoted: message });
}

// ── riddle ────────────────────────────────────────────────────────────────────
const RIDDLES = [
    { q: "I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?", a: "An echo" },
    { q: "The more you take, the more you leave behind. What am I?", a: "Footsteps" },
    { q: "I have cities, but no houses live there. I have mountains, but no trees grow there. I have water, but no fish swim there. What am I?", a: "A map" },
    { q: "What has hands but can't clap?", a: "A clock" },
    { q: "What gets wetter the more it dries?", a: "A towel" },
    { q: "I'm tall when I'm young, and short when I'm old. What am I?", a: "A candle" },
    { q: "What has legs but doesn't walk?", a: "A table" },
    { q: "I have a head and a tail but no body. What am I?", a: "A coin" },
    { q: "What can you catch but not throw?", a: "A cold" },
    { q: "What goes up but never comes down?", a: "Your age" },
    { q: "I have keys but no locks, space but no room, and you can enter but can't go outside. What am I?", a: "A keyboard" },
    { q: "What is full of holes but still holds a lot of water?", a: "A sponge" },
    { q: "What runs but has no legs?", a: "A river" },
    { q: "What has one eye but cannot see?", a: "A needle" },
    { q: "Forward I am heavy, but backwards I am not. What am I?", a: "A ton" },
];

const riddleState = new Map();

async function riddleCommand(sock, chatId, message) {
    const userText = getText(message).replace(/^\.riddle\s*/i, '').trim();
    const state = riddleState.get(chatId);

    if (state && userText) {
        // Check answer
        const isCorrect = userText.toLowerCase().includes(state.answer.toLowerCase().split(' ')[0]);
        riddleState.delete(chatId);
        await sock.sendMessage(chatId, {
            text: isCorrect
                ? `✅ *Correct!* The answer is: *${state.answer}* 🎉`
                : `❌ *Wrong!* The answer was: *${state.answer}*`
        }, { quoted: message });
        return;
    }

    const r = RIDDLES[Math.floor(Math.random() * RIDDLES.length)];
    riddleState.set(chatId, { answer: r.a });
    await sock.sendMessage(chatId, {
        text: `🧩 *RIDDLE*\n\n${r.q}\n\n_Reply with your answer!_`
    }, { quoted: message });
}

// ── pickup lines ──────────────────────────────────────────────────────────────
const PICKUPS = [
    "Are you a magician? Because whenever I look at you, everyone else disappears.",
    "Do you have a map? I keep getting lost in your eyes.",
    "Is your name Google? Because you have everything I've been searching for.",
    "Are you a parking ticket? Because you've got 'fine' written all over you.",
    "Do you believe in love at first sight, or should I walk by again?",
    "Are you a camera? Every time I look at you, I smile.",
    "Is your name Wi-Fi? Because I'm feeling a connection.",
    "Do you have a BandAid? I just scraped my knee falling for you.",
    "Are you made of copper and tellurium? Because you are CuTe.",
    "If you were a vegetable, you'd be a cute-cumber.",
    "Are you a star? Because your beauty lights up the room.",
    "I must be a snowflake, because I've fallen for you.",
];

async function pickupCommand(sock, chatId, message) {
    const line = PICKUPS[Math.floor(Math.random() * PICKUPS.length)];
    await sock.sendMessage(chatId, { text: `💘 *Pick-up Line:*\n\n"${line}"` }, { quoted: message });
}

// ── roast ─────────────────────────────────────────────────────────────────────
const ROASTS = [
    "You're the reason they put instructions on shampoo bottles.",
    "I'd roast you, but my mom said I'm not allowed to burn trash.",
    "You're not stupid; you just have bad luck thinking.",
    "Light travels faster than sound, which is why you seemed bright until you spoke.",
    "I'd agree with you, but then we'd both be wrong.",
    "You have your entire life to be an idiot. Why not take a day off?",
    "You're proof that evolution can go in reverse.",
    "If laughter is the best medicine, your face must be curing the world.",
    "Brains aren't everything. In your case they're nothing.",
    "I'd call you a tool, but tools are actually useful.",
    "You're like a cloud — when you disappear, it's a beautiful day.",
];

async function roastCommand(sock, chatId, message) {
    const roast = ROASTS[Math.floor(Math.random() * ROASTS.length)];
    await sock.sendMessage(chatId, { text: `🔥 *Roasted!*\n\n"${roast}"` }, { quoted: message });
}

// ── yo mama ───────────────────────────────────────────────────────────────────
const YOMAMA = [
    "Yo mama so fat, when she sat on a dollar bill, blood came out of Washington's nose.",
    "Yo mama so old, she has Jesus's autograph.",
    "Yo mama so slow, she got a speeding ticket riding a turtle.",
    "Yo mama so short, she does backflips under the bed.",
    "Yo mama so tall, she did a backflip and kicked God in the chin.",
    "Yo mama so dumb, she stared at an orange juice carton for 2 hours because it said 'Concentrate'.",
    "Yo mama so poor, she waves an ice cream cone around and calls it air conditioning.",
    "Yo mama so clumsy, she fell into a chair and couldn't get up.",
];

async function yomomaCommand(sock, chatId, message) {
    const joke = YOMAMA[Math.floor(Math.random() * YOMAMA.length)];
    await sock.sendMessage(chatId, { text: `😂 *Yo Mama Joke:*\n\n${joke}` }, { quoted: message });
}

// ── cat fact ──────────────────────────────────────────────────────────────────
async function catfactCommand(sock, chatId, message) {
    try {
        const r = await fetch('https://catfact.ninja/fact', { timeout: 8000 });
        const d = await r.json();
        await sock.sendMessage(chatId, { text: `🐱 *Cat Fact:*\n\n${d.fact}` }, { quoted: message });
    } catch {
        const facts = [
            "Cats have 5 toes on their front paws but only 4 on the back.",
            "A group of cats is called a clowder.",
            "Cats sleep 12–16 hours a day.",
            "A cat's purr can help heal bones.",
            "Cats can jump up to 6 times their length.",
        ];
        await sock.sendMessage(chatId, { text: `🐱 *Cat Fact:*\n\n${facts[Math.floor(Math.random() * facts.length)]}` }, { quoted: message });
    }
}

// ── dog fact ──────────────────────────────────────────────────────────────────
async function dogfactCommand(sock, chatId, message) {
    try {
        const r = await fetch('https://dogapi.dog/api/v2/facts', { timeout: 8000 });
        const d = await r.json();
        const fact = d?.data?.[0]?.attributes?.body;
        if (fact) return await sock.sendMessage(chatId, { text: `🐶 *Dog Fact:*\n\n${fact}` }, { quoted: message });
    } catch {}
    const facts = [
        "A dog's nose print is as unique as a human fingerprint.",
        "Dogs have 3 eyelids.",
        "The Basenji dog doesn't bark — it yodels.",
        "Dogs can smell your feelings.",
        "Greyhounds can run up to 45 mph.",
    ];
    await sock.sendMessage(chatId, { text: `🐶 *Dog Fact:*\n\n${facts[Math.floor(Math.random() * facts.length)]}` }, { quoted: message });
}

// ── Would You Rather ──────────────────────────────────────────────────────────
const WYR = [
    ["fly but only at walking speed", "be invisible but only when no one is looking at you"],
    ["always feel itchy", "always feel like you need to sneeze"],
    ["have unlimited money but no time", "have unlimited time but no money"],
    ["be able to speak to animals", "speak all human languages"],
    ["always be 10 minutes late", "always be 20 minutes early"],
    ["have no internet for a year", "have no friends for a year"],
    ["be the funniest person in the room", "be the smartest person in the room"],
    ["eat only pizza forever", "eat only tacos forever"],
    ["never sleep but not be tired", "sleep 20 hours and be fully awake 4 hours"],
    ["know when you will die", "know how you will die"],
];

async function wyrCommand(sock, chatId, message) {
    const w = WYR[Math.floor(Math.random() * WYR.length)];
    await sock.sendMessage(chatId, {
        text: `🤔 *Would You Rather...*\n\n🅰️ *${w[0]}*\n\n_OR_\n\n🅱️ *${w[1]}*`
    }, { quoted: message });
}

// ── Never Have I Ever ─────────────────────────────────────────────────────────
const NHIE = [
    "Never have I ever stayed up all night playing video games.",
    "Never have I ever eaten an entire pizza by myself.",
    "Never have I ever lied to get out of doing something.",
    "Never have I ever cried during a movie.",
    "Never have I ever forgotten someone's name right after being introduced.",
    "Never have I ever pretended to be sick to skip school or work.",
    "Never have I ever sent a message to the wrong person.",
    "Never have I ever walked into a glass door.",
    "Never have I ever fallen asleep in class or at work.",
    "Never have I ever regifted a present.",
];

async function nhieCommand(sock, chatId, message) {
    const item = NHIE[Math.floor(Math.random() * NHIE.length)];
    await sock.sendMessage(chatId, {
        text: `🙈 *Never Have I Ever*\n\n"${item}"\n\n_React with 🙋 if you HAVE done this!_`
    }, { quoted: message });
}

// ── zodiac ────────────────────────────────────────────────────────────────────
function getZodiac(day, month) {
    const signs = [
        [1,20,'Aquarius ♒'],[2,19,'Pisces ♓'],[3,21,'Aries ♈'],[4,20,'Taurus ♉'],
        [5,21,'Gemini ♊'],[6,21,'Cancer ♋'],[7,23,'Leo ♌'],[8,23,'Virgo ♍'],
        [9,23,'Libra ♎'],[10,23,'Scorpio ♏'],[11,22,'Sagittarius ♐'],[12,22,'Capricorn ♑'],
        [13,0,'Aquarius ♒'],
    ];
    for (const [m, d, sign] of signs) {
        if (month < m || (month === m && day <= d)) return sign;
    }
    return 'Unknown';
}

async function zodiacCommand(sock, chatId, message) {
    const args = getText(message).replace(/^\.zodiac\s*/i, '').trim();
    const match = args.match(/(\d{1,2})[\s\/\-](\d{1,2})/);
    if (!match) return sock.sendMessage(chatId, { text: 'Usage: .zodiac DD/MM\nExample: .zodiac 15/03' }, { quoted: message });
    const day = parseInt(match[1]), month = parseInt(match[2]);
    if (day < 1 || day > 31 || month < 1 || month > 12) return sock.sendMessage(chatId, { text: '❌ Invalid date.' }, { quoted: message });
    const sign = getZodiac(day, month);
    await sock.sendMessage(chatId, {
        text: `♈ *Zodiac Sign*\nDate: ${day}/${month}\nSign: *${sign}*`
    }, { quoted: message });
}

// ── BMI ───────────────────────────────────────────────────────────────────────
async function bmiCommand(sock, chatId, message) {
    const args = getText(message).replace(/^\.bmi\s*/i, '').trim().split(/\s+/);
    if (args.length < 2) return sock.sendMessage(chatId, { text: 'Usage: .bmi <weight_kg> <height_cm>\nExample: .bmi 70 175' }, { quoted: message });
    const weight = parseFloat(args[0]), height = parseFloat(args[1]);
    if (!weight || !height) return sock.sendMessage(chatId, { text: '❌ Invalid values.' }, { quoted: message });
    const bmi = weight / ((height / 100) ** 2);
    let category;
    if (bmi < 18.5) category = 'Underweight 🔵';
    else if (bmi < 25) category = 'Normal weight 🟢';
    else if (bmi < 30) category = 'Overweight 🟡';
    else category = 'Obese 🔴';
    await sock.sendMessage(chatId, {
        text: `⚖️ *BMI Calculator*\nWeight: ${weight}kg | Height: ${height}cm\n\nBMI: *${bmi.toFixed(1)}*\nCategory: *${category}*`
    }, { quoted: message });
}

// ── number fact ───────────────────────────────────────────────────────────────
async function numberfactCommand(sock, chatId, message) {
    const args = getText(message).replace(/^\.(numberfact|numfact)\s*/i, '').trim();
    const num = parseInt(args) || Math.floor(Math.random() * 1000);
    try {
        const r = await fetch(`http://numbersapi.com/${num}?json`, { timeout: 8000 });
        const d = await r.json();
        await sock.sendMessage(chatId, { text: `🔢 *Number Fact:*\n\n${d.text}` }, { quoted: message });
    } catch {
        await sock.sendMessage(chatId, { text: `🔢 *Number Fact:*\n\n${num} is a fascinating number!` }, { quoted: message });
    }
}

// ── motivational quote ────────────────────────────────────────────────────────
const MOTIVATIONS = [
    "The only way to do great work is to love what you do. — Steve Jobs",
    "Believe you can and you're halfway there. — Theodore Roosevelt",
    "It always seems impossible until it's done. — Nelson Mandela",
    "Don't watch the clock; do what it does. Keep going. — Sam Levenson",
    "The future belongs to those who believe in the beauty of their dreams. — Eleanor Roosevelt",
    "It does not matter how slowly you go as long as you do not stop. — Confucius",
    "Success is not final, failure is not fatal: it is the courage to continue that counts. — Winston Churchill",
    "The secret of getting ahead is getting started. — Mark Twain",
    "You miss 100% of the shots you don't take. — Wayne Gretzky",
    "Life is what happens when you're busy making other plans. — John Lennon",
    "Hardships often prepare ordinary people for an extraordinary destiny. — C.S. Lewis",
    "Do something today that your future self will thank you for.",
    "Push yourself, because no one else is going to do it for you.",
    "Great things never come from comfort zones.",
    "Dream it. Wish it. Do it.",
];

async function motivateCommand(sock, chatId, message) {
    const quote = MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)];
    await sock.sendMessage(chatId, { text: `💪 *Motivation of the Day:*\n\n"${quote}"` }, { quoted: message });
}

// ── random color ──────────────────────────────────────────────────────────────
async function colorCommand(sock, chatId, message) {
    const hex = '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0').toUpperCase();
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    await sock.sendMessage(chatId, {
        text: `🎨 *Random Color*\nHEX: \`${hex}\`\nRGB: rgb(${r}, ${g}, ${b})\n\n_A unique color just for you!_`
    }, { quoted: message });
}

module.exports = {
    coinCommand,
    diceCommand,
    rpsCommand,
    riddleCommand,
    pickupCommand,
    roastCommand,
    yomomaCommand,
    catfactCommand,
    dogfactCommand,
    wyrCommand,
    nhieCommand,
    zodiacCommand,
    bmiCommand,
    numberfactCommand,
    motivateCommand,
    colorCommand,
};
