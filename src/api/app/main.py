from fastapi import FastAPI, HTTPException
from .schemas import StateInputModel, SearchResultModel
from .algorithms.state_model_parser import load_state, create_response
from .algorithms.simulated_annealing import SimulatedAnnealing

app = FastAPI()


@app.get("/")
def read_root():
    return {"message": "Hello World"}

@app.post("/api/sim-anneal")
def compute_simulated_annealing(request: StateInputModel) -> SearchResultModel:
    try:
        state = load_state(request)
        solver = SimulatedAnnealing(state)
        solver.search()
        return create_response(solver)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

