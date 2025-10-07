from .state import State, JadwalKuliah
from .solver import Solver

DEFAULT_INITIAL_TEMP = 10000
DEFAULT_DECAY_RATE = 0.995

class SimulatedAnnealing(Solver):
    def __init__(self, input: State, initial_temp=DEFAULT_INITIAL_TEMP, decay=DEFAULT_DECAY_RATE):
        super().__init__(input)
        self.temp = initial_temp
        self.decay = decay
        # and maybe some statistics
        self.search_time = 0

    def search(self):
        # TODO
        self.input_state.validate()
        self.result = JadwalKuliah({})