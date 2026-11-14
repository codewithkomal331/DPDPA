const { useEffect, useRef, useState } = React;
const { createRoot } = ReactDOM;

const languageCodes = {
  English: "en",
  "हिन्दी (Hindi)": "hi",
  "मराठी (Marathi)": "mr",
};

i18next.init({
  lng: "en",
  fallbackLng: "en",
  resources: {
    en: { translation: {} },
    hi: {
      translation: {
        Learn: "सीखें",
        Consent: "सहमति",
        About: "परियोजना",
        Home: "होम",
        "Know DPDPA": "DPDPA जानें",
        "DPDPA Notes": "DPDPA नोट्स",
        "Important Points": "महत्वपूर्ण बिंदु",
        "Practice Questions": "अभ्यास प्रश्न",
        Quiz: "क्विज़",
        "Consent Flow": "सहमति प्रक्रिया",
        "Consent Dashboard": "सहमति डैशबोर्ड",
        "Consent History": "सहमति इतिहास",
        "Rights Requests": "अधिकार अनुरोध",
        "About Project": "परियोजना के बारे में",
        "Demo profile": "डेमो प्रोफ़ाइल",
        Language: "भाषा",
        "Educational privacy portal · fictional data only · Notice version": "शैक्षिक गोपनीयता पोर्टल · केवल काल्पनिक डेटा · सूचना संस्करण",
        "Education · Consent · Transparency": "शिक्षा · सहमति · पारदर्शिता",
        "A student project prototype.": "एक छात्र परियोजना प्रोटोटाइप।",
        "Not legal advice.": "कानूनी सलाह नहीं।",
      },
    },
    mr: {
      translation: {
        Learn: "शिका",
        Consent: "संमती",
        About: "प्रकल्प",
        Home: "मुख्यपृष्ठ",
        "Know DPDPA": "DPDPA जाणून घ्या",
        "DPDPA Notes": "DPDPA नोंदी",
        "Important Points": "महत्त्वाचे मुद्दे",
        "Practice Questions": "सराव प्रश्न",
        Quiz: "क्विझ",
        "Consent Flow": "संमती प्रक्रिया",
        "Consent Dashboard": "संमती डॅशबोर्ड",
        "Consent History": "संमती इतिहास",
        "Rights Requests": "अधिकार विनंत्या",
        "About Project": "प्रकल्पाविषयी",
        "Demo profile": "डेमो प्रोफाइल",
        Language: "भाषा",
        "Education · Consent · Transparency": "शिक्षण · संमती · पारदर्शकता",
        "A student project prototype.": "विद्यार्थी प्रकल्पाचा नमुना.",
        "Not legal advice.": "कायदेशीर सल्ला नाही.",
      },
    },
  },
});

const tr = (key) => i18next.t(key);

const pageGroups = [
  { label: "Learn", pages: ["Home", "Know DPDPA", "DPDPA Notes", "Important Points", "Practice Questions", "Quiz"] },
  { label: "Consent", pages: ["Consent Flow", "Consent Dashboard", "Consent History", "Rights Requests"] },
  { label: "About", pages: ["About Project"] },
];

const importantPoints = [
  ["DPDP Act, 2023", "India's law dealing with the processing of digital personal data."],
  ["Personal Data", "Data about an individual who is identifiable by or in relation to that data."],
  ["Data Principal", "The individual to whom the personal data relates."],
  ["Data Fiduciary", "The person who determines the purpose and means of processing personal data."],
  ["Consent", "Consent must be free, specific, informed, unconditional and unambiguous, with a clear affirmative action."],
  ["Consent Withdrawal", "A Data Principal can withdraw consent, and withdrawing should be as easy as giving it."],
];

