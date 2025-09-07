// Account Management Service untuk Cursor Account Manager
class AccountService {
  constructor() {
    this.STORAGE_KEY = "cursor_accounts";
    this.AVATARS_KEY = "cursor_accounts:avatars";
    this.ACTIVE_KEY = "cursor_active_account";
    this.ACCOUNT_INFO_KEY = "cursor_accounts:info";
  }

  // Get all accounts
  async getAll() {
    const accounts = await chrome.storage.local.get(this.STORAGE_KEY);
    const avatars = await chrome.storage.local.get(this.AVATARS_KEY);
    const accountInfo = await chrome.storage.local.get(this.ACCOUNT_INFO_KEY);
    const activeAccount = await this.getActiveAccount();

    if (!accounts[this.STORAGE_KEY]) {
      return [];
    }

    return Object.entries(accounts[this.STORAGE_KEY]).map(([name, cookies]) => {
      const info = accountInfo[this.ACCOUNT_INFO_KEY]?.[name] || {};
      return {
        name,
        cookies,
        active: name === activeAccount,
        avatarUrl: avatars[this.AVATARS_KEY]?.[name] || null,
        expiresAt: this.getEarliestExpiry(cookies),
        email: info.email || name,
        status: info.status || "free",
      };
    });
  }

  // Get account names only
  async getAllNames() {
    const accounts = await this.getAll();
    return accounts.map((acc) => acc.name);
  }

  // Find specific account
  async find(accountName) {
    const accounts = await this.getAll();
    return accounts.find((acc) => acc.name === accountName);
  }

  // Get active account
  async getActiveAccount() {
    const result = await chrome.storage.local.get(this.ACTIVE_KEY);
    return result[this.ACTIVE_KEY] || null;
  }

  // Save or update account
  async upsert(accountName, cookies) {
    const accounts = await chrome.storage.local.get(this.STORAGE_KEY);
    const accountsData = accounts[this.STORAGE_KEY] || {};

    accountsData[accountName] = cookies;

    await chrome.storage.local.set({
      [this.STORAGE_KEY]: accountsData,
    });

    // Set as active if it's the first account
    const currentActive = await this.getActiveAccount();
    if (!currentActive) {
      await this.setActiveAccount(accountName);
    }
  }

  // Switch to account
  async switchTo(accountName) {
    const account = await this.find(accountName);
    if (!account) {
      throw new Error(`Account ${accountName} not found`);
    }

    // Clear all Cursor cookies
    await this.clearCursorCookies();

    // Restore cookies for target account
    for (const cookie of account.cookies) {
      const cookieData = {
        url: `https://${cookie.domain}${cookie.path}`,
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite || "unspecified",
      };

      if (cookie.expirationDate) {
        cookieData.expirationDate = cookie.expirationDate;
      }

      try {
        await chrome.cookies.set(cookieData);
      } catch (error) {
        console.error("Failed to set cookie:", error, cookieData);
      }
    }

    // Update active account
    await this.setActiveAccount(accountName);

    // Update badge
    await this.updateBadge(accountName);

    // Reload Cursor tabs
    await this.reloadCursorTabs();
  }

  // Remove account
  async remove(accountName) {
    const accounts = await chrome.storage.local.get(this.STORAGE_KEY);
    const accountsData = accounts[this.STORAGE_KEY] || {};

    delete accountsData[accountName];

    await chrome.storage.local.set({
      [this.STORAGE_KEY]: accountsData,
    });

    // Remove avatar
    const avatars = await chrome.storage.local.get(this.AVATARS_KEY);
    const avatarsData = avatars[this.AVATARS_KEY] || {};
    delete avatarsData[accountName];
    await chrome.storage.local.set({
      [this.AVATARS_KEY]: avatarsData,
    });

    // If this was active account, clear active status
    const activeAccount = await this.getActiveAccount();
    if (activeAccount === accountName) {
      await chrome.storage.local.remove(this.ACTIVE_KEY);
      await this.updateBadge("");
    }
  }

  // Save avatar for account
  async saveAvatar(accountName, avatarUrl) {
    const avatars = await chrome.storage.local.get(this.AVATARS_KEY);
    const avatarsData = avatars[this.AVATARS_KEY] || {};

    avatarsData[accountName] = avatarUrl;

    await chrome.storage.local.set({
      [this.AVATARS_KEY]: avatarsData,
    });
  }

  // Save account info (email and status)
  async saveAccountInfo(accountName, email, status) {
    const accountInfo = await chrome.storage.local.get(this.ACCOUNT_INFO_KEY);
    const infoData = accountInfo[this.ACCOUNT_INFO_KEY] || {};

    infoData[accountName] = { email, status };

    await chrome.storage.local.set({
      [this.ACCOUNT_INFO_KEY]: infoData,
    });
  }

  // Set active account
  async setActiveAccount(accountName) {
    await chrome.storage.local.set({
      [this.ACTIVE_KEY]: accountName,
    });
  }

