from dataclasses import dataclass
from .state import Problem, State, JadwalKuliah, Slot, LIST_WAKTU_MULAI
from .solver import Solver
from ..schemas import SimulatedAnnealingResultsModel
import random
import math
import time
import copy

DEFAULT_INITIAL_TEMP = 100000
DEFAULT_DECAY_RATE = 0.995


@dataclass(frozen=True)
class IterationResult:
    delta_energy: float
    move_accepted: bool


class SimulatedAnnealingState(State):
    def __init__(
        self,
        problem: Problem,
        jadwal=JadwalKuliah({}),
        randomizer: random.Random = random.Random(int(time.time() * 1000)),
    ):
        super().__init__(problem, jadwal, randomizer)

        self.slot_assignment: dict[Slot, list[str]] = dict()
        self.empty_slots: set[Slot] = set()

    def next(self, temperature: float) -> IterationResult:
        e_init = self._energy()

        e_neighbor = None
        move_accepted = None
        move_type = self.random.random()
        if move_type > 0.5 or len(self.empty_slots) == 0:
            kelas1, slot1, kelas2, slot2 = self._random_pair_jadwal()
            self._swap_pair_jadwal(kelas1, slot1, kelas2, slot2)
            e_neighbor = self._energy()
            move_accepted = self._accept_move(e_neighbor - e_init, temperature)
            if not move_accepted:
                self._swap_pair_jadwal(kelas1, slot2, kelas2, slot1)
        else:
            slot_from, kode, slot_to = self._random_move_to_empty_slot()
            self._move_into_slot(slot_from, kode, slot_to)
            e_neighbor = self._energy()
            move_accepted = self._accept_move(e_neighbor - e_init, temperature)
            if not move_accepted:
                self._move_into_slot(slot_to, kode, slot_from)

        return IterationResult(
            delta_energy=e_neighbor - e_init, move_accepted=move_accepted
        )

    def seed_jadwal(self):
        super().seed_jadwal()
        self.slot_assignment = {}
        self.empty_slots = set()
        for kode_kelas, slot_assignment in self.jadwal.slot_kuliah.items():
            for slot in slot_assignment:
                if slot not in self.slot_assignment:
                    self.slot_assignment[slot] = []
                self.slot_assignment[slot].append(kode_kelas)
        for ruangan in self.problem.list_ruangan:
            for hari, waktu_mulai in LIST_WAKTU_MULAI:
                slot = Slot(ruangan.kode, hari, waktu_mulai, waktu_mulai + 1)
                if slot not in self.slot_assignment:
                    self.empty_slots.add(slot)

    def _energy(self) -> float:
        return self.objective()

    def _accept_move(self, delta_energy: float, temp: float) -> bool:
        if delta_energy < 0:
            return True
        if self.random.random() < math.exp(-delta_energy / temp):
            return True
        return False

    def _swap_pair_jadwal(self, kelas1: str, slot1: Slot, kelas2: str, slot2: Slot):
        slot_kuliah_1 = self.jadwal.slot_kuliah[kelas1]
        slot_kuliah_2 = self.jadwal.slot_kuliah[kelas2]
        slot_kuliah_1[slot_kuliah_1.index(slot1)] = slot2
        slot_kuliah_2[slot_kuliah_2.index(slot2)] = slot1

        slot_assignment1 = self.slot_assignment[slot1]
        slot_assignment2 = self.slot_assignment[slot2]
        slot_assignment1[slot_assignment1.index(kelas1)] = kelas2
        slot_assignment2[slot_assignment2.index(kelas2)] = kelas1

    def _random_pair_jadwal(self) -> tuple[str, Slot, str, Slot]:
        kelas1 = self.random.choice(self.problem.list_kelas).kode
        kelas2 = self.random.choice(self.problem.list_kelas).kode
        slot1 = self.random.choice(self.jadwal.slot_kuliah[kelas1])
        slot2 = self.random.choice(self.jadwal.slot_kuliah[kelas2])
        return (kelas1, slot1, kelas2, slot2)

    def _random_move_to_empty_slot(self) -> tuple[Slot, str, Slot]:
        kelas = self.random.choice(self.problem.list_kelas).kode
        slot_from = self.random.choice(self.jadwal.slot_kuliah[kelas])
        slot_to = self.random.choice(tuple(self.empty_slots))
        return (slot_from, kelas, slot_to)

    def _move_into_slot(self, slot_from: Slot, kode: str, slot_to: Slot):
        slot_kuliah = self.jadwal.slot_kuliah[kode]
        slot_kuliah[slot_kuliah.index(slot_from)] = slot_to

        self.slot_assignment[slot_from].remove(kode)
        if len(self.slot_assignment[slot_from]) == 0:
            self.slot_assignment.pop(slot_from)
            self.empty_slots.add(slot_from)

        if slot_to in self.slot_assignment:
            self.slot_assignment[slot_to].append(kode)
        else:
            self.slot_assignment[slot_to] = [kode]
            self.empty_slots.discard(slot_to)


class SimulatedAnnealing(Solver):
    def __init__(
        self,
        input: Problem,
        initial_temp=DEFAULT_INITIAL_TEMP,
        decay=DEFAULT_DECAY_RATE,
    ):
        super().__init__(input)
        self.state = SimulatedAnnealingState(input)
        self.initial_temp = initial_temp
        self.temp = initial_temp
        self.decay = decay

        # Statistics - general
        self.search_time = 0
        self.iteration = 0
        self.objective_plt: list[float] = []

        # Statistics - simulated annealing
        self.stuck_count = 0
        self.delta_energy_plt: list[float] = []
        self.temp_plt: list[float] = []

    def search(self):
        # Reset statistics in case solver instance is reused
        self.search_time = 0
        self.iteration = 0
        self.objective_plt = []
        self.stuck_count = 0
        self.delta_energy_plt = []
        self.temp_plt = []
        self.temp = self.initial_temp

        # --- INIT ---
        self.state.seed_jadwal()
        self.jadwal = self.state.jadwal
        self.jadwal_init = copy.deepcopy(self.jadwal)
        self.objective_plt.append(self.state.objective())

        # --- Start ---
        starttime = time.time()

        while self.temp > 1:
            iter_result: IterationResult = self.state.next(self.temp)

            self.objective_plt.append(self.state.objective())
            self.delta_energy_plt.append(iter_result.delta_energy)
            self.temp_plt.append(self.temp)
            self.temp *= self.decay
            self.iteration += 1
            if not iter_result.move_accepted:
                self.stuck_count += 1

        endtime = time.time()
        self.search_time = endtime - starttime

    def get_result(self) -> SimulatedAnnealingResultsModel:
        return SimulatedAnnealingResultsModel(
            alokasi_ruangan_awal=self._form_alokasi_ruangan(self.jadwal_init),
            alokasi_ruangan=self._form_alokasi_ruangan(self.jadwal),
            search_time=self.search_time,
            iteration=self.iteration,
            objective_over_iteration=self.objective_plt,
            local_optima_stuck_count=self.stuck_count,
            delta_energy_over_iteration=self.delta_energy_plt,
            temperature_over_iteration=self.temp_plt,
        )
