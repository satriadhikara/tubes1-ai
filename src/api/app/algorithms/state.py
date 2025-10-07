from dataclasses import dataclass
import random
import time


## Output object
@dataclass
class Slot:
    kode_ruangan: str
    waktu_mulai: tuple[str, int]
    waktu_akhir: tuple[str, int]

@dataclass
class JadwalKuliah:
    slot_kuliah: dict[str, list[Slot]]

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
    kuota: int

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
        kode_kelas_mk = dict()  # Dictionary untuk validasi jumlah mahasiswa
        for kelas in self.list_kelas:
            if kelas.kode in kode_kelas_mk:
                raise ValueError(f"Terdapat duplikat kode kelas {kelas.kode}")
            kode_kelas_mk[kelas.kode] = kelas.jumlah_mahasiswa
            if kelas.sks<1:
                raise ValueError(f"SKS kelas {kelas.kode} tidak lebih dari nol")
            if kelas.jumlah_mahasiswa<1:
                raise ValueError(f"Jumlah mahasiswa pada kelas {kelas.kode} tidak lebih dari nol")
    
        kode_ruangan_set = set()
        for ruangan in self.list_ruangan:
            kode_ruangan_set.add(ruangan.kode)
            if ruangan.kuota<0:
                raise ValueError("Kapasitas ruangan negatif")
        if len(kode_ruangan_set)!=len(self.list_ruangan):
            raise ValueError("Terdapat kode ruangan duplikat")
        
        for mahasiswa in self.list_kuliah_mahasiswa:
            # Validasi prioritas 1..n
            n = len(mahasiswa.prio_mata_kuliah)
            for prio, kode_mk in mahasiswa.prio_mata_kuliah.items():
                if prio<1 or prio>n:
                    raise ValueError(f"Mahasiswa NIM {mahasiswa.nim} memiliki nomor prioritas invalid ({prio})")
                if kode_mk not in kode_kelas_mk:
                    raise ValueError(f"Mahasiswa NIM {mahasiswa.nim} memiliki kode mata kuliah invalid ({kode_mk})")
                kode_kelas_mk[kode_mk]-=1
        
        for kode_kelas, jumlah_mahasiswa in kode_kelas_mk.items():
            if jumlah_mahasiswa!=0:
                raise ValueError(f"Kode kelas {kode_kelas} memiliki jumlah mahasiswa invalid")

    # Untuk setiap kelas kelas, random ruangan
    # Waktu kuliah diacak perjam. Jika n sks, terbentuk n waktu kuliah, belum tentu berurut tetapi tidak overlap
    def seed_jadwal(self):
        kuliah_dict = dict()
        list_kode_ruangan = [ruangan.kode for ruangan in self.list_ruangan]

        for kelas in self.list_kelas:
            slot_list = []
            waktu_mulai = []
            for _ in range(kelas.sks):
                waktu = (self.random.choice(LIST_HARI), self.random.randint(MULAI_WAKTU_KULIAH, AKHIR_WAKTU_KULIAH-1))
                while waktu in waktu_mulai:
                    waktu = (self.random.choice(LIST_HARI), self.random.randint(MULAI_WAKTU_KULIAH, AKHIR_WAKTU_KULIAH-1))
                waktu_mulai.append(waktu)

                slot = Slot(
                    kode_ruangan=self.random.choice(list_kode_ruangan),
                    waktu_mulai=waktu,
                    waktu_akhir=(waktu[0], waktu[1]+1)
                )
                slot_list.append(slot)
            kuliah_dict[kelas.kode] = slot_list
        
        self.output_jadwal = JadwalKuliah(kuliah_dict)
        
    def objective(self) -> float:
        # TODO
        return 0
            