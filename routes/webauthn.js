// const express = require("express");
// const router = express.Router();
// const {
//   generateRegistrationOptions,
//   verifyRegistrationResponse,
//   generateAuthenticationOptions,
//   verifyAuthenticationResponse,
// } = require("@simplewebauthn/server");
// const db = require("../db/database");

// const RP_NAME = process.env.RP_NAME || "WebAuthn Study";
// const RP_ID = process.env.RP_ID || "localhost";
// const ORIGIN = process.env.ORIGIN || "http://localhost:3000";

// // ── REGISTER: Get Options ─────────────────────────────────
// router.post("/register/options", async (req, res) => {
//   const { username } = req.body;
//   if (!username) return res.status(400).json({ error: "Username required" });

//   let user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
//   if (!user) {
//     db.prepare("INSERT INTO users (username) VALUES (?)").run(username);
//     user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
//   }

//   const existingCredentials = db
//     .prepare(
//       "SELECT credential_id, transports FROM credentials WHERE user_id = ?",
//     )
//     .all(user.id)
//     .map((row) => ({
//       id: row.credential_id,
//       type: "public-key",
//       transports: row.transports ? JSON.parse(row.transports) : undefined,
//     }));

//   const options = await generateRegistrationOptions({
//     rpName: RP_NAME,
//     rpID: RP_ID,
//     userID: new TextEncoder().encode(String(user.id)),
//     userName: username,
//     timeout: 60000,
//     attestationType: "none",
//     excludeCredentials: existingCredentials,
//     authenticatorSelection: {
//       residentKey: "preferred",
//       userVerification: "preferred",
//       authenticatorAttachment: "platform",
//     },
//   });

//   console.log("=== REGISTER OPTIONS DEBUG ===");
//   console.log("RP_ID being used:", RP_ID);
//   console.log("Username:", username);
//   console.log("==============================");

//   req.session.registrationChallenge = options.challenge;
//   req.session.pendingUsername = username;

//   res.json(options);
// });

// // ── REGISTER: Verify Response ─────────────────────────────
// router.post("/register/verify", async (req, res) => {
//   const { username, attResp } = req.body;
//   const expectedChallenge = req.session.registrationChallenge;

//   if (!expectedChallenge) {
//     return res
//       .status(400)
//       .json({ error: "No challenge found. Please restart registration." });
//   }

//   console.log("=== TRANSPORTS CAPTURED ===");
//   console.log("Raw attResp.response.transports:", attResp.response?.transports);
//   console.log("============================");

//   try {
//     const verification = await verifyRegistrationResponse({
//       response: attResp,
//       expectedChallenge,
//       expectedOrigin: ORIGIN,
//       expectedRPID: RP_ID,
//       requireUserVerification: true,
//     });

//     if (verification.verified) {
//       const { credential } = verification.registrationInfo;
//       const user = db
//         .prepare("SELECT * FROM users WHERE username = ?")
//         .get(username);

//       const transports = attResp.response?.transports
//         ? JSON.stringify(attResp.response.transports)
//         : null;

//       db.prepare(
//         `
//         INSERT OR REPLACE INTO credentials
//         (user_id, credential_id, public_key, counter, transports)
//         VALUES (?, ?, ?, ?, ?)
//       `,
//       ).run(
//         user.id,
//         Buffer.from(credential.id).toString("base64url"),
//         Buffer.from(credential.publicKey).toString("base64url"),
//         credential.counter,
//         transports,
//       );

//       console.log("=== CREDENTIAL SAVED ===");
//       console.log("Username:", username);
//       console.log("User ID:", user.id);
//       console.log(
//         "Credential ID stored:",
//         Buffer.from(credential.id).toString("base64url"),
//       );
//       console.log("Transports stored:", transports);
//       console.log("=========================");

//       req.session.registrationChallenge = null;
//       return res.json({ verified: true });
//     }

//     res.json({ verified: false, error: "Verification failed." });
//   } catch (err) {
//     console.error("Registration verify error:", err);
//     res.status(500).json({ verified: false, error: err.message });
//   }
// });

