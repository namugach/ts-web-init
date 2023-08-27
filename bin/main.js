#!/usr/bin/env node

const
  fs = require("fs"),
  os = require("os"),
  path = require("path"),
  exec = require("child_process").exec,
  config = require("./config");

function createFile(filePath, fileContent = "") {
  return new Promise((res, rej) => {
    const directoryPath = path.dirname(filePath);
    try {
      fs.mkdirSync(directoryPath, { recursive: true });
      fs.writeFileSync(filePath, fileContent, 'utf-8');
      console.log('File and directories created successfully.');
      res();
    } catch (error) {
      rej('Error creating file and directories:', error)
    }
  })
}

function getCommandOption() {
  return os.platform() === "win32"
    ? { shell: "powershell.exe" } : {}
}

function command(command) {
  return new Promise((res, rej) => {
    exec(command, getCommandOption(), (error, stdout, stderr) => {
      if (error) {
        rej(`Error: ${error.message}`);
        return;
      }
      if (stderr) {
        rej(`Stderr: ${stderr}`);
        return;
      }
      console.log(`Command output:\n${stdout}`);
      res();
    });
  })
}

/**
 * 
 * @param {string} data 
 * @param {string} key 
 * @param {string} value 
 */
function replaceValue(data, key, value) {
  return data.replace(new RegExp(`(?<="${key}": )[^,]+`), value);
}

/**
 * 
 * @param {string} data 
 * @param {string} key 
 * @param {string} value 
 */
function deleteComment(data, key) {
  return data.replace(new RegExp(`\/\/ (?="${key}": )`), "");
}

function isGetString(data) {
  return typeof data === "string" ? `"${data}"` : data;
}

/**
 * @param {string} tsconfig 
 * @param {object} option 
 * @returns {string}
 */
function setOption(tsconfig, option) {
  let res = tsconfig;
  
  for(let key in option) {
    res = replaceValue(res, key, isGetString(option[key]));
    res = deleteComment(res, key);
  }
  return res;
}

async function initFile() {
  await createFile("src/main.ts");
  await createFile("./index.html", fs.readFileSync(__dirname+'/index.html', 'utf8'));
}

async function npmSetup() {
  await command("npm i typescript");
  await command("npx tsc --init");
}

function updateOption() {
  const tsconfig = fs.readFileSync('./tsconfig.json', 'utf8')
  const data = setOption(tsconfig, config);
  fs.writeFileSync("./tsconfig.json", data);
}

async function main() {
  await initFile();
  await npmSetup();
  updateOption();
}

main();