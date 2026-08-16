'use strict';
/**
 * Extended Ethical Hacking / Security Commands
 * Uses HackerTarget API (free, no key) + other public APIs
 */

const fetch = require('node-fetch');
const crypto = require('crypto');

function getText(m) {
    return (m.message?.conversation || m.message?.extendedTextMessage?.text || '').trim();
}
function getArg(m, cmd) {
    return getText(m).replace(new RegExp(`^\\.${cmd}\\s*`, 'i'), '').trim();
}

const HT = 'https://api.hackertarget.com';

// ── subdomain scan ────────────────────────────────────────────────────────────
async function subdomainCommand(sock, chatId, message) {
    const domain = getArg(message, 'subdomain');
    if (!domain) return sock.sendMessage(chatId, { text: 'Usage: .subdomain <domain>\nExample: .subdomain example.com' }, { quoted: message });
    await sock.sendMessage(chatId, { text: '🔍 Scanning subdomains…' }, { quoted: message });
    try {
        const res = await fetch(`${HT}/hostsearch/?q=${encodeURIComponent(domain)}`);
        const txt = await res.text();
        if (!txt || txt.includes('error')) throw new Error('No results');
        const lines = txt.trim().split('\n').slice(0, 20);
        await sock.sendMessage(chatId, {
            text: `🌐 *Subdomain Scan: ${domain}*\n\n${lines.join('\n')}${txt.split('\n').length > 20 ? `\n...and more` : ''}`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Subdomain scan failed: ${e.message}` }, { quoted: message });
    }
}

// ── reverse IP ────────────────────────────────────────────────────────────────
async function reverseIpCommand(sock, chatId, message) {
    const ip = getArg(message, 'reverseip');
    if (!ip) return sock.sendMessage(chatId, { text: 'Usage: .reverseip <ip/domain>' }, { quoted: message });
    await sock.sendMessage(chatId, { text: '🔍 Performing reverse IP lookup…' }, { quoted: message });
    try {
        const res = await fetch(`${HT}/reverseiplookup/?q=${encodeURIComponent(ip)}`);
        const txt = await res.text();
        if (!txt || txt.includes('error')) throw new Error('No results');
        const hosts = txt.trim().split('\n').slice(0, 25);
        await sock.sendMessage(chatId, {
            text: `🔄 *Reverse IP: ${ip}*\n\nHosts on same IP (${hosts.length}):\n${hosts.join('\n')}`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Reverse IP failed: ${e.message}` }, { quoted: message });
    }
}

// ── GeoIP ─────────────────────────────────────────────────────────────────────
async function geoipCommand(sock, chatId, message) {
    const ip = getArg(message, 'geoip');
    if (!ip) return sock.sendMessage(chatId, { text: 'Usage: .geoip <ip>' }, { quoted: message });
    try {
        const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`);
        const d = await res.json();
        if (d.error) throw new Error(d.reason || 'Not found');
        await sock.sendMessage(chatId, {
            text: `🌍 *GeoIP: ${ip}*\n\n🏳️ Country: ${d.country_name} (${d.country_code})\n🏙 City: ${d.city || 'N/A'}\n🗺 Region: ${d.region || 'N/A'}\n📮 Postal: ${d.postal || 'N/A'}\n🌐 ISP: ${d.org || 'N/A'}\n⏰ Timezone: ${d.timezone || 'N/A'}\n📍 Lat/Lon: ${d.latitude}, ${d.longitude}`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ GeoIP failed: ${e.message}` }, { quoted: message });
    }
}

