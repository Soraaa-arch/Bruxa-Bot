const axios = require('axios');
const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const log = require('./logger/log.js');
let chalk;
try {
  chalk = require("./func/colors.js").colors;
} catch (e) {
  chalk = require("chalk");
}

const sep = path.sep;
const currentConfig = require('./config.json');
const langCode = currentConfig.language;
const execSync = require('child_process').execSync;

 // language
let pathLanguageFile = `${process.cwd()}/languages/${langCode}.lang`;
if (!fs.existsSync(pathLanguageFile)) {
  log.warn("LANGUAGE", `Can't find language file ${langCode}, using default "en.lang"`);
  pathLanguageFile = `${process.cwd()}/languages/en.lang`;
}

const readLanguage = fs.readFileSync(pathLanguageFile, "utf-8");
const languageData = readLanguage
  .split(/\r?\n|\r/)
  .filter(line => line && !line.trim().startsWith("#") && !line.trim().startsWith("//") && line !== "");

global.language = {};
for (const sentence of languageData) {
  const getSeparator = sentence.indexOf('=');
  const itemKey = sentence.slice(0, getSeparator).trim();
  const itemValue = sentence.slice(getSeparator + 1).trim();
  const head = itemKey.slice(0, itemKey.indexOf('.'));
  const key = itemKey.replace(head + '.', '');
  const value = itemValue.replace(/\\n/gi, '\n');
  if (!global.language[head]) global.language[head] = {};
  global.language[head][key] = value;
}

function getText(head, key, ...args) {
  if (!global.language[head]?.[key])
    return `Can't find text: "${head}.${key}"`;
  let text = global.language[head][key];
  for (let i = args.length - 1; i >= 0; i--)
    text = text.replace(new RegExp(`%${i + 1}`, 'g'), args[i]);
  return text;
}

// ─── fs overrides (auto-create folders) ────
const defaultWriteFileSync = fs.writeFileSync;
const defaultCopyFileSync = fs.copyFileSync;

function checkAndAutoCreateFolder(pathFolder) {
  const splitPath = path.normalize(pathFolder).split(sep);
  let currentPath = '';
  for (const part of splitPath) {
    currentPath += part + sep;
    if (!fs.existsSync(currentPath)) fs.mkdirSync(currentPath);
  }
}

fs.writeFileSync = function (fullPath, data) {
  fullPath = path.normalize(fullPath);
  const parts = fullPath.split(sep);
  if (parts.length > 1) { parts.pop(); checkAndAutoCreateFolder(parts.join(sep)); }
  defaultWriteFileSync(fullPath, data);
};

fs.copyFileSync = function (src, dest) {
  src = path.normalize(src);
  dest = path.normalize(dest);
  const parts = dest.split(sep);
  if (parts.length > 1) { parts.pop(); checkAndAutoCreateFolder(parts.join(sep)); }
  defaultCopyFileSync(src, dest);
};

// ─── Config sort helpers ──────
function sortObj(obj, parentObj, rootKeys, stringKey = "") {
  const root = sortObjAsRoot(obj, rootKeys);
  stringKey = stringKey ? stringKey + "." : "";
  for (const key in root) {
    if (typeof root[key] === "object" && !Array.isArray(root[key]) && root[key] !== null) {
      const fullKey = stringKey + key;
      root[key] = sortObj(
        root[key],
        parentObj,
        Object.keys(_.get(parentObj, fullKey) || {}),
        fullKey
      );
    }
  }
  return root;
}

function sortObjAsRoot(subObj, rootKeys) {
  const _obj = {};
  for (const key in subObj)
    _obj[key] = rootKeys.indexOf(key) === -1 ? 9999 : rootKeys.indexOf(key);
  const sorted = Object.keys(_obj).sort((a, b) => _obj[a] - _obj[b]);
  const result = {};
  for (const key of sorted) result[key] = subObj[key];
  return result;
}

