from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Aegis AI Security Core")

# Enable CORS for Frontend Interoperability
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TransactionPayload(BaseModel):
    amount: float
    usual_amount: float
    frequency: int
    new_recipient: bool
    unusual_location: bool
    transaction_time: str

class OrderPayload(BaseModel):
    amount: float
    currency: str = "INR"

def log_security_threat(score: int, amount: float, time_str: str):
    """Simulates asynchronous background notification to Security Operations Center"""
    print(f"🚨 [AEGIS THREAT ALERT] High-risk threat detected! Score: {score}/100 | Amount: ₹{amount} | Execution Time: {time_str}")

@app.get("/")
def read_root():
    return {"system": "Aegis AI Engine", "status": "ONLINE", "version": "2.4"}

@app.post("/analyze")
def analyze_transaction(data: TransactionPayload, background_tasks: BackgroundTasks):
    risk_score = 0
    factors = []

    # 1. Amount Multiplier Check
    baseline = data.usual_amount if data.usual_amount > 0 else 1.0
    multiplier = data.amount / baseline

    if multiplier >= 5.0:
        risk_score += 40
        factors.append(f"The transaction amount is approximately {multiplier:.1f}x the user's usual baseline.")
    elif multiplier >= 2.0:
        risk_score += 20
        factors.append(f"The transaction amount is approximately {multiplier:.1f}x the user's usual baseline.")

    # 2. Velocity Check
    if data.frequency > 3:
        risk_score += 25
        factors.append(f"{data.frequency} recent transactions indicate unusual velocity spikes.")

    # 3. Anomaly Flags
    if data.new_recipient:
        risk_score += 20
        factors.append("The recipient is new / first-time transfer target.")

    if data.unusual_location:
        risk_score += 25
        factors.append("The transaction occurred outside regular geographical profile.")

    # 4. Off-Hours Check
    if "AM" in data.transaction_time.upper() and not ("10:" in data.transaction_time or "11:" in data.transaction_time):
        risk_score += 10
        factors.append(f"The transaction occurred at {data.transaction_time}, which is considered an off-hours period.")

    # Final Verdict Classification
    final_score = min(risk_score, 100)
    if final_score >= 70:
        level = "HIGH"
        explanation = "This transaction presents multiple high-risk behavioral indicators and requires immediate 2FA verification."
        background_tasks.add_task(log_security_threat, final_score, data.amount, data.transaction_time)
    elif final_score >= 40:
        level = "MEDIUM"
        explanation = "This transaction contains unusual behavioral signals and should be reviewed."
    else:
        level = "LOW"
        explanation = "This transaction appears consistent with the provided normal behavioral pattern."

    return {
        "risk_score": final_score,
        "risk_level": level,
        "explanation": explanation,
        "risk_factors": factors
    }

@app.post("/api/create-order")
def create_order(payload: OrderPayload):
    return {
        "order_id": f"order_sim_{payload.amount}",
        "key_id": "rzp_test_1DP5mmOlF5G5ag",
        "amount": payload.amount * 100,
        "currency": payload.currency
    }