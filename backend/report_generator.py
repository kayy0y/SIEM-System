from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from datetime import datetime
import io


def generate_incident_report(alerts: list, metrics: dict = None) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter,
                            rightMargin=72, leftMargin=72,
                            topMargin=72, bottomMargin=18)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Heading1'],
                                  fontSize=20, spaceAfter=20, alignment=TA_CENTER,
                                  textColor=colors.HexColor("#1a1a2e"))
    heading_style = ParagraphStyle('Heading', parent=styles['Heading2'],
                                    fontSize=14, spaceAfter=10,
                                    textColor=colors.HexColor("#16213e"))
    normal_style = styles['Normal']

    content = []

    # Title
    content.append(Paragraph("SIEM Incident Report", title_style))
    content.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC", normal_style))
    content.append(Spacer(1, 20))

    # Summary
    content.append(Paragraph("Executive Summary", heading_style))
    total = len(alerts)
    critical = sum(1 for a in alerts if a.get("severity") == "critical")
    high = sum(1 for a in alerts if a.get("severity") == "high")
    content.append(Paragraph(f"Total Alerts: {total}", normal_style))
    content.append(Paragraph(f"Critical: {critical} | High: {high}", normal_style))
    content.append(Spacer(1, 15))

    # ML Metrics
    if metrics:
        content.append(Paragraph("AI Model Performance", heading_style))
        metrics_data = [["Metric", "Value"]]
        for k, v in metrics.items():
            metrics_data.append([k.replace("_", " ").title(), f"{float(v)*100:.1f}%"])

        t = Table(metrics_data, colWidths=[3 * inch, 3 * inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#16213e")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f0f0f0")]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        content.append(t)
        content.append(Spacer(1, 15))

    # Alert Table
    content.append(Paragraph("Threat Alerts", heading_style))
    if alerts:
        table_data = [["Time", "IP", "Threat", "Severity", "Confidence"]]
        for a in alerts[:20]:  # max 20 rows
            table_data.append([
                str(a.get("timestamp", ""))[:16],
                str(a.get("ip_address", "N/A")),
                str(a.get("threat_type", "Unknown")),
                str(a.get("severity", "low")).upper(),
                f"{float(a.get('confidence', 0))*100:.0f}%",
            ])

        t = Table(table_data, colWidths=[1.5*inch, 1.3*inch, 1.5*inch, 1*inch, 1*inch])
        severity_colors = {"CRITICAL": colors.red, "HIGH": colors.orange,
                           "MEDIUM": colors.yellow, "LOW": colors.lightgreen}
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#16213e")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f5f5")]),
            ('GRID', (0, 0), (-1, -1), 0.3, colors.grey),
        ]))
        content.append(t)
    else:
        content.append(Paragraph("No alerts found.", normal_style))

    content.append(Spacer(1, 20))

    # Recommendations
    content.append(Paragraph("Recommendations", heading_style))
    recs = [
        "1. Immediately investigate and block IPs with Critical severity alerts.",
        "2. Enable multi-factor authentication (MFA) for all admin accounts.",
        "3. Review firewall rules to restrict unusual outbound traffic.",
        "4. Run a full system scan on devices flagged for Malware activity.",
        "5. Update intrusion detection signatures regularly.",
    ]
    for r in recs:
        content.append(Paragraph(r, normal_style))

    doc.build(content)
    buffer.seek(0)
    return buffer.read()