// ─── Download helper ──────
async function downloadFile(filePath) {
  const response = await axios.get(
    `https://github.com/bruxa6t9/Bruxa-Bot/raw/main/${filePath}`,
    { responseType: 'arraybuffer' }
  );
  return response.data;
}

// ─── Backup helper ──────
function backupFile(fullPath, folderBackup, filePath) {
  if (fs.existsSync(fullPath)) {
    const backupFilePath = `${folderBackup}/${filePath}`;
    const backupFileDir = path.dirname(backupFilePath);
    if (!fs.existsSync(backupFileDir)) fs.mkdirSync(backupFileDir, { recursive: true });
    fs.copyFileSync(fullPath, backupFilePath);
  }
}

// ─── Config file update helper ──────
function applyConfigUpdate(fullPath, configValueUpdate, folderBackup, filePath) {
  const currentCfg = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
  for (const key in configValueUpdate) {
    const value = configValueUpdate[key];
    if (typeof value === "string" && value.startsWith("DEFAULT_")) {
      const keyOfDefault = value.replace("DEFAULT_", "");
      _.set(currentCfg, key, _.get(currentCfg, keyOfDefault));
    } else {
      _.set(currentCfg, key, value);
    }
  }
  const sorted = sortObj(currentCfg, currentCfg, Object.keys(currentCfg));
  backupFile(fullPath, folderBackup, filePath);
  fs.writeFileSync(fullPath, JSON.stringify(sorted, null, 2));
  console.log(chalk.bold.blue('[↑]'), filePath);
  console.log(chalk.bold.yellow('[!]'), getText("updater", "configChanged", chalk.yellow(filePath)));
}

