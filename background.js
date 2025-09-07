// Background script for Cursor Account Manager extension

// Import account service
importScripts("services/account.js");

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log("Cursor Account Manager extension installed");

  try {
    // Enable side panel for all tabs (if supported)
    if (chrome.sidePanel) {
      console.log("Side Panel API available");
      await chrome.sidePanel.setPanelBehavior({
        openPanelOnActionClick: false,
      });
    } else {
      console.log("Side Panel API not available - requires Chrome 114+");
    }

    // Check if there's an active session
    const cookies = await accountService.getCurrentCookies();
    console.log("Found cookies:", cookies.length);

    if (cookies.length > 0) {
      const username = await accountService.autoDetectAccount();
      console.log("Auto-detected username:", username);

      if (username) {
        await accountService.updateBadge(username);
      }
    }
  } catch (error) {
    console.error("Error during initialization:", error);
  }
});

// Sync accounts when cookies change
chrome.cookies.onChanged.addListener(async (changeInfo) => {
  if (changeInfo.cookie.domain.includes("cursor.com")) {
    // If cookie was added and we don't have an active account, auto-detect
    if (!changeInfo.removed) {
      const activeAccount = await accountService.getActiveAccount();
      if (!activeAccount) {
        await accountService.autoDetectAccount();
      }
    }
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      console.log("Received message:", request.type);
      switch (request.type) {
        case "ping":
          sendResponse({ success: true });
          break;

        case "getAccounts":
          const accounts = await accountService.getAll();
          sendResponse({ success: true, data: accounts });
          break;

        case "switchAccount":
          await accountService.switchTo(request.account);
          sendResponse({ success: true });
          break;

        case "removeAccount":
          await accountService.remove(
            request.account,
            request.deleteFile || false
          );
          sendResponse({ success: true });
          break;

        case "addCurrentAccount":
          const username = await accountService.autoDetectAccount();
          sendResponse({ success: true, data: username });
          break;

        case "getActiveAccount":
          const active = await accountService.getActiveAccount();
          sendResponse({ success: true, data: active });
          break;

        case "importAccount":
          await accountService.upsert(
            request.account.name,
            request.account.cookies
          );
          sendResponse({ success: true });
          break;

        case "checkSwitchSuccess":
          // Verify if the account switch was successful
          const currentActive = await accountService.getActiveAccount();
          const expectedAccount = request.expectedAccount;
          sendResponse({
            success: true,
            switchSuccessful: currentActive === expectedAccount,
            currentActive: currentActive,
          });
          break;

        case "scanDownloadsFolder":
          // Scan Downloads folder for account files
          const downloadFiles = await accountService.scanDownloadsForAccounts();
          sendResponse({ success: true, data: downloadFiles });
          break;

        case "openSidePanel":
          console.log("Processing openSidePanel request");
          // Open side panel - must be in response to user gesture
          try {
            console.log("chrome.sidePanel available:", !!chrome.sidePanel);

            if (chrome.sidePanel) {
              console.log("Enabling side panel behavior");
              // Enable side panel to open when extension icon is clicked
              await chrome.sidePanel.setPanelBehavior({
                openPanelOnActionClick: true,
              });
              sendResponse({
                success: true,
                message:
                  "Side panel enabled. Click the extension icon to open sidebar.",
              });
            } else {
              console.log("Side Panel API not available");
              sendResponse({
                success: false,
                error:
                  "Side Panel requires Chrome 114+. Please update your browser.",
              });
            }
          } catch (error) {
            console.error("Side panel error:", error);
            sendResponse({ success: false, error: error.message });
          }
          break;

        case "importAccountJSON":
          const accountName = await accountService.importAccountFromJSON(
            request.jsonText,
            request.customName
          );
          sendResponse({ success: true, data: accountName });
          break;

        case "exportAccount":
          await accountService.exportAccountToFile(request.account);
          sendResponse({ success: true });
          break;

        case "revealAccountFile":
          const revealed = await accountService.revealAccountFile(
            request.account
          );
          sendResponse({ success: revealed });
          break;

        case "clearAllData":
          const cleared = await accountService.clearAllData();
          sendResponse({ success: cleared });
          break;

        case "getAllStoredData":
          const allData = await accountService.getAllStoredData();
          sendResponse({ success: true, data: allData });
          break;

        case "checkDuplicateAccount":
          const duplicate = await accountService.findDuplicateAccount(
            request.cookies
          );
          sendResponse({ success: true, duplicate: duplicate });
          break;

        case "consolidateDuplicates":
          const consolidationResult =
            await accountService.consolidateDuplicates();
          sendResponse(consolidationResult);
          break;

        case "updateAccountInfo":
          await accountService.saveAccountInfo(
            request.account,
            request.email,
            request.status
          );
          sendResponse({ success: true });
          break;

        case "getAccountInfo":
          // Extract info from current page
          const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });
          // Only process if we're on cursor.com/dashboard or settings
          if (
            tab &&
            tab.url &&
            (tab.url.includes("cursor.com/dashboard") ||
              tab.url.includes("cursor.com/settings"))
          ) {
            const result = await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: () => {
                // This runs in the page context
                const extractInfo = () => {
                  let email = null;
                  let status = "unknown";

                  // Find email
                  const emailEls = document.querySelectorAll(
                    'p.truncate.text-sm.font-medium, [class*="truncate"][class*="font-medium"]'
                  );
                  for (const el of emailEls) {
                    const text = el.textContent.trim();
                    if (text && text.includes("@")) {
                      email = text;
                      break;
                    }
                  }

                  // Find status - try multiple selectors
                  const statusSelectors = [
                    "p.flex-shrink-0.text-sm.text-brand-gray-300",
                    '[class*="text-brand-gray-300"]',
                    'div[title*="Plan"] p',
                    'div[title*="plan"] p',
                    "div.flex.min-w-0.items-center.gap-1 p",
                  ];

                  for (const selector of statusSelectors) {
                    const statusEls = document.querySelectorAll(selector);
                    for (const el of statusEls) {
                      const text = el.textContent.trim().toLowerCase();
                      if (text) {
                        // Handle variations like "Free Plan", "Pro Plan", etc.
                        if (text.includes("free")) {
                          status = "free";
                          break;
                        } else if (text.includes("pro")) {
                          status = "pro";
                          break;
                        } else if (text.includes("business")) {
                          status = "business";
                          break;
                        }
                      }
                    }
                    if (status !== "unknown") break;
                  }

                  // Fallback: check title attributes directly
                  if (status === "unknown") {
                    const titleEls = document.querySelectorAll(
                      '[title*="Plan"], [title*="plan"]'
                    );
                    for (const el of titleEls) {
                      const title = el.getAttribute("title").toLowerCase();
                      if (title.includes("free")) {
                        status = "free";
                        break;
                      } else if (title.includes("pro")) {
                        status = "pro";
                        break;
                      } else if (title.includes("business")) {
                        status = "business";
                        break;
                      }
                    }
                  }

                  return { email, status };
                };

                return extractInfo();
              },
            });

            if (result && result[0] && result[0].result) {
              sendResponse({ success: true, data: result[0].result });
            } else {
              sendResponse({ success: false, error: "Could not extract info" });
            }
          } else {
            sendResponse({ success: false, error: "Not on cursor.com" });
          }
          break;

        default:
          sendResponse({ success: false, error: "Unknown message type" });
      }
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  })();

  return true; // Keep channel open for async response
});

// Update badge on startup
chrome.runtime.onStartup.addListener(async () => {
  const activeAccount = await accountService.getActiveAccount();
  if (activeAccount) {
    await accountService.updateBadge(activeAccount);
  }
});
