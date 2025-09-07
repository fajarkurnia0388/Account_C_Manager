# Account Manager v2.0 🍪

Extension Chrome **canggih** untuk manajemen cookie dengan UI modern dan fitur lengkap untuk menyimpan, mengimpor, mengekspor, mengedit, dan menerapkan cookie dalam format JSON.

[Read this README in English](README.md)

## ✨ Fitur Utama

### 🎯 Core Features

- **Extract cookies** dari domain saat ini atau semua tab sekaligus
- **Apply cookies** ke browser dengan sekali klik
- **Cookie editor** lengkap dengan modal interface untuk edit individual cookies
- **Bulk operations** untuk memilih dan mengoperasikan multiple cookies sekaligus
- **Search & filter** cookies berdasarkan nama, domain, atau nilai dengan real-time

### 🔍 Advanced Filtering & Search

- **Real-time search** dengan highlight di nama, domain, dan nilai
- **Filter berdasarkan domain** dengan dropdown dinamis
- **Filter berdasarkan tipe**: Session, Persistent, Secure, HTTP-Only
- **Multi-criteria sorting**: berdasarkan nama, domain, atau tanggal pembuatan
- **Clear filters** untuk reset semua filter dengan sekali klik

### 📊 UI/UX Modern

- **Dark/Light mode** toggle dengan animasi smooth
- **Responsive design** dengan gradien dan shadow yang elegan
- **Statistics bar** real-time (total cookies, selected, domains)
- **Visual badges** untuk cookie attributes (Secure, HTTP-Only, Session, SameSite)
- **Loading states** dan progress indicators
- **Activity log** dengan timestamp untuk tracking semua operasi
- **Empty states** dengan ilustrasi yang informatif

### 📁 Import/Export Advanced

- **Multiple export formats**: JSON dan CSV
- **Export options fleksibel**:
  - Selected items only
  - All items
  - By Domain (per-domain files)
  - CSV format untuk analisis data
- **Smart import** dengan automatic duplicate detection
- **File validation** untuk memastikan format JSON yang benar

### 🛠️ Bulk Operations

- **Multi-select** dengan checkboxes
- **Select all/none** untuk visible items
- **Bulk apply** - terapkan multiple cookies sekaligus
- **Bulk export** - export selected cookies dalam satu file
- **Bulk delete** dengan confirmation dialog
- **Selection counter** dan visual feedback

### 🛡️ Cookie Management Enhanced

- **Duplicate detection** otomatis saat import/extract
- **Cookie validation** untuk memastikan format yang benar
- **Real-time stats** untuk monitoring jumlah cookies
- **Confirmation dialogs** untuk operasi destructive (delete)
- **Cookie details** expandable dengan informasi lengkap
- **Metadata tracking** (created, modified, imported timestamps)

## Cara Instalasi

1. **Download/Clone** semua file extension ini ke folder lokal
2. Buka Chrome dan ketik `chrome://extensions` di address bar
3. Aktifkan **Developer mode** (toggle di pojok kanan atas)
4. Klik **Load unpacked** dan pilih folder yang berisi file extension ini
5. Extension akan muncul di toolbar Chrome

## 🚀 Cara Penggunaan

### 📥 Ekstrak Cookie dari Website

#### Extract Single Domain

1. Buka website yang ingin diekstrak cookienya
2. Klik ikon extension di toolbar Chrome
3. Klik **"Extract Current"** untuk mengambil cookies dari domain saat ini
4. Cookies akan ditambahkan ke daftar dengan automatic duplicate detection

#### Extract All Tabs

1. Klik **"Extract All Tabs"** untuk mengambil cookies dari semua tab yang terbuka
2. Extension akan memproses semua domain dari tab yang aktif
3. Progress akan ditampilkan di activity log

### 🎯 Menerapkan Cookie ke Website

#### Single Cookie

1. Cari cookie yang ingin diterapkan menggunakan search box
2. Klik ikon **Play (▶️)** pada cookie item
3. Cookie akan di-set di browser untuk domain yang sesuai
4. Status akan muncul di activity log

#### Bulk Apply

1. Pilih multiple cookies menggunakan checkbox
2. Klik **"Apply All"** di bulk actions bar
3. Semua selected cookies akan diterapkan sekaligus

### 🔍 Search & Filter Cookies

#### Real-time Search

- Gunakan search box untuk mencari berdasarkan:
  - Nama cookie
  - Domain
  - Nilai cookie
- Hasil ditampilkan secara real-time

#### Advanced Filtering

- **Domain Filter**: Dropdown dengan semua domain yang tersedia
- **Type Filter**: Session, Persistent, Secure, HTTP-Only
- **Sort**: Klik tombol Sort untuk cycling through sort options
- **Clear Filters**: Reset semua filter dengan satu klik

