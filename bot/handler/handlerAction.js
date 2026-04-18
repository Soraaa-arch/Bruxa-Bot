const createFuncMessage = global.utils.message;
const handlerCheckDB = require("./handlerCheckData.js");

module.exports = (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) => {
	const handlerEvents = require("./handlerEvents.js")(api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData);

	async function handleReactOption(api, event, message) {
		const { config } = global.BruxaBot;
		const { reactOptions } = config;
		if (!reactOptions || !reactOptions.enabled) 
		return;

		const { reaction, userID, messageID: reactMsgID, threadID, senderID } = event;
		if(!reactMsgID) return;

		if(!userID || userID === 0 || userID === "0") return;

		if(!reaction) return;

		const { onReaction } = global.BruxaBot;
		const reactionData = onReaction.get(reactMsgID);
		if(reactionData) return;

		const { threadApproval } = config;
		if(threadApproval && threadApproval.enable) {
			try {
				const threadData = await threadsData.get(threadID);
				const isAdminBot = global.utils.isAdmin(userID);

				if(threadData.approved !== true && !isAdminBot) {
					return;
				}
			} catch (err) {
				console.log(`Thread approval check failed for reactOption in thread: ${threadID}`, err.message);
			}
		}

		const isAdminBot = reactOptions?.onlyAdminBot ? global.utils.isAdmin(userID) : true;

		try {
			if (reactOptions.reactToRemove.enabled && reaction === reactOptions.reactToRemove.react) {
				if(!isAdminBot) {
					const userInfo = await api.getUserInfo(userID);
					const reactorName = userInfo[userID].name;
					message.send(`Hey mc, ${reactorName}.. \n this isn't for you..🤬`);
					return;
				}

				if ( senderID && senderId !== api.getCurrentUserID()) {
					await api.removeUserFromGroup(senderID, threadID);
					global.utils.log.info("REACTOPTION", `Admin ${userID} kicked user ${senderID} from the earth, groupID ${threadID}..`);
				}
				return;
			}

			if(reactOptions.reactToUnsent.enabled && reactOptions.reactToUnsent.react.includes(reaction)) {
				if(!isAdminBot) 
				return;

				const botID = api.getCurrentUserID();
				const messageInfo = await api.getMessage(threadID, reactMsgID);

				if (messageInfo && messageInfo.senderID === botID) {
					await api.unsendMessage(reactMsgID);
					global.utils.log.info("REACTOPTION", `Admin ${userID} unsent bot message: ${reactMsgID}`);
				}
			}
		} catch (e) {
			if (!e.message?.includes('field_exception') && !e.message?.includes('Query error') && !e.message?.includes('Cannot retrieve message')) {
				global.utils.log.warn("REACTOPTION", `Failed to process ReactOption for message ${reactMsgID}`, e.message);
			}
		}
	}

	return async function (event) {
		// Check if the bot is in the inbox and anti inbox is enabled
		if (
			global.BruxaBot.config.antiInbox == true &&
			(event.senderID == event.threadID || event.userID == event.senderID || event.isGroup == false) &&
			(event.senderID || event.userID || event.isGroup == false)
		)
			return;

		const message = createFuncMessage(api, event);

		await handlerCheckDB(usersData, threadsData, event);
		const handlerChat = await handlerEvents(event, message);
		if (!handlerChat)
			return;

		const {
			onAnyEvent, onFirstChat, onStart, onChat,
			onReply, onEvent, handlerEvent, onReaction,
			typ, presence, read_receipt
		} = handlerChat;


		onAnyEvent();
		switch (event.type) {
			case "message":
			case "message_reply":
			case "message_unsend":
				onFirstChat();
				onChat();
				onStart();
				onReply();
				break;
			case "event":
				handlerEvent();
				onEvent();
				break;
			case "message_reaction":
				handleReactOption(api, event, message)
				onReaction();
				break;
			case "typ":
				typ();
				break;
			case "presence":
				presence();
				break;
			case "read_receipt":
				read_receipt();
				break;
			// case "friend_request_received":
			// { /* code block */ }
			// break;

			// case "friend_request_cancel"
			// { /* code block */ }
			// break;
			default:
				break;
		}
	};
};