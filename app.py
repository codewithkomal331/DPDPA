import streamlit as st
import sqlite3
import pandas as pd
from datetime import datetime
from pathlib import Path

# -------------------- Page setup --------------------
st.set_page_config(
    page_title="Know DPDPA | Consent Flow",
    page_icon="🔐",
    layout="wide",
    initial_sidebar_state="expanded",
)

# -------------------- Language Translation --------------------
from deep_translator import GoogleTranslator

LANGUAGES = {
    "English": "en",
    "Hindi (हिन्दी)": "hi",
    "Marathi (मराठी)": "mr",
}


@st.cache_data(show_spinner=False)
def translate_content(text, target_language):
    if not text or target_language == "en":
        return text

    try:
        return GoogleTranslator(
            source="en",
            target=target_language
        ).translate(text)
    except Exception as error:
        print("Translation error:", error)
        return text


def t(text):
    return translate_content(text, target_language)


APP_DIR = Path(__file__).resolve().parent
DB_PATH = APP_DIR / "consent_portal.db"
NOTICE_VERSION = "1.0"

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

# -------------------- Database helpers --------------------
def get_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS consent_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_time TEXT NOT NULL,
                demo_user TEXT NOT NULL,
                purpose TEXT NOT NULL,
                action TEXT NOT NULL,
                notice_version TEXT NOT NULL,
                note TEXT
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS rights_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_time TEXT NOT NULL,
                demo_user TEXT NOT NULL,
                request_type TEXT NOT NULL,
                details TEXT,
                status TEXT NOT NULL DEFAULT 'Received'
            )
        """)
        conn.commit()

def now_text():
    return datetime.now().strftime("%Y-%m-%d %I:%M:%S %p")

def add_consent_event(user, purpose, action, note="User selected an option"):
    with get_connection() as conn:
        conn.execute(
            """INSERT INTO consent_records
               (event_time, demo_user, purpose, action, notice_version, note)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (now_text(), user, purpose, action, NOTICE_VERSION, note),
        )
        conn.commit()

def current_statuses(user):
    # Latest event per purpose for the selected demo user
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT c.purpose, c.action
            FROM consent_records c
            JOIN (
                SELECT purpose, MAX(id) AS max_id
                FROM consent_records
                WHERE demo_user = ?
                GROUP BY purpose
            ) latest ON c.id = latest.max_id
            WHERE c.demo_user = ?
        """, (user, user)).fetchall()
    result = {purpose: "Not Decided" for purpose in PURPOSES}
    for row in rows:
        result[row["purpose"]] = row["action"]
    return result

def get_history(user):
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT event_time AS Time, demo_user AS 'Demo User',
                   purpose AS Purpose, action AS Action,
                   notice_version AS 'Notice Version', note AS Note
            FROM consent_records
            WHERE demo_user = ?
            ORDER BY id DESC
        """, (user,)).fetchall()
    return pd.DataFrame([dict(row) for row in rows])

def add_rights_request(user, request_type, details):
    with get_connection() as conn:
        conn.execute(
            """INSERT INTO rights_requests
               (event_time, demo_user, request_type, details, status)
               VALUES (?, ?, ?, ?, 'Received')""",
            (now_text(), user, request_type, details),
        )
        conn.commit()

def get_rights_requests(user):
    with get_connection() as conn:
        rows = conn.execute("""
            SELECT event_time AS Time, request_type AS 'Request Type',
                   details AS Details, status AS Status
            FROM rights_requests
            WHERE demo_user = ?
            ORDER BY id DESC
        """, (user,)).fetchall()
    return pd.DataFrame([dict(row) for row in rows])

init_db()

# -------------------- Styling --------------------

# -------------------- Styling --------------------
st.markdown("""
<style>
    /* Main page */
    .stApp {
        background-color: #F7FAFC !important;
        color: #102A43 !important;
    }

    .main .block-container {
        padding-top: 2rem;
        padding-bottom: 2rem;
    }

    /* Main headings and text */
    .stApp h1, .stApp h2, .stApp h3,
    .stApp h4, .stApp p, .stApp label,
    .stApp li, .stApp span {
        color: #102A43;
    }

    /* Sidebar */
    section[data-testid="stSidebar"] {
        background-color: #102A43 !important;
    }

    section[data-testid="stSidebar"] h1,
    section[data-testid="stSidebar"] h2,
    section[data-testid="stSidebar"] h3,
    section[data-testid="stSidebar"] p,
    section[data-testid="stSidebar"] label,
    section[data-testid="stSidebar"] span {
        color: #FFFFFF !important;
    }

    /* Hero section */
    .hero {
        background: linear-gradient(120deg, #102A43, #087E8B);
        color: white !important;
        padding: 2rem;
        border-radius: 15px;
        margin-bottom: 1rem;
    }

    .stApp .hero h1,
.stApp .hero p {
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
}

    /* Metrics */
    div[data-testid="stMetric"] {
        background-color: #FFFFFF !important;
        padding: 1rem;
        border-radius: 12px;
        border: 1px solid #CFE8F3;
    }

    div[data-testid="stMetric"] label,
    div[data-testid="stMetric"] [data-testid="stMetricValue"] {
        color: #102A43 !important;
    }

    /* Buttons */
    div.stButton > button,
    div.stDownloadButton > button,
    div.stFormSubmitButton > button {
        background-color: #087E8B !important;
        color: #FFFFFF !important;
        border: 1px solid #36CFC9;
        border-radius: 10px;
        font-weight: bold;
        min-height: 45px;
    }

    /* Input fields */
    .stTextInput input,
    .stTextArea textarea,
    .stSelectbox div[data-baseweb="select"],
    .stRadio label {
        color: #102A43 !important;
    }

    /* Expanders and containers */
    div[data-testid="stExpander"],
    div[data-testid="stVerticalBlockBorderWrapper"] {
        background-color: #FFFFFF !important;
        border-radius: 10px;
    }

    /* Note box */
    .note-box {
        background: #FFFFFF;
        color: #102A43 !important;
        border: 1px solid #CFE8F3;
        border-left: 5px solid #087E8B;
        border-radius: 10px;
        padding: 1rem;
    }

    .note-box b {
        color: #102A43 !important;
    }


    /* ---------- FIX STREAMLIT ALERT TEXT ---------- */

    div[data-testid="stAlert"] {
        background: #EAF4FF !important;
        border: 1px solid #B7D8F0 !important;
        border-radius: 12px !important;
    }

    div[data-testid="stAlert"] [data-testid="stMarkdownContainer"] p,
    div[data-testid="stAlert"] [data-testid="stMarkdownContainer"] span,
    div[data-testid="stAlert"] [data-testid="stMarkdownContainer"] strong {
        color: #17324D !important;
        -webkit-text-fill-color: #17324D !important;
    }

    /* Alert icons */
    div[data-testid="stAlert"] svg {
        color: #087E8B !important;
        fill: none !important;
    }

</style>
""", unsafe_allow_html=True)

