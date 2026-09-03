from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Enable CORS so frontend (port 5500) can talk to backend (port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TransactionInput(BaseModel):
    amount: float
    usual_amount: float
    frequency: int
    new_recipient: bool
    unusual_location: bool
    transaction_time: str

@app.post("/analyze")
def analyze_transaction(txn: TransactionInput):
    score = 0
    factors = []

    # Amount multiplier calculation
    if txn.usual_amount > 0:
        multiplier = txn.amount / txn.usual_amount
        if multiplier > 5:
            score += 35
            factors.append(f"High Amount Multiplier ({multiplier:.1f}x of baseline)")
        elif multiplier > 2:
            score += 20
            factors.append(f"Moderate Amount Spike ({multiplier:.1f}x of baseline)")

    # Frequency check
    if txn.frequency > 3:
        score += 25
        factors.append(f"High 24H Velocity ({txn.frequency} transactions)")

    # New recipient
    if txn.new_recipient:
        score += 20
        factors.append("First-time Recipient Transfer")

    # Unusual location
    if txn.unusual_location:
        score += 25
        factors.append("Unusual Geolocation Area Flagged")

    # Time window check (Overnight hours)
    if "AM" in txn.transaction_time:
        try:
            hour = int(txn.transaction_time.split(":")[0])
            if hour in [1, 2, 3, 4]:
                score += 15
                factors.append("Off-hours Execution Window (1 AM - 4 AM)")
        except:
            pass

    score = min(score, 100)

    if score >= 70:
        level = "HIGH"
        explanation = "Transaction risk score exceeds critical threat threshold. Immediate step-up verification required."
    elif score >= 35:
        level = "MEDIUM"
        explanation = "Moderate anomaly detected. Queued for standard monitoring."
    else:
        level = "LOW"
        explanation = "Parameters align with normal user behavior profile."

    return {
        "risk_score": score,
        "risk_level": level,
        "explanation": explanation,
        "risk_factors": factors
    }