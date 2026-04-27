const fs = require('fs');
const path = require('path');
const { utils } = global;

module.exports = {
  config: {
    name: "help",
    version: "2.9",
    role: 0,
    countdown: 0,
    author: "Rakib Adil", // if you change this u'r gay
    description: "Displays all available commands and their categories in a premium style.",
    category: "help",
  },
  
  onStart: async ({ api, event, args }) => {
    const cmdsFolderPath = path.join(__dirname, '.');
    const files = fs.readdirSync(cmdsFolderPath).filter(file => file.endsWith('.js') && file !== "help.js");
    
    const safeRequire = (filePath) => {
      try {
        const cmd = require(filePath);
        return cmd && cmd.config ? cmd : null;
      } catch (e) {
        console.error("❌ Failed to load command:", filePath, e);
        return null;
      }
    };
    
    const commands = files.map(file => safeRequire(path.join(cmdsFolderPath, file))).filter(Boolean);
    
    const getCategories = () => {
      const categories = {};
      for (const command of commands) {
        const categoryName = command.config.category || 'Uncategorized';
        if (!categories[categoryName]) categories[categoryName] = [];
        categories[categoryName].push(command.config.name);
      }
      return categories;
    };
    
    // Modified sendMessage to support attachment
    const sendMessage = async (message, attachmentUrl = null) => {
      try {
        const msgObj = { body: message };
        if (attachmentUrl) {
          msgObj.attachment = await utils.getStreamFromURL(attachmentUrl);
        }
        return await api.sendMessage(msgObj, event.threadID);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    };
    
    try {
      if (args.length > 1 && args.includes('|')) {
        const pipeIndex = args.indexOf('|');
        const categoryName = args.slice(pipeIndex + 1).join(' ').toLowerCase();
        const categories = getCategories();
        const category = Object.keys(categories).find(cat => cat.toLowerCase() === categoryName);
        
        if (category) {
          let msg = `╭───『 ${category.toUpperCase()} 』\n`;
          msg += `✧ ${categories[category].join(' ✧ ')}\n`;
          msg += "╰──────────────◊\n";
          msg += `(Total: ${categories[category].length} cmds)`;
          return sendMessage(msg);
        } else {
          return sendMessage(`❌ Category not found: ${categoryName}`);
        }
      }
      
      if (args[0]) {
        const commandName = args[0].toLowerCase();
        const command = commands.find(cmd =>
          cmd.config.name.toLowerCase() === commandName ||
          (cmd.config.aliases && cmd.config.aliases.includes(commandName))
        );
        
        if (!command) return sendMessage(`❌ Command not found: ${commandName}`);
        
        const usage = command.config.guide?.en || command.config.guide;
        let details = `╭───────────────────◊\n│ 🔹 COMMAND DETAILS\n├───────────────────◊\n`;
        details += `│ ⚡ Name: ${command.config.name}\n`;
        details += `│ 📝 Version: ${command.config.version || 'N/A'}\n`;
        details += `│ 👤 Author: ${command.config.author || 'Unknown'}\n`;
        details += `│ 🔐 Role: ${command.config.role ?? 'N/A'}\n`;
        details += `│ 📂 Category: ${command.config.category || 'Uncategorized'}\n`;
        if (command.config.aliases?.length) details += `│ 🔄 Aliases: ${command.config.aliases.join(', ')}\n`;
        if (command.config.countDown !== undefined) details += `│ ⏱️ Cooldown: ${command.config.countDown}s\n`;
        details += `│🧬 Usage: ${usage}\n`
        details += `╰───────────────────◊\n💫 RAKIB_BOT Command Info`;
        return sendMessage(details);
      }
      
      const categories = getCategories();
      let helpMessage = '';
      for (const category in categories) {
        helpMessage += `╭──『 ${category.toUpperCase()} 』\n`;
        helpMessage += `✧ ${categories[category].join(' ✧ ')}\n`;
        helpMessage += "╰──────────────◊\n";
        helpMessage += `(Total: ${categories[category].length} cmds)\n\n`;
      }
      helpMessage += "╭────────────◊\n";
      helpMessage += "│ » Type [ /help <cmd> ] for usage\n";
      helpMessage += "│ » Type [ /help | category ] for category cmds\n";
      helpMessage += "│ » Owner Contact: m.me/aest.adil.69\n";
      helpMessage += "│ » Join Support GC: https://m.me/j/Aba6v1ykZinwoXSR/\n";
      helpMessage += "╰────────────◊\n";
      helpMessage += "          「 💫 RAKIB_BOT 😗 」";
      
      /* Add your video/image/gif URL here
      const imgUrl =[
        "https://files.catbox.moe/zaubmg.jpg",
        "https://files.catbox.moe/ngyn3o.jpg",
        "https://files.catbox.moe/kwlxeg.jpg",
        "https://files.catbox.moe/2qc1d3.jpg",
        "https://files.catbox.moe/ks1jtd.jpg"
      ];
      
     // const rndmImg = imgUrl[Math.floor(Math.random() * imgUrl.length)];

       if you want to use image/video/gif with help list just delete the (//) and the :ext line after this
        */
    // return sendMessage(helpMessage, rndmImg)
      return sendMessage(helpMessage);
      
    } catch (error) {
      console.error('❌ Error in help command:', error);
      return sendMessage('⚠️ An error occurred while generating the help message.');
    }
  }
};