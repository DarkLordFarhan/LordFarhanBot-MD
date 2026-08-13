const axios = require('axios');

module.exports = async function (sock, chatId, message, city) {
    try {
        if (!city?.trim()) return sock.sendMessage(chatId, { text: 'Usage: .weather <city>' }, { quoted: message });
        const geo = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`, { timeout: 15000 });
        const place = geo.data?.results?.[0];
        if (!place) return sock.sendMessage(chatId, { text: `❌ City not found: ${city}` }, { quoted: message });
        const res = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current_weather=true&hourly=relativehumidity_2m,apparent_temperature,precipitation_probability&timezone=auto`, { timeout: 15000 });
        const w = res.data.current_weather, h = res.data.hourly;
        const i = Math.max(0, (h.time || []).findIndex(t => t.startsWith(w.time.slice(0, 13))));
        const codes = { 0:'Clear sky ☀️',1:'Mainly clear 🌤️',2:'Partly cloudy ⛅',3:'Overcast ☁️',45:'Fog 🌫️',51:'Drizzle 🌦️',61:'Rain 🌧️',63:'Rain 🌧️',65:'Heavy rain 🌧️',71:'Snow 🌨️',73:'Snow ❄️',75:'Heavy snow ❄️',80:'Showers 🌦️',81:'Showers 🌦️',82:'Heavy showers ⛈️',95:'Thunderstorm ⛈️' };
        await sock.sendMessage(chatId, { text: `🌍 *Weather in ${place.name}, ${place.country}*\n\n🌡️ Temperature: ${w.temperature}°C\n🌡️ Feels like: ${h.apparent_temperature?.[i] ?? 'N/A'}°C\n☁️ Condition: ${codes[w.weathercode] || `Code ${w.weathercode}`}\n💧 Humidity: ${h.relativehumidity_2m?.[i] ?? 'N/A'}%\n🌬️ Wind: ${Math.round(w.windspeed)} km/h\n🌂 Rain chance: ${h.precipitation_probability?.[i] ?? 'N/A'}%\n\n> Source: Open-Meteo` }, { quoted: message });
    } catch (error) {
        console.error('Error fetching weather:', error);
        await sock.sendMessage(chatId, { text: 'Sorry, I could not fetch the weather right now.' }, { quoted: message } );
    }
};
