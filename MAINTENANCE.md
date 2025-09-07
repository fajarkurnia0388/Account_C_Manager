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

## 🔧 Fix Duplicate Accounts

### Automatic Consolidation (Recommended)

1. **Tekan `Ctrl + Shift + D`** untuk enable debug mode
2. **Klik "🔧 Fix Duplicates"**
3. **Konfirmasi** untuk merge duplicate accounts
4. **Extension akan keep account dengan email proper** dan hapus yang duplikat

### Manual Check

```javascript
// Console extension - check for duplicates:
chrome.runtime.sendMessage({ type: "consolidateDuplicates" }, (response) => {
  console.log("Duplicates fixed:", response.removed);
});
```

**Duplicate Detection Strategy:**

- ✅ **Same Session Token** = Same user account
- ✅ **Keep account with email@domain.com** format
- ✅ **Remove account_timestamp_random** pattern
- ✅ **Preserve account info** (email, status, cookies)

## 🚨 Warning Signs Data Perlu Dibersihkan

- Extension loading terus-menerus
- Account tidak switch dengan benar
- Error "Failed to set cookie"
- File reveal tidak bekerja
- Duplicate accounts muncul terus (sekarang bisa di-fix otomatis)

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

## 🗑️ Account Deletion Options

### User Choice pada Delete Account

Ketika menghapus account, user akan ditanya:

1. **First Confirmation**: `Delete account [name]?`
2. **Second Confirmation**:

   ```
   Also delete the backup file in Downloads/cursor_accounts/?

   ✅ YES: Delete both account and file
   ❌ NO: Keep file, delete account only

   Choose YES if you want complete removal.
   Choose NO if you want to keep the backup file.
   ```

### Behavior berdasarkan Pilihan

**YES (Complete Removal):**

- ✅ Delete account dari extension storage
- ✅ Delete avatar data
- ✅ Delete account info (email, status)
- ✅ Delete download ID tracking
- ✅ Delete backup file di Downloads/cursor_accounts/
- ✅ Clear badge jika active account

**NO (Keep Backup):**

- ✅ Delete account dari extension storage
- ✅ Delete avatar data
- ✅ Delete account info (email, status)
- ✅ Delete download ID tracking
- ✅ Clear badge jika active account
- ❌ **KEEP** backup file di Downloads/cursor_accounts/

### Automatic File Deletion

**🔧 Fix Duplicates** juga akan:

- ✅ Delete duplicate account files otomatis
- ✅ Keep hanya file dari account yang dipilih (yang dengan email proper)

**⚠️ IMPORTANT**: Backup account files sebelum clear data jika diperlukan!
