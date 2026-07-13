# WebAuthn Usability Study — Prototype

**Evaluating the Usability of WebAuthn-Based Passwordless Authentication on Android Devices**
Muhammad Abu Bakar — MSc Dissertation, Abertay University, 2025

---

## Overview

This is a functional web prototype built to support a formative usability study of WebAuthn-based passwordless authentication on Android devices. It implements four core user journeys that form the basis of the usability evaluation:

1. **Task 1 — First-time registration** using a passkey (fingerprint or device PIN)
2. **Task 2 — Routine sign-in** as a returning user
3. **Task 3 — Forced authentication failure** and error handling
4. **Task 4 — Simulated account recovery** via three recovery pathways

All user interactions are logged automatically to a SQLite database for later analysis.

---

## Technology Stack

| Component          | Technology                           | Role                                                                    |
| ------------------ | ------------------------------------ | ----------------------------------------------------------------------- |
| User interface     | HTML5, CSS3, Bootstrap 5, JavaScript | Registration, sign-in, failure, recovery, and dashboard screens         |
| WebAuthn client    | `@simplewebauthn/browser` v13        | Invokes browser WebAuthn API for credential creation and assertion      |
| Server             | Node.js + Express 5                  | API routes, session management, request handling                        |
| WebAuthn server    | `@simplewebauthn/server` v13         | Generates and verifies WebAuthn registration and authentication options |
| Database           | SQLite via `better-sqlite3`          | Stores users, credentials, and event logs                               |
| Event logging      | SQLite `event_log` table             | Captures timestamps, task outcomes, retries, and errors                 |
| Session management | `express-session`                    | Maintains challenge state between registration/login steps              |
| Environment config | `dotenv`                             | Manages RP_ID, ORIGIN, and session secrets                              |

---

## Project Structure

```
webauthn-prototype/
├── public/
│   ├── css/
│   │   └── style.css           # Global styles
│   ├── js/
│   │   └── webauthn-client.js  # Client-side WebAuthn logic and event logging
│   ├── register.html           # Task 1 — First-time registration
│   ├── login.html              # Task 2 — Routine sign-in
│   ├── failure.html            # Task 3 — Authentication failure screen
│   ├── recovery.html           # Task 4 — Simulated recovery
│   └── dashboard.html          # Post-login confirmation screen
├── routes/
│   ├── webauthn.js             # WebAuthn API routes (register + login)
│   └── auth.js                 # Event logging endpoint
├── db/
│   └── database.js             # SQLite setup and schema
├── server.js                   # Express app entry point
├── .env                        # Environment variables (not committed)
├── .gitignore
└── package.json
```

---

## Prerequisites

- **Node.js** v20 or higher
- **npm** v9 or higher
- A device with a platform authenticator (Android fingerprint/PIN, Windows Hello, or Touch ID/Face ID on Mac)
- For Android testing: **Google Chrome** on the Android device and an **HTTPS URL** (see Deployment section)

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/webauthn-prototype.git
cd webauthn-prototype
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create your `.env` file

Create a file named `.env` in the project root with the following content:

```env
PORT=3000
SESSION_SECRET=your_secret_key_here
RP_NAME=WebAuthn Usability Study
RP_ID=localhost
ORIGIN=http://localhost:3000
```

> **Important:** `RP_ID` must match the domain serving the app. For local development this is `localhost`. For production this must be your actual domain (e.g. `your-app.up.railway.app`).

### 4. Start the server

```bash
node server.js
```

### 5. Open in browser

Navigate to:

```
http://localhost:3000
```

You will be redirected to the registration page automatically.

> **Note for local testing:** WebAuthn only works over `localhost` or a genuine HTTPS connection. Testing on a phone over a local IP address (e.g. `192.168.x.x`) requires HTTPS — see the Android Testing section below.

---

## Android Testing

