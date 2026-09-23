# Justice Should Be Accessible to All — Better Call ⚖️

> *"Law and order is the medicine of the body politic and when the body politic falls sick, medicine must be administered."*  
> — **Dr. B.R. Ambedkar**, Architect of the Constitution of India

🌐 **Live Application:** [https://better-call-eosin.vercel.app/](https://better-call-eosin.vercel.app/)  
👨‍💻 **Created by:** [DeepRushil](https://www.linkedin.com/in/deeprushil/)

---

## Why Better Call?

In India, the law protects every citizen equally on paper. In practice, however, navigating legal hurdles is often daunting, costly, and shrouded in complex legal jargon. Millions of people struggle to understand their basic constitutional rights, can't afford legal counsel, or simply don't know where to turn when facing an issue.

**Better Call** is built to bridge that gap. 

Designed with empathy and simplicity at its core, Better Call acts as a 24/7 personal legal guide for everyday citizens, tenants, workers, small business owners, and students across India. It breaks down legal barriers into plain, everyday language and connects people with real, verified government legal aid resources.

---

## What Can You Do With Better Call?

### 💬 NyAI Legal Assistant
An intelligent conversational companion powered by Groq. Whether you're curious about your rights during a police stop, wondering how to challenge an unfair penalty, or seeking clarity on fundamental rights, NyAI answers with empathy, citations to relevant acts (Constitution, IPC/BNS, CrPC), and practical steps.

### 🌐 Speaks Your Language (Multilingual Support)
Legal help shouldn't be restricted to English. Better Call supports queries in **Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, and English**, ensuring legal knowledge reaches every corner of the country.

### 📄 Document Simplifier
Contracts and legal notices can be intentionally confusing. Paste or upload any agreement, and Better Call highlights:
- A plain-language summary of what the document actually means
- Your key responsibilities and obligations
- Critical deadlines and dates
- Potential traps, unfair clauses, and red flags

### 🔍 Contract Analyser & Comparison
Compare two versions of an agreement side by side or scan a single contract for hidden liabilities. Receive a risk rating (Low / Medium / High) and concrete points to negotiate before signing.

### 📋 Ready-to-Use Legal Templates & Checklists
Generate formatted legal documents in minutes with simple fill-in-the-blank placeholders:
- **RTI Applications** to hold public offices accountable
- **FIR & Police Complaint Drafts**
- **Consumer Forum Complaints**
- **Legal Notices** (e.g., unpaid dues, eviction, cease-and-desist)
- **Checklists** for buying property or signing employment contracts

### 🤝 Real Lawyer Directory & Free Legal Aid
Better Call doesn't replace licensed attorneys for serious court battles. Instead, it directs you straight to:
- **Official State Bar Council Portals** across all 36 States & Union Territories to verify advocate credentials
- **NALSA (National Legal Services Authority)** for eligible free legal aid (Toll-Free: `15100`)
- **Nyaya Bandhu (Department of Justice)** for pro bono legal assistance

---

## Engineering & Security Highlights

- **Serverless API Proxy:** Architecture utilizes secure serverless functions (`api/chat.js`) so that credentials and API keys are never exposed to the client or browser network tools.
- **XSS & Injection Protection:** All AI responses pass through HTML entity sanitization prior to DOM rendering.
- **Client-Side Guardrails:** Integrated rate limiting and payload validation prevent runaway requests.
- **Accessibility (a11y) First:** Includes skip navigation, ARIA landmarks, live screen reader regions, keyboard navigation highlights, and respect for `prefers-reduced-motion`.
- **Zero Build Friction:** Built with clean, vanilla HTML5, modern CSS3, and JavaScript—fast load times, lightweight footprint, and zero dependency bloat.

---

## Getting Started Locally

No complex dependencies or build steps required.

1. Clone the repository:
   ```bash
   git clone https://github.com/DeepRushil/better-call.git
   cd better-call
   ```
2. Open `index.html` directly in any web browser, or serve it with any static server:
   ```bash
   npx serve .
   ```

---

## Dedicated to Equal Justice

Built for the **GenAI for Legal Assistance & Access Hackathon**.  
*Disclaimer: Better Call provides general legal information and awareness. For specific litigation or court proceedings, always consult a licensed advocate.*
