from pydantic import BaseModel
from typing import List, Dict, Union

class KelasMataKuliahModel(BaseModel):
    kode: str
    jumlah_mahasiswa: int
    sks: int

class RuanganModel(BaseModel):
    kode: str
    kuota: int

class MahasiswaModel(BaseModel):
    nim: str
    daftar_mk: List[str]
    prioritas: List[int]

class StateInputModel(BaseModel):
    kelas_mata_kuliah: List[KelasMataKuliahModel]
    ruangan: List[RuanganModel]
    mahasiswa: List[MahasiswaModel]


class SlotKuliahModel(BaseModel):
    kode_ruangan: str
    waktu_mulai: List[Union[str, int]]
    waktu_akhir: List[Union[str, int]]

class SearchResultModel(BaseModel):
    jadwal_kuliah: Dict[str, List[SlotKuliahModel]]
    search_time: float