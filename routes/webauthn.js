const express = require("express");
const router = express.Router();
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");
const db = require("../db/database");

const RP_NAME = process.env.RP_NAME || "WebAuthn Study";
const RP_ID = process.env.RP_ID || "localhost";
const ORIGIN = process.env.ORIGIN || "http://localhost:3000";

// ── REGISTER: Get Options ─────────────────────────────────
router.post("/register/options", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Username required" });

  let user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!user) {
    db.prepare("INSERT INTO users (username) VALUES (?)").run(username);
    user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  }

  const existingCredentials = db
    .prepare("SELECT credential_id FROM credentials WHERE user_id = ?")
    .all(user.id)
    .map((row) => ({ id: row.credential_id, type: "public-key" }));

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: new TextEncoder().encode(String(user.id)),
    userName: username,
    timeout: 60000,
    attestationType: "none",
    excludeCredentials: existingCredentials,
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "required",
    },
  });

  req.session.registrationChallenge = options.challenge;
  req.session.pendingUsername = username;

  res.json(options);
});

// ── REGISTER: Verify Response ─────────────────────────────
router.post("/register/verify", async (req, res) => {
  const { username, attResp } = req.body;
  const expectedChallenge = req.session.registrationChallenge;

  if (!expectedChallenge) {
    return res
      .status(400)
      .json({ error: "No challenge found. Please restart registration." });
  }

  try {
    const verification = await verifyRegistrationResponse({
      response: attResp,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: true,
    });

    if (verification.verified) {
      const { credential } = verification.registrationInfo;
      const user = db
        .prepare("SELECT * FROM users WHERE username = ?")
        .get(username);

      db.prepare(
        `
        INSERT OR REPLACE INTO credentials
        (user_id, credential_id, public_key, counter)
        VALUES (?, ?, ?, ?)
      `,
      ).run(
        user.id,
        Buffer.from(credential.id).toString("base64url"),
        Buffer.from(credential.publicKey).toString("base64url"),
        credential.counter,
      );

      req.session.registrationChallenge = null;
      return res.json({ verified: true });
    }

    res.json({ verified: false, error: "Verification failed." });
  } catch (err) {
    console.error("Registration verify error:", err);
    res.status(500).json({ verified: false, error: err.message });
  }
});

// ── LOGIN: Get Options ────────────────────────────────────
router.post("/login/options", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Username required" });

  const user = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username);
  if (!user)
    return res
      .status(404)
      .json({ error: "User not found. Please register first." });

  const credentials = db
    .prepare("SELECT * FROM credentials WHERE user_id = ?")
    .all(user.id);

  if (credentials.length === 0) {
    return res
      .status(404)
      .json({ error: "No passkey found for this account." });
  }

  const allowCredentials = credentials.map((cred) => ({
    id: cred.credential_id,
    type: "public-key",
    transports: ["internal", "hybrid"],
  }));

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    timeout: 60000,
    allowCredentials,
    userVerification: "required",
    extensions: {
      appid: undefined,
    },
  });

  req.session.authChallenge = options.challenge;
  req.session.authUsername = username;

  res.json(options);
});

// ── LOGIN: Verify Response ────────────────────────────────
router.post("/login/verify", async (req, res) => {
  const { username, authResp } = req.body;
  const expectedChallenge = req.session.authChallenge;

  if (!expectedChallenge) {
    return res
      .status(400)
      .json({ error: "No challenge found. Please try signing in again." });
  }

  const user = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username);
  if (!user) return res.status(404).json({ error: "User not found." });

  // Try matching credential by both raw and base64url encoded id
  const allCredentials = db
    .prepare("SELECT * FROM credentials WHERE user_id = ?")
    .all(user.id);

  console.log("Auth response id:", authResp.id);
  console.log(
    "Stored credentials:",
    allCredentials.map((c) => c.credential_id),
  );

  const credential = allCredentials.find(
    (cred) =>
      cred.credential_id === authResp.id ||
      cred.credential_id ===
        Buffer.from(authResp.id, "base64url").toString("base64url"),
  );

  if (!credential) {
    console.error("No matching credential found for id:", authResp.id);
    return res
      .status(404)
      .json({ error: "Credential not recognised. Try registering again." });
  }

  try {
    const publicKeyBuffer = Buffer.from(credential.public_key, "base64url");

    const verification = await verifyAuthenticationResponse({
      response: authResp,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: true,
      credential: {
        id: credential.credential_id,
        publicKey: publicKeyBuffer,
        counter: credential.counter,
      },
    });

    if (verification.verified) {
      db.prepare(
        "UPDATE credentials SET counter = ? WHERE credential_id = ?",
      ).run(
        verification.authenticationInfo.newCounter,
        credential.credential_id,
      );

      req.session.authChallenge = null;
      req.session.loggedInUser = username;

      return res.json({ verified: true });
    }

    res.json({ verified: false, error: "Authentication failed." });
  } catch (err) {
    console.error("Login verify error:", err.message);
    res.status(500).json({ verified: false, error: err.message });
  }
});

module.exports = router;