// ── Port Scan ─────────────────────────────────────────────────────────────────
async function portScanCommand(sock, chatId, message) {
    const target = getArg(message, 'portscan');
    if (!target) return sock.sendMessage(chatId, { text: 'Usage: .portscan <ip/domain>' }, { quoted: message });
    await sock.sendMessage(chatId, { text: '🔍 Scanning ports (top 100)…' }, { quoted: message });
    try {
        const res = await fetch(`${HT}/nmap/?q=${encodeURIComponent(target)}`);
        const txt = await res.text();
        if (!txt || txt.includes('error')) throw new Error('Scan failed');
        const lines = txt.trim().split('\n').slice(0, 30);
        await sock.sendMessage(chatId, {
            text: `🛡️ *Port Scan: ${target}*\n\n${lines.join('\n')}`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Port scan failed: ${e.message}` }, { quoted: message });
    }
}

// ── HTTP Headers ──────────────────────────────────────────────────────────────
async function headersCommand(sock, chatId, message) {
    const url = getArg(message, 'headers');
    if (!url) return sock.sendMessage(chatId, { text: 'Usage: .headers <url>' }, { quoted: message });
    await sock.sendMessage(chatId, { text: '🔍 Fetching HTTP headers…' }, { quoted: message });
    try {
        const res = await fetch(`${HT}/httpheaders/?q=${encodeURIComponent(url)}`);
        const txt = await res.text();
        if (!txt || txt.includes('error')) throw new Error('Failed');
        await sock.sendMessage(chatId, {
            text: `📋 *HTTP Headers: ${url}*\n\n${txt.trim().slice(0, 2000)}`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Headers fetch failed: ${e.message}` }, { quoted: message });
    }
}

// ── Ping Host ─────────────────────────────────────────────────────────────────
async function pingHostCommand(sock, chatId, message) {
    const host = getArg(message, 'pinghost');
    if (!host) return sock.sendMessage(chatId, { text: 'Usage: .pinghost <host/ip>' }, { quoted: message });
    try {
        const res = await fetch(`${HT}/ping/?q=${encodeURIComponent(host)}`);
        const txt = await res.text();
        if (!txt || txt.includes('error')) throw new Error('Failed');
        await sock.sendMessage(chatId, {
            text: `📡 *Ping: ${host}*\n\n${txt.trim().slice(0, 1000)}`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Ping failed: ${e.message}` }, { quoted: message });
    }
}

// ── Traceroute ────────────────────────────────────────────────────────────────
async function tracerouteCommand(sock, chatId, message) {
    const host = getArg(message, 'traceroute');
    if (!host) return sock.sendMessage(chatId, { text: 'Usage: .traceroute <host/ip>' }, { quoted: message });
    await sock.sendMessage(chatId, { text: '🔍 Running traceroute…' }, { quoted: message });
    try {
        const res = await fetch(`${HT}/traceroute/?q=${encodeURIComponent(host)}`);
        const txt = await res.text();
        if (!txt || txt.includes('error')) throw new Error('Failed');
        await sock.sendMessage(chatId, {
            text: `🗺 *Traceroute: ${host}*\n\n${txt.trim().slice(0, 2000)}`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Traceroute failed: ${e.message}` }, { quoted: message });
    }
}