# -------------------- Sidebar and navigation --------------------
target_language = "en"
st.sidebar.markdown(t("## 🔐 Know DPDPA"))

st.sidebar.markdown(t("### 🌐 Select Language"))

selected_language = st.sidebar.selectbox(
    t("Choose your language"),
    list(LANGUAGES.keys()),
    key="portal_language"
)

target_language = LANGUAGES[selected_language]

st.sidebar.caption(t("Education • Consent • Transparency"))
pages = [
    "Home",
    "Know DPDPA",
    "DPDPA Notes",
    "Important Points",
    "Practice Questions",
    "Final Test",
    "My Performance",
    "Certificate",
    "Consent Flow",
    "Consent Dashboard",
    "Consent History",
    "Rights Requests",
    "About Project"
]

if "page_nav" not in st.session_state:
    st.session_state["page_nav"] = "Home"
if "next_page" in st.session_state:
    st.session_state["page_nav"] = st.session_state.pop("next_page")

page = st.sidebar.radio(t("Navigate portal"), pages, key="page_nav")
st.sidebar.divider()
demo_user = st.sidebar.selectbox(
    t("Choose demo profile"),
    ["Student Demo", "Parent Demo", "Staff Demo"],
    help=t("This is a demonstration profile selector, not secure login/authentication.")
)
st.sidebar.info(t("Prototype: use fictional data only. Consent records are stored in a local SQLite database on this computer."))
st.sidebar.caption(t(f"Privacy notice version: {NOTICE_VERSION}"))

statuses = current_statuses(demo_user)


# -------------------- Home Dashboard --------------------
if page == "Home":

    # Learning progress
    total_chapters = 15
    completed_chapters = len(
    st.session_state.get("dpdpa_completed_chapters", [])
    )

    completed_chapters = min(completed_chapters, total_chapters)

    st.markdown("""
    <div class="hero">
        <h1>🔐 Know DPDPA Portal</h1>
        <p>Learn Data Privacy. Understand Your Rights. Manage Your Consent.</p>
    </div>
    """, unsafe_allow_html=True)

    st.write(
        t("Welcome to your digital privacy learning platform. "
        "Explore the Digital Personal Data Protection Act, understand "
        "your rights, practise your knowledge and manage consent.")
    )

    st.divider()

    # Dashboard metrics
    st.subheader(t("📊 Your Portal Overview"))

    c1, c2, c3 = st.columns(3)

    c1.metric(
        t("Learning Chapters"),
        f"{completed_chapters}/{total_chapters}",
        t("Completed")
    )

    c2.metric(
        t("Consent Purposes"),
        len(PURPOSES)
    )

    c3.metric(
        t("Recorded Actions"),
        len(get_history(demo_user))
    )

    st.write(t("**Your Learning Progress**"))
    st.progress(completed_chapters / total_chapters)
    st.caption(
        t(f"You have completed {completed_chapters} out of "
        f"{total_chapters} learning chapters."
        )
    )

    st.divider()

    # Main learning sections
    st.subheader(t("📚 Explore Learning Resources"))

    col1, col2 = st.columns(2)

    with col1:
        st.markdown("### 📘 Know DPDPA")
        st.write("Learn DPDPA concepts through structured learning chapters.")

        if st.button("Start Learning", key="home_learning", use_container_width=True):
            st.session_state["next_page"] = "Know DPDPA"
            st.rerun()

        st.markdown("### 📖 DPDPA Notes")
        st.write("Read detailed notes, definitions and explanations.")

        if st.button("Read Complete Notes", key="home_notes", use_container_width=True):
            st.session_state["next_page"] = "DPDPA Notes"
            st.rerun()

        st.markdown("### ⭐ Important Points")
        st.write("Revise important definitions and key concepts.")

        if st.button("View Important Points", key="home_points", use_container_width=True):
            st.session_state["next_page"] = "Important Points"
            st.rerun()

    with col2:
        st.markdown("### 📝 Practice Questions")
        st.write("Test your understanding with topic-wise questions.")

        if st.button("Start Practice", key="home_practice", use_container_width=True):
            st.session_state["next_page"] = "Practice Questions"
            st.rerun()

        st.markdown("### 🏆 Final Test")
        st.write("Attempt the final assessment of your DPDPA knowledge.")

        if st.button("Take Final Test", key="home_test", use_container_width=True):
            st.session_state["next_page"] = "Final Test"
            st.rerun()

        st.markdown("### 📈 My Performance")
        st.write("Review your learning progress and test performance.")

        if st.button("View Performance", key="home_performance", use_container_width=True):
            st.session_state["next_page"] = "My Performance"
            st.rerun()

    st.divider()

    # Consent management
    st.subheader("🛡️ Consent Management")

    a, b = st.columns(2)

    with a:
        st.markdown("### 🔐 Consent Flow")
        st.write("Read a sample privacy notice and manage consent choices.")

        if st.button("Manage Consent", key="home_consent", use_container_width=True):
            st.session_state["next_page"] = "Consent Flow"
            st.rerun()

    with b:
        st.markdown("### 📊 Consent Dashboard")
        st.write("Review your recorded consent status.")

        if st.button("Open Dashboard", key="home_dashboard", use_container_width=True):
            st.session_state["next_page"] = "Consent Dashboard"
            st.rerun()

    a, b = st.columns(2)

    with a:
        st.markdown("### 📜 Consent History")
        st.write("Check previously recorded consent actions.")

        if st.button("View History", key="home_history", use_container_width=True):
            st.session_state["next_page"] = "Consent History"
            st.rerun()

    with b:
        st.markdown("### ⚖️ Rights Requests")
        st.write("Explore sample data principal rights requests.")

        if st.button("Explore Rights", key="home_rights", use_container_width=True):
            st.session_state["next_page"] = "Rights Requests"
            st.rerun()

    st.divider()

    # Other resources
    st.subheader("🎓 More Resources")

    a, b = st.columns(2)

    with a:
        st.markdown("### 🎖️ Certificate")
        st.write("View your learning certificate section.")

        if st.button("Open Certificate", key="home_certificate", use_container_width=True):
            st.session_state["next_page"] = "Certificate"
            st.rerun()

    with b:
        st.markdown("### ℹ️ About Project")
        st.write("Know more about the project, its objectives and features.")

        if st.button("About This Project", key="home_about", use_container_width=True):
            st.session_state["next_page"] = "About Project"
            st.rerun()

    st.markdown("""
    <div class="note-box">
        <b>Suggested Learning Journey:</b><br>
        Learn DPDPA → Read Notes → Revise Important Points →
        Practise Questions → Take Final Test → Explore Consent Management.
    </div>
    """, unsafe_allow_html=True)

    st.caption(
        "Educational project prototype. This portal does not replace "
        "official legal guidance or professional legal advice."
    )