// // ── LOGIN: Get Options ────────────────────────────────────
// router.post("/login/options", async (req, res) => {
//   const { username } = req.body;
//   if (!username) return res.status(400).json({ error: "Username required" });

//   const user = db
//     .prepare("SELECT * FROM users WHERE username = ?")
//     .get(username);
//   if (!user)
//     return res
//       .status(404)
//       .json({ error: "User not found. Please register first." });

//   const credentials = db
//     .prepare("SELECT * FROM credentials WHERE user_id = ?")
//     .all(user.id);

//   if (credentials.length === 0) {
//     return res
//       .status(404)
//       .json({ error: "No passkey found for this account." });
//   }

//   const allowCredentials = credentials.map((cred) => ({
//     id: cred.credential_id,
//     type: "public-key",
//     transports: ["internal"],
//     /*transports: cred.transports ? JSON.parse(cred.transports) : undefined,*/
//   }));

//   const options = await generateAuthenticationOptions({
//     rpID: RP_ID,
//     timeout: 60000,
//     allowCredentials,
//     userVerification: "preferred",
//   });

//   console.log("=== LOGIN OPTIONS DEBUG ===");
//   console.log("RP_ID being used:", RP_ID);
//   console.log("Username:", username);
//   console.log("User ID:", user.id);
//   console.log("allowCredentials:", JSON.stringify(allowCredentials, null, 2));
//   console.log("===========================");

//   req.session.authChallenge = options.challenge;
//   req.session.authUsername = username;

//   res.json(options);
// });

// // ── LOGIN: Verify Response ────────────────────────────────
// router.post("/login/verify", async (req, res) => {
//   const { username, authResp } = req.body;
//   const expectedChallenge = req.session.authChallenge;

//   if (!expectedChallenge) {
//     return res
//       .status(400)
//       .json({ error: "No challenge found. Please try signing in again." });
//   }

//   const user = db
//     .prepare("SELECT * FROM users WHERE username = ?")
//     .get(username);
//   if (!user) return res.status(404).json({ error: "User not found." });

//   const allCredentials = db
//     .prepare("SELECT * FROM credentials WHERE user_id = ?")
//     .all(user.id);

//   console.log("Auth response id:", authResp.id);
//   console.log(
//     "Stored credentials:",
//     allCredentials.map((c) => c.credential_id),
//   );

//   const credential = allCredentials.find(
//     (cred) =>
//       cred.credential_id === authResp.id ||
//       cred.credential_id ===
//         Buffer.from(authResp.id, "base64url").toString("base64url"),
//   );

//   if (!credential) {
//     console.error("No matching credential found for id:", authResp.id);
//     return res
//       .status(404)
//       .json({ error: "Credential not recognised. Try registering again." });
//   }

//   try {
//     const publicKeyBuffer = Buffer.from(credential.public_key, "base64url");

//     const verification = await verifyAuthenticationResponse({
//       response: authResp,
//       expectedChallenge,
//       expectedOrigin: ORIGIN,
//       expectedRPID: RP_ID,
//       requireUserVerification: true,
//       credential: {
//         id: credential.credential_id,
//         publicKey: publicKeyBuffer,
//         counter: credential.counter,
//       },
//     });

//     if (verification.verified) {
//       db.prepare(
//         "UPDATE credentials SET counter = ? WHERE credential_id = ?",
//       ).run(
//         verification.authenticationInfo.newCounter,
//         credential.credential_id,
//       );

//       req.session.authChallenge = null;
//       req.session.loggedInUser = username;

//       return res.json({ verified: true });
//     }

//     res.json({ verified: false, error: "Authentication failed." });
//   } catch (err) {
//     console.error("Login verify error:", err.message);
//     res.status(500).json({ verified: false, error: err.message });
//   }
// });

// module.exports = router;

// NEW CODE
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

console.log("=== WEBAUTHN CONFIG ===");
console.log("RP_NAME:", RP_NAME);
console.log("RP_ID:", RP_ID);
console.log("ORIGIN:", ORIGIN);
console.log("=======================");

// Converts credential/public key values safely for SQLite storage
function toBase64URL(value) {
  if (!value) return null;

  // SimpleWebAuthn v13 usually already gives credential.id as a base64url string
  if (typeof value === "string") return value;

  // Uint8Array / ArrayBuffer / Buffer
  return Buffer.from(value).toString("base64url");
}

