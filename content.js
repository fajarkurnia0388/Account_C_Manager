// Content script untuk Cursor Account Manager
// Injected ke halaman cursor.com

(function () {
  "use strict";

  // Helper untuk membuat elemen
  function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);

    Object.entries(attributes).forEach(([key, value]) => {
      if (key === "className") {
        element.className = value;
      } else if (key === "onClick") {
        element.addEventListener("click", value);
      } else {
        element.setAttribute(key, value);
      }
    });

    children.forEach((child) => {
      if (typeof child === "string") {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    });

    return element;
  }

  // Inject account switcher UI
  async function injectAccountSwitcher() {
    // Find user menu or suitable location
    const userMenu = findUserMenu();
    if (!userMenu) {
      console.log("User menu not found, retrying...");
      setTimeout(injectAccountSwitcher, 1000);
      return;
    }

    // Get accounts list
    const response = await chrome.runtime.sendMessage({ type: "getAccounts" });
    if (!response.success) {
      console.error("Failed to get accounts:", response.error);
      return;
    }

    const accounts = response.data;
    const activeResponse = await chrome.runtime.sendMessage({
      type: "getActiveAccount",
    });
    const activeAccount = activeResponse.data;

    // Create account switcher dropdown
    const switcher = createAccountSwitcher(accounts, activeAccount);

    // Insert into page
    userMenu.appendChild(switcher);
  }

  // Find suitable location for account switcher
  function findUserMenu() {
    // Try various selectors that might contain user info
    const selectors = [
      ".user-menu",
      ".header-user",
      ".navbar-user",
      '[data-testid="user-menu"]',
      ".account-menu",
      "header nav > div:last-child",
      ".navigation-bar > div:last-child",
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }

    // Fallback: find by looking for avatar or user icon
    const avatars = document.querySelectorAll(
      'img[alt*="avatar"], img[alt*="user"], [class*="avatar"]'
    );
    if (avatars.length > 0) {
      return avatars[0].parentElement;
    }

    return null;
  }

  // Extract account info from Cursor dashboard
  function extractAccountInfo() {
    // Try to find email/name
    const emailSelectors = [
      "p.truncate.text-sm.font-medium",
      'p[class*="truncate"][class*="text-sm"][class*="font-medium"]',
      '[class*="truncate"][class*="font-medium"]',
    ];

    let email = null;
    for (const selector of emailSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        const text = el.textContent.trim();
        if (text && text.includes("@")) {
          email = text;
          break;
        }
      }
      if (email) break;
    }

    // Try to find status (free/pro/etc) - try multiple selectors
    const statusSelectors = [
      "p.flex-shrink-0.text-sm.text-brand-gray-300",
      'p[class*="flex-shrink-0"][class*="text-sm"][class*="text-brand-gray-300"]',
      '[class*="text-brand-gray-300"]',
      'div[title*="Plan"] p',
      'div[title*="plan"] p',
      "div.flex.min-w-0.items-center.gap-1 p",
    ];

    let status = "unknown";
    for (const selector of statusSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
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
  }

  // Create account switcher UI
  function createAccountSwitcher(accounts, activeAccount) {
    const container = createElement("div", {
      className: "cursor-account-switcher",
      id: "cursor-account-switcher",
    });

    // Create dropdown button
    const button = createElement(
      "button",
      {
        className: "cas-dropdown-button",
        onClick: toggleDropdown,
      },
      [
        createElement(
          "span",
          { className: "cas-account-name" },
          activeAccount ? activeAccount.substring(0, 8) : "Accounts"
        ),
        createElement("span", { className: "cas-arrow" }, "▼"),
      ]
    );

    // Create dropdown menu
    const dropdown = createElement("div", {
      className: "cas-dropdown-menu",
      style: "display: none;",
    });

    // Add current account indicator
    if (activeAccount) {
      dropdown.appendChild(
        createElement("div", { className: "cas-current-account" }, [
          createElement("span", { className: "cas-label" }, "Current: "),
          createElement("span", { className: "cas-name" }, activeAccount),
        ])
      );
      dropdown.appendChild(createElement("hr"));
    }

    // Add accounts
    accounts.forEach((account) => {
      const item = createElement(
        "div",
        {
          className: `cas-account-item ${account.active ? "active" : ""}`,
          onClick: () => switchAccount(account.name),
        },
        [
          createElement("span", { className: "cas-account-icon" }, "👤"),
          createElement(
            "span",
            { className: "cas-account-text" },
            account.name
          ),
          account.active &&
            createElement("span", { className: "cas-check" }, "✓"),
        ].filter(Boolean)
      );

      dropdown.appendChild(item);
    });

    // No add account button in content script anymore
    // Users should use the extension popup

    container.appendChild(button);
    container.appendChild(dropdown);

    return container;
  }

  // Toggle dropdown visibility
  function toggleDropdown(event) {
    event.stopPropagation();
    const dropdown = document.querySelector(".cas-dropdown-menu");
    if (dropdown) {
      dropdown.style.display =
        dropdown.style.display === "none" ? "block" : "none";
    }
  }

  // Close dropdown when clicking outside
  document.addEventListener("click", (event) => {
    if (!event.target.closest("#cursor-account-switcher")) {
      const dropdown = document.querySelector(".cas-dropdown-menu");
      if (dropdown) {
        dropdown.style.display = "none";
      }
    }
  });

  // Switch to different account
  async function switchAccount(accountName) {
    const dropdown = document.querySelector(".cas-dropdown-menu");
    if (dropdown) dropdown.style.display = "none";

    try {
      const response = await chrome.runtime.sendMessage({
        type: "switchAccount",
        account: accountName,
      });

      if (response.success) {
        showNotification(`Switching to ${accountName}...`);
        // Redirect to dashboard after successful switch
        setTimeout(() => {
          window.location.href = "https://cursor.com/dashboard";
          // Check if switch was successful after redirect
          setTimeout(() => checkSwitchSuccess(accountName), 3000);
        }, 1000);
      } else {
        showNotification(`Failed to switch: ${response.error}`, "error");
      }
    } catch (error) {
      showNotification(`Error: ${error.message}`, "error");
    }
  }

  // Check if account switch was successful
  async function checkSwitchSuccess(expectedAccount) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "checkSwitchSuccess",
        expectedAccount: expectedAccount,
      });

      if (response.success && !response.switchSuccessful) {
        showSwitchFailureWarning(expectedAccount, response.currentActive);
      }
    } catch (error) {
      console.log("Could not verify switch success:", error);
    }
  }

  // Show warning for failed switch
  function showSwitchFailureWarning(expectedAccount, currentAccount) {
    const currentAccountText = currentAccount
      ? `Still logged in as: ${currentAccount}`
      : "No active account detected";

    const warningDiv = createElement(
      "div",
      {
        className: "cas-switch-warning",
        style: `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff6b6b;
        color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 400px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `,
      },
      [
        createElement(
          "h4",
          { style: "margin: 0 0 10px 0;" },
          "⚠️ Account Switch Failed"
        ),
        createElement(
          "p",
          { style: "margin: 5px 0;" },
          `Failed to switch to: ${expectedAccount}`
        ),
        createElement("p", { style: "margin: 5px 0;" }, currentAccountText),
        createElement(
          "p",
          { style: "margin: 10px 0; font-size: 14px;" },
          "Browser cookies may be conflicting. Clear browser data and try again."
        ),
        createElement("div", { style: "margin-top: 15px;" }, [
          createElement(
            "button",
            {
              style: `
            background: white;
            color: #ff6b6b;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 10px;
            font-weight: 500;
          `,
              onClick: () => {
                openClearBrowserData();
                document.body.removeChild(warningDiv);
              },
            },
            "🧹 Clear Browser Data"
          ),
          createElement(
            "button",
            {
              style: `
            background: transparent;
            color: white;
            border: 1px solid white;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
          `,
              onClick: () => document.body.removeChild(warningDiv),
            },
            "Dismiss"
          ),
        ]),
      ]
    );

    document.body.appendChild(warningDiv);

    // Auto remove after 10 seconds
    setTimeout(() => {
      if (document.body.contains(warningDiv)) {
        document.body.removeChild(warningDiv);
      }
    }, 10000);
  }

  // Open browser's clear data settings
  function openClearBrowserData() {
    const userAgent = navigator.userAgent.toLowerCase();
    let settingsUrl;

    if (userAgent.includes("edg/")) {
      settingsUrl = "edge://settings/clearBrowserData";
    } else if (userAgent.includes("brave/")) {
      settingsUrl = "brave://settings/clearBrowserData";
    } else if (userAgent.includes("opr/") || userAgent.includes("opera/")) {
      settingsUrl = "opera://settings/clearBrowserData";
    } else if (userAgent.includes("chrome/")) {
      settingsUrl = "chrome://settings/clearBrowserData";
    } else {
      settingsUrl = "chrome://settings/clearBrowserData";
    }

    // Open in new tab
    window.open(settingsUrl, "_blank");
    showNotification(
      "Opening browser settings. Clear cookies and cache, then try again.",
      "info"
    );
  }

  // Show notification
  function showNotification(message, type = "success") {
    const notification = createElement(
      "div",
      {
        className: `cas-notification cas-${type}`,
        style: "opacity: 0;",
      },
      [message]
    );

    document.body.appendChild(notification);

    // Fade in
    setTimeout(() => {
      notification.style.opacity = "1";
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectAccountSwitcher);
  } else {
    injectAccountSwitcher();
  }

  // Re-inject if page updates dynamically
  const observer = new MutationObserver(() => {
    if (!document.querySelector("#cursor-account-switcher")) {
      injectAccountSwitcher();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
