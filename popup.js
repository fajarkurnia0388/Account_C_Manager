// Account Manager v2.0
// Advanced cookie management extension

class CookieManager {
  constructor() {
    this.itemsKey = "cookie_items_v2";
    this.settingsKey = "cookie_manager_settings";
    this.items = [];
    this.filteredItems = [];
    this.selectedItems = new Set();
    this.currentSort = { field: "name", direction: "asc" };
    this.currentEditIndex = -1;

    this.init();
  }

  async init() {
    try {
      await this.loadSettings();
      await this.loadItems();
      this.bindEvents();
      this.updateUI();
    } catch (error) {
      console.error("Error during initialization:", error);
      throw error;
    }
  }

  // Settings & Theme Management
  async loadSettings() {
    const settings = (await this.getStorageData(this.settingsKey)) || {};
    this.settings = {
      darkMode: false,
      autoRefresh: false,
      confirmDelete: true,
      showDetails: false,
      ...settings,
    };

    if (this.settings.darkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
      this.updateDarkModeIcon();
    }
  }

  async saveSettings() {
    await this.setStorageData(this.settingsKey, this.settings);
  }

  toggleDarkMode() {
    this.settings.darkMode = !this.settings.darkMode;
    document.documentElement.setAttribute(
      "data-theme",
      this.settings.darkMode ? "dark" : "light"
    );
    this.updateDarkModeIcon();
    this.saveSettings();
  }

  updateDarkModeIcon() {
    const iconBtn = document.querySelector("#darkModeToggle");
    iconBtn.textContent = this.settings.darkMode ? "☀️" : "🌙";
  }

