// const express = require("express");
// const router = express.Router();
// const db = require("../db/database");

// // Event logging endpoint
// router.post("/log", (req, res) => {
//   const { eventType, task, success, errorMessage } = req.body;
//   const sessionId = req.session.id || "unknown";

//   db.prepare(
//     `
//     INSERT INTO event_log (session_id, event_type, task, success, error_message)
//     VALUES (?, ?, ?, ?, ?)
//   `,
//   ).run(sessionId, eventType, task, success ? 1 : 0, errorMessage || null);

//   res.json({ ok: true });
// });

// module.exports = router;

// NEW CODE
const express = require("express");
const router = express.Router();
const db = require("../db/database");

// ── EVENT LOGGING ENDPOINT ────────────────────────────────
// Used by the frontend to record usability events such as:
// registration_start, registration_success, login_failed, etc.
router.post("/log", (req, res) => {
  try {
    const { eventType, task, success, errorMessage } = req.body;

    // express-session provides this as req.sessionID
    const sessionId = req.sessionID || "unknown";

    // Keep neutral events as NULL, not failed.
    // true  -> 1
    // false -> 0
    // null/undefined -> null
    let successValue = null;
    if (success === true) successValue = 1;
    if (success === false) successValue = 0;

    db.prepare(
      `
      INSERT INTO event_log 
      (session_id, event_type, task, success, error_message)
      VALUES (?, ?, ?, ?, ?)
      `,
    ).run(
      sessionId,
      eventType || "unknown_event",
      task || "unknown_task",
      successValue,
      errorMessage || null,
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error("Event log error:", err);

    return res.status(500).json({
      ok: false,
      error: "Could not log event.",
    });
  }
});

module.exports = router;
