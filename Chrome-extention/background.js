// Create context menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "generateResponse",
    title: "Generate Response with TransDefender",
    contexts: ["selection"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "generateResponse") {
    // Store the selected text
    chrome.storage.local.set({ selectedText: info.selectionText }, () => {
      // Open the popup
      chrome.action.openPopup();
    });
  }
});
  