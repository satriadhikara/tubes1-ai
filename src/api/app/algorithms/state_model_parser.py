from .state import State, KelasMataKuliah, Ruangan, KuliahMahasiswa, JadwalKuliah
from .solver import Solver
from app.schemas import SearchResultModel, SlotKuliahModel

def load_state(data):

    list_kelas = [KelasMataKuliah(**k.dict()) for k in data.kelas_mata_kuliah]
    list_ruangan = [Ruangan(**r.dict()) for r in data.ruangan]
    list_kuliah_mahasiswa = []
    for m in data.mahasiswa:
        if len(m.prioritas)!=len(m.daftar_mk):
            raise ValueError(f"Prioritas mahasiswa NIM {m.nim} tidak valid")

        list_kuliah_mahasiswa.append(KuliahMahasiswa(
            nim=m.nim,
            prio_mata_kuliah={prio: kode for prio, kode in zip(m.prioritas, m.daftar_mk)}
        ))

    return State(
        list_kelas=list_kelas,
        list_ruangan=list_ruangan,
        list_kuliah_mahasiswa=list_kuliah_mahasiswa
    )

def create_response(solver: Solver) -> SearchResultModel:
    jadwal = solver.get_result()
    jadwal_kuliah={
        kode_kuliah: [
            SlotKuliahModel(
                kode_ruangan=slot.kode_ruangan,
                waktu_mulai=list(slot.waktu_mulai),
                waktu_akhit=list(slot.waktu_akhir)
            )
            for slot in slot_kuliah
        ]
        for kode_kuliah, slot_kuliah in jadwal.slot_kuliah.items()
    }
    return SearchResultModel(
        jadwal_kuliah=jadwal_kuliah,
        search_time=solver.get_search_time()
    )