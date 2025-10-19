from pydantic import BaseModel
from typing import List, Dict, Optional


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
    kode_kelas_kuliah: str
    hari: str
    waktu_mulai: int
    waktu_akhir: int


class ResultsModel(BaseModel):
    alokasi_ruangan_awal: Dict[str, List[SlotKuliahModel]]
    alokasi_ruangan: Dict[str, List[SlotKuliahModel]]
    search_time: float
    iteration: int
    objective_over_iteration: List[float]


class SimulatedAnnealingResultsModel(ResultsModel):
    local_optima_stuck_count: int
    delta_energy_over_iteration: list[float]
    temperature_over_iteration: list[float]


class SimulatedAnnealingResponseModel(BaseModel):
    run: Dict[int, SimulatedAnnealingResultsModel]


class HillClimbingResultsModel(ResultsModel):
    local_optima_iteration: Optional[int] = None
    sideways_moves: Optional[int] = None
    max_sideways: Optional[int] = None
    restart_count: Optional[int] = None
    iterations_per_restart: Optional[List[int]] = None


class HillClimbingResponseModel(BaseModel):
    run: Dict[int, HillClimbingResultsModel]


class GeneticAlgorithmResultsModel(BaseModel):
    alokasi_ruangan_awal: Dict[str, List[SlotKuliahModel]]
    alokasi_ruangan: Dict[str, List[SlotKuliahModel]]
    search_time: float
    iteration: int
    population_size: int
    objective_best_over_iteration: List[float]
    objective_avg_over_iteration: List[float]
    params: Dict[str, float]


class GeneticAlgorithmResponseModel(BaseModel):
    run: Dict[int, GeneticAlgorithmResultsModel]
