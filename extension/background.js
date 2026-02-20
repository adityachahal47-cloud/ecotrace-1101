/**
 * EcoTrace Extension — Background Service Worker
 *
 * Right-click context menu opens the web app to analyze content directly.
 * Much more reliable than running fetch in the service worker.
 */

const WEB_URL = "http://localhost:3000";

chrome.runtime.onInstalled.addListener(() => {
  // Clear any existing menus first
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "ecotrace-analyze-text",
      title: "Analyze with EcoTrace",
      contexts: ["selection"],
    });

    chrome.contextMenus.create({
      id: "ecotrace-analyze-image",
      title: "Analyze image with EcoTrace",
      contexts: ["image"],
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "ecotrace-analyze-text" && info.selectionText) {
    // Open analyze page with text content as query param
    const encoded = encodeURIComponent(info.selectionText);
    chrome.tabs.create({
      url: `${WEB_URL}/analyze?type=text&content=${encoded}`,
    });
  }

  if (info.menuItemId === "ecotrace-analyze-image" && info.srcUrl) {
    // Open analyze page with image URL as query param
    const encoded = encodeURIComponent(info.srcUrl);
    chrome.tabs.create({
      url: `${WEB_URL}/analyze?type=image&url=${encoded}`,
    });
  }
});
