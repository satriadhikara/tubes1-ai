from fastapi import FastAPI, HTTPException
from .schemas import (
    StateInputModel,
    SimulatedAnnealingResponseModel,
    SimulatedAnnealingResultsModel,
    HillClimbingResponseModel,
    HillClimbingResultsModel,
)
from .algorithms.state_model_parser import load_problem
from .algorithms.simulated_annealing import SimulatedAnnealing
from .algorithms.hill_climbing import SteepestAscentHillClimbing

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
) -> HillClimbingResponseModel:
    try:
        problem = load_problem(request)
        results: dict[int, HillClimbingResultsModel] = {}
        for i in range(3):
            solver = SteepestAscentHillClimbing(problem)
            solver.search()
            results[i] = solver.get_result()
        return {"run": results}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
