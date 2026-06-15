const express = require("express");
const router = express.Router();
const db = require("../db/database");

// Event logging endpoint
router.post("/log", (req, res) => {
  const { eventType, task, success, errorMessage } = req.body;
  const sessionId = req.session.id || "unknown";

  db.prepare(
    `
    INSERT INTO event_log (session_id, event_type, task, success, error_message)
    VALUES (?, ?, ?, ?, ?)
  `,
  ).run(sessionId, eventType, task, success ? 1 : 0, errorMessage || null);

  res.json({ ok: true });
});

module.exports = router;
