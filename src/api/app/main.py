from fastapi import FastAPI, HTTPException
from typing import Optional
from .schemas import (
    StateInputModel,
    SimulatedAnnealingResponseModel,
    SimulatedAnnealingResultsModel,
    HillClimbingResponseModel,
    HillClimbingResultsModel,
    GeneticAlgorithmResponseModel,
    GeneticAlgorithmResultsModel,
)
from .algorithms.state_model_parser import load_problem
from .algorithms.simulated_annealing import SimulatedAnnealing
from .algorithms.hill_climbing import (
    SteepestAscentHillClimbing,
    StochasticHillClimbing,
    SidewaysMoveHillClimbing,
    RandomRestartHillClimbing,
    DEFAULT_MAX_SIDEWAYS,
    DEFAULT_MAX_RESTART,
)
from .algorithms.genetic_algorithm import GeneticAlgorithm

app = FastAPI()


@app.get("/")
def read_root():
    return {"message": "Hello World"}


@app.post("/api/sim-anneal")
def compute_simulated_annealing(
    request: StateInputModel,
) -> SimulatedAnnealingResponseModel:
    try:
        problem = load_problem(request)
        results: dict[int, SimulatedAnnealingResultsModel] = {}
        for i in range(3):
            solver = SimulatedAnnealing(problem)
            solver.search()
            results[i] = solver.get_result()
        return {"run": results}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/hill-climbing")
def compute_hill_climbing(
    request: StateInputModel,
    variant: str = "steepest",
    max_sideways: Optional[int] = None,
    max_restart: Optional[int] = None,
    max_iterations_per_restart: Optional[int] = None,
) -> HillClimbingResponseModel:
    try:
        problem = load_problem(request)
        variant_key = variant.lower()

        solver_factory = None
        if variant_key == "steepest":

            def solver_factory():
                return SteepestAscentHillClimbing(problem)
        elif variant_key == "stochastic":

            def solver_factory():
                return StochasticHillClimbing(problem)
        elif variant_key == "sideways":
            sideways_limit = (
                max_sideways if max_sideways is not None else DEFAULT_MAX_SIDEWAYS
            )

            def solver_factory():
                return SidewaysMoveHillClimbing(problem, max_sideways=sideways_limit)
        elif variant_key == "random_restart":
            restart_limit = (
                max_restart if max_restart is not None else DEFAULT_MAX_RESTART
            )

            def solver_factory():
                return RandomRestartHillClimbing(
                    problem,
                    max_restart=restart_limit,
                    max_iterations_per_restart=max_iterations_per_restart,
                )

        if solver_factory is None:
            raise HTTPException(
                status_code=400,
                detail="Varian hill climbing tidak dikenal",
            )

        results: dict[int, HillClimbingResultsModel] = {}
        for i in range(3):
            solver = solver_factory()
            solver.search()
            results[i] = solver.get_result()
        return {"run": results}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/genetic-algorithm")
def compute_genetic_algorithm(
    request: StateInputModel,
    population_size: int = 50,
    max_generations: int = 200,
    crossover_rate: float = 0.9,
    mutation_rate: float = 0.2,
    tournament_k: int = 3,
    elitism: int = 1,
) -> GeneticAlgorithmResponseModel:
    try:
        problem = load_problem(request)
        results: dict[int, GeneticAlgorithmResultsModel] = {}
        for i in range(3):
            solver = GeneticAlgorithm(problem, params=None)
            solver.params.population_size = population_size
            solver.params.max_generations = max_generations
            solver.params.crossover_rate = crossover_rate
            solver.params.mutation_rate = mutation_rate
            solver.params.tournament_k = tournament_k
            solver.params.elitism = elitism
            solver.search()
            results[i] = solver.get_result()
        return {"run": results}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
