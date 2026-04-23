<h1 align="center">👾 BruxaBot</h1>

<p align="center">
  <b>High-Performance Messenger Automated ChatBot</b><br/>
  Built on GoatBot V2 &nbsp;•&nbsp; Enhanced by Rakib Adil &nbsp;•&nbsp; Powered by STFCA
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18%2B-brightgreen?style=flat-square"/>
  <img src="https://img.shields.io/badge/Platform-Messenger-blue?style=flat-square"/>
  <img src="https://img.shields.io/badge/Framework-BruxaBot-black?style=flat-square"/>
  <img src="https://img.shields.io/badge/Status-Active-success?style=flat-square"/>
  <img src="https://img.shields.io/badge/License-Custom-red?style=flat-square"/>
</p>

---

## 📚 Table of Contents

1. [Overview](#1-overview)
2. [Base Repositories](#2-base-repositories)
3. [Core Features](#-3-core-features)
4. [Requirements](#-4-requirements)
5. [Quick Install](#-5-quick-install)
6. [Project Structure](#-6-project-structure)
7. [Configuration — Full Reference](#-7-configuration--full-reference)
8. [Event System — Full Explanation](#-8-event-system--full-explanation)
9. [Database System](#-9-database-system)
10. [Role & Permission System](#-10-role--permission-system)
11. [Command System — Full Guide](#-11-command-system--full-guide)
12. [Available API Functions](#-12-available-api-functions)
13. [Shizuoka Chatbot Command](#-13-shizuoka-chatbot-command)
14. [Backend API — Full Reference](#-14-backend-api--full-reference)
15. [STFCA Engine](#-15-stfca-engine)
16. [Startup Notification System](#-16-startup-notification-system)
17. [Bio Auto-Updater](#-17-bio-auto-updater)
18. [reactToRemove Moderation](#-18-reacttoremove-moderation)
19. [Whitelist Mode](#-19-whitelist-mode)
20. [Logging System](#-20-logging-system)
21. [Hosting Guide](#-21-hosting-guide)
22. [Performance Tips](#-22-performance-tips)
23. [Security Notes](#-23-security-notes)
24. [Credits](#-24-credits)
25. [Contact](#-25-contact)
26. [License & Disclaimer](#-26-license--disclaimer)

---

## 👾 1. Overview

**BruxaBot** is a deeply enhanced Messenger automation chatbot built on three pillars:

| Layer | What it is |
|---|---|
| 🐐 **GoatBot V2** | The base — provides the event loop, command loader, and database abstraction |
| ⚡ **STFCA** | The communication engine — connects to Facebook Messenger via an improved unofficial API |
| 🔧 **Rakib Adil's architecture** | The enhancement layer — RA() system, Claude AI integration, startup notifications, persona logic |

**Designed for:**
- Automating Messenger groups at scale
- Building modular, permission-controlled command systems
- Event-driven logic (messages, replies, reactions)
- Developers who want full control — not a pre-packaged toy bot

> 💡 **Beginner tip:** Think of BruxaBot like a Lego system. GoatBot V2 is the baseplate, STFCA is the power supply, and Rakib Adil's customizations are the advanced pieces on top. You build your bot by adding command files — no need to touch the core.

---

## 🔗 2. Base Repositories

| Project | URL | Role |
|---|---|---|
| **BruxaBot** | https://github.com/bruxa6t9/BruxaBot | Main framework (this repo) |
| **GoatBot V2** | https://github.com/ntkhang03/Goat-Bot-V2 | Original base system |
| **ST-BOT** | https://github.com/sheikhtamimlover/ST-BOT.git | STFCA reference implementation |

---

## ⚡ 3. Core Features

| Feature | Description |
|---|---|
| 🔐 **Email + Password Login** | Log in via STFCA — no manual cookie setup |
| 🍪 **Cookie Auto-Refresh** | Session stays alive automatically |
| 🔑 **2FA Support** | Works with two-factor authenticated accounts |
| ⚡ **STFCA Engine** | Faster, more stable than legacy FCA |
| 🧠 **RA() System** | Internal reusable execution layer for shared logic |
| 🚀 **Startup Notification** | Bot announces itself to admins/threads on boot |
| 📝 **Bio Auto-Updater** | Automatically updates the bot account's Facebook bio |
| 💬 **reactToRemove** | React with an emoji to remove a message (moderation) |
| 🔒 **Whitelist Mode** | Restrict the bot to specific user IDs only |
| 🧩 **Modular Event System** | onStart / onChat / onReply / onReaction hooks |
| 🗄️ **Multi-DB Support** | JSON (testing), SQLite (recommended), MongoDB (production) |
| 📡 **Logging System** | Tracks messages, reactions, events, and errors |
| ⚙️ **Config-Driven** | Everything controlled from one `config.json` file |
| 🤖 **Claude AI Integration** | Shizuoka command uses Anthropic's API for AI chat with memory |

---

## 📦 4. Requirements

- **Node.js 18+** — [Download here](https://nodejs.org)
- Basic JavaScript knowledge (for writing commands)
- A secondary Facebook account (recommended — see [Security Notes](#-23-security-notes))
- For Claude AI: An [Anthropic API key](https://console.anthropic.com)
- For MongoDB: A [MongoDB Atlas](https://mongodb.com/atlas) connection string

> 💡 **Beginner tip:** To check your Node.js version, run `node -v` in your terminal. If it shows v18 or higher, you're good.

---

## ⚡ 5. Quick Install

```bash
# Clone BruxaBot into your current directory
git clone https://github.com/bruxa6t9/BruxaBot.git && cp -r BruxaBot/. . && rm -rf BruxaBot
```

```bash
# Install all dependencies
npm install

# If you're using the Claude AI backend, also install:
npm install node-fetch@2
```

```bash
# Start the bot
node index.js
```

> 💡 **What does that one-liner do?**
> 1. `git clone` — downloads the repo into a folder called `BruxaBot`
> 2. `cp -r BruxaBot/. .` — copies all files into your current directory
> 3. `rm -rf BruxaBot` — removes the now-empty clone folder
> This leaves your working directory clean with just the bot files.

---

## 🗂️ 6. Project Structure

```
/
├── index.js              ← Entry point — starts the bot
├── config.json           ← ALL settings live here
├── package.json          ← Node dependencies
├── /bot/                 ← FCA and login methods (don't edit unless you know what you're doing)
├── /database/            ← Auto-generated database files
│   └── data.db           ← SQLite file (created automatically)
├── /scripts/             ← Your command files go here (one file = one command)
│   └── shizuoka.js       ← Chatbot command (Claude AI + taught replies)
└── /logs/                ← Log files (messages, errors, events)
```

> 💡 **Beginner tip:** You only need to touch `config.json` and the `/commands/` folder to build your bot. Everything else is framework internals.

---

## ⚙️ 7. Configuration — Full Reference

All settings live in one file: `config.json`. Here is the complete annotated reference:

```json
{
  "bot": {
    "name": "BruxaBot"
  },

  // ── Login ─────────────────────────────────────────────────────────────────
  // Use a secondary Facebook account — not your main account!
  "account": {
    "email": "your_bot_email@example.com",
    "password": "your_bot_password"
  },

  // ── Bot Admins ────────────────────────────────────────────────────────────
  // These user IDs can run role:2 (admin-only) commands.
  // To find your Facebook UID: go to facebook.com/your.username,
  // right-click → View Page Source → search for "userID"
  "adminBot": [
    "100042067216561"
  ],

  // ── Database ──────────────────────────────────────────────────────────────
  // "json"    → stores data in a JSON file. Easy but slow, not for production.
  // "sqlite"  → recommended for most bots. Fast file-based database.
  // "mongodb" → best for large bots or multiple servers.
  "database": {
    "type": "sqlite",
    "uriMongodb": ""
  },

  // ── Startup Notification ──────────────────────────────────────────────────
  // Sends a message when the bot starts.
  // adminId.admin → your personal Facebook UID (receives a DM on startup)
  // threadId.threads → list of group thread IDs to notify
  "startUpNoti": {
    "enabled": true,
    "message": "👾 BruxaBot is now online!",
    "adminId": {
      "enabled": true,
      "admin": "100042067216561"
    },
    "threadId": {
      "enabled": true,
      "threads": ["your_group_thread_id"]
    }
  },

  // ── Facebook Bio ──────────────────────────────────────────────────────────
  // Automatically updates the bot account's profile bio on startup.
  // updateOnce: true → only updates once (not every restart)
  "bio": {
    "enabled": true,
    "bioText": "👾 Powered by BruxaBot — always online",
    "updateOnce": true
  },

  // ── React To Remove ───────────────────────────────────────────────────────
  // When anyone in a group reacts to a message with this emoji,
  // the bot will automatically delete (unsend) that message.
  // Great for group moderation without giving everyone admin.
  "reactOptions": {
    "reactToRemove": {
      "enabled": true,
      "react": "🤬"
    }
  },

  // ── Whitelist Mode ────────────────────────────────────────────────────────
  // When enabled, the bot ONLY responds to users in this list.
  // Useful for private/closed bots.
  "whiteListMode": {
    "enable": false,
    "whiteListIds": []
  },
}
```

---

## 🧩 8. Event System — Full Explanation

Every user interaction flows through this pipeline:

```
Messenger Message
      ↓
   STFCA receives the raw event
      ↓
   GoatBot Router identifies the type
   (is it a command? a reply? a reaction? just a chat message?)
      ↓
   Permission check (is the user allowed to run this?)
      ↓
   The correct event hook fires (onStart / onChat / onReply / onReaction)
      ↓
   Your code runs → sends a response
```

BruxaBot exposes **five hooks** you can use in any command file:

---

### 🟢 8.1 — `onStart` (Command Execution)

**What it is:** Fires when a user explicitly types a command — e.g. `bot ping` or `bot ai hello`.

**When to use it:** This is your main handler for intentional user actions.

```js
module.exports = {
  config: {
    name: "ping",   // the command name — user types "bot ping" to trigger this
    role: 0,        // 0 = anyone can use it
  },

  onStart: async function({ api, event, args, message, usersData }) {
    // api       → raw STFCA API object (see Section 12 for all methods)
    // event     → { threadID, messageID, senderID, body, type, ... }
    // args      → array of words the user typed after the command name
    //             e.g. "bot ping hello world" → args = ["hello", "world"]
    // message   → shorthand helpers: message.reply(), message.send()
    // usersData → access user data from the database

    message.reply("Pong 👾");
  }
};
```

> 💡 **Beginner tip:** `args` is how you read what the user typed. `args.join(" ")` turns the array back into a full sentence.

---

### 💬 8.2 — `onChat` (Message Listener)

**What it is:** Fires on **every single message** in every thread the bot is in — even messages that aren't commands.

**When to use it:** Keyword detection (like "bby", "bot"), passive listeners, auto-responses.

**⚠️ Warning:** Keep `onChat` logic lightweight. It runs thousands of times per day. Heavy processing here will slow your entire bot.

```js
module.exports.onChat = async function({ api, event, message }) {
  // event.body      → the raw text of the message
  // event.senderID  → Facebook UID of the person who sent it
  // event.threadID  → the group or DM thread ID

  // Example: auto-respond to "hello"
  if (event.body && event.body.toLowerCase() === "hello") {
    message.reply("Hi there! 👾");
  }
};
```

> 💡 **How Shizuoka uses this:** The chatbot command uses `onChat` to watch for keywords like `bby`, `baby`, `bot`, `shizuoka`. When it sees one, it routes the message to the taught-reply database or Claude AI — all without the user needing to type a command prefix.

---

### 🔁 8.3 — `onReply` (Conversation System)

**What it is:** Fires when a user replies **to a specific message** that your bot previously sent — but only if you registered that message first.

**When to use it:** Multi-turn conversations, question-answer flows, menu navigation (next/prev page).

```js
// ── STEP 1: Send a message and register it for reply handling ──
module.exports.onStart = async function({ api, event, message }) {
  api.sendMessage(
    "What is your name?",
    event.threadID,
    (err, info) => {
      // Register this message so onReply fires when someone replies to it
      global.BruxaBot.onReply.set(info.messageID, {
        commandName: "demo",       // must match your command's config.name
        type: "ask_name",          // your own label — use it in onReply to know which step you're on
        author: event.senderID,    // only THIS user's reply will trigger onReply
      });
    },
    event.messageID
  );
};

// ── STEP 2: Handle the reply ──
module.exports.onReply = async function({ api, event, Reply, message }) {
  // Reply → the object you stored in global.BruxaBot.onReply (step 1)
  // event.body → what the user typed as their reply

  if (Reply.type === "ask_name") {
    const name = event.body;
    message.reply(`Nice to meet you, ${name}! 👾`);
  }
};
```

> 💡 **How Shizuoka uses this:** When the bot sends an AI reply, it registers that message. If the user replies to it, `onReply` fires and the conversation continues in the same Claude AI mode automatically — the user never needs to type "bot ai" again.

> 💡 **Pagination example:** The `bot allmsg` command uses `onReply` to detect when the user types "next" or "prev" to navigate pages of taught messages.

---

### 💖 8.4 — `onReaction` (Reaction System)

**What it is:** Fires when any user adds or removes an emoji reaction to **any** message in the thread.

**When to use it:** Moderation (reactToRemove), voting systems, interactive menus triggered by reactions.

```js
module.exports.onReaction = async function({ api, event, message }) {
  // event.reaction  → the emoji string (e.g. "👍", "❤️", "🤬")
  // event.messageID → the ID of the message that was reacted to
  // event.senderID  → who reacted
  // event.userID    → same as senderID in most contexts

  if (event.reaction === "👍") {
    message.reply("Thanks for the like! 👾");
  }
};
```

> 💡 **How reactToRemove uses this:** When the `onReaction` hook fires, BruxaBot checks if the reaction emoji matches `config.json → reactOptions.reactToRemove.react`. If it matches, the bot calls `api.unsendMessage(event.messageID)` to delete the message. This lets group members moderate content without needing Facebook admin status.

---

### 🧠 8.5 — `RA()` (Alternative Execution Engine)

**What it is:** RA() is BruxaBot's Alternative helper of onStart().

```js
RA: async function({ message }) {

   message.reply("hi from RA function..")
}
```

---

## 🗄️ 9. Database System

BruxaBot abstracts the database behind a single `global.db` API. You can switch database backends in `config.json` without changing any of your command code.

### 9.1 — Supported Backends

| Type | Recommended for | Notes |
|---|---|---|
| `json` | Testing only | Stores in a flat JSON file. Slow for concurrent writes. Never use in production. |
| `sqlite` | ✅ Most bots | Fast, file-based, no server needed. Good for single-server deployments. |
| `mongodb` | ✅ Production / multi-server | Best for large bots. Requires a MongoDB Atlas connection string. |

```json
"database": {
  "type": "sqlite",
  "uriMongodb": ""
}
```

> 💡 **Beginner tip:** Start with `sqlite`. When your bot grows past ~1000 active users or you want to run it on multiple servers, switch to `mongodb`.

---

### 9.2 — Reading Data

```js
// Syntax: global.db.get(tableName, recordID)
// Returns the stored object, or null if not found

const user = global.db.get("users", event.senderID);

if (user) {
  message.reply(`You have ${user.coins} coins.`);
} else {
  message.reply("You don't have an account yet!");
}
```

### 9.3 — Writing Data

```js
// Syntax: global.db.set(tableName, recordID, dataObject)
// Creates the record if it doesn't exist, overwrites if it does

global.db.set("users", event.senderID, {
  coins: 100,
  level: 1,
  joinedAt: Date.now()
});
```

### 9.4 — Updating Data (Read → Modify → Write)

```js
// Always read first, then modify, then write back
// This prevents accidentally overwriting other fields

let data = global.db.get("users", event.senderID);

// Initialize if user doesn't exist yet
if (!data) {
  data = { coins: 0, level: 1 };
}

// Modify
data.coins += 50;

// Write back
global.db.set("users", event.senderID, data);

message.reply(`+50 coins! You now have ${data.coins} coins. 💰`);
```

### 9.5 — Common Table Names

You can name tables anything. Here are common conventions used in BruxaBot commands:

| Table | Stores |
|---|---|
| `"users"` | Per-user data (coins, level, stats) |
| `"threads"` | Per-group settings |
| `"global"` | Bot-wide data (counters, flags) |

---

## 👑 10. Role & Permission System

Every command has a `role` field in its config. BruxaBot enforces this before running the command.

| Role | Who it applies to | How it's determined |
|---|---|---|
| `0` | Everyone (default) | No check needed |
| `1` | Group admins only | Checked against Facebook thread admin list |
| `2` | Bot admins only | Checked against `adminBot` in `config.json` |

```js
module.exports.config = {
  name: "secret",
  role: 2,  // ONLY users listed in config.json → adminBot can run this
};
```

```json
// config.json — who is a bot admin:
"adminBot": [
  "100042067216561",
  "100075808585925"
]
```

> 💡 **Beginner tip:** To find your Facebook UID, go to your profile, right-click → View Page Source, and search for `"userID"`. Or use a site like findmyfbid.in.

---

## 💻 11. Command System — Full Guide

Every command is a `.js` file inside the `/commands/` folder. BruxaBot loads them automatically on startup — no manual registration needed.

### 11.1 — Minimal Command (Beginner)

```js
// /commands/hello.js
// Trigger: type "bot hello" in Messenger

module.exports = {
  config: {
    name: "hello",    // the command name
    role: 0,          // 0 = anyone can use it
  },

  onStart: async function({ message }) {
    message.reply("Hello! I am BruxaBot 👾");
  }
};
```

---

### 11.2 — Full Command Structure (All Options)

```js
// /commands/demo.js

module.exports = {
  config: {
    name: "demo",               // Command name — user types "bot demo"
    aliases: ["d", "test"],     // Alternative names — "bot d" or "bot test" also work
    version: "1.0.0",           // Your version tracking
    author: "Rakib Adil",       // Credit
    role: 0,                    // 0=all users, 1=group admin only, 2=bot admin only
    description: "A demo command showing all features",
    category: "utility",        // Groups commands in the help menu
    countDown: 3,               // Cooldown in seconds — prevents spam
    guide: {
      en: [
        "bot demo <text>   — echo your text back",
        "bot demo info     — show info about yourself"
      ].join("\n")
    }
  },

  // ── Main handler: runs when the command is called ──
  onStart: async function({ api, event, args, message, usersData }) {
    const input = args.join(" ").trim();

    if (!input) {
      return message.reply("You didn't type anything! Try: bot demo hello world");
    }

    if (input === "info") {
      const name = (await api.getUserInfo(event.senderID))[event.senderID]?.name || "Unknown";
      return message.reply(`Your name: ${name}\nYour ID: ${event.senderID}`);
    }

    // Echo back whatever they typed
    message.reply(`You said: "${input}" 👾`);
  },

  // ── Passive listener: runs on every message (be careful — this is called a LOT) ──
  onChat: async function({ api, event, message }) {
    if ((event.body || "").toLowerCase() === "bruxabot") {
      message.reply("You called? 👾");
    }
  },

  // ── Reply handler: runs when someone replies to a message your bot sent ──
  onReply: async function({ api, event, Reply, message }) {
    // Reply.type → the label you set when you called global.BruxaBot.onReply.set()
    if (Reply.type === "waiting_input") {
      message.reply(`Got your follow-up: ${event.body}`);
    }
  },

  // ── Reaction handler: runs when someone reacts to any message ──
  onReaction: async function({ api, event, message }) {
    if (event.reaction === "👾") {
      message.reply("Nice react!");
    }
  }
};
```

---

### 11.3 — Command with Database (Coins Example)

```js
// /commands/coins.js
// A complete example: check balance, earn coins, spend coins

module.exports = {
  config: {
    name: "coins",
    author: "Rakib Adil",
    version: "1.0.0",
    role: 0,
    countDown: 5,
    guide: { en: "bot coins         — check balance\nbot coins daily   — claim daily reward" }
  },

  onStart: async function({ api, event, args, message }) {
    const sub = (args[0] || "").toLowerCase();

    // Read user data (returns null if first time)
    let data = global.db.get("users", event.senderID) || { coins: 0, lastDaily: 0 };

    if (sub === "daily") {
      const now = Date.now();
      const cooldown = 24 * 60 * 60 * 1000; // 24 hours in ms

      if (now - data.lastDaily < cooldown) {
        const remaining = Math.ceil((cooldown - (now - data.lastDaily)) / 3600000);
        return message.reply(`⏳ Come back in ${remaining} hour(s) for your daily reward!`);
      }

      data.coins += 500;
      data.lastDaily = now;
      global.db.set("users", event.senderID, data);
      return message.reply(`✅ Daily reward claimed! +500 coins\n💰 Balance: ${data.coins} coins`);
    }

    // Default: show balance
    message.reply(`💰 Your balance: ${data.coins} coins`);
  }
};
```

---

## 🔧 12. Available API Functions

These are all the functions available inside your command hooks:

| Function | What it does | Example |
|---|---|---|
| `message.reply(text)` | Reply to the message that triggered the command | `message.reply("Hello!")` |
| `message.send(text)` | Send to the same thread (no reply link) | `message.send("Announcement!")` |
| `api.sendMessage(msg, threadID, callback, replyToMessageID)` | Full-control send with optional reply link and callback | See below |
| `api.getUserInfo(uid)` | Get Facebook profile info for a UID | `const info = await api.getUserInfo(senderID)` |
| `api.getThreadInfo(threadID)` | Get group info (name, members, admins, etc.) | `const thread = await api.getThreadInfo(event.threadID)` |
| `api.setMessageReaction(emoji, messageID, callback, own)` | Add an emoji reaction to a message | `api.setMessageReaction("👾", messageID, ()=>{}, true)` |
| `api.unsendMessage(messageID)` | Delete/unsend a message the bot sent | `api.unsendMessage(info.messageID)` |
| `api.changeNickname(name, threadID, participantID)` | Change someone's nickname | `api.changeNickname("Bot", threadID, senderID)` |
| `global.db.get(table, id)` | Read data from database | `global.db.get("users", senderID)` |
| `global.db.set(table, id, obj)` | Write data to database | `global.db.set("users", senderID, { coins: 100 })` |
| `global.BruxaBot.onReply.set(messageID, obj)` | Register a reply handler for a sent message | See Section 8.3 |
| `getLang(key)` | Get a localised string (if you use language files) | `getLang("error")` |
| `utils.*` | Misc utility helpers bundled with GoatBot V2 | varies |

---

### Full `api.sendMessage()` Example

```js
// Basic text
api.sendMessage("Hello world!", event.threadID, null, event.messageID);

// With mentions (tag someone by name)
api.sendMessage(
  { body: "Hey @Rakib, check this out!", mentions: [{ tag: "Rakib", id: "100042067216561" }] },
  event.threadID,
  null,
  event.messageID
);

// With a callback to get the sent message's ID (for onReply registration)
api.sendMessage(
  "What's your name?",
  event.threadID,
  (err, info) => {
    if (!err && info?.messageID) {
      global.BruxaBot.onReply.set(info.messageID, {
        commandName: "yourCommandName",
        type: "ask_name",
        author: event.senderID
      });
    }
  },
  event.messageID  // this makes it a "reply" rather than a standalone message
);
```

---

## 🤖 13. Shizuoka Chatbot Command

Shizuoka is BruxaBot's built-in chatbot. It combines a **taught-reply system** (powered by MongoDB) with **Claude AI** (powered by Anthropic's API) for intelligent fallback responses.

### 13.1 — How It Works

```
User sends message
      ↓
onChat detects keyword (bby, bot, shizuoka, etc.)  ← passive trigger
      OR
User types "bot <message>"  ← explicit command trigger
      ↓
Check MongoDB for a taught reply matching this exact text
      ↓
Found? → Send a random answer from the taught list
Not found + explicit command? → "Please teach me this sentence! 🦆💨"
Not found + keyword trigger? → Pick a random auto-reply from the preset list
      ↓
For "bot ai <message>" → skip taught replies, go straight to Claude AI
      ↓
Claude API called with conversation history + system prompt (mode)
Reply stored in conversation memory for this user
```

---

### 13.2 — Taught Bot Commands

| Command | Description | Example |
|---|---|---|
| `bot <message>` | Chat using taught replies | `bot hello` |
| `bot teach <ask> - <ans1>,<ans2>` | Teach the bot a new reply (multiple answers separated by commas) | `bot teach hi - hey, hello there, sup` |
| `bot editmsg <ask> - <index> / <newAnswer>` | Edit a specific answer by index number | `bot editmsg hi - 0 / howdy partner` |
| `bot dltmsg <ask>` | Delete an entire question (bot admins only) | `bot dltmsg hi` |
| `bot msg <ask>` | See all stored answers for a question | `bot msg hi` |
| `bot allmsg` | Paginated list of all taught questions | `bot allmsg` |
| `bot allteach` | Total stats (question count + answer count) | `bot allteach` |
| `bot teachers` | Leaderboard of who taught the most | `bot teachers` |
| `bot mystats` | Your personal teaching count | `bot mystats` |

---

### 13.3 — Claude AI Commands ( Featured )

| Command | Description | Notes |
|---|---|---|
| `bot ai <message>` | Chat with Claude (normal mode) | Keeps conversation memory per user |
| `bot ai:roast <message>` | Claude roasts your message | Playful, not mean |
| `bot ai:bangla <message>` | Claude replies entirely in Bangla | Full Bangla language mode |
| `bot ai:flirt <message>` | Flirty, fun tone | Light-hearted |
| `bot ai:serious <message>` | Accurate, informative answers | No jokes |
| `bot aireset` | Wipe your AI conversation memory | Starts a fresh context |
| `bot persona <your text>` | Set a fully custom Claude system prompt | Overrides all modes |

---

### 13.4 — AI Mode System Explained ( Featured )

Each AI mode sends a different **system prompt** to Claude. The system prompt is an instruction that tells Claude how to behave for this entire conversation.

```js
// These are the exact system prompts used for each mode:
const modePrompts = {
  normal:
    "You are Shizuoka, a friendly and witty chatbot. Keep replies short (1-3 sentences). Be casual and fun. No emojis.",

  roast:
    "You are Shizuoka, a savage roast bot. Roast the user's message in a funny way. Keep it playful, not mean. Short reply. No emojis.",

  flirt:
    "You are Shizuoka, a playful flirty chatbot. Respond in a fun, light-hearted flirty tone. Keep replies short. No emojis.",

  serious:
    "You are Shizuoka, a serious and informative assistant. Give accurate, concise answers. No emojis.",

  bangla:
    "তুমি Shizuoka, একটি বাংলা ভাষায় কথা বলা chatbot। সবসময় বাংলায় উত্তর দাও। সংক্ষিপ্ত ও মজাদার রাখো। কোনো emoji ব্যবহার করো না।"
};

// A custom persona overrides ALL modes:
// "bot persona You are a pirate who only speaks in riddles and always ends sentences with 'arr'."
// → This exact text becomes the system prompt for all future AI messages from this user
```

---

### 13.5 — Conversation Memory ( Featured )

Claude has no memory between API calls by default. Shizuoka solves this by keeping a **per-user history array** in RAM:

```js
// Simplified version of how memory works:
const conversationHistory = {};
//   { "uid_123": [ {role:"user", content:"hi"}, {role:"assistant", content:"hello!"}, ... ] }

const MAX_HISTORY = 20; // keep last 20 messages (10 turns) per user

async function callClaude(uid, userMessage, systemPrompt) {
  if (!conversationHistory[uid]) conversationHistory[uid] = [];

  // Add the new user message
  conversationHistory[uid].push({ role: "user", content: userMessage });

  // Trim to keep memory manageable
  if (conversationHistory[uid].length > MAX_HISTORY) {
    conversationHistory[uid] = conversationHistory[uid].slice(-MAX_HISTORY);
  }

  // Send the FULL history to Claude so it remembers the conversation
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": claudeApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      system: systemPrompt,
      messages: conversationHistory[uid],  // full history goes here
    })
  });

  const data = await response.json();
  const reply = data.content[0].text;

  // Store Claude's reply so the next call includes it
  conversationHistory[uid].push({ role: "assistant", content: reply });

  return reply;
}
```

> ⚠️ **Important:** Memory is stored in RAM and **resets when the server restarts**. To make it permanent, store `conversationHistory` in MongoDB. The structure is the same — just read on startup and write after each turn.

---

### 14 — Keyword Triggers (onChat)

These words trigger the bot in any message, without needing a command prefix:

```js
const keywords = ["bby", "baby", "bot", "robot", "বট", "বেবি", "shizuoka", "bbe"];

// If someone types "bby what time is it" in a group:
// 1. onChat detects "bby" at the start
// 2. Extracts the query "what time is it"
// 3. Checks MongoDB for a taught reply
// 4. If found → sends the taught reply
// 5. If not found → sends a random auto-reply from the preset list
```

---

## ⚡ 15. STFCA Engine

**STFCA** = Stable Facebook Chat API. It is a modified unofficial API that sits between BruxaBot and Facebook's Messenger servers.

### What it does:

| Feature | Description |
|---|---|
| **Login** | Authenticates with Facebook using email + password |
| **Cookie management** | Saves and refreshes session cookies automatically |
| **2FA support** | Handles two-factor authentication prompts |
| **Event routing** | Receives all Messenger events (messages, reactions, joins, leaves) and turns them into JavaScript event objects |
| **Auto-reconnect** | If the connection drops, STFCA re-establishes it without restarting the whole bot |
| **Message sending** | Provides `api.sendMessage()` and all other API methods |

### Why STFCA instead of the original FCA?

The original `fca-unofficial` library has known stability issues, slower reconnects, and missing event types. `STFCA` patches these problems and adds better login handling. BruxaBot uses it as a drop-in replacement — your command code works exactly the same regardless of which API layer is underneath.

> ⚠️ **Risk:** Both STFCA and the original FCA are **unofficial** APIs. Facebook does not authorise them. Using them carries a risk of your bot account being restricted or banned. Always use a secondary account.

---

## 🚀 16. Startup Notification System

When the bot boots up, it can automatically message admins and/or group threads. This tells you the bot is online without you having to check manually.

```json
"startUpNoti": {
  "enabled": true,
  "message": "👾 BruxaBot is now online!",

  "adminId": {
    "enabled": true,
    "admin": "100042067216561"
  },

  "threadId": {
    "enabled": true,
    "threads": [
      "your_group_thread_id_1",
      "your_group_thread_id_2"
    ]
  }
}
```

**How to find a thread ID:**
1. Open Messenger on desktop
2. Open the group chat
3. Look at the URL: `messenger.com/t/123456789012345`
4. The number after `/t/` is your thread ID

---

## 📝 17. Bio Auto-Updater

On startup, BruxaBot can update the bot account's Facebook bio automatically.

```json
"bio": {
  "enabled": true,
  "bioText": "👾 Powered by BruxaBot — always online",
  "updateOnce": true
}
```

- `enabled: true` → turn the feature on
- `bioText` → the text to set as the bio
- `updateOnce: true` → only update once (on first run). Set to `false` if you want it to update every time the bot restarts

---

## 💬 18. reactToRemove Moderation

When enabled, **any group member** can react to a message with the configured emoji to make the bot delete it.

```json
"reactOptions": {
  "enabled": true,
  "reactToUnsent": {
    "enabled": true,
    "react": ["❤️"]
  },
  "reactToRemove": {
    "enabled": true,
    "react": "🤬"
  },
  "onlyAdmin": true
}
```

**How it works internally:**

```js
// In the onReaction hook (handled by the framework, not your command code):
if (event.reaction === config.reactOptions.reactToRemove.react) {
  await api.unsendMessage(event.messageID);
  // The message is now gone from the group; just an example..
}
```

**Use cases:**
- Allow group members to remove inappropriate messages without needing Facebook admin
- Quick moderation in fast-moving groups
- Give trusted members a "delete button" via reaction

> 💡 **Tip:** Choose an emoji that people won't accidentally use. `🤬` or `🗑️` work well. Avoid `👍` or `❤️`.

---

## 🔒 19. Whitelist Mode

When enabled, the bot will **only respond to users in the whitelist**. All other users are silently ignored.

```json
"whiteListMode": {
  "enable": true,
  "whiteListIds": [
    "100042067216561",
    "100075808585925"
  ]
}
```

**When to use:** Private bots for a specific team or group, beta testing with limited users, or high-security deployments where you don't want random people interacting with the bot.

---

## 📊 20. Logging System

BruxaBot logs four categories of events to help with debugging and monitoring:

| Log Type | What is recorded |
|---|---|
| Messages | Every incoming message: sender, thread, body, timestamp |
| Reactions | Emoji used, message reacted to, who reacted |
| Events | Thread joins/leaves, name changes, admin changes |
| Errors | Full stack traces from crashed commands or API failures |

Logging is configured in `logEvents` in config.json. Disable specific categories you don't need to reduce disk I/O.

> 💡 **Performance tip:** On high-traffic bots (10+ active groups), message logging can write hundreds of lines per minute. Either disable it or rotate logs regularly using a tool like `logrotate` (Linux) or `pm2` with log rotation.

---

## 🌐 21. Hosting Guide

### 🟢 Render (Recommended)

Best overall choice: free tier, auto-deploy from GitHub, stays online.

```
1. Push your bot to a GitHub repository
2. Go to https://render.com → Sign up
3. Click "New" → "Web Service"
4. Connect your GitHub repo
5. Set:
   - Build Command:  npm install
   - Start Command:  node index.js
   - Environment:    Node
6. Add environment variables (if you moved config to env vars)
7. Deploy — Render auto-restarts your bot on crash
```

---

### 🟣 Railway

Fast to deploy, generous free trial.

```
1. Go to https://railway.app → Sign up
2. New Project → Deploy from GitHub
3. Select your repo
4. Railway auto-detects Node.js and runs npm start
5. Add environment variables under Variables tab
```

---

### 🔵 Replit

Best for absolute beginners — everything runs in the browser.

```
1. Go to https://replit.com → Create a Repl → Node.js
2. [Quick Install](#-5-quick-install)
3. Upload your bot files (or import from GitHub)
4. Click Run
5. IMPORTANT: Replit free tier sleeps after inactivity.
   Use UptimeRobot (https://uptimerobot.com) to ping your
   Replit URL every 5 minutes to keep it awake.
```

---

### 🟡 VPS (Ubuntu — Best Performance)

Full control, best performance, zero cold starts. Requires Linux knowledge.

```bash
# On your VPS (Ubuntu 20.04 or 22.04):

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (process manager — keeps bot alive, auto-restarts on crash)
npm install -g pm2

# Upload your bot files to the VPS (via SFTP, scp, or git clone)
git clone https://github.com/bruxa6t9/BruxaBot.git
cd BruxaBot
npm install

# Start with PM2
pm2 start index.js --name "bruxabot"

# Auto-start on system reboot
pm2 startup
pm2 save

# View logs
pm2 logs bruxabot
```

---

### ⚫ Localhost

For testing only. The bot only runs while your computer is on.

```bash
node index.js
# Press Ctrl+C to stop
```

---

## ⚡ 22. Performance Tips

- **Use SQLite** for bots under ~1000 active users. No server needed, very fast for small-medium scale.
- **Use MongoDB** when you have multiple servers, high traffic, or need the data to be accessible from multiple processes.
- **Keep `onChat` lightweight.** It fires on every single message. Avoid database reads, API calls, or loops inside `onChat` unless necessary.
- **Use `async/await` correctly.** Never block the event loop with synchronous heavy computation (e.g. `JSON.parse` on huge objects, heavy math loops).
- **Disable unused logs.** If you don't need message logging, turn it off. It's the highest-volume log category.
- **Use `countDown`** in your command config to add cooldowns. Without cooldowns, one user can spam a command and cause rate limit issues.
- **Use PM2 on VPS.** PM2 handles crash recovery, log rotation, and startup — don't just run `node index.js` in a screen session.

---

## 🔐 23. Security Notes

- **Always use a secondary Facebook account** for the bot. Never use your main account — it can get restricted.
- **Never commit `config.json` to a public GitHub repository.** It contains your Facebook Account Credentials and MongoDB URI. Add it to.
- **Keep your repository private** if you use a public repository with bot credentials it might be possible to taken.
- **Rate limit your bot.** Use `countDown` in command configs to prevent spam. Facebook may flag accounts that send too many messages too fast.
- **Monitor your MongoDB.** Set up alerts for unusual write volumes — could indicate someone abusing the teach system.

---

## ©️ 24. Credits

| Contributor | Role |
|---|---|
| **NTKhang03** | Created GoatBot V2 — the base event loop, command loader, and database system |
| **Sheikh Tamim** | Created ST-BOT and STFCA — the improved Facebook Chat API engine |
| **Rakib Adil** | BruxaBot architecture, RA() system, shizuoka.js chatbot, all enhancements |
| *ClaudeAI* | just enhanced README.md (mtf) | 

---

## 📞 25. Contact

| Platform | Link |
|---|---|
| Facebook | https://www.facebook.com/RAKIB.404X |
| Instagram | https://instagram.com/rakib_x_404 |
| Telegram | https://t.me/RAKIBX |
| Email | rakibxyz011@gmail.com |
| Github | https://github.com/bruxa6t9

---

## ⚠️ 26. License & Disclaimer

```
License: Custom
• Do not resell BruxaBot or any modified version of it
• Do not remove credits from source files or documentation
• Do not claim ownership of this framework

Disclaimer:
BruxaBot uses an unofficial, unsupported Facebook API (STFCA).
Facebook does not authorise or support this type of automation.
Using it carries a risk of account restriction or ban.
Always use a secondary Facebook account.
The developers are not responsible for any account issues.
Use at your own risk.
```

---

<p align="center">
  <b>👾 BruxaBot — Not just a bot. A full Messenger automation architecture.</b><br/>
  <i>Built with ❤️ by Rakib Adil</i>
</p>