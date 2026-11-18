const { useEffect, useRef, useState } = React;
const { createRoot } = ReactDOM;

const languageCodes = {
  English: "en",
  "हिन्दी (Hindi)": "hi",
  "मराठी (Marathi)": "mr",
};

const DOM_TRANSLATION_STORAGE_KEY = "know-dpdpa-language";
const originalTextByNode = new WeakMap();
const translatedTextCache = new Map();
let domTranslationLanguage = "en";
let domTranslationObserver = null;
let domTranslationTimer = null;

const API_BASE = (window.location.protocol.startsWith("http") && (window.location.port === "8504" || window.location.port === ""))
  ? window.location.origin
  : "http://127.0.0.1:8504";

const translationsHi = {
  "Learn": "सीखें",
  "Consent": "सहमति",
  "About": "परियोजना",
  "Home": "होम",
  "Know DPDPA": "DPDPA जानें",
  "DPDPA Notes": "DPDPA नोट्स",
  "Important Points": "महत्वपूर्ण बिंदु",
  "Practice Questions": "अभ्यास प्रश्न",
  "Quiz": "क्विज़",
  "Certificate": "प्रमाणपत्र",
  "Consent Flow": "सहमति प्रक्रिया",
  "Consent Dashboard": "सहमति डैशबोर्ड",
  "Consent History": "सहमति इतिहास",
  "Rights Requests": "अधिकार अनुरोध",
  "About Project": "परियोजना के बारे में",
  "Demo profile": "डेमो प्रोफ़ाइल",
  "Language": "भाषा",
  "Educational privacy portal · fictional data only · Notice version": "शैक्षिक गोपनीयता पोर्टल · केवल काल्पनिक डेटा · सूचना संस्करण",
  "Education · Consent · Transparency": "शिक्षा · सहमति · पारदर्शिता",
  "A student project prototype.": "एक छात्र परियोजना प्रोटोटाइप।",
  "Not legal advice.": "कानूनी सलाह नहीं।",
  "Loading portal...": "पोर्टल लोड हो रहा है...",
  "Student Demo": "छात्र डेमो",
  "Parent Demo": "अभिभावक डेमो",
  "Staff Demo": "स्टाफ डेमो",
  "Know DPDPA | Consent Flow": "Know DPDPA | सहमति प्रवाह",
  "● Privacy learning, made clear": "● गोपनीयता शिक्षण, स्पष्ट रूप से",
  "Learn privacy.": "गोपनीयता सीखें।",
  "Own your choices.": "अपने विकल्पों के स्वामी बनें।",
  "Understand the DPDPA, practise your knowledge and manage consent in one focused portal.": "एक ही केंद्रित पोर्टल में DPDPA को समझें, अपने ज्ञान का अभ्यास करें और सहमति प्रबंधित करें।",
  "Start learning ↗": "सीखना शुरू करें ↗",
  "Manage consent": "सहमति प्रबंधित करें",
  "Learning progress": "सीखने की प्रगति",
  "chapters": "अध्याय",
  "Consent purposes": "सहमति के उद्देश्य",
  "Purpose-specific choices": "उद्देश्य-विशिष्ट विकल्प",
  "Recorded actions": "दर्ज की गई कार्रवाइयां",
  "Local audit history": "स्थानीय ऑडिट इतिहास",
  "YOUR PORTAL": "आपका पोर्टल",
  "Everything in one place.": "सब कुछ एक ही स्थान पर।",
  "A simple path from awareness to action": "जागरूकता से कार्रवाई तक का एक सरल मार्ग",
  "Structured learning chapters and role-based paths.": "संरचित शिक्षण अध्याय और भूमिका-आधारित मार्ग।",
  "Definitions, explanations and examples.": "परिभाषाएं, स्पष्टीकरण और उदाहरण।",
  "Quick revision of the key concepts.": "प्रमुख अवधारणाओं का त्वरित पुनरीक्षण।",
  "Test your understanding topic by topic.": "विषयवार अपनी समझ का परीक्षण करें।",
  "Read the notice and choose by purpose.": "सूचना पढ़ें और उद्देश्य के अनुसार चयन करें।",
  "Review the latest consent status.": "नवीनतम सहमति स्थिति की समीक्षा करें।",
  "CONSENT FLOW": "सहमति प्रक्रिया",
  "Make clear, purpose-specific choices.": "स्पष्ट, उद्देश्य-विशिष्ट विकल्प चुनें।",
  "Read this sample notice before choosing. Every action is recorded in the local demo history.": "चयन करने से पहले इस नमूना नोटिस को पढ़ें। प्रत्येक कार्रवाई स्थानीय डेमो इतिहास में दर्ज की जाती है।",
  "Sample privacy notice": "नमूना गोपनीयता सूचना",
  "This student prototype demonstrates how an organisation can describe a purpose before requesting a choice. It does not collect real personal information.": "यह छात्र प्रोटोटाइप दर्शाता है कि कोई संगठन विकल्प मांगने से पहले किसी उद्देश्य का वर्णन कैसे कर सकता है। यह वास्तविक व्यक्तिगत जानकारी एकत्र नहीं करता है।",
  "OPTIONAL PURPOSE": "वैकल्पिक उद्देश्य",
  "CORE DEMO PURPOSE": "मुख्य डेमो उद्देश्य",
  "Illustrative data ·": "उदाहरणात्मक डेटा ·",
  "Account management": "खाता प्रबंधन",
  "Maintain a sample profile and basic account preferences.": "एक नमूना प्रोफ़ाइल और बुनियादी खाता प्राथमिकताएं बनाए रखें।",
  "Display name and account preferences": "प्रदर्शित नाम और खाता प्राथमिकताएं",
  "Analytics": "एनालिटिक्स (विश्लेषण)",
  "Understand how the learning portal is used and improve its pages.": "समझें कि शिक्षण पोर्टल का उपयोग कैसे किया जाता है और इसके पृष्ठों में सुधार करें।",
  "Demo page interactions": "डेमो पृष्ठ इंटरैक्शन",
  "Marketing messages": "विपणन संदेश",
  "Illustrate an optional preference for product or service updates.": "उत्पाद या सेवा अपडेट के लिए एक वैकल्पिक प्राथमिकता का चित्रण करें।",
  "Sample communication preference": "नमूना संचार प्राथमिकता",
  "Third-party sharing": "तृतीय-पक्ष साझाकरण",
  "Illustrate a request to share selected information with a named service provider.": "नामित सेवा प्रदाता के साथ चयनित जानकारी साझा करने के अनुरोध का चित्रण करें।",
  "No real sharing occurs in this student prototype": "इस छात्र प्रोटोटाइप में कोई वास्तविक साझाकरण नहीं होता है",
  "Given": "सहमति दी गई",
  "Rejected": "अस्वीकार किया गया",
  "Withdrawn": "वापस लिया गया",
  "Not Decided": "निर्णय नहीं लिया गया",
  "Give Consent": "सहमति दें",
  "Reject Consent": "सहमति अस्वीकार करें",
  "Withdraw Consent": "सहमति वापस लें",
  "Save choice": "विकल्प सहेजें",
  "CONSENT DASHBOARD": "सहमति डैशबोर्ड",
  "A clear view of your choices.": "आपके विकल्पों का एक स्पष्ट दृश्य।",
  "Latest recorded status for": "के लिए नवीनतम दर्ज स्थिति",
  "Active demo consents": "सक्रिय डेमो सहमतियां",
  "Declined purposes": "अस्वीकृत उद्देश्य",
  "Withdrawals recorded": "दर्ज की गई वापसी",
  "Awaiting a choice": "विकल्प की प्रतीक्षा",
  "Purpose status": "उद्देश्य स्थिति",
  "Notice version 1.0": "सूचना संस्करण 1.0",
  "CONSENT HISTORY": "सहमति इतिहास",
  "Your local audit trail.": "आपका स्थानीय ऑडिट ट्रेल।",
  "Every consent event recorded for": "के लिए दर्ज की गई प्रत्येक सहमति घटना",
  "No actions recorded for this demo profile yet. Use Consent Flow to create a record.": "इस डेमो प्रोफ़ाइल के लिए अभी तक कोई कार्रवाई दर्ज नहीं की गई है। रिकॉर्ड बनाने के लिए सहमति प्रक्रिया का उपयोग करें।",
  "Notice": "सूचना",
  "RIGHTS REQUESTS": "अधिकार अनुरोध",
  "Put your data rights into practice.": "अपने डेटा अधिकारों को व्यवहार में लाएं।",
  "Submit a fictional request to demonstrate how a portal might record it.": "यह प्रदर्शित करने के लिए एक काल्पनिक अनुरोध सबमिट करें कि कोई पोर्टल इसे कैसे रिकॉर्ड कर सकता है।",
  "Request type": "अनुरोध का प्रकार",
  "Request for information": "जानकारी के लिए अनुरोध",
  "Correction": "सुधार",
  "Erasure": "डेटा मिटाना",
  "Grievance / complaint": "शिकायत / निवारण",
  "Other": "अन्य",
  "Short details": "संक्षिप्त विवरण",
  "(do not enter real sensitive information)": "(वास्तविक संवेदनशील जानकारी दर्ज न करें)",
  "Submit demo request ↗": "डेमो अनुरोध सबमिट करें ↗",
  "Recorded requests": "दर्ज किए गए अनुरोध",
  "request(s)": "अनुरोध",
  "No demo requests recorded for this profile.": "इस प्रोफ़ाइल के लिए कोई डेमो अनुरोध दर्ज नहीं किया गया है।",
  "Received": "प्राप्त हुआ",
  "Demo request recorded locally.": "डेमो अनुरोध स्थानीय रूप से दर्ज किया गया।",
  "IMPORTANT POINTS": "महत्वपूर्ण बिंदु",
  "The essentials, at a glance.": "मुख्य बातें, एक नज़र में।",
  "Select any topic to explore its important points.": "इसके महत्वपूर्ण बिंदुओं को जानने के लिए किसी भी विषय का चयन करें।",
  "Explore 5 important points →": "5 महत्वपूर्ण बिंदु देखें →",
  "← Back to Important Points": "← महत्वपूर्ण बिंदुओं पर वापस जाएं",
  "IMPORTANT POINTS / TOPIC": "महत्वपूर्ण बिंदु / विषय",
  "Learn these five important points.": "इन पांच महत्वपूर्ण बिंदुओं को जानें।",
  "DPDPA NOTES": "DPDPA नोट्स",
  "Understand the language of privacy.": "गोपनीयता की भाषा को समझें।",
  "Simple notes, definitions and examples for learning.": "सीखने के लिए सरल नोट्स, परिभाषाएं और उदाहरण।",
  "KNOW DPDPA": "DPDPA जानें",
  "A self-paced learning path.": "एक स्व-गति शिक्षण पथ।",
  "Understand digital personal data protection from beginner to advanced level.": "शुरुआती से उन्नत स्तर तक डिजिटल व्यक्तिगत डेटा संरक्षण को समझें।",
  "Course progress": "पाठ्यक्रम प्रगति",
  "Explore all chapters and learn about data protection.": "सभी अध्यायों को देखें और डेटा सुरक्षा के बारे में जानें।",
  "chapters completed": "अध्याय पूर्ण हुए",
  "Click to read this chapter →": "इस अध्याय को पढ़ने के लिए क्लिक करें →",
  "← Back to Chapters": "← अध्यायों पर वापस जाएं",
  "KNOW DPDPA / CHAPTER": "DPDPA जानें / अध्याय",
  "Read and understand this chapter.": "इस अध्याय को पढ़ें और समझें।",
  "PRIVACY AWARENESS QUIZ": "गोपनीयता जागरूकता क्विज़",
  "Test your DPDPA knowledge.": "अपने DPDPA ज्ञान का परीक्षण करें।",
  "Attempt all 10 questions. You need at least 70% to pass and unlock your certificate.": "सभी 10 प्रश्नों का प्रयास करें। पास होने और प्रमाणपत्र अनलॉक करने के लिए कम से कम 70% अंक आवश्यक हैं।",
  "Question": "प्रश्न",
  "of": "/",
  "Previous": "पिछला",
  "Next": "अगला",
  "Submit Quiz": "क्विज़ सबमिट करें",
  "Congratulations! You Passed!": "बधाई हो! आप उत्तीर्ण हुए!",
  "Keep Practising!": "अभ्यास जारी रखें!",
  "Your Score:": "आपका स्कोर:",
  "Percentage:": "प्रतिशत:",
  "You can now visit the Certificate page.": "अब आप प्रमाणपत्र पृष्ठ पर जा सकते हैं।",
  "You need at least 70% to unlock the certificate.": "प्रमाणपत्र अनलॉक करने के लिए आपको कम से कम 70% अंक प्राप्त करने होंगे।",
  "PRACTICE QUESTIONS": "अभ्यास प्रश्न",
  "Check what you know.": "जांचें कि आप क्या जानते हैं।",
  "Test your understanding with topic-wise questions.": "विषयवार प्रश्नों के साथ अपनी समझ का परीक्षण करें।",
  "Submit answers": "उत्तर सबमिट करें",
  "Your score": "आपका स्कोर",
  "CERTIFICATE": "प्रमाणपत्र",
  "Certificate of Achievement": "उपलब्धि का प्रमाणपत्र",
  "Enter student details to generate your certificate.": "अपना प्रमाणपत्र जनरेट करने के लिए छात्र विवरण दर्ज करें।",
  "Student Full Name": "छात्र का पूरा नाम",
  "Enter student name": "छात्र का नाम दर्ज करें",
  "Roll Number / PRN": "रोल नंबर / पीआरएन",
  "Enter Roll Number / PRN": "रोल नंबर / पीआरएन दर्ज करें",
  "Course Name": "पाठ्यक्रम का नाम",
  "Assessment Score (%)": "मूल्यांकन स्कोर (%)",
  "Enter score": "स्कोर दर्ज करें",
  "Print Certificate": "प्रमाणपत्र प्रिंट करें",
  "OF ACHIEVEMENT": "उपलब्धि का",
  "This certificate is proudly presented to": "यह प्रमाणपत्र गर्व के साथ प्रदान किया जाता है",
  "In recognition of successful participation in the learning programme": "शिक्षण कार्यक्रम में सफल भागीदारी के उपलक्ष्य में",
  "DPDPA Awareness and Data Privacy": "DPDPA जागरूकता और डेटा गोपनीयता",
  "ROLL NUMBER / PRN": "रोल नंबर / पीआरएन",
  "ASSESSMENT SCORE": "मूल्यांकन स्कोर",
  "ISSUE DATE": "जारी करने की तिथि",
  "Project Coordinator": "परियोजना समन्वयक",
  "Authorised Signatory": "अधिकृत हस्ताक्षरकर्ता",
  "Know DPDPA Portal": "Know DPDPA Portal",
  "CERTIFIED": "प्रमाणित",
  "Educational project certificate · Know DPDPA": "शैक्षिक परियोजना प्रमाणपत्र · Know DPDPA",
  "ABOUT THIS PROJECT": "इस परियोजना के बारे में",
  "A focused student prototype.": "एक केंद्रित छात्र प्रोटोटाइप।",
  "Learn DPDPA, understand consent and practise data rights in one place.": "एक ही स्थान पर DPDPA सीखें, सहमति को समझें और डेटा अधिकारों का अभ्यास करें।",
  "Project goal": "परियोजना का लक्ष्य",
  "Combine privacy education with a structured consent-management demonstration.": "गोपनीयता शिक्षा को एक संरचित सहमति-प्रबंधन प्रदर्शन के साथ जोड़ना।",
  "Core flow": "मुख्य प्रवाह",
  "Learn → Read notice → Make a purpose-specific choice → Review dashboard/history → Record a demo rights request.": "सीखें → नोटिस पढ़ें → उद्देश्य-विशिष्ट विकल्प चुनें → डैशबोर्ड/इतिहास की समीक्षा करें → डेमो अधिकार अनुरोध दर्ज करें।",
  "Important limitations": "महत्वपूर्ण सीमाएं",
  "The profile selector is not secure authentication. SQLite data is stored locally and is not encrypted by this demo. Use fictional data only.": "प्रोफ़ाइल चयनकर्ता सुरक्षित प्रमाणीकरण नहीं है। SQLite डेटा स्थानीय रूप से संग्रहीत किया जाता है और इस डेमो द्वारा एन्क्रिप्ट नहीं किया जाता है। केवल काल्पनिक डेटा का उपयोग करें।",
  "DPDPA Knowledge & Consent Notice": "DPDPA ज्ञान और सहमति सूचना",
  "I confirm that I have reviewed the DPDPA privacy notice and acquired understanding of my data rights.": "मैं पुष्टि करता/करती हूं कि मैंने DPDPA गोपनीयता सूचना की समीक्षा की है और अपने डेटा अधिकारों को समझ लिया है।",
  "Under Section 6 of DPDPA 2023, consent must be free, specific, informed and unambiguous with clear affirmative action.": "DPDPA 2023 की धारा 6 के तहत, सहमति स्पष्ट सकारात्मक कार्रवाई के साथ स्वतंत्र, विशिष्ट, सूचित और स्पष्ट होनी चाहिए।",
  "Contact & Organization Details": "संपर्क और संगठन विवरण",
  "At the time of giving consent, provide your organization, email and phone to be recorded in the database.": "सहमति देते समय, डेटाबेस में दर्ज करने के लिए अपना संगठन, ईमेल और फोन प्रदान करें।",
  "Organization Name": "संगठन का नाम",
  "Enter your organization / college name": "अपने संगठन / कॉलेज का नाम दर्ज करें",
  "Email ID": "ईमेल आईडी",
  "Enter your email address": "अपना ईमेल पता दर्ज करें",
  "Phone Number": "फ़ोन नंबर",
  "Enter 10-digit mobile number": "10 अंकों का मोबाइल नंबर दर्ज करें",
  "Feature Purposes & Consent Choices": "सुविधा उद्देश्य और सहमति विकल्प",
  "Save this feature choice": "इस सुविधा का विकल्प सहेजें",
  "Submit & Record All Feature Consents ↗": "सभी सुविधा सहमतियां सबमिट और रिकॉर्ड करें ↗",
  "Please confirm DPDPA knowledge before giving consent.": "कृपया सहमति देने से पहले DPDPA ज्ञान की पुष्टि करें।",
  "Please enter a valid email address.": "कृपया एक मान्य ईमेल पता दर्ज करें।",
  "Please enter a valid 10-digit phone number.": "कृपया 10 अंकों का मान्य फोन नंबर दर्ज करें।",
  "Please enter your organization name.": "कृपया अपने संगठन का नाम दर्ज करें।",
  "Consent choices and contact details saved successfully to database!": "सहमति विकल्प और संपर्क विवरण सफलतापूर्वक डेटाबेस में सहेजे गए!",
  "Organization": "संगठन",
  "Knowledge Confirmed": "ज्ञान की पुष्टि की गई",
  "DPDPA Knowledge Verified": "DPDPA ज्ञान सत्यापित",
  "Not Confirmed": "पुष्टि नहीं की गई",
  "Active Contact Details": "सक्रिय संपर्क विवरण"
};

