// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const OpenCC = require('opencc-js');

// 初始化 OpenCC 轉換器
const s2tConverter = OpenCC.Converter({ from: 'cn', to: 'tw' })
const t2sConverter = OpenCC.Converter({ from: 'tw', to: 'cn' })

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, 
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('index.html');

  // 開啟開發者工具
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 處理render送來的翻譯請求
ipcMain.handle('translate-text', async (event, { text, targetLang }) => {
  try {
    let convertedText = '';
    if (targetLang === 'simplified') {
      convertedText = t2sTranslation(text)
    } else if (targetLang === 'traditional') {
      convertedText = s2tTranslation(text);
    }
    return convertedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // 發生錯誤時返回原文
  }
});

const t2sTranslation = (text)=>{
    // 處理繁體轉簡體
    let convertedText = t2sConverter(text)
    const replacedList = [

    ]
    for(let index=0; index<replacedList.length; index++){
        const regex = new RegExp(replacedList[index][0], 'g')
        convertedText = convertedText.replace(regex, replacedList[index][1])
    }
    return convertedText

}


const s2tTranslation = (text)=>{
    // 處理簡體轉繁體
    let convertedText = s2tConverter(text)
    const replacedList = [
        ["纔", "才"],
        ["羣", "群"],
        ["麪", "麵"],
        ["茍", "苟"],
        ["莪", "我"],
        ["甯", "寧"],
        ["実", "實"],
        ["満", "滿"],
        ["裏", "裡"],
        ["着", "著"],
    ]
    for(let index=0; index<replacedList.length; index++){
        const regex = new RegExp(replacedList[index][0], 'g')
        convertedText = convertedText.replace(regex, replacedList[index][1])
    }
    return convertedText

}