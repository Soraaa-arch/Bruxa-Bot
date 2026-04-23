module.exports = {
  config: {
    name: "uptime",
    aliases: ["up", "upt"],
    version: "1.0.1",
    author: "Rakib Adil",
    role: 0,
    shortDescription: {
      en: "Displays the uptime of the bot."
    },
    longDescription: {
      en: "Displays the amount of time that the bot has been running for."
    },
    category: "System",
    guide: {
      en: "Use {p}uptime to display the uptime of the bot."
    }
  },
  RA: async function ({ api, event }) {
    const uptime = process.uptime();
    const seconds = Math.floor(uptime % 60);
    const minutes = Math.floor((uptime / 60) % 60);
    const hours = Math.floor((uptime / (60 * 60)) % 24);
    const days = Math.floor(uptime / (60 * 60 * 24));
    const uptimeString = `${days} days 🏞️ \n${hours} hours ⏳ \n ${minutes} minutes 🕝 \n ${seconds} second ⏰`;
    api.sendMessage(`hey boss, the bot has been running for ${uptimeString}.`, event.threadID);
  }
};