const translationsMr = {
  "Learn": "शिका",
  "Consent": "संमती",
  "About": "प्रकल्प",
  "Home": "मुख्यपृष्ठ",
  "Know DPDPA": "DPDPA जाणून घ्या",
  "DPDPA Notes": "DPDPA नोंदी",
  "Important Points": "महत्त्वाचे मुद्दे",
  "Practice Questions": "सराव प्रश्न",
  "Quiz": "क्विझ",
  "Certificate": "प्रमाणपत्र",
  "Consent Flow": "संमती प्रक्रिया",
  "Consent Dashboard": "संमती डॅशबोर्ड",
  "Consent History": "संमती इतिहास",
  "Rights Requests": "अधिकार विनंत्या",
  "About Project": "प्रकल्पाविषयी",
  "Demo profile": "डेमो प्रोफाइल",
  "Language": "भाषा",
  "Educational privacy portal · fictional data only · Notice version": "शैक्षणिक गोपनीयता पोर्टल · केवळ काल्पनिक डेटा · सूचना आवृत्ती",
  "Education · Consent · Transparency": "शिक्षण · संमती · पारदर्शकता",
  "A student project prototype.": "विद्यार्थी प्रकल्पाचा नमुना.",
  "Not legal advice.": "कायदेशीर सल्ला नाही.",
  "Loading portal...": "पोर्टल लोड होत आहे...",
  "Student Demo": "विद्यार्थी डेमो",
  "Parent Demo": "पालक डेमो",
  "Staff Demo": "कर्मचारी डेमो",
  "Know DPDPA | Consent Flow": "Know DPDPA | संमती प्रवाह",
  "● Privacy learning, made clear": "● गोपनीयता शिक्षण, स्पष्ट आणि सुलभ",
  "Learn privacy.": "गोपनीयता शिका.",
  "Own your choices.": "आपल्या निवडींचे स्वामी व्हा.",
  "Understand the DPDPA, practise your knowledge and manage consent in one focused portal.": "एकाच केंद्रित पोर्टलवर DPDPA समजून घ्या, आपल्या ज्ञानाचा सराव करा आणि संमती व्यवस्थापित करा.",
  "Start learning ↗": "शिकणे सुरू करा ↗",
  "Manage consent": "संमती व्यवस्थापित करा",
  "Learning progress": "शिकण्याची प्रगती",
  "chapters": "धडे",
  "Consent purposes": "संमतीचे उद्देश",
  "Purpose-specific choices": "उद्देश-विशिष्ट निवडी",
  "Recorded actions": "नोंदवलेल्या कृती",
  "Local audit history": "स्थानिक ऑडिट इतिहास",
  "YOUR PORTAL": "तुमचे पोर्टल",
  "Everything in one place.": "सर्व काही एकाच ठिकाणी.",
  "A simple path from awareness to action": "जागरूकतेपासून कृतीपर्यंतचा एक सोपा मार्ग",
  "Structured learning chapters and role-based paths.": "संरचित शिक्षण धडे आणि भूमिका-आधारित मार्ग.",
  "Definitions, explanations and examples.": "व्याख्या, स्पष्टीकरण आणि उदाहरणे.",
  "Quick revision of the key concepts.": "महत्त्वाच्या संकल्पनांची जलद उजळणी.",
  "Test your understanding topic by topic.": "विषयानुसार आपल्या आकलनाची चाचणी घ्या.",
  "Read the notice and choose by purpose.": "सूचना वाचा आणि उद्देशानुसार निवड करा.",
  "Review the latest consent status.": "नवीनतम संमती स्थितीचे पुनरावलोकन करा.",
  "CONSENT FLOW": "संमती प्रक्रिया",
  "Make clear, purpose-specific choices.": "स्पष्ट, उद्देश-विशिष्ट निवडी करा.",
  "Read this sample notice before choosing. Every action is recorded in the local demo history.": "निवड करण्यापूर्वी ही नमुना सूचना वाचा. प्रत्येक कृती स्थानिक डेमो इतिहासामध्ये नोंदवली जाते.",
  "Sample privacy notice": "नमुना गोपनीयता सूचना",
  "This student prototype demonstrates how an organisation can describe a purpose before requesting a choice. It does not collect real personal information.": "हा विद्यार्थी नमुना दाखवतो की एखादी संस्था निवड मागण्यापूर्वी उद्देशाचे वर्णन कसे करू शकते. ही वास्तविक वैयक्तिक माहिती गोळा करत नाही.",
  "OPTIONAL PURPOSE": "पर्यायी उद्देश",
  "CORE DEMO PURPOSE": "मुख्य डेमो उद्देश",
  "Illustrative data ·": "उदाहरणात्मक डेटा ·",
  "Account management": "खाते व्यवस्थापन",
  "Maintain a sample profile and basic account preferences.": "एक नमुना प्रोफाइल आणि मूलभूत खाते प्राधान्ये ठेवा.",
  "Display name and account preferences": "नाव आणि खाते प्राधान्ये",
  "Analytics": "अॅनालिटिक्स (विश्लेषण)",
  "Understand how the learning portal is used and improve its pages.": "शिक्षण पोर्टल कसे वापरले जाते ते समजून घ्या आणि त्याचे पृष्ठे सुधारा.",
  "Demo page interactions": "डेमो पृष्ठ परस्परसंवाद",
  "Marketing messages": "मार्केटिंग संदेश",
  "Illustrate an optional preference for product or service updates.": "उत्पादन किंवा सेवा अद्यतनांसाठी पर्यायी प्राधान्य दर्शवा.",
  "Sample communication preference": "नमुना संप्रेषण प्राधान्य",
  "Third-party sharing": "तृतीय-पक्ष सामायिकरण",
  "Illustrate a request to share selected information with a named service provider.": "नामित सेवा प्रदात्यासह निवडलेली माहिती सामायिक करण्याच्या विनंतीचे उदाहरण द्या.",
  "No real sharing occurs in this student prototype": "या विद्यार्थी नमुन्यामध्ये कोणतेही वास्तविक सामायिकरण होत नाही",
  "Given": "संमती दिली",
  "Rejected": "नाकारले",
  "Withdrawn": "मागे घेतले",
  "Not Decided": "निर्णय घेतलेला नाही",
  "Give Consent": "संमती द्या",
  "Reject Consent": "संमती नाकारा",
  "Withdraw Consent": "संमती मागे घ्या",
  "Save choice": "निवड जतन करा",
  "CONSENT DASHBOARD": "संमती डॅशबोर्ड",
  "A clear view of your choices.": "तुमच्या निवडींचे स्पष्ट दृश्य.",
  "Latest recorded status for": "साठी नवीनतम नोंदवलेली स्थिती",
  "Active demo consents": "सक्रिय डेमो संमती",
  "Declined purposes": "नाकारलेले उद्देश",
  "Withdrawals recorded": "नोंदवलेली माघार",
  "Awaiting a choice": "निवडीची प्रतीक्षा",
  "Purpose status": "उद्देश स्थिती",
  "Notice version 1.0": "सूचना आवृत्ती 1.0",
  "CONSENT HISTORY": "संमती इतिहास",
  "Your local audit trail.": "तुमचा स्थानिक ऑडिट ट्रेल.",
  "Every consent event recorded for": "साठी नोंदवलेली प्रत्येक संमती घटना",
  "No actions recorded for this demo profile yet. Use Consent Flow to create a record.": "या डेमो प्रोफाइलसाठी अद्याप कोणतीही कृती नोंदवलेली नाही. रेकॉर्ड तयार करण्यासाठी संमती प्रक्रिया वापरा.",
  "Notice": "सूचना",
  "RIGHTS REQUESTS": "अधिकार विनंत्या",
  "Put your data rights into practice.": "आपल्या डेटा अधिकारांचा प्रत्यक्ष वापर करा.",
  "Submit a fictional request to demonstrate how a portal might record it.": "पोर्टल ते कसे नोंदवू शकते हे दाखवण्यासाठी एक काल्पनिक विनंती सबमिट करा.",
  "Request type": "विनंतीचा प्रकार",
  "Request for information": "माहितीसाठी विनंती",
  "Correction": "दुरुस्ती",
  "Erasure": "डेटा हटवणे (इरेझर)",
  "Grievance / complaint": "तक्रार / निवारण",
  "Other": "इतर",
  "Short details": "संक्षिप्त तपशील",
  "(do not enter real sensitive information)": "(वास्तविक संवेदनशील माहिती प्रविष्ट करू नका)",
  "Submit demo request ↗": "डेमो विनंती सबमिट करा ↗",
  "Recorded requests": "नोंदवलेल्या विनंत्या",
  "request(s)": "विनंती",
  "No demo requests recorded for this profile.": "या प्रोफाइलसाठी कोणतीही डेमो विनंती नोंदवलेली नाही.",
  "Received": "प्राप्त झाले",
  "Demo request recorded locally.": "डेमो विनंती स्थानिकरित्या नोंदवली गेली.",
  "IMPORTANT POINTS": "महत्त्वाचे मुद्दे",
  "The essentials, at a glance.": "महत्त्वाचे मुद्दे, एका दृष्टीक्षेपात.",
  "Select any topic to explore its important points.": "महत्त्वाचे मुद्दे जाणून घेण्यासाठी कोणताही विषय निवडा.",
  "Explore 5 important points →": "5 महत्त्वाचे मुद्दे पहा →",
  "← Back to Important Points": "← महत्त्वाच्या मुद्द्यांकडे परत जा",
  "IMPORTANT POINTS / TOPIC": "महत्त्वाचे मुद्दे / विषय",
  "Learn these five important points.": "हे पाच महत्त्वाचे मुद्दे शिका.",
  "DPDPA NOTES": "DPDPA नोंदी",
  "Understand the language of privacy.": "गोपनीयतेची भाषा समजून घ्या.",
  "Simple notes, definitions and examples for learning.": "शिकण्यासाठी साध्या नोंदी, व्याख्या आणि उदाहरणे.",
  "KNOW DPDPA": "DPDPA जाणून घ्या",
  "A self-paced learning path.": "एक स्व-गती शिक्षण मार्ग.",
  "Understand digital personal data protection from beginner to advanced level.": "सुरुवातीपासून प्रगत स्तरापर्यंत डिजिटल वैयक्तिक डेटा संरक्षण समजून घ्या.",
  "Course progress": "अभ्यासक्रमाची प्रगती",
  "Explore all chapters and learn about data protection.": "सर्व धडे एक्सप्लोर करा आणि डेटा संरक्षणाविषयी जाणून घ्या.",
  "chapters completed": "धडे पूर्ण झाले",
  "Click to read this chapter →": "हा धडा वाचण्यासाठी क्लिक करा →",
  "← Back to Chapters": "← धड्यांकडे परत जा",
  "KNOW DPDPA / CHAPTER": "DPDPA जाणून घ्या / धडा",
  "Read and understand this chapter.": "हा धडा वाचा आणि समजून घ्या.",
  "PRIVACY AWARENESS QUIZ": "गोपनीयता जागरूकता क्विझ",
  "Test your DPDPA knowledge.": "आपल्या DPDPA ज्ञानाची चाचणी घ्या.",
  "Attempt all 10 questions. You need at least 70% to pass and unlock your certificate.": "सर्व 10 प्रश्नांची उत्तरे द्या. उत्तीर्ण होण्यासाठी आणि प्रमाणपत्र मिळवण्यासाठी किमान 70% गुण आवश्यक आहेत.",
  "Question": "प्रश्न",
  "of": "/",
  "Previous": "मागील",
  "Next": "पुढील",
  "Submit Quiz": "क्विझ सबमिट करा",
  "Congratulations! You Passed!": "अभिनंदन! तुम्ही उत्तीर्ण झालात!",
  "Keep Practising!": "सराव चालू ठेवा!",
  "Your Score:": "तुमचा स्कोर:",
  "Percentage:": "टक्केवारी:",
  "You can now visit the Certificate page.": "तुम्ही आता प्रमाणपत्र पृष्ठावर जाऊ शकता.",
  "You need at least 70% to unlock the certificate.": "प्रमाणपत्र अनलॉक करण्यासाठी तुम्हाला किमान 70% गुण आवश्यक आहेत.",
  "PRACTICE QUESTIONS": "सराव प्रश्न",
  "Check what you know.": "तुम्हाला काय माहीत आहे ते तपासा.",
  "Test your understanding with topic-wise questions.": "विषयानुसार प्रश्नांसह आपल्या आकलनाची चाचणी घ्या.",
  "Submit answers": "उत्तरे सबमिट करा",
  "Your score": "तुमचा गुण",
  "CERTIFICATE": "प्रमाणपत्र",
  "Certificate of Achievement": "गौरव प्रमाणपत्र",
  "Enter student details to generate your certificate.": "आपले प्रमाणपत्र तयार करण्यासाठी विद्यार्थी तपशील प्रविष्ट करा.",
  "Student Full Name": "विद्यार्थ्याचे पूर्ण नाव",
  "Enter student name": "विद्यार्थ्याचे नाव प्रविष्ट करा",
  "Roll Number / PRN": "रोल नंबर / पीआरएन",
  "Enter Roll Number / PRN": "रोल नंबर / पीआरएन प्रविष्ट करा",
  "Course Name": "अभ्यासक्रमाचे नाव",
  "Assessment Score (%)": "मूल्यांकन गुण (%)",
  "Enter score": "गुण प्रविष्ट करा",
  "Print Certificate": "प्रमाणपत्र प्रिंट करा",
  "OF ACHIEVEMENT": "गौरवाचे",
  "This certificate is proudly presented to": "हे प्रमाणपत्र अभिमानाने प्रदान करण्यात येत आहे",
  "In recognition of successful participation in the learning programme": "शिक्षण कार्यक्रमात यशस्वी सहभागाबद्दल",
  "DPDPA Awareness and Data Privacy": "DPDPA जागरूकता आणि डेटा गोपनीयता",
  "ROLL NUMBER / PRN": "रोल नंबर / पीआरएन",
  "ASSESSMENT SCORE": "मूल्यांकन गुण",
  "ISSUE DATE": "जारी केल्याची तारीख",
  "Project Coordinator": "प्रकल्प समन्वयक",
  "Authorised Signatory": "अधिकृत स्वाक्षरीकर्ता",
  "Know DPDPA Portal": "Know DPDPA Portal",
  "CERTIFIED": "प्रमाणित",
  "Educational project certificate · Know DPDPA": "शैक्षणिक प्रकल्प प्रमाणपत्र · Know DPDPA",
  "ABOUT THIS PROJECT": "या प्रकल्पाविषयी",
  "A focused student prototype.": "एक केंद्रित विद्यार्थी नमुना.",
  "Learn DPDPA, understand consent and practise data rights in one place.": "एकाच ठिकाणी DPDPA शिका, संमती समजून घ्या आणि डेटा अधिकारांचा सराव करा.",
  "Project goal": "प्रकल्पाचे उद्दिष्ट",
  "Combine privacy education with a structured consent-management demonstration.": "गोपनीयता शिक्षणाची संरचित संमती-व्यवस्थापन प्रात्यक्षिकाशी सांगड घालणे.",
  "Core flow": "मुख्य प्रवाह",
  "Learn → Read notice → Make a purpose-specific choice → Review dashboard/history → Record a demo rights request.": "शिका → सूचना वाचा → उद्देश-विशिष्ट निवड करा → डॅशबोर्ड/इतिहास तपासा → डेमो अधिकार विनंती नोंदवा.",
  "Important limitations": "महत्त्वाच्या मर्यादा",
  "The profile selector is not secure authentication. SQLite data is stored locally and is not encrypted by this demo. Use fictional data only.": "प्रोफाइल निवडकर्ता सुरक्षित प्रमाणीकरण नाही. SQLite डेटा स्थानिकरित्या संग्रहित केला जातो आणि या डेमोद्वारे एनक्रिप्ट केलेला नाही. केवळ काल्पनिक डेटा वापरा.",
  "DPDPA Knowledge & Consent Notice": "DPDPA ज्ञान आणि संमती सूचना",
  "I confirm that I have reviewed the DPDPA privacy notice and acquired understanding of my data rights.": "मी पुष्टी करतो/करते की मी DPDPA गोपनीयता सूचनेचे पुनरावलोकन केले आहे आणि माझे डेटा अधिकार समजून घेतले आहेत.",
  "Under Section 6 of DPDPA 2023, consent must be free, specific, informed and unambiguous with clear affirmative action.": "DPDPA 2023 च्या कलम 6 अंतर्गत, संमती स्पष्ट सकारात्मक कृतीसह मुक्त, विशिष्ट, माहितीपूर्ण आणि स्पष्ट असावी.",
  "Contact & Organization Details": "संपर्क आणि संस्था तपशील",
  "At the time of giving consent, provide your organization, email and phone to be recorded in the database.": "संमती देताना, डेटाबेसमध्ये नोंद करण्यासाठी आपली संस्था, ईमेल आणि फोन प्रदान करा.",
  "Organization Name": "संस्थेचे नाव",
  "Enter your organization / college name": "तुमच्या संस्थेचे / कॉलेजचे नाव प्रविष्ट करा",
  "Email ID": "ईमेल आयडी",
  "Enter your email address": "तुमचा ईमेल पत्ता प्रविष्ट करा",
  "Phone Number": "फोन नंबर",
  "Enter 10-digit mobile number": "10 अंकी मोबाईल नंबर प्रविष्ट करा",
  "Feature Purposes & Consent Choices": "वैशिष्ट्ये उद्देश आणि संमती निवडी",
  "Save this feature choice": "या वैशिष्ट्याची निवड जतन करा",
  "Submit & Record All Feature Consents ↗": "सर्व वैशिष्ट्य संमती सबमिट आणि नोंदवा ↗",
  "Please confirm DPDPA knowledge before giving consent.": "कृपया संमती देण्यापूर्वी DPDPA ज्ञानाची पुष्टी करा.",
  "Please enter a valid email address.": "कृपया वैध ईमेल पत्ता प्रविष्ट करा.",
  "Please enter a valid 10-digit phone number.": "कृपया 10 अंकी वैध फोन नंबर प्रविष्ट करा.",
  "Please enter your organization name.": "कृपया तुमच्या संस्थेचे नाव प्रविष्ट करा.",
  "Consent choices and contact details saved successfully to database!": "संमती निवडी आणि संपर्क तपशील डेटाबेसमध्ये यशस्वीरित्या जतन केले गेले!",
  "Organization": "संस्था",
  "Knowledge Confirmed": "ज्ञानाची पुष्टी केली",
  "DPDPA Knowledge Verified": "DPDPA ज्ञान सत्यापित",
  "Not Confirmed": "पुष्टी केलेली नाही",
  "Active Contact Details": "सक्रिय संपर्क तपशील"
};

