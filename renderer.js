const sourceSelect = document.getElementById('source-select');
const targetSelect = document.getElementById('target-select');
const sourceTextArea = document.getElementById('sourceText');
const targetTextArea = document.getElementById('targetText');

// 用於防止因程式更新文字而觸發的無限迴圈
let isTranslating = false;

// Debounce 函數：延遲執行，避免在快速打字時頻繁觸發轉換
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// 核心轉換函數
const performTranslation = async (inputArea, outputArea, fromType, toType) => {
    if (isTranslating) return;
    isTranslating = true;

    const text = inputArea.value;

    try {
        if (text.trim() === '') {
            outputArea.value = '';
        } else {
            const translated = await window.electronAPI.translateText({
                text: text,
                sourceType: fromType,
                targetType: toType,
            });

            // 只有當內容確實改變時才更新，避免不必要的重繪和事件觸發
            if (outputArea.value !== translated) {
                outputArea.value = translated;
            }
        }
    } catch (error) {
        console.error("Translation failed:", error);
        outputArea.value = "轉換時發生錯誤";
    } finally {
        // 使用一個微小的延遲來重置標記，確保 DOM 更新完成
        setTimeout(() => { isTranslating = false; }, 50);
    }
};

// 處理來源文字框的輸入事件
const handleSourceInput = () => {
    performTranslation(sourceTextArea, targetTextArea, sourceSelect.value, targetSelect.value);
};

// 處理目標文字框的輸入事件 (是的，你也可以在目標框輸入來反向轉換)
const handleTargetInput = () => {
    performTranslation(targetTextArea, sourceTextArea, targetSelect.value, sourceSelect.value);
};

// 為輸入事件添加防抖處理
sourceTextArea.addEventListener('input', debounce(handleSourceInput, 300));
targetTextArea.addEventListener('input', debounce(handleTargetInput, 300));

// 當下拉選單變化時，立即重新翻譯
sourceSelect.addEventListener('change', () => {
    // 當來源類型改變，從目標框反向翻譯回來
    performTranslation(targetTextArea, sourceTextArea, targetSelect.value, sourceSelect.value);
});

targetSelect.addEventListener('change', () => {
    // 當目標類型改變，從來源框進行翻譯
    performTranslation(sourceTextArea, targetTextArea, sourceSelect.value, targetSelect.value);
});