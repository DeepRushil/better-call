# Security Policy — Better Call

## Reporting a Vulnerability

Security is a fundamental priority for **Better Call**. If you discover a vulnerability or potential security flaw, please do not disclose it publicly or open a public issue. 

Please report any concerns privately to:
- **Email:** deeprushil18@gmail.com
- **LinkedIn:** [DeepRushil](https://www.linkedin.com/in/deeprushil/)

We will acknowledge receipt within 24 hours and provide an estimated timeline for remediation.

---

## Architecture & Security Controls

Better Call employs a defense-in-depth model across the application stack:

### 1. Serverless Credential Isolation
* **Zero Client Secrets:** The Groq API key is strictly maintained within encrypted serverless environment variables on Vercel. 
* **Backend Proxy:** The browser never directly contacts external model endpoints; all communication is routed through `/api/chat`.
* **Zero Secrets in Repository:** The Git commit history is clean and subject to active Push Protection.

### 2. Payload Inspection & DoS Guard
* **Payload Size Ceiling:** Requests to `/api/chat` exceeding 50 KB are rejected with HTTP 413 (Payload Too Large).
* **Structural Validation:** Every request body is verified to contain a typed `messages` array before processing.
* **Token Boundaries:** Frontend and server enforce strict maximum character lengths (`MAX_INPUT_CHARS = 8000`, `MAX_CHAT_CHARS = 2000`).

### 3. XSS Defense & Content Security Policy (CSP)
* **HTML Entity Encoding:** All model responses pass through entity sanitization before any DOM rendering.
* **HTTP CSP Meta Policy:**
  ```text
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com;
  font-src https://fonts.gstatic.com https://cdnjs.cloudflare.com;
  img-src 'self' https://upload.wikimedia.org data:;
  connect-src 'self' https://api.groq.com;
  ```

### 4. HTTP Transport Security Headers
Every response served by the API proxy includes:
* `X-Content-Type-Options: nosniff` (MIME sniffing prevention)
* `X-Frame-Options: DENY` (Clickjacking defense)
* `Strict-Transport-Security: max-age=31536000; includeSubDomains` (Enforced HTTPS)
* `Referrer-Policy: strict-origin-when-cross-origin`
* `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### 5. Client & Server Rate Limiting
* Client-side sliding window limits requests to **10 per minute** to prevent accidental query flooding or resource exhaustion.
