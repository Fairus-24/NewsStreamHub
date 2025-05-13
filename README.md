
<h1 align="center">📰 NewsStreamHub</h1>
<p align="center">
  Platform berita modern dengan React + Node.js
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2.0-blue?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/Node.js-18.x-green?style=flat-square&logo=node.js" />
  <img src="https://img.shields.io/badge/Express.js-4.x-lightgrey?style=flat-square&logo=express" />
  <img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" />
</p>

---

## 🚀 Deskripsi Singkat

**NewsStreamHub** adalah aplikasi web berita yang menampilkan berita dari berbagai sumber secara real-time. Proyek ini dibangun dengan **React** di sisi frontend dan **Node.js/Express** sebagai backend server API.

---

## 📂 Struktur Proyek

```

NewsStreamHub/
├── client/       # Frontend React
│   ├── public/
│   └── src/
├── server/       # Backend Node.js/Express
│   └── routes/
│   └── app.js
├── README.md
└── package.json  # Root (optional - untuk dev tools)

````

---

## ⚙️ Instalasi & Menjalankan Proyek

### 1. Clone Repository
```bash
git clone https://github.com/Fairus-24/NewsStreamHub.git
cd NewsStreamHub
````

### 2. Install Dependensi

#### 🔹 Backend (Node.js)

```bash
cd server
npm install
```

#### 🔹 Frontend (React)

```bash
cd ../client
npm install
```

### 3. Jalankan Aplikasi

#### 🔹 Jalankan Backend

```bash
cd ../server
npm run dev
```

*Server berjalan di: `http://localhost:5000`*

#### 🔹 Jalankan Frontend

```bash
cd ../client
npm start
```

*Frontend React di: `http://localhost:3000`*

---

## 🔄 API Proxy (Agar React bisa akses backend)

Di `client/package.json`, pastikan ada baris berikut:

```json
"proxy": "http://localhost:5000"
```

---

## 🧪 Contoh API

`GET /api/news`
→ Mengembalikan daftar berita terbaru dari backend

---

## 📸 Tampilan (Screenshot)

> *(Tambahkan screenshot antarmuka aplikasi di sini jika ada)*

---

## 🙌 Kontribusi

Kontribusi terbuka! Silakan buat pull request atau buka issue.

---

## 📄 Lisensi

Distributed under the MIT License.
Lihat `LICENSE` untuk info lebih lanjut.

---

## 📫 Kontak

Fairus – [GitHub @Fairus-24](https://github.com/Fairus-24)

---

```

## 🔧 Catatan:
- Jika kamu menggunakan port, endpoint, atau struktur folder yang berbeda, saya bisa bantu ubah agar sesuai.
- Untuk membuat tampilannya lebih hidup, kamu bisa menambahkan **GIF demo**, **badge CI/CD**, atau **deploy link** (jika di-hosting).

Mau saya bantu generate versi README ini langsung jadi file `.md` atau tambah ikon/tampilan lainnya?
```
