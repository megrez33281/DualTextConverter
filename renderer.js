const traditionalTextArea = document.getElementById('traditionalText');
const simplifiedTextArea = document.getElementById('simplifiedText');

// 用於防止無限迴圈的標記，當某個格子在翻譯時，會停止當前的翻譯行為
let isTranslating = false;

// Debounce函數，只有在悼祭時結束才會直執行函數，避免函數被頻繁呼叫
function debounce(func, delay) {
    let timeout;   // 此處timeout類似用來以間接的方式操作計時器，所以可以通過它清除已經設定的計時器
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

const handleTraditionalInput = async () => {
    if (isTranslating) return;
    isTranslating = true;

    const text = traditionalTextArea.value; //得到框框內的文字內容
    if (text.trim() === '') {
        simplifiedTextArea.value = '';
    } else {
        try {
            const translated = await window.electronAPI.translateText(text, 'simplified');
            // 只有當內容確實改變時才更新
            if (simplifiedTextArea.value !== translated) {
                simplifiedTextArea.value = translated;
            }
        } catch (error) {
            console.error("Error translating to simplified:", error);
        }
    }
    isTranslating = false;
};

const handleSimplifiedInput = async () => {
    if (isTranslating) return;
    isTranslating = true;

    const text = simplifiedTextArea.value;
    if (text.trim() === '') {
        traditionalTextArea.value = '';
    } else {
        try {
            const translated = await window.electronAPI.translateText(text, 'traditional');
            if (traditionalTextArea.value !== translated) {
                traditionalTextArea.value = translated;
            }
        } catch (error) {
            console.error("Error translating to traditional:", error);
        }
    }
    isTranslating = false;
};

// 為輸入事件添加防抖處理
traditionalTextArea.addEventListener('input', debounce(handleTraditionalInput, 300));
simplifiedTextArea.addEventListener('input', debounce(handleSimplifiedInput, 300));

//確保聚焦時不會因為 placeholder 觸發翻譯
traditionalTextArea.addEventListener('focus', () => {
    if (traditionalTextArea.value === traditionalTextArea.placeholder) {
        traditionalTextArea.value = '';
    }
});

simplifiedTextArea.addEventListener('focus', () => {
    if (simplifiedTextArea.value === simplifiedTextArea.placeholder) {
        simplifiedTextArea.value = '';
    }
});