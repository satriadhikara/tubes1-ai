from dataclasses import dataclass
import random
import time


## Output object
@dataclass
class PosisiKuliah:
    kode_ruangan: str
    waktu_mulai: tuple[str, int]

@dataclass
class JadwalKuliah:
    posisi_kuliah: dict[str, list[PosisiKuliah]]

## Constraint
LIST_HARI = [
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
]
# Kuliah mulai paling awal pukul 7 dan selesai paling akhir 18
MULAI_WAKTU_KULIAH = 7
AKHIR_WAKTU_KULIAH = 18

## Input object
@dataclass
class KelasMataKuliah:
    kode: str
    jumlah_mahasiswa: int
    sks: int

@dataclass
class Ruangan:
    kode: str
    kapasitas: int

@dataclass
class KuliahMahasiswa:
    nim: str
    prio_mata_kuliah: dict[int, str]    # Key: nomor prioritas, Value: Kode kelas mata kuliah


class State:
    def __init__(self, list_kelas: list[KelasMataKuliah] =[], list_ruangan: list[Ruangan] =[], list_kuliah_mahasiswa: list[KuliahMahasiswa] =[], seed: int =int(time.time()*1000)):
        self.random = random.Random(seed)
        self.list_kelas = list_kelas
        self.list_ruangan = list_ruangan
        self.list_kuliah_mahasiswa = list_kuliah_mahasiswa
        self.output_jadwal: JadwalKuliah  = dict()    # For initial seeding, call self.seed_waktu_kuliah()

    # Throw ValueError on invalid input state. Call immediately before algorithm start
    def validate(self):
        kode_kelas_mk_set = set()
        for kelas in self.list_kelas:
            kode_kelas_mk_set.add(kelas.kode)
            if kelas.sks<1:
                raise ValueError("SKS tidak lebih dari nol")
            if kelas.jumlah_mahasiswa<1:
                raise ValueError("Jumlah mahasiswa tidak lebih dari nol")
        if len(kode_kelas_mk_set)!=len(self.list_kelas):
            raise ValueError("Terdapat kode kelas mata kuliah duplikat")
    
        kode_ruangan_set = set()
        for ruangan in self.list_ruangan:
            kode_ruangan_set.add(ruangan.kode)
            if ruangan.kapasitas<0:
                raise ValueError("Kapasitas ruangan negatif")
        if len(kode_ruangan_set)!=len(self.list_ruangan):
            raise ValueError("Terdapat kode ruangan duplikat")
        
        for mahasiswa in self.list_kuliah_mahasiswa:
            for kuliah in self.list_kuliah_mahasiswa:
                # Validasi prioritas 1..n
                n = len(kuliah.prio_mata_kuliah)
                for prio, kode_mk in kuliah.prio_mata_kuliah.items():
                    if prio<1 or prio>n:
                        raise ValueError(f"Mahasiswa NIM {mahasiswa.nim} memiliki nomor prioritas invalid ({prio})")
                    if kode_mk not in kode_kelas_mk_set:
                        raise ValueError(f"Mahasiswa NIM {mahasiswa.nim} memiliki kode mata kuliah invalid ({kode_mk})")


    # Untuk setiap kelas kelas, random ruangan
    # Waktu kuliah diacak perjam. Jika n sks, terbentuk n waktu kuliah, belum tentu berurut tetapi tidak overlap
    def seed_jadwal(self):
        posisi_dict = dict()
        list_kode_ruangan = [ruangan.kode for ruangan in self.list_ruangan]

        for kelas in self.list_kelas:
            posisi_list = []
            waktu_mulai = []
            for _ in range(kelas.sks):
                waktu = (self.random.choice(LIST_HARI), self.random.randint(MULAI_WAKTU_KULIAH, AKHIR_WAKTU_KULIAH-1))
                while waktu in waktu_mulai:
                    waktu = (self.random.choice(LIST_HARI), self.random.randint(MULAI_WAKTU_KULIAH, AKHIR_WAKTU_KULIAH-1))
                waktu_mulai.append(waktu)

                posisi = PosisiKuliah(
                    kode_ruangan=self.random.choice(list_kode_ruangan),
                    waktu_mulai=waktu,
                )
                posisi_list.append(posisi)
            posisi_dict[kelas.kode] = posisi_list
        
        self.output_jadwal = JadwalKuliah(posisi_kuliah=posisi_dict)
        
    def objective(self) -> float:
        # TODO
        return 0
            