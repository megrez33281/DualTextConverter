// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const OpenCC = require('opencc-js');

// 初始化 OpenCC 轉換器
const s2tConverter = OpenCC.Converter({ from: 'cn', to: 'tw' });
const t2sConverter = OpenCC.Converter({ from: 'tw', to: 'cn' });

// --- Helper Functions ---
const t2sCustom = (text) => {
    // 處理繁體轉簡體
    //console.log("呼叫繁轉簡體", text)
    return t2sConverter(text);
};

const s2tCustom = (text) => {
    // 處理簡體轉繁體，並修正常見錯誤
    let convertedText = s2tConverter(text);
    const replacedList = [
        ["纔", "才"], ["羣", "群"], ["麪", "麵"], ["茍", "苟"],
        ["莪", "我"], ["甯", "寧"], ["実", "實"], ["満", "滿"],
        ["裏", "裡"], ["着", "著"],
    ];
    for (const [charFrom, charTo] of replacedList) {
        const regex = new RegExp(charFrom, 'g');
        convertedText = convertedText.replace(regex, charTo);
    }
    return convertedText;
};

// 將文字轉為 NCR Hex 格式 (e.g., 以下)
const textToNcrHex = (text) => {
    if (!text) return '';
    try {
        // 使用 Array.from 或 [...] 確保能正確處理 emoji 等多位元組字元
        return [...text].map(char => {
            // 取得字元的 Unicode 碼位，並轉為 16 進制
            const hex = char.codePointAt(0).toString(16).toUpperCase();
            return `&#x${hex};`;
        }).join('');
    } catch (e) {
        console.error("Error encoding to NCR Hex:", e);
        return "編碼錯誤";
    }
};

// 將 NCR Hex 格式轉回文字
const ncrHexToText = (ncr) => {
    if (!ncr) return '';
    try {
        // 使用正則表達式和 replace 函式進行全局替換
        return ncr.replace(/&#x([0-9a-fA-F]+);/g, (match, hexCode) => {
            // 將 16 進制碼位轉為 10 進制數字
            const codePoint = parseInt(hexCode, 16);
            // 從碼位轉換回對應的字元
            return String.fromCodePoint(codePoint);
        });
    } catch (e) {
        console.error("Error decoding from NCR Hex:", e);
        return "解碼錯誤";
    }
};


// --- Electron App Life Cycle ---
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
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


// --- IPC Handler for Translation ---
ipcMain.handle('translate-text', async (event, { text, sourceType, targetType }) => {
  //console.log("接收訊息：", text, sourceType, targetType)
  if (sourceType === targetType) {
    // 如果來源和目標類型相同，直接返回原文
    //console.log("Same Type")
    return text; 
  }
  
  try {
    let intermediateText = text;

    // 步驟 1: 將來源文字轉換為標準中文字符 (如果來源是 UTF-8)
    if (sourceType === 'utf8') {
      //console.log("Is UTF-8")
      intermediateText = ncrHexToText(text);
    }

    // 步驟 2: 進行核心轉換
    let convertedText = intermediateText;
    if (targetType === 'utf8') {
      convertedText = textToNcrHex(intermediateText);
    } else if (targetType === 'simplified') {
      // 來源可能是繁體或已解碼的UTF-8
      convertedText = t2sCustom(intermediateText);
    } else if (targetType === 'traditional') {
      // 來源可能是簡體或已解碼的UTF-8
      convertedText = s2tCustom(intermediateText);
    }
    //console.log("轉換文字：", convertedText)
    return convertedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // 發生錯誤時返回原文
  }
});