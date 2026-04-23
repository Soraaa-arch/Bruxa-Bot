module.exports = {
  config: {
    name: "pending",
    aliases: ["pen"],
    version: "1.2",
    author: "Rakib Adil 👑",
    countDown: 5,
    role: 2,
    shortDescription: "Manage and approve pending group requests..",
    category: "utility"
  },

  langs: {
    en: {
      invaildNumber: "❌ | '%1' is not a valid number.",
      cancelSuccess: "━━━━━━━━━━━━━━━━━━\n❌  𝗗𝗘𝗖𝗟𝗜𝗡𝗘𝗗\n━━━━━━━━━━━━━━━━━━\n\n✘ %1 group(s) have been declined.\n✘ They have been notified.\n✘ I have left those groups.\n\n— With regards, Rakib's Shizuoka Bot ✨",
      approveSuccess: "━━━━━━━━━━━━━━━━━━\n✅  𝗔𝗣𝗣𝗥𝗢𝗩𝗘𝗗\n━━━━━━━━━━━━━━━━━━\n\n✔ %1 group(s) have been approved.\n✔ A warm welcome has been delivered.\n\n— With elegance, Rakib's Shizuoka Bot ✨",
      cantGetPendingList: "⚠️ | Unable to fetch pending threads. Please try again later.",
      returnListPending: "━━━━━━━━━━━━━━━━━━\n📨  𝗣𝗘𝗡𝗗𝗜𝗡𝗚 𝗧𝗛𝗥𝗘𝗔𝗗𝗦\n━━━━━━━━━━━━━━━━━━\n\n🧾 Total: %1\n\n%2\n──────────────────\n✎ Reply with the number(s) to approve.\n✎ Reply with c<number> to decline.\n──────────────────",
      returnListClean: "━━━━━━━━━━━━━━━━━━\n✅  𝗔𝗟𝗟 𝗖𝗟𝗘𝗔𝗥\n━━━━━━━━━━━━━━━━━━\n\nNo pending threads right now.\nEverything is neat and tidy. ✨"
    }
  },

  onReply: async function ({ api, event, Reply, getLang }) {
    if (String(event.senderID) !== String(Reply.author)) return;
    const { body, threadID, messageID } = event;
    const prefix = global.BruxaBot.config.prefix;
    let count = 0;

    const isCancel = (isNaN(body) && body.indexOf("c") === 0) || body.indexOf("cancel") === 0;
    const raw = isCancel ? body.slice(1).trim() : body.trim();
    const indexes = raw.split(/\s+/);

    for (const idx of indexes) {
      if (isNaN(idx) || idx <= 0 || idx > Reply.pending.length)
        return api.sendMessage(getLang("invaildNumber", idx), threadID, messageID);

      const targetThread = Reply.pending[idx - 1];

      if (isCancel) {
        api.sendMessage(
          "━━━━━━━━━━━━━━━━\n⚠️  𝗥𝗘𝗤𝗨𝗘𝗦𝗧 𝗗𝗘𝗖𝗟𝗜𝗡𝗘𝗗\n━━━━━━━━━━━━━━━━\n\nYour group request has been declined.\n\nFor access, kindly contact the owner:\n↳ m.me/RAKIB.404X\n\nGoodbye, and take care. ✨",
          targetThread.threadID,
          () => api.removeUserFromGroup(api.getCurrentUserID(), targetThread.threadID)
        );
      } else {
        api.sendMessage(
          `━━━━━━━━━━━━━━━━\n👑  𝗪𝗘𝗟𝗖𝗢𝗠𝗘 𝗔𝗕𝗢𝗔𝗥𝗗\n━━━━━━━━━━━━━━━━\n\nHello Leaders & Members!\nThank you for inviting me to your group.\n\n◆ Prefix : ${prefix}\n◆ Help   : ${prefix}help\n\nExplore the commands and let the fun begin.\n\n— With elegance,\n  BruxaBot ✨`,
          targetThread.threadID
        );
      }
      count += 1;
    }

    return api.sendMessage(
      getLang(isCancel ? "cancelSuccess" : "approveSuccess", count),
      threadID,
      (err, res) => {
        if (res?.messageID) setTimeout(() => api.unsendMessage(res.messageID), 10000);
      }
    );
  },

  onStart: async function ({ api, event, getLang, commandName }) {
    const { threadID, messageID, senderID } = event;
    let list = [];

    try {
      const spam = await api.getThreadList(100, null, ["OTHER"]) || [];
      const pending = await api.getThreadList(100, null, ["PENDING"]) || [];
      list = [...spam, ...pending].filter(group => group.isSubscribed && group.isGroup);
    } catch (e) {
      return api.sendMessage(getLang("cantGetPendingList"), threadID, messageID);
    }

    if (list.length === 0)
      return api.sendMessage(getLang("returnListClean"), threadID, messageID);

    const msg = list
      .map((group, i) => `🪉 ${i + 1}. ${group.name}\n    ↳ TID: ${group.threadID} ✨`)
      .join("\n");

    return api.sendMessage(
      getLang("returnListPending", list.length, msg),
      threadID,
      (err, info) => {
        if (!info?.messageID) return;
        global.BruxaBot.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          author: senderID,
          pending: list
        });
      },
      messageID
    );
  }
};