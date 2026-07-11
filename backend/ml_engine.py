import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import pickle
import os
from typing import Dict, Any, List, Tuple

MODEL_PATH = "ml_models/"
os.makedirs(MODEL_PATH, exist_ok=True)

THREAT_TYPES = ["Normal", "Brute Force", "DDoS", "Malware", "SQL Injection", "Port Scan", "Unauthorized Login"]
SEVERITY_SCORES = {"critical": 95, "high": 75, "medium": 50, "low": 20}

le_event = LabelEncoder()
le_event.fit(["Normal", "Brute Force", "DDoS", "Malware", "SQL Injection", "Port Scan", "Unauthorized Login", "Login", "Connection", "Disconnection", "General"])

le_severity = LabelEncoder()
le_severity.fit(["critical", "high", "medium", "low"])


def generate_synthetic_data(n_samples: int = 2000) -> pd.DataFrame:
    """Generate synthetic log data for training since we don't have real datasets loaded"""
    np.random.seed(42)
    data = []

    # Normal traffic (60%)
    for _ in range(int(n_samples * 0.6)):
        data.append({
            "hour": np.random.randint(8, 18),
            "failed_attempts": np.random.randint(0, 2),
            "severity_score": np.random.choice([20, 50]),
            "event_encoded": 0,  # Normal
            "bytes_sent": np.random.randint(100, 5000),
            "label": 0,
            "threat_type": "Normal"
        })

    # Brute Force (10%)
    for _ in range(int(n_samples * 0.10)):
        data.append({
            "hour": np.random.randint(0, 24),
            "failed_attempts": np.random.randint(10, 100),
            "severity_score": 75,
            "event_encoded": 1,
            "bytes_sent": np.random.randint(50, 500),
            "label": 1,
            "threat_type": "Brute Force"
        })

    # DDoS (10%)
    for _ in range(int(n_samples * 0.10)):
        data.append({
            "hour": np.random.randint(0, 24),
            "failed_attempts": np.random.randint(0, 5),
            "severity_score": 95,
            "event_encoded": 2,
            "bytes_sent": np.random.randint(100000, 1000000),
            "label": 2,
            "threat_type": "DDoS"
        })

    # SQL Injection (10%)
    for _ in range(int(n_samples * 0.10)):
        data.append({
            "hour": np.random.randint(0, 24),
            "failed_attempts": np.random.randint(1, 10),
            "severity_score": 75,
            "event_encoded": 3,
            "bytes_sent": np.random.randint(200, 2000),
            "label": 3,
            "threat_type": "SQL Injection"
        })

    # Port Scan (10%)
    for _ in range(int(n_samples * 0.10)):
        data.append({
            "hour": np.random.randint(0, 24),
            "failed_attempts": np.random.randint(5, 50),
            "severity_score": 50,
            "event_encoded": 5,
            "bytes_sent": np.random.randint(10, 200),
            "label": 4,
            "threat_type": "Port Scan"
        })

    return pd.DataFrame(data)


def extract_features(log: Dict[str, Any]) -> List[float]:
    """Convert a parsed log entry into ML features"""
    hour = log.get("timestamp").hour if hasattr(log.get("timestamp", None), "hour") else 12
    severity_score = SEVERITY_SCORES.get(log.get("severity", "low"), 20)

    # Encode event type safely
    event_type = log.get("event_type", "General")
    try:
        event_enc = le_event.transform([event_type])[0]
    except:
        event_enc = 9  # unknown

    failed_attempts = 1 if log.get("severity") in ["high", "critical"] else 0
    bytes_sent = len(log.get("raw_log", "")) * 10  # proxy feature

    return [hour, failed_attempts, severity_score, event_enc, bytes_sent]


