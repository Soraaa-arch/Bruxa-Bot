module.exports = {
  config: {
    name: "refreshFb_dtsg",
    aliases: ["refreshdtsg", "dtsg", " rdtsg", "rfdtsg", "rd"],
    version: "1.0.0",
    author: "Rakib Adil",
    countDown: 5,
    role: 2,
    description: "Refresh FB dtsg",
    category: "admin"
  },

  onStart: async function({ api, event, message }){
    const { threadID, messageID, senderID } = event;

    message.reaction("🔄", senderID);
    api.sendMessage("Refreshing FB dtsg...", threadID, messageID);

    try {
      await api.refreshFb_dtsg((err, data) => {
        if (!err) {
          message.reaction("✅", senderID);
           api.sendMessage(`Refreshed FB dtsg successfully!\n\n${data}`, threadID, messageID);
        } else {
           api.sendMessage("Failed to refresh FB dtsg!", threadID, messageID);
        }
      });
    } catch (e) {
      api.sendMessage(`Error: ${e}`, threadID, messageID );
    }
  }
};