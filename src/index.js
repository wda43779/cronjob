// Modules to control application life and create native browser window
const {
  app,
  BrowserWindow,
  Menu,
  Tray,
  clipboard,
  dialog
} = require("electron");
const cron = require("node-cron");
const { existsSync } = require("fs");
const fs = require("fs").promises;
const path = require("path");
const { homedir } = require("os");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let tray = null;

Menu.setApplicationMenu(null);

function createTray() {
  try {
    if (tray === null) {
      console.log(process.cwd());
      tray = new Tray(path.join(__dirname, "tray.png"));
      const contextMenu = Menu.buildFromTemplate([
        {
          label: "退出",
          type: "normal",
          click: () => {
            app.quit();
          }
        }
      ]);
      tray.setToolTip("关机小助手");
      tray.setContextMenu(contextMenu);
    }
    loadConfig();
  } catch (e) {
    console.log(e);
    app.quit();
  }
}

const shutdown = config => {
  console.log("RUN FUNCTION: SHUTDOWN");
  let window = new BrowserWindow({
    fullscreen: true,
    alwaysOnTop: true,
    backgroundColor: "#ffcece",
    webPreferences: {
      nodeIntegration: true
    }
  });

  // and load the index.html of the app.
  window.loadFile(path.join(__dirname, "shutdown.html"));

  // Emitted when the window is closed.
  window.on("closed", function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    window = null;
  });
};

const backup = () => {
  console.log("RUN FUNCTION: BACKUP");
  let window = new BrowserWindow({ width: 800, height: 600 });

  // and load the index.html of the app.
  window.loadFile(path.join(__dirname, "backup.html"));

  // Emitted when the window is closed.
  window.on("closed", function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    window = null;
  });
};

const functionTable = {
  SHUTDOWN: shutdown,
  BACKUP: backup,
  TEST: shutdown
};

const loadConfig = async () => {
  try {
    let allConfig;
    if (existsSync("./config.json")) {
      allConfig = JSON.parse(await fs.readFile("./config.json"));
    } else if (existsSync(path.join(homedir(), "./cronjob-config.json"))) {
      allConfig = JSON.parse(
        await fs.readFile(path.join(homedir(), "./cronjob-config.json"))
      );
    } else {
      throw new Error('can\'t found useful config');
    }
    for (let scheduleConfig of allConfig.schedules) {
      cron.schedule(scheduleConfig.cron, () => {
        functionTable[scheduleConfig.function](scheduleConfig);
      });
    }
  } catch (e) {
    dialog.showMessageBoxSync({
      message: "缺少 config.json，或格式错误"
    });
    console.log(e);
    app.quit();
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createTray);

// Quit when all windows are closed.
app.on("window-all-closed", function() {});

app.on("activate", function() {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