class ThreatDetector:
    def __init__(self):
        self.isolation_forest = None
        self.random_forest = None
        self.is_trained = False
        self._load_or_train()

    def _load_or_train(self):
        iso_path = MODEL_PATH + "isolation_forest.pkl"
        rf_path = MODEL_PATH + "random_forest.pkl"

        if os.path.exists(iso_path) and os.path.exists(rf_path):
            with open(iso_path, "rb") as f:
                self.isolation_forest = pickle.load(f)
            with open(rf_path, "rb") as f:
                self.random_forest = pickle.load(f)
            self.is_trained = True
        else:
            self.train()

    def train(self) -> Dict[str, float]:
        df = generate_synthetic_data(2000)
        X = df[["hour", "failed_attempts", "severity_score", "event_encoded", "bytes_sent"]].values
        y = df["label"].values

        # Train Isolation Forest (unsupervised anomaly detection)
        self.isolation_forest = IsolationForest(contamination=0.2, random_state=42)
        self.isolation_forest.fit(X)

        # Train Random Forest (supervised classification)
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        self.random_forest = RandomForestClassifier(n_estimators=100, random_state=42)
        self.random_forest.fit(X_train, y_train)

        # Save models
        with open(MODEL_PATH + "isolation_forest.pkl", "wb") as f:
            pickle.dump(self.isolation_forest, f)
        with open(MODEL_PATH + "random_forest.pkl", "wb") as f:
            pickle.dump(self.random_forest, f)

        self.is_trained = True

        # Evaluate
        y_pred = self.random_forest.predict(X_test)
        metrics = {
            "accuracy": round(accuracy_score(y_test, y_pred), 4),
            "precision": round(precision_score(y_test, y_pred, average="weighted", zero_division=0), 4),
            "recall": round(recall_score(y_test, y_pred, average="weighted", zero_division=0), 4),
            "f1_score": round(f1_score(y_test, y_pred, average="weighted", zero_division=0), 4),
        }
        return metrics

    def predict(self, log: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_trained:
            self.train()

        features = extract_features(log)
        X = np.array([features])

        # Isolation Forest: -1 = anomaly, 1 = normal
        iso_pred = self.isolation_forest.predict(X)[0]
        iso_score = self.isolation_forest.decision_function(X)[0]
        is_anomaly = iso_pred == -1

        # Random Forest classification
        rf_pred = self.random_forest.predict(X)[0]
        rf_proba = self.random_forest.predict_proba(X)[0]
        confidence = float(max(rf_proba))

        threat_labels = ["Normal", "Brute Force", "DDoS", "SQL Injection", "Port Scan"]
        threat_type = threat_labels[rf_pred] if rf_pred < len(threat_labels) else "Unknown"

        # Override with keyword-based detection from severity
        keyword_threat = log.get("event_type", "General")
        if keyword_threat in ["Brute Force", "DDoS", "Malware", "SQL Injection", "Port Scan", "Unauthorized Login"]:
            threat_type = keyword_threat

        # Score calculation
        severity = log.get("severity", "low")
        base_score = SEVERITY_SCORES.get(severity, 20)
        anomaly_bonus = 20 if is_anomaly else 0
        score = min(100, base_score + anomaly_bonus + (confidence * 10))

        # Final severity from score
        if score >= 85:
            final_severity = "critical"
        elif score >= 65:
            final_severity = "high"
        elif score >= 40:
            final_severity = "medium"
        else:
            final_severity = "low"

        return {
            "threat_type": threat_type if threat_type != "Normal" or is_anomaly else "Suspicious Activity",
            "is_anomaly": is_anomaly,
            "confidence": round(confidence, 3),
            "score": round(score, 2),
            "severity": final_severity,
            "anomaly_score": round(float(iso_score), 4),
        }

    def get_metrics(self) -> Dict[str, float]:
        df = generate_synthetic_data(500)
        X = df[["hour", "failed_attempts", "severity_score", "event_encoded", "bytes_sent"]].values
        y = df["label"].values
        y_pred = self.random_forest.predict(X)
        return {
            "accuracy": round(accuracy_score(y, y_pred), 4),
            "precision": round(precision_score(y, y_pred, average="weighted", zero_division=0), 4),
            "recall": round(recall_score(y, y_pred, average="weighted", zero_division=0), 4),
            "f1_score": round(f1_score(y, y_pred, average="weighted", zero_division=0), 4),
        }


# Singleton instance
detector = ThreatDetector()
