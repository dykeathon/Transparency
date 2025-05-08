chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "generateResponse",
      title: "Generate Anti-Transphobic Response",
      contexts: ["selection"]
    });
  });
  
  chrome.contextMenus.onClicked.addListener((info) => {
    if (info.menuItemId === "generateResponse") {
      chrome.storage.local.set({ selectedText: info.selectionText });
      chrome.action.openPopup();
    }
  });
  