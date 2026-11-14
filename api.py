import json
import sqlite3
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse


APP_DIR = Path(__file__).resolve().parent
DB_PATH = APP_DIR / "consent_portal.db"
UI_DIR = APP_DIR / "react_ui"
NOTICE_VERSION = "1.0"
PROFILES = ["Student Demo", "Parent Demo", "Staff Demo"]
PURPOSES = {
    "Account management": {
        "description": "Maintain a sample profile and basic account preferences.",
        "data": "Display name and account preferences",
        "optional": False,
    },
    "Analytics": {
        "description": "Understand how the learning portal is used and improve its pages.",
        "data": "Demo page interactions",
        "optional": True,
    },
    "Marketing messages": {
        "description": "Illustrate an optional preference for product or service updates.",
        "data": "Sample communication preference",
        "optional": True,
    },
    "Third-party sharing": {
        "description": "Illustrate a request to share selected information with a named service provider.",
        "data": "No real sharing occurs in this student prototype",
        "optional": True,
    },
}


def connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def now_text():
    return datetime.now().strftime("%Y-%m-%d %I:%M:%S %p")


def current_statuses(user):
    with connection() as conn:
        rows = conn.execute(
            """
            SELECT c.purpose, c.action
            FROM consent_records c
            JOIN (
                SELECT purpose, MAX(id) AS max_id
                FROM consent_records
                WHERE demo_user = ?
                GROUP BY purpose
            ) latest ON c.id = latest.max_id
            WHERE c.demo_user = ?
            """,
            (user, user),
        ).fetchall()
    statuses = {purpose: "Not Decided" for purpose in PURPOSES}
    for row in rows:
        statuses[row["purpose"]] = row["action"]
    return statuses


def history(user):
    with connection() as conn:
        return [
            dict(row)
            for row in conn.execute(
                """
                SELECT event_time AS time, purpose, action,
                       notice_version AS noticeVersion, note
                FROM consent_records
                WHERE demo_user = ?
                ORDER BY id DESC
                """,
                (user,),
            ).fetchall()
        ]


def rights_requests(user):
    with connection() as conn:
        return [
            dict(row)
            for row in conn.execute(
                """
                SELECT event_time AS time, request_type AS requestType,
                       details, status
                FROM rights_requests
                WHERE demo_user = ?
                ORDER BY id DESC
                """,
                (user,),
            ).fetchall()
        ]


def ensure_schema():
    with connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS consent_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_time TEXT NOT NULL,
                demo_user TEXT NOT NULL,
                purpose TEXT NOT NULL,
                action TEXT NOT NULL,
                notice_version TEXT NOT NULL,
                note TEXT
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS rights_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_time TEXT NOT NULL,
                demo_user TEXT NOT NULL,
                request_type TEXT NOT NULL,
                details TEXT,
                status TEXT NOT NULL DEFAULT 'Received'
            )
            """
        )


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        return

    def send_json(self, payload, status=200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_file(self, path):
        content_type = "text/html; charset=utf-8"
        if path.suffix == ".js":
            content_type = "text/javascript; charset=utf-8"
        elif path.suffix == ".css":
            content_type = "text/css; charset=utf-8"
        body = path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        return json.loads(self.rfile.read(length) or b"{}")

    def do_OPTIONS(self):
        self.send_json({})

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/health":
            self.send_json({"ok": True})
            return
        if parsed.path == "/api/bootstrap":
            self.send_json(
                {
                    "noticeVersion": NOTICE_VERSION,
                    "profiles": PROFILES,
                    "purposes": PURPOSES,
                    "pages": [
                        "Home",
                        "Know DPDPA",
                        "DPDPA Notes",
                        "Important Points",
                        "Practice Questions",
                        "Quiz",
                        "Consent Flow",
                        "Consent Dashboard",
                        "Consent History",
                        "Rights Requests",
                        "About Project",
                    ],
                }
            )
            return
        if parsed.path in ("/api/statuses", "/api/history", "/api/rights"):
            user = parse_qs(parsed.query).get("user", PROFILES[:1])[0]
            if parsed.path == "/api/statuses":
                self.send_json({"statuses": current_statuses(user)})
            elif parsed.path == "/api/history":
                self.send_json({"history": history(user)})
            else:
                self.send_json({"requests": rights_requests(user)})
            return
        requested = (parsed.path.lstrip("/") or "index.html").replace("/", "")
        file_path = UI_DIR / requested
        if file_path.is_file():
            self.send_file(file_path)
        else:
            self.send_file(UI_DIR / "index.html")

    def do_POST(self):
        try:
            payload = self.read_json()
            if self.path == "/api/consent":
                user = payload["user"]
                purpose = payload["purpose"]
                action = payload["action"]
                if user not in PROFILES or purpose not in PURPOSES:
                    raise ValueError("Invalid demo profile or consent purpose.")
                notes = {
                    "Given": "Consent granted in demo",
                    "Rejected": "Consent rejected in demo",
                    "Withdrawn": "Withdrawal recorded in demo",
                }
                if action not in notes:
                    raise ValueError("Invalid consent action.")
                with connection() as conn:
                    conn.execute(
                        """
                        INSERT INTO consent_records
                        (event_time, demo_user, purpose, action, notice_version, note)
                        VALUES (?, ?, ?, ?, ?, ?)
                        """,
                        (now_text(), user, purpose, action, NOTICE_VERSION, notes[action]),
                    )
                self.send_json({"statuses": current_statuses(user)})
                return
            if self.path == "/api/rights":
                user = payload["user"]
                request_type = payload["requestType"].strip()
                details = payload.get("details", "").strip() or "No extra details supplied"
                if user not in PROFILES or not request_type:
                    raise ValueError("A valid profile and request type are required.")
                with connection() as conn:
                    conn.execute(
                        """
                        INSERT INTO rights_requests
                        (event_time, demo_user, request_type, details, status)
                        VALUES (?, ?, ?, ?, 'Received')
                        """,
                        (now_text(), user, request_type, details[:500]),
                    )
                self.send_json({"requests": rights_requests(user)})
                return
            self.send_json({"error": "Not found"}, 404)
        except (KeyError, ValueError, json.JSONDecodeError) as error:
            self.send_json({"error": str(error)}, 400)
        except sqlite3.Error as error:
            self.send_json({"error": f"Database error: {error}"}, 500)


if __name__ == "__main__":
    ensure_schema()
    server = ThreadingHTTPServer(("127.0.0.1", 8504), Handler)
    print("Know DPDPA React UI: http://127.0.0.1:8504")
    server.serve_forever()
