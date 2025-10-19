from __future__ import annotations
from dataclasses import dataclass
from .state import Problem, State, JadwalKuliah, Slot, LIST_WAKTU_MULAI
from .solver import Solver
from ..schemas import GeneticAlgorithmResultsModel
import random
import time
import copy
from typing import List, Tuple, Dict, Optional


@dataclass(frozen=True)
class GAParams:
    population_size: int = 50
    max_generations: int = 200
    crossover_rate: float = 0.9
    mutation_rate: float = 0.2
    tournament_k: int = 3
    elitism: int = 1


class GAIndividual:
    __slots__ = ["jadwal", "objective"]

    def __init__(self, jadwal: JadwalKuliah, objective: float):
        self.jadwal = jadwal
        self.objective = objective


class GAState(State):
    def __init__(
        self,
        problem: Problem,
        randomizer: random.Random = random.Random(int(time.time() * 1000)),
    ):
        super().__init__(problem, JadwalKuliah({}), randomizer)

    def _evaluate(self, jadwal: JadwalKuliah) -> float:
        backup = self.jadwal
        self.jadwal = jadwal
        val = self.objective()
        self.jadwal = backup
        return val

    def seed_population(self, n: int) -> List[GAIndividual]:
        population: List[GAIndividual] = []
        for _ in range(n):
            super().seed_jadwal()
            indiv = GAIndividual(
                copy.deepcopy(self.jadwal), self._evaluate(self.jadwal)
            )
            population.append(indiv)
        return population

    def tournament_select(self, population: List[GAIndividual], k: int) -> GAIndividual:
        chosen = self.random.sample(population, k=min(k, len(population)))
        best = min(chosen, key=lambda ind: ind.objective)
        return best

    def _all_possible_slots(self) -> List[Slot]:
        all_slots: List[Slot] = []
        for ruangan in self.problem.list_ruangan:
            for hari, waktu_mulai in LIST_WAKTU_MULAI:
                all_slots.append(Slot(ruangan.kode, hari, waktu_mulai, waktu_mulai + 1))
        return all_slots

    def _empty_slots_for(self, jadwal: JadwalKuliah) -> List[Slot]:
        used: set[Slot] = set()
        for slot_list in jadwal.slot_kuliah.values():
            for s in slot_list:
                used.add(s)
        all_slots = self._all_possible_slots()
        return [s for s in all_slots if s not in used]

    def crossover(
        self, p1: GAIndividual, p2: GAIndividual
    ) -> Tuple[JadwalKuliah, JadwalKuliah]:
        child1_map: Dict[str, List[Slot]] = {}
        child2_map: Dict[str, List[Slot]] = {}

        kelas_codes: List[str] = [k.kode for k in self.problem.list_kelas]

        for kode in kelas_codes:
            take_from_p1 = self.random.random() < 0.5
            if take_from_p1:
                child1_map[kode] = list(p1.jadwal.slot_kuliah[kode])
                child2_map[kode] = list(p2.jadwal.slot_kuliah[kode])
            else:
                child1_map[kode] = list(p2.jadwal.slot_kuliah[kode])
                child2_map[kode] = list(p1.jadwal.slot_kuliah[kode])

        return JadwalKuliah(child1_map), JadwalKuliah(child2_map)

    def _mut_swap_two_meetings(self, jadwal: JadwalKuliah):
        k1 = self.random.choice(self.problem.list_kelas).kode
        k2 = self.random.choice(self.problem.list_kelas).kode
        s1_list = jadwal.slot_kuliah[k1]
        s2_list = jadwal.slot_kuliah[k2]
        i = self.random.randrange(len(s1_list))
        j = self.random.randrange(len(s2_list))
        s1_list[i], s2_list[j] = s2_list[j], s1_list[i]

    def _mut_move_to_empty(self, jadwal: JadwalKuliah):
        empty_slots = self._empty_slots_for(jadwal)
        if not empty_slots:
            return
        k = self.random.choice(self.problem.list_kelas).kode
        s_list = jadwal.slot_kuliah[k]
        idx = self.random.randrange(len(s_list))
        s_list[idx] = self.random.choice(empty_slots)

    def mutate(self, jadwal: JadwalKuliah, mutation_rate: float):
        if self.random.random() > mutation_rate:
            return

        if self.random.random() < 0.5:
            self._mut_swap_two_meetings(jadwal)
        else:
            self._mut_move_to_empty(jadwal)


