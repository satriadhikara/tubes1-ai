from abc import ABC, abstractmethod
from .state import State, JadwalKuliah

class Solver(ABC):
    def __init__(self, input_state: State):
        self.input_state = input_state
        self.result: JadwalKuliah = JadwalKuliah({})
        self.search_time: float = 0

    @abstractmethod
    def search(self):
        # self.result = JadwalKuliah({})
        pass

    def get_result(self) -> JadwalKuliah:
        return self.result
    def get_search_time(self) -> float:
        return self.search_time