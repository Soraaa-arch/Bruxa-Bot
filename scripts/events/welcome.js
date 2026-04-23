const { getTime, drive } = global.utils;
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

if (!global.temp.welcomeEvent) global.temp.welcomeEvent = {};

module.exports = {
	config: {
		name: "welcome",
		version: "2.2",
		author: "Rakib Adil",
		category: "events"
	},

	langs: {
		en: {
			session1: "morning",
			session2: "noon",
			session3: "afternoon",
			session4: "evening",

			// ── Single person joined ────
			welcomeMessageSingle: `･ﾟ✧ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ ✧ﾟ･
✨ welcome, {userName} ✨
･ﾟ✧ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ ✧ﾟ･
you've just arrived at ✦ {boxName} ✦
we're so glad you joined our journey! 🌿
take a deep breath and stay a while.
may your {session} be peaceful and bright.
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈`,

			// ── Multiple people joined ───
			welcomeMessageMultiple: `･ﾟ✧ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ ✧ﾟ･
✨ welcome, legends! ✨
･ﾟ✧ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ ✧ﾟ･
{userName}
you've all just arrived at ✦ {boxName} ✦
the group just got better — glad you're here! 🎉
may your {session} be full of good vibes.
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈`
		}
	},

	onStart: async ({ threadsData, message, event, api, getLang }) => {
		
		if (event.logMessageType !== "log:subscribe") return;

		const hours = parseInt(getTime("HH"), 10);
		const { threadID } = event;

		// ── make sure addedParticipants exists ──
		const dataAddedParticipants = event.logMessageData?.addedParticipants;
		if (!dataAddedParticipants || dataAddedParticipants.length === 0) return;

		const { nickNameBot } = global.BruxaBot?.config || {};
		const prefix = global.utils.getPrefix(threadID);

		// ── If the bot itself was added ────
		const botUID = api.getCurrentUserID();
		if (dataAddedParticipants.some(p => String(p.userFbId) === String(botUID))) {
			try {
				if (nickNameBot) {
					await api.changeNickname(nickNameBot, threadID, botUID);
				}
			} catch (e) {
				console.error("[welcome] changeNickname error:", e?.message);
			}

			await api.shareContact(
											 `━━━━━━━━━━━━━━━━━━━\n` +
											 `✨ Thank you for inviting me!\n` +
											 `📌 Prefix: ${prefix}\n` +
											 `💡 Type "${prefix}help" to see all commands.\n` +
											 `━━━━━━━━━━━━━━━━━━━`, "100075808585925", event.threadID, (e, d) => {
				if (e) return message.send('failed to share contact..');
			})
			
			if (dataAddedParticipants.length === 1) return;
		}

		if (!global.temp.welcomeEvent[threadID]) {
			global.temp.welcomeEvent[threadID] = {
				joinTimeout: null,
				dataAddedParticipants: []
			};
		}

		const nonBotParticipants = dataAddedParticipants.filter(
			p => String(p.userFbId) !== String(botUID)
		);
		global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...nonBotParticipants);
		clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);
		global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async () => {
			try {
				// ── Fetch thread settings ────
				const threadData = await threadsData.get(threadID);
				if (!threadData) return;

				// Respect per-thread welcome toggle
				if (threadData.settings?.sendWelcomeMessage === false) return;

				const joined = global.temp.welcomeEvent[threadID]?.dataAddedParticipants || [];
				if (joined.length === 0) return;

				const dataBanned = threadData.data?.banned_ban || [];
				const threadName = threadData.threadName || "this group";
				const isMultiple = joined.length > 1;

				const userName = [];
				const mentions = [];

				for (const user of joined) {
					if (dataBanned.some(b => String(b.id) === String(user.userFbId))) continue;
					userName.push(user.fullName);
					mentions.push({ tag: user.fullName, id: user.userFbId });
				}

				if (userName.length === 0) return;

				const session =
					hours <= 10 ? getLang("session1") :
					hours <= 12 ? getLang("session2") :
					hours <= 18 ? getLang("session3") :
					getLang("session4");

				let welcomeMessage;
				if (isMultiple) {
					welcomeMessage = threadData.data?.welcomeMessageMultiple
						|| getLang("welcomeMessageMultiple");
				} else {
					welcomeMessage = threadData.data?.welcomeMessage
						|| getLang("welcomeMessageSingle");
				}

				// {userName}    → plain name(s)
				// {userNameTag} → same names but rendered as Messenger @mentions
				// {boxName}     → thread/group name
				// {session}     → morning / noon / afternoon / evening
				welcomeMessage = welcomeMessage
					.replace(/\{userName\}|\{userNameTag\}/g, userName.join(", "))
					.replace(/\{boxName\}/g, threadName)
					.replace(/\{session\}/g, session);

				const form = {
					body: welcomeMessage,
					// Only attach mentions if the template actually uses {userNameTag}
					mentions: (threadData.data?.welcomeMessage || getLang("welcomeMessageSingle"))
						.includes("{userNameTag}") ? mentions : undefined
				};

				if (threadData.data?.welcomeAttachment) {
					try {
						const files = threadData.data.welcomeAttachment;
						const settled = await Promise.allSettled(
							files.map(file => drive.getFile(file, "stream"))
						);
						const attachments = settled
							.filter(r => r.status === "fulfilled")
							.map(r => r.value);

						if (attachments.length > 0) form.attachment = attachments;
					} catch (attachErr) {
						console.error("[welcome] attachment error:", attachErr?.message);
						// send without attachment
					}
				}

				await message.send(form);

			} catch (err) {
				console.error("[welcome] onStart error:", err?.message || err);
			} finally {
				delete global.temp.welcomeEvent[threadID];
			}
		}, 1500);
	}
};