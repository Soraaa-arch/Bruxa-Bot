const { exec } = require("child_process");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "shell",
    aliases: ["sh", "terminal", "cmd"],
    version: "1.0",
    author: "Rakib Adil + ai",
    countDown: 3,
    role: 2,
    shortDescription: "Execute shell commands",
    longDescription: "Execute shell/terminal commands — file operations, package install, system info, etc.",
    category: "owner",
    guide: [
      "{pn} <command>",
      "",
      "Examples:",
      "{pn} ls -la",
      "{pn} npm install axios",
      "{pn} cat package.json",
      "{pn} mkdir newfolder",
      "{pn} echo 'hello' > test.txt",
      "{pn} node -e \"console.log('hi')\"",
    ].join("\n")
  },

  onStart: async function ({ message, args, event, api }) {
    const { threadID, senderID, messageID } = event;

    // ── Admin check ──
    const admins = global.BruxaBot.config?.adminBot || global.BruxaBot.originalAdminBot || [];
    if (!admins.includes(senderID))
      return message.reply("⛔ Only bot admins can use this command.");

    if (!args[0])
      return message.reply(
        "⚠️ Please provide a command to execute.\n" +
        "Example: /shell ls -la"
      );

    const command = args.join(" ");

    // ── Blocked commands ──
    const blocked = ["rm -rf /", "rm -rf ~", "mkfs", "shutdown", "reboot", ":(){ :|:& };:"];
    if (blocked.some(b => command.includes(b)))
      return message.reply("🚫 That command is blocked for safety reasons.");

    // ── React to show command is running ──
    try { api.setMessageReaction("⏳", messageID, () => {}, true); } catch {}

    exec(command, { timeout: 30000, maxBuffer: 1024 * 1024, cwd: process.cwd() }, (error, stdout, stderr) => {
      let response = `📟 Command: ${command}\n`;
      response += `─────────────────────\n`;

      if (error) {
        response += `❌ Error:\n${error.message.trim()}`;
        try { api.setMessageReaction("❌", messageID, () => {}, true); } catch {}
      } else {
        try { api.setMessageReaction("✅", messageID, () => {}, true); } catch {}

        if (stdout.trim()) response += `📤 Output:\n${stdout.trim()}\n`;
        if (stderr.trim()) response += `⚠️ Stderr:\n${stderr.trim()}\n`;
        if (!stdout.trim() && !stderr.trim()) response += `✨ Executed with no output.`;
      }

      // Truncate if too long
      if (response.length > 2000)
        response = response.substring(0, 1900) + "\n\n... (output truncated)";

      api.sendMessage(response, threadID, () => {}, messageID);
    });
  }
};