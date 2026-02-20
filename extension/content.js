/**
 * EcoTrace Extension — Content Script
 *
 * Responds to messages from the popup to get selected text.
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_SELECTION") {
    const text = window.getSelection()?.toString()?.trim() || "";
    sendResponse({ text });
  }
  return true; // Keep the message channel open for async response
});
