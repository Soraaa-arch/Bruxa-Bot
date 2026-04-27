module.exports = {
  config: {
    name: "profile",
    aliases: ["pp", "pfp"],
    version: "1.1.3",
    author: "Rakib Adil",
    countDown: 5,
    role: 0,
    usePrefix: true,
    shortDescription: "Get profile image from mentioned user or yourselfe..",
    category: "image",
    guide: {
      en: "   {pn} @tag or reply to see profile picture"
    }
  },
  
  
  onStart: async function({ event, message }) {
    try {
      let uid;
      
      if (event.type === "message_reply") {
        uid = event.messageReply.senderID;
      } else if (Object.keys(event.mentions).length) {
        uid = Object.keys(event.mentions)[0];
      } else {
        uid = event.senderID;
      };
      
      const fbToken = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
      const ppUrl = `https://graph.facebook.com/${uid}/picture?height=1024&width=1024&access_token=${fbToken}`;
      
      message.reply({
        body: "here is your pp!",
        attachment: await global.utils.getStreamFromURL(ppUrl)
      });
    } catch (e) {
      message.reply("failed to get pp from user.", event.threadID, event.messageID)
    };
  }
};