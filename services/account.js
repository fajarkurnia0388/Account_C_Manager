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
      // Build URL properly
      let domain = cookie.domain;
      if (domain.startsWith(".")) {
        domain = domain.substring(1);
      }

      const cookieData = {
        url: `https://${domain}${cookie.path}`,
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite || "unspecified",
      };

      // Only add expiration if it exists and is valid
      if (cookie.expirationDate && cookie.expirationDate > 0) {
        cookieData.expirationDate = cookie.expirationDate;
      }

      try {
        await chrome.cookies.set(cookieData);
        console.log("Successfully set cookie:", cookie.name);
      } catch (error) {
        console.error("Failed to set cookie:", cookie.name, error);
        // Try without some problematic attributes
        try {
          const simpleCookieData = {
            url: `https://${domain}${cookie.path}`,
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path,
          };
          await chrome.cookies.set(simpleCookieData);
          console.log("Successfully set cookie with simple data:", cookie.name);
        } catch (simpleError) {
          console.error(
            "Failed to set cookie even with simple data:",
            cookie.name,
            simpleError
          );
        }
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
  async remove(accountName, deleteFile = false) {
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

    // Remove account info
    const accountInfo = await chrome.storage.local.get(this.ACCOUNT_INFO_KEY);
    const infoData = accountInfo[this.ACCOUNT_INFO_KEY] || {};
    delete infoData[accountName];
    await chrome.storage.local.set({
      [this.ACCOUNT_INFO_KEY]: infoData,
    });

    // Optionally delete the exported file
    if (deleteFile) {
      try {
        await this.deleteAccountFile(accountName);
      } catch (error) {
        console.warn("Could not delete account file:", error);
      }
    }

    // Remove download ID tracking
    const downloads = await chrome.storage.local.get("account_downloads");
    const downloadsData = downloads.account_downloads || {};
    delete downloadsData[accountName];
    await chrome.storage.local.set({
      account_downloads: downloadsData,
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

    // Check if this account already exists
    const duplicate = await this.findDuplicateAccount(cookies);
    if (duplicate) {
      console.log(
        `Current session matches existing account: ${duplicate.account.name}`
      );
      // Set existing account as active instead of creating new one
      await this.setActiveAccount(duplicate.account.name);
      return duplicate.account.name;
    }

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
              // Store download ID for later reveal
              this.saveDownloadId(account.name, downloadId);
              resolve(downloadId);
            }
          }
        );
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Save download ID for account
  async saveDownloadId(accountName, downloadId) {
    const downloads = await chrome.storage.local.get("account_downloads");
    const downloadsData = downloads.account_downloads || {};

    downloadsData[accountName] = downloadId;

    await chrome.storage.local.set({
      account_downloads: downloadsData,
    });
  }

  // Get download ID for account
  async getDownloadId(accountName) {
    const downloads = await chrome.storage.local.get("account_downloads");
    const downloadsData = downloads.account_downloads || {};
    return downloadsData[accountName] || null;
  }

  // Delete account file from Downloads
  async deleteAccountFile(accountName) {
    try {
      // Get account details for better search
      const account = await this.find(accountName);
      const searchTerms = [accountName];

      if (account && account.email && account.email !== accountName) {
        searchTerms.push(account.email);
      }

      const downloadId = await this.getDownloadId(accountName);
      if (downloadId) {
        try {
          // Try to remove using stored download ID
          await new Promise((resolve, reject) => {
            chrome.downloads.removeFile(downloadId, () => {
              if (chrome.runtime.lastError) {
                console.log(
                  "Could not remove by download ID, searching manually..."
                );
                resolve();
              } else {
                console.log("File deleted using download ID");
                resolve();
              }
            });
          });
          return true;
        } catch (error) {
          console.log("Stored download ID failed, searching manually...");
        }
      }

      // Try to find and delete file by searching downloads
      const downloads = await new Promise((resolve, reject) => {
        chrome.downloads.search(
          {
            query: ["cursor_accounts"],
            exists: true,
            limit: 100,
          },
          (results) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              // Filter results manually with multiple search terms
              const filtered = results.filter((item) => {
                const filename = item.filename.toLowerCase();
                return (
                  filename.includes("cursor_accounts") &&
                  filename.includes(".json") &&
                  searchTerms.some(
                    (term) =>
                      filename.includes(term.toLowerCase()) ||
                      filename.includes(term.replace("@", "").replace(".", ""))
                  )
                );
              });
              resolve(filtered);
            }
          }
        );
      });

      console.log(
        `Found ${downloads.length} matching files for deletion: ${accountName}`
      );

      if (downloads && downloads.length > 0) {
        // Delete all matching files
        let deletedCount = 0;
        for (const download of downloads) {
          try {
            await new Promise((resolve, reject) => {
              chrome.downloads.removeFile(download.id, () => {
                if (chrome.runtime.lastError) {
                  console.warn(
                    `Could not delete file: ${download.filename}`,
                    chrome.runtime.lastError
                  );
                  resolve();
                } else {
                  console.log(`Deleted file: ${download.filename}`);
                  deletedCount++;
                  resolve();
                }
              });
            });
          } catch (error) {
            console.warn(`Error deleting file ${download.filename}:`, error);
          }
        }

        return deletedCount > 0;
      }

      return false;
    } catch (error) {
      console.error("Error deleting account file:", error);
      return false;
    }
  }

  // Reveal account file in explorer
  async revealAccountFile(accountName) {
    try {
      // Get account details for better search
      const account = await this.find(accountName);
      const searchTerms = [accountName];

      if (account && account.email && account.email !== accountName) {
        searchTerms.push(account.email);
      }

      const downloadId = await this.getDownloadId(accountName);
      if (downloadId) {
        try {
          // Show file in folder using stored download ID
          chrome.downloads.show(downloadId);
          return true;
        } catch (error) {
          console.log("Stored download ID invalid, searching manually...");
        }
      }

      // Try to find file by searching downloads
      const downloads = await new Promise((resolve, reject) => {
        chrome.downloads.search(
          {
            query: ["cursor_accounts"],
            exists: true,
            limit: 100,
          },
          (results) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              // Filter results manually with multiple search terms
              const filtered = results.filter((item) => {
                const filename = item.filename.toLowerCase();
                return (
                  filename.includes("cursor_accounts") &&
                  filename.includes(".json") &&
                  searchTerms.some(
                    (term) =>
                      filename.includes(term.toLowerCase()) ||
                      filename.includes(term.replace("@", "").replace(".", ""))
                  )
                );
              });
              resolve(filtered);
            }
          }
        );
      });

      console.log(
        `Found ${downloads.length} matching files for account: ${accountName}`
      );

      if (downloads && downloads.length > 0) {
        // Show the most recent file
        const mostRecent = downloads.sort(
          (a, b) => new Date(b.startTime) - new Date(a.startTime)
        )[0];

        chrome.downloads.show(mostRecent.id);

        // Update stored download ID for future use
        await this.saveDownloadId(accountName, mostRecent.id);

        return true;
      }

      return false;
    } catch (error) {
      console.error("Error revealing file:", error);
      return false;
    }
  }

  // Check if account already exists by session token
  async findDuplicateAccount(cookies) {
    const newSessionToken = this.extractSessionToken(cookies);
    if (!newSessionToken) return null;

    // Check existing accounts in storage
    const existingAccounts = await this.getAll();
    for (const account of existingAccounts) {
      const existingToken = this.extractSessionToken(account.cookies);
      if (existingToken && existingToken === newSessionToken) {
        console.log(`Duplicate found in storage: ${account.name}`);
        return {
          source: "storage",
          account: account,
        };
      }
    }

    return null;
  }

  // Extract session token from cookies for duplicate detection
  extractSessionToken(cookies) {
    const sessionCookie = cookies.find(
      (c) => c.name === "WorkosCursorSessionToken" || c.name === "SessionToken"
    );
    return sessionCookie ? sessionCookie.value : null;
  }

  // Import account from JSON text with enhanced duplicate detection
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

      // Check for duplicates before importing
      const duplicate = await this.findDuplicateAccount(cookies);
      if (duplicate) {
        throw new Error(
          `Account already exists as: ${
            duplicate.account.email || duplicate.account.name
          }`
        );
      }

      // Save account
      await this.upsert(name, cookies);
      await this.saveAccountInfo(name, email, status);

      // Export to file (only if not already from file)
      if (!data.account) {
        await this.exportAccountToFile(name);
      }

      return name;
    } catch (error) {
      console.error("Import error:", error);
      throw error;
    }
  }

  // Scan Downloads folder for account files
  async scanDownloadsForAccounts() {
    try {
      // Request permission to access downloads
      const hasPermission = await new Promise((resolve) => {
        chrome.permissions.contains(
          {
            permissions: ["downloads"],
          },
          resolve
        );
      });

      if (!hasPermission) {
        console.log("Downloads permission not available");
        return [];
      }

      // Search for account files in Downloads/cursor_accounts/
      const downloads = await new Promise((resolve, reject) => {
        chrome.downloads.search(
          {
            filenameRegex: "cursor_accounts/.*\\.json$",
            exists: true,
          },
          (results) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(results);
            }
          }
        );
      });

      console.log("Found download files:", downloads.length);
      return downloads;
    } catch (error) {
      console.error("Error scanning downloads:", error);
      return [];
    }
  }

  // Load accounts from Downloads folder
  async loadAccountsFromDownloads() {
    try {
      const downloadFiles = await this.scanDownloadsForAccounts();
      let importedCount = 0;

      for (const file of downloadFiles) {
        try {
          // Read file content (this is limited by browser security)
          // We can only suggest to user to manually import these files
          console.log("Found account file:", file.filename);
        } catch (error) {
          console.error("Error reading file:", file.filename, error);
        }
      }

      return importedCount;
    } catch (error) {
      console.error("Error loading from downloads:", error);
      return 0;
    }
  }

  // Clear all extension data (for cleanup/reset)
  async clearAllData() {
    try {
      console.log("Clearing all extension data...");

      // Clear all local storage data
      await chrome.storage.local.clear();

      // Clear badge
      await chrome.action.setBadgeText({ text: "" });

      // Clear all Cursor cookies
      await this.clearCursorCookies();

      console.log("All extension data cleared successfully");
      return true;
    } catch (error) {
      console.error("Error clearing extension data:", error);
      return false;
    }
  }

  // Get all stored data (for debugging)
  async getAllStoredData() {
    try {
      const allData = await chrome.storage.local.get(null);
      console.log("All stored data:", allData);
      return allData;
    } catch (error) {
      console.error("Error getting stored data:", error);
      return {};
    }
  }

  // Find and consolidate duplicate accounts
  async consolidateDuplicates() {
    try {
      console.log("Starting duplicate consolidation...");
      const accounts = await this.getAll();
      const duplicateGroups = new Map();
      let consolidatedCount = 0;

      // Group accounts by session token
      for (const account of accounts) {
        const sessionToken = this.extractSessionToken(account.cookies);
        if (sessionToken) {
          if (!duplicateGroups.has(sessionToken)) {
            duplicateGroups.set(sessionToken, []);
          }
          duplicateGroups.get(sessionToken).push(account);
        }
      }

      // Process duplicate groups
      for (const [sessionToken, accountGroup] of duplicateGroups) {
        if (accountGroup.length > 1) {
          console.log(
            `Found ${
              accountGroup.length
            } duplicates for token: ${sessionToken.substring(0, 20)}...`
          );

          // Find the best account to keep (prefer one with email format)
          let keepAccount = accountGroup[0];
          for (const account of accountGroup) {
            if (
              account.email &&
              account.email.includes("@") &&
              account.email !== account.name
            ) {
              keepAccount = account;
              break;
            }
          }

          // Remove other duplicates (including files)
          for (const account of accountGroup) {
            if (account.name !== keepAccount.name) {
              console.log(
                `Removing duplicate: ${account.name} (keeping: ${keepAccount.name})`
              );
              await this.remove(account.name, true); // deleteFile = true
              consolidatedCount++;
            }
          }
        }
      }

      console.log(
        `Consolidation completed. Removed ${consolidatedCount} duplicate accounts.`
      );
      return { success: true, removed: consolidatedCount };
    } catch (error) {
      console.error("Error consolidating duplicates:", error);
      return { success: false, error: error.message };
    }
  }
}

// Export instance
const accountService = new AccountService();

// For service worker context
if (typeof self !== "undefined") {
  self.accountService = accountService;
}
