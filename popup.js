// Cursor Account Manager - Popup Script

class CursorAccountManager {
  constructor() {
    this.accounts = [];
    this.activeAccount = null;
    this.infoUpdated = false;
    this.init();
  }

  async init() {
    // Load accounts and active account
    await this.loadAccounts();

    // Setup event listeners
    this.setupEventListeners();

    // Update UI
    this.updateUI();
  }

  setupEventListeners() {
    // Add account button
    document.getElementById("addAccountBtn").addEventListener("click", () => {
      this.showAddAccountModal();
    });

    // Export current button
    document
      .getElementById("exportCurrentBtn")
      .addEventListener("click", () => {
        this.exportCurrentAccount();
      });

    // Refresh button
    document.getElementById("refreshBtn").addEventListener("click", () => {
      this.loadAccounts();
    });

    // Dark mode toggle
    document.getElementById("darkModeToggle").addEventListener("click", () => {
      this.toggleDarkMode();
    });

    // Modal controls
    document.getElementById("closeModal").addEventListener("click", () => {
      this.hideModal();
    });

    document.getElementById("cancelAddBtn").addEventListener("click", () => {
      this.hideModal();
    });

    document.getElementById("confirmAddBtn").addEventListener("click", () => {
      this.addAccountFromJSON();
    });
  }

  async loadAccounts() {
    try {
      this.showLoading(true);

      // Check if background script is ready
      const ping = await chrome.runtime
        .sendMessage({ type: "ping" })
        .catch(() => null);
      if (!ping) {
        console.error("Background script not responding");
        setTimeout(() => this.loadAccounts(), 500);
        return;
      }

      // Get accounts from background
      const response = await chrome.runtime.sendMessage({
        type: "getAccounts",
      });

      if (response && response.success) {
        this.accounts = response.data || [];

        // Get active account
        const activeResponse = await chrome.runtime.sendMessage({
          type: "getActiveAccount",
        });
        this.activeAccount = activeResponse?.data || null;

        // Try to update account info if needed
        if (this.activeAccount) {
          this.updateAccountInfo();
        }

        this.updateUI();
      } else {
        this.showNotification("Failed to load accounts", "error");
        this.accounts = [];
        this.updateUI();
      }
    } catch (error) {
      console.error("Error loading accounts:", error);
      this.showNotification("Extension error: Please reload", "error");
      this.accounts = [];
      this.updateUI();
    } finally {
      this.showLoading(false);
    }
  }

  async updateAccountInfo() {
    // Only update if we have an active account and it looks like a generated name
    if (this.activeAccount) {
      // Check if this account already has proper email info
      const currentAccount = this.accounts.find(
        (acc) => acc.name === this.activeAccount
      );

      // Skip if we already have a proper email (not the same as the account name)
      if (
        currentAccount &&
        currentAccount.email &&
        currentAccount.email !== this.activeAccount &&
        currentAccount.email.includes("@")
      ) {
        return; // Already has proper info, no need to update
      }

      try {
        const infoResponse = await chrome.runtime.sendMessage({
          type: "getAccountInfo",
        });

        if (infoResponse && infoResponse.success && infoResponse.data) {
          const { email, status } = infoResponse.data;
          // Only update if we got valid email
          if (email && email.includes("@")) {
            await chrome.runtime.sendMessage({
              type: "updateAccountInfo",
              account: this.activeAccount,
              email: email,
              status: status || "free",
            });
            // Reload to show updated info
            setTimeout(() => {
              this.infoUpdated = true; // Prevent loop
              this.loadAccounts();
            }, 500);
          }
        }
      } catch (error) {
        // Silently fail if we can't get account info
        console.log("Could not update account info:", error);
      }
    }
  }

  updateUI() {
    // Update current account display
    this.updateCurrentAccount();

    // Update accounts list
    this.updateAccountsList();

    // Update accounts count
    document.getElementById(
      "accountsCount"
    ).textContent = `(${this.accounts.length})`;
  }

  updateCurrentAccount() {
    const currentAccountEl = document.getElementById("currentAccount");
    const activeAccount = this.accounts.find((acc) => acc.active);

    if (activeAccount) {
      currentAccountEl.innerHTML = `
        <span class="account-icon">🟢</span>
        <span class="account-name">${this.escapeHtml(
          activeAccount.email
        )}</span>
      `;
    } else {
      currentAccountEl.innerHTML = `
        <span class="account-icon">🔴</span>
        <span class="account-name">Not logged in</span>
      `;
    }
  }

  updateAccountsList() {
    const listEl = document.getElementById("accountsList");
    const emptyEl = document.getElementById("noAccounts");

    if (this.accounts.length === 0) {
      listEl.style.display = "none";
      emptyEl.style.display = "block";
      return;
    }

    listEl.style.display = "block";
    emptyEl.style.display = "none";
    listEl.innerHTML = "";

    // Sort accounts - active first
    const sortedAccounts = [...this.accounts].sort((a, b) => {
      if (a.active) return -1;
      if (b.active) return 1;
      return a.email.localeCompare(b.email);
    });

    sortedAccounts.forEach((account) => {
      const accountEl = this.createAccountElement(account);
      listEl.appendChild(accountEl);
    });
  }

