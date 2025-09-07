# Account Manager v2.0 🍪

Advanced Chrome extension for **cookie management** with modern UI and comprehensive features to save, import, export, edit, and apply cookies in JSON format.

[Baca README ini dalam Bahasa Indonesia](README_IN.md)

## ✨ Main Features

### 🎯 Core Features

- **Extract cookies** from current domain or all tabs at once
- **Apply cookies** to browser with one click
- **Cookie editor** with complete modal interface for individual cookie editing
- **Bulk operations** to select and operate multiple cookies simultaneously
- **Search & filter** cookies by name, domain, or value with real-time results

### 🔍 Advanced Filtering & Search

- **Real-time search** with highlighting in name, domain, and value
- **Domain-based filtering** with dynamic dropdown
- **Type-based filtering**: Session, Persistent, Secure, HTTP-Only
- **Multi-criteria sorting**: by name, domain, or creation date
- **Clear filters** to reset all filters with one click

### 📊 Modern UI/UX

- **Dark/Light mode** toggle with smooth animations
- **Responsive design** with elegant gradients and shadows
- **Real-time statistics bar** (total cookies, selected, domains)
- **Visual badges** for cookie attributes (Secure, HTTP-Only, Session, SameSite)
- **Loading states** and progress indicators
- **Activity log** with timestamps for tracking all operations
- **Empty states** with informative illustrations

### 📁 Advanced Import/Export

- **Multiple export formats**: JSON and CSV
- **Flexible export options**:
  - Selected items only
  - All items
  - By Domain (per-domain files)
  - CSV format for data analysis
- **Smart import** with automatic duplicate detection
- **File validation** to ensure correct JSON format

### 🛠️ Bulk Operations

- **Multi-select** with checkboxes
- **Select all/none** for visible items
- **Bulk apply** - apply multiple cookies at once
- **Bulk export** - export selected cookies to one file
- **Bulk delete** with confirmation dialog
- **Selection counter** and visual feedback

### 🛡️ Enhanced Cookie Management

- **Automatic duplicate detection** during import/extract
- **Cookie validation** to ensure correct format
- **Real-time stats** for monitoring cookie counts
- **Confirmation dialogs** for destructive operations (delete)
- **Expandable cookie details** with complete information
- **Metadata tracking** (created, modified, imported timestamps)

## 🚀 Installation Instructions

1. **Download/Clone** all extension files to a local folder
2. Open Chrome and type `chrome://extensions` in address bar
3. Enable **Developer mode** (toggle in top right corner)
4. Click **Load unpacked** and select folder containing extension files
5. Extension will appear in Chrome toolbar

## 🚀 Usage Guide

### 📥 Extract Cookies from Website

#### Extract Single Domain

1. Open website you want to extract cookies from
2. Click extension icon in Chrome toolbar
3. Click **"Extract Current"** to get cookies from current domain
4. Cookies will be added to list with automatic duplicate detection

#### Extract All Tabs

1. Click **"Extract All Tabs"** to get cookies from all open tabs
2. Extension will process all domains from active tabs
3. Progress will be shown in activity log

### 🎯 Apply Cookies to Website

#### Single Cookie

1. Search for cookie you want to apply using search box
2. Click **Play (▶️)** icon on cookie item
3. Cookie will be set in browser for corresponding domain
4. Status will appear in activity log

#### Bulk Apply

1. Select multiple cookies using checkboxes
2. Click **"Apply All"** in bulk actions bar
3. All selected cookies will be applied simultaneously

### 🔍 Search & Filter Cookies

#### Real-time Search

- Use search box to search by:
  - Cookie name
  - Domain
  - Cookie value
- Results displayed in real-time

#### Advanced Filtering

- **Domain Filter**: Dropdown with all available domains
- **Type Filter**: Session, Persistent, Secure, HTTP-Only
- **Sort**: Click Sort button to cycle through sort options
- **Clear Filters**: Reset all filters with one click

### ✏️ Edit Individual Cookie

1. Click **Edit (✏️)** icon on cookie item
2. Editor modal will open with all fields:
   - Name, Value, Domain, Path
   - Expiration Date, Same Site setting
   - Checkboxes: Secure, HTTP-Only, Session, Host-Only
