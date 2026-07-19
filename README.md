# 🤖 LordFarhan Bot

This is a WhatsApp bot built using the Baileys library for group management, including features like tagging all members, muting/unmuting, and many more. It's designed to help admins efficiently manage WhatsApp groups.

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&pause=1000&color=5EBB26&width=435&lines=LordFarhan+Bot+;Coded+by+DarkLordFarhanXMDTech+)](https://git.io/typing-svg)

<div align="center"> 
  <a href="https://youtube.com/@DarkLordFarhanXMD"> 
    <img src="https://github.com/DarkLordFarhan/LordFarhanBot-MD/blob/main/assets/bot_image.jpg" alt="LordFarhan" height="300"> 
  </a> 
</div>

<div align="center">
  <img src="https://img.shields.io/github/followers/DarkLordFarhan?style=for-the-badge&label=Followers" alt="Followers"/>
  <img src="https://img.shields.io/github/stars/DarkLordFarhan/LordFarhanBot-MD?style=for-the-badge&label=Stars" alt="Stars"/>
  <img src="https://img.shields.io/github/forks/DarkLordFarhan/LordFarhanbot-MD?style=for-the-badge&label=Forks" alt="Forks"/>
  <img src="https://img.shields.io/github/watchers/DarkLordFarhan/LordFarhanbot-MD?style=for-the-badge&label=Watchers" alt="Watchers"/>
</div>

---
<div>
  <a href="Wagan wadau" target="_blank">
    <" alt="DarkLord" width="100%" />
  </a>
</div>

<br>

<div align="left">
  
</div>

<br>

<div align="left">
  <a href="We try Always" target="_blank">
  
  </a>
</div>


## 🚀 Steps to Deploy Bot

### Step 1: Fork the Repository

Click the button below to fork the LordFarhan repository to your GitHub account:

<div align="center">
  <a href="https://github.com/DarkLordFarhan/LordFarhanbot-MD/fork">
    <img src="https://img.shields.io/badge/Fork-Repository-blue?style=for-the-badge" alt="Fork the repository"/>
  </a>
</div>

---

### Step 2: Get Your SESSION_ID

You need a SESSION_ID to connect the bot to your WhatsApp without scanning a QR code every time.

<div align="center">

[![Pair Code](https://img.shields.io/badge/🔑%20GET%20SESSION%20ID-Pair%20Site-blueviolet?style=for-the-badge&logo=whatsapp&logoColor=white)](https://lordfarhanbot-production.up.railway.app/)

</div>

> 🔗 **Pair Site:** https://lordfarhanbot-production.up.railway.app/

```
╔══════════════════════════════════════════════╗
║  1. Open the Pair Site above                 ║
║  2. Enter your WhatsApp number (with code)   ║
║     e.g. 254712345678 (no + or spaces)       ║
║  3. A 8-digit code appears — enter it in     ║
║     WhatsApp → Linked Devices → Link Device  ║
║  4. The bot DMs you the SESSION_ID           ║
╚══════════════════════════════════════════════╝
```

Copy the full `SESSION_ID` value — you'll paste it in each deployment below.

---

### Step 3: Choose Your Deployment

---

## 📱 Deploy on Termux (Android)

Run the bot directly on your Android phone using Termux.

### Requirements
- [Termux](https://f-droid.org/en/packages/com.termux/) installed from **F-Droid** (not Play Store)

### Commands

```bash
# 1. Update packages and install dependencies
pkg update -y && pkg upgrade -y
pkg install -y nodejs git ffmpeg

# 2. Clone the bot
git clone https://github.com/DarkLordFarhan/LordFarhanBot-MD.git
cd LordFarhanBot-MD

# 3. Install Node packages
npm install

# 4. Set your SESSION_ID
echo "SESSION_ID=YOUR_SESSION_ID_HERE" > .env

# 5. Start the bot
npm start
```

> Replace `YOUR_SESSION_ID_HERE` with the SESSION_ID you got from Step 2.

### Keep bot running after closing Termux

```bash
# Install tmux
pkg install tmux

# Start a tmux session
tmux new -s lordfarhan

# Run the bot inside tmux
cd LordFarhanBot-MD && npm start

# Detach (bot keeps running): press Ctrl+B then D
# Reattach later: tmux attach -t lordfarhan
```

### Update the bot later

```bash
cd LordFarhanBot-MD
git pull
npm install
npm start
```

---

## 🖥️ Deploy on Bot-hosting.net (Panel)

### Setup Steps

1. **Create a new server** on [bot-hosting.net](https://bot-hosting.net/)
2. **Set Node.js version to 18 or higher** in server settings
3. **Go to the Git tab** and paste your forked repo URL:
   ```
   https://github.com/YOUR_USERNAME/LordFarhanBot-MD.git
   ```
   Click **Pull** to clone the files.

4. **Set Startup Command** (in the Startup tab):
   ```
   npm install --legacy-peer-deps && npm start
   ```

5. **Set Environment Variable** (in the Variables / Startup tab):
   ```
   SESSION_ID = YOUR_SESSION_ID_HERE
   ```

6. **Start the server** — the bot will install packages and connect automatically.

> ⚠️ **If it crashes on install:** Go to the Console tab and run:
> ```
> npm install --legacy-peer-deps --ignore-scripts=false
> ```
> Then start the server again.

---

## 🟣 Deploy on Katabump (Recommended Panel)

<div align="center">
<a href="https://dashboard.katabump.com/auth/login#d6b7d6" target="_blank">
  <img src="https://img.shields.io/badge/Katabump-D6B7D6?style=for-the-badge&logo=server&logoColor=black" alt="Katabump"/>
</a>
</div>

1. Sign up at [dashboard.katabump.com](https://dashboard.katabump.com/auth/login#d6b7d6)
2. Create a new Node.js server
3. Pull from your forked repo
4. Set startup command: `npm install --legacy-peer-deps && npm start`
5. Add `SESSION_ID` in the Variables tab
6. Start — works out of the box ✅

---

## ☁️ Deploy on Railway

<div align="center">
<a href="https://railway.app" target="_blank">
  <img src="https://img.shields.io/badge/Deploy%20on-Railway-5865F2?style=for-the-badge&logo=railway&logoColor=white" alt="Railway"/>
</a>
</div>

1. Go to [railway.app](https://railway.app) and create a new project
2. Connect your GitHub and select your forked repo
3. Add `SESSION_ID` in the **Variables** tab
4. Railway auto-detects Node.js and deploys — no extra config needed

---

## 🖧 Deploy on VPS

<div align="center">
  <a href="https://client.petrosky.io/aff.php?aff=394" target="_blank">
    <img src="https://img.shields.io/badge/petrosky vps-0078E7?style=for-the-badge" alt="petrosky vps"/>
  </a>
</div>

```bash
# Install Node.js 20 (if not installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs git ffmpeg

# Clone the bot
git clone https://github.com/DarkLordFarhan/LordFarhanBot-MD.git
cd LordFarhanBot-MD

# Install packages
npm install --legacy-peer-deps

# Set SESSION_ID
echo "SESSION_ID=YOUR_SESSION_ID_HERE" > .env

# Run with pm2 (keeps running after SSH disconnect)
npm install -g pm2
pm2 start index.js --name LordFarhanBot
pm2 save
pm2 startup
```

---

### Join Us

<div align="center">
  <a href="https://t.me/+3QhFUZHx-nhhZmY1">
    <img src="https://img.shields.io/badge/Join%20Telegram-0078E7?style=for-the-badge&logo=telegram&logoColor=white" alt="Join Telegram"/>
  </a>
</div>

---

## ⚙️ Features

- **Tag all group members** with the `.tagall` command
- **Admin restricted usage** (only group admins can use certain commands)
- **Games** like Tic-Tac-Toe for interactive group engagement
- **Text-to-Speech** with `.tts`
- **Sticker creation** with `.sticker`
- **Anti-link detection** for group safety
- **AI chat** with `.gpt` and `.gemini`
- **Music & video downloads** with `.play`, `.song`, `.video`
- **Warn and manage group members** with admin control

---

## 📖 About

The LordFarhan WhatsApp Bot assists group admins by providing tools to efficiently manage large WhatsApp groups. Built on the Baileys library with multi-device support, SESSION_ID-based auth (no QR rescanning), and fallback APIs for AI and downloads.

---

## 🛠️ Manual Setup

### Prerequisites

- Node.js 18+ and Git

### Steps

1. **Clone:**

    ```bash
    git clone https://github.com/DarkLordFarhan/LordFarhanbot-MD.git
    cd LordFarhanbot-MD
    ```

2. **Install:**

    ```bash
    npm install --legacy-peer-deps
    ```

3. **Configure:**

    ```bash
    echo "SESSION_ID=YOUR_SESSION_ID_HERE" > .env
    ```

4. **Run:**

    ```bash
    npm start
    ```

---

## ☕ Support Me

<div align="center">

<a href="0795463911" target="_blank">
  <img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Support%20Developer-FF813F?style=for-the-badge&logo=buy-me-a-coffee&logoColor=white" alt="Buy Me a Coffee">
</a>

</div>

If you find this project helpful and want to support the developer, consider buying me a coffee! Your support helps maintain and improve this open-source project.

<div align="center">

<img src="" alt="" width="200">

</div>

---

## 📄 License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT) - see the [LICENSE](https://github.com/DarkLordFarhan/LordFarhanbot-MD/blob/main/LICENSE) file for details.

---

## 🙌 Contributions

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/DarkLordFarhan/LordFarhanbot-MD/issues).

---

## 🌟 Show your support

If you like this project, please give it a [⭐️ star on GitHub](https://github.com/DarkLordFarhan/LordFahanbot)!


## Credits

- [MYSTERYLORD](https://github.com/DarkLordFarhan)


---

## ⚠️ Important Warning

**Note:** This bot is created for educational purposes only. This is NOT an official WhatsApp bot. Using this bot may lead to your WhatsApp account being banned. Use it at your own risk. The developers will not be responsible for any consequences or account bans that may occur while using this bot.

## 📝 Legal

- This project is not affiliated with, authorized, maintained, sponsored or endorsed by WhatsApp or any of its affiliates or subsidiaries.
- This is an independent and unofficial software. Use at your own risk.
- Do not spam people with this bot.
- Do not use this bot to send bulk messages or for illegal purposes.
- The developers assume no liability and are not responsible for any misuse or damage caused by this program.

### License
This project is licensed under the MIT License. However, you must:
- Use this software in compliance with all applicable laws and regulations
- Include original license and copyright notices
- Credit original authors
- Not use for spam or malicious purposes

## 📜 Copyright Notice

Copyright (c) 2026 DarkLordFarhan. All rights reserved.

This project contains code from various open source projects:
- Baileys (MIT License)
- Other libraries as listed in package.json