i18next.init({
  lng: "en",
  fallbackLng: "en",
  resources: {
    en: { translation: {} },
    hi: { translation: translationsHi },
    mr: { translation: translationsMr }
  }
});

const tr = (key) => {
  if (!key) return "";
  const translated = i18next.t(key);
  return translated || key;
};

function translateTextNodes(root, targetLanguage) {
  if (targetLanguage === "en") {
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walk.nextNode())) {
      if (originalTextByNode.has(node)) {
        node.nodeValue = originalTextByNode.get(node);
      }
    }
    domTranslationLanguage = "en";
    document.documentElement.lang = "en";
    document.title = "Know DPDPA | Consent Flow";
    return;
  }

  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walk.nextNode())) {
    const raw = node.nodeValue;
    const text = raw.trim();
    if (!text) continue;
    if (!originalTextByNode.has(node)) {
      originalTextByNode.set(node, raw);
    }
    const orig = originalTextByNode.get(node).trim();
    const translated = i18next.t(orig, { lng: targetLanguage });
    if (translated && translated !== orig) {
      node.nodeValue = originalTextByNode.get(node).replace(orig, translated);
    }
  }
  domTranslationLanguage = targetLanguage;
  document.documentElement.lang = targetLanguage;
  const translatedTitle = i18next.t("Know DPDPA | Consent Flow", { lng: targetLanguage });
  if (translatedTitle && translatedTitle !== "Know DPDPA | Consent Flow") {
    document.title = translatedTitle;
  }
}

