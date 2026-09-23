# SiCheck OB & SPV — PWA Checklist Kebersihan

Aplikasi Progressive Web App (PWA) mobile-first untuk pencatatan checklist tugas harian Office Boy (OB) dan inspeksi / approval verifikasi oleh Supervisor (SPV) secara real-time berbasis Firebase Firestore.

## 🚀 Fitur Utama

### 1. Mode Petugas OB (Office Boy)
- **Pemilihan Shift & Tanggal**: Pagi, Siang, Sore, dan Malam.
- **Area Kerja Lengkap**: Toilet Lantai 1, Ruang Kantor, Ruang Meeting, Lobby & Resepsionis, Pantry & Dapur, Musholla, Tangga & Koridor, dan Halaman/Parkir.
- **Checklist Tugas SOP**: Tombol status *Bersih/Done*, *Kendala/Issue* (lengkap dengan input catatan kendala otomatis), dan *Tidak Perlu (N/A)*.
- **Fitur Cepat "Semua Bersih"**: Pengisian 1-klik untuk efisiensi waktu kerja.
- **Foto Bukti Pengerjaan**: Ambil foto kamera langsung atau galeri dengan kompresi otomatis ringan (<100KB per foto) + watermark tanggal dan jam.
- **Tanda Tangan Digital OB**: Paraf langsung di layar sentuh HP.
- **Pengiriman Real-time**: Data langsung terkirim ke panel Supervisor.

### 2. Mode Supervisor (SPV)
- **Dashboard Ringkasan Status**: Hitungan instan *Perlu Cek*, *Disetujui*, dan *Perlu Revisi*.
- **Inspeksi Detail**: Periksa setiap butir tugas, lihat foto bukti pengerjaan (klik untuk memperbesar), dan catatan kendala dari OB.
- **Evaluasi & Rating Kebersihan**: Skala 1 - 5 Bintang dengan indikator mutu kebersihan.
- **Catatan & Feedback SPV**: Masukan atau instruksi tindak lanjut untuk petugas.
- **Tanda Tangan Digital SPV**: Paraf verifikasi resmi di layar HP.
- **Tindakan Approval**: Tombol **Setujui & Approve** atau **Minta Revisi / Perbaikan**.

### 3. Progressive Web App (PWA) & Offline Ready
- Siap di-install ke layar utama HP (Android & iOS).
- Dilengkapi tombol instalasi in-app dan panduan khusus Safari iPhone.
- Dukungan offline storage: data tersimpan lokal jika jaringan terputus dan otomatis tersinkronisasi saat online kembali.

### 4. Rekap & Ekspor Laporan
- Filter laporan berdasarkan bulan.
- Ekspor rekap checklist ke file **CSV / Excel**.
- Format ramah cetak (**Print / Simpan ke PDF**).

---

## 🛠️ Deploy ke GitHub & Vercel

### 1. Upload ke GitHub
```bash
git init
git add .
git commit -m "feat: SiCheck OB & SPV PWA with Firebase"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git push -u origin main
```

### 2. Deploy ke Vercel
1. Buka [vercel.com](https://vercel.com) dan login dengan akun GitHub Anda.
2. Klik **Add New** > **Project**, lalu pilih repositori GitHub Anda.
3. Framework Preset: **Vite**.
4. Pengaturan konfigurasi SPA sudah otomatis tertangani oleh file `vercel.json`.
5. Klik **Deploy**! Aplikasi Anda langsung live dengan HTTPS dan fitur PWA aktif.
