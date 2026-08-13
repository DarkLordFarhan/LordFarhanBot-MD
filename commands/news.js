const axios = require('axios');

module.exports = async function (sock, chatId, message) {
    try {
        const feeds = [
            'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Ffeeds.bbci.co.uk%2Fnews%2Fworld%2Frss.xml&count=7',
            'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Ffeeds.bbci.co.uk%2Fnews%2Frss.xml&count=7'
        ];
        let articles;
        for (const feed of feeds) {
            try {
                const r = await axios.get(feed, { timeout: 15000 });
                if (r.data?.status === 'ok' && r.data.items?.length) { articles = r.data.items.slice(0, 7); break; }
            } catch (_) {}
        }
        if (!articles?.length) throw new Error('No RSS feed available');
        let newsMessage = '📰 *WORLD NEWS*\n\n';
        articles.forEach((article, index) => {
            const desc = (article.description || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').slice(0, 120);
            newsMessage += `${index + 1}. *${article.title}*\n${desc}${desc.length === 120 ? '…' : ''}\n\n`;
        });
        await sock.sendMessage(chatId, { text: newsMessage + '> Source: BBC World News' }, { quoted: message });
    } catch (error) {
        console.error('Error fetching news:', error);
        await sock.sendMessage(chatId, { text: 'Sorry, I could not fetch news right now.' });
    }
};