function applyWholePageLanguage(languageName) {
  const languageCode = languageCodes[languageName] || "en";
  i18next.changeLanguage(languageCode);
  localStorage.setItem(DOM_TRANSLATION_STORAGE_KEY, languageName);
  translateTextNodes(document.body, languageCode);

  if (!domTranslationObserver) {
    domTranslationObserver = new MutationObserver(() => {
      clearTimeout(domTranslationTimer);
      domTranslationTimer = setTimeout(() => {
        if (domTranslationLanguage !== "en") {
          translateTextNodes(document.body, domTranslationLanguage);
        }
      }, 180);
    });
    domTranslationObserver.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }
}

const pageGroups = [
  {
    label: "Learn",
    pages: [
      "Home",
      "Know DPDPA",
      "DPDPA Notes",
      "Important Points",
      "Practice Questions",
      "Quiz",
      "Certificate"
    ]
  },
  {
    label: "Consent",
    pages: [
      "Consent Flow",
      "Consent Dashboard",
      "Consent History",
      "Rights Requests"
    ]
  },
  {
    label: "About",
    pages: ["About Project"]
  }
];

const importantPointsEn = [
  {
    "title": "DPDP Act, 2023",
    "points": [
      "DPDP stands for Digital Personal Data Protection.",
      "The Act was passed in India in 2023.",
      "It deals with the processing of digital personal data.",
      "It aims to protect individuals' personal data.",
      "It establishes responsibilities for organisations processing personal data."
    ]
  },
  {
    "title": "Personal Data",
    "points": [
      "Personal data is information about an identifiable individual.",
      "It can include a person's name, phone number and email address.",
      "Digital photographs can also be personal data.",
      "Personal data may be processed for a specific purpose.",
      "Organisations should handle personal data responsibly and securely."
    ]
  },
  {
    "title": "Data Principal",
    "points": [
      "A Data Principal is the individual to whom personal data relates.",
      "A person is the Data Principal for their own personal data.",
      "A Data Principal can give or withdraw consent.",
      "A Data Principal has rights under the DPDP Act.",
      "These rights include correction, erasure and grievance redressal, subject to the Act."
    ]
  },
  {
    "title": "Data Fiduciary",
    "points": [
      "A Data Fiduciary determines the purpose of processing personal data.",
      "It also determines the means of processing.",
      "It must follow the applicable requirements of the DPDP Act.",
      "It must take reasonable security safeguards to protect personal data.",
      "It has responsibilities relating to consent, notices and data breaches."
    ]
  },
  {
    "title": "Consent",
    "points": [
      "Consent must be free.",
      "Consent must be specific and informed.",
      "Consent must be unconditional and unambiguous.",
      "It must be given through a clear affirmative action.",
      "The individual should know the purpose for which their data is being used."
    ]
  },
  {
    "title": "Consent Withdrawal",
    "points": [
      "A Data Principal can withdraw consent.",
      "Withdrawal should be as easy as giving consent.",
      "The individual can use the available withdrawal option.",
      "After withdrawal, the Data Fiduciary must stop processing based on that consent, subject to the Act.",
      "Withdrawal does not make earlier lawful processing invalid."
    ]
  }
];
const importantPointsHi = [
  {
    "title": "DPDP अधिनियम, 2023",
    "points": [
      "DPDP का अर्थ डिजिटल पर्सनल डेटा प्रोटेक्शन (डिजिटल व्यक्तिगत डेटा संरक्षण) है।",
      "यह अधिनियम भारत में 2023 में पारित किया गया था।",
      "यह डिजिटल व्यक्तिगत डेटा के प्रसंस्करण से संबंधित है।",
      "इसका उद्देश्य व्यक्तियों के व्यक्तिगत डेटा की रक्षा करना है।",
      "यह व्यक्तिगत डेटा संसाधित करने वाले संगठनों के लिए जिम्मेदारियां स्थापित करता है।"
    ]
  },
  {
    "title": "व्यक्तिगत डेटा",
    "points": [
      "व्यक्तिगत डेटा किसी पहचान योग्य व्यक्ति के बारे में जानकारी है।",
      "इसमें किसी व्यक्ति का नाम, फोन नंबर और ईमेल पता शामिल हो सकता है।",
      "डिजिटल तस्वीरें भी व्यक्तिगत डेटा हो सकती हैं।",
      "व्यक्तिगत डेटा को किसी विशिष्ट उद्देश्य के लिए संसाधित किया जा सकता है।",
      "संगठनों को व्यक्तिगत डेटा को जिम्मेदारी और सुरक्षित रूप से संभालना चाहिए।"
    ]
  },
  {
    "title": "डेटा प्रिंसिपल (डेटा स्वामी)",
    "points": [
      "डेटा प्रिंसिपल वह व्यक्ति होता है जिससे व्यक्तिगत डेटा संबंधित होता है।",
      "एक व्यक्ति अपने व्यक्तिगत डेटा के लिए डेटा प्रिंसिपल होता है।",
      "डेटा प्रिंसिपल सहमति दे सकता है या वापस ले सकता है।",
      "डेटा प्रिंसिपल के पास DPDP अधिनियम के तहत अधिकार हैं।",
      "इन अधिकारों में अधिनियम के तहत सुधार, मिटाना और शिकायत निवारण शामिल हैं।"
    ]
  },
  {
    "title": "डेटा फिड्यूशरी (डेटा न्यासी)",
    "points": [
      "डेटा फिड्यूशरी व्यक्तिगत डेटा के प्रसंस्करण के उद्देश्य को निर्धारित करता है।",
      "यह प्रसंस्करण के साधनों को भी निर्धारित करता है।",
      "इसे DPDP अधिनियम की लागू आवश्यकताओं का पालन करना चाहिए।",
      "इसे व्यक्तिगत डेटा की सुरक्षा के लिए उचित सुरक्षा उपाय करने चाहिए।",
      "इसकी सहमति, नोटिस और डेटा उल्लंघन से संबंधित जिम्मेदारियां हैं।"
    ]
  },
  {
    "title": "सहमति",
    "points": [
      "सहमति स्वतंत्र होनी चाहिए।",
      "सहमति विशिष्ट और सूचित होनी चाहिए।",
      "सहमति बिना शर्त और स्पष्ट होनी चाहिए।",
      "यह एक स्पष्ट सकारात्मक कार्रवाई के माध्यम से दी जानी चाहिए।",
      "व्यक्ति को वह उद्देश्य पता होना चाहिए जिसके लिए उसके डेटा का उपयोग किया जा रहा है।"
    ]
  },
  {
    "title": "सहमति की वापसी",
    "points": [
      "एक डेटा प्रिंसिपल सहमति वापस ले सकता है।",
      "सहमति वापस लेना उतना ही आसान होना चाहिए जितना सहमति देना था।",
      "व्यक्ति उपलब्ध वापसी विकल्प का उपयोग कर सकता है।",
      "वापसी के बाद, डेटा फिड्यूशरी को उस सहमति के आधार पर प्रसंस्करण बंद करना होगा।",
      "वापसी से पहले की गई कानूनी प्रक्रिया अमान्य नहीं होती है।"
    ]
  }
];
const importantPointsMr = [
  {
    "title": "DPDP कायदा, 2023",
    "points": [
      "DPDP चा अर्थ डिजिटल वैयक्तिक डेटा संरक्षण असा आहे.",
      "हा कायदा भारतात 2023 मध्ये मंजूर करण्यात आला.",
      "हा डिजिटल वैयक्तिक डेटाच्या प्रक्रियेशी संबंधित आहे.",
      "याचा उद्देश व्यक्तींच्या वैयक्तिक डेटाचे संरक्षण करणे हा आहे.",
      "हा वैयक्तिक डेटावर प्रक्रिया करणाऱ्या संस्थांसाठी जबाबदाऱ्या निश्चित करतो."
    ]
  },
  {
    "title": "वैयक्तिक डेटा",
    "points": [
      "वैयक्तिक डेटा म्हणजे ओळख पटवता येण्याजोग्या व्यक्तीबद्दलची माहिती.",
      "यात व्यक्तीचे नाव, फोन नंबर आणि ईमेल पत्ता समाविष्ट असू शकतो.",
      "डिजिटल छायाचित्रे देखील वैयक्तिक डेटा असू शकतात.",
      "वैयक्तिक डेटावर विशिष्ट हेतूसाठी प्रक्रिया केली जाऊ शकते.",
      "संस्थांनी वैयक्तिक डेटा जबाबदारीने आणि सुरक्षितपणे हाताळला पाहिजे."
    ]
  },
  {
    "title": "डेटा प्रिन्सिपल (डेटा मालक)",
    "points": [
      "डेटा प्रिन्सिपल ही ती व्यक्ती असते जिच्याशी वैयक्तिक डेटा संबंधित असतो.",
      "एक व्यक्ती तिच्या स्वतःच्या वैयक्तिक डेटासाठी डेटा प्रिन्सिपल असते.",
      "डेटा प्रिन्सिपल संमती देऊ किंवा मागे घेऊ शकतो.",
      "डेटा प्रिन्सिपलकडे DPDP कायद्यांतर्गत अधिकार आहेत.",
      "या अधिकारांमध्ये दुरुस्ती, डेटा हटवणे आणि तक्रार निवारण यांचा समावेश आहे."
    ]
  },
  {
    "title": "डेटा फिड्युशियरी (डेटा विश्वस्त)",
    "points": [
      "डेटा फिड्युशियरी वैयक्तिक डेटावर प्रक्रिया करण्याचा उद्देश ठरवतो.",
      "तो प्रक्रियेची साधने देखील ठरवतो.",
      "त्यांनी DPDP कायद्याच्या लागू आवश्यकतांचे पालन केले पाहिजे.",
      "त्यांनी वैयक्तिक डेटाचे संरक्षण करण्यासाठी वाजवी सुरक्षा उपाय केले पाहिजेत.",
      "त्यांच्याकडे संमती, सूचना आणि डेटा उल्लंघनाशी संबंधित जबाबदाऱ्या आहेत."
    ]
  },
  {
    "title": "संमती",
    "points": [
      "संमती मुक्त (कोणत्याही दबावाशिवाय) असावी.",
      "संमती विशिष्ट आणि माहितीपूर्ण असावी.",
      "संमती बिनशर्त आणि स्पष्ट असावी.",
      "ती एका स्पष्ट सकारात्मक कृतीद्वारे दिली पाहिजे.",
      "व्यक्तीला तिचा डेटा कोणत्या उद्देशासाठी वापरला जात आहे हे माहित असावे."
    ]
  },
  {
    "title": "संमती मागे घेणे",
    "points": [
      "डेटा प्रिन्सिपल संमती मागे घेऊ शकतो.",
      "संमती मागे घेणे हे संमती देण्याइतकेच सोपे असावे.",
      "व्यक्ती उपलब्ध माघार पर्यायाचा वापर करू शकते.",
      "माघार घेतल्यानंतर, डेटा फिड्युशियरीने त्या संमतीवर आधारित प्रक्रिया थांबवली पाहिजे.",
      "माघार घेतल्याने आधीची कायदेशीर प्रक्रिया अवैध ठरत नाही."
    ]
  }
];