function parseTransports(transports) {
  if (!transports) return undefined;

  try {
    if (Array.isArray(transports)) return transports;
    return JSON.parse(transports);
  } catch (_) {
    return undefined;
  }
}

// ── REGISTER: Get Options ─────────────────────────────────
router.post("/register/options", async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ error: "Username required" });
    }

    const cleanUsername = username.trim().toLowerCase();

    let user = db
      .prepare("SELECT * FROM users WHERE username = ?")
      .get(cleanUsername);

    if (!user) {
      db.prepare("INSERT INTO users (username) VALUES (?)").run(cleanUsername);
      user = db
        .prepare("SELECT * FROM users WHERE username = ?")
        .get(cleanUsername);
    }

    const existingCredentials = db
      .prepare(
        "SELECT credential_id, transports FROM credentials WHERE user_id = ?",
      )
      .all(user.id)
      .map((row) => ({
        id: row.credential_id,
        type: "public-key",
        transports: parseTransports(row.transports),
      }));

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: new TextEncoder().encode(String(user.id)),
      userName: cleanUsername,
      userDisplayName: cleanUsername,
      timeout: 60000,
      attestationType: "none",
      excludeCredentials: existingCredentials,

      // For your study, this keeps the flow focused on device passkeys
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        residentKey: "preferred",
        userVerification: "required",
      },
    });

    console.log("=== REGISTER OPTIONS DEBUG ===");
    console.log("RP_ID being used:", RP_ID);
    console.log("ORIGIN expected later:", ORIGIN);
    console.log("Username:", cleanUsername);
    console.log("User ID:", user.id);
    console.log("==============================");

    req.session.registrationChallenge = options.challenge;
    req.session.pendingUsername = cleanUsername;

    return res.json(options);
  } catch (err) {
    console.error("Register options error:", err);
    return res.status(500).json({
      error: "Could not start registration.",
      details: err.message,
    });
  }
});

// ── REGISTER: Verify Response ─────────────────────────────
router.post("/register/verify", async (req, res) => {
  try {
    const { username, attResp } = req.body;
    const expectedChallenge = req.session.registrationChallenge;

    if (!username || !username.trim()) {
      return res.status(400).json({ error: "Username required" });
    }

    if (!attResp) {
      return res.status(400).json({ error: "Registration response missing." });
    }

    if (!expectedChallenge) {
      return res.status(400).json({
        error: "No challenge found. Please restart registration.",
      });
    }

    const cleanUsername = username.trim().toLowerCase();

    if (
      req.session.pendingUsername &&
      req.session.pendingUsername !== cleanUsername
    ) {
      return res.status(400).json({
        error: "Username does not match the registration session.",
      });
    }

    const verification = await verifyRegistrationResponse({
      response: attResp,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: true,
    });

    if (!verification.verified) {
      return res.json({
        verified: false,
        error: "Registration verification failed.",
      });
    }

    const { credential } = verification.registrationInfo;

    const user = db
      .prepare("SELECT * FROM users WHERE username = ?")
      .get(cleanUsername);

    if (!user) {
      return res
        .status(404)
        .json({ error: "User not found after registration." });
    }

    const credentialID = toBase64URL(credential.id);
    const publicKey = toBase64URL(credential.publicKey);
    const counter = credential.counter || 0;

    const transports = attResp.response?.transports
      ? JSON.stringify(attResp.response.transports)
      : null;

    db.prepare(
      `
      INSERT OR REPLACE INTO credentials
      (user_id, credential_id, public_key, counter, transports)
      VALUES (?, ?, ?, ?, ?)
      `,
    ).run(user.id, credentialID, publicKey, counter, transports);

    console.log("=== CREDENTIAL SAVED ===");
    console.log("Username:", cleanUsername);
    console.log("User ID:", user.id);
    console.log("Credential ID stored:", credentialID);
    console.log("Transports stored:", transports);
    console.log("=========================");

    req.session.registrationChallenge = null;
    req.session.pendingUsername = null;

    return res.json({ verified: true });
  } catch (err) {
    console.error("Registration verify error:", err);
    return res.status(500).json({
      verified: false,
      error: err.message,
    });
  }
});

