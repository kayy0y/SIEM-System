from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import io

from database import get_db, init_db, User, LogEntry, ThreatAlert, BlockedIP, AuditLog
from auth import (verify_password, get_password_hash, create_access_token,
                  get_current_user, require_admin, ACCESS_TOKEN_EXPIRE_MINUTES)
from log_parser import parse_logs
from ml_engine import detector
from report_generator import generate_incident_report

app = FastAPI(title="SIEM System API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    init_db()
    # Create default admin user if not exists
    db = next(get_db())
    existing = db.query(User).filter(User.username == "admin").first()
    if not existing:
        admin = User(
            username="admin",
            email="admin@siem.local",
            hashed_password=get_password_hash("admin123"),
            role="admin"
        )
        db.add(admin)
        # Create analyst user
        analyst = User(
            username="analyst",
            email="analyst@siem.local",
            hashed_password=get_password_hash("analyst123"),
            role="analyst"
        )
        db.add(analyst)
        db.commit()


# ─────────────────────────────────────────
# AUTH ROUTES
# ─────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    role: Optional[str] = "analyst"


@app.post("/auth/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    user = User(
        username=req.username,
        email=req.email,
        hashed_password=get_password_hash(req.password),
        role=req.role
    )
    db.add(user)
    db.commit()
    return {"message": "User registered successfully"}


@app.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    token = create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": token, "token_type": "bearer", "role": user.role, "username": user.username}


@app.get("/auth/me")
def me(current_user: User = Depends(get_current_user)):
    return {"username": current_user.username, "email": current_user.email, "role": current_user.role}


# ─────────────────────────────────────────
# DASHBOARD STATS
# ─────────────────────────────────────────

@app.get("/dashboard/stats")
def dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = datetime.utcnow().date()
    total_logs = db.query(LogEntry).count()
    threats_today = db.query(ThreatAlert).filter(
        func.date(ThreatAlert.timestamp) == today
    ).count()
    critical_alerts = db.query(ThreatAlert).filter(
        ThreatAlert.severity == "critical",
        ThreatAlert.status == "open"
    ).count()
    blocked_ips = db.query(BlockedIP).count()
    open_alerts = db.query(ThreatAlert).filter(ThreatAlert.status == "open").count()

    return {
        "total_logs": total_logs,
        "threats_today": threats_today,
        "critical_alerts": critical_alerts,
        "blocked_ips": blocked_ips,
        "open_alerts": open_alerts,
    }


@app.get("/dashboard/threat-trend")
def threat_trend(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Last 7 days threat count"""
    results = []
    for i in range(6, -1, -1):
        day = datetime.utcnow().date() - timedelta(days=i)
        count = db.query(ThreatAlert).filter(func.date(ThreatAlert.timestamp) == day).count()
        results.append({"date": str(day), "threats": count})
    return results


@app.get("/dashboard/attack-types")
def attack_types(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    results = db.query(ThreatAlert.threat_type, func.count(ThreatAlert.id)).group_by(ThreatAlert.threat_type).all()
    return [{"name": r[0], "value": r[1]} for r in results]


@app.get("/dashboard/top-ips")
def top_ips(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    results = db.query(ThreatAlert.ip_address, func.count(ThreatAlert.id)).group_by(
        ThreatAlert.ip_address).order_by(func.count(ThreatAlert.id).desc()).limit(10).all()
    return [{"ip": r[0], "count": r[1]} for r in results]


@app.get("/dashboard/severity-distribution")
def severity_dist(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    results = db.query(ThreatAlert.severity, func.count(ThreatAlert.id)).group_by(ThreatAlert.severity).all()
    return [{"severity": r[0], "count": r[1]} for r in results]


# ─────────────────────────────────────────
# LOG UPLOAD
# ─────────────────────────────────────────

@app.post("/logs/upload")
async def upload_logs(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    content = await file.read()
    try:
        text = content.decode("utf-8")
    except:
        text = content.decode("latin-1")

    parsed = parse_logs(text, file.filename)
    if not parsed:
        raise HTTPException(status_code=400, detail="No parseable logs found")

    log_entries = []
    alerts_created = 0

    for entry in parsed:
        log = LogEntry(**{k: v for k, v in entry.items() if k != "label"})
        db.add(log)
        db.flush()
        log_entries.append(log)

        # Run ML detection
        prediction = detector.predict(entry)

        # Create alert if threat detected or severity is high/critical
        if prediction["threat_type"] not in ["Normal"] or entry.get("severity") in ["high", "critical"]:
            alert = ThreatAlert(
                ip_address=entry["ip_address"],
                threat_type=prediction["threat_type"],
                severity=prediction["severity"],
                confidence=prediction["confidence"],
                score=prediction["score"],
                log_id=log.id,
                details=f"Anomaly: {prediction['is_anomaly']} | Anomaly Score: {prediction['anomaly_score']}",
            )
            db.add(alert)
            alerts_created += 1

    # Audit log
    audit = AuditLog(user=current_user.username, action="upload_logs", target=file.filename)
    db.add(audit)
    db.commit()

    return {
        "message": "Logs processed successfully",
        "logs_parsed": len(parsed),
        "alerts_created": alerts_created,
        "filename": file.filename
    }


@app.get("/logs")
def get_logs(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logs = db.query(LogEntry).order_by(LogEntry.created_at.desc()).offset(skip).limit(limit).all()
    total = db.query(LogEntry).count()
    return {
        "total": total,
        "logs": [
            {
                "id": l.id, "timestamp": str(l.timestamp), "ip_address": l.ip_address,
                "username": l.username, "event_type": l.event_type, "severity": l.severity,
                "device": l.device, "country": l.country, "source_file": l.source_file,
            } for l in logs
        ]
    }


# ─────────────────────────────────────────
# ALERTS
# ─────────────────────────────────────────

@app.get("/alerts")
def get_alerts(
    skip: int = 0, limit: int = 100,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ThreatAlert)
    if severity:
        query = query.filter(ThreatAlert.severity == severity)
    if status:
        query = query.filter(ThreatAlert.status == status)
    total = query.count()
    alerts = query.order_by(ThreatAlert.timestamp.desc()).offset(skip).limit(limit).all()
    return {
        "total": total,
        "alerts": [
            {
                "id": a.id, "timestamp": str(a.timestamp), "ip_address": a.ip_address,
                "threat_type": a.threat_type, "severity": a.severity,
                "confidence": a.confidence, "score": a.score, "status": a.status, "details": a.details,
            } for a in alerts
        ]
    }


class AlertActionRequest(BaseModel):
    action: str  # investigate, safe, block


@app.put("/alerts/{alert_id}/action")
def alert_action(
    alert_id: int,
    req: AlertActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alert = db.query(ThreatAlert).filter(ThreatAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    if req.action == "investigate":
        alert.status = "investigating"
    elif req.action == "safe":
        alert.status = "safe"
    elif req.action == "block":
        alert.status = "blocked"
        # Add to blocked IPs
        existing = db.query(BlockedIP).filter(BlockedIP.ip_address == alert.ip_address).first()
        if not existing:
            blocked = BlockedIP(
                ip_address=alert.ip_address,
                reason=alert.threat_type,
                blocked_by=current_user.username
            )
            db.add(blocked)

    audit = AuditLog(user=current_user.username, action=req.action, target=f"alert:{alert_id}")
    db.add(audit)
    db.commit()
    return {"message": f"Alert {req.action} action applied"}


# ─────────────────────────────────────────
# BLOCKED IPs
# ─────────────────────────────────────────

@app.get("/blocked-ips")
def get_blocked_ips(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ips = db.query(BlockedIP).order_by(BlockedIP.blocked_at.desc()).all()
    return [{"id": b.id, "ip": b.ip_address, "reason": b.reason,
              "blocked_at": str(b.blocked_at), "blocked_by": b.blocked_by} for b in ips]


@app.delete("/blocked-ips/{ip_id}")
def unblock_ip(ip_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ip = db.query(BlockedIP).filter(BlockedIP.id == ip_id).first()
    if not ip:
        raise HTTPException(status_code=404, detail="IP not found")
    db.delete(ip)
    audit = AuditLog(user=current_user.username, action="unblock_ip", target=ip.ip_address)
    db.add(audit)
    db.commit()
    return {"message": "IP unblocked"}


# ─────────────────────────────────────────
# ML / AI
# ─────────────────────────────────────────

@app.get("/ml/metrics")
def get_ml_metrics(current_user: User = Depends(get_current_user)):
    return detector.get_metrics()


@app.post("/ml/retrain")
def retrain_model(current_user: User = Depends(require_admin)):
    metrics = detector.train()
    return {"message": "Model retrained successfully", "metrics": metrics}


# ─────────────────────────────────────────
# REPORTS
# ─────────────────────────────────────────

@app.get("/reports/generate")
def generate_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alerts = db.query(ThreatAlert).order_by(ThreatAlert.timestamp.desc()).limit(50).all()
    alert_dicts = [
        {"timestamp": str(a.timestamp), "ip_address": a.ip_address,
         "threat_type": a.threat_type, "severity": a.severity,
         "confidence": a.confidence, "score": a.score}
        for a in alerts
    ]
    metrics = detector.get_metrics()
    pdf_bytes = generate_incident_report(alert_dicts, metrics)

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=siem_report.pdf"}
    )


# ─────────────────────────────────────────
# USERS (Admin only)
# ─────────────────────────────────────────

@app.get("/users")
def get_users(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    users = db.query(User).all()
    return [{"id": u.id, "username": u.username, "email": u.email,
              "role": u.role, "created_at": str(u.created_at)} for u in users]


@app.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.username == current_user.username:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


# ─────────────────────────────────────────
# SIEM COMPARISON
# ─────────────────────────────────────────

@app.get("/comparison")
def siem_comparison(current_user: User = Depends(get_current_user)):
    metrics = detector.get_metrics()
    return {
        "tools": [
            {
                "name": "Splunk",
                "detection_rate": 0.94,
                "false_positive": 0.08,
                "accuracy": 0.93,
                "response_time": "2-5 min",
                "cost": "$$$$$",
                "ai_features": True,
                "automation": "High",
            },
            {
                "name": "Microsoft Sentinel",
                "detection_rate": 0.91,
                "false_positive": 0.10,
                "accuracy": 0.90,
                "response_time": "1-3 min",
                "cost": "$$$$",
                "ai_features": True,
                "automation": "High",
            },
            {
                "name": "IBM QRadar",
                "detection_rate": 0.89,
                "false_positive": 0.12,
                "accuracy": 0.88,
                "response_time": "3-7 min",
                "cost": "$$$$",
                "ai_features": True,
                "automation": "Medium",
            },
            {
                "name": "Your SIEM (This System)",
                "detection_rate": round(metrics.get("recall", 0.85), 2),
                "false_positive": round(1 - metrics.get("precision", 0.88), 2),
                "accuracy": metrics.get("accuracy", 0.87),
                "response_time": "< 1 min",
                "cost": "Free",
                "ai_features": True,
                "automation": "Medium",
            },
        ]
    }


# ─────────────────────────────────────────
# AUDIT LOGS
# ─────────────────────────────────────────

@app.get("/audit-logs")
def get_audit_logs(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
    return [{"user": l.user, "action": l.action, "target": l.target,
              "timestamp": str(l.timestamp)} for l in logs]


@app.get("/health")
def health():
    return {"status": "ok", "time": str(datetime.utcnow())}