### ✏️ Edit Cookie Individual

1. Klik ikon **Edit (✏️)** pada cookie item
2. Modal editor akan terbuka dengan semua field:
   - Name, Value, Domain, Path
   - Expiration Date, Same Site setting
   - Checkboxes: Secure, HTTP-Only, Session, Host-Only
3. Klik **"Save Changes"** untuk menyimpan

### 📁 Import/Export Advanced

#### Import Options

- **JSON Import**: Support single object atau array of objects
- **Automatic Duplicate Detection**: Skip cookies yang sudah ada
- **File Validation**: Validasi format sebelum import

#### Export Options

- **Selected Items**: Export cookies yang dipilih saja
- **All Items**: Export semua cookies
- **By Domain**: Export terpisah per domain
- **CSV Format**: Export dalam format CSV untuk analisis data

### 🛠️ Bulk Operations

1. **Select Items**: Klik checkbox pada cookies yang ingin dioperasikan
2. **Select All**: Klik "Select All" untuk memilih semua visible items
3. **Bulk Actions** (muncul ketika ada selection):
   - **Apply All**: Terapkan semua selected cookies
   - **Export**: Export selected cookies ke file
   - **Delete**: Hapus selected cookies (dengan confirmation)
   - **Clear Selection**: Batalkan semua seleksi

## Format JSON Cookie

Contoh format cookie yang digunakan:

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

## 🎨 Fitur UI/UX Tambahan

### 🌙 Dark Mode

- Toggle dark/light mode di header
- Automatic icon update (moon/sun)
- Smooth color transitions
- Settings tersimpan otomatis

### 📊 Real-time Statistics

- **Total Count**: Jumlah total cookies yang tersimpan
- **Selected Count**: Jumlah cookies yang dipilih
- **Domains Count**: Jumlah domain unik
- Update otomatis saat ada perubahan

### 🏷️ Visual Badges

Setiap cookie menampilkan badges untuk attributes:

- **🔒 Secure**: Cookie secure only
- **🌐 HTTP**: HTTP-Only cookies
- **⏱️ Session**: Session cookies
- **🔗 SameSite**: SameSite policy (Strict/Lax/None)

### 📱 Responsive Design

- **Width**: 480px untuk kenyamanan viewing
- **Scrollable sections** untuk handling data besar
- **Smooth animations** dan transitions
- **Loading overlays** untuk feedback visual

## 📁 File Structure v2.0

```
cookie-manager-gem-v2/
├── manifest.json          # Extension config (Manifest V3)
├── popup.html             # Modern UI with modal & components
├── popup.js               # Advanced JavaScript class-based architecture
├── style.css              # Modern CSS with variables & animations
├── background.js          # Minimal service worker
├── icons/                 # Extension icons
│   └── icon64.png
├── README.md              # Documentation (Bahasa Indonesia)
└── README_EN.md           # Documentation (English)
```

## 🔧 Technical Improvements

### Architecture

- **Class-based JavaScript**: Menggunakan ES6 Classes untuk better organization
- **Event-driven design**: Efficient event handling dan memory management
- **Modular CSS**: CSS variables untuk theming dan maintainability
- **Async/await**: Modern JavaScript untuk better promise handling

### Performance

- **Efficient rendering**: Virtual scrolling untuk large datasets
- **Debounced search**: Optimized search dengan debouncing
- **Memory management**: Proper cleanup dan garbage collection
- **Lazy loading**: Components loaded on demand

### Data Management

- **Smart caching**: Efficient storage dan retrieval
- **Data validation**: Input validation pada semua forms
- **Error handling**: Comprehensive error handling dengan user feedback
- **State management**: Centralized state untuk consistency

## Catatan Penting

⚠️ **Peringatan Etika & Keamanan**:

- Gunakan extension ini hanya untuk tujuan **edukasi/pengujian** di lab (VM/CTF/sandbox)
- Hanya gunakan pada domain yang kamu **miliki atau memiliki izin**
- Menyuntikkan cookie pada domain pihak ketiga tanpa izin bisa melanggar hukum

## Keterbatasan Teknis

- `chrome.cookies.set` membutuhkan parameter `url` - kode membangun URL dari `domain` dan `path`
- `hostOnly` tidak dapat diset langsung; untuk membuat host-only, properti `domain` dihilangkan
- `sameSite` mapping tergantung dukungan browser
- Cookie `secure` memerlukan HTTPS
- Format `expirationDate` dalam UNIX timestamp (seconds)

## Lisensi

Untuk tujuan edukasi dan pengujian. Gunakan dengan bertanggung jawab.
}
