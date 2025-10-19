# Pencarian Solusi Penjadwalan Kelas Mingguan

Tugas Besar 1 IF3170 Inteligensi Artifisial 2025/2026  
Menyusun jadwal kelas mingguan menggunakan algoritma local search.

## Ringkasan

Repositori ini berisi implementasi lengkap backend (FastAPI) dan frontend (React + Vite) untuk:
- Memodelkan kelas, ruangan, dan mahasiswa beserta prioritas mata kuliah.
- Menghitung fungsi objektif gabungan (tabrakan jadwal mahasiswa, bentrok ruangan berbobot prioritas, dan pelanggaran kapasitas ruangan).
- Menjalankan beberapa algoritma local search:
  - Steepest Ascent Hill-Climbing.
  - Stochastic Hill-Climbing.
  - Hill-Climbing dengan batas sideways move.
  - Random Restart Hill-Climbing dengan batas restart dan iterasi per restart.
  - Simulated Annealing (parameter temperatur awal dan laju peluruhan).
  - Genetic Algorithm (parameter populasi, generasi maksimum, crossover, mutasi, turnamen, dan elitisme).
- Merekam seluruh metrik eksperimen (state awal/akhir, jejak objective, iterasi, durasi, statistik khusus algoritma) selama tiga percobaan per algoritma.
- Memvisualisasikan hasil melalui antarmuka web: grafik Recharts, tabel metrik, dan perbandingan jadwal awal vs akhir.

## Struktur Proyek

```
.
├── src/
│   ├── api/        # Layanan FastAPI + algoritma pencarian
│   └── web/        # Aplikasi web React + Vite
├── doc/            # Laporan PDF (lengkapi saat submission)
├── README.md
```

## Prasyarat

- Python 3.11+ dan [uv](https://github.com/astral-sh/uv) untuk manajemen dependensi backend.
- [Bun](https://bun.sh/) untuk dependensi dan dev server frontend.

## Menjalankan Backend (FastAPI)

```bash
cd src/api
uv sync               # instal dependensi (sekali saja)
uv run fastapi dev    # menjalankan server di http://localhost:8000
```

Endpoint utama:
- `POST /api/hill-climbing?variant=...`  
  Param opsional: `max_sideways`, `max_restart`, `max_iterations_per_restart`.
- `POST /api/sim-anneal?initial_temp=...&decay=...`
- `POST /api/genetic-algorithm?population_size=...&max_generations=...&crossover_rate=...&mutation_rate=...&tournament_k=...&elitism=...`

Tiap endpoint menerima payload JSON sesuai spesifikasi (kelas, ruangan, mahasiswa) dan akan menjalankan tiga percobaan, mengembalikan metrik lengkap untuk visualisasi.

## Menjalankan Frontend (React + Vite)

```bash
cd src/web
bun install    # instal dependensi
bun run dev    # jalankan dev server di http://localhost:5173
```

Fitur antarmuka:
- Pemilihan algoritma dan parameter masing-masing.
- Eksekusi solver (memanggil backend) dan penyimpanan hasil historis.
- Visualisasi Recharts: objective vs iterasi/generasi, temperatur, exp(-Δ/T).
- Tabel metrik ringkas dan detail (sideways moves, restart, stuck count, dsb).
- Tabel jadwal awal vs akhir per ruangan.

## Pembagian Tugas

- 13522125 – Hill Climbing Algorithms, Website, Laporan
- 13522128 – Genetic Algorithm, Website, Laporan
- 13523063 – Simulated annealing, Website, Laporan