3. Click **"Save Changes"** to save

### 📁 Advanced Import/Export

#### Import Options

- **JSON Import**: Support single object or array of objects
- **Automatic Duplicate Detection**: Skip cookies that already exist
- **File Validation**: Validate format before import

#### Export Options

- **Selected Items**: Export only selected cookies
- **All Items**: Export all cookies
- **By Domain**: Export separately per domain
- **CSV Format**: Export in CSV format for data analysis

### 🛠️ Bulk Operations

1. **Select Items**: Click checkboxes on cookies you want to operate on
2. **Select All**: Click "Select All" to select all visible items
3. **Bulk Actions** (appears when items are selected):
   - **Apply All**: Apply all selected cookies
   - **Export**: Export selected cookies to file
   - **Delete**: Delete selected cookies (with confirmation)
   - **Clear Selection**: Cancel all selections

## 📄 Cookie JSON Format

Example cookie format used:

```json
{
  "domain": "example.com",
  "expirationDate": 1762401571.001188,
  "hostOnly": true,
  "httpOnly": true,
  "name": "session_token",
  "path": "/",
  "sameSite": "lax",
  "secure": true,
  "session": false,
  "storeId": null,
  "value": "abc123xyz"
}
```

## 🎨 Additional UI/UX Features

### 🌙 Dark Mode

- Toggle dark/light mode in header
- Automatic icon update (moon/sun)
- Smooth color transitions
- Settings saved automatically

### 📊 Real-time Statistics

- **Total Count**: Total number of stored cookies
- **Selected Count**: Number of selected cookies
- **Domains Count**: Number of unique domains
- Automatic updates when changes occur

### 🏷️ Visual Badges

Each cookie displays badges for attributes:

- **🔒 Secure**: Secure-only cookies
- **🌐 HTTP**: HTTP-Only cookies
- **⏱️ Session**: Session cookies
- **🔗 SameSite**: SameSite policy (Strict/Lax/None)

### 📱 Responsive Design

- **Width**: 480px for comfortable viewing
- **Scrollable sections** for handling large data
- **Smooth animations** and transitions
- **Loading overlays** for visual feedback

## 📁 File Structure v2.0

```
cookie-manager-gem-v2/
├── manifest.json          # Extension config (Manifest V3)
├── popup.html             # Modern UI with modal & components
├── popup.js               # Advanced JavaScript class-based architecture
├── style.css              # Modern CSS with variables & animations
├── background.js          # Minimal service worker
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon64.png
│   └── icon128.png
├── README.md              # Documentation (English)
└── README_IN.md           # Documentation (Bahasa Indonesia)
```

## 🔧 Technical Improvements

### Architecture

- **Class-based JavaScript**: Using ES6 Classes for better organization
- **Event-driven design**: Efficient event handling and memory management
- **Modular CSS**: CSS variables for theming and maintainability
- **Async/await**: Modern JavaScript for better promise handling

### Performance

- **Efficient rendering**: Virtual scrolling for large datasets
- **Debounced search**: Optimized search with debouncing
- **Memory management**: Proper cleanup and garbage collection
- **Lazy loading**: Components loaded on demand

### Data Management

- **Smart caching**: Efficient storage and retrieval
- **Data validation**: Input validation on all forms
- **Error handling**: Comprehensive error handling with user feedback
- **State management**: Centralized state for consistency

## ⚠️ Important Notes

**Ethics & Security Warning**:

- Use this extension only for **educational/testing purposes** in lab (VM/CTF/sandbox)
- Only use on domains you **own or have permission** for
- Injecting cookies on third-party domains without permission may violate laws

## 🔧 Technical Limitations

- `chrome.cookies.set` requires `url` parameter - code builds URL from `domain` and `path`
- `hostOnly` cannot be set directly; to make host-only, `domain` property is removed
- `sameSite` mapping depends on browser support
- `secure` cookies require HTTPS
- `expirationDate` format in UNIX timestamp (seconds)

## 📜 License

For educational and testing purposes. Use responsibly.
