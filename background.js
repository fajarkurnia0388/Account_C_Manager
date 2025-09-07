// background service worker kept minimal - required for manifest v3.
// We can handle messages here if needed in future.
chrome.runtime.onInstalled.addListener(() => {
  console.log("Account Manager installed.");
});