// ── LOGIN: Get Options ────────────────────────────────────
router.post("/login/options", async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ error: "Username required" });
    }

    const cleanUsername = username.trim().toLowerCase();

    const user = db
      .prepare("SELECT * FROM users WHERE username = ?")
      .get(cleanUsername);

    if (!user) {
      return res.status(404).json({
        error: "User not found. Please register first.",
      });
    }

    const credentials = db
      .prepare("SELECT * FROM credentials WHERE user_id = ?")
      .all(user.id);

    if (credentials.length === 0) {
      return res.status(404).json({
        error: "No passkey found for this account.",
      });
    }

    const allowCredentials = credentials.map((cred) => ({
      id: cred.credential_id,
      type: "public-key",
      transports: parseTransports(cred.transports),
    }));

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      timeout: 60000,
      allowCredentials,
      userVerification: "required",
    });

    console.log("=== LOGIN OPTIONS DEBUG ===");
    console.log("RP_ID being used:", RP_ID);
    console.log("Username:", cleanUsername);
    console.log("User ID:", user.id);
    console.log("allowCredentials:", JSON.stringify(allowCredentials, null, 2));
    console.log("===========================");

    req.session.authChallenge = options.challenge;
    req.session.authUsername = cleanUsername;

    return res.json(options);
  } catch (err) {
    console.error("Login options error:", err);
    return res.status(500).json({
      error: "Could not start sign-in.",
      details: err.message,
    });
  }
});

// ── LOGIN: Verify Response ────────────────────────────────
router.post("/login/verify", async (req, res) => {
  try {
    const { username, authResp } = req.body;
    const expectedChallenge = req.session.authChallenge;

    if (!username || !username.trim()) {
      return res.status(400).json({ error: "Username required" });
    }

    if (!authResp) {
      return res
        .status(400)
        .json({ error: "Authentication response missing." });
    }

    if (!expectedChallenge) {
      return res.status(400).json({
        error: "No challenge found. Please try signing in again.",
      });
    }

    const cleanUsername = username.trim().toLowerCase();

    if (
      req.session.authUsername &&
      req.session.authUsername !== cleanUsername
    ) {
      return res.status(400).json({
        error: "Username does not match the sign-in session.",
      });
    }

    const user = db
      .prepare("SELECT * FROM users WHERE username = ?")
      .get(cleanUsername);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const allCredentials = db
      .prepare("SELECT * FROM credentials WHERE user_id = ?")
      .all(user.id);

    const responseCredentialID = authResp.id || authResp.rawId;

    console.log("=== LOGIN VERIFY DEBUG ===");
    console.log("Auth response id:", responseCredentialID);
    console.log(
      "Stored credentials:",
      allCredentials.map((c) => c.credential_id),
    );
    console.log("==========================");

    const credential = allCredentials.find(
      (cred) => cred.credential_id === responseCredentialID,
    );

    if (!credential) {
      console.error(
        "No matching credential found for id:",
        responseCredentialID,
      );
      return res.status(404).json({
        verified: false,
        error: "Credential not recognised. Try registering again.",
      });
    }

    const verification = await verifyAuthenticationResponse({
      response: authResp,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: true,
      credential: {
        id: credential.credential_id,
        publicKey: Buffer.from(credential.public_key, "base64url"),
        counter: credential.counter,
        transports: parseTransports(credential.transports),
      },
    });

    if (!verification.verified) {
      return res.json({
        verified: false,
        error: "Authentication failed.",
      });
    }

    db.prepare(
      "UPDATE credentials SET counter = ? WHERE credential_id = ?",
    ).run(verification.authenticationInfo.newCounter, credential.credential_id);

    req.session.authChallenge = null;
    req.session.authUsername = null;
    req.session.loggedInUser = cleanUsername;

    return res.json({
      verified: true,
      username: cleanUsername,
    });
  } catch (err) {
    console.error("Login verify error:", err);
    return res.status(500).json({
      verified: false,
      error: err.message,
    });
  }
});

module.exports = router;
