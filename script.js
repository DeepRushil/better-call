/**
 * @fileoverview NyAI - AI Legal Assistant for Indian Citizens
 * Better Call platform | Powered by Groq API (openai/gpt-oss-20b)
 * Inspired by Dr. B.R. Ambedkar - Justice for All
 */

// ============================================================
// CONSTANTS
// ============================================================
// We now call our secure Vercel backend instead of Groq directly
const GROQ_ENDPOINT   = "/api/chat";
const GROQ_MODEL      = "openai/gpt-oss-20b";
const MAX_INPUT_CHARS = 8000;
const MAX_CHAT_CHARS  = 2000;
const RATE_LIMIT_MAX  = 10;
const RATE_LIMIT_MS   = 60000;

// ============================================================
// RATE LIMITER (Security - prevents API key abuse)
// ============================================================
const rateLimiter = {
  requests: [],
  /** @returns {boolean} true if request is within allowed limit */
  check() {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < RATE_LIMIT_MS);
    if (this.requests.length >= RATE_LIMIT_MAX) return false;
    this.requests.push(now);
    return true;
  }
};

// ============================================================
// XSS SANITIZER (Security - all AI output goes through this)
// ============================================================
/**
 * Escapes HTML entities then applies safe markdown transforms.
 * Prevents XSS from AI-generated or user-provided content.
 * @param {string} text - Raw unsanitized text
 * @returns {string} Safe HTML string
 */
function sanitizeAndFormat(text) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(String(text)));
  const escaped = div.innerHTML;
  return escaped
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n- /g, "<br>&bull; ")
    .replace(/\n(\d+)\. /g, (_, n) => "<br>" + n + ". ")
    .replace(/\n/g, "<br>");
}

// ============================================================
// DOM CACHE (Efficiency - avoid repeated getElementById)
// ============================================================
const DOM = {};
document.addEventListener("DOMContentLoaded", () => {
  DOM.chatWindow = document.getElementById("chatWindow");
  DOM.chatInput  = document.getElementById("chatInput");
});

// ============================================================
// LANGUAGE SUPPORT (Accessibility + Multilingual)
// ============================================================
let selectedLang = "English";

/**
 * Sets the response language for NyAI chatbot.
 * @param {string} lang - Language name in English
 * @param {HTMLElement} btn - Clicked language button
 */