// ─── Main updater ──────
(async () => {

  // ── Rate limit check ──
  const { data: lastCommit } = await axios.get('https://api.github.com/repos/bruxa6t9/Bruxa-Bot/commits/main');
  const lastCommitDate = new Date(lastCommit.commit.committer.date);
  const diff = new Date().getTime() - lastCommitDate.getTime();
  if (diff < 5 * 60 * 1000) {
    const minutes = Math.floor((5 * 60 * 1000 - diff) / 1000 / 60);
    const seconds = Math.floor((5 * 60 * 1000 - diff) / 1000 % 60);
    return log.error("ERROR", getText("updater", "updateTooFast", minutes, seconds));
  }

  // ── Version check ──
  const { data: versions } = await axios.get('https://raw.githubusercontent.com/bruxa6t9/Bruxa-Bot/main/versions.json');
  const currentVersion = require('./package.json').version;
  const indexCurrentVersion = versions.findIndex(v => v.version === currentVersion);
  if (indexCurrentVersion === -1)
    return log.error("ERROR", getText("updater", "cantFindVersion", chalk.yellow(currentVersion)));

  const versionsNeedToUpdate = versions.slice(indexCurrentVersion + 1);
  if (versionsNeedToUpdate.length === 0)
    return log.info("SUCCESS", getText("updater", "latestVersion"));

  fs.writeFileSync(`${process.cwd()}/versions.json`, JSON.stringify(versions, null, 2));
  log.info("UPDATE", getText("updater", "newVersions", chalk.yellow(versionsNeedToUpdate.length)));

  // ── Version notes ──
  const versionNotes = versionsNeedToUpdate
    .filter(v => v.note)
    .map(v => `${chalk.cyan(`v${v.version}`)}: ${v.note}`)
    .join('\n   ');
  if (versionNotes) {
    console.log(chalk.bold.green('\n📋 What\'s New in Updates:'));
    console.log(`   ${versionNotes}\n`);
  }

  // ── Media info ──
  const allImageUrls = versionsNeedToUpdate.flatMap(v => v.imageUrl || []);
  const allVideoUrls = versionsNeedToUpdate.flatMap(v => v.videoUrl || []);
  const allAudioUrls = versionsNeedToUpdate.flatMap(v => v.audioUrl || []);
  if (allImageUrls.length || allVideoUrls.length || allAudioUrls.length) {
    console.log(chalk.bold.blue('\n📎 Media Content in Updates:'));
    if (allImageUrls.length) console.log(`   🖼️  Images: ${chalk.yellow(allImageUrls.length)} files`);
    if (allVideoUrls.length) console.log(`   🎥 Videos: ${chalk.yellow(allVideoUrls.length)} files`);
    if (allAudioUrls.length) console.log(`   🎵 Audio:  ${chalk.yellow(allAudioUrls.length)} files`);
    console.log('');
  }

// ── Merge all version updates into one object ──
  const createUpdate = {
    version: "",
    addFiles: {},        // new files to add (didn't exist before)
    updateFiles: {},     // existing files to update to new content
    deleteFiles: {},     // files to remove
    reinstallDependencies: false,
    imageUrl: [],
    videoUrl: [],
    audioUrl: []
  };

  for (const version of versionsNeedToUpdate) {
    // ── Update files ──
    for (const filePath in (version.updateFiles || {})) {
      if (["config.json", "configCommands.json"].includes(filePath)) {
        if (!createUpdate.updateFiles[filePath]) createUpdate.updateFiles[filePath] = {};
        createUpdate.updateFiles[filePath] = {
          ...createUpdate.updateFiles[filePath],
          ...version.updateFiles[filePath]
        };
      } else {
        createUpdate.updateFiles[filePath] = version.updateFiles[filePath];
      }
    // remive from deleteFiles if its being update
      if (createUpdate.deleteFiles[filePath]) delete createUpdate.deleteFiles[filePath];
    }

    // ── Add files ──
    for (const filePath in (version.addFiles || {})) {
      createUpdate.addFiles[filePath] = version.addFiles[filePath];
      // If marked for deletion, remove that —
      if (createUpdate.deleteFiles[filePath]) delete createUpdate.deleteFiles[filePath];
    }

    // ── Delete files ──
    for (const filePath in (version.deleteFiles || {}))
      createUpdate.deleteFiles[filePath] = version.deleteFiles[filePath];

    if (version.reinstallDependencies) createUpdate.reinstallDependencies = true;
    if (version.imageUrl) createUpdate.imageUrl.push(...version.imageUrl);
    if (version.videoUrl) createUpdate.videoUrl.push(...version.videoUrl);
    if (version.audioUrl) createUpdate.audioUrl.push(...version.audioUrl);

    createUpdate.version = version.version;
  }

  // ── Backup folder setup ──
  const backupsPath = `${process.cwd()}/backups`;
  if (!fs.existsSync(backupsPath)) fs.mkdirSync(backupsPath);
  const folderBackup = `${backupsPath}/backup_${currentVersion}`;

  // Move any old backup_ folders in root into backups/
  const foldersBackup = fs.readdirSync(process.cwd())
    .filter(f => f.startsWith("backup_") && fs.lstatSync(f).isDirectory());
  for (const folder of foldersBackup)
    fs.moveSync(folder, `${backupsPath}/${folder}`);

  log.info("UPDATE", `Updating to version ${chalk.yellow(createUpdate.version)}`);

  const { addFiles, updateFiles, deleteFiles, reinstallDependencies } = createUpdate;
  const contentsSkip = ["DO NOT UPDATE", "SKIP UPDATE", "DO NOT UPDATE THIS FILE"];

  if (createUpdate.imageUrl.length || createUpdate.videoUrl.length || createUpdate.audioUrl.length) {
    log.info("UPDATE", `📎 Media: ${chalk.cyan(createUpdate.imageUrl.length)} images, ${chalk.cyan(createUpdate.videoUrl.length)} videos, ${chalk.cyan(createUpdate.audioUrl.length)} audio`);
  }

  // ── 1. UPDATE existing files ────
  for (const filePath in updateFiles) {
    const description = updateFiles[filePath];
    const fullPath = `${process.cwd()}/${filePath}`;

    let getFile;
    try {
      getFile = await downloadFile(filePath);
    } catch (e) {
      log.warn("UPDATE", `Failed to download ${filePath}: ${e.message}`);
      continue;
    }

    if (["config.json", "configCommands.json"].includes(filePath)) {
      applyConfigUpdate(fullPath, description, folderBackup, filePath);
    } else {
      const fileExists = fs.existsSync(fullPath);
      backupFile(fullPath, folderBackup, filePath);

      const firstLine = fileExists ? fs.readFileSync(fullPath, "utf-8").trim().split(/\r?\n|\r/)[0] : "";
      const skipIndex = contentsSkip.findIndex(c => firstLine.includes(c));

      if (skipIndex !== -1) {
        console.log(chalk.bold.yellow('[!]'), getText("updater", "skipFile", chalk.yellow(filePath), chalk.yellow(contentsSkip[skipIndex])));
        continue;
      }

      fs.writeFileSync(fullPath, Buffer.from(getFile));
      console.log(
        chalk.bold.blue('[↑]'),
        `${filePath}:`,
        chalk.hex('#858585')(typeof description === "string" ? description : JSON.stringify(description, null, 2))
      );
    }
  }

  // ── 2. ADD new files ────
  for (const filePath in addFiles) {
    const description = addFiles[filePath];
    const fullPath = `${process.cwd()}/${filePath}`;

    // Skip if the file already exists — it's an add, not an update
    if (fs.existsSync(fullPath)) {
      log.warn("UPDATE", `addFiles: ${filePath} already exists — skipping (use updateFiles to overwrite)`);
      continue;
    }

    let getFile;
    try {
      getFile = await downloadFile(filePath);
    } catch (e) {
      log.warn("UPDATE", `Failed to download new file ${filePath}: ${e.message}`);
      continue;
    }

    fs.writeFileSync(fullPath, Buffer.from(getFile));
    console.log(
      chalk.bold.green('[+]'),
      `${filePath}:`,
      chalk.hex('#858585')(typeof description === "string" ? description : JSON.stringify(description, null, 2))
    );
  }

  // ── 3. DELETE files ─────
  for (const filePath in deleteFiles) {
    const description = deleteFiles[filePath];
    const fullPath = `${process.cwd()}/${filePath}`;
    if (fs.existsSync(fullPath)) {
      if (fs.lstatSync(fullPath).isDirectory()) {
        fs.removeSync(fullPath);
      } else {
        backupFile(fullPath, folderBackup, filePath);
        fs.unlinkSync(fullPath);
      }
      console.log(
        chalk.bold.red('[-]'),
        `${filePath}:`,
        chalk.hex('#858585')(description)
      );
    }
  }

  // ── 4. Update package.json from repo ───
  const { data: packageHTML } = await axios.get("https://github.com/bruxa6t9/Bruxa-Bot/blob/main/package.json");
  const json = packageHTML.split('data-target="react-app.embeddedData">')[1].split('</script>')[0];
  const packageJSON = JSON.parse(json).payload.blob.rawLines.join('\n');
  fs.writeFileSync(`${process.cwd()}/package.json`, JSON.stringify(JSON.parse(packageJSON), null, 2));

  log.info("UPDATE", getText("updater", "updateSuccess",
    !reinstallDependencies ? getText("updater", "restartToApply") : ""
  ));

  // ── 5. npm install if needed ───
  if (reinstallDependencies) {
    log.info("UPDATE", getText("updater", "installingPackages"));
    execSync("npm install", { stdio: 'inherit' });
    log.info("UPDATE", getText("updater", "installSuccess"));
  }

  log.info("UPDATE", getText("updater", "backupSuccess", chalk.yellow(folderBackup)));
  log.info("UPDATE", "✅ Update completed successfully!");
  log.info("UPDATE", "Restart the bot to apply changes.");

})().catch(error => {
  log.error("UPDATE", "Update process failed:", error.message);
  process.exit(1);
});