  createAccountElement(account) {
    const template = document.getElementById("accountTemplate");
    const element = template.content.cloneNode(true);
    const container = element.querySelector(".account-item");

    // Set account data
    container.dataset.account = account.name;

    // Set email
    container.querySelector(".account-email").textContent = account.email;

    // Set status
    const statusEl = container.querySelector(".account-status");
    statusEl.textContent = account.status;
    statusEl.className = `account-status ${account.status}`;

    // Hide expiry element - we don't need it anymore
    const expiryEl = container.querySelector(".account-expiry");
    expiryEl.style.display = "none";

    // Show/hide active indicator
    const activeIndicator = container.querySelector(".active-indicator");
    if (account.active) {
      activeIndicator.style.display = "block";
      container.classList.add("active");
    } else {
      activeIndicator.style.display = "none";

      // Make whole card clickable for switching
      container.addEventListener("click", (e) => {
        if (!e.target.closest(".delete-btn")) {
          this.switchAccount(account.name);
        }
      });
    }

    // Setup delete button
    container.querySelector(".delete-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      this.deleteAccount(account.name);
    });

    return container;
  }

  showAddAccountModal() {
    document.getElementById("addAccountModal").style.display = "block";
    document.getElementById("cookiesInput").value = "";
    document.getElementById("accountNameInput").value = "";
    document.getElementById("cookiesInput").focus();
  }

  hideModal() {
    document.getElementById("addAccountModal").style.display = "none";
  }

  async addAccountFromJSON() {
    const cookiesInput = document.getElementById("cookiesInput").value.trim();
    const accountName = document
      .getElementById("accountNameInput")
      .value.trim();

    if (!cookiesInput) {
      this.showNotification("Please paste cookies JSON", "error");
      return;
    }

    try {
      this.showLoading(true);

      // Validate JSON
      JSON.parse(cookiesInput);

      const response = await chrome.runtime.sendMessage({
        type: "importAccountJSON",
        jsonText: cookiesInput,
        customName: accountName || null,
      });

      if (response.success) {
        this.showNotification(`Added account: ${response.data}`, "success");
        this.hideModal();
        await this.loadAccounts();
      } else {
        this.showNotification(
          response.error || "Failed to add account",
          "error"
        );
      }
    } catch (error) {
      console.error("Error adding account:", error);
      this.showNotification("Invalid JSON format", "error");
    } finally {
      this.showLoading(false);
    }
  }

  async exportCurrentAccount() {
    if (!this.activeAccount) {
      this.showNotification("No active account to export", "error");
      return;
    }

    try {
      this.showLoading(true);

      const response = await chrome.runtime.sendMessage({
        type: "exportAccount",
        account: this.activeAccount,
      });

      if (response.success) {
        this.showNotification("Account exported to Downloads", "success");
      } else {
        this.showNotification(
          response.error || "Failed to export account",
          "error"
        );
      }
    } catch (error) {
      console.error("Error exporting account:", error);
      this.showNotification("Error exporting account", "error");
    } finally {
      this.showLoading(false);
    }
  }

  async switchAccount(accountName) {
    if (confirm(`Switch to account ${accountName}?`)) {
      try {
        this.showLoading(true);

        const response = await chrome.runtime.sendMessage({
          type: "switchAccount",
          account: accountName,
        });

        if (response.success) {
          this.showNotification(`Switched to ${accountName}`, "success");
          // Popup will close and page will reload
          setTimeout(() => window.close(), 1000);
        } else {
          this.showNotification(
            response.error || "Failed to switch account",
            "error"
          );
        }
      } catch (error) {
        console.error("Error switching account:", error);
        this.showNotification("Error switching account", "error");
      } finally {
        this.showLoading(false);
      }
    }
  }

  async deleteAccount(accountName) {
    if (!confirm(`Delete account ${accountName}?`)) {
      return;
    }

    try {
      this.showLoading(true);

      const response = await chrome.runtime.sendMessage({
        type: "removeAccount",
        account: accountName,
      });

      if (response.success) {
        this.showNotification(`Deleted account: ${accountName}`, "success");
        await this.loadAccounts();
      } else {
        this.showNotification(
          response.error || "Failed to delete account",
          "error"
        );
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      this.showNotification("Error deleting account", "error");
    } finally {
      this.showLoading(false);
    }
  }

  toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");

    // Save preference
    chrome.storage.local.set({ darkMode: isDark });

    // Update button
    document.getElementById("darkModeToggle").textContent = isDark
      ? "☀️"
      : "🌙";
  }

  showLoading(show) {
    const overlay = document.getElementById("loadingOverlay");
    if (show) {
      overlay.style.display = "flex";
      // Auto hide after 1 second to prevent stuck loading
      this.loadingTimeout = setTimeout(() => {
        overlay.style.display = "none";
      }, 1000);
    } else {
      overlay.style.display = "none";
      // Clear any existing timeout
      if (this.loadingTimeout) {
        clearTimeout(this.loadingTimeout);
      }
    }
  }

  showNotification(message, type = "info") {
    const notification = document.getElementById("notification");
    const text = document.getElementById("notificationText");

    text.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = "block";

    setTimeout(() => {
      notification.style.display = "none";
    }, 3000);
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Load dark mode preference
  chrome.storage.local.get(["darkMode"], (result) => {
    if (result.darkMode) {
      document.body.classList.add("dark-mode");
      document.getElementById("darkModeToggle").textContent = "☀️";
    }
  });

  // Initialize manager
  new CursorAccountManager();
});
