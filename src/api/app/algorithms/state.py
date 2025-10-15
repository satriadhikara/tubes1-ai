from dataclasses import dataclass
import time
import random

## Output object
@dataclass(frozen=True)
class Slot:
    kode_ruangan: str
    hari: str
    waktu_mulai: int
    waktu_akhir: int

@dataclass
class JadwalKuliah:
    slot_kuliah: dict[str, list[Slot]]  # Banyaknya slot tiap kuliah == bobot sks

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
LIST_WAKTU_MULAI: list[tuple[str, int]] = [
    (hari, j)
    for hari in LIST_HARI
    for j in range(MULAI_WAKTU_KULIAH, AKHIR_WAKTU_KULIAH)
]

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


class Problem:
    def __init__(self, list_kelas: list[KelasMataKuliah], list_ruangan: list[Ruangan] =[], list_kuliah_mahasiswa: list[KuliahMahasiswa] =[]):
        self.list_kelas = list_kelas
        self.list_ruangan = list_ruangan
        self.list_kuliah_mahasiswa = list_kuliah_mahasiswa

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

class State:
    def __init__(self, problem: Problem, jadwal = JadwalKuliah({}), randomizer = random.Random(int(time.time()*1000))):
        self.problem = problem
        self.jadwal = jadwal    # For initial seeding, call self.seed_waktu_kuliah()
        self.random = randomizer

        # Attributes for calculating objective function
        self.timetable_mahasiswa = {slot: 0 for slot in LIST_WAKTU_MULAI}
        self.kuota_ruangan = {ruangan.kode:ruangan.kuota for ruangan in self.problem.list_ruangan}
    
    # Untuk setiap kelas kelas, random ruangan
    # Waktu kuliah diacak perjam. Jika n sks, terbentuk n waktu kuliah, belum tentu berurut tapi kelas tidak akan overlap dengan kelas itu sendiri
    def seed_jadwal(self):
        kuliah_dict = dict()
        list_kode_ruangan = [ruangan.kode for ruangan in self.problem.list_ruangan]

        for kelas in self.problem.list_kelas:
            ruang_kelas = self.random.choices(list_kode_ruangan, k=kelas.sks)
            jadwal_kelas = self.random.sample(LIST_WAKTU_MULAI, k=kelas.sks)

            kuliah_dict[kelas.kode] = [
                Slot(
                    ruang_kelas[i],
                    jadwal_kelas[i][0],
                    jadwal_kelas[i][1],
                    jadwal_kelas[i][1]+1
                )
                for i in range(kelas.sks)
            ]
        
        self.jadwal = JadwalKuliah(kuliah_dict)
        
    def objective(self) -> float:
        return self._tabrakan_jadwal_mahasiswa()+self._kuota_kelas()
    
    def _tabrakan_jadwal_mahasiswa(self) -> float:
        res = 0
        timetable = self.timetable_mahasiswa
        for mhs in self.problem.list_kuliah_mahasiswa:
            for kuliah in mhs.prio_mata_kuliah.values():
                for slot in self.jadwal.slot_kuliah[kuliah]:
                    key = (slot.hari, slot.waktu_mulai)
                    timetable[key]+=1
            
            for key in timetable.keys():
                tabrakan = timetable[key]
                if tabrakan>1:
                    res += tabrakan
                timetable[key] = 0
        return res
    
    def _kuota_kelas(self):
        res = 0
        kuota_ruangan = self.kuota_ruangan
        for kelas in self.problem.list_kelas:
            kode = kelas.kode
            for slot in self.jadwal.slot_kuliah[kode]:
                kuota = kuota_ruangan[slot.kode_ruangan]
                if kelas.jumlah_mahasiswa>kuota:
                    res += kelas.jumlah_mahasiswa - kuota
        return res