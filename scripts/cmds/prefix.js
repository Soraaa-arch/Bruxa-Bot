const fs = require("fs-extra");
const { utils } = global;

module.exports = {
  config: {
    name: "prefix",
    version: "2.1.2",
    author: "NTKhang || Rakib",
    countDown: 5,
    role: 0,
    description: "Change or view the bot prefix (thread/system)",
    category: "config",
    guide: {
      en: "   {pn} <new prefix>: change prefix in your box chat (group admin only)" +
        "\n   Example:" +
        "\n    {pn} #" +
        "\n\n   {pn} <new prefix> -g: change system prefix (bot admin only)" +
        "\n   Example:" +
        "\n    {pn} # -g" +
        "\n\n   {pn} reset: reset prefix in your box chat to default"
    }
  },

  langs: {
    en: {
      reset:             "Your prefix has been reset to default: %1",
      onlyAdmin:         "Only bot admins can change the system prefix.",
      onlyGroupAdmin:    "Only group admins can change the prefix in this chat.",
      confirmGlobal:     "React to this message to confirm changing the system prefix.",
      confirmThisThread: "React to this message to confirm changing the prefix in your chat.",
      successGlobal:     "System prefix changed to: %1",
      successThisThread: "Box chat prefix changed to: %1",
      myPrefix:          "🌐 System prefix: %1\n🛸 Your box chat prefix: %2\n🌩️ bakayaro..👽"
    }
  },

  onStart: async function ({ message, role, args, commandName, event, threadsData, getLang }) {
    const { threadID, senderID } = event;

    if (!args[0]) return message.SyntaxError();

    const isBotAdmin = [...new Set([...(global.BruxaBot.config.adminBot || []), ...(global.BruxaBot.originalAdminBot || [])])].includes(senderID);

    const isGlobal = args[1] === "-g";

    if (isGlobal) {
      if (!isBotAdmin) return message.reply(getLang("onlyAdmin"));
    } else {    
      if (role < 1 && !isBotAdmin)
        return message.reply(getLang("onlyGroupAdmin"));
    }

    if (args[0] === "reset") {
      await threadsData.set(threadID, null, "data.prefix");
      return message.reply(getLang("reset", global.BruxaBot.config.prefix));
    }

    const newPrefix = args[0];
    const formSet   = {
      commandName,
      author:    senderID,
      newPrefix,
      setGlobal: isGlobal,
      role:      1
    };

    return message.reply(
      isGlobal ? getLang("confirmGlobal") : getLang("confirmThisThread"),
      (err, info) => {
        if (err || !info?.messageID) return;
        formSet.messageID = info.messageID;
        global.BruxaBot.onReaction.set(info.messageID, formSet);
      }
    );
  },

  onReaction: async function ({ message, threadsData, event, Reaction, getLang }) {
    const { author, newPrefix, setGlobal, messageID } = Reaction;

    if (event.userID !== author) return;

    if (setGlobal) {
      global.BruxaBot.config.prefix = newPrefix;
      fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.BruxaBot.config, null, 2));
      await message.unsend(messageID);
      return message.reply(getLang("successGlobal", newPrefix));
    } else {
      await threadsData.set(event.threadID, newPrefix, "data.prefix");
      await message.unsend(messageID);
      return message.reply(getLang("successThisThread", newPrefix));
    }
  },

  onChat: async function ({ event, message, getLang }) {
    if (event.body && event.body.toLowerCase() === "prefix") {
      const threadPrefix = global.db.allThreadData
        .find(t => t.threadID == event.threadID)?.data?.prefix || null;
      const globalPrefix = global.BruxaBot.config.prefix;

      return message.reply({
        body: getLang("myPrefix", globalPrefix, threadPrefix || globalPrefix, event.threadID, event.messageID)
      });
    }
  }
};