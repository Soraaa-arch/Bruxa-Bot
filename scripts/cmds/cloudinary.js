const axios = require('axios');

module.exports = {
  config: {
    name: "cloudinary",
    aliases: ["cloud", "cli"],
    version: "1.0.1",
    author: "Rakib Adil",
    role: 0,
    category: "tools",
    usePrefix: true,
    premium: false,
    guide: "{p}cloud reply with a video or image",
    description: "Upload image or video to cloudinary and get the url"
  },

  onStart: async function ({ api, event, message }) {
    const attachments = event.messageReply?.attachments[0]?.url;

    if(!attachments) return api.sendMessage("Please reply with a video or image to convert it to a link..", event.threadID, event.messageID);

    message.reaction("⏳", event.messageID);

    try{
    const response = await axios.post(`https://bruxas-api.vercel.app/api/cloudinary?url=${encodeURIComponent(attachments)}`);
    const url = response.data.url;

    message.reaction("✅", event.messageID);
    api.sendMessage(`Here is your cloudinary converted link.. \n\n link: ${url}`, event.threadID, event.messageID);
    }catch(e) {
      console.log("error while converting attachment to url" + e);
      message.reaction("❌", event.messageID);
      api.sendMessage("Failed to convert attachments to link.", event.threadID, event.messageID);
    };
  }
};