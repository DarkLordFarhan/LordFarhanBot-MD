'use strict';
/**
 * Additional Sports Commands:
 * matchstats, sportsnews, teamnews, f1, nfl, mma, baseball, hockey, golf, sportsmenu
 */

const fetch = require('node-fetch');

function getText(m) {
    return (m.message?.conversation || m.message?.extendedTextMessage?.text || '').trim();
}
function getArg(m, cmd) {
    return getText(m).replace(new RegExp(`^\\.${cmd}\\s*`, 'i'), '').trim();
}

async function getSportsNews(category) {
    try {
        const res = await fetch(`https://newsapi.org/v2/top-headlines?category=sports&q=${encodeURIComponent(category)}&pageSize=5&language=en&apiKey=demo`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const d = await res.json();
        if (d.articles?.length) return d.articles;
    } catch {}
    // Fallback: BBC sports RSS
    try {
        const rssUrl = `https://feeds.bbci.co.uk/sport/${category.toLowerCase()}/rss.xml`;
        const res = await fetch(rssUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const xml = await res.text();
        const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 5);
        return items.map(m => ({
            title: (m[1].match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || m[1].match(/<title>(.*?)<\/title>/))?.[1] || 'N/A',
            description: (m[1].match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || [])[1]?.replace(/<[^>]*>/g, '').slice(0, 100) || '',
            url: (m[1].match(/<link>(.*?)<\/link>/))?.[1] || '',
        }));
    } catch {
        return [];
    }
}

// ── .matchstats ───────────────────────────────────────────────────────────────
async function matchStatsCommand(sock, chatId, message) {
    const query = getArg(message, 'matchstats');
    if (!query) return sock.sendMessage(chatId, { text: 'Usage: .matchstats <team1 vs team2>\nExample: .matchstats Man City vs Arsenal' }, { quoted: message });
    await sock.sendMessage(chatId, { text: '⚽ Fetching match stats…' }, { quoted: message });
    try {
        const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchevents.php?e=${encodeURIComponent(query)}`);
        const d = await res.json();
        const event = d.event?.[0];
        if (!event) throw new Error('No match found');
        await sock.sendMessage(chatId, {
            text: `⚽ *Match Stats*\n\n🏟 ${event.strEvent}\n📅 ${event.dateEvent}\n⏰ ${event.strTime || 'N/A'}\n🏆 League: ${event.strLeague}\n📊 Score: ${event.intHomeScore ?? '?'} - ${event.intAwayScore ?? '?'}\n🏠 Home: ${event.strHomeTeam}\n✈️ Away: ${event.strAwayTeam}\n📍 Venue: ${event.strVenue || 'N/A'}`
        }, { quoted: message });
    } catch {
        await sock.sendMessage(chatId, {
            text: `⚽ *Match Stats: ${query}*\n\n❓ No live stats available. Check live scores at:\n🔗 https://www.livescore.com\n🔗 https://www.sofascore.com`
        }, { quoted: message });
    }
}

// ── .sportsnews ───────────────────────────────────────────────────────────────
async function sportsNewsCommand(sock, chatId, message) {
    const sport = getArg(message, 'sportsnews') || 'football';
    await sock.sendMessage(chatId, { text: `📰 Fetching ${sport} news…` }, { quoted: message });
    const articles = await getSportsNews(sport);
    if (!articles.length) {
        return sock.sendMessage(chatId, { text: `❌ No ${sport} news found right now.` }, { quoted: message });
    }
    const text = articles.slice(0, 5).map((a, i) => `${i + 1}. *${a.title}*\n   ${(a.description || '').slice(0, 80)}…\n   🔗 ${a.url || ''}`).join('\n\n');
    await sock.sendMessage(chatId, { text: `📰 *Sports News: ${sport}*\n\n${text}` }, { quoted: message });
}

// ── .teamnews ─────────────────────────────────────────────────────────────────
async function teamNewsCommand(sock, chatId, message) {
    const team = getArg(message, 'teamnews');
    if (!team) return sock.sendMessage(chatId, { text: 'Usage: .teamnews <team name>\nExample: .teamnews Barcelona' }, { quoted: message });
    await sock.sendMessage(chatId, { text: `🔍 Fetching news for ${team}…` }, { quoted: message });
    try {
        const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(team)}`);
        const d = await res.json();
        const t = d.teams?.[0];
        if (!t) throw new Error('Team not found');
        await sock.sendMessage(chatId, {
            text: `🏟 *Team Info: ${t.strTeam}*\n\n🏆 Sport: ${t.strSport}\n🌍 Country: ${t.strCountry}\n🏟 Stadium: ${t.strStadium || 'N/A'}\n📅 Founded: ${t.intFormedYear || 'N/A'}\n👨‍💼 Manager: ${t.strManager || 'N/A'}\n📝 ${(t.strDescriptionEN || 'No description available').slice(0, 300)}…\n\n🔗 ${t.strWebsite || 'N/A'}`
        }, { quoted: message });
    } catch {
        await sock.sendMessage(chatId, { text: `❌ Team "${team}" not found.` }, { quoted: message });
    }
}

// ── .f1 ───────────────────────────────────────────────────────────────────────
async function f1Command(sock, chatId, message) {
    await sock.sendMessage(chatId, { text: '🏎 Fetching F1 standings…' }, { quoted: message });
    try {
        const res = await fetch('https://ergast.com/api/f1/current/driverStandings.json');
        const d = await res.json();
        const standings = d.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings?.slice(0, 10);
        if (!standings) throw new Error('No data');
        const lines = standings.map(s =>
            `${s.position}. ${s.Driver.givenName} ${s.Driver.familyName} (${s.Constructors?.[0]?.name}) — ${s.points} pts`
        );
        await sock.sendMessage(chatId, {
            text: `🏎 *F1 Driver Standings*\n\n${lines.join('\n')}`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, {
            text: `🏎 *F1 Racing*\n\nLive data unavailable. Check:\n🔗 https://www.formula1.com\n🔗 https://www.espn.com/f1/`
        }, { quoted: message });
    }
}