const practiceQuestions = [
  ["In which year was the DPDP Act passed?", ["2021", "2022", "2023", "2025"], "2023"],
  ["Who is a Data Principal?", ["The individual whose data is involved", "A database", "A software company", "A government website"], "The individual whose data is involved"],
  ["What is digital personal data?", ["Only paper records", "Personal data in digital form", "Only passwords", "Only photographs"], "Personal data in digital form"],
  ["Who determines the purpose and means of processing personal data?", ["Data Principal", "Data Fiduciary", "Data Processor only", "Website visitor"], "Data Fiduciary"],
  ["Which action can a Data Principal take regarding consent?", ["Withdraw consent", "Change the law", "Delete every company's database", "Appoint a Data Fiduciary"], "Withdraw consent"],
];

const languages = [
  "English",
  "हिन्दी (Hindi)",
  "বাংলা (Bengali)",
  "मराठी (Marathi)",
  "తెలుగు (Telugu)",
  "தமிழ் (Tamil)",
  "ગુજરાતી (Gujarati)",
  "اردو (Urdu)",
  "ಕನ್ನಡ (Kannada)",
  "ଓଡ଼ିଆ (Odia)",
  "മലയാളം (Malayalam)",
];

async function api(path, options) {
  const response = await fetch(path, { headers: { "Content-Type": "application/json" }, ...options });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Request failed");
  return payload;
}

