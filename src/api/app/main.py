from fastapi import FastAPI, HTTPException
from .schemas import StateInputModel, SimulatedAnnealingResponseModel, SimulatedAnnealingResultsModel
from .algorithms.state_model_parser import load_problem
from .algorithms.simulated_annealing import SimulatedAnnealing

app = FastAPI()


@app.get("/")
def read_root():
    return {"message": "Hello World"}

@app.post("/api/sim-anneal")
def compute_simulated_annealing(request: StateInputModel) -> SimulatedAnnealingResponseModel:
    try:
        problem = load_problem(request)
        results: dict[int, SimulatedAnnealingResultsModel] = {}
        for i in range(3):
            solver = SimulatedAnnealing(problem)
            solver.search()
            results[i] = solver.get_result()
        return {
            "run": results
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

