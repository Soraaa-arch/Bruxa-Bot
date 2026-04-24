const express = require('express');
const axios = require('axios');
const { spawn } = require("child_process");
const log = require("./logger/log.js");

const PORT = process.env.PORT || 8080;

const app = express();

function startProject() {
	const child = spawn("node", ["Bruxa.js"], {
		cwd: __dirname,
		stdio: "inherit",
		shell: true
	});

	child.on("close", (code) => {
		if (code == 2) {
			log.info("Restarting Project...");
			startProject();
		}
	});
}

startProject();

app.get('/', async (req, res) => {
	const { data: html } = await axios.get("https://raw.githubusercontent.com/NullShine69/MY-TEST-PROJECT/main/resources/homepage/homepage.html");
	
	res.send(html);
});

app.listen(PORT, '0.0.0.0', () => {
	console.log(`server is running at PORT:${PORT}`);
});