  // Storage helpers
  async getStorageData(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => resolve(result[key]));
    });
  }

  async setStorageData(key, data) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: data }, resolve);
    });
  }

  // Items management
  async loadItems() {
    this.items = (await this.getStorageData(this.itemsKey)) || [];
    this.applyFilters();
  }

  async saveItems() {
    await this.setStorageData(this.itemsKey, this.items);
    this.updateStats();
  }

  // Event binding
  bindEvents() {
    // Header actions
    document
      .getElementById("darkModeToggle")
      .addEventListener("click", () => this.toggleDarkMode());
    document
      .getElementById("settingsBtn")
      .addEventListener("click", () => this.showSettings());

    // Main controls
    document
      .getElementById("extractBtn")
      .addEventListener("click", () => this.extractCurrentDomain());
    document
      .getElementById("extractAllBtn")
      .addEventListener("click", () => this.extractAllTabs());
    document
      .getElementById("importBtn")
      .addEventListener("click", () => this.importItems());

    // Export dropdown
    document
      .getElementById("exportDropdown")
      .addEventListener("click", () => this.toggleDropdown("exportDropdown"));
    document
      .getElementById("exportSelected")
      .addEventListener("click", () => this.exportItems("selected"));
    document
      .getElementById("exportAll")
      .addEventListener("click", () => this.exportItems("all"));
    document
      .getElementById("exportByDomain")
      .addEventListener("click", () => this.exportItems("byDomain"));
    document
      .getElementById("exportCSV")
      .addEventListener("click", () => this.exportCSV());

    // Search and filters
    document
      .getElementById("searchInput")
      .addEventListener("input", (e) => this.handleSearch(e.target.value));
    document
      .getElementById("clearSearch")
      .addEventListener("click", () => this.clearSearch());
    document
      .getElementById("domainFilter")
      .addEventListener("change", () => this.applyFilters());
    document
      .getElementById("typeFilter")
      .addEventListener("change", () => this.applyFilters());
    document
      .getElementById("clearFilters")
      .addEventListener("click", () => this.clearFilters());

    // List actions
    document
      .getElementById("selectAllBtn")
      .addEventListener("click", () => this.toggleSelectAll());
    document
      .getElementById("sortBtn")
      .addEventListener("click", () => this.showSortOptions());

    // Bulk actions
    document
      .getElementById("bulkUse")
      .addEventListener("click", () => this.bulkApply());
    document
      .getElementById("bulkExport")
      .addEventListener("click", () => this.exportItems("selected"));
    document
      .getElementById("bulkDelete")
      .addEventListener("click", () => this.bulkDelete());
    document
      .getElementById("bulkClear")
      .addEventListener("click", () => this.clearSelection());

    // File inputs
    document
      .getElementById("jsonInput")
      .addEventListener("change", (e) => this.handleFileImport(e));

    // Modal events
    document
      .querySelector(".modal-close")
      .addEventListener("click", () => this.closeModal());
    document
      .querySelector(".modal-cancel")
      .addEventListener("click", () => this.closeModal());
    document
      .getElementById("saveEdit")
      .addEventListener("click", () => this.saveEdit());

    // Log controls
    document
      .getElementById("clearLog")
      .addEventListener("click", () => this.clearLog());

    // Click outside to close dropdowns
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".dropdown")) {
        this.closeAllDropdowns();
      }
    });
  }

  // UI Updates with debouncing to prevent constant reflow
  updateUI() {
    if (this._isUpdating) return;
    this._isUpdating = true;

    requestAnimationFrame(() => {
      this.renderItems();
      this.updateStats();
      this.updateFilters();
      this.updateBulkActions();
      this._isUpdating = false;
    });
  }

  updateStats() {
    const domains = [...new Set(this.items.map((item) => item.domain))];
    const totalEl = document.getElementById("totalCount");
    const selectedEl = document.getElementById("selectedCount");
    const domainsEl = document.getElementById("domainsCount");

    // Only update if values have changed to prevent unnecessary reflow
    if (totalEl.textContent !== this.items.length.toString()) {
      totalEl.textContent = this.items.length;
    }
    if (selectedEl.textContent !== this.selectedItems.size.toString()) {
      selectedEl.textContent = this.selectedItems.size;
    }
    if (domainsEl.textContent !== domains.length.toString()) {
      domainsEl.textContent = domains.length;
    }
  }

  updateFilters() {
    const domainFilter = document.getElementById("domainFilter");
    const currentValue = domainFilter.value;

    // Clear existing options except first
    domainFilter.innerHTML = '<option value="">All Domains</option>';

    const domains = [...new Set(this.items.map((item) => item.domain))].sort();
    domains.forEach((domain) => {
      const option = document.createElement("option");
      option.value = domain;
      option.textContent = domain;
      domainFilter.appendChild(option);
    });

    domainFilter.value = currentValue;
  }

  updateBulkActions() {
    const bulkActions = document.getElementById("bulkActions");
    const bulkCount = document.getElementById("bulkCount");

    if (this.selectedItems.size > 0) {
      bulkActions.style.display = "flex";
      bulkCount.textContent = this.selectedItems.size;
    } else {
      bulkActions.style.display = "none";
    }
  }

  // Search and Filter
  handleSearch(query) {
    this.searchQuery = query.toLowerCase();
    this.applyFilters();
  }

  clearSearch() {
    document.getElementById("searchInput").value = "";
    this.searchQuery = "";
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.items];

    // Apply search
    if (this.searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.name?.toLowerCase().includes(this.searchQuery) ||
          item.domain?.toLowerCase().includes(this.searchQuery) ||
          item.value?.toLowerCase().includes(this.searchQuery)
      );
    }

    // Apply domain filter
    const domainFilter = document.getElementById("domainFilter").value;
    if (domainFilter) {
      filtered = filtered.filter((item) => item.domain === domainFilter);
    }

    // Apply type filter
    const typeFilter = document.getElementById("typeFilter").value;
    if (typeFilter) {
      switch (typeFilter) {
        case "session":
          filtered = filtered.filter((item) => item.session);
          break;
        case "persistent":
          filtered = filtered.filter((item) => !item.session);
          break;
        case "secure":
          filtered = filtered.filter((item) => item.secure);
          break;
        case "httponly":
          filtered = filtered.filter((item) => item.httpOnly);
          break;
      }
    }

    this.filteredItems = filtered;
    this.renderItems();
  }

  clearFilters() {
    document.getElementById("searchInput").value = "";
    document.getElementById("domainFilter").value = "";
    document.getElementById("typeFilter").value = "";
    this.searchQuery = "";
    this.applyFilters();
  }

  // Rendering
  renderItems() {
    if (this._isRendering) return;
    this._isRendering = true;

    const container = document.getElementById("itemsList");
    const emptyState = document.getElementById("emptyState");

    if (this.filteredItems.length === 0) {
      container.style.display = "none";
      emptyState.style.display = "block";
      this._isRendering = false;
      return;
    }

    container.style.display = "block";
    emptyState.style.display = "none";

    // Use DocumentFragment to minimize reflows
    const fragment = document.createDocumentFragment();

    this.filteredItems.forEach((item, index) => {
      const originalIndex = this.items.indexOf(item);
      const element = this.createItemElement(item, originalIndex);
      fragment.appendChild(element);
    });

    container.innerHTML = "";
    container.appendChild(fragment);
    this._isRendering = false;
  }

  createItemElement(item, index) {
    const template = document.getElementById("itemTemplate");
    const element = template.content.cloneNode(true);
    const container = element.querySelector(".cookie-item");

    container.dataset.index = index;

    // Main info
    element.querySelector(".cookie-name").textContent =
      item.name || `<unnamed-${index}>`;
    element.querySelector(".cookie-domain").textContent =
      item.domain || "no-domain";

    // Badges
    const badgesContainer = element.querySelector(".cookie-badges");
    badgesContainer.innerHTML = "";

    if (item.secure) {
      badgesContainer.appendChild(this.createBadge("Secure", "badge-secure"));
    }
    if (item.httpOnly) {
      badgesContainer.appendChild(this.createBadge("HTTP", "badge-httponly"));
    }
    if (item.session) {
      badgesContainer.appendChild(this.createBadge("Session", "badge-session"));
    }
    if (item.sameSite && item.sameSite !== "unspecified") {
      badgesContainer.appendChild(
        this.createBadge(item.sameSite, "badge-samesite")
      );
    }

    // Details
    element.querySelector(".cookie-value").textContent = this.truncateText(
      item.value,
      50
    );
    element.querySelector(".cookie-path").textContent = item.path || "/";
    element.querySelector(".cookie-expires").textContent =
      this.formatExpiry(item);
    element.querySelector(".cookie-samesite").textContent =
      item.sameSite || "unspecified";

    // Checkbox
    const checkbox = element.querySelector(".item-checkbox");
    checkbox.checked = this.selectedItems.has(index);
    checkbox.addEventListener("change", () => this.toggleSelection(index));

    // Action buttons
    element.querySelector(".useBtn").addEventListener("click", (e) => {
      e.stopPropagation();
      this.useItem(index);
    });
    element.querySelector(".editBtn").addEventListener("click", (e) => {
      e.stopPropagation();
      this.editItem(index);
    });
    element.querySelector(".exportBtn").addEventListener("click", (e) => {
      e.stopPropagation();
      this.exportItem(index);
    });
    element.querySelector(".deleteBtn").addEventListener("click", (e) => {
      e.stopPropagation();
      this.deleteItem(index);
    });

    // Click to expand/collapse details
    const header = element.querySelector(".cookie-header");
    const details = element.querySelector(".cookie-details");
    header.addEventListener("click", () => {
      const isVisible = details.style.display !== "none";
      details.style.display = isVisible ? "none" : "block";
    });

    // Selection styling
    if (this.selectedItems.has(index)) {
      container.classList.add("selected");
    }

    return element;
  }

  createBadge(text, className) {
    const badge = document.createElement("span");
    badge.className = `badge ${className}`;
    badge.textContent = text;
    return badge;
  }

  truncateText(text, maxLength) {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  }

  formatExpiry(item) {
    if (item.session) return "Session";
    if (!item.expirationDate) return "Never";

    const date = new Date(item.expirationDate * 1000);
    return date.toLocaleDateString();
  }

  // Selection management
  toggleSelection(index) {
    if (this.selectedItems.has(index)) {
      this.selectedItems.delete(index);
    } else {
      this.selectedItems.add(index);
    }
    this.updateBulkActions();
    this.updateStats();
    // Don't re-render items, just update selection styling
    this.updateSelectionStyling();
  }

  updateSelectionStyling() {
    document.querySelectorAll(".cookie-item").forEach((item, idx) => {
      const itemIndex = parseInt(item.dataset.index);
      if (this.selectedItems.has(itemIndex)) {
        item.classList.add("selected");
      } else {
        item.classList.remove("selected");
      }
    });
  }

  toggleSelectAll() {
    const visibleIndexes = this.filteredItems.map((item) =>
      this.items.indexOf(item)
    );
    const allSelected = visibleIndexes.every((index) =>
      this.selectedItems.has(index)
    );

    if (allSelected) {
      visibleIndexes.forEach((index) => this.selectedItems.delete(index));
    } else {
      visibleIndexes.forEach((index) => this.selectedItems.add(index));
    }

    this.updateBulkActions();
    this.updateStats();
    this.updateSelectionStyling();
  }

  clearSelection() {
    this.selectedItems.clear();
    this.updateBulkActions();
    this.updateStats();
    this.updateSelectionStyling();
  }

  // Cookie operations
  async extractCurrentDomain() {
    this.showLoading();
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab?.url) {
        this.log("No active tab or URL found");
        return;
      }

      const url = new URL(tab.url);
      const domain = url.hostname;

      const cookies = await this.getCookiesForDomain(domain);
      const addedCount = await this.addCookies(cookies);

      this.log(`Extracted ${addedCount} cookies from ${domain}`);
      await this.loadItems();
      this.updateUI();
    } catch (error) {
      this.log(`Error extracting cookies: ${error.message}`);
    } finally {
      this.hideLoading();
    }
  }

  async extractAllTabs() {
    this.showLoading();
    try {
      const tabs = await chrome.tabs.query({});
      let totalCount = 0;

      for (const tab of tabs) {
        if (tab.url) {
          try {
            const url = new URL(tab.url);
            const cookies = await this.getCookiesForDomain(url.hostname);
            totalCount += await this.addCookies(cookies);
          } catch (e) {
            // Skip invalid URLs
          }
        }
      }

      this.log(`Extracted ${totalCount} cookies from ${tabs.length} tabs`);
      await this.loadItems();
      this.updateUI();
    } catch (error) {
      this.log(`Error extracting from all tabs: ${error.message}`);
    } finally {
      this.hideLoading();
    }
  }

  async getCookiesForDomain(domain) {
    return new Promise((resolve) => {
      chrome.cookies.getAll({ domain }, resolve);
    });
  }

  async addCookies(cookies) {
    let addedCount = 0;
    for (const cookie of cookies) {
      // Check for duplicates
      const exists = this.items.some(
        (item) =>
          item.name === cookie.name &&
          item.domain === cookie.domain &&
          item.path === cookie.path
      );

      if (!exists) {
        const item = {
          domain: cookie.domain,
          expirationDate: cookie.expirationDate || null,
          hostOnly: !!cookie.hostOnly,
          httpOnly: !!cookie.httpOnly,
          name: cookie.name,
          path: cookie.path,
          sameSite: cookie.sameSite || "unspecified",
          secure: !!cookie.secure,
          session: !!cookie.session,
          storeId: cookie.storeId || null,
          value: cookie.value,
          createdAt: Date.now(),
        };
        this.items.push(item);
        addedCount++;
      }
    }

    if (addedCount > 0) {
      await this.saveItems();
    }

    return addedCount;
  }

  async useItem(index) {
    const item = this.items[index];
    if (!item) return;

    try {
      await this.setCookieFromItem(item);
      this.log(`Applied cookie "${item.name}" on domain ${item.domain}`);
    } catch (error) {
      this.log(`Error setting cookie: ${error.message}`);
    }
  }

  async setCookieFromItem(item) {
    const protocol = item.secure ? "https://" : "http://";
    const domainForUrl = item.domain ? item.domain.replace(/^\./, "") : "";
    const url = protocol + domainForUrl + (item.path || "/");

    const details = {
      url: url,
      name: item.name,
      value: item.value || "",
      path: item.path || "/",
      httpOnly: !!item.httpOnly,
      secure: !!item.secure,
      sameSite: item.sameSite || "unspecified",
    };

    if (item.domain) details.domain = item.domain;
    if (!item.session && item.expirationDate) {
      details.expirationDate = Math.floor(item.expirationDate);
    }
    if (item.hostOnly) {
      delete details.domain;
    }

    return new Promise((resolve, reject) => {
      chrome.cookies.set(details, (cookie) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(cookie);
        }
      });
    });
  }

  // Bulk operations
  async bulkApply() {
    if (this.selectedItems.size === 0) return;

    this.showLoading();
    let successCount = 0;

    for (const index of this.selectedItems) {
      try {
        await this.useItem(index);
        successCount++;
      } catch (error) {
        console.error("Error applying cookie:", error);
      }
    }

    this.log(
      `Applied ${successCount}/${this.selectedItems.size} selected cookies`
    );
    this.hideLoading();
  }

  async bulkDelete() {
    if (this.selectedItems.size === 0) return;

    if (this.settings.confirmDelete) {
      if (!confirm(`Delete ${this.selectedItems.size} selected cookies?`)) {
        return;
      }
    }

    const sortedIndexes = [...this.selectedItems].sort((a, b) => b - a);
    for (const index of sortedIndexes) {
      this.items.splice(index, 1);
    }

    await this.saveItems();
    this.selectedItems.clear();
    this.log(`Deleted ${sortedIndexes.length} cookies`);
    await this.loadItems();
    this.updateUI();
  }

  // Item management
  async deleteItem(index) {
    if (this.settings.confirmDelete) {
      const item = this.items[index];
      if (!confirm(`Delete cookie "${item.name}"?`)) {
        return;
      }
    }

    const item = this.items.splice(index, 1)[0];
    await this.saveItems();
    this.selectedItems.delete(index);

    // Adjust selected indexes
    const newSelected = new Set();
    for (const selectedIndex of this.selectedItems) {
      if (selectedIndex > index) {
        newSelected.add(selectedIndex - 1);
      } else {
        newSelected.add(selectedIndex);
      }
    }
    this.selectedItems = newSelected;

    this.log(`Deleted cookie "${item.name}"`);
    await this.loadItems();
    this.updateUI();
  }

  editItem(index) {
    this.currentEditIndex = index;
    const item = this.items[index];

    // Populate form
    document.getElementById("editName").value = item.name || "";
    document.getElementById("editValue").value = item.value || "";
    document.getElementById("editDomain").value = item.domain || "";
    document.getElementById("editPath").value = item.path || "/";
    document.getElementById("editExpires").value = item.expirationDate || "";
    document.getElementById("editSameSite").value =
      item.sameSite || "unspecified";
    document.getElementById("editSecure").checked = !!item.secure;
    document.getElementById("editHttpOnly").checked = !!item.httpOnly;
    document.getElementById("editSession").checked = !!item.session;
    document.getElementById("editHostOnly").checked = !!item.hostOnly;

    this.showModal();
  }

  async saveEdit() {
    if (this.currentEditIndex < 0) return;

    const item = this.items[this.currentEditIndex];

    // Update item
    item.name = document.getElementById("editName").value;
    item.value = document.getElementById("editValue").value;
    item.domain = document.getElementById("editDomain").value;
    item.path = document.getElementById("editPath").value;
    item.expirationDate =
      parseFloat(document.getElementById("editExpires").value) || null;
    item.sameSite = document.getElementById("editSameSite").value;
    item.secure = document.getElementById("editSecure").checked;
    item.httpOnly = document.getElementById("editHttpOnly").checked;
    item.session = document.getElementById("editSession").checked;
    item.hostOnly = document.getElementById("editHostOnly").checked;
    item.modifiedAt = Date.now();

    await this.saveItems();
    this.log(`Updated cookie "${item.name}"`);
    await this.loadItems();
    this.updateUI();
    this.closeModal();
  }

  // Import/Export
  importItems() {
    document.getElementById("jsonInput").click();
  }

  async handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      let importedCount = 0;
      const itemsToImport = Array.isArray(parsed) ? parsed : [parsed];

      for (const item of itemsToImport) {
        if (this.isValidCookieItem(item)) {
          // Check for duplicates
          const exists = this.items.some(
            (existing) =>
              existing.name === item.name &&
              existing.domain === item.domain &&
              existing.path === item.path
          );

          if (!exists) {
            item.importedAt = Date.now();
            this.items.push(item);
            importedCount++;
          }
        }
      }

      if (importedCount > 0) {
        await this.saveItems();
        await this.loadItems();
        this.updateUI();
      }

      this.log(`Imported ${importedCount} cookies from ${file.name}`);
    } catch (error) {
      this.log(`Import failed: ${error.message}`);
    }

    event.target.value = "";
  }

  isValidCookieItem(item) {
    return item && typeof item === "object" && item.name && item.domain;
  }

  async exportItems(type) {
    let itemsToExport = [];
    let filename = "cookies";

    switch (type) {
      case "selected":
        itemsToExport = [...this.selectedItems].map(
          (index) => this.items[index]
        );
        filename = "selected_cookies";
        break;
      case "all":
        itemsToExport = this.items;
        filename = "all_cookies";
        break;
      case "byDomain":
        // Group by domain and export separately
        const domains = [...new Set(this.items.map((item) => item.domain))];
        for (const domain of domains) {
          const domainItems = this.items.filter(
            (item) => item.domain === domain
          );
          this.downloadJSON(domainItems, `${domain}_cookies`);
        }
        this.log(`Exported cookies for ${domains.length} domains`);
        return;
    }

    if (itemsToExport.length === 0) {
      this.log("No cookies to export");
      return;
    }

    this.downloadJSON(itemsToExport, filename);
    this.log(`Exported ${itemsToExport.length} cookies`);
  }

  async exportItem(index) {
    const item = this.items[index];
    this.downloadJSON(item, `cookie_${item.name}`);
    this.log(`Exported cookie "${item.name}"`);
  }

  async exportCSV() {
    if (this.items.length === 0) {
      this.log("No cookies to export");
      return;
    }

    const headers = [
      "name",
      "value",
      "domain",
      "path",
      "secure",
      "httpOnly",
      "session",
      "sameSite",
      "expirationDate",
    ];
    const csvContent = [
      headers.join(","),
      ...this.items.map((item) =>
        headers
          .map((header) => {
            const value = item[header];
            return typeof value === "string" && value.includes(",")
              ? `"${value}"`
              : value;
          })
          .join(",")
      ),
    ].join("\n");

    this.downloadFile(csvContent, "cookies.csv", "text/csv");
    this.log(`Exported ${this.items.length} cookies as CSV`);
  }

  downloadJSON(data, filename) {
    const jsonString = JSON.stringify(data, null, 2);
    this.downloadFile(jsonString, `${filename}.json`, "application/json");
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // UI helpers
  showLoading() {
    document.getElementById("loadingOverlay").style.display = "flex";
  }

  hideLoading() {
    document.getElementById("loadingOverlay").style.display = "none";
  }

  showModal() {
    document.getElementById("cookieEditor").style.display = "flex";
  }

  closeModal() {
    document.getElementById("cookieEditor").style.display = "none";
    this.currentEditIndex = -1;
  }

  toggleDropdown(id) {
    const dropdown = document.getElementById(id).closest(".dropdown");
    dropdown.classList.toggle("open");
  }

  closeAllDropdowns() {
    document.querySelectorAll(".dropdown").forEach((dropdown) => {
      dropdown.classList.remove("open");
    });
  }

  // Logging
  log(message) {
    const logElement = document.getElementById("log");
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}\n`;
    logElement.textContent = logEntry + logElement.textContent;

    // Keep only last 100 entries
    const lines = logElement.textContent.split("\n");
    if (lines.length > 100) {
      logElement.textContent = lines.slice(0, 100).join("\n");
    }
  }

  clearLog() {
    document.getElementById("log").textContent = "";
  }

  // Settings and advanced features
  showSettings() {
    // This could open a separate settings modal
    this.log("Settings panel - Coming soon!");
  }

  showSortOptions() {
    // Cycle through sort options
    const sortOptions = [
      { field: "name", direction: "asc" },
      { field: "name", direction: "desc" },
      { field: "domain", direction: "asc" },
      { field: "domain", direction: "desc" },
      { field: "createdAt", direction: "desc" },
      { field: "createdAt", direction: "asc" },
    ];

    const currentIndex = sortOptions.findIndex(
      (opt) =>
        opt.field === this.currentSort.field &&
        opt.direction === this.currentSort.direction
    );

    const nextIndex = (currentIndex + 1) % sortOptions.length;
    this.currentSort = sortOptions[nextIndex];

    this.sortItems();
    this.log(
      `Sorted by ${this.currentSort.field} (${this.currentSort.direction})`
    );
  }

  sortItems() {
    this.items.sort((a, b) => {
      const field = this.currentSort.field;
      const direction = this.currentSort.direction;

      let aVal = a[field];
      let bVal = b[field];

      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });

    this.applyFilters();
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  try {
    new CookieManager();
  } catch (error) {
    console.error("Failed to initialize Cookie Manager:", error);
  }
});