function getImportantPoints(lang) {
  if (lang === "hi" || lang === "हिन्दी (Hindi)") return importantPointsHi;
  if (lang === "mr" || lang === "मराठी (Marathi)") return importantPointsMr;
  return importantPointsEn;
}

const practiceQuestionsEn = [
  [
    "In which year was the DPDP Act passed?",
    [
      "2021",
      "2022",
      "2023",
      "2025"
    ],
    "2023"
  ],
  [
    "Who is a Data Principal?",
    [
      "The individual whose data is involved",
      "A database",
      "A software company",
      "A government website"
    ],
    "The individual whose data is involved"
  ],
  [
    "What is digital personal data?",
    [
      "Only paper records",
      "Personal data in digital form",
      "Only passwords",
      "Only photographs"
    ],
    "Personal data in digital form"
  ],
  [
    "Who determines the purpose and means of processing personal data?",
    [
      "Data Principal",
      "Data Fiduciary",
      "Data Processor only",
      "Website visitor"
    ],
    "Data Fiduciary"
  ],
  [
    "Which action can a Data Principal take regarding consent?",
    [
      "Withdraw consent",
      "Change the law",
      "Delete every company's database",
      "Appoint a Data Fiduciary"
    ],
    "Withdraw consent"
  ]
];
const practiceQuestionsHi = [
  [
    "DPDP अधिनियम किस वर्ष पारित किया गया था?",
    [
      "2021",
      "2022",
      "2023",
      "2025"
    ],
    "2023"
  ],
  [
    "डेटा प्रिंसिपल कौन है?",
    [
      "वह व्यक्ति जिसका डेटा शामिल है",
      "एक डेटाबेस",
      "एक सॉफ्टवेयर कंपनी",
      "एक सरकारी वेबसाइट"
    ],
    "वह व्यक्ति जिसका डेटा शामिल है"
  ],
  [
    "डिजिटल व्यक्तिगत डेटा क्या है?",
    [
      "केवल कागजी रिकॉर्ड",
      "डिजिटल रूप में व्यक्तिगत डेटा",
      "केवल पासवर्ड",
      "केवल तस्वीरें"
    ],
    "डिजिटल रूप में व्यक्तिगत डेटा"
  ],
  [
    "व्यक्तिगत डेटा के प्रसंस्करण के उद्देश्य और साधनों को कौन निर्धारित करता है?",
    [
      "डेटा प्रिंसिपल",
      "डेटा फिड्यूशरी",
      "केवल डेटा प्रोसेसर",
      "वेबसाइट आगंतुक"
    ],
    "डेटा फिड्यूशरी"
  ],
  [
    "सहमति के संबंध में डेटा प्रिंसिपल क्या कार्रवाई कर सकता है?",
    [
      "सहमति वापस लेना",
      "कानून बदलना",
      "हर कंपनी का डेटाबेस हटाना",
      "डेटा फिड्यूशरी नियुक्त करना"
    ],
    "सहमति वापस लेना"
  ]
];
const practiceQuestionsMr = [
  [
    "DPDP कायदा कोणत्या वर्षी मंजूर करण्यात आला?",
    [
      "2021",
      "2022",
      "2023",
      "2025"
    ],
    "2023"
  ],
  [
    "डेटा प्रिन्सिपल कोण आहे?",
    [
      "ज्या व्यक्तीचा डेटा गुंतलेला आहे ती व्यक्ती",
      "एक डेटाबेस",
      "एक सॉफ्टवेअर कंपनी",
      "एक सरकारी संकेतस्थळ"
    ],
    "ज्या व्यक्तीचा डेटा गुंतलेला आहे ती व्यक्ती"
  ],
  [
    "डिजिटल वैयक्तिक डेटा म्हणजे काय?",
    [
      "केवळ कागदी नोंदी",
      "डिजिटल स्वरूपातील वैयक्तिक डेटा",
      "केवळ पासवर्ड",
      "केवळ छायाचित्रे"
    ],
    "डिजिटल स्वरूपातील वैयक्तिक डेटा"
  ],
  [
    "वैयक्तिक डेटा प्रक्रियेचा उद्देश आणि साधने कोण ठरवतो?",
    [
      "डेटा प्रिन्सिपल",
      "डेटा फिड्युशियरी",
      "केवळ डेटा प्रोसेसर",
      "वेबसाइट भेट देणारा"
    ],
    "डेटा फिड्युशियरी"
  ],
  [
    "संमतीच्या बाबतीत डेटा प्रिन्सिपल कोणती कृती करू शकतो?",
    [
      "संमती मागे घेणे",
      "कायदा बदलणे",
      "प्रत्येक कंपनीचा डेटाबेस हटवणे",
      "डेटा फिड्युशियरी नियुक्त करणे"
    ],
    "संमती मागे घेणे"
  ]
];

function getPracticeQuestions(lang) {
  if (lang === "hi" || lang === "हिन्दी (Hindi)") return practiceQuestionsHi;
  if (lang === "mr" || lang === "मराठी (Marathi)") return practiceQuestionsMr;
  return practiceQuestionsEn;
}