// ── ASN Lookup ────────────────────────────────────────────────────────────────
async function asnLookupCommand(sock, chatId, message) {
    const target = getArg(message, 'asnlookup');
    if (!target) return sock.sendMessage(chatId, { text: 'Usage: .asnlookup <ip/ASN>' }, { quoted: message });
    try {
        const res = await fetch(`${HT}/aslookup/?q=${encodeURIComponent(target)}`);
        const txt = await res.text();
        if (!txt || txt.includes('error')) throw new Error('Failed');
        await sock.sendMessage(chatId, {
            text: `🔎 *ASN Lookup: ${target}*\n\n${txt.trim()}`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ ASN lookup failed: ${e.message}` }, { quoted: message });
    }
}

// ── SSL Check ─────────────────────────────────────────────────────────────────
async function sslCheckCommand(sock, chatId, message) {
    const host = getArg(message, 'sslcheck');
    if (!host) return sock.sendMessage(chatId, { text: 'Usage: .sslcheck <domain>' }, { quoted: message });
    try {
        const res = await fetch(`https://ssl-checker.io/api/v1/check/${encodeURIComponent(host.replace(/https?:\/\//, ''))}`);
        const d = await res.json();
        if (!d) throw new Error('No data');
        await sock.sendMessage(chatId, {
            text: `🔒 *SSL Check: ${host}*\n\n✅ Valid: ${d.valid ?? 'N/A'}\n📅 Expiry: ${d.validTo || d.expires_on || 'N/A'}\n🏢 Issuer: ${d.issuer?.O || d.issuer || 'N/A'}\n🔐 Protocol: ${d.protocol || 'TLS'}`
        }, { quoted: message });
    } catch {
        // fallback: just try HTTPS connection check
        try {
            const check = await fetch(`https://${host.replace(/https?:\/\//, '')}`, { method: 'HEAD', timeout: 8000 });
            await sock.sendMessage(chatId, {
                text: `🔒 *SSL Check: ${host}*\n\n✅ HTTPS is reachable (${check.status})\nFor detailed cert info, use a browser's padlock icon.`
            }, { quoted: message });
        } catch (e2) {
            await sock.sendMessage(chatId, { text: `❌ SSL check failed: ${e2.message}` }, { quoted: message });
        }
    }
}

// ── Hash identify ─────────────────────────────────────────────────────────────
async function hashIdentifyCommand(sock, chatId, message) {
    const hash = getArg(message, 'hashidentify');
    if (!hash) return sock.sendMessage(chatId, { text: 'Usage: .hashidentify <hash>' }, { quoted: message });

    const patterns = [
        { regex: /^[a-f0-9]{32}$/i, type: 'MD5' },
        { regex: /^[a-f0-9]{40}$/i, type: 'SHA-1' },
        { regex: /^[a-f0-9]{56}$/i, type: 'SHA-224' },
        { regex: /^[a-f0-9]{64}$/i, type: 'SHA-256' },
        { regex: /^[a-f0-9]{96}$/i, type: 'SHA-384' },
        { regex: /^[a-f0-9]{128}$/i, type: 'SHA-512' },
        { regex: /^\$2[aby]\$\d+\$/i, type: 'bcrypt' },
        { regex: /^[a-z0-9]{13}$/i, type: 'DES (Unix)' },
        { regex: /^\$1\$/, type: 'MD5 (Unix)' },
        { regex: /^\$5\$/, type: 'SHA-256 (Unix)' },
        { regex: /^\$6\$/, type: 'SHA-512 (Unix)' },
    ];

    const matches = patterns.filter(p => p.regex.test(hash)).map(p => p.type);
    await sock.sendMessage(chatId, {
        text: `🔍 *Hash Identify*\n\nHash: \`${hash.slice(0, 60)}${hash.length > 60 ? '…' : ''}\`\nLength: ${hash.length}\n\n${matches.length ? '🎯 Possible types:\n' + matches.map(m => '  • ' + m).join('\n') : '❓ Unknown hash type'}`
    }, { quoted: message });
}

// ── Hash check (MD5/SHA1/SHA256) ──────────────────────────────────────────────
async function hashCheckCommand(sock, chatId, message) {
    const args = getArg(message, 'hashcheck').split(/\s+/);
    if (args.length < 2) return sock.sendMessage(chatId, { text: 'Usage: .hashcheck <text> <hash>\nExample: .hashcheck hello 5d41402abc4b2a76b9719d911017c592' }, { quoted: message });

    const [text, expectedHash] = [args[0], args[args.length - 1]];
    const md5 = crypto.createHash('md5').update(text).digest('hex');
    const sha1 = crypto.createHash('sha1').update(text).digest('hex');
    const sha256 = crypto.createHash('sha256').update(text).digest('hex');

    const match = [md5, sha1, sha256].some(h => h === expectedHash.toLowerCase());
    await sock.sendMessage(chatId, {
        text: `🔐 *Hash Check*\n\nText: "${text}"\nHash: ${expectedHash}\n\nMD5: ${md5}\nSHA1: ${sha1}\nSHA256: ${sha256}\n\n${match ? '✅ MATCH FOUND!' : '❌ No match'}`
    }, { quoted: message });
}

// ── bcrypt check ──────────────────────────────────────────────────────────────
async function bcryptCheckCommand(sock, chatId, message) {
    await sock.sendMessage(chatId, {
        text: '⚠️ bcrypt verification requires a server-side library (bcryptjs) which is not loaded by default.\n\nInstall it: npm install bcryptjs\n\nOr use .hashcheck for MD5/SHA hashes.'
    }, { quoted: message });
}

// ── Password strength ─────────────────────────────────────────────────────────
async function passwordStrengthCommand(sock, chatId, message) {
    const pwd = getArg(message, 'passwordstrength');
    if (!pwd) return sock.sendMessage(chatId, { text: 'Usage: .passwordstrength <password>' }, { quoted: message });

    let score = 0;
    const checks = {
        '8+ chars': pwd.length >= 8,
        '12+ chars': pwd.length >= 12,
        'Uppercase': /[A-Z]/.test(pwd),
        'Lowercase': /[a-z]/.test(pwd),
        'Numbers': /[0-9]/.test(pwd),
        'Symbols': /[^A-Za-z0-9]/.test(pwd),
        'No spaces': !/\s/.test(pwd),
    };

    for (const v of Object.values(checks)) if (v) score++;
    const strength = score <= 2 ? '🔴 Very Weak' : score <= 3 ? '🟠 Weak' : score <= 4 ? '🟡 Fair' : score <= 5 ? '🟢 Strong' : '💪 Very Strong';

    const report = Object.entries(checks).map(([k, v]) => `${v ? '✅' : '❌'} ${k}`).join('\n');
    await sock.sendMessage(chatId, {
        text: `🔑 *Password Strength*\n\nPassword: ${'*'.repeat(Math.min(pwd.length, 8))}\nLength: ${pwd.length}\n\n${report}\n\n${strength} (${score}/${Object.keys(checks).length})`
    }, { quoted: message });
}

// ── URL Scan ──────────────────────────────────────────────────────────────────
async function urlScanCommand(sock, chatId, message) {
    const url = getArg(message, 'urlscan');
    if (!url) return sock.sendMessage(chatId, { text: 'Usage: .urlscan <url>' }, { quoted: message });
    await sock.sendMessage(chatId, { text: '🔍 Scanning URL…' }, { quoted: message });
    try {
        // Use Google Safe Browsing public API (no key for basic check) 
        const encoded = encodeURIComponent(url);
        const res = await fetch(`https://transparencyreport.google.com/safe-browsing/search?url=${encoded}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const status = res.status;
        // Use urlvoid-style check via hackertarget
        const htRes = await fetch(`${HT}/pagelinks/?q=${encoded}`);
        const htTxt = await htRes.text();

        await sock.sendMessage(chatId, {
            text: `🔗 *URL Scan: ${url}*\n\nStatus: ${status === 200 ? '✅ Reachable' : '⚠️ Status ' + status}\nLinks found: ${htTxt ? htTxt.trim().split('\n').length : 0}\n\n🛡 For deep malware analysis visit: https://urlscan.io/search/#${encodeURIComponent(url)}`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ URL scan failed: ${e.message}` }, { quoted: message });
    }
}

// ── Phish Check ───────────────────────────────────────────────────────────────
async function phishCheckCommand(sock, chatId, message) {
    const url = getArg(message, 'phishcheck');
    if (!url) return sock.sendMessage(chatId, { text: 'Usage: .phishcheck <url>' }, { quoted: message });
    try {
        // Use phishtank or simple heuristic
        const suspicious = [
            /paypal.*login/i, /bank.*secure/i, /verify.*account/i,
            /click.*here.*now/i, /win.*prize/i, /free.*money/i,
            /\.tk$/, /\.ml$/, /\.ga$/, /\.cf$/,
            /bit\.ly/, /tinyurl/, /goo\.gl/,
        ];
        const flags = suspicious.filter(r => r.test(url)).length;
        const risk = flags === 0 ? '🟢 Low risk' : flags <= 2 ? '🟡 Suspicious' : '🔴 High risk (likely phishing)';

        await sock.sendMessage(chatId, {
            text: `🎣 *Phish Check: ${url}*\n\n${risk}\nSuspicious patterns: ${flags}\n\n⚠️ This is a heuristic check. Always verify manually.`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Phish check failed: ${e.message}` }, { quoted: message });
    }
}

// ── Robots check ──────────────────────────────────────────────────────────────
async function robotsCheckCommand(sock, chatId, message) {
    const domain = getArg(message, 'robotscheck').replace(/https?:\/\//, '').split('/')[0];
    if (!domain) return sock.sendMessage(chatId, { text: 'Usage: .robotscheck <domain>' }, { quoted: message });
    try {
        const res = await fetch(`https://${domain}/robots.txt`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const txt = await res.text();
        await sock.sendMessage(chatId, {
            text: `🤖 *Robots.txt: ${domain}*\n\n${txt.slice(0, 1500)}${txt.length > 1500 ? '\n...(truncated)' : ''}`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Could not fetch robots.txt: ${e.message}` }, { quoted: message });
    }
}

// ── Sitemap ───────────────────────────────────────────────────────────────────
async function sitemapCommand(sock, chatId, message) {
    const domain = getArg(message, 'sitemap').replace(/https?:\/\//, '').split('/')[0];
    if (!domain) return sock.sendMessage(chatId, { text: 'Usage: .sitemap <domain>' }, { quoted: message });
    try {
        const res = await fetch(`https://${domain}/sitemap.xml`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const txt = await res.text();
        const urls = (txt.match(/<loc>(.*?)<\/loc>/g) || []).map(u => u.replace(/<\/?loc>/g, '')).slice(0, 20);
        await sock.sendMessage(chatId, {
            text: `🗺 *Sitemap: ${domain}*\n\nFound ${urls.length} URLs:\n${urls.join('\n')}`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Sitemap fetch failed: ${e.message}` }, { quoted: message });
    }
}

// ── CMS Detect ────────────────────────────────────────────────────────────────
async function cmsDetectCommand(sock, chatId, message) {
    const domain = getArg(message, 'cmsdetect');
    if (!domain) return sock.sendMessage(chatId, { text: 'Usage: .cmsdetect <domain>' }, { quoted: message });
    await sock.sendMessage(chatId, { text: '🔍 Detecting CMS…' }, { quoted: message });
    try {
        const url = domain.startsWith('http') ? domain : `https://${domain}`;
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const body = await res.text();
        const headers = Object.fromEntries(res.headers);

        const cmsPatterns = [
            { name: 'WordPress', patterns: [/wp-content/i, /wp-includes/i] },
            { name: 'Joomla', patterns: [/\/templates\//, /joomla/i] },
            { name: 'Drupal', patterns: [/drupal/i, /\/sites\/default\//] },
            { name: 'Shopify', patterns: [/shopify/i, /cdn\.shopify/] },
            { name: 'Wix', patterns: [/wix\.com/i, /static\.wixstatic/] },
            { name: 'Squarespace', patterns: [/squarespace/i] },
            { name: 'Magento', patterns: [/magento/i, /\/mage\//] },
            { name: 'Ghost', patterns: [/ghost\./i] },
        ];

        const detected = cmsPatterns.filter(c => c.patterns.some(p => p.test(body))).map(c => c.name);
        const server = headers['server'] || 'Unknown';
        const powered = headers['x-powered-by'] || 'N/A';

        await sock.sendMessage(chatId, {
            text: `🖥️ *CMS Detection: ${domain}*\n\nCMS: ${detected.length ? detected.join(', ') : '❓ Unknown'}\nServer: ${server}\nPowered-by: ${powered}\nStatus: ${res.status}`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Detection failed: ${e.message}` }, { quoted: message });
    }
}

// ── Tech Stack ────────────────────────────────────────────────────────────────
async function techStackCommand(sock, chatId, message) {
    const domain = getArg(message, 'techstack');
    if (!domain) return sock.sendMessage(chatId, { text: 'Usage: .techstack <domain>' }, { quoted: message });
    await sock.sendMessage(chatId, { text: '🔍 Analyzing tech stack…' }, { quoted: message });
    try {
        const url = domain.startsWith('http') ? domain : `https://${domain}`;
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const body = await res.text();
        const h = Object.fromEntries(res.headers);

        const techs = [];
        if (/react/i.test(body) || /\_\_reactFiber/i.test(body)) techs.push('⚛️ React');
        if (/vue\.js/i.test(body) || /vue@/i.test(body)) techs.push('💚 Vue.js');
        if (/angular/i.test(body)) techs.push('🔴 Angular');
        if (/jquery/i.test(body)) techs.push('🔵 jQuery');
        if (/bootstrap/i.test(body)) techs.push('🟣 Bootstrap');
        if (/tailwind/i.test(body)) techs.push('🌊 Tailwind');
        if (/next\.js/i.test(body) || /__NEXT_DATA__/i.test(body)) techs.push('▲ Next.js');
        if (/nuxt/i.test(body)) techs.push('💚 Nuxt.js');
        if (/gatsby/i.test(body)) techs.push('🟣 Gatsby');
        if (/graphql/i.test(body)) techs.push('⬤ GraphQL');
        if (/nginx/i.test(h['server'] || '')) techs.push('🟩 Nginx');
        if (/apache/i.test(h['server'] || '')) techs.push('🟥 Apache');
        if (/cloudflare/i.test(h['cf-ray'] || h['server'] || '')) techs.push('🟠 Cloudflare');
        if (/php/i.test(h['x-powered-by'] || '')) techs.push('🐘 PHP');
        if (/node/i.test(h['x-powered-by'] || '')) techs.push('🟢 Node.js');

        await sock.sendMessage(chatId, {
            text: `⚙️ *Tech Stack: ${domain}*\n\n${techs.length ? techs.join('\n') : '❓ Could not detect technologies'}\n\nServer: ${h['server'] || 'N/A'}\nPowered-by: ${h['x-powered-by'] || 'N/A'}`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Tech stack analysis failed: ${e.message}` }, { quoted: message });
    }
}

// ── MAC Lookup ────────────────────────────────────────────────────────────────
async function macLookupCommand(sock, chatId, message) {
    const mac = getArg(message, 'maclookup').replace(/[^a-fA-F0-9]/g, '').slice(0, 6);
    if (!mac || mac.length < 6) return sock.sendMessage(chatId, { text: 'Usage: .maclookup <MAC address>\nExample: .maclookup 00:1A:2B:3C:4D:5E' }, { quoted: message });
    try {
        const res = await fetch(`https://api.macvendors.com/${mac}`);
        const vendor = await res.text();
        await sock.sendMessage(chatId, {
            text: `🔌 *MAC Lookup*\n\nMAC: ${mac.match(/.{1,2}/g)?.join(':').toUpperCase()}\nVendor: ${vendor || 'Unknown'}`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ MAC lookup failed: ${e.message}` }, { quoted: message });
    }
}

// ── Security Headers ──────────────────────────────────────────────────────────
async function securityHeadersCommand(sock, chatId, message) {
    const url = getArg(message, 'securityheaders');
    if (!url) return sock.sendMessage(chatId, { text: 'Usage: .securityheaders <url>' }, { quoted: message });
    try {
        const target = url.startsWith('http') ? url : `https://${url}`;
        const res = await fetch(target, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } });
        const h = Object.fromEntries(res.headers);

        const checks = {
            'Strict-Transport-Security': h['strict-transport-security'],
            'Content-Security-Policy': h['content-security-policy'],
            'X-Content-Type-Options': h['x-content-type-options'],
            'X-Frame-Options': h['x-frame-options'],
            'X-XSS-Protection': h['x-xss-protection'],
            'Referrer-Policy': h['referrer-policy'],
            'Permissions-Policy': h['permissions-policy'],
        };

        const report = Object.entries(checks).map(([k, v]) => `${v ? '✅' : '❌'} ${k}${v ? ': ' + v.slice(0, 40) : ''}`).join('\n');
        const score = Object.values(checks).filter(Boolean).length;

        await sock.sendMessage(chatId, {
            text: `🛡️ *Security Headers: ${url}*\n\n${report}\n\nScore: ${score}/${Object.keys(checks).length}`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Security headers check failed: ${e.message}` }, { quoted: message });
    }
}

// ── NMap (via HackerTarget) ───────────────────────────────────────────────────
async function nmapCommand(sock, chatId, message) {
    const target = getArg(message, 'nmap');
    if (!target) return sock.sendMessage(chatId, { text: 'Usage: .nmap <ip/domain>' }, { quoted: message });
    await sock.sendMessage(chatId, { text: '🔍 Running nmap scan…' }, { quoted: message });
    try {
        const res = await fetch(`${HT}/nmap/?q=${encodeURIComponent(target)}`);
        const txt = await res.text();
        if (!txt || txt.includes('error')) throw new Error('Scan blocked or failed');
        await sock.sendMessage(chatId, {
            text: `🗺 *Nmap: ${target}*\n\n${txt.trim().slice(0, 2000)}`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Nmap failed: ${e.message}` }, { quoted: message });
    }
}

// ── Security Menu ─────────────────────────────────────────────────────────────
async function securityMenuCommand(sock, chatId, message) {
    const bar = '─'.repeat(28);
    await sock.sendMessage(chatId, {
        text: `🛡️ *ETHICAL HACKING MENU*\n\n┌${bar}┐\n🔍 *Recon*\n┃  .whois <domain>\n┃  .dnslookup <domain>\n┃  .subdomain <domain>\n┃  .reverseip <ip>\n┃  .geoip <ip>\n┃  .asnlookup <ip>\n┃  .gitstalk <user>\n└${bar}┘\n\n┌${bar}┐\n🌐 *Network*\n┃  .portscan <host>\n┃  .nmap <host>\n┃  .pinghost <host>\n┃  .traceroute <host>\n┃  .headers <url>\n┃  .sslcheck <domain>\n┃  .maclookup <mac>\n└${bar}┘\n\n┌${bar}┐\n🔐 *Web Security*\n┃  .securityheaders <url>\n┃  .techstack <domain>\n┃  .cmsdetect <domain>\n┃  .robotscheck <domain>\n┃  .sitemap <domain>\n┃  .urlscan <url>\n┃  .phishcheck <url>\n└${bar}┘\n\n┌${bar}┐\n🔑 *Crypto*\n┃  .hashidentify <hash>\n┃  .hashcheck <text> <hash>\n┃  .passwordstrength <pwd>\n└${bar}┘\n\n> 🤖 _🌑༒𓆩『𝕃𝕆ℝ𝔻 𝔽𝔸ℝℍ𝔸ℕ 𝕄𝔻』𓆪༒☠️_`
    }, { quoted: message });
}

module.exports = {
    subdomainCommand, reverseIpCommand, geoipCommand, portScanCommand,
    headersCommand, pingHostCommand, tracerouteCommand, asnLookupCommand,
    sslCheckCommand, hashIdentifyCommand, hashCheckCommand, bcryptCheckCommand,
    passwordStrengthCommand, urlScanCommand, phishCheckCommand, robotsCheckCommand,
    sitemapCommand, cmsDetectCommand, techStackCommand, macLookupCommand,
    securityHeadersCommand, nmapCommand, securityMenuCommand,
};