function setLang(lang, btn) {
  selectedLang = lang;
  document.querySelectorAll(".lang-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  const input = document.getElementById("chatInput");
  if (input) {
    input.placeholder = lang === "English"
      ? "Ask any Indian legal question in any language..."
      : "Ask NyAI in " + lang + "...";
  }
}

// ============================================================
// SYSTEM PROMPT
// ============================================================
const SYSTEM_PROMPT = "You are NyAI, an AI legal assistant for Indian citizens, built for the Better Call platform.\n" +
"You are inspired by the vision of Dr. B.R. Ambedkar - that justice should be accessible to all.\n\n" +
"Your role:\n" +
"- Answer questions about Indian law, the Constitution of India, IPC/BNS sections, CrPC, fundamental rights, and legal procedures\n" +
"- Explain legal concepts in simple, plain language that a common person can understand\n" +
"- Help users understand their rights in specific situations\n" +
"- Help draft legal notices, RTI applications, and simple legal documents\n" +
"- Refer users to NALSA (15100) for free legal aid when needed\n\n" +
"Rules you must follow:\n" +
"- Always clarify you provide legal INFORMATION, not legal ADVICE\n" +
"- Never replace a licensed lawyer for serious matters\n" +
"- Keep responses concise and practical\n" +
"- Use numbered or bulleted lists for steps/procedures\n" +
"- Always mention relevant article or law number when applicable\n" +
"- Do not answer questions unrelated to Indian law, legal rights, or justice\n" +
"- If asked about other topics, politely redirect back to legal help\n\n" +
"Tone: Helpful, empathetic, clear. Not robotic. Not over-formal.";

// ============================================================
// RESPONSE CACHE (Efficiency - Instant responses & 0 token cost for repeat queries)
// ============================================================
const responseCache = new Map();
const MAX_CACHE_SIZE = 50;

function getCachedResponse(key) {
  return responseCache.get(key);
}

function setCachedResponse(key, value) {
  if (responseCache.size >= MAX_CACHE_SIZE) {
    const firstKey = responseCache.keys().next().value;
    responseCache.delete(firstKey);
  }
  responseCache.set(key, value);
}

// ============================================================
// CORE API CALL (Single source of truth for all Groq calls)
// ============================================================
/**
 * Sends a request to the Groq API.
 * Enforces in-memory caching, rate limiting, input validation, and error handling.
 * @param {string} systemPrompt - AI instruction context
 * @param {string} userMessage  - User input text
 * @returns {Promise<string>} AI response or descriptive error message
 */
async function groqCall(systemPrompt, userMessage) {
  const safeSystem = systemPrompt.slice(0, MAX_INPUT_CHARS);
  const safeUser   = userMessage.slice(0, MAX_INPUT_CHARS);
  const cacheKey   = safeSystem + ":::" + safeUser;

  // Check cache first for 0ms latency and 0 API calls
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    return cached;
  }

  if (!rateLimiter.check()) {
    return "You have made too many requests. Please wait a minute before trying again.";
  }

  try {
    const res = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: safeSystem },
          { role: "user",   content: safeUser   }
        ],
        temperature: 0.7,
        max_tokens: 1200
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 401) return "Authentication error: invalid API key.";
      if (res.status === 429) return "Rate limit reached. Please wait a moment and try again.";
      if (res.status === 413) return "Your input is too long. Please shorten it and try again.";
      return "Error (" + res.status + "): " + (err.error && err.error.message ? err.error.message : "Something went wrong.");
    }

    const data = await res.json();
    const result = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content)
      ? data.choices[0].message.content.trim()
      : "Sorry, no response was generated. Please try again.";

    if (result && !result.startsWith("Sorry,")) {
      setCachedResponse(cacheKey, result);
    }
    return result;

  } catch (networkErr) {
    console.error("[NyAI] Network error:", networkErr.message);
    return "Network error: Could not reach the AI service. Please check your internet connection.";
  }
}

/**
 * Calls Groq with NyAI legal context and language preference.
 * @param {string} userMessage
 * @returns {Promise<string>}
 */
async function callGroq(userMessage) {
  const langNote = selectedLang !== "English"
    ? "\n\nIMPORTANT: Respond entirely in " + selectedLang + " language."
    : "";
  return groqCall(SYSTEM_PROMPT + langNote, userMessage);
}

// ============================================================
// CHAT UI FUNCTIONS
// ============================================================

/**
 * Displays an inline error message in the chat window.
 * Avoids disruptive browser alert() calls.
 * @param {string} message - Error description
 */