# -------------------- Important Points --------------------
elif page == "Important Points":
    st.title("⭐ Important Points of DPDPA")

    st.write("Quick revision of important concepts.")

    points = [
        ("DPDP Act, 2023", "India's law dealing with the processing of digital personal data."),
        ("Personal Data", "Data about an individual who is identifiable by or in relation to that data."),
        ("Data Principal", "The individual to whom the personal data relates."),
        ("Data Fiduciary", "The person who determines the purpose and means of processing personal data."),
        ("Consent", "Consent must be free, specific, informed, unconditional and unambiguous, with a clear affirmative action."),
        ("Consent Withdrawal", "A Data Principal can withdraw consent, and withdrawing should be as easy as giving it."),
        ("Data Processor", "A person who processes personal data on behalf of a Data Fiduciary."),
        ("Children's Data", "The Act has special requirements for processing children's personal data, subject to applicable provisions."),
        ("Data Breach", "A breach involving unauthorised processing or accidental disclosure, acquisition, sharing, use, alteration, destruction or loss of access to personal data."),
        ("Data Principal Rights", "Rights include access to information, correction, erasure, grievance redressal and nomination, subject to the Act."),
    ]

    for title_text, detail in points:
        with st.expander(title_text):
            st.write(detail)

    st.success("Revision complete! Read these points before attempting the practice questions.")



elif page == "DPDPA Notes":
    st.title("Complete DPDPA Notes")
    st.write("Learn about India's Digital Personal Data Protection Act in simple language.")

    st.info("These notes are for learning and understanding. They are not legal advice.")

    notes = [
        (
            "1. Introduction to the DPDP Act",
            """
            The Digital Personal Data Protection Act, 2023 is an Indian law
            related to the protection of digital personal data.

            Its main purpose is to protect an individual's personal data
            while allowing organisations to use data for lawful purposes.

            Simple example:
            When you create an account on a website, you may share your
            name, email address and phone number. This information should
            be handled responsibly.
            """
        ),
        (
            "2. What is Personal Data?",
            """
            Personal data means information about an individual who can
            be identified through that information.

            Examples:
            - Name
            - Mobile number
            - Email address
            - Address
            - Information linked to an identifiable person

            Remember:
            Personal data is not limited to one particular type of information.
            Different pieces of information may identify a person when combined.
            """
        ),
        (
            "3. What is Digital Personal Data?",
            """
            Digital personal data means personal data in digital form.

            Examples:
            - Information stored in a computer
            - Details saved in a mobile application
            - Customer records stored in a database
            - Personal information collected through a website

            Simple example:
            When you enter your email address in an online registration form,
            that information is collected in digital form.
            """
        ),
    ]

    for heading, content in notes:
        with st.expander(heading):
            st.write(content)

    st.warning(
        "Next chapters will cover definitions, consent, rights, duties, "
        "children's data, data breaches and DPDP Rules 2025."
    )

# -------------------- Practice Questions --------------------
elif page == "Practice Questions":
    st.title("📝 DPDPA Practice Questions")
    st.write("Test your understanding of the DPDPA notes.")

    questions = [
        {
            "question": "1. In which year was the DPDP Act passed?",
            "options": ["2021", "2022", "2023", "2025"],
            "answer": "2023",
            "explanation": "The Digital Personal Data Protection Act was passed in 2023."
        },
        {
            "question": "2. Who is a Data Principal?",
            "options": ["The individual whose data is involved", "A database", "A software company", "A government website"],
            "answer": "The individual whose data is involved",
            "explanation": "Data Principal means the individual to whom the personal data relates."
        },
        {
            "question": "3. What is digital personal data?",
            "options": ["Only paper records", "Personal data in digital form", "Only passwords", "Only photographs"],
            "answer": "Personal data in digital form",
            "explanation": "Digital personal data is personal data in digital form."
        },
        {
            "question": "4. Who determines the purpose and means of processing personal data?",
            "options": ["Data Principal", "Data Fiduciary", "Data Processor only", "Website visitor"],
            "answer": "Data Fiduciary",
            "explanation": "A Data Fiduciary determines the purpose and means of processing personal data."
        },
        {
            "question": "5. Which action can a Data Principal take regarding consent?",
            "options": ["Withdraw consent", "Change the law", "Delete every company's database", "Appoint a Data Fiduciary"],
            "answer": "Withdraw consent",
            "explanation": "A Data Principal can withdraw consent where processing is based on consent."
        }
    ]

    with st.form("practice_form"):
        answers = []

        for i, q in enumerate(questions):
            st.subheader(q["question"])
            selected = st.radio(
                "Choose your answer:",
                q["options"],
                key=f"practice_{i}"
            )
            answers.append(selected)

        submitted = st.form_submit_button("Submit Answers")

    if submitted:
        score = 0
        st.subheader("📊 Your Result")

        for i, q in enumerate(questions):
            if answers[i] == q["answer"]:
                score += 1
                st.success(f"Q{i+1}: Correct! {q['explanation']}")
            else:
                st.error(
                    f"Q{i+1}: Incorrect. Correct answer: {q['answer']}. "
                    f"{q['explanation']}"
                )

        st.metric("Your Score", f"{score}/{len(questions)}")
        st.progress(score / len(questions))
        st.session_state["practice_score"] = score