// ── .nfl ──────────────────────────────────────────────────────────────────────
async function nflCommand(sock, chatId, message) {
    await sock.sendMessage(chatId, { text: '🏈 Fetching NFL news…' }, { quoted: message });
    const articles = await getSportsNews('NFL');
    if (!articles.length) {
        return sock.sendMessage(chatId, { text: `🏈 *NFL*\n\nCheck live scores:\n🔗 https://www.nfl.com\n🔗 https://www.espn.com/nfl/` }, { quoted: message });
    }
    const text = articles.slice(0, 5).map((a, i) => `${i + 1}. *${a.title}*`).join('\n');
    await sock.sendMessage(chatId, { text: `🏈 *NFL News*\n\n${text}` }, { quoted: message });
}

// ── .mma ──────────────────────────────────────────────────────────────────────
async function mmaCommand(sock, chatId, message) {
    await sock.sendMessage(chatId, { text: '🥊 Fetching MMA/UFC news…' }, { quoted: message });
    const articles = await getSportsNews('MMA UFC');
    if (!articles.length) {
        return sock.sendMessage(chatId, { text: `🥊 *MMA*\n\nCheck:\n🔗 https://www.ufc.com\n🔗 https://www.mmafighting.com` }, { quoted: message });
    }
    const text = articles.slice(0, 5).map((a, i) => `${i + 1}. *${a.title}*`).join('\n');
    await sock.sendMessage(chatId, { text: `🥊 *MMA/UFC News*\n\n${text}` }, { quoted: message });
}

// ── .baseball ─────────────────────────────────────────────────────────────────
async function baseballCommand(sock, chatId, message) {
    await sock.sendMessage(chatId, { text: '⚾ Fetching baseball news…' }, { quoted: message });
    const articles = await getSportsNews('baseball MLB');
    if (!articles.length) {
        return sock.sendMessage(chatId, { text: `⚾ *Baseball*\n\nCheck:\n🔗 https://www.mlb.com\n🔗 https://www.espn.com/mlb/` }, { quoted: message });
    }
    const text = articles.slice(0, 5).map((a, i) => `${i + 1}. *${a.title}*`).join('\n');
    await sock.sendMessage(chatId, { text: `⚾ *Baseball/MLB News*\n\n${text}` }, { quoted: message });
}

// ── .hockey ───────────────────────────────────────────────────────────────────
async function hockeyCommand(sock, chatId, message) {
    await sock.sendMessage(chatId, { text: '🏒 Fetching hockey news…' }, { quoted: message });
    const articles = await getSportsNews('NHL hockey');
    if (!articles.length) {
        return sock.sendMessage(chatId, { text: `🏒 *Hockey*\n\nCheck:\n🔗 https://www.nhl.com\n🔗 https://www.espn.com/nhl/` }, { quoted: message });
    }
    const text = articles.slice(0, 5).map((a, i) => `${i + 1}. *${a.title}*`).join('\n');
    await sock.sendMessage(chatId, { text: `🏒 *Hockey/NHL News*\n\n${text}` }, { quoted: message });
}

// ── .golf ─────────────────────────────────────────────────────────────────────
async function golfCommand(sock, chatId, message) {
    await sock.sendMessage(chatId, { text: '⛳ Fetching golf news…' }, { quoted: message });
    const articles = await getSportsNews('PGA golf');
    if (!articles.length) {
        return sock.sendMessage(chatId, { text: `⛳ *Golf*\n\nCheck:\n🔗 https://www.pgatour.com\n🔗 https://www.espn.com/golf/` }, { quoted: message });
    }
    const text = articles.slice(0, 5).map((a, i) => `${i + 1}. *${a.title}*`).join('\n');
    await sock.sendMessage(chatId, { text: `⛳ *Golf/PGA News*\n\n${text}` }, { quoted: message });
}

// ── .sportsmenu ───────────────────────────────────────────────────────────────
async function sportsMenuCommand(sock, chatId, message) {
    const bar = '─'.repeat(28);
    await sock.sendMessage(chatId, {
        text: `🏆 *SPORTS MENU*\n\n┌${bar}┐\n⚽ *Football/Soccer*\n┃  .football <team/league>\n┃  .matchstats <team1 vs team2>\n┃  .teamnews <team>\n┃  .sportsnews football\n└${bar}┘\n\n┌${bar}┐\n🏀 *Basketball*\n┃  .basketball <team>\n└${bar}┘\n\n┌${bar}┐\n🏏 *Cricket*\n┃  .cricket\n└${bar}┘\n\n┌${bar}┐\n🎾 *Tennis*\n┃  .tennis\n└${bar}┘\n\n┌${bar}┐\n📋 *More Sports*\n┃  .f1     — Formula 1\n┃  .nfl    — American Football\n┃  .mma    — MMA / UFC\n┃  .baseball — MLB\n┃  .hockey — NHL\n┃  .golf   — PGA Tour\n└${bar}┘\n\n> 🤖 _LordFarhan Bot_`
    }, { quoted: message });
}

module.exports = {
    matchStatsCommand, sportsNewsCommand, teamNewsCommand,
    f1Command, nflCommand, mmaCommand, baseballCommand,
    hockeyCommand, golfCommand, sportsMenuCommand,
};
