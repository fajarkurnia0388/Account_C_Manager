# 🛠️ Cursor Account Manager - Maintenance Guide

## 🧹 Membersihkan Data Extension

### Menggunakan Debug Panel (Recommended)

1. **Buka Extension Popup**
2. **Tekan `Ctrl + Shift + D`** untuk enable debug mode
3. **Klik "🗑️ Clear All Data"**
4. **Konfirmasi 2x** untuk keamanan
5. **Extension akan direset** ke kondisi bersih

### Membersihkan Manual

#### 1. Clear Extension Storage

```javascript
// Buka Chrome DevTools di extension popup
// Console > jalankan:
chrome.storage.local.clear();
```

#### 2. Clear Cursor Cookies

1. Pergi ke `chrome://settings/cookies`
2. Cari "cursor.com"
3. Hapus semua cookies cursor.com

#### 3. Clear Downloads Folder

1. Buka `Downloads/cursor_accounts/`
2. Hapus semua file `.json` account

### 🔍 Debug Information

#### Melihat Data Tersimpan

1. **Tekan `Ctrl + Shift + D`** dalam popup
2. **Klik "📊 Show Stored Data"**
3. **Review semua data** yang tersimpan

#### Manual Storage Check

```javascript
// Console extension:
chrome.storage.local.get(null, (data) => {
  console.log("All stored data:", data);
});
```

## 🚨 Warning Signs Data Perlu Dibersihkan

- Extension loading terus-menerus
- Account tidak switch dengan benar
- Error "Failed to set cookie"
- File reveal tidak bekerja
- Duplicate accounts muncul terus

## 📋 Reset Checklist

- [ ] Clear extension storage (`chrome.storage.local.clear()`)
- [ ] Clear Cursor cookies (chrome://settings/cookies)
- [ ] Clear Downloads/cursor_accounts/ folder
- [ ] Restart browser
- [ ] Test extension dengan account baru

## 🔧 Troubleshooting

### Extension Stuck Loading

```bash
# Disable/Enable extension:
chrome://extensions/ > Toggle Off > Toggle On
```

### Badge Stuck/Wrong

```javascript
// Reset badge:
chrome.action.setBadgeText({ text: "" });
```

### Sidebar Not Working

1. Check Chrome version >= 114
2. Restart browser
3. Try `Ctrl + Shift + D` > Clear All Data

---

**⚠️ IMPORTANT**: Backup account files sebelum clear data jika diperlukan!
