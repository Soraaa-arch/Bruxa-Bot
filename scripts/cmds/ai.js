const axios = require("axios");

const apiBase = "https://bruxas-api.vercel.app";

module.exports = {
  config: {
    name: "ai",
    aliases: ["gptask", "aiask"],
    version: "1.8",
    author: "Rakib Adil",
    countDown: 5,
    role: 0,
    shortDescription: "Ask AI a question",
    longDescription: "Ask your question to AI and get AI's response, supports reply chaining",
    category: "ai",
    guide: "{pn} <your question>"
  },

  onStart: async function ({ message, args, event }) {
    let query = args.join(" ").trim();

    if (!query) {
      return message.reply("use ai <query> | example ai how to make a girl fall in love (replit suggested 🙏)")
    }

    try {
      const response = await axios.get(`${apiBase}/api/gpt?query=${encodeURIComponent(query)}`);
      const reply = response.data?.answer || "⚠️ No response from AI.";

      return message.reply(
        `🤖 𝐁𝐥𝐚𝐝𝐞𝐗𝐀𝐈 says:\n${reply}`,
        (err, info) => {
          if (!err) {
            global.BruxaBot.onReply.set(info.messageID, {
              commandName: "ai",
              author: event.senderID,
              previousQuestion: query
            });
          }
        }
      );
    } catch (err) {
      console.error(err);
      return message.reply("❌ Failed to contact AI API.");
    }
  },

  onReply: async function ({ event, message, Reply }) {
    if (event.senderID !== Reply.author) return;

    const newQuery = event.body;
    if (!newQuery) return;

    try {

      const response = await axios.get(`${apiBase}/api/gpt?query=${encodeURIComponent(newQuery)}`);
      const reply = response.data?.answer || "⚠️ No response from AI.";

      return message.reply(
        `🤖 𝐁𝐥𝐚𝐝𝐞𝐗𝐀𝐈 says:\n${reply}`,
        (err, info) => {
          if (!err) {
            global.BruxaBot.onReply.set(info.messageID, {
              commandName: "ai",
              author: event.senderID,
              previousQuestion: newQuery
            });
          }
        }
      );
    } catch (err) {
      console.error(err);
      return message.reply("❌ Failed to contact AI API.");
    }
  }
};