# -------------------- KNOW DPDPA: COMPLETE LEARNING COURSE --------------------
elif page == "Know DPDPA":

    import streamlit as st

    st.title("📘 Know DPDPA")
    st.subheader("Complete Digital Personal Data Protection Learning Course")

    st.write(
        "Welcome to the DPDPA learning centre! This course will help you "
        "understand digital personal data protection from beginner to advanced level."
    )

    st.markdown("""
<div style="
    background-color: #EAF4FF;
    color: #17324D;
    padding: 18px 22px;
    border-radius: 12px;
    border-left: 5px solid #087E8B;
    margin: 15px 0;
">
    <b style="color:#102A43;">🎯 Course Goal:</b>
    <span style="color:#17324D;">
        Learn how personal data is collected, processed, stored,
        protected and deleted under India's Digital Personal
        Data Protection Act, 2023.
    </span>
</div>
""", unsafe_allow_html=True)

    # Learning Path



# -------------------- ROLE BASED LEARNING PATH --------------------

role = st.selectbox(
    "🎓 Choose Your Learning Path",
    [
        "Student / General User",
        "Developer / Engineer",
        "Compliance Learner",
        "Business User",
        "Data Protection Officer (Learning Path)"
    ],
    key="dpdpa_learning_role"
)

role_details = {
    "Student / General User": {
        "description": "Learn how to protect your personal information and understand your privacy rights.",
        "focus": [
            "Introduction to DPDPA",
            "Understanding Personal Data",
            "Data Principal and Rights",
            "Consent and Withdrawal",
            "Privacy Awareness"
        ]
    },

    "Developer / Engineer": {
        "description": "Learn how to develop secure applications and protect personal data using technical practices.",
        "focus": [
            "Personal Data in Software Applications",
            "Secure Database Management",
            "Authentication and Access Control",
            "Encryption and Data Security",
            "Personal Data Breach Handling"
        ]
    },

    "Compliance Learner": {
        "description": "Understand DPDPA requirements and organisational compliance responsibilities.",
        "focus": [
            "DPDPA Legal Framework",
            "Privacy Notice Requirements",
            "Consent and Lawful Processing",
            "Data Fiduciary Obligations",
            "Grievance Redressal and Compliance"
        ]
    },

    "Business User": {
        "description": "Understand how businesses should collect, use and protect customer information.",
        "focus": [
            "Customer Personal Data",
            "Purpose of Data Collection",
            "Privacy Notices for Customers",
            "Consent Management",
            "Business Data Protection Responsibilities"
        ]
    },

    "Data Protection Officer (Learning Path)": {
        "description": "Learn about data governance, accountability, risk assessment and monitoring.",
        "focus": [
            "Data Governance",
            "Data Protection Impact Assessment",
            "Data Security and Breach Response",
            "Compliance Monitoring",
            "Audit and Accountability"
        ]
    }
}

# Get selected role details
selected_role = role_details[role]

# Display role description
st.markdown(f"""
<div style="
    background-color:#E6F6ED;
    padding:20px;
    border-radius:12px;
    border-left:5px solid #239B56;
">
    <h4 style="color:#145A32;">✓ {role}</h4>
    <p style="color:#145A32;">{selected_role["description"]}</p>
</div>
""", unsafe_allow_html=True)

st.subheader("🎯 Your Role-Based Learning Focus")


for topic in selected_role["focus"]:
    st.markdown(f"- {topic}")

st.markdown("---")


st.subheader("📚 Course Overview")

col1, col2, col3 = st.columns(3)
col1.metric("Total Chapters", "15")
col2.metric("Learning Level", "Beginner to Advanced")
col3.metric("Course Type", "Self-Paced")

st.markdown("---")

