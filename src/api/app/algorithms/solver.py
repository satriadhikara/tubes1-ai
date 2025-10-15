from abc import ABC, abstractmethod
from typing import List, Dict
from .state import Problem, JadwalKuliah
from ..schemas import ResultsModel, SlotKuliahModel

class Solver(ABC):
    def __init__(self, input: Problem):
        input.validate()
        self.input = input
        self.jadwal_init = JadwalKuliah({})
        self.jadwal = JadwalKuliah({})

    @abstractmethod
    def search(self):
        pass

    def get_initial_schedule(self) -> JadwalKuliah:
        return self.jadwal_init
    def get_final_schedule(self) -> JadwalKuliah:
        return self.jadwal
    
    def get_result(self) -> ResultsModel:
        return ResultsModel(
            alokasi_ruangan_awal=self._form_alokasi_ruangan(self.jadwal_init),
            alokasi_ruangan=self._form_alokasi_ruangan(self.jadwal),
            search_time=0.0,
            iteration=0,
            objective_over_iteration=[]
        )
    
    def _form_alokasi_ruangan(self, jadwal: JadwalKuliah) -> Dict[str, List[SlotKuliahModel]]:
        alokasi_ruangan: Dict[str, List[SlotKuliahModel]] = dict()
        for kode_kelas, slot_list in jadwal.slot_kuliah.items():
            for slot in slot_list:
                if slot.kode_ruangan not in alokasi_ruangan:
                    alokasi_ruangan[slot.kode_ruangan] = []
                alokasi_ruangan[slot.kode_ruangan].append(SlotKuliahModel(
                    kode_kelas_kuliah=kode_kelas,
                    hari=slot.hari,
                    waktu_mulai=slot.waktu_mulai,
                    waktu_akhir=slot.waktu_akhir
                ))
        
        return alokasi_ruangan