class GeneticAlgorithm(Solver):
    def __init__(self, input: Problem, params: Optional[GAParams] = None):
        super().__init__(input)
        self.params = params or GAParams()
        self.state = GAState(input)

        self.search_time: float = 0.0
        self.generations_done: int = 0
        self.best_objective_trace: List[float] = []
        self.avg_objective_trace: List[float] = []

        self.jadwal_init: Optional[JadwalKuliah] = None
        self.jadwal: Optional[JadwalKuliah] = None

    def _evaluate_population(self, pop: List[GAIndividual]):
        for ind in pop:
            ind.objective = self.state._evaluate(ind.jadwal)

    def _elitism(self, pop: List[GAIndividual], elitism_n: int) -> List[GAIndividual]:
        if elitism_n <= 0:
            return []
        elites = sorted(pop, key=lambda ind: ind.objective)[:elitism_n]
        return [GAIndividual(copy.deepcopy(e.jadwal), e.objective) for e in elites]

    def search(self):
        self.search_time = 0.0
        self.generations_done = 0
        self.best_objective_trace = []
        self.avg_objective_trace = []
        self.jadwal_init = None
        self.jadwal = None

        ps = self.params.population_size
        gens = self.params.max_generations
        cx_rate = self.params.crossover_rate
        mut_rate = self.params.mutation_rate
        k = self.params.tournament_k
        elitism_n = max(0, min(self.params.elitism, ps - 1))

        population = self.state.seed_population(ps)
        best0 = min(population, key=lambda ind: ind.objective)
        self.jadwal_init = copy.deepcopy(best0.jadwal)

        self.best_objective_trace.append(best0.objective)
        self.avg_objective_trace.append(
            sum(ind.objective for ind in population) / len(population)
        )

        start = time.time()

        for gen in range(1, gens + 1):
            next_population: List[GAIndividual] = []

            elites = self._elitism(population, elitism_n)
            next_population.extend(elites)

            while len(next_population) < ps:
                p1 = self.state.tournament_select(population, k)
                p2 = self.state.tournament_select(population, k)

                if self.state.random.random() < cx_rate:
                    c1_jadwal, c2_jadwal = self.state.crossover(p1, p2)
                else:
                    c1_jadwal = copy.deepcopy(p1.jadwal)
                    c2_jadwal = copy.deepcopy(p2.jadwal)

                self.state.mutate(c1_jadwal, mut_rate)
                self.state.mutate(c2_jadwal, mut_rate)

                c1 = GAIndividual(c1_jadwal, self.state._evaluate(c1_jadwal))
                next_population.append(c1)
                if len(next_population) < ps:
                    c2 = GAIndividual(c2_jadwal, self.state._evaluate(c2_jadwal))
                    next_population.append(c2)

            population = next_population

            best = min(population, key=lambda ind: ind.objective)
            avg = sum(ind.objective for ind in population) / len(population)
            self.best_objective_trace.append(best.objective)
            self.avg_objective_trace.append(avg)

            self.generations_done = gen

        end = time.time()
        self.search_time = end - start

        final_best = min(population, key=lambda ind: ind.objective)
        self.jadwal = copy.deepcopy(final_best.jadwal)

    def get_result(self) -> GeneticAlgorithmResultsModel:
        return GeneticAlgorithmResultsModel(
            alokasi_ruangan_awal=self._form_alokasi_ruangan(self.jadwal_init),
            alokasi_ruangan=self._form_alokasi_ruangan(self.jadwal),
            search_time=self.search_time,
            iteration=self.generations_done,
            population_size=self.params.population_size,
            objective_best_over_iteration=self.best_objective_trace,
            objective_avg_over_iteration=self.avg_objective_trace,
            params={
                "crossover_rate": self.params.crossover_rate,
                "mutation_rate": self.params.mutation_rate,
                "tournament_k": self.params.tournament_k,
                "elitism": self.params.elitism,
                "max_generations": self.params.max_generations,
            },
        )
