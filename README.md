# Better Call – AI Legal Assistant for Every Indian Citizen

> Inspired by Dr. B.R. Ambedkar's vision: **"Justice should be accessible to all."**

## Problem Statement

Legal knowledge in India is inaccessible to most citizens due to complex language, high lawyer fees, and lack of awareness. Better Call uses Generative AI to bridge this gap, providing instant, plain-language legal guidance in 9 Indian languages at zero cost.

## Features

| Feature | Description |
|---|---|
| **NyAI Chatbot** | AI legal assistant powered by Groq. Answers questions on Indian Constitution, IPC/BNS, CrPC, fundamental rights in 9 languages |
| **Document Simplifier** | Paste or upload any contract/legal notice; get plain language summary, obligations, red flags, and risk verdict |
| **Contract Analyser** | Analyse a single contract or compare two contracts with risk score and negotiation points |
| **Checklists & Templates** | Generate 15+ legal documents (FIR drafts, RTI applications, legal notices, affidavits) in 7 Indian languages |
| **Find a Lawyer** | Official state Bar Council links for all 36 states/UTs + NALSA free legal aid + Nyaya Bandhu pro bono |
| **Know Your Rights** | Interactive cards on key Constitutional articles (Art. 14, 17, 19, 21, 21A, 32) |
| **Multilingual Support** | Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam |

## Tech Stack

- **Frontend**: Pure HTML5, CSS3, Vanilla JavaScript (no frameworks, no build tools)
- **AI**: Groq API with OpenAI-compatible interface
- **Legal Data**: Official Indian government sources (Bar Council, NALSA, RTI Portal)

## Security Measures

- Content Security Policy (CSP) meta tag restricts resource origins
- XSS prevention: all AI-generated content is HTML-escaped before DOM insertion
- Client-side rate limiting (10 requests/minute) to prevent API abuse
- All external links use `rel="noopener noreferrer"` to prevent tab hijacking
- Input length validation on all user-facing fields

## Accessibility

- WCAG 2.1 informed: skip navigation, `aria-live` regions, `role` attributes
- Full keyboard navigation with visible focus outlines
- Screen reader support: `aria-label`, `aria-busy`, `role="log"` on chat window
- `prefers-reduced-motion` and `prefers-contrast` media query support
- Semantic HTML5 landmarks: `<main>`, `<nav>`, `<footer>`, `<section>`
- `loading="lazy"` on images, `maxlength` on inputs

## Code Quality

- JSDoc comments on every function
- Single `groqCall()` abstraction handles all AI API calls
- Constants extracted at top of file (`GROQ_MODEL`, `MAX_INPUT_CHARS`, etc.)
- DOM elements cached at startup to avoid repeated `getElementById` calls
- No `alert()` calls — inline error messages used instead

## Target Users

1. Citizens who cannot afford legal consultation
2. First-generation rights seekers in rural/semi-urban areas
3. Workers facing labour disputes or wrongful termination
4. Women seeking protection under POCSO, Domestic Violence Act, etc.
5. SC/ST communities seeking NALSA free legal aid
6. Small business owners needing contract guidance

## Running Locally

Simply open `index.html` in any modern browser. No installation required.

## Hackathon

Built for: **GenAI for Legal Assistance & Access (India)**
Problem: Making justice accessible to every Indian citizen through AI
