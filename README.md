# ASTEMO - QUALITY DEVELOPMENT (Concept Prototype)

Prototipe interaktif sistem monitoring line welding berdasarkan desain Figma resmi **ASTEMO - QUALITY DEVELOPMENT**.

## Lokasi Project
```
D:\ADE\KERJAAN\PT. Electrindo Inti Dinamika\UIUX PROJECT\ASTEMO - QUALITY DEVELOPMENT\Concept Project
```

---

## Fitur & Halaman yang Dibangun:

### 1. Halaman Login
* **Desain Presisi**: Mengikuti frame `Login` (1920x1080) dengan background aksen poligonal dan logo resmi Astemo.
* **Akun Default**:
  1. `kevin_astemo` / `kevin12345`
  2. `suep_astemo` / `suep12345`
* **Validasi**: Border berubah menjadi merah disertai pesan error jika input kosong atau salah.
* **State Berhasil**: Menampilkan toast hijau *"Success - Direct to Dashboard..."* lalu otomatis redirect ke halaman utama.

### 2. Halaman Testing Process (Halaman Acuan Utama)
* **Parameter Input**: Pilihan Model, Speed (mm/min), Stroke (mm), dan Angle (deg).
* **Simulasi 3 Sesi Pengujian**:
  - Klik **Start** untuk menjalankan simulasi 3 sesi secara bertahap (*First Testing*, *Second Testing*, *Third Testing*).
  - Grafik kurva naik secara halus dan dinamis mengikuti kurva S di Figma.
  - Kartu realtime di bawah grafik (*Stroke, Load, Load Compression, Load Force, Friction Force*) ikut ter-update secara berkala hingga mencapai target pengujian.
* **Fitur Aksi Lengkap**:
  - **Reset**: Mengosongkan form, grafik, dan kartu realtime.
  - **Save Data**: Menyimpan hasil pengujian ke dalam riwayat *History Testing* lengkap dengan timestamp.
  - **Save Graph.**: Mengunduh grafik ke format gambar **PNG** beresolusi tinggi.
  - **Print Data**: Menampilkan tampilan cetak dokumen dan grafik pengujian.
  - **Export Excel**: Mengunduh file dokumen Excel asli (`.xlsx`) berisi parameter dan titik koordinat kurva pengujian.
* **Tombol History Testing**: Navigasi cepat ke daftar riwayat pengujian.

### 3. Halaman History Testing
* **Skeleton Loader**: Menampilkan placeholder skeleton saat pertama kali dibuka.
* **Filter & Pencarian**: Filter Model, Search nama/tanggal, dan Date Range.
* **Aksi Interaktif**:
  - **View (Ikon Mata Biru)**: Membuka modal popup detail pengujian, snapshot kartu parameter, serta grafik kurva.
  - **Download Excel (Ikon Hijau)**: Langsung mengunduh file spreadsheet `.xlsx` dari record tersebut.
* **Pagination**: Kontrol halaman dan pilihan jumlah entri per halaman.

### 4. Halaman User Management
* **Skeleton Loader**: Animasi skeleton saat pertama kali dibuka.
* **Add Data**: Modal popup *Add User Management* dengan input Username, pilihan Role, Password & Confirm Password (lengkap dengan toggle icon hide/unhide).
* **Reset Password**: Klik ikon reset di kolom password untuk membuka modal *Reset Password*.
* **Aksi Edit & Hapus**: Tombol edit kuning dan hapus merah dengan konfirmasi.

### 5. Halaman Role Management
* **Skeleton Loader**: Animasi skeleton saat pertama kali dibuka.
* **Add Data**: Modal popup *Add Role Management* dengan matriks hak akses (*Menu vs Permission: View, Create, Edit, Delete*) serta checkbox *Select All*.
* **Tampilan Tabel**: Daftar bullet point untuk setiap menu dan hak akses.

### 6. Halaman Master Data - Model
* **Skeleton Loader**: Animasi skeleton saat pertama kali dibuka.
* **Add Data**: Modal popup *Add Model* untuk input nama model baru.
* **Aksi Edit & Hapus**: Manipulasi data model yang langsung terhubung ke dropdown *Testing Process*.

---

## Cara Menjalankan Aplikasi:

### Cara 1 (Paling Mudah):
Cukup **double-click file `start.bat`** di dalam folder ini. Browser akan otomatis terbuka ke `http://localhost:3000`.

### Cara 2 (Terminal):
```bash
npm run dev
```
Buka browser di alamat `http://localhost:3000`.