function App() {
  const [page, setPage] = useState("Home");
  const [profile, setProfile] = useState("Student Demo");
  const [language, setLanguage] = useState("English");
  const [data, setData] = useState(null);
  const [statuses, setStatuses] = useState({});
  const [history, setHistory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [toast, setToast] = useState("");
  const mainRef = useRef(null);

  const refresh = async () => {
    const [boot, status, historyData, rights] = await Promise.all([
      api("/api/bootstrap"),
      api(`/api/statuses?user=${encodeURIComponent(profile)}`),
      api(`/api/history?user=${encodeURIComponent(profile)}`),
      api(`/api/rights?user=${encodeURIComponent(profile)}`),
    ]);
    setData(boot);
    setStatuses(status.statuses);
    setHistory(historyData.history);
    setRequests(rights.requests);
  };

  useEffect(() => { refresh().catch((error) => setToast(error.message)); }, [profile]);
  useEffect(() => {
    if (mainRef.current) window.gsap.fromTo(mainRef.current.querySelectorAll(".animate-in"), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.06, ease: "power2.out" });
  }, [page]);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(timeout);
  }, [toast]);

  if (!data) return <div className="loading">Loading portal...</div>;
  const completed = Object.values(statuses).filter((value) => value === "Given").length;

  return (
    <div className="app-shell">
      <header className="top-banner">{tr("Educational privacy portal · fictional data only · Notice version")} {data.noticeVersion}</header>
      <div className="app-layout">
        <aside className="sidebar">
          <div className="brand"><span className="brand-mark">✳</span><span>know <b>DPDPA</b></span></div>
          <p className="sidebar-kicker">{tr("Education · Consent · Transparency")}</p>
          <div className="profile-card">
            <label>{tr("Demo profile")}</label>
            <select value={profile} onChange={(event) => setProfile(event.target.value)}>{data.profiles.map((item) => <option key={item}>{item}</option>)}</select>
          </div>
          <div className="language-card">
            <label>{tr("Language")}</label>
            <select aria-label={tr("Language")} value={language} onChange={(event) => {
              const nextLanguage = event.target.value;
              i18next.changeLanguage(languageCodes[nextLanguage] || "en");
              setLanguage(nextLanguage);
            }}>{languages.map((item) => <option key={item}>{item}</option>)}</select>
          </div>
          <nav>
            {pageGroups.map((group) => <div className="nav-group" key={group.label}>
              <span className="nav-label">{tr(group.label)}</span>
              {group.pages.map((item) => <button className={`nav-item ${page === item ? "active" : ""}`} onClick={() => setPage(item)} key={item}><span>{item === "Consent Flow" ? "◈" : item === "Home" ? "⌂" : "○"}</span>{tr(item)}</button>)}
            </div>)}
          </nav>
          <div className="sidebar-footer">{tr("A student project prototype.")}<br />{tr("Not legal advice.")}</div>
        </aside>
        <main className="main-content" ref={mainRef}>
          <div className="topbar"><span className="eyebrow">KNOW DPDPA / {page.toUpperCase()}</span><span className="user-chip">● {profile}</span></div>
          {page === "Home" && <Home setPage={setPage} completed={completed} history={history} />}
          {page === "Consent Flow" && <ConsentFlow data={data} statuses={statuses} profile={profile} onSaved={async (message) => { await refresh(); setToast(message); }} />}
          {page === "Consent Dashboard" && <Dashboard statuses={statuses} profile={profile} />}
          {page === "Consent History" && <History history={history} profile={profile} />}
          {page === "Rights Requests" && <RightsRequests requests={requests} profile={profile} onSaved={async () => { await refresh(); setToast("Demo request recorded locally."); }} />}
          {page === "Important Points" && <Points />}
          {page === "DPDPA Notes" && <Notes />}
          {page === "Practice Questions" && <Practice />}
          {page === "Quiz" && <Quiz />}
          {page === "Know DPDPA" && <Learning completed={completed} />}
          {page === "About Project" && <About />}
        </main>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function Home({ setPage, completed, history }) {
  const actions = [
    ["Know DPDPA", "Structured learning chapters and role-based paths."],
    ["DPDPA Notes", "Definitions, explanations and examples."],
    ["Important Points", "Quick revision of the key concepts."],
    ["Practice Questions", "Test your understanding topic by topic."],
    ["Consent Flow", "Read the notice and choose by purpose."],
    ["Consent Dashboard", "Review the latest consent status."],
  ];
  return <section>
    <div className="hero animate-in"><div><span className="hero-tag">● Privacy learning, made clear</span><h1>Learn privacy.<br /><em>Own your choices.</em></h1><p>Understand the DPDPA, practise your knowledge and manage consent in one focused portal.</p><div className="hero-actions"><button className="button dark" onClick={() => setPage("Know DPDPA")}>Start learning ↗</button><button className="button light" onClick={() => setPage("Consent Flow")}>Manage consent</button></div></div><div className="hero-orbit"><span>DPDPA</span><i>✳</i></div></div>
    <div className="stats-row animate-in"><Stat label="Learning progress" value={`${Math.round((completed / 15) * 100)}%`} detail={`${completed}/15 chapters`} /><Stat label="Consent purposes" value="4" detail="Purpose-specific choices" /><Stat label="Recorded actions" value={history.length} detail="Local audit history" /></div>
    <div className="section-heading animate-in"><div><span className="eyebrow">YOUR PORTAL</span><h2>Everything in one place.</h2></div><span className="section-note">A simple path from awareness to action</span></div>
    <div className="action-grid">{actions.map(([title, detail]) => <button className="action-card animate-in" onClick={() => setPage(title)} key={title}><span className="card-icon">✳</span><span><b>{title}</b><small>{detail}</small></span><strong>↗</strong></button>)}</div>
  </section>;
}

function Stat({ label, value, detail }) { return <div className="stat-card"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>; }

function ConsentFlow({ data, statuses, profile, onSaved }) {
  const [choices, setChoices] = useState({});
  const save = async (purpose) => {
    const choice = choices[purpose] || "Given";
    const action = choice === "Give Consent" ? "Given" : choice === "Reject Consent" ? "Rejected" : "Withdrawn";
    await api("/api/consent", { method: "POST", body: JSON.stringify({ user: profile, purpose, action }) });
    onSaved(`${action} recorded for ${purpose}.`);
  };
  return <section><PageIntro eyebrow="CONSENT FLOW" title="Make clear, purpose-specific choices." text="Read this sample notice before choosing. Every action is recorded in the local demo history." /><div className="notice-card animate-in"><span className="card-icon yellow">✳</span><div><b>Sample privacy notice</b><p>This student prototype demonstrates how an organisation can describe a purpose before requesting a choice. It does not collect real personal information.</p></div><span className="version">v{data.noticeVersion}</span></div><div className="purpose-grid">{Object.entries(data.purposes).map(([purpose, info]) => <div className="purpose-card animate-in" key={purpose}><div className="purpose-top"><span className="status-dot" /> <span>{info.optional ? "OPTIONAL PURPOSE" : "CORE DEMO PURPOSE"}</span></div><h3>{purpose}</h3><p>{info.description}</p><small>Illustrative data · {info.data}</small><div className="purpose-bottom"><span className={`badge ${statuses[purpose] === "Given" ? "green" : ""}`}>{statuses[purpose] || "Not Decided"}</span><select value={choices[purpose] || "Give Consent"} onChange={(event) => setChoices({ ...choices, [purpose]: event.target.value })}><option>Give Consent</option><option>Reject Consent</option><option>Withdraw Consent</option></select><button className="save-button" onClick={() => save(purpose)}>Save choice</button></div></div>)}</div></section>;
}

function PageIntro({ eyebrow, title, text }) { return <div className="page-intro animate-in"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p></div>; }
function Dashboard({ statuses, profile }) { const values = Object.values(statuses); return <section><PageIntro eyebrow="CONSENT DASHBOARD" title="A clear view of your choices." text={`Latest recorded status for ${profile}.`} /><div className="stats-row animate-in"><Stat label="Given" value={values.filter((item) => item === "Given").length} detail="Active demo consents" /><Stat label="Rejected" value={values.filter((item) => item === "Rejected").length} detail="Declined purposes" /><Stat label="Withdrawn" value={values.filter((item) => item === "Withdrawn").length} detail="Withdrawals recorded" /><Stat label="Not decided" value={values.filter((item) => item === "Not Decided").length} detail="Awaiting a choice" /></div><div className="table-card animate-in"><div className="table-heading"><b>Purpose status</b><span>Notice version 1.0</span></div>{Object.entries(statuses).map(([purpose, status]) => <div className="table-row" key={purpose}><span>{purpose}</span><span className={`badge ${status === "Given" ? "green" : ""}`}>{status}</span></div>)}</div></section>; }
function History({ history, profile }) { return <section><PageIntro eyebrow="CONSENT HISTORY" title="Your local audit trail." text={`Every consent event recorded for ${profile}.`} />{history.length === 0 ? <Empty text="No actions recorded for this demo profile yet. Use Consent Flow to create a record." /> : <div className="table-card animate-in">{history.map((item, index) => <div className="history-row" key={`${item.time}-${index}`}><div><b>{item.purpose}</b><small>{item.time} · Notice {item.noticeVersion}</small></div><span className="badge">{item.action}</span></div>)}</div>}</section>; }
function RightsRequests({ requests, profile, onSaved }) { const [type, setType] = useState("Request for information"); const [details, setDetails] = useState(""); const submit = async (event) => { event.preventDefault(); await api("/api/rights", { method: "POST", body: JSON.stringify({ user: profile, requestType: type, details }) }); setDetails(""); onSaved(); }; return <section><PageIntro eyebrow="RIGHTS REQUESTS" title="Put your data rights into practice." text="Submit a fictional request to demonstrate how a portal might record it." /><form className="form-card animate-in" onSubmit={submit}><label>Request type<select value={type} onChange={(event) => setType(event.target.value)}><option>Request for information</option><option>Correction</option><option>Erasure</option><option>Grievance / complaint</option><option>Other</option></select></label><label>Short details <small>(do not enter real sensitive information)</small><textarea maxLength="500" value={details} onChange={(event) => setDetails(event.target.value)} /></label><button className="button dark" type="submit">Submit demo request ↗</button></form><div className="table-card animate-in"><div className="table-heading"><b>Recorded requests</b><span>{requests.length} request(s)</span></div>{requests.length === 0 ? <Empty text="No demo requests recorded for this profile." /> : requests.map((item, index) => <div className="history-row" key={`${item.time}-${index}`}><div><b>{item.requestType}</b><small>{item.time} · {item.details}</small></div><span className="badge">{item.status}</span></div>)}</div></section>; }
function Empty({ text }) { return <div className="empty">{text}</div>; }
function Points() { return <section><PageIntro eyebrow="IMPORTANT POINTS" title="The essentials, at a glance." text="Quick revision of the core DPDPA concepts in this portal." /><div className="info-grid">{importantPoints.map(([title, detail]) => <article className="info-card animate-in" key={title}><span className="card-icon yellow">✳</span><h3>{title}</h3><p>{detail}</p></article>)}</div></section>; }
function Notes() {
  return <section>
    <PageIntro eyebrow="DPDPA NOTES" title="Understand the language of privacy." text="Simple notes, definitions and examples for learning." />
    <div className="notes-card animate-in">
      {dpdpaChapters.map((chapter) => <article key={chapter.title}>
        <h2>{chapter.title}</h2>
        <div style={{ whiteSpace: "pre-wrap", fontSize: "14px", lineHeight: 1.75, color: "#77756e" }}>{chapter.content.trim()}</div>
      </article>)}
    </div>
  </section>;
}
function Practice() { const [answers, setAnswers] = useState({}); const [score, setScore] = useState(null); return <section><PageIntro eyebrow="PRACTICE QUESTIONS" title="Check what you know." text="Test your understanding with topic-wise questions." /><div className="quiz-list animate-in">{practiceQuestions.map(([question, options], index) => <div className="question-card" key={question}><b>{index + 1}. {question}</b>{options.map((option) => <label key={option}><input type="radio" name={`q-${index}`} onChange={() => setAnswers({ ...answers, [index]: option })} />{option}</label>)}</div>)}<button className="button dark" onClick={() => setScore(practiceQuestions.reduce((total, item, index) => total + (answers[index] === item[2] ? 1 : 0), 0))}>Submit answers</button>{score !== null && <div className="result">Your score <strong>{score}/{practiceQuestions.length}</strong></div>}</div></section>; }
function Quiz() { return <section><PageIntro eyebrow="PRIVACY AWARENESS QUIZ" title="A quick final check." text="Answer the three questions and review your score." /><div className="notes-card animate-in"><h2>What should a privacy notice explain?</h2><p>What data is requested and why.</p><h2>What should a consent screen provide?</h2><p>A clear purpose and meaningful choices.</p><h2>Where can you review consent actions?</h2><p>Consent History.</p></div></section>; }
function Learning({ completed }) { return <section><PageIntro eyebrow="KNOW DPDPA" title="A self-paced learning path." text="Understand digital personal data protection from beginner to advanced level." /><div className="learning-hero animate-in"><span className="card-icon yellow">✳</span><div><b>Course progress</b><p>Complete the 15 existing chapters and use the knowledge checks to reinforce each concept.</p><div className="progress"><span style={{ width: `${(completed / 15) * 100}%` }} /></div><small>{completed} / 15 chapters completed</small></div></div><div className="info-grid">{["Introduction to DPDPA", "Need and importance of data protection", "Understanding personal data", "Consent and withdrawal", "Data principal rights", "Data breach awareness"].map((item, index) => <article className="info-card animate-in" key={item}><span className="chapter-number">0{index + 1}</span><h3>{item}</h3><p>Read the chapter in the existing Streamlit course and complete its knowledge check.</p></article>)}</div></section>; }
function About() { return <section><PageIntro eyebrow="ABOUT THIS PROJECT" title="A focused student prototype." text="Learn DPDPA, understand consent and practise data rights in one place." /><div className="notes-card animate-in"><h2>Project goal</h2><p>Combine privacy education with a structured consent-management demonstration.</p><h2>Core flow</h2><p>Learn → Read notice → Make a purpose-specific choice → Review dashboard/history → Record a demo rights request.</p><h2>Important limitations</h2><p>The profile selector is not secure authentication. SQLite data is stored locally and is not encrypted by this demo. Use fictional data only.</p></div></section>; }

createRoot(document.getElementById("root")).render(<App />);