To test on an Android device, the prototype must be served over HTTPS. The recommended approach is to deploy to Railway (see Deployment section) and access the live URL from Chrome on Android.

**Why HTTPS is required:**
WebAuthn is a secure context API. Android's Credential Manager will not allow passkey creation or retrieval on plain HTTP origins, even on a local network. This is a browser and OS-level security restriction, not a limitation of this prototype.

**Recommended setup for Android testing:**

1. Deploy the prototype to Railway (see below)
2. Open Chrome on your Android device
3. Navigate to your Railway URL (e.g. `https://your-app.up.railway.app/register.html`)
4. Complete the four task scenarios

---

## Deployment (Railway)

Railway provides free persistent hosting with a stable HTTPS domain — required for Android WebAuthn to function correctly.

### 1. Create a Railway account

Sign up at [railway.app](https://railway.app) using your GitHub account.

### 2. Push your code to GitHub

```bash
git init
git add .
git commit -m "Initial WebAuthn prototype"
git remote add origin https://github.com/YOUR_USERNAME/webauthn-prototype.git
git branch -M main
git push -u origin main
```

### 3. Create a new Railway project

- Go to your Railway dashboard
- Click **New Project** → **Deploy from GitHub repo**
- Select your repository

### 4. Add environment variables

In your Railway service dashboard, go to **Variables** and add:

```
PORT=3000
SESSION_SECRET=your_strong_secret_here
RP_NAME=WebAuthn Usability Study
RP_ID=your-app.up.railway.app
ORIGIN=https://your-app.up.railway.app
NODE_ENV=production
```

> Replace `your-app.up.railway.app` with your actual Railway-assigned domain, found in **Settings → Domains**.

### 5. Add a volume for persistent SQLite storage

- In your Railway service, go to **Volumes**
- Add a new volume with mount path `/app/db`
- Add this environment variable:

```
DB_PATH=/app/db/webauthn.db
```

This ensures your database is not wiped between deployments.

### 6. Deploy

Railway will auto-deploy on every push to your main branch. Your app will be live at your Railway domain within a minute or two.

---

## Environment Variables Reference

| Variable         | Description                                      | Example                                                      |
| ---------------- | ------------------------------------------------ | ------------------------------------------------------------ |
| `PORT`           | Port the server listens on                       | `3000`                                                       |
| `SESSION_SECRET` | Secret key for session signing                   | `my_secret_key`                                              |
| `RP_NAME`        | Relying party display name shown to users        | `WebAuthn Usability Study`                                   |
| `RP_ID`          | Relying party ID — must match the serving domain | `localhost` or `your-app.up.railway.app`                     |
| `ORIGIN`         | Full origin URL including scheme                 | `http://localhost:3000` or `https://your-app.up.railway.app` |
| `NODE_ENV`       | Set to `production` on Railway                   | `production`                                                 |
| `DB_PATH`        | Path to SQLite database file (optional)          | `/app/db/webauthn.db`                                        |

---

## Study Task Scenarios

Each task maps to a dedicated screen and is logged automatically.

| Task   | Screen   | URL              | What it tests                                   |
| ------ | -------- | ---------------- | ----------------------------------------------- |
| Task 1 | Register | `/register.html` | Learnability and clarity of credential creation |
| Task 2 | Sign In  | `/login.html`    | Efficiency and confidence in routine sign-in    |
| Task 3 | Failure  | `/failure.html`  | Error interpretation and recovery navigation    |
| Task 4 | Recovery | `/recovery.html` | Trust, clarity, and resilience after disruption |

---

## Event Logging

Every significant user action is logged to the `event_log` table in SQLite. The following event types are captured:

| Event Type                         | Task     | Meaning                                       |
| ---------------------------------- | -------- | --------------------------------------------- |
| `registration_start`               | register | User clicked Register Passkey                 |
| `registration_cancelled`           | register | User cancelled or timed out                   |
| `registration_authenticator_error` | register | Browser-level authenticator error             |
| `registration_success`             | register | Credential created and verified               |
| `registration_verify_failed`       | register | Server verification failed                    |
| `login_start`                      | login    | User clicked Use your Fingerprint / PIN       |
| `login_cancelled`                  | login    | User cancelled or timed out                   |
| `login_success`                    | login    | Authentication verified successfully          |
| `login_failed`                     | login    | Server verification failed                    |
| `login_redirect_to_failure`        | login    | User sent to failure screen                   |
| `recovery_page_view`               | recovery | User arrived at recovery screen               |
| `recovery_backup_code_selected`    | recovery | User chose backup code option                 |
| `recovery_new_passkey_selected`    | recovery | User chose to register a new passkey          |
| `recovery_support_selected`        | recovery | User chose contact support option             |
| `dashboard_view`                   | login    | User reached dashboard after successful login |

### Accessing the event log

To inspect logged events locally, use any SQLite browser (e.g. DB Browser for SQLite) and open `db/webauthn.db`. The `event_log` table contains all recorded interactions.

On Railway, you can download the database file from your volume or query it through Railway's shell.

---

## Database Schema

```sql
-- Registered users
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- WebAuthn credentials (public keys, never passwords or biometrics)
CREATE TABLE credentials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  transports TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Usability event log
CREATE TABLE event_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  event_type TEXT,
  task TEXT,
  success INTEGER,
  error_message TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

> **Privacy note:** The system stores only public-key credential identifiers and anonymised session IDs. No passwords, biometric templates, or personally identifiable information are stored at any point.

---

## Security Notes

- Private keys never leave the user's device — this is enforced by the WebAuthn protocol
- Biometric data (fingerprints, face scans) is processed entirely on-device by the platform authenticator and is never transmitted to the server
- The server stores only the public key credential identifier and a signature counter
- Session data is signed with a secret key and stored server-side
- The prototype uses dummy test accounts and is not intended for production use

---

## Known Limitations

- **Ephemeral tunnel domains (ngrok, Cloudflare Tunnel)** do not work reliably for Android WebAuthn testing. Android's Credential Manager applies trust heuristics to relying party domains; newly registered ephemeral domains may cause "No passkeys available" errors even after successful registration. A stable domain (Railway, Render, or any real HTTPS domain) is required.
- **Windows Hello on older Windows builds** may show a blank authentication dialog due to a known Chrome/Windows WebAuthn compatibility issue. Testing on Android Chrome is the intended environment.
- **SQLite on Render's free tier** uses ephemeral storage — the database is wiped on restart. Use Railway with a volume, or Render's paid persistent disk tier, for stable testing sessions.
- The recovery flow is **simulated** — backup codes and support contact are UI demonstrations only, not functional recovery mechanisms.

---

## Development Notes

### Resetting the database

To clear all registered users and credentials during development:

```bash
del db\webauthn.db        # Windows
rm db/webauthn.db         # Mac/Linux
```

Restart the server and it will recreate a fresh database automatically.

### Running with a Cloudflare or ngrok tunnel (desktop only)

If you need to share your local development server temporarily (for desktop browser testing only, not Android):

```bash
# Cloudflare Tunnel
cloudflared tunnel --url http://localhost:3000

# ngrok
ngrok http 3000
```

Update `.env` with the tunnel domain as both `RP_ID` and `ORIGIN`, then restart the server. Remember to delete the database between tunnel sessions since the domain changes each time.

---

## References

- W3C (2026). Web Authentication API Level 3. https://www.w3.org/TR/webauthn-3/
- SimpleWebAuthn Documentation. https://simplewebauthn.dev
- ISO 9241-11:2018. Ergonomics of Human-System Interaction — Usability Definitions.
- Wursching et al. (2023). FIDO2 the Rescue? CHI 2023.
- Kepkowski et al. (2023). Challenges with Passwordless FIDO2. IEEE SecDev 2023.

---