const quizQuestionsEn = [
  {
    "question": "In which year was the Digital Personal Data Protection Act passed?",
    "options": [
      "2021",
      "2022",
      "2023",
      "2025"
    ],
    "answer": 2
  },
  {
    "question": "Who is a Data Principal?",
    "options": [
      "The individual whose personal data is involved",
      "A software company",
      "A government department",
      "A database administrator"
    ],
    "answer": 0
  },
  {
    "question": "Who determines the purpose and means of processing personal data?",
    "options": [
      "Data Principal",
      "Data Fiduciary",
      "Data Processor",
      "Website visitor"
    ],
    "answer": 1
  },
  {
    "question": "What is required for valid consent under the DPDP Act?",
    "options": [
      "Silence from the user",
      "Pre-selected consent",
      "Clear affirmative action",
      "Automatic acceptance"
    ],
    "answer": 2
  },
  {
    "question": "Can a Data Principal withdraw consent?",
    "options": [
      "Yes",
      "No",
      "Only after five years",
      "Only with court permission"
    ],
    "answer": 0
  },
  {
    "question": "Under the DPDP Act, a child is an individual below what age?",
    "options": [
      "14 years",
      "16 years",
      "18 years",
      "21 years"
    ],
    "answer": 2
  },
  {
    "question": "What does a Data Processor do?",
    "options": [
      "Makes privacy laws",
      "Processes personal data on behalf of a Data Fiduciary",
      "Owns all personal data",
      "Issues government certificates"
    ],
    "answer": 1
  },
  {
    "question": "What should a privacy notice explain?",
    "options": [
      "Only the company name",
      "The personal data and purpose of processing",
      "Only the website design",
      "Only the user's password"
    ],
    "answer": 1
  },
  {
    "question": "Which right is available to a Data Principal under the DPDP Act?",
    "options": [
      "Right to grievance redressal",
      "Right to change the Act",
      "Right to appoint a minister",
      "Right to control every company"
    ],
    "answer": 0
  },
  {
    "question": "Who is responsible for implementing reasonable security safeguards to protect personal data?",
    "options": [
      "Data Principal",
      "Data Fiduciary",
      "Website visitor",
      "Internet provider only"
    ],
    "answer": 1
  }
];
const quizQuestionsHi = [
  {
    "question": "डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम किस वर्ष पारित किया गया था?",
    "options": [
      "2021",
      "2022",
      "2023",
      "2025"
    ],
    "answer": 2
  },
  {
    "question": "डेटा प्रिंसिपल कौन है?",
    "options": [
      "वह व्यक्ति जिससे व्यक्तिगत डेटा संबंधित है",
      "एक सॉफ्टवेयर कंपनी",
      "एक सरकारी विभाग",
      "एक डेटाबेस व्यवस्थापक"
    ],
    "answer": 0
  },
  {
    "question": "व्यक्तिगत डेटा के प्रसंस्करण के उद्देश्य और साधनों को कौन निर्धारित करता है?",
    "options": [
      "डेटा प्रिंसिपल",
      "डेटा फिड्यूशरी",
      "डेटा प्रोसेसर",
      "वेबसाइट आगंतुक"
    ],
    "answer": 1
  },
  {
    "question": "DPDP अधिनियम के तहत वैध सहमति के लिए क्या आवश्यक है?",
    "options": [
      "उपयोगकर्ता की चुप्पी",
      "पहले से चयनित सहमति",
      "स्पष्ट सकारात्मक कार्रवाई",
      "स्वचालित स्वीकृति"
    ],
    "answer": 2
  },
  {
    "question": "क्या डेटा प्रिंसिपल सहमति वापस ले सकता है?",
    "options": [
      "हाँ",
      "नहीं",
      "केवल पांच साल बाद",
      "केवल अदालत की अनुमति से"
    ],
    "answer": 0
  },
  {
    "question": "DPDP अधिनियम के तहत, बच्चा किस आयु से कम का व्यक्ति है?",
    "options": [
      "14 वर्ष",
      "16 वर्ष",
      "18 वर्ष",
      "21 वर्ष"
    ],
    "answer": 2
  },
  {
    "question": "डेटा प्रोसेसर क्या करता है?",
    "options": [
      "गोपनीयता कानून बनाता है",
      "डेटा फिड्यूशरी की ओर से व्यक्तिगत डेटा संसाधित करता है",
      "सभी व्यक्तिगत डेटा का स्वामी है",
      "सरकारी प्रमाण पत्र जारी करता है"
    ],
    "answer": 1
  },
  {
    "question": "गोपनीयता सूचना में क्या स्पष्ट किया जाना चाहिए?",
    "options": [
      "केवल कंपनी का नाम",
      "व्यक्तिगत डेटा और प्रसंस्करण का उद्देश्य",
      "केवल वेबसाइट डिज़ाइन",
      "केवल उपयोगकर्ता का पासवर्ड"
    ],
    "answer": 1
  },
  {
    "question": "DPDP अधिनियम के तहत डेटा प्रिंसिपल को कौन सा अधिकार उपलब्ध है?",
    "options": [
      "शिकायत निवारण का अधिकार",
      "अधिनियम बदलने का अधिकार",
      "मंत्री नियुक्त करने का अधिकार",
      "हर कंपनी को नियंत्रित करने का अधिकार"
    ],
    "answer": 0
  },
  {
    "question": "व्यक्तिगत डेटा की सुरक्षा के लिए उचित सुरक्षा उपाय लागू करने के लिए कौन जिम्मेदार है?",
    "options": [
      "डेटा प्रिंसिपल",
      "डेटा फिड्यूशरी",
      "वेबसाइट आगंतुक",
      "केवल इंटरनेट प्रदाता"
    ],
    "answer": 1
  }
];
const quizQuestionsMr = [
  {
    "question": "डिजिटल वैयक्तिक डेटा संरक्षण कायदा कोणत्या वर्षी मंजूर करण्यात आला?",
    "options": [
      "2021",
      "2022",
      "2023",
      "2025"
    ],
    "answer": 2
  },
  {
    "question": "डेटा प्रिन्सिपल कोण आहे?",
    "options": [
      "ज्या व्यक्तीशी वैयक्तिक डेटा संबंधित आहे ती व्यक्ती",
      "एक सॉफ्टवेअर कंपनी",
      "एक सरकारी विभाग",
      "एक डेटाबेस प्रशासक"
    ],
    "answer": 0
  },
  {
    "question": "वैयक्तिक डेटा प्रक्रियेचा उद्देश आणि साधने कोण ठरवतो?",
    "options": [
      "डेटा प्रिन्सिपल",
      "डेटा फिड्युशियरी",
      "डेटा प्रोसेसर",
      "वेबसाइट भेट देणारा"
    ],
    "answer": 1
  },
  {
    "question": "DPDP कायद्यांतर्गत वैध संमतीसाठी काय आवश्यक आहे?",
    "options": [
      "वापरकर्त्याचे मौन",
      "आधीच निवडलेली संमती",
      "स्पष्ट सकारात्मक कृती",
      "स्वयंचलित स्वीकृती"
    ],
    "answer": 2
  },
  {
    "question": "डेटा प्रिन्सिपल संमती मागे घेऊ शकतो का?",
    "options": [
      "होय",
      "नाही",
      "केवळ पाच वर्षांनंतर",
      "केवळ न्यायालयाच्या परवानगीने"
    ],
    "answer": 0
  },
  {
    "question": "DPDP कायद्यानुसार, मूल म्हणजे कोणत्या वयाखालील व्यक्ती?",
    "options": [
      "14 वर्षे",
      "16 वर्षे",
      "18 वर्षे",
      "21 वर्षे"
    ],
    "answer": 2
  },
  {
    "question": "डेटा प्रोसेसर काय करतो?",
    "options": [
      "गोपनीयता कायदे तयार करतो",
      "डेटा फिड्युशियरीच्या वतीने वैयक्तिक डेटावर प्रक्रिया करतो",
      "सर्व वैयक्तिक डेटाचा मालक असतो",
      "सरकारी प्रमाणपत्रे जारी करतो"
    ],
    "answer": 1
  },
  {
    "question": "गोपनीयता सूचनेत काय स्पष्ट केले पाहिजे?",
    "options": [
      "केवळ कंपनीचे नाव",
      "वैयक्तिक डेटा आणि प्रक्रियेचा उद्देश",
      "केवळ वेबसाइट डिझाइन",
      "केवळ वापरकर्त्याचा पासवर्ड"
    ],
    "answer": 1
  },
  {
    "question": "DPDP कायद्यांतर्गत डेटा प्रिन्सिपलला कोणता अधिकार उपलब्ध आहे?",
    "options": [
      "तक्रार निवारणाचा अधिकार",
      "कायदा बदलण्याचा अधिकार",
      "मंत्री नियुक्त करण्याचा अधिकार",
      "प्रत्येक कंपनी नियंत्रित करण्याचा अधिकार"
    ],
    "answer": 0
  },
  {
    "question": "वैयक्तिक डेटाचे संरक्षण करण्यासाठी वाजवी सुरक्षा उपाय करण्यासाठी कोण जबाबदार आहे?",
    "options": [
      "डेटा प्रिन्सिपल",
      "डेटा फिड्युशियरी",
      "वेबसाइट भेट देणारा",
      "केवळ इंटरनेट प्रदाता"
    ],
    "answer": 1
  }
];

function getQuizQuestions(lang) {
  if (lang === "hi" || lang === "हिन्दी (Hindi)") return quizQuestionsHi;
  if (lang === "mr" || lang === "मराठी (Marathi)") return quizQuestionsMr;
  return quizQuestionsEn;
}

const languages = [
  "English",
  "हिन्दी (Hindi)",
  "मराठी (Marathi)",
];

