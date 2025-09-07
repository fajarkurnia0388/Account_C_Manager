# Cursor Account Manager

A Chrome extension that allows you to manage multiple Cursor accounts and switch between them seamlessly, similar to GitHub Account Switcher.

## 🚀 Features

### Core Features

- **👤 Multi-Account Support**: Save and manage unlimited Cursor accounts
- **🔄 One-Click Switching**: Click on any account to instantly switch
- **📋 JSON Import**: Add accounts by pasting cookies JSON from any source
- **💾 Auto Export**: All accounts saved to Downloads/cursor_accounts/ folder
- **📧 Smart Detection**: Automatically extracts email and subscription status
- **🔐 Secure Storage**: Cookies stored locally in Chrome's secure storage

### Advanced Features

- **🌐 Page Integration**: Account switcher dropdown on Cursor.com pages
- **🚦 Visual Indicators**: Active account shown with green indicator and badge
- **📊 Account Status**: Shows subscription type (Free/Pro/Business) with color coding
- **🌓 Dark/Light Mode**: Automatic theme detection with manual toggle
- **🔔 Smart Notifications**: Non-intrusive feedback for all operations
- **🎯 Intelligent Updates**: Only updates account info when necessary

## 📋 How It Works

1. **Cookie Management**: Captures and stores Cursor session cookies securely
2. **Smart Detection**: Automatically extracts email and plan info from dashboard
3. **Instant Switching**: Clears current session and restores selected account cookies
4. **Auto Export**: Saves accounts to Downloads/cursor_accounts/ for backup
5. **Page Integration**: Injects account switcher into Cursor.com for quick access

## 🛠️ Installation

1. Clone this repository or download the ZIP file
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The extension icon will appear in your Chrome toolbar

## 📖 Usage

### Adding an Account

**Method 1: Import from JSON**

1. Get your Cursor cookies (e.g., from Cookie Editor extension)
2. Click the extension icon
3. Click "Add Account"
4. Paste the cookies JSON
5. Optionally provide a custom name
6. Account will be saved to Downloads/cursor_accounts/

**Method 2: Export Current Session**

1. Log into your Cursor account
2. Click the extension icon
3. Click "Export Current"
4. Account will be saved to Downloads/cursor_accounts/

**Method 3: Import Files**

1. Click the extension icon
2. Click "Import Files"
3. Select one or multiple account files from Downloads/cursor_accounts/
4. Extension will import all valid accounts and skip duplicates

**Method 4: Import Entire Folder**

1. Click the extension icon
2. Click "Import Folder"
3. Select the Downloads/cursor_accounts/ folder
4. Extension will automatically import all JSON files in the folder

### Switching Accounts

1. Click the extension icon
2. Simply click on any account card to switch
3. The page will automatically reload with the new account
4. Active account is marked with "✓ Active" indicator

### Using the Page Integration

- Look for the account switcher dropdown in the Cursor.com header
- Click to see all saved accounts
- Switch directly from the webpage

### Account Management Features

- **Visual Design**: Clean, modern UI with account cards showing email and status
- **Color-Coded Status**: Free (blue), Pro (purple), Business (green)
- **Active Indicator**: Green dot (🟢) shows currently active account
- **Click to Switch**: Simply click any account card to switch instantly
- **Auto Backup**: All accounts automatically saved to Downloads/cursor_accounts/
- **Duplicate Detection**: Prevents adding the same account twice
- **Dashboard Redirect**: Automatically redirects to cursor.com/dashboard after switching
- **Switch Failure Detection**: Warns when account switching fails due to cookie conflicts
- **Browser Data Cleaner**: One-click access to browser's clear data settings (supports Chrome, Edge, Brave, Opera)

## 🔧 Technical Details

### Permissions Required

- `cookies`: To read and manage Cursor.com cookies
- `storage`: To save account data locally
- `tabs`: To reload tabs after switching
- `scripting` & `activeTab`: For content script functionality
- `downloads`: To save accounts to Downloads folder
- Host permissions for all URLs (for cookie management)

### Data Storage

- Accounts are stored in Chrome's local storage
- Each account includes:
  - Email address
  - Subscription status (Free/Pro/Business)
  - Session cookies
  - Auto-generated or custom name
- Automatic backup to Downloads/cursor_accounts/

### Security

- Cookies are only accessed for cursor.com domain
- No data is sent to external servers
- All storage is local to your browser

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

Inspired by [GitHub Account Switcher](https://github.com/yuezk/github-account-switcher) and [Cookie Editor](https://github.com/Moustachauve/cookie-editor) extensions.

---

**Note**: This extension is not affiliated with Cursor. Use at your own risk.
