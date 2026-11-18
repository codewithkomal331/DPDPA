import json
import sqlite3
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from deep_translator import GoogleTranslator


APP_DIR = Path(__file__).resolve().parent
DB_PATH = APP_DIR / "consent_portal.db"
UI_DIR = APP_DIR / "react_ui"
NOTICE_VERSION = "1.0"
PROFILES = ["Student Demo", "Parent Demo", "Staff Demo"]
ORGANIZATION = {
    "name": "ABC Learning Technologies",
    "type": "Fictional Demo Organization",
}
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
        cols = [r[1] for r in conn.execute("PRAGMA table_info(consent_records)").fetchall()]
        has_extra = "organization" in cols
        extra_fields = ", email, phone, organization, knowledge_confirmed AS knowledgeConfirmed" if has_extra else ""
        query = f"""
            SELECT event_time AS time, purpose, action,
                   notice_version AS noticeVersion, note{extra_fields}
            FROM consent_records
            WHERE demo_user = ?
            ORDER BY id DESC
        """
        return [dict(row) for row in conn.execute(query, (user,)).fetchall()]


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
                note TEXT,
                email TEXT,
                phone TEXT,
                organization TEXT,
                knowledge_confirmed INTEGER DEFAULT 1
            )
            """
        )
        cols = [r[1] for r in conn.execute("PRAGMA table_info(consent_records)").fetchall()]
        if "email" not in cols:
            conn.execute("ALTER TABLE consent_records ADD COLUMN email TEXT")
        if "phone" not in cols:
            conn.execute("ALTER TABLE consent_records ADD COLUMN phone TEXT")
        if "organization" not in cols:
            conn.execute("ALTER TABLE consent_records ADD COLUMN organization TEXT")
        if "knowledge_confirmed" not in cols:
            conn.execute("ALTER TABLE consent_records ADD COLUMN knowledge_confirmed INTEGER DEFAULT 1")

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
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS demo_contacts (
                demo_user TEXT PRIMARY KEY,
                organization TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        return

    def send_error(self, code, message=None, explain=None):
        self.send_json({"error": message or f"HTTP {code}"}, status=code)

    def send_json(self, payload, status=200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
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
        req_path = parsed.path.rstrip("/")
        if req_path == "/api/health":
            self.send_json({"ok": True})
            return
        if req_path == "/api/bootstrap":
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
        if req_path in ("/api/statuses", "/api/history", "/api/rights", "/api/contact", "/api/consent"):
            user = parse_qs(parsed.query).get("user", PROFILES[:1])[0]
            if req_path == "/api/statuses":
                self.send_json({"statuses": current_statuses(user)})
            elif req_path == "/api/history":
                self.send_json({"history": history(user)})
            elif req_path == "/api/contact":
                with connection() as conn:
                    row = conn.execute(
                        "SELECT organization, email, phone, updated_at FROM demo_contacts WHERE demo_user = ?",
                        (user,)
                    ).fetchone()
                    contact = dict(row) if row else None
                self.send_json({"contact": contact})
            elif req_path == "/api/consent":
                self.send_json({"statuses": current_statuses(user), "history": history(user)})
            else:
                self.send_json({"requests": rights_requests(user)})
            return
        if req_path.startswith("/api/"):
            self.send_json({"error": "Endpoint not found"}, 404)
            return
        requested = (parsed.path.lstrip("/") or "index.html").replace("/", "")
        file_path = UI_DIR / requested
        if file_path.is_file():
            self.send_file(file_path)
        else:
            self.send_file(UI_DIR / "index.html")
    
    def do_POST(self):
        try:
            req_path = urlparse(self.path).path.rstrip("/")
            payload = self.read_json()

            if req_path == "/api/translate":
                texts = payload.get("texts", [])
                target = payload.get("target", "en")
                if not isinstance(texts, list) or not isinstance(target, str):
                    raise ValueError("Texts and target language are required.")
                if target == "en":
                    self.send_json({"translations": texts})
                    return

                translations = []
                translator = None
                try:
                    translator = GoogleTranslator(source="en", target=target)
                except Exception:
                    translator = None

                for text in texts:
                    text_str = str(text).strip()
                    if not text_str:
                        translations.append(text)
                        continue
                    translated = None
                    if translator:
                        try:
                            translated = translator.translate(text_str)
                        except Exception:
                            translated = None
                    translations.append(translated or text)
                self.send_json({"translations": translations})
                return

            if req_path == "/api/consent":
                user = payload.get("user", "").strip()
                if user not in PROFILES:
                    raise ValueError("Invalid demo profile.")

                email = payload.get("email", "").strip()
                phone = payload.get("phone", "").strip()
                organization = payload.get("organization", "").strip() or ORGANIZATION["name"]
                knowledge_confirmed = 1 if payload.get("knowledgeConfirmed", True) else 0

                if email and phone:
                    with connection() as conn:
                        conn.execute(
                            """
                            INSERT INTO demo_contacts
                            (demo_user, organization, email, phone, updated_at)
                            VALUES (?, ?, ?, ?, ?)
                            ON CONFLICT(demo_user) DO UPDATE SET
                                organization = excluded.organization,
                                email = excluded.email,
                                phone = excluded.phone,
                                updated_at = excluded.updated_at
                            """,
                            (user, organization, email, phone, now_text()),
                        )

                choices = payload.get("choices")
                purpose = payload.get("purpose")
                action = payload.get("action", "Given")
                note = payload.get("note", "")

                with connection() as conn:
                    if choices and isinstance(choices, dict):
                        for p, act in choices.items():
                            if p in PURPOSES:
                                conn.execute(
                                    """
                                    INSERT INTO consent_records
                                    (event_time, demo_user, purpose, action, notice_version, note, email, phone, organization, knowledge_confirmed)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                    """,
                                    (now_text(), user, p, act, NOTICE_VERSION, note, email, phone, organization, knowledge_confirmed),
                                )
                    elif purpose:
                        conn.execute(
                            """
                            INSERT INTO consent_records
                            (event_time, demo_user, purpose, action, notice_version, note, email, phone, organization, knowledge_confirmed)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """,
                            (now_text(), user, purpose, action, NOTICE_VERSION, note, email, phone, organization, knowledge_confirmed),
                        )
                    else:
                        raise ValueError("Purpose or choices required.")

                self.send_json({
                    "statuses": current_statuses(user),
                    "history": history(user)
                })
                return

            if req_path == "/api/contact":
                user = payload.get("user", "").strip()
                email = payload.get("email", "").strip()
                phone = payload.get("phone", "").strip()

                if user not in PROFILES:
                    raise ValueError("Invalid demo profile.")

                if not email or "@" not in email or "." not in email:
                    raise ValueError("Please enter a valid email address.")

                phone_digits = phone.replace("+", "").replace(" ", "").replace("-", "")

                if not phone_digits.isdigit() or len(phone_digits) < 10:
                    raise ValueError("Please enter a valid phone number.")

                with connection() as conn:
                    conn.execute(
                        """
                        INSERT INTO demo_contacts
                        (demo_user, organization, email, phone, updated_at)
                        VALUES (?, ?, ?, ?, ?)
                        ON CONFLICT(demo_user) DO UPDATE SET
                            organization = excluded.organization,
                            email = excluded.email,
                            phone = excluded.phone,
                            updated_at = excluded.updated_at
                        """,
                        (user, "ABC Learning Technologies", email, phone, now_text()),
                    )
                self.send_json({
                    "success": True,
                    "message": "Contact details saved successfully."
                })
                return

            if req_path == "/api/rights":
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
            self.send_json({"error": "Endpoint not found"}, 404)
        except (KeyError, ValueError, json.JSONDecodeError) as error:
            self.send_json({"error": str(error)}, 400)
        except sqlite3.Error as error:
            self.send_json({"error": f"Database error: {error}"}, 500)
        except Exception as error:
            self.send_json({"error": f"Server error: {error}"}, 500)


if __name__ == "__main__":
    ensure_schema()
    server = ThreadingHTTPServer(("127.0.0.1", 8504), Handler)
    print("Know DPDPA React UI: http://127.0.0.1:8504")
    server.serve_forever()