  // Clear all Cursor cookies
  async clearCursorCookies() {
    try {
      const cursorCookies = await this.getCurrentCookies();
      console.log("Clearing", cursorCookies.length, "cursor cookies");

      for (const cookie of cursorCookies) {
        const domain = cookie.domain.startsWith(".")
          ? cookie.domain.substring(1)
          : cookie.domain;
        const url = `https://${domain}${cookie.path}`;

        try {
          await chrome.cookies.remove({
            url: url,
            name: cookie.name,
          });
        } catch (error) {
          console.error("Failed to remove cookie:", cookie.name, error);
        }
      }
    } catch (error) {
      console.error("Error clearing cookies:", error);
    }
  }

  // Get current Cursor cookies
  async getCurrentCookies() {
    try {
      // Get all cookies and filter for cursor.com
      const allCookies = await chrome.cookies.getAll({});

      // Filter cookies that belong to cursor.com
      const cursorCookies = allCookies.filter(
        (cookie) =>
          cookie.domain === "cursor.com" ||
          cookie.domain === ".cursor.com" ||
          cookie.domain.endsWith(".cursor.com")
      );

      console.log("Total cookies found:", allCookies.length);
      console.log("Cursor cookies found:", cursorCookies.length);

      return cursorCookies;
    } catch (error) {
      console.error("Error getting cookies:", error);
      return [];
    }
  }

  // Update extension badge
  async updateBadge(accountName) {
    if (accountName) {
      const shortName = accountName.substring(0, 2).toUpperCase();
      await chrome.action.setBadgeText({ text: shortName });
      await chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });
    } else {
      await chrome.action.setBadgeText({ text: "" });
    }
  }

  // Reload all Cursor tabs and redirect to dashboard
  async reloadCursorTabs() {
    const tabs = await chrome.tabs.query({
      url: ["https://*.cursor.com/*", "https://cursor.com/*"],
    });

    for (const tab of tabs) {
      // Redirect to dashboard instead of just reloading
      chrome.tabs.update(tab.id, { url: "https://cursor.com/dashboard" });
    }

    // If no cursor tabs are open, create a new one
    if (tabs.length === 0) {
      chrome.tabs.create({ url: "https://cursor.com/dashboard" });
    }
  }

  // Get earliest cookie expiry
  getEarliestExpiry(cookies) {
    const expiryDates = cookies
      .filter((cookie) => cookie.expirationDate)
      .map((cookie) => new Date(cookie.expirationDate * 1000));

    if (expiryDates.length === 0) return null;

    return new Date(Math.min(...expiryDates));
  }

  // Extract username from cookies or page
  async extractUsername() {
    const cookies = await this.getCurrentCookies();

    // Try to extract from cookie value (sesuai format di contoh)
    const sessionCookie = cookies.find(
      (c) => c.name === "WorkosCursorSessionToken"
    );
    if (sessionCookie) {
      // Extract user ID from cookie value
      const match = sessionCookie.value.match(/user_([A-Z0-9]+)/);
      if (match) {
        return match[1];
      }
    }

    // Fallback: use timestamp
    return `user_${Date.now()}`;
  }

  // Auto detect and save current account
  async autoDetectAccount() {
    const cookies = await this.getCurrentCookies();
    if (cookies.length === 0) return null;

    const username = await this.extractUsername();
    await this.upsert(username, cookies);

    return username;
  }

  // Generate random account name
  generateAccountName() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `account_${timestamp}_${random}`;
  }

  // Export account to file
  async exportAccountToFile(accountName) {
    const account = await this.find(accountName);
    if (!account) throw new Error("Account not found");

    const exportData = {
      version: "1.0",
      extension: "cursor-account-manager",
      exportDate: new Date().toISOString(),
      account: {
        name: account.name,
        email: account.email,
        status: account.status,
        cookies: account.cookies,
        expiresAt: account.expiresAt,
      },
    };

    const filename = `cursor_accounts/${account.email || account.name}.json`;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    // Create data URL
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onloadend = () => {
        const dataUrl = reader.result;

        // Use Chrome downloads API
        chrome.downloads.download(
          {
            url: dataUrl,
            filename: filename,
            saveAs: false,
          },
          (downloadId) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(downloadId);
            }
          }
        );
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Import account from JSON text
  async importAccountFromJSON(jsonText, customName = null) {
    try {
      const data = JSON.parse(jsonText);

      // Support both single cookie array and full export format
      let cookies, email, status, name;

      if (Array.isArray(data)) {
        // Direct cookie array
        cookies = data;
        name = customName || this.generateAccountName();
        email = name;
        status = "free";
      } else if (data.account) {
        // Full export format
        cookies = data.account.cookies;
        email = data.account.email || data.account.name;
        status = data.account.status || "free";
        name = customName || data.account.name || this.generateAccountName();
      } else {
        throw new Error("Invalid JSON format");
      }

      // Save account
      await this.upsert(name, cookies);
      await this.saveAccountInfo(name, email, status);

      // Export to file
      await this.exportAccountToFile(name);

      return name;
    } catch (error) {
      console.error("Import error:", error);
      throw error;
    }
  }
}

// Export instance
const accountService = new AccountService();

// For service worker context
if (typeof self !== "undefined") {
  self.accountService = accountService;
}
