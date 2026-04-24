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

const REPO   = "bruxa6t9/Bruxa-Bot";
const BRANCH = "main";
const RAW    = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`;
const API    = `https://api.github.com/repos/${REPO}`;

// ─── Language loader ─────────
let pathLanguageFile = `${process.cwd()}/languages/${langCode}.lang`;
if (!fs.existsSync(pathLanguageFile)) {
  log.warn("LANGUAGE", `Can't find language file "${langCode}", using default "en.lang"`);
  pathLanguageFile = `${process.cwd()}/languages/en.lang`;
}

const languageData = fs.readFileSync(pathLanguageFile, "utf-8")
  .split(/\r?\n|\r/)
  .filter(line => line && !line.trim().startsWith("#") && !line.trim().startsWith("//") && line !== "");

global.language = {};
for (const sentence of languageData) {
  const eqIdx    = sentence.indexOf('=');
  const itemKey  = sentence.slice(0, eqIdx).trim();
  const itemValue = sentence.slice(eqIdx + 1).trim();
  const head     = itemKey.slice(0, itemKey.indexOf('.'));
  const key      = itemKey.replace(head + '.', '');
  const value    = itemValue.replace(/\\n/gi, '\n');
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

// ─── fs overrides (auto-create parent folders on write) ───────────
const defaultWriteFileSync = fs.writeFileSync;
const defaultCopyFileSync  = fs.copyFileSync;

function checkAndAutoCreateFolder(folderPath) {
  const parts = path.normalize(folderPath).split(sep);
  let cur = '';
  for (const part of parts) {
    cur += part + sep;
    if (!fs.existsSync(cur)) fs.mkdirSync(cur);
  }
}

fs.writeFileSync = function (fullPath, data) {
  fullPath = path.normalize(fullPath);
  const parts = fullPath.split(sep);
  if (parts.length > 1) { parts.pop(); checkAndAutoCreateFolder(parts.join(sep)); }
  defaultWriteFileSync(fullPath, data);
};

fs.copyFileSync = function (src, dest) {
  src  = path.normalize(src);
  dest = path.normalize(dest);
  const parts = dest.split(sep);
  if (parts.length > 1) { parts.pop(); checkAndAutoCreateFolder(parts.join(sep)); }
  defaultCopyFileSync(src, dest);
};

// ─── Config sort helpers ──────────
function sortObjAsRoot(subObj, rootKeys) {
  const ranked = {};
  for (const key in subObj)
    ranked[key] = rootKeys.indexOf(key) === -1 ? 9999 : rootKeys.indexOf(key);
  const sortedKeys = Object.keys(ranked).sort((a, b) => ranked[a] - ranked[b]);
  const result = {};
  for (const key of sortedKeys) result[key] = subObj[key];
  return result;
}

function sortObj(obj, parentObj, rootKeys, prefix = "") {
  const root = sortObjAsRoot(obj, rootKeys);
  const pre  = prefix ? prefix + "." : "";
  for (const key in root) {
    if (typeof root[key] === "object" && !Array.isArray(root[key]) && root[key] !== null) {
      const fullKey = pre + key;
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

// ─── Safe JSON parse ────────────
// FIX: axios returns a string when content-type header isn't set on raw GitHub
// URLs — always parse safely instead of assuming it's already an object
function safeParseJSON(data, label) {
  try {
    return typeof data === "string" ? JSON.parse(data) : data;
  } catch (e) {
    throw new Error(`Failed to parse ${label}: ${e.message}`);
  }
}

// ─── Download a file from the configured repo ────────
async function downloadFile(filePath) {
  const res = await axios.get(`${RAW}/${filePath}`, { responseType: 'arraybuffer' });
  return res.data;
}

// ─── Backup a file before overwriting / deleting ────────
function backupFile(fullPath, folderBackup, filePath) {
  if (!fs.existsSync(fullPath)) return;
  const dest    = path.join(folderBackup, filePath);
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(fullPath, dest);
}

// ─── Apply a key-value patch to config.json / configCommands.json ────────
function applyConfigUpdate(fullPath, patch, folderBackup, filePath) {
  const cfg = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
  for (const key in patch) {
    const val = patch[key];
    if (typeof val === "string" && val.startsWith("DEFAULT_")) {
      _.set(cfg, key, _.get(cfg, val.replace("DEFAULT_", "")));
    } else {
      _.set(cfg, key, val);
    }
  }
  const sorted = sortObj(cfg, cfg, Object.keys(cfg));
  backupFile(fullPath, folderBackup, filePath);
  fs.writeFileSync(fullPath, JSON.stringify(sorted, null, 2));
  console.log(chalk.bold.blue('[↑]'), filePath);
  console.log(chalk.bold.yellow('[!]'), getText("updater", "configChanged", chalk.yellow(filePath)));
}

// ─── Main ────────
(async () => {

  // ── Rate limit: block if repo committed < 5 min ago ──
  try {
    const { data: commitsData } = await axios.get(`${API}/commits/${BRANCH}`);
    // FIX: GitHub /commits/:branch returns an ARRAY, not a single object
    const latest = Array.isArray(commitsData) ? commitsData[0] : commitsData;
    const lastCommitDate = new Date(latest?.commit?.committer?.date);

    if (!isNaN(lastCommitDate.getTime())) {
      const diff = Date.now() - lastCommitDate.getTime();
      if (diff < 5 * 60 * 1000) {
        const minutes = Math.floor((5 * 60 * 1000 - diff) / 60000);
        const seconds = Math.floor(((5 * 60 * 1000 - diff) % 60000) / 1000);
        return log.error("ERROR", getText("updater", "updateTooFast", minutes, seconds));
      }
    }
  } catch (e) {
    log.warn("UPDATE", `Couldn't check commit date (${e.message}), continuing..`);
  }

  // ── Fetch and validate versions.json ───────
  let versions;
  try {
    const { data: rawVersions } = await axios.get(`${RAW}/versions.json`);
    versions = safeParseJSON(rawVersions, "versions.json");
  } catch (e) {
    return log.error("UPDATE", `Failed to fetch versions.json: ${e.message}`);
  }

  if (!Array.isArray(versions)) {
    return log.error("UPDATE", "versions.json is not a valid array. Aborting.");
  }

  // ── Version comparison ──────────
  const currentVersion      = require('./package.json').version;
  const indexCurrentVersion = versions.findIndex(v => v.version === currentVersion);

  if (indexCurrentVersion === -1)
    return log.error("ERROR", getText("updater", "cantFindVersion", chalk.yellow(currentVersion)));

  const versionsNeedToUpdate = versions.slice(indexCurrentVersion + 1);
  if (versionsNeedToUpdate.length === 0)
    return log.info("SUCCESS", getText("updater", "latestVersion"));

  fs.writeFileSync(`${process.cwd()}/versions.json`, JSON.stringify(versions, null, 2));
  log.info("UPDATE", getText("updater", "newVersions", chalk.yellow(versionsNeedToUpdate.length)));

  // ── Version notes ───────────
  const versionNotes = versionsNeedToUpdate
    .filter(v => v.note)
    .map(v => `${chalk.cyan(`v${v.version}`)}: ${v.note}`)
    .join('\n   ');
  if (versionNotes) {
    console.log(chalk.bold.green('\n📋 What\'s New:'));
    console.log(`   ${versionNotes}\n`);
  }

  // ── Media info ──────────
  const allImageUrls = versionsNeedToUpdate.flatMap(v => v.imageUrl || []);
  const allVideoUrls = versionsNeedToUpdate.flatMap(v => v.videoUrl || []);
  const allAudioUrls = versionsNeedToUpdate.flatMap(v => v.audioUrl || []);
  if (allImageUrls.length || allVideoUrls.length || allAudioUrls.length) {
    console.log(chalk.bold.blue('\n📎 Media in Updates:'));
    if (allImageUrls.length) console.log(`   🖼️  Images: ${chalk.yellow(allImageUrls.length)}`);
    if (allVideoUrls.length) console.log(`   🎥 Videos: ${chalk.yellow(allVideoUrls.length)}`);
    if (allAudioUrls.length) console.log(`   🎵 Audio:  ${chalk.yellow(allAudioUrls.length)}`);
    console.log('');
  }

  // ── Merge all version diffs into one flat update object ───
  const createUpdate = {
    version: "",
    addFiles: {},
    updateFiles: {},
    deleteFiles: {},
    reinstallDependencies: false,
    imageUrl: [],
    videoUrl: [],
    audioUrl: []
  };

  for (const version of versionsNeedToUpdate) {
    // updateFiles
    for (const filePath in (version.updateFiles || {})) {
      const val = version.updateFiles[filePath];

      // FIX: skip malformed json
      if (val === undefined || val === null) continue;

      if (["config.json", "configCommands.json"].includes(filePath)) {
        if (!createUpdate.updateFiles[filePath]) createUpdate.updateFiles[filePath] = {};
        Object.assign(createUpdate.updateFiles[filePath], val);
      } else {
        createUpdate.updateFiles[filePath] = val;
      }
      delete createUpdate.deleteFiles[filePath]; // being updated
    }

    // addFiles
    for (const filePath in (version.addFiles || {})) {
      createUpdate.addFiles[filePath] = version.addFiles[filePath];
      delete createUpdate.deleteFiles[filePath]; // being added
    }

    // deleteFiles
    for (const filePath in (version.deleteFiles || {}))
      createUpdate.deleteFiles[filePath] = version.deleteFiles[filePath];

    if (version.reinstallDependencies) createUpdate.reinstallDependencies = true;
    if (version.imageUrl?.length) createUpdate.imageUrl.push(...version.imageUrl);
    if (version.videoUrl?.length) createUpdate.videoUrl.push(...version.videoUrl);
    if (version.audioUrl?.length) createUpdate.audioUrl.push(...version.audioUrl);

    createUpdate.version = version.version;
  }

  // ── Backup folder ─────
  const backupsPath  = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupsPath)) fs.mkdirSync(backupsPath);
  const folderBackup = path.join(backupsPath, `backup_${currentVersion}`);

  // FIX: lstatSync needs full path — readdirSync only returns filenames
  fs.readdirSync(process.cwd())
    .filter(f => {
      const full = path.join(process.cwd(), f);
      return f.startsWith("backup_") && fs.existsSync(full) && fs.lstatSync(full).isDirectory();
    })
    .forEach(f => fs.moveSync(
      path.join(process.cwd(), f),
      path.join(backupsPath, f)
    ));

  log.info("UPDATE", `Updating to version ${chalk.yellow(createUpdate.version)}`);

  const { addFiles, updateFiles, deleteFiles, reinstallDependencies } = createUpdate;
  const SKIP_MARKERS = ["DO NOT UPDATE", "SKIP UPDATE", "DO NOT UPDATE THIS FILE"];

  if (createUpdate.imageUrl.length || createUpdate.videoUrl.length || createUpdate.audioUrl.length) {
    log.info("UPDATE", `📎 Media: ${chalk.cyan(createUpdate.imageUrl.length)} images, ${chalk.cyan(createUpdate.videoUrl.length)} videos, ${chalk.cyan(createUpdate.audioUrl.length)} audio`);
  }

  // ── 1. UPDATE existing files ────
  for (const filePath in updateFiles) {
    const description = updateFiles[filePath];
    const fullPath    = path.join(process.cwd(), filePath);

    let fileData;
    try {
      fileData = await downloadFile(filePath);
    } catch (e) {
      log.warn("UPDATE", `Failed to download "${filePath}": ${e.message}`);
      continue;
    }

    if (["config.json", "configCommands.json"].includes(filePath)) {
      applyConfigUpdate(fullPath, description, folderBackup, filePath);
    } else {
      const fileExists = fs.existsSync(fullPath);
      backupFile(fullPath, folderBackup, filePath);

      const firstLine = fileExists
        ? fs.readFileSync(fullPath, "utf-8").trim().split(/\r?\n|\r/)[0]
        : "";
      const skipMarker = SKIP_MARKERS.find(m => firstLine.includes(m));
      if (skipMarker) {
        console.log(chalk.bold.yellow('[!]'), getText("updater", "skipFile", chalk.yellow(filePath), chalk.yellow(skipMarker)));
        continue;
      }

      fs.writeFileSync(fullPath, Buffer.from(fileData));
      console.log(
        chalk.bold.blue('[↑]'),
        `${filePath}:`,
        chalk.hex('#858585')(typeof description === "string" ? description : JSON.stringify(description, null, 2))
      );
    }
  }

  // ── 2. ADD new files ─────
  for (const filePath in addFiles) {
    const description = addFiles[filePath];
    const fullPath    = path.join(process.cwd(), filePath);

    if (fs.existsSync(fullPath)) {
      log.warn("UPDATE", `addFiles: "${filePath}" already exists — skipping (use updateFiles to overwrite)`);
      continue;
    }

    let fileData;
    try {
      fileData = await downloadFile(filePath);
    } catch (e) {
      log.warn("UPDATE", `Failed to download new file "${filePath}": ${e.message}`);
      continue;
    }

    fs.writeFileSync(fullPath, Buffer.from(fileData));
    console.log(
      chalk.bold.green('[+]'),
      `${filePath}:`,
      chalk.hex('#858585')(typeof description === "string" ? description : JSON.stringify(description, null, 2))
    );
  }

  // ── 3. DELETE files ───
  for (const filePath in deleteFiles) {
    const description = deleteFiles[filePath];
    const fullPath    = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) continue;

    if (fs.lstatSync(fullPath).isDirectory()) {
      fs.removeSync(fullPath);
    } else {
      backupFile(fullPath, folderBackup, filePath);
      fs.unlinkSync(fullPath);
    }
    console.log(chalk.bold.red('[-]'), `${filePath}:`, chalk.hex('#858585')(description));
  }

  // ── 4. Update package.json from repo ────

  try {
    const { data: rawPkg } = await axios.get(`${RAW}/package.json`);
    const pkgData = safeParseJSON(rawPkg, "package.json");
    fs.writeFileSync(
      path.join(process.cwd(), 'package.json'),
      JSON.stringify(pkgData, null, 2)
    );
    log.info("UPDATE", "package.json updated from repo");
  } catch (e) {
    log.warn("UPDATE", `Failed to update package.json: ${e.message}`);
  }

  log.info("UPDATE", getText("updater", "updateSuccess",
    !reinstallDependencies ? getText("updater", "restartToApply") : ""
  ));

  // ── 5. npm install if dependencies changed ───
  if (reinstallDependencies) {
    log.info("UPDATE", getText("updater", "installingPackages"));
    execSync("npm install", { stdio: 'inherit' });
    log.info("UPDATE", getText("updater", "installSuccess"));
  }

  log.info("UPDATE", getText("updater", "backupSuccess", chalk.yellow(folderBackup)));
  log.info("UPDATE", "✅ Update completed! Restart the bot to apply changes.");

})().catch(err => {
  log.error("UPDATE", "Update failed:", err.message);
  process.exit(1);
});