function showInlineError(message) {
  const chatWindow = DOM.chatWindow || document.getElementById("chatWindow");
  const err = document.createElement("div");
  err.className = "chat-msg bot";
  err.setAttribute("role", "alert");
  err.innerHTML = "<div class='avatar' aria-hidden='true'>!</div>" +
    "<div class='bubble' style='border-color:rgba(239,68,68,0.4);color:#fca5a5'>" +
    "<strong>Notice:</strong> " + sanitizeAndFormat(message) + "</div>";
  chatWindow.appendChild(err);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/**
 * Sends the user's typed message to NyAI and displays the response.
 */
async function sendMessage() {
  const input = DOM.chatInput || document.getElementById("chatInput");
  const text  = input.value.trim();
  if (!text) return;
  if (text.length > MAX_CHAT_CHARS) {
    showInlineError("Please shorten your message to under " + MAX_CHAT_CHARS + " characters.");
    return;
  }
  input.value    = "";
  input.disabled = true;
  input.setAttribute("aria-busy", "true");

  appendMessage("user", text, "U");
  showTyping();

  const response = await callGroq(text);
  removeTyping();
  appendMessage("bot", response, "N");

  input.disabled = false;
  input.removeAttribute("aria-busy");
  input.focus();
}

/**
 * Fills the chat input with a preset question and sends it.
 * @param {string} text - Quick-prompt text
 */
function sendQuick(text) {
  const input = document.getElementById("chatInput");
  if (input) input.value = text;
  sendMessage();
}

/**
 * Appends a message bubble to the chat window.
 * Sanitizes all text before inserting into DOM.
 * @param {"user"|"bot"} type
 * @param {string} text - Raw AI or user text
 * @param {string} avatarIcon - Avatar character
 */
function appendMessage(type, text, avatarIcon) {
  const chatWindow = DOM.chatWindow || document.getElementById("chatWindow");
  const msg = document.createElement("div");
  msg.className = "chat-msg " + type;
  msg.setAttribute("role", type === "bot" ? "article" : "none");
  msg.innerHTML =
    "<div class='avatar' aria-hidden='true'>" + avatarIcon + "</div>" +
    "<div class='bubble'>" + sanitizeAndFormat(text) + "</div>";
  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/**
 * Shows an animated typing indicator while waiting for AI response.
 */
function showTyping() {
  const chatWindow = DOM.chatWindow || document.getElementById("chatWindow");
  const el = document.createElement("div");
  el.className = "chat-msg bot";
  el.id = "typingIndicator";
  el.setAttribute("aria-label", "NyAI is generating a response");
  el.innerHTML =
    "<div class='avatar' aria-hidden='true'>N</div>" +
    "<div class='bubble'><div class='typing-dots' aria-hidden='true'>" +
    "<span></span><span></span><span></span></div></div>";
  chatWindow.appendChild(el);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/** Removes the typing indicator from the chat window. */
function removeTyping() {
  const el = document.getElementById("typingIndicator");
  if (el) el.remove();
}

// ============================================================
// TOOL HELPERS (Document Simplifier, Analyser, Templates)
// ============================================================

/**
 * Switches between paste/upload tabs in the Document Simplifier.
 * @param {string} tabId - ID of the tab panel to show
 */
function switchTab(tabId, sectionId, btn) {
  ["paste-tab", "upload-tab"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  const target = document.getElementById(tabId);
  if (target) target.style.display = "block";
  const container = sectionId ? document.getElementById(sectionId) : document.getElementById("simplifier");
  const tabs = (container || document).querySelectorAll(".tool-tab");
  tabs.forEach(t => t.classList.remove("active"));
  if (btn) {
    btn.classList.add("active");
  } else if (typeof window !== "undefined" && window.event && window.event.target) {
    const targetBtn = window.event.target.closest ? window.event.target.closest(".tool-tab") : window.event.target;
    if (targetBtn) targetBtn.classList.add("active");
  }
}

/**
 * Reads a .txt file into the simplifier textarea.
 * @param {HTMLInputElement} input - File input element
 * @param {string} targetId - ID of textarea to populate
 * @param {string} showTab  - ID of tab to show after reading
 * @param {string} hideTab  - ID of tab to hide after reading
 */
function readFile(input, targetId, showTab, hideTab) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 500000) {
    showInlineError("File is too large. Please use a file under 500 KB.");
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    const ta = document.getElementById(targetId);
    if (ta) ta.value = e.target.result;
    const st = document.getElementById(showTab);
    const ht = document.getElementById(hideTab);
    if (st) st.style.display = "block";
    if (ht) ht.style.display = "none";
    const tabs = document.querySelectorAll("#simplifier .tool-tab");
    if (tabs[0]) tabs[0].classList.add("active");
    if (tabs[1]) tabs[1].classList.remove("active");
  };
  reader.onerror = function() {
    showInlineError("Could not read the file. Please try copy-pasting the text instead.");
  };
  reader.readAsText(file);
}

/**
 * Shows AI output in a tool's result panel.
 * @param {string} outputId  - ID of the output container div
 * @param {string} resultId  - ID of the result text div
 * @param {string} text      - Raw AI response text
 */
function showToolOutput(outputId, resultId, text) {
  const out = document.getElementById(outputId);
  const res = document.getElementById(resultId);
  if (!out || !res) return;
  res.innerHTML = sanitizeAndFormat(text);
  out.classList.add("visible");
  out.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/**
 * Copies the inner text of a result element to the clipboard.
 * @param {string} id - Element ID to copy from
 */
function copyOutput(id) {
  const el = document.getElementById(id);
  if (!el) return;
  navigator.clipboard.writeText(el.innerText)
    .then(() => {
      const btn = el.parentElement && el.parentElement.querySelector(".copy-btn");
      if (btn) {
        btn.innerHTML = "<i class='fas fa-check'></i> Copied!";
        setTimeout(() => { btn.innerHTML = "<i class='fas fa-copy'></i> Copy"; }, 2000);
      }
    })
    .catch(() => showInlineError("Could not copy text. Please select and copy manually."));
}

/**
 * Sets a tool button to loading state.
 * @param {HTMLButtonElement} btn
 * @param {string} label - Loading label text
 */
function setButtonLoading(btn, label) {
  btn.disabled = true;
  btn.innerHTML = "<i class='fas fa-spinner fa-spin'></i> " + label;
  btn.setAttribute("aria-busy", "true");
}

/**
 * Resets a tool button from loading state.
 * @param {HTMLButtonElement} btn
 * @param {string} icon  - Font Awesome icon class
 * @param {string} label - Button label
 */
function resetButton(btn, icon, label) {
  btn.disabled = false;
  btn.innerHTML = "<i class='" + icon + "'></i> " + label;
  btn.removeAttribute("aria-busy");
}

// ============================================================
// DOCUMENT SIMPLIFIER
// ============================================================
/** Runs the Document Simplifier tool against AI. */
async function runSimplifier() {
  const text = document.getElementById("simplifierText").value.trim();
  if (!text) { showInlineError("Please paste or upload a document first."); return; }

  const btn = document.querySelector("#simplifier .tool-run-btn");
  setButtonLoading(btn, "Simplifying...");

  const prompt =
    "You are a legal document simplifier for Indian citizens.\n" +
    "Analyse the following legal document and provide:\n" +
    "1. PLAIN LANGUAGE SUMMARY\n" +
    "2. KEY OBLIGATIONS (bullet points)\n" +
    "3. KEY RIGHTS (bullet points)\n" +
    "4. RED FLAGS / RISKS (unusual or unfair clauses)\n" +
    "5. IMPORTANT DATES / DEADLINES\n" +
    "6. VERDICT: Is this document generally fair or risky?\n\n" +
    "Be concise and use language a non-lawyer can understand.";

  const result = await groqCall(prompt, "DOCUMENT:\n\n" + text);
  showToolOutput("simplifierOutput", "simplifierResult", result);
  resetButton(btn, "fas fa-magic", "Simplify Document");
}

// ============================================================
// CONTRACT ANALYSER
// ============================================================
/** Runs the Contract Analyser tool against AI. */
async function runAnalyser() {
  const a = document.getElementById("contractA").value.trim();
  const b = document.getElementById("contractB").value.trim();
  if (!a) { showInlineError("Please paste at least Contract A to analyse."); return; }

  const btn = document.querySelector("#analyser .tool-run-btn");
  setButtonLoading(btn, "Analysing...");

  let prompt, userMsg;
  if (b) {
    prompt =
      "You are a legal contract analyst specialising in Indian law.\n" +
      "Compare the two contracts and provide:\n" +
      "1. SUMMARY of each contract\n" +
      "2. KEY DIFFERENCES\n" +
      "3. HIDDEN / PROBLEMATIC CLAUSES in either\n" +
      "4. WHICH IS BETTER (from the citizen perspective)\n" +
      "5. RISK SCORE for each: Low / Medium / High\n" +
      "6. NEGOTIATION RECOMMENDATIONS";
    userMsg = "CONTRACT A:\n" + a + "\n\nCONTRACT B:\n" + b;
  } else {
    prompt =
      "You are a legal contract analyst specialising in Indian law.\n" +
      "Analyse the contract and provide:\n" +
      "1. PLAIN LANGUAGE SUMMARY\n" +
      "2. HIDDEN / PROBLEMATIC CLAUSES\n" +
      "3. MISSING PROTECTIONS\n" +
      "4. RISK SCORE: Low / Medium / High (with reasons)\n" +
      "5. NEGOTIATION POINTS\n" +
      "6. VERDICT: Should they sign as-is?";
    userMsg = "CONTRACT:\n" + a;
  }

  const result = await groqCall(prompt, userMsg);
  showToolOutput("analyserOutput", "analyserResult", result);
  resetButton(btn, "fas fa-search", "Analyse Contracts");
}

// ============================================================
// CHECKLISTS & TEMPLATES
// ============================================================
/** Runs the Template Generator tool against AI. */
async function runTemplate() {
  const type    = document.getElementById("templateType").value;
  const lang    = document.getElementById("templateLang").value;
  const details = document.getElementById("templateDetails").value.trim();

  if (!type) { showInlineError("Please select a template type first."); return; }

  const btn = document.querySelector("#templates .tool-run-btn");
  setButtonLoading(btn, "Generating...");

  const prompt =
    "You are a legal document drafting assistant specialising in Indian law.\n" +
    "Generate a ready-to-use " + type + " in " + lang + " language.\n" +
    "Use proper Indian legal format with all required sections.\n" +
    "Use [SQUARE BRACKETS] for fields the user must fill in.\n" +
    "Include correct legal references (acts, sections, articles) relevant to India.\n" +
    "Additional context: " + (details || "Use standard format.");

  const result = await groqCall(prompt, "Generate the " + type + " now.");
  showToolOutput("templateOutput", "templateResult", result);
  resetButton(btn, "fas fa-file-download", "Generate Template");
}

// ============================================================
// BAR COUNCIL DIRECTORY (Official Government Links)
// ============================================================
/** @type {Object.<string, {name: string, url: string, note: string}>} */
const barCouncilLinks = {
  "Delhi (NCT)":    { name: "Bar Council of Delhi",                     url: "https://delhibarcouncil.com/",        note: "Search by advocate name or enrollment number" },
  "Maharashtra":    { name: "Bar Council of Maharashtra & Goa",         url: "https://barcouncilmahgoa.org/",       note: "Click Member Search on the portal" },
  "Goa":            { name: "Bar Council of Maharashtra & Goa",         url: "https://barcouncilmahgoa.org/",       note: "Click Member Search on the portal" },
  "Karnataka":      { name: "Karnataka State Bar Council",              url: "https://ksbc.org.in/",                note: "Use the Advocate Search section" },
  "Tamil Nadu":     { name: "Bar Council of Tamil Nadu & Puducherry",   url: "https://www.bctnpy.org/",             note: "Search advocates by name or number" },
  "Puducherry":     { name: "Bar Council of Tamil Nadu & Puducherry",   url: "https://www.bctnpy.org/",             note: "Search advocates by name or number" },
  "Gujarat":        { name: "Bar Council of Gujarat",                   url: "https://barcouncilofgujarat.org/",   note: "Check Advocate/Welfare Data section" },
  "Uttar Pradesh":  { name: "Bar Council of Uttar Pradesh",             url: "http://upbarcouncil.com/",            note: "Use Advocate Search on the site" },
  "Rajasthan":      { name: "Bar Council of Rajasthan",                 url: "https://barcouncilofrajasthan.org/", note: "Search enrolled advocates" },
  "Kerala":         { name: "Bar Council of Kerala",                    url: "https://barcouncilkerala.org/",      note: "Check the Lawyer Registry section" },
  "Andhra Pradesh": { name: "Bar Council of Andhra Pradesh",            url: "https://barcouncilap.org/",           note: "Go to Enrolments > Search By Name" },
  "Telangana":      { name: "Bar Council of Telangana",                 url: "https://www.telanganabarcouncil.org/",note: "Check COP Details or directory section" },
  "West Bengal":    { name: "Bar Council of West Bengal",               url: "https://wbbarcouncil.org/",           note: "Check member/enrolment information" },
  "Bihar":          { name: "Bihar State Bar Council",                  url: "https://biharstatebarcouncil.com/",  note: "Access advocate search via the portal" },
  "Punjab":         { name: "Bar Council of Punjab & Haryana",          url: "https://bcph.co.in/",                note: "Use Online Services/Member section" },
  "Haryana":        { name: "Bar Council of Punjab & Haryana",          url: "https://bcph.co.in/",                note: "Use Online Services/Member section" },
  "Chandigarh":     { name: "Bar Council of Punjab & Haryana",          url: "https://bcph.co.in/",                note: "Use Online Services/Member section" },
  "Madhya Pradesh": { name: "State Bar Council of Madhya Pradesh",      url: "https://www.sbcofmp.org.in/",         note: "Check Enrolled Advocates List" },
  "Himachal Pradesh":{ name: "Bar Council of Himachal Pradesh",         url: "https://bchp.gov.in/",               note: "Search by advocate name" },
  "Jharkhand":      { name: "Jharkhand State Bar Council",              url: "https://jharkhandbarcouncil.org/",   note: "Check the member directory" },
  "Odisha":         { name: "Bar Council of Odisha",                    url: "https://www.barcouncilofindia.org/",  note: "Contact state council or visit BCI portal" },
  "Assam":          { name: "Bar Council of Assam & NE States",         url: "https://www.barcouncilofindia.org/",  note: "Contact Bar Council of Assam for details" },
  "Chhattisgarh":   { name: "Chhattisgarh State Bar Council",           url: "https://www.barcouncilofindia.org/",  note: "Contact state council for advocate details" },
  "Uttarakhand":    { name: "Uttarakhand Bar Council",                  url: "https://www.barcouncilofindia.org/",  note: "Contact state council for advocate details" },
  "Sikkim":         { name: "Bar Council of Sikkim",                    url: "https://www.barcouncilofindia.org/",  note: "Contact state council for advocate details" },
  "Jammu and Kashmir": { name: "J&K Bar Association",                   url: "https://www.barcouncilofindia.org/",  note: "Contact local bar association" },
  "Ladakh":         { name: "Bar Council of India",                     url: "https://www.barcouncilofindia.org/",  note: "Newly created UT, contact BCI" },
  "Andaman and Nicobar Islands": { name: "Bar Council of India",        url: "https://www.barcouncilofindia.org/",  note: "Contact BCI for advocate details" },
  "Lakshadweep":    { name: "Bar Council of India",                     url: "https://www.barcouncilofindia.org/",  note: "Contact BCI for advocate details" },
  "Dadra and Nagar Haveli and Daman and Diu": { name: "Bar Council of India", url: "https://www.barcouncilofindia.org/", note: "Contact BCI for advocate details" },
  "Arunachal Pradesh": { name: "Bar Council of Assam & NE States",      url: "https://www.barcouncilofindia.org/",  note: "Contact BCI for regional details" },
  "Manipur":        { name: "Bar Council of Assam & NE States",         url: "https://www.barcouncilofindia.org/",  note: "Contact BCI for regional details" },
  "Meghalaya":      { name: "Bar Council of Assam & NE States",         url: "https://www.barcouncilofindia.org/",  note: "Contact BCI for regional details" },
  "Mizoram":        { name: "Bar Council of Assam & NE States",         url: "https://www.barcouncilofindia.org/",  note: "Contact BCI for regional details" },
  "Nagaland":       { name: "Bar Council of Assam & NE States",         url: "https://www.barcouncilofindia.org/",  note: "Contact BCI for regional details" },
  "Tripura":        { name: "Bar Council of Assam & NE States",         url: "https://www.barcouncilofindia.org/",  note: "Contact BCI for regional details" }
};

const NALSA_URL       = "https://nalsa.gov.in/";
const NYAYA_BANDHU_URL = "https://doj.gov.in/nyaya-bandhu-pb/";

/**
 * Searches and displays lawyer directory results based on selected state.
 * Uses official Bar Council government links.
 */
function searchLawyers() {
  const state = document.getElementById("lawyerState").value.trim();
  const spec  = document.getElementById("lawyerSpec").value.trim();
  const grid  = document.getElementById("lawyerGrid");
  if (!grid) return;
  grid.innerHTML = "";

  if (!state) {
    grid.innerHTML =
      "<div class='info-card' style='grid-column:1/-1'>" +
      "<h3>Select a State to Find Lawyers</h3>" +
      "<p>Choose your state from the dropdown to be directed to the official Bar Council portal where you can search for verified, enrolled advocates.</p>" +
      "<div class='info-links'>" +
      "<a href='" + NALSA_URL + "' target='_blank' rel='noopener noreferrer' class='info-btn nalsa-btn'>Free Legal Aid (NALSA)</a>" +
      "<a href='" + NYAYA_BANDHU_URL + "' target='_blank' rel='noopener noreferrer' class='info-btn nyaya-btn'>Nyaya Bandhu - Pro Bono</a>" +
      "<a href='https://www.barcouncilofindia.org/' target='_blank' rel='noopener noreferrer' class='info-btn bci-btn'>Bar Council of India</a>" +
      "</div></div>";
    return;
  }

  const council = barCouncilLinks[state];
  if (!council) return;

  const cards = [
    {
      cls: "lawyer-card official-card",
      badge: "Official Government Source",
      badgeStyle: "",
      name: council.name,
      spec: state + (spec ? " - " + spec : " - All Specializations"),
      note: council.note,
      links: "<a href='" + council.url + "' target='_blank' rel='noopener noreferrer' class='lc-visit-btn'>" +
             "<i class='fas fa-external-link-alt' aria-hidden='true'></i> Search Advocates on Official Portal</a>"
    },
    {
      cls: "lawyer-card nalsa-card",
      badge: "Free Legal Aid",
      badgeStyle: "free-badge",
      name: "NALSA - National Legal Services Authority",
      spec: "All Specializations - Government Funded",
      note: "Cannot afford a lawyer? NALSA provides free legal aid to eligible citizens including women, SC/ST, children, and those below poverty line.",
      links: "<div class='lc-contact-row'>" +
             "<a href='tel:15100' class='lc-contact'><i class='fas fa-phone' aria-hidden='true'></i> Call 15100</a>" +
             "<a href='" + NALSA_URL + "' target='_blank' rel='noopener noreferrer' class='lc-visit-btn'><i class='fas fa-external-link-alt' aria-hidden='true'></i> Visit NALSA</a>" +
             "</div>"
    },
    {
      cls: "lawyer-card",
      badge: "Pro Bono",
      badgeStyle: "style='background:rgba(16,185,129,0.2);color:#10b981;border-color:rgba(16,185,129,0.3)'",
      name: "Nyaya Bandhu - Pro Bono Legal Services",
      spec: "Volunteer Lawyers - Government of India",
      note: "Connects citizens with lawyers who voluntarily provide free legal services across India, organized by the Dept. of Justice.",
      links: "<a href='" + NYAYA_BANDHU_URL + "' target='_blank' rel='noopener noreferrer' class='lc-visit-btn'><i class='fas fa-external-link-alt' aria-hidden='true'></i> Find Pro Bono Lawyers</a>"
    }
  ];

  cards.forEach(c => {
    const el = document.createElement("div");
    el.className = c.cls;
    el.innerHTML =
      "<div class='official-badge " + c.badgeStyle + "'>" + c.badge + "</div>" +
      "<div class='lc-name'>" + c.name + "</div>" +
      "<div class='lc-spec'>" + c.spec + "</div>" +
      "<div class='lc-note'>" + c.note + "</div>" +
      c.links;
    grid.appendChild(el);
  });
}

// ============================================================
// RIGHTS SECTION
// ============================================================
/**
 * Toggles the expanded detail panel on a rights card.
 * @param {HTMLElement} card - The clicked rights card element
 */
function expandRight(card) {
  const detail = card.querySelector(".right-detail");
  if (!detail) return;
  const isExpanded = !detail.classList.contains("hidden");
  detail.classList.toggle("hidden");
  card.setAttribute("aria-expanded", String(!isExpanded));
}

// ============================================================
// NAVBAR SCROLL EFFECT
// ============================================================
window.addEventListener("scroll", () => {
  const nav = document.querySelector(".navbar");
  if (nav) {
    nav.style.background = window.scrollY > 50
      ? "rgba(10, 22, 40, 0.98)"
      : "rgba(10, 22, 40, 0.95)";
  }
}, { passive: true });

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  DOM.chatWindow = document.getElementById("chatWindow");
  DOM.chatInput  = document.getElementById("chatInput");
  searchLawyers();
});
