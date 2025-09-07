# Cursor Account Manager

Ekstensi Chrome yang memungkinkan Anda mengelola beberapa akun Cursor dan beralih di antaranya dengan mudah, mirip dengan GitHub Account Switcher.

## 🚀 Fitur

### Fitur Utama

- **👤 Dukungan Multi-Akun**: Simpan dan kelola akun Cursor tanpa batas
- **🔄 Perpindahan Sekali Klik**: Klik pada akun untuk langsung beralih
- **📋 Impor JSON**: Tambah akun dengan paste cookies JSON dari sumber apapun
- **💾 Ekspor Otomatis**: Semua akun disimpan ke folder Downloads/cursor_accounts/
- **📧 Deteksi Cerdas**: Otomatis mengambil email dan status langganan
- **🔐 Penyimpanan Aman**: Cookie disimpan lokal di penyimpanan aman Chrome

### Fitur Lanjutan

- **🌐 Integrasi Halaman**: Dropdown pemilih akun di halaman Cursor.com
- **🚦 Indikator Visual**: Akun aktif ditampilkan dengan indikator hijau dan badge
- **📊 Status Akun**: Menampilkan tipe langganan (Free/Pro/Business) dengan kode warna
- **🌓 Mode Gelap/Terang**: Deteksi tema otomatis dengan toggle manual
- **🔔 Notifikasi Cerdas**: Umpan balik non-intrusif untuk semua operasi
- **🎯 Update Cerdas**: Hanya update info akun saat diperlukan

## 📋 Cara Kerja

1. **Manajemen Cookie**: Menangkap dan menyimpan cookie sesi Cursor dengan aman
2. **Deteksi Cerdas**: Otomatis mengambil email dan info paket dari dashboard
3. **Perpindahan Instan**: Hapus sesi saat ini dan pulihkan cookie akun yang dipilih
4. **Ekspor Otomatis**: Simpan akun ke Downloads/cursor_accounts/ untuk backup
5. **Integrasi Halaman**: Injeksi pemilih akun ke Cursor.com untuk akses cepat

## 🛠️ Instalasi

1. Clone repositori ini atau unduh file ZIP
2. Buka Chrome dan navigasi ke `chrome://extensions/`
3. Aktifkan "Mode developer" di pojok kanan atas
4. Klik "Load unpacked" dan pilih direktori ekstensi
5. Ikon ekstensi akan muncul di toolbar Chrome Anda

## 📖 Penggunaan

### Menambahkan Akun

**Metode 1: Impor dari JSON**

1. Dapatkan cookies Cursor Anda (misal dari extension Cookie Editor)
2. Klik ikon ekstensi
3. Klik "Add Account"
4. Paste JSON cookies
5. Opsional berikan nama custom
6. Akun akan disimpan ke Downloads/cursor_accounts/

**Metode 2: Ekspor Sesi Saat Ini**

1. Login ke akun Cursor Anda
2. Klik ikon ekstensi
3. Klik "Export Current"
4. Akun akan disimpan ke Downloads/cursor_accounts/

### Beralih Akun

1. Klik ikon ekstensi
2. Cukup klik pada kartu akun untuk beralih
3. Halaman akan otomatis dimuat ulang dengan akun baru
4. Akun aktif ditandai dengan indikator "✓ Active"

### Menggunakan Integrasi Halaman

- Cari dropdown pemilih akun di header Cursor.com
- Klik untuk melihat semua akun tersimpan
- Beralih langsung dari halaman web

### Fitur Manajemen Akun

- **Desain Visual**: UI modern dan bersih dengan kartu akun menampilkan email dan status
- **Status Berkode Warna**: Free (biru), Pro (ungu), Business (hijau)
- **Indikator Aktif**: Titik hijau (🟢) menunjukkan akun yang sedang aktif
- **Klik untuk Beralih**: Cukup klik kartu akun untuk beralih instan
- **Backup Otomatis**: Semua akun otomatis disimpan ke Downloads/cursor_accounts/
- **Deteksi Duplikat**: Mencegah penambahan akun yang sama dua kali
- **Redirect Dashboard**: Otomatis redirect ke cursor.com/dashboard setelah beralih
- **Deteksi Kegagalan Switch**: Peringatan ketika perpindahan akun gagal karena konflik cookie
- **Pembersih Data Browser**: Akses satu-klik ke pengaturan clear data browser (mendukung Chrome, Edge, Brave, Opera)

## 🔧 Detail Teknis

### Izin yang Diperlukan

- `cookies`: Untuk membaca dan mengelola cookie Cursor.com
- `storage`: Untuk menyimpan data akun secara lokal
- `tabs`: Untuk memuat ulang tab setelah beralih
- `scripting` & `activeTab`: Untuk fungsionalitas content script
- `downloads`: Untuk menyimpan akun ke folder Downloads
- Izin host untuk semua URL (untuk manajemen cookie)

### Penyimpanan Data

- Akun disimpan di penyimpanan lokal Chrome
- Setiap akun mencakup:
  - Alamat email
  - Status langganan (Free/Pro/Business)
  - Cookie sesi
  - Nama otomatis atau custom
- Backup otomatis ke Downloads/cursor_accounts/

### Keamanan

- Cookie hanya diakses untuk domain cursor.com
- Tidak ada data yang dikirim ke server eksternal
- Semua penyimpanan lokal di browser Anda

## 🤝 Kontribusi

Kontribusi sangat diterima! Silakan kirim Pull Request.

## 📄 Lisensi

Proyek ini dilisensikan di bawah Lisensi MIT.

## 🙏 Penghargaan

Terinspirasi oleh ekstensi [GitHub Account Switcher](https://github.com/yuezk/github-account-switcher) dan [Cookie Editor](https://github.com/Moustachauve/cookie-editor).

---

**Catatan**: Ekstensi ini tidak berafiliasi dengan Cursor. Gunakan dengan risiko Anda sendiri.