# Complete Course Chapters
chapters = [

        {
            "title": "Chapter 1: Introduction to DPDPA",
            "content": """
### 1.1 What is DPDPA?

DPDPA stands for the Digital Personal Data Protection Act, 2023.

It is an Indian law designed to regulate the processing of digital personal
data and protect the privacy of individuals.

The Act establishes responsibilities for organisations that process
digital personal data and provides rights to individuals whose data is processed.

### 1.2 Why was this Act introduced?

Today, people use:
- Online shopping applications
- Banking applications
- Social media platforms
- Educational websites
- Healthcare applications
- Government digital services

These platforms may collect personal information from users.

The DPDPA provides a legal framework for handling such information responsibly.

### 1.3 Main objectives

1. Protect individuals' digital personal data.
2. Establish rules for lawful data processing.
3. Promote transparency in data collection.
4. Provide rights to Data Principals.
5. Define responsibilities of Data Fiduciaries.
6. Establish a framework for data breach reporting.

### 1.4 Example

When a student registers on an online learning platform, the platform may
collect their name, email address and phone number.

The organisation must handle this data according to applicable legal requirements.

### Remember

DPDPA is about protecting digital personal data while allowing lawful
processing for legitimate purposes.
""",
            "question": "What is the main purpose of DPDPA?",
            "options": [
                "To regulate digital personal data processing",
                "To create social media accounts",
                "To regulate computer hardware",
                "To provide free internet"
            ],
            "answer": "To regulate digital personal data processing",
            "explanation": "The Act establishes a framework for protecting digital personal data and regulating its processing."
        },

        {
            "title": "Chapter 2: Need and Importance of Data Protection",
            "content": """
### 2.1 What is Data Protection?

Data protection means safeguarding personal information against
unauthorised access, misuse, loss, alteration or disclosure.

### 2.2 Why is data protection important?

Personal information is used in almost every digital service.

Without proper protection, information can be misused for:
- Identity theft
- Financial fraud
- Unwanted marketing
- Phishing attacks
- Unauthorised sharing
- Privacy violations

### 2.3 Importance for individuals

- Protects personal privacy.
- Helps prevent identity misuse.
- Improves control over personal information.
- Promotes transparency.
- Builds trust in digital services.

### 2.4 Importance for organisations

- Encourages responsible data handling.
- Improves customer confidence.
- Promotes accountability.
- Helps establish data security practices.
- Supports compliance with applicable laws.

### 2.5 Real-life example

Imagine an online shopping website stores customer names, phone numbers
and delivery addresses without proper security.

If attackers access the database, customers' personal information may be exposed.

Proper security measures help reduce such risks.
""",
            "question": "Which of the following is a data protection objective?",
            "options": [
                "Preventing unauthorised access to personal data",
                "Sharing passwords publicly",
                "Collecting unnecessary information",
                "Ignoring security incidents"
            ],
            "answer": "Preventing unauthorised access to personal data",
            "explanation": "Data protection includes safeguarding information against unauthorised access and misuse."
        },

        {
            "title": "Chapter 3: Understanding Personal Data",
            "content": """
### 3.1 What is Personal Data?

Personal data means any data about an individual who is identifiable
by or in relation to such data.

It can identify a person directly or indirectly.

### 3.2 Examples of Personal Data

- Full name
- Mobile number
- Email address
- Residential address
- Photograph
- Customer ID
- Online account identifier
- Digital records linked to an identifiable person

Whether information qualifies as personal data depends on its context
and whether it relates to an identifiable individual.

### 3.3 Digital Personal Data

Digital personal data is personal data in digital form.

Examples:
- Information entered in online forms.
- Customer information stored in databases.
- Digital application registration details.
- Personal information stored in cloud systems.

### 3.4 What is NOT necessarily Personal Data?

Information that does not relate to an identifiable individual
may not qualify as personal data.

For example, genuinely anonymised statistical information that
cannot identify an individual.

### 3.5 Real-life example

A college collects a student's name, roll number, email address
and examination results through an online portal.

These records can relate to an identifiable student and therefore
may constitute personal data.
""",
            "question": "Which is an example of personal data?",
            "options": [
                "An individual's email address",
                "A random mathematical formula",
                "A general weather description",
                "An unidentified colour code"
            ],
            "answer": "An individual's email address",
            "explanation": "An email address can identify or relate to an identifiable individual."
        },

        {
            "title": "Chapter 4: Data Principal",
            "content": """
### 4.1 Who is a Data Principal?

A Data Principal is the individual to whom the personal data relates.

In simple language, the person whose information is being collected
or processed is called the Data Principal.

### 4.2 Examples

- A student registering on a college portal.
- A customer using a shopping application.
- A person opening a bank account.
- A patient registering on a digital healthcare platform.

### 4.3 Rights of a Data Principal

Under the DPDPA, applicable rights include:

1. Right to access information about personal data.
2. Right to correction and completion.
3. Right to updating personal data.
4. Right to erasure, subject to applicable requirements.
5. Right to grievance redressal.
6. Right to nominate another individual.

### 4.4 Real-life example

A student discovers that their registered phone number is incorrect.

The student can exercise the applicable right to request correction
of their personal data.
""",
            "question": "Who is called a Data Principal?",
            "options": [
                "The individual to whom personal data relates",
                "The organisation storing all data",
                "The software developer",
                "The internet service provider"
            ],
            "answer": "The individual to whom personal data relates",
            "explanation": "The Data Principal is the individual whose personal data is being processed."
        },

        {
            "title": "Chapter 5: Data Fiduciary and Data Processor",
            "content": """
### 5.1 What is a Data Fiduciary?

A Data Fiduciary is a person who, alone or in conjunction with others,
determines the purpose and means of processing personal data.

In simple language, it decides why and how personal data is processed.

### 5.2 What is a Data Processor?

A Data Processor processes personal data on behalf of a Data Fiduciary.

### 5.3 Difference

Data Fiduciary:
- Determines the purpose of processing.
- Determines the means of processing.
- Has responsibilities under the Act.

Data Processor:
- Processes data on behalf of the Data Fiduciary.
- Acts according to the relevant arrangement and instructions.

### 5.4 Example

An online shopping company collects customer details to deliver products.

The shopping company determines why and how the information is processed.

It hires an external technology company to maintain its database.

The shopping company may be the Data Fiduciary, while the technology
company may act as its Data Processor.

### Remember

The Data Fiduciary and Data Processor have different roles.
Do not confuse the two.
""",
            "question": "Who determines the purpose and means of processing personal data?",
            "options": [
                "Data Fiduciary",
                "Data Principal",
                "Internet user",
                "Delivery agent"
            ],
            "answer": "Data Fiduciary",
            "explanation": "A Data Fiduciary determines the purpose and means of processing personal data."
        },

        {
            "title": "Chapter 6: Consent and Its Requirements",
            "content": """
### 6.1 What is Consent?

Consent is permission given by an individual for processing their
personal data for a specified purpose.

Under the DPDPA, consent must be free, specific, informed,
unconditional and unambiguous, with a clear affirmative action.

### 6.2 Important Requirements

1. Free: Consent should be given voluntarily.
2. Specific: It should relate to a specified purpose.
3. Informed: The individual should understand what they are agreeing to.
4. Unconditional: It should meet the requirements of the Act.
5. Unambiguous: It should clearly communicate agreement.
6. Affirmative Action: The individual must take a clear action.

### 6.3 Example

A mobile application asks:

"Do you agree to share your email address to receive account-related updates?"

The user actively selects the consent option.

### 6.4 Invalid Consent Practices

- Pre-selected consent boxes.
- Hidden consent conditions.
- Misleading permission requests.
- Combining unrelated purposes without proper choice.

### Remember

Consent is not simply clicking any button.
It must satisfy the legal requirements.
""",
            "question": "Which is an important requirement of consent under DPDPA?",
            "options": [
                "Free and informed",
                "Hidden and automatic",
                "Forced and unclear",
                "Permanent and irreversible"
            ],
            "answer": "Free and informed",
            "explanation": "Consent must be free, specific, informed, unconditional and unambiguous."
        },

        {
            "title": "Chapter 7: Privacy Notice",
            "content": """
### 7.1 What is a Privacy Notice?

A Privacy Notice is information provided to individuals explaining
how their personal data will be processed.

Under the DPDPA, a notice for consent-based processing must communicate
the relevant details in a clear and understandable manner.

### 7.2 What should a notice contain?

- Personal data being collected.
- Purpose of processing.
- How consent can be withdrawn.
- How Data Principal rights can be exercised.
- How a complaint can be made to the Board.

The notice must meet the applicable requirements, including being
clear, understandable and appropriately presented.

### 7.3 Why is it important?

- Creates transparency.
- Helps people make informed decisions.
- Explains the purpose of data collection.
- Supports informed consent.

### 7.4 Example

A college portal displays:

"We collect your name, email and roll number to manage student
registration and academic communication."

This helps students understand why their data is required.
""",
            "question": "What is the main purpose of a Privacy Notice?",
            "options": [
                "To explain personal data processing",
                "To hide data collection",
                "To publish user passwords",
                "To replace all security systems"
            ],
            "answer": "To explain personal data processing",
            "explanation": "A notice explains the relevant information about personal data processing and consent."
        },

        {
            "title": "Chapter 8: Consent Manager",
            "content": """
### 8.1 What is a Consent Manager?

A Consent Manager is a person registered with the Data Protection
Board of India who acts as a single point of contact to enable
a Data Principal to give, manage, review and withdraw consent
through an accessible, transparent and interoperable platform.

### 8.2 Main Functions

- Enables consent management.
- Helps individuals view consent choices.
- Supports giving consent.
- Supports reviewing consent.
- Supports withdrawing consent.

### 8.3 Example

A user uses a registered Consent Manager platform to review
the consent choices associated with different services.

The user can manage those choices through the platform.
""",
            "question": "What is a key function of a Consent Manager?",
            "options": [
                "Enabling management of consent",
                "Selling personal data",
                "Creating passwords for all users",
                "Deleting every organisation's database"
            ],
            "answer": "Enabling management of consent",
            "explanation": "A Consent Manager provides a platform for managing consent choices."
        },

        {
            "title": "Chapter 9: Withdrawal of Consent",
            "content": """
### 9.1 What is Withdrawal of Consent?

Withdrawal means taking back previously given consent.

The Data Principal has the right to withdraw consent at any time.

### 9.2 Important Rule

The ease of withdrawing consent should be comparable to the ease
with which consent was given.

### 9.3 What happens after withdrawal?

The Data Fiduciary must, within a reasonable time, cease processing
the personal data for which consent was withdrawn and cause its
Data Processor to cease processing it, unless processing without
consent is required or authorised by law.

### 9.4 Example

A user gives consent to receive promotional emails from an online store.

Later, the user withdraws consent.

The organisation must stop processing the data for that consent-based
promotional purpose, subject to applicable legal requirements.

### Remember

Withdrawal is an important part of individual control over personal data.
""",
            "question": "How easy should consent withdrawal be?",
            "options": [
                "As easy as giving consent",
                "Much harder than giving consent",
                "Only through a court order in every case",
                "It should never be available"
            ],
            "answer": "As easy as giving consent",
            "explanation": "The ease of withdrawal should be comparable to the ease of giving consent."
        },

        {
            "title": "Chapter 10: Rights of Data Principals",
            "content": """
### 10.1 What are Data Principal Rights?

These are rights provided to individuals under the DPDPA
in relation to their personal data.

### 10.2 Main Rights

1. Right to access information about personal data.
2. Right to correction of inaccurate or misleading personal data.
3. Right to completion of incomplete personal data.
4. Right to updating personal data.
5. Right to erasure, subject to applicable legal requirements.
6. Right to grievance redressal.
7. Right to nominate another individual.

### 10.3 Right to Access

An individual can request relevant information about personal data
being processed, as provided under the Act.

### 10.4 Right to Correction

An individual can request correction of inaccurate or misleading data.

### 10.5 Right to Erasure

An individual can request erasure of personal data where applicable.
However, organisations may need to retain data when required by law.

### 10.6 Right to Grievance Redressal

Individuals can use the applicable grievance redressal mechanism.

### 10.7 Right to Nominate

An individual can nominate another person to exercise their rights
in the event of death or incapacity, in accordance with the Act.

### Example

A user notices that their address is incorrect in a banking application.
They can request correction through the applicable process.
""",
            "question": "Which right allows an individual to request correction of inaccurate data?",
            "options": [
                "Right to Correction",
                "Right to Nomination",
                "Right to Marketing",
                "Right to Advertising"
            ],
            "answer": "Right to Correction",
            "explanation": "The right to correction enables a Data Principal to request correction of inaccurate or misleading personal data."
        },

        {
            "title": "Chapter 11: Duties of Data Principals",
            "content": """
### 11.1 What are Data Principal Duties?

The DPDPA also specifies duties that individuals must follow
while exercising their rights.

### 11.2 Important Duties

A Data Principal must:

1. Comply with applicable laws while exercising rights.
2. Not impersonate another person.
3. Not suppress material information while providing information.
4. Not register a false or frivolous grievance or complaint.
5. Provide authentic information when seeking correction or erasure.

### 11.3 Example

A person must not use another individual's identity to submit
a personal data rights request.

### Remember

The Act provides rights as well as responsibilities.
""",
            "question": "Which is a duty of a Data Principal?",
            "options": [
                "Not impersonating another person",
                "Sharing another person's password",
                "Submitting false complaints",
                "Misusing another person's identity"
            ],
            "answer": "Not impersonating another person",
            "explanation": "The Act requires Data Principals not to impersonate another person."
        },

        {
            "title": "Chapter 12: Responsibilities of Data Fiduciaries",
            "content": """
### 12.1 What are Data Fiduciary Responsibilities?

A Data Fiduciary must process personal data in accordance with
the DPDPA and applicable rules.

### 12.2 Important Responsibilities

- Process personal data lawfully.
- Provide required notices.
- Obtain valid consent where consent is the basis.
- Implement reasonable security safeguards.
- Protect personal data.
- Report personal data breaches as required.
- Establish grievance redressal mechanisms.
- Erase personal data when required under the Act.
- Ensure compliance by Data Processors through appropriate arrangements.

### 12.3 Significant Data Fiduciary

The Central Government may notify certain Data Fiduciaries
as Significant Data Fiduciaries based on prescribed factors.

Additional requirements may apply, including appointment of a
Data Protection Officer, an independent data auditor and
periodic impact assessments as prescribed.

### 12.4 Example

An online education company collects student details.

It should have suitable security measures, a clear data processing
purpose and mechanisms for handling user requests.
""",
            "question": "Who is responsible for complying with the duties of a Data Fiduciary?",
            "options": [
                "The Data Fiduciary",
                "Only the internet user",
                "Only the customer",
                "The delivery company in every case"
            ],
            "answer": "The Data Fiduciary",
            "explanation": "The Data Fiduciary is responsible for meeting its obligations under the Act."
        },

        {
            "title": "Chapter 13: Personal Data Breach and Security",
            "content": """
### 13.1 What is a Personal Data Breach?

A personal data breach is an unauthorised processing of personal data
or accidental disclosure, acquisition, sharing, use, alteration,
destruction or loss of access that compromises its confidentiality,
integrity or availability.

### 13.2 Common Causes

- Weak passwords.
- Phishing attacks.
- Unauthorised database access.
- Malware.
- Accidental sharing.
- Insecure storage.

### 13.3 Security Safeguards

Organisations should implement reasonable security safeguards, such as:

- Encryption and appropriate access controls.
- Strong authentication.
- Regular security checks.
- Backup and recovery procedures.
- Employee awareness.
- Monitoring and incident response.

### 13.4 Breach Reporting

The Data Fiduciary must notify the Data Protection Board of India
and affected Data Principals in the manner and within the timelines
prescribed by the applicable Rules.

### 13.5 Example

A college database containing student contact details is accessed
by an unauthorised person.

This may constitute a personal data breach and trigger applicable
notification obligations.
""",
            "question": "Which of these can cause a personal data breach?",
            "options": [
                "Unauthorised database access",
                "Using strong passwords",
                "Regular security audits",
                "Proper access controls"
            ],
            "answer": "Unauthorised database access",
            "explanation": "Unauthorised access can compromise personal data and may result in a breach."
        },

        {
            "title": "Chapter 14: Children's Personal Data",
            "content": """
### 14.1 Who is a Child under DPDPA?

Under the Act, a child means an individual who has not completed
the age of 18 years.

### 14.2 Parental Consent

A Data Fiduciary must obtain verifiable consent of the parent
or lawful guardian before processing a child's personal data,
subject to applicable exemptions.

### 14.3 Important Protections

The Act provides restrictions on:

- Processing that is likely to cause detrimental effects on children.
- Tracking or behavioural monitoring of children.
- Targeted advertising directed at children.

These restrictions are subject to the provisions and exemptions
under the Act and applicable Rules.

### 14.4 Example

A gaming application collects personal information from a child.

The organisation must consider the special requirements applicable
to children's personal data.
""",
            "question": "What is the age limit for a child under DPDPA?",
            "options": [
                "Below 18 years",
                "Below 16 years",
                "Below 21 years",
                "Below 25 years"
            ],
            "answer": "Below 18 years",
            "explanation": "The Act defines a child as an individual who has not completed 18 years of age."
        },

        {
            "title": "Chapter 15: Data Protection Board of India",
            "content": """
### 15.1 What is the Data Protection Board of India?

The Data Protection Board of India is the statutory body established
under the DPDPA.

It performs functions assigned by the Act, including dealing with
complaints and inquiries relating to personal data breaches and
non-compliance.

### 15.2 Main Functions

- Inquire into personal data breaches.
- Deal with complaints under the Act.
- Examine non-compliance.
- Exercise powers provided under the Act.
- Impose penalties where legally justified.

### 15.3 Why is it important?

It provides an institutional mechanism for addressing violations
and enforcing the provisions of the Act.

### 15.4 Example

If a Data Fiduciary fails to meet applicable obligations,
the matter may be addressed through the statutory mechanisms
provided under the Act.

### Final Learning

The Data Protection Board is an important part of the
DPDPA enforcement framework.
""",
            "question": "What is the role of the Data Protection Board of India?",
            "options": [
                "Perform functions related to enforcement of the Act",
                "Create private social media accounts",
                "Provide internet connections",
                "Manage college examinations"
                    ],
        "answer": "Perform functions related to enforcement of the Act",
        "explanation": "The Board performs statutory functions including inquiries and handling matters under the Act."
    }
]

 
# Progress tracking
if "dpdpa_completed_chapters" not in st.session_state:
    st.session_state.dpdpa_completed_chapters = []

