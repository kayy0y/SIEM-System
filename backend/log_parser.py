import re
import json
import csv
import io
import pandas as pd
from datetime import datetime
from typing import List, Dict, Any

# Common IP pattern
IP_PATTERN = re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b')
TIMESTAMP_PATTERNS = [
    re.compile(r'\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}'),
    re.compile(r'\d{2}/\w+/\d{4}:\d{2}:\d{2}:\d{2}'),
    re.compile(r'\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}'),
]
USERNAME_PATTERN = re.compile(r'(?:user[=: ]+|username[=: ]+|for\s+)(\w+)', re.IGNORECASE)

SEVERITY_KEYWORDS = {
    "critical": ["critical", "emergency", "fatal", "root login", "privilege escalation"],
    "high": ["error", "failed", "brute", "attack", "malware", "ddos", "injection"],
    "medium": ["warning", "warn", "unauthorized", "suspicious", "multiple failed"],
    "low": ["info", "notice", "accepted", "success", "connected"],
}

THREAT_KEYWORDS = {
    "Brute Force": ["failed password", "authentication failure", "invalid user", "failed login"],
    "SQL Injection": ["sql", "union select", "drop table", "1=1", "or 1"],
    "Port Scan": ["port scan", "nmap", "masscan", "syn flood"],
    "DDoS": ["ddos", "flood", "syn flood", "udp flood"],
    "Malware": ["malware", "virus", "trojan", "ransomware", "exploit"],
    "Unauthorized Login": ["unauthorized", "root login", "sudo", "privilege"],
}

COUNTRY_MAP = {
    "192.168": "Local", "10.": "Local", "172.": "Local",
    "1.": "China", "5.": "Russia", "46.": "Germany",
    "91.": "Netherlands", "103.": "India", "185.": "Ukraine",
    "104.": "USA", "8.": "USA", "216.": "USA",
}


def detect_severity(text: str) -> str:
    text_lower = text.lower()
    for severity, keywords in SEVERITY_KEYWORDS.items():
        if any(k in text_lower for k in keywords):
            return severity
    return "low"


def detect_event_type(text: str) -> str:
    text_lower = text.lower()
    for event, keywords in THREAT_KEYWORDS.items():
        if any(k in text_lower for k in keywords):
            return event
    if "login" in text_lower or "logon" in text_lower:
        return "Login"
    if "connect" in text_lower:
        return "Connection"
    if "disconnect" in text_lower:
        return "Disconnection"
    return "General"


def guess_country(ip: str) -> str:
    for prefix, country in COUNTRY_MAP.items():
        if ip.startswith(prefix):
            return country
    return "Unknown"


def parse_timestamp(text: str) -> datetime:
    for pattern in TIMESTAMP_PATTERNS:
        match = pattern.search(text)
        if match:
            raw = match.group()
            for fmt in ["%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%d/%b/%Y:%H:%M:%S"]:
                try:
                    return datetime.strptime(raw, fmt)
                except:
                    continue
    return datetime.utcnow()


def parse_line(line: str, source_file: str = "unknown") -> Dict[str, Any]:
    ip_match = IP_PATTERN.search(line)
    ip = ip_match.group() if ip_match else "0.0.0.0"
    user_match = USERNAME_PATTERN.search(line)
    username = user_match.group(1) if user_match else "unknown"
    timestamp = parse_timestamp(line)
    severity = detect_severity(line)
    event_type = detect_event_type(line)
    country = guess_country(ip)

    return {
        "ip_address": ip,
        "username": username,
        "timestamp": timestamp,
        "event_type": event_type,
        "severity": severity,
        "device": source_file.split(".")[0],
        "country": country,
        "raw_log": line.strip(),
        "source_file": source_file,
    }


def parse_logs(content: str, filename: str) -> List[Dict[str, Any]]:
    results = []
    ext = filename.split(".")[-1].lower()

    if ext == "json":
        try:
            data = json.loads(content)
            if isinstance(data, list):
                for item in data:
                    line = json.dumps(item)
                    results.append(parse_line(line, filename))
            else:
                results.append(parse_line(json.dumps(data), filename))
        except:
            for line in content.splitlines():
                if line.strip():
                    results.append(parse_line(line, filename))

    elif ext == "csv":
        try:
            df = pd.read_csv(io.StringIO(content))
            for _, row in df.iterrows():
                line = " ".join(str(v) for v in row.values)
                results.append(parse_line(line, filename))
        except:
            for line in content.splitlines():
                if line.strip():
                    results.append(parse_line(line, filename))

    else:  # txt, log, etc.
        for line in content.splitlines():
            if line.strip():
                results.append(parse_line(line, filename))

    return results
