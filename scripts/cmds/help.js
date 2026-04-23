const { getPrefix } = global.utils;
const { commands, aliases } = global.BruxaBot;

function cropContent(content, max) {
  if (!content) return "";
  return content.length > max ? content.slice(0, max - 3) + "..." : content;
}

function getDescription(command) {
  const cfg = command.config;
  return cfg.description?.en || cfg.description
    || cfg.shortDescription?.en || cfg.shortDescription
    || cfg.longDescription?.en  || cfg.longDescription
    || "No description";
}

function getUsage(command, prefix) {
  const cfg = command.config;
  const raw = cfg.guide?.en || cfg.guide || "";
  const text = typeof raw === "object" ? (raw.body || "") : raw;
  return text
    .replace(/\{prefix\}|\{p\}/g, prefix)
    .replace(/\{name\}|\{n\}/g, cfg.name)
    .replace(/\{pn\}/g, prefix + cfg.name);
}

function getRoleText(roleOfCommand, roleIsSet, getLang) {
  if (roleOfCommand === 0)
    return roleIsSet ? getLang("roleText0setRole") : getLang("roleText0");
  if (roleOfCommand === 1)
    return roleIsSet ? getLang("roleText1setRole") : getLang("roleText1");
  return getLang("roleText2");
}

function buildCategoryMap(role) {
  const map = new Map();
  for (const [, cmd] of commands) {
    if (cmd.config.role > 1 && role < cmd.config.role) continue;
    const cat = (cmd.config.category || "misc").toLowerCase();
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push(cmd);
  }
  const sorted = new Map([...map.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  for (const [cat, cmds] of sorted)
    sorted.set(cat, cmds.sort((a, b) => a.config.name.localeCompare(b.config.name)));
  return sorted;
}

function buildCategoryList(categoryMap, prefix) {
  const cats = [...categoryMap.keys()];
  let body = `╭──── 👾 BruxaBot Help ────⭓\n`;
  body += `│ ${commands.size} commands · ${cats.length} categories\n`;
  body += `│ Prefix: ${prefix}\n`;
  body += `├────────────────────────⭔\n`;
  cats.forEach((cat, i) => {
    const emoji = CATEGORY_EMOJIS[cat] || "📦";
    body += `│ ${i + 1}. ${emoji} ${cat.toUpperCase()} (${categoryMap.get(cat).length})\n`;
  });
  body += `├────────────────────────⭔\n`;
  body += `│ 💬 Reply a number to explore\n`;
  body += `╰────────────────────────⭓`;
  return body;
}

function buildCommandList(category, cmds) {
  const emoji = CATEGORY_EMOJIS[category] || "📦";
  let body = `╭── ${emoji} ${category.toUpperCase()} ────⭓\n`;
  body += `│ ${cmds.length} command${cmds.length !== 1 ? "s" : ""}\n`;
  body += `├────────────────────────⭔\n`;
  cmds.forEach((cmd, i) => {
    const desc = cropContent(getDescription(cmd), 45);
    body += `│ ${i + 1}. ${cmd.config.name}${desc ? `: ${desc}` : ""}\n`;
  });
  body += `├────────────────────────⭔\n`;
  body += `│ 💬 Reply a number for details\n`;
  body += `│ 💬 Reply 0 to go back\n`;
  body += `╰────────────────────────⭓`;
  return body;
}

function buildCommandInfo(cmd, threadData, prefix, getLang) {
  const cfg = cmd.config;
  const usage = getUsage(cmd, prefix);
  const desc = getDescription(cmd);

  let roleOfCommand = cfg.role ?? 0;
  let roleIsSet = false;
  if (threadData.data?.setRole?.[cfg.name]) {
    roleOfCommand = threadData.data.setRole[cfg.name];
    roleIsSet = true;
  }

const aliasesStr   = cfg.aliases?.join(", ") || getLang("doNotHave");
const aliasesGroup = (threadData.data?.aliases?.[cfg.name] || []).join(", ") || getLang("doNotHave");

  let body = `╭── 📖 ${cfg.name.toUpperCase()} ────⭓\n`;
  body += `│\n`;
  body += `├── INFO\n`;
  body += `│ Description : ${desc}\n`;
  body += `│ Version     : ${cfg.version || "1.0"}\n`;
  body += `│ Author      : ${cfg.author || "Unknown"}\n`;
  body += `│ Role        : ${getRoleText(roleOfCommand, roleIsSet, getLang)}\n`;
  body += `│ Cooldown    : ${cfg.countDown || 1}s\n`;
  body += `│ Category    : ${(cfg.category || "misc").toUpperCase()}\n`;
  body += `│ Aliases     : ${aliasesStr}\n`;
  body += `│ Group alias : ${aliasesGroup}\n`;
  if (usage.trim()) {
    body += `│\n`;
    body += `├── USAGE\n`;
    usage.split("\n").forEach(l => body += `│ ${l}\n`);
    body += `│\n`;
    body += `├── NOTES\n`;
    body += `│ <value>  → replaceable\n`;
    body += `│ [a|b|c]  → a or b or c\n`;
  }
  body += `│\n`;
  body += `├────────────────────────⭔\n`;
  body += `│ 💬 Reply 0 to go back\n`;
  body += `╰────────────────────────⭓`;
  return body;
}

const CATEGORY_EMOJIS = {
  info:       "ℹ️",
  chat:       "💬",
  fun:        "🎉",
  game:       "🎮",
  utility:    "🔧",
  admin:      "👑",
  moderation: "🛡️",
  economy:    "💰",
  music:      "🎵",
  image:      "🖼️",
  events:     "📡",
  misc:       "📦",
  ai:         "🤖",
  nsfw:       "🔞",
  social:     "👥",
  search:     "🔍",
};

// <-------- onReply in one function --------->
function setReply(messageID, data) {
  global.BruxaBot.onReply.set(messageID, { commandName: "help", ...data });
}

module.exports = {
  config: {
    name: "help",
    version: "2.0",
    author: "Rakib Adil + claudeAi",
    countDown: 5,
    role: 0,
    description: "Interactive help — browse commands by category",
    category: "info",
    guide: "{pn}            — show category list\n{pn} <cmd name> — show command info directly",
    priority: 1
  },

  langs: {
    en: {
      commandNotFound:  "Command \"%1\" does not exist.",
      doNotHave:        "None",
      roleText0:        "0 — All users",
      roleText1:        "1 — Group admins",
      roleText2:        "2 — Bot admins",
      roleText0setRole: "0 — All users (set by group)",
      roleText1setRole: "1 — Group admins (set by group)",
    }
  },

  onStart: async function ({ message, args, event, threadsData, getLang, role, globalData }) {
    const { threadID, senderID } = event;
    const threadData = await threadsData.get(threadID);
    const prefix = getPrefix(threadID);
    const categoryMap = buildCategoryMap(role);
    const categoryList = [...categoryMap.keys()];

    // ── Direct lookup: help <cmdname> ──
    if (args[0] && isNaN(args[0])) {
      const cmdName = args[0].toLowerCase();
      let command = commands.get(cmdName) || commands.get(aliases.get(cmdName));

      if (!command && threadData.data?.aliases) {
        for (const [n, arr] of Object.entries(threadData.data.aliases)) {
          if (arr.includes(cmdName)) { command = commands.get(n); break; }
        }
      }
      if (!command) {
        const globalAliases = await globalData.get("setalias", "data", []);
        for (const item of globalAliases) {
          if (item.aliases.includes(cmdName)) { command = commands.get(item.commandName); break; }
        }
      }

      if (!command) return message.reply(getLang("commandNotFound", args[0]));
      return message.reply({ body: buildCommandInfo(command, threadData, prefix, getLang) });
    }

    // ── Category list ──
    const sent = await message.reply({ body: buildCategoryList(categoryMap, prefix) });
    setReply(sent.messageID, {
      type: "category",
      author: senderID,
      categoryMap, categoryList,
      prefix, threadData, getLang,
      currentMessageID: sent.messageID
    });
  },

  onReply: async function ({ api, event, Reply, message }) {
    if (Reply.author && Reply.author !== event.senderID) return;

    const { categoryMap, categoryList, prefix, threadData, getLang, currentMessageID } = Reply;
    const input = parseInt((event.body || "").trim());

    try { await api.unsendMessage(currentMessageID); } catch {}

    // ── 0 → back to category list ──
    if (input === 0) {
      if (Reply.type === "category") return;
      const sent = await message.reply({ body: buildCategoryList(categoryMap, prefix) });
      setReply(sent.messageID, {
        type: "category", author: event.senderID,
        categoryMap, categoryList,
        prefix, threadData, getLang,
        currentMessageID: sent.messageID
      });
      return;
    }

    // ── Category → command list ──
    if (Reply.type === "category") {
      if (isNaN(input) || input < 1 || input > categoryList.length) {
        const sent = await message.reply({ body: buildCategoryList(categoryMap, prefix) });
        setReply(sent.messageID, { ...Reply, currentMessageID: sent.messageID });
        return;
      }
      const chosenCat = categoryList[input - 1];
      const cmds = categoryMap.get(chosenCat);
      const sent = await message.reply({ body: buildCommandList(chosenCat, cmds) });
      setReply(sent.messageID, {
        type: "commandList", author: event.senderID,
        categoryMap, categoryList, chosenCat, cmds,
        prefix, threadData, getLang,
        currentMessageID: sent.messageID
      });
      return;
    }

    // ── Command list → command info ──
    if (Reply.type === "commandList") {
      const { chosenCat, cmds } = Reply;
      if (isNaN(input) || input < 1 || input > cmds.length) {
        const sent = await message.reply({ body: buildCommandList(chosenCat, cmds) });
        setReply(sent.messageID, { ...Reply, currentMessageID: sent.messageID });
        return;
      }
      const sent = await message.reply({
        body: buildCommandInfo(cmds[input - 1], threadData, prefix, getLang)
      });
      setReply(sent.messageID, {
        type: "commandList", author: event.senderID,
        categoryMap, categoryList, chosenCat, cmds,
        prefix, threadData, getLang,
        currentMessageID: sent.messageID
      });
    }
  }
};