completed = len(st.session_state.dpdpa_completed_chapters)
total = len(chapters)

st.subheader("📊 Your Learning Progress")

if total > 0:
    st.progress(completed / total)

st.write(f"Completed Chapters: {completed} / {total}")

st.markdown("---")

# Chapter selection
st.subheader("📖 Start Learning")

selected_chapter = st.selectbox(
    "Select a chapter to study",
    [chapter["title"] for chapter in chapters],
    key="dpdpa_selected_chapter"
)

current = next(
    chapter for chapter in chapters
    if chapter["title"] == selected_chapter
)

st.markdown(f"## {current['title']}")
st.markdown(current["content"])

st.markdown("---")

# Knowledge check
st.subheader("🧠 Chapter Knowledge Check")
st.write(current["question"])

user_answer = st.radio(
    "Choose your answer:",
    current["options"],
    key="check_" + selected_chapter
)

if st.button("Check My Answer", key="submit_" + selected_chapter):
    if user_answer == current["answer"]:
        st.success("Excellent! Your answer is correct.")
        st.info(current["explanation"])
    else:
        st.error(" Not quite right. Please revise the chapter.")
        st.info("Explanation: " + current["explanation"])

st.markdown("---")

# Mark chapter as completed
if selected_chapter in st.session_state.dpdpa_completed_chapters:
    st.success("✅ You have completed this chapter.")
else:
    if st.button(
        "✅ Mark Chapter as Completed",
        key="complete_" + selected_chapter
    ):
        st.session_state.dpdpa_completed_chapters.append(selected_chapter)
        st.success("Chapter marked as completed!")
        st.rerun()

st.markdown("---")

# Course completion
if completed == total:
        st.balloons()
        st.success("🎓 Congratulations! You have completed all 15 chapters.")

        st.subheader("📌 Important Course Note")

        st.warning(
        "This course is for educational purposes only. It provides a "
        "beginner-friendly summary of the Digital Personal Data "
        "Protection Act, 2023. For legal interpretation, consult "
        "the official Act, applicable Rules and qualified legal experts."
    )

# -------------------- Quiz --------------------
elif page == "Quiz":
    st.title("🧠 Privacy Awareness Quiz")
    st.write("Answer the three questions and submit to see your score.")
    with st.form("quiz_form"):
        q1 = st.radio("1. What should a privacy notice explain?", [
            "Only the company name", "What data is requested and why", "The user's password"
        ])
        q2 = st.radio("2. What should a consent screen provide?", [
            "A clear purpose and meaningful choices", "Only a hidden accept button", "No information about data use"
        ])
        q3 = st.radio("3. Where can you review consent actions in this prototype?", [
            "Consent History", "Only the Home page", "Nowhere"
        ])
        submitted = st.form_submit_button("Submit Quiz", use_container_width=True)
    if submitted:
        score = int(q1 == "What data is requested and why") + int(
            q2 == "A clear purpose and meaningful choices"
        ) + int(q3 == "Consent History")
        st.session_state["quiz_score"] = score
    if st.session_state.get("quiz_score") is not None:
        score = st.session_state["quiz_score"]
        st.metric("Your score", f"{score}/3")
        st.progress(score / 3)
        st.success("Excellent work!" if score == 3 else "Review the learning modules and try again.")

