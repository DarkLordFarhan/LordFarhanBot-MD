const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'data', 'prefixes.json');

function load() {
    try {
        if (!fs.existsSync(file)) return {};
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
        return {};
    }
}

function save(data) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getPrefix(userId) {
    const data = load();
    return data[userId] || '.';
}

function setPrefix(userId, prefix) {
    const data = load();
    data[userId] = prefix;
    save(data);
    return prefix;
}

module.exports = {
    getPrefix,
    setPrefix
};