async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
  } catch (err) {
    if (API_BASE !== "http://127.0.0.1:8504") {
      try {
        response = await fetch(`http://127.0.0.1:8504${path}`, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
          }
        });
      } catch (fallbackErr) {
        throw new Error(`Cannot connect to backend server. Please make sure 'python api.py' is running on port 8504.`);
      }
    } else {
      throw new Error(`Cannot connect to backend server at ${API_BASE}. Please make sure 'python api.py' is running.`);
    }
  }

  const contentType = response.headers.get("content-type") || "";
  let payload;
  if (contentType.includes("application/json")) {
    payload = await response.json();
  } else {
    if (API_BASE !== "http://127.0.0.1:8504") {
      try {
        const retryResp = await fetch(`http://127.0.0.1:8504${path}`, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
          }
        });
        const retryType = retryResp.headers.get("content-type") || "";
        if (retryType.includes("application/json")) {
          const retryPayload = await retryResp.json();
          if (!retryResp.ok) throw new Error(retryPayload.error || "Request failed");
          return retryPayload;
        }
      } catch (_) {}
    }
    const text = await response.text();
    throw new Error(`Server returned non-JSON response (${response.status}). Please make sure 'python api.py' is running on port 8504.`);
  }

  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }

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
  const [quizResult, setQuizResult] = useState(null);
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
    const savedLanguage = localStorage.getItem(DOM_TRANSLATION_STORAGE_KEY);
    if (savedLanguage && languageCodes[savedLanguage]) {
      setLanguage(savedLanguage);
      applyWholePageLanguage(savedLanguage);
    }
  }, []);
  useEffect(() => {
    if (mainRef.current) window.gsap.fromTo(mainRef.current.querySelectorAll(".animate-in"), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.06, ease: "power2.out" });
  }, [page]);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timeout);
  }, [toast]);

  if (!data) return <div className="loading">{tr("Loading portal...")}</div>;
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
            <select value={profile} onChange={(event) => setProfile(event.target.value)}>
              {data.profiles.map((item) => <option key={item} value={item}>{tr(item)}</option>)}
            </select>
          </div>
          <div className="language-card">
            <label>{tr("Language")}</label>
            <select aria-label={tr("Language")} value={language} onChange={(event) => {
              const nextLanguage = event.target.value;
              setLanguage(nextLanguage);
              applyWholePageLanguage(nextLanguage);
            }}>
              {languages.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
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
          <div className="topbar">
            <span className="eyebrow">{tr("KNOW DPDPA")} / {tr(page).toUpperCase()}</span>
            <span className="user-chip">● {tr(profile)}</span>
          </div>
          {page === "Home" && <Home setPage={setPage} completed={completed} history={history} language={language} />}
          {page === "Consent Flow" && <ConsentFlow data={data} statuses={statuses} profile={profile} language={language} onSaved={async (message, isError) => {
            if (!isError) {
              try { await refresh(); } catch (_) {}
            }
            setToast(message);
          }} />}
          {page === "Consent Dashboard" && <Dashboard statuses={statuses} profile={profile} language={language} />}
          {page === "Consent History" && <History history={history} profile={profile} language={language} />}
          {page === "Rights Requests" && <RightsRequests requests={requests} profile={profile} language={language} onSaved={async (message) => { await refresh(); setToast(message || tr("Demo request recorded locally.")); }} />}
          {page === "Important Points" && <Points language={language} />}
          {page === "DPDPA Notes" && <Notes language={language} />}
          {page === "Practice Questions" && <Practice language={language} />}
          {page === "Quiz" && (
            <Quiz onComplete={setQuizResult} language={language} />
          )}
          {page === "Certificate" && (
            <Certificate profile={profile} quizResult={quizResult} language={language} />
          )}
          {page === "Know DPDPA" && <Learning completed={completed} language={language} />}
          {page === "About Project" && <About language={language} />}
        </main>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function Home({ setPage, completed, history, language }) {
  const actions = [
    ["Know DPDPA", "Structured learning chapters and role-based paths."],
    ["DPDPA Notes", "Definitions, explanations and examples."],
    ["Important Points", "Quick revision of the key concepts."],
    ["Practice Questions", "Test your understanding topic by topic."],
    ["Consent Flow", "Read the notice and choose by purpose."],
    ["Consent Dashboard", "Review the latest consent status."],
  ];
  return <section>
    <div className="hero animate-in">
      <div>
        <span className="hero-tag">● {tr("Privacy learning, made clear")}</span>
        <h1>{tr("Learn privacy.")}<br /><em>{tr("Own your choices.")}</em></h1>
        <p>{tr("Understand the DPDPA, practise your knowledge and manage consent in one focused portal.")}</p>
        <div className="hero-actions">
          <button className="button dark" onClick={() => setPage("Know DPDPA")}>{tr("Start learning ↗")}</button>
          <button className="button light" onClick={() => setPage("Consent Flow")}>{tr("Manage consent")}</button>
        </div>
      </div>
      <div className="hero-orbit"><span>DPDPA</span><i>✳</i></div>
    </div>
    <div className="stats-row animate-in">
      <Stat label={tr("Learning progress")} value={`${Math.round((completed / 15) * 100)}%`} detail={`${completed}/15 ${tr("chapters")}`} />
      <Stat label={tr("Consent purposes")} value="4" detail={tr("Purpose-specific choices")} />
      <Stat label={tr("Recorded actions")} value={history.length} detail={tr("Local audit history")} />
    </div>
    <div className="section-heading animate-in">
      <div>
        <span className="eyebrow">{tr("YOUR PORTAL")}</span>
        <h2>{tr("Everything in one place.")}</h2>
      </div>
      <span className="section-note">{tr("A simple path from awareness to action")}</span>
    </div>
    <div className="action-grid">
      {actions.map(([title, detail]) => (
        <button className="action-card animate-in" onClick={() => setPage(title)} key={title}>
          <span className="card-icon">✳</span>
          <span><b>{tr(title)}</b><small>{tr(detail)}</small></span>
          <strong>↗</strong>
        </button>
      ))}
    </div>
  </section>;
}

function Stat({ label, value, detail }) { return <div className="stat-card"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>; }

function ConsentFlow({ data, statuses, profile, language, onSaved }) {
  const [choices, setChoices] = useState({});
  const [organization, setOrganization] = useState("ABC Learning Technologies");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [knowledgeConfirmed, setKnowledgeConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load existing contact details if already saved in database
  useEffect(() => {
    let isMounted = true;
    api(`/api/contact?user=${encodeURIComponent(profile)}`)
      .then((res) => {
        if (isMounted && res.contact) {
          if (res.contact.organization) setOrganization(res.contact.organization);
          if (res.contact.email) setEmail(res.contact.email);
          if (res.contact.phone) setPhone(res.contact.phone);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [profile]);

  const validateInputs = () => {
    if (!knowledgeConfirmed) {
      throw new Error(tr("Please confirm DPDPA knowledge before giving consent."));
    }
    if (!organization.trim()) {
      throw new Error(tr("Please enter your organization name."));
    }
    if (!email.trim() || !email.includes("@") || !email.includes(".")) {
      throw new Error(tr("Please enter a valid email address."));
    }
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length < 10) {
      throw new Error(tr("Please enter a valid 10-digit phone number."));
    }
  };

  const saveSingle = async (purpose) => {
    try {
      validateInputs();
      setSaving(true);
      const choice = choices[purpose] || "Give Consent";
      const action = choice === "Give Consent" ? "Given" : choice === "Reject Consent" ? "Rejected" : "Withdrawn";
      await api("/api/consent", {
        method: "POST",
        body: JSON.stringify({
          user: profile,
          purpose,
          action,
          email: email.trim(),
          phone: phone.trim(),
          organization: organization.trim(),
          knowledgeConfirmed: true
        })
      });
      const actionText = tr(action);
      const purposeText = tr(purpose);
      const langCode = languageCodes[language] || "en";
      let msg = `${action} recorded for ${purpose}. Stored for ${organization}.`;
      if (langCode === "hi") msg = `${purposeText} के लिए ${actionText} दर्ज किया गया (${organization} के लिए डेटाबेस में सहेजा गया)।`;
      else if (langCode === "mr") msg = `${purposeText} साठी ${actionText} नोंदवले गेले (${organization} साठी डेटाबेसमध्ये जतन केले).`;
      onSaved(msg, false);
    } catch (err) {
      onSaved(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const saveAllConsents = async () => {
    try {
      validateInputs();
      setSaving(true);
      const batchChoices = {};
      Object.keys(data.purposes).forEach((p) => {
        const choice = choices[p] || (statuses[p] === "Given" ? "Give Consent" : (statuses[p] === "Rejected" ? "Reject Consent" : (statuses[p] === "Withdrawn" ? "Withdraw Consent" : "Give Consent")));
        batchChoices[p] = choice === "Give Consent" ? "Given" : choice === "Reject Consent" ? "Rejected" : "Withdrawn";
      });

      await api("/api/consent", {
        method: "POST",
        body: JSON.stringify({
          user: profile,
          choices: batchChoices,
          email: email.trim(),
          phone: phone.trim(),
          organization: organization.trim(),
          knowledgeConfirmed: true
        })
      });

      onSaved(tr("Consent choices and contact details saved successfully to database!"), false);
    } catch (err) {
      onSaved(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  return <section>
    <PageIntro
      eyebrow={tr("CONSENT FLOW")}
      title={tr("Make clear, purpose-specific choices.")}
      text={tr("Read this sample notice before choosing. Every action is recorded in the local demo history.")}
    />

    {/* Notice Card */}
    <div className="notice-card animate-in">
      <span className="card-icon yellow">✳</span>
      <div>
        <b>{tr("Sample privacy notice")}</b>
        <p>{tr("This student prototype demonstrates how an organisation can describe a purpose before requesting a choice. It does not collect real personal information.")}</p>
      </div>
      <span className="version">v{data.noticeVersion}</span>
    </div>

    {/* Knowledge Confirmation & Identity Details Card */}
    <div className="consent-identity-card animate-in">
      <h3>{tr("DPDPA Knowledge & Consent Notice")}</h3>
      <p>{tr("Under Section 6 of DPDPA 2023, consent must be free, specific, informed and unambiguous with clear affirmative action.")}</p>

      {/* DPDPA Knowledge Confirmation Checkbox */}
      <div className="knowledge-verify-box">
        <input
          type="checkbox"
          id="knowledge-confirm-check"
          checked={knowledgeConfirmed}
          onChange={(e) => setKnowledgeConfirmed(e.target.checked)}
        />
        <label htmlFor="knowledge-confirm-check">
          {tr("I confirm that I have reviewed the DPDPA privacy notice and acquired understanding of my data rights.")}
          <small>{knowledgeConfirmed ? `✓ ${tr("DPDPA Knowledge Verified")}` : `○ ${tr("Not Confirmed")}`}</small>
        </label>
      </div>

      <p>{tr("At the time of giving consent, provide your organization, email and phone to be recorded in the database.")}</p>

      {/* Organization, Email and Phone Grid */}
      <div className="consent-identity-grid">
        <label>
          {tr("Organization Name")} *
          <input
            type="text"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder={tr("Enter your organization / college name")}
          />
        </label>
        <label>
          {tr("Email ID")} *
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={tr("Enter your email address")}
          />
        </label>
        <label>
          {tr("Phone Number")} *
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={tr("Enter 10-digit mobile number")}
          />
        </label>
      </div>
    </div>

    <div className="section-heading animate-in">
      <div>
        <span className="eyebrow">{tr("CONSENT")}</span>
        <h2>{tr("Feature Purposes & Consent Choices")}</h2>
      </div>
      <span className="section-note">{tr("Purpose-specific choices")}</span>
    </div>

    {/* Feature Purposes Grid */}
    <div className="purpose-grid">
      {Object.entries(data.purposes).map(([purpose, info]) => (
        <div className="purpose-card animate-in" key={purpose}>
          <div className="purpose-top">
            <span className="status-dot" />
            <span>{info.optional ? tr("OPTIONAL PURPOSE") : tr("CORE DEMO PURPOSE")}</span>
          </div>
          <h3>{tr(purpose)}</h3>
          <p>{tr(info.description)}</p>
          <small>{tr("Illustrative data ·")} {tr(info.data)}</small>
          <div className="purpose-bottom">
            <span className={`badge ${statuses[purpose] === "Given" ? "green" : ""}`}>
              {tr(statuses[purpose] || "Not Decided")}
            </span>
            <select
              value={choices[purpose] || (statuses[purpose] === "Given" ? "Give Consent" : (statuses[purpose] === "Rejected" ? "Reject Consent" : (statuses[purpose] === "Withdrawn" ? "Withdraw Consent" : "Give Consent")))}
              onChange={(event) => setChoices({ ...choices, [purpose]: event.target.value })}
            >
              <option value="Give Consent">{tr("Give Consent")}</option>
              <option value="Reject Consent">{tr("Reject Consent")}</option>
              <option value="Withdraw Consent">{tr("Withdraw Consent")}</option>
            </select>
            <button className="save-button" disabled={saving} onClick={() => saveSingle(purpose)}>
              {tr("Save this feature choice")}
            </button>
          </div>
        </div>
      ))}
    </div>

    {/* Master Batch Save Button */}
    <div className="batch-consent-actions animate-in">
      <button className="button dark" style={{ fontSize: "14px", padding: "14px 24px" }} disabled={saving} onClick={saveAllConsents}>
        {tr("Submit & Record All Feature Consents ↗")}
      </button>
    </div>
  </section>;
}

function PageIntro({ eyebrow, title, text }) { return <div className="page-intro animate-in"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p></div>; }

function Dashboard({ statuses, profile, language }) {
  const values = Object.values(statuses);
  return <section>
    <PageIntro
      eyebrow={tr("CONSENT DASHBOARD")}
      title={tr("A clear view of your choices.")}
      text={`${tr("Latest recorded status for")} ${tr(profile)}.`}
    />
    <div className="stats-row animate-in">
      <Stat label={tr("Given")} value={values.filter((item) => item === "Given").length} detail={tr("Active demo consents")} />
      <Stat label={tr("Rejected")} value={values.filter((item) => item === "Rejected").length} detail={tr("Declined purposes")} />
      <Stat label={tr("Withdrawn")} value={values.filter((item) => item === "Withdrawn").length} detail={tr("Withdrawals recorded")} />
      <Stat label={tr("Not decided")} value={values.filter((item) => item === "Not Decided").length} detail={tr("Awaiting a choice")} />
    </div>
    <div className="table-card animate-in">
      <div className="table-heading">
        <b>{tr("Purpose status")}</b>
        <span>{tr("Notice version 1.0")}</span>
      </div>
      {Object.entries(statuses).map(([purpose, status]) => (
        <div className="table-row" key={purpose}>
          <span>{tr(purpose)}</span>
          <span className={`badge ${status === "Given" ? "green" : ""}`}>{tr(status)}</span>
        </div>
      ))}
    </div>
  </section>;
}

function History({ history, profile, language }) {
  return <section>
    <PageIntro
      eyebrow={tr("CONSENT HISTORY")}
      title={tr("Your local audit trail.")}
      text={`${tr("Every consent event recorded for")} ${tr(profile)}.`}
    />
    {history.length === 0 ? (
      <Empty text={tr("No actions recorded for this demo profile yet. Use Consent Flow to create a record.")} />
    ) : (
      <div className="table-card animate-in">
        {history.map((item, index) => (
          <div className="history-row" key={`${item.time}-${index}`}>
            <div>
              <b>{tr(item.purpose)}</b>
              <small>
                {item.time} · {tr("Notice")} {item.noticeVersion}
                {item.organization ? ` · 🏢 ${item.organization}` : ""}
                {item.email ? ` · ✉ ${item.email}` : ""}
                {item.phone ? ` · 📞 ${item.phone}` : ""}
                {item.knowledgeConfirmed !== undefined ? ` · ${item.knowledgeConfirmed ? "✓ " + tr("DPDPA Knowledge Verified") : "○ " + tr("Not Confirmed")}` : ""}
              </small>
            </div>
            <span className="badge">{tr(item.action)}</span>
          </div>
        ))}
      </div>
    )}
  </section>;
}

function RightsRequests({ requests, profile, language, onSaved }) {
  const [type, setType] = useState("Request for information");
  const [details, setDetails] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    await api("/api/rights", {
      method: "POST",
      body: JSON.stringify({ user: profile, requestType: type, details })
    });
    setDetails("");
    onSaved(tr("Demo request recorded locally."));
  };
  return <section>
    <PageIntro
      eyebrow={tr("RIGHTS REQUESTS")}
      title={tr("Put your data rights into practice.")}
      text={tr("Submit a fictional request to demonstrate how a portal might record it.")}
    />
    <form className="form-card animate-in" onSubmit={submit}>
      <label>
        {tr("Request type")}
        <select value={type} onChange={(event) => setType(event.target.value)}>
          <option value="Request for information">{tr("Request for information")}</option>
          <option value="Correction">{tr("Correction")}</option>
          <option value="Erasure">{tr("Erasure")}</option>
          <option value="Grievance / complaint">{tr("Grievance / complaint")}</option>
          <option value="Other">{tr("Other")}</option>
        </select>
      </label>
      <label>
        {tr("Short details")} <small>{tr("(do not enter real sensitive information)")}</small>
        <textarea maxLength="500" value={details} onChange={(event) => setDetails(event.target.value)} />
      </label>
      <button className="button dark" type="submit">
        {tr("Submit demo request ↗")}
      </button>
    </form>
    <div className="table-card animate-in">
      <div className="table-heading">
        <b>{tr("Recorded requests")}</b>
        <span>{requests.length} {tr("request(s)")}</span>
      </div>
      {requests.length === 0 ? (
        <Empty text={tr("No demo requests recorded for this profile.")} />
      ) : (
        requests.map((item, index) => (
          <div className="history-row" key={`${item.time}-${index}`}>
            <div>
              <b>{tr(item.requestType)}</b>
              <small>{item.time} · {item.details}</small>
            </div>
            <span className="badge">{tr(item.status)}</span>
          </div>
        ))
      )}
    </div>
  </section>;
}

function Empty({ text }) { return <div className="empty">{text}</div>; }

function Points({ language }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const pointsList = getImportantPoints(language);
  const selectedPoint = selectedIndex !== null ? pointsList[selectedIndex] : null;

  return (
    <section>
      {selectedPoint === null ? (
        <>
          <PageIntro
            eyebrow={tr("IMPORTANT POINTS")}
            title={tr("The essentials, at a glance.")}
            text={tr("Select any topic to explore its important points.")}
          />
          <div className="info-grid">
            {pointsList.map((item, index) => (
              <button
                type="button"
                className="info-card animate-in"
                key={item.title}
                onClick={() => setSelectedIndex(index)}
                style={{ cursor: "pointer", textAlign: "left", width: "100%" }}
              >
                <span className="card-icon yellow">✳</span>
                <h3>{item.title}</h3>
                <p>{item.points[0]}</p>
                <b>{tr("Explore 5 important points →")}</b>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <button className="button light" onClick={() => setSelectedIndex(null)}>
            {tr("← Back to Important Points")}
          </button>
          <PageIntro
            eyebrow={tr("IMPORTANT POINTS / TOPIC")}
            title={selectedPoint.title}
            text={tr("Learn these five important points.")}
          />
          <div className="notes-card animate-in">
            {selectedPoint.points.map((point, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  gap: "15px",
                  alignItems: "flex-start",
                  padding: "18px 0",
                  borderBottom: "1px solid #e5e0d5"
                }}
              >
                <span className="chapter-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p style={{ margin: 0, lineHeight: 1.8 }}>
                  {point}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function Notes({ language }) {
  const chapters = getChapters(language);
  return <section>
    <PageIntro
      eyebrow={tr("DPDPA NOTES")}
      title={tr("Understand the language of privacy.")}
      text={tr("Simple notes, definitions and examples for learning.")}
    />
    <div className="notes-card animate-in">
      {chapters.map((chapter) => (
        <article key={chapter.title}>
          <h2>{chapter.title}</h2>
          <div style={{ whiteSpace: "pre-wrap", fontSize: "14px", lineHeight: 1.75, color: "#77756e" }}>
            {chapter.content.trim()}
          </div>
        </article>
      ))}
    </div>
  </section>;
}

function Practice({ language }) {
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const questions = getPracticeQuestions(language);
  return <section>
    <PageIntro
      eyebrow={tr("PRACTICE QUESTIONS")}
      title={tr("Check what you know.")}
      text={tr("Test your understanding with topic-wise questions.")}
    />
    <div className="quiz-list animate-in">
      {questions.map(([question, options, correctAnswer], index) => (
        <div className="question-card" key={question}>
          <b>{index + 1}. {question}</b>
          {options.map((option) => (
            <label key={option}>
              <input
                type="radio"
                name={`q-${index}`}
                onChange={() => setAnswers({ ...answers, [index]: option })}
              />
              {option}
            </label>
          ))}
        </div>
      ))}
      <button
        className="button dark"
        onClick={() => setScore(questions.reduce((total, item, index) => total + (answers[index] === item[2] ? 1 : 0), 0))}
      >
        {tr("Submit answers")}
      </button>
      {score !== null && (
        <div className="result">
          {tr("Your score")} <strong>{score}/{questions.length}</strong>
        </div>
      )}
    </div>
  </section>;
}

function Quiz({ onComplete, language }) {
  const questions = getQuizQuestions(language);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const question = questions[current] || questions[0];

  const submitQuiz = () => {
    const correct = questions.reduce(
      (total, item, index) =>
        total + (answers[index] === item.answer ? 1 : 0),
      0
    );
    const percentage = Math.round((correct / questions.length) * 100);
    const passed = percentage >= 70;
    const finalResult = {
      score: correct,
      total: questions.length,
      percentage,
      passed
    };
    setResult(finalResult);
    if (onComplete) onComplete(finalResult);
  };

  return (
    <section>
      <PageIntro
        eyebrow={tr("PRIVACY AWARENESS QUIZ")}
        title={tr("Test your DPDPA knowledge.")}
        text={tr("Attempt all 10 questions. You need at least 70% to pass and unlock your certificate.")}
      />
      <div className="quiz-list animate-in">
        <div className="question-card">
          <b>{tr("Question")} {current + 1} {tr("of")} {questions.length}</b>
          <div className="progress">
            <span style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
          </div>
          <h3>{question.question}</h3>
          {question.options.map((option, index) => (
            <label key={option}>
              <input
                type="radio"
                name={`main-quiz-${current}`}
                checked={answers[current] === index}
                disabled={result !== null}
                onChange={() => setAnswers({ ...answers, [current]: index })}
              />
              {option}
            </label>
          ))}
        </div>
        {result === null ? (
          <div>
            <button
              className="button light"
              disabled={current === 0}
              onClick={() => setCurrent(current - 1)}
            >
              {tr("Previous")}
            </button>
            {current < questions.length - 1 ? (
              <button
                className="button dark"
                disabled={answers[current] === undefined}
                onClick={() => setCurrent(current + 1)}
              >
                {tr("Next")}
              </button>
            ) : (
              <button
                className="button dark"
                disabled={Object.keys(answers).length !== questions.length}
                onClick={submitQuiz}
              >
                {tr("Submit Quiz")}
              </button>
            )}
          </div>
        ) : (
          <div className="result">
            <h2>{result.passed ? tr("Congratulations! You Passed!") : tr("Keep Practising!")}</h2>
            <p>{tr("Your Score:")} <strong>{result.score}/{result.total}</strong></p>
            <p>{tr("Percentage:")} <strong>{result.percentage}%</strong></p>
            <p>{result.passed
              ? tr("You can now visit the Certificate page.")
              : tr("You need at least 70% to unlock the certificate.")
            }</p>
          </div>
        )}
      </div>
    </section>
  );
}

function Learning({ completed, language }) {
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(null);
  const chapters = getChapters(language);
  const selectedChapter = selectedChapterIndex !== null ? chapters[selectedChapterIndex] : null;

  return (
    <section>
      {selectedChapter === null ? (
        <>
          <PageIntro
            eyebrow={tr("KNOW DPDPA")}
            title={tr("A self-paced learning path.")}
            text={tr("Understand digital personal data protection from beginner to advanced level.")}
          />
          <div className="learning-hero animate-in">
            <span className="card-icon yellow">✳</span>
            <div>
              <b>{tr("Course progress")}</b>
              <p>{tr("Explore all chapters and learn about data protection.")}</p>
              <div className="progress">
                <span style={{ width: `${(completed / 15) * 100}%` }} />
              </div>
              <small>{completed} / 15 {tr("chapters completed")}</small>
            </div>
          </div>
          <div className="info-grid">
            {chapters.map((chapter, index) => (
              <button
                type="button"
                className="info-card animate-in"
                key={chapter.title}
                onClick={() => setSelectedChapterIndex(index)}
                style={{ cursor: "pointer", textAlign: "left", width: "100%" }}
              >
                <span className="chapter-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{chapter.title}</h3>
                <p>{tr("Click to read this chapter →")}</p>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <button className="button light" onClick={() => setSelectedChapterIndex(null)}>
            {tr("← Back to Chapters")}
          </button>
          <PageIntro
            eyebrow={tr("KNOW DPDPA / CHAPTER")}
            title={selectedChapter.title}
            text={tr("Read and understand this chapter.")}
          />
          <div className="notes-card animate-in">
            <div
              style={{
                whiteSpace: "pre-wrap",
                fontSize: "15px",
                lineHeight: 1.9
              }}
            >
              {selectedChapter.content}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function About({ language }) {
  return <section>
    <PageIntro
      eyebrow={tr("ABOUT THIS PROJECT")}
      title={tr("A focused student prototype.")}
      text={tr("Learn DPDPA, understand consent and practise data rights in one place.")}
    />
    <div className="notes-card animate-in">
      <h2>{tr("Project goal")}</h2>
      <p>{tr("Combine privacy education with a structured consent-management demonstration.")}</p>
      <h2>{tr("Core flow")}</h2>
      <p>{tr("Learn → Read notice → Make a purpose-specific choice → Review dashboard/history → Record a demo rights request.")}</p>
      <h2>{tr("Important limitations")}</h2>
      <p>{tr("The profile selector is not secure authentication. SQLite data is stored locally and is not encrypted by this demo. Use fictional data only.")}</p>
    </div>
  </section>;
}

function Certificate({ profile, quizResult, language }) {
  const [studentName, setStudentName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [score, setScore] = useState(
    quizResult?.passed ? String(quizResult.percentage) : ""
  );
  const [course, setCourse] = useState(tr("DPDPA Awareness and Data Privacy"));

  useEffect(() => {
    setCourse(tr("DPDPA Awareness and Data Privacy"));
  }, [language]);

  return (
    <section>
      <PageIntro
        eyebrow={tr("CERTIFICATE")}
        title={tr("Certificate of Achievement")}
        text={tr("Enter student details to generate your certificate.")}
      />
      <div className="form-card no-print">
        <label>
          {tr("Student Full Name")}
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder={tr("Enter student name")}
          />
        </label>
        <label>
          {tr("Roll Number / PRN")}
          <input
            type="text"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            placeholder={tr("Enter Roll Number / PRN")}
          />
        </label>
        <label>
          {tr("Course Name")}
          <input
            type="text"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
          />
        </label>
        <label>
          {tr("Assessment Score (%)")}
          <input
            type="number"
            min="0"
            max="100"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder={tr("Enter score")}
          />
        </label>
        <button
          className="button dark"
          onClick={() => window.print()}
          disabled={!quizResult?.passed || !studentName.trim() || !rollNumber.trim()}
        >
          {tr("Print Certificate")}
        </button>
      </div>

      <div className="formal-certificate">
        <div className="formal-certificate-border">
          <div className="cert-top">{tr("KNOW DPDPA")}</div>
          <p className="cert-small">{tr("EDUCATION · CONSENT · TRANSPARENCY")}</p>
          <div className="cert-divider">✦ ───────── ✦</div>
          <h1>{tr("CERTIFICATE")}</h1>
          <h3>{tr("OF ACHIEVEMENT")}</h3>
          <p className="cert-intro">{tr("This certificate is proudly presented to")}</p>
          <div className="cert-student">{studentName || tr("Student Full Name")}</div>
          <p className="cert-body">
            {tr("In recognition of successful participation in the learning programme")}
          </p>
          <div className="cert-course">{course}</div>
          <div className="cert-details">
            <div>
              <span>{tr("ROLL NUMBER / PRN")}</span>
              <b>{rollNumber || "________"}</b>
            </div>
            <div>
              <span>{tr("ASSESSMENT SCORE")}</span>
              <b>{score === "" ? "____" : `${score}%`}</b>
            </div>
            <div>
              <span>{tr("ISSUE DATE")}</span>
              <b>{new Date().toLocaleDateString(language === "English" ? "en-IN" : "hi-IN")}</b>
            </div>
          </div>
          <div className="cert-bottom">
            <div>
              <div className="cert-sign-line"></div>
              <b>{tr("Project Coordinator")}</b>
              <small>{tr("Know DPDPA Portal")}</small>
            </div>
            <div className="cert-seal">✦<br />{tr("CERTIFIED")}</div>
            <div>
              <div className="cert-sign-line"></div>
              <b>{tr("Authorised Signatory")}</b>
              <small>{tr("Know DPDPA Portal")}</small>
            </div>
          </div>
          <p className="cert-disclaimer">
            {tr("Educational project certificate · Know DPDPA")}
          </p>
        </div>
      </div>
    </section>
  );
}

createRoot(document.getElementById("root")).render(<App />);