# -------------------- Consent flow --------------------
elif page == "Consent Flow":
    st.title("🛡️ Consent Flow")
    st.write("Read this sample notice before choosing. The notice and purposes are illustrative.")
    with st.container(border=True):
        st.subheader("Sample privacy notice")
        st.write(
            "This student prototype demonstrates how an organisation can describe a purpose "
            "before requesting a choice. It does not collect real personal information or connect "
            "to an external organisation."
        )
        st.caption(f"Notice version: {NOTICE_VERSION} • Profile: {demo_user}")
    for purpose, info in PURPOSES.items():
        with st.container(border=True):
            left, right = st.columns([3, 2])
            with left:
                st.subheader(purpose)
                st.write(f"**Purpose:** {info['description']}")
                st.write(f"**Illustrative data:** {info['data']}")
                st.caption("Optional purpose" if info["optional"] else "Core demo purpose")
                st.write(f"**Current status:** {statuses.get(purpose, 'Not Decided')}")
            with right:
                action = st.radio(
                    "Select your choice",
                    ["Give Consent", "Reject Consent", "Withdraw Consent"],
                    key=f"action_{demo_user}_{purpose}",
                    label_visibility="visible",
                )
                if st.button("Save choice", key=f"save_{demo_user}_{purpose}", use_container_width=True):
                    if action == "Give Consent":
                        new_status, note = "Given", "Consent granted in demo"
                    elif action == "Reject Consent":
                        new_status, note = "Rejected", "Consent rejected in demo"
                    else:
                        new_status, note = "Withdrawn", "Withdrawal recorded in demo"
                    add_consent_event(demo_user, purpose, new_status, note)
                    st.success(f"Recorded {new_status.lower()} for {purpose}.")
                    st.rerun()
    st.caption("A withdrawal here only updates this local demo record. It does not stop real-world processing.")

# -------------------- Dashboard --------------------
elif page == "Consent Dashboard":
    st.title("📊 Consent Dashboard")
    st.write(f"Latest recorded status for **{demo_user}**.")
    statuses = current_statuses(demo_user)
    values = list(statuses.values())
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Given", values.count("Given"))
    c2.metric("Rejected", values.count("Rejected"))
    c3.metric("Withdrawn", values.count("Withdrawn"))
    c4.metric("Not Decided", values.count("Not Decided"))
    rows = [{"Purpose": p, "Current Status": s, "Notice Version": NOTICE_VERSION}
            for p, s in statuses.items()]
    st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)
    st.info("This dashboard is for a selected demo profile. A real deployment would require verified identity, authorisation, and secure storage.")

# -------------------- History --------------------
elif page == "Consent History":
    st.title("🧾 Consent History")
    st.write(f"Audit-style event history for **{demo_user}**.")
    history = get_history(demo_user)
    if history.empty:
        st.info("No actions recorded for this demo profile yet. Use Consent Flow to create a record.")
    else:
        st.dataframe(history, use_container_width=True, hide_index=True)
        st.download_button(
            "Download history as CSV",
            data=history.to_csv(index=False).encode("utf-8"),
            file_name=f"{demo_user.lower().replace(' ', '_')}_consent_history.csv",
            mime="text/csv",
        )
    st.caption("History is stored in the local SQLite database in this project folder.")

# -------------------- Rights requests --------------------
elif page == "Rights Requests":
    st.title("📝 Demo Rights Request")
    st.write("Submit a fictional request to demonstrate how a portal might record a request.")
    with st.form("rights_request_form"):
        request_type = st.selectbox("Request type", [
            "Request for information", "Correction", "Erasure", "Grievance / complaint", "Other"
        ])
        details = st.text_area("Short details (do not enter real sensitive information)", max_chars=500)
        submit_request = st.form_submit_button("Submit demo request", use_container_width=True)
    if submit_request:
        add_rights_request(demo_user, request_type, details.strip() or "No extra details supplied")
        st.success("Demo request recorded locally.")
    st.subheader("Recorded requests")
    requests = get_rights_requests(demo_user)
    if requests.empty:
        st.info("No demo requests recorded for this profile.")
    else:
        st.dataframe(requests, use_container_width=True, hide_index=True)
        st.download_button(
            "Download requests as CSV",
            data=requests.to_csv(index=False).encode("utf-8"),
            file_name=f"{demo_user.lower().replace(' ', '_')}_rights_requests.csv",
            mime="text/csv",
        )
    st.warning("This is only a prototype. It does not submit a request to an organisation or guarantee a legal response.")

# -------------------- About --------------------
elif page == "About Project":
    st.title("ℹ️ About the Project")
    st.markdown("""
    **Project:** Know DPDPA & Consent Flow

    **Goal:** Combine privacy education with a structured consent-management demonstration.

    **Core flow:** Learn → Read notice → Make a purpose-specific choice → Review dashboard/history → Record a demo rights request.

    **Implemented in this prototype**
    - Privacy learning modules and learning paths
    - Awareness quiz
    - Purpose-specific consent choices
    - Consent status dashboard
    - Local SQLite event history with notice version
    - CSV export for history and demo rights requests
    - Demo rights-request form
    - Midnight Blue + Cyan theme
    """)
    st.markdown("""
    **Important limitations**
    - The profile selector is not a secure login system.
    - SQLite data is stored locally and is not encrypted by this demo.
    - This is not production-ready legal compliance software.
    - Use fictional/demo data only; review legal requirements with your guide or a qualified expert.
    """)
    st.subheader("Suggested next development phase")
    st.write("Add verified authentication, role-based permissions, validated database design, tests, and supervisor-approved requirements before any real deployment.")

st.divider()
st.caption("Know DPDPA & Consent Flow • Student project prototype • Fictional data only")
