const { startRegistration, startAuthentication } = SimpleWebAuthnBrowser;

// ── REGISTRATION ──────────────────────────────────────────
const registerBtn = document.getElementById("register-btn");
if (registerBtn) {
  registerBtn.addEventListener("click", async () => {
    const username = document.getElementById("username").value.trim();

    if (!username) {
      showAlert("Please enter your email address.", "warning");
      return;
    }

    logEvent("registration_start", "register", null, null);

    try {
      const optRes = await fetch("/api/webauthn/register/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const opts = await optRes.json();
      if (!optRes.ok) {
        showAlert(
          opts.error || "Failed to get registration options.",
          "danger",
        );
        logEvent("registration_options_failed", "register", false, opts.error);
        return;
      }

      let attResp;
      try {
        attResp = await startRegistration({ optionsJSON: opts });
      } catch (err) {
        if (err.name === "NotAllowedError") {
          showAlert(
            "Registration was cancelled or timed out. Please try again.",
            "warning",
          );
          logEvent("registration_cancelled", "register", false, err.message);
        } else {
          showAlert("Authenticator error: " + err.message, "danger");
          logEvent(
            "registration_authenticator_error",
            "register",
            false,
            err.message,
          );
        }
        return;
      }

      const verifyRes = await fetch("/api/webauthn/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, attResp }),
      });

      const verifyData = await verifyRes.json();
      if (verifyData.verified) {
        logEvent("registration_success", "register", true, null);
        showAlert(
          "Registration successful! Redirecting to sign in...",
          "success",
        );
        setTimeout(() => (window.location.href = "/login.html"), 2000);
      } else {
        logEvent(
          "registration_verify_failed",
          "register",
          false,
          verifyData.error,
        );
        showAlert(verifyData.error || "Verification failed.", "danger");
      }
    } catch (err) {
      logEvent("registration_network_error", "register", false, err.message);
      showAlert("Network error. Is the server running?", "danger");
    }
  });
}

// ── LOGIN ─────────────────────────────────────────────────
const loginBtn = document.getElementById("login-btn");
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const username = document.getElementById("username").value.trim();

    if (!username) {
      showAlert("Please enter your email address.", "warning");
      return;
    }

    logEvent("login_start", "login", null, null);

    try {
      const optRes = await fetch("/api/webauthn/login/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const opts = await optRes.json();
      if (!optRes.ok) {
        showAlert(opts.error || "Failed to get login options.", "danger");
        logEvent("login_options_failed", "login", false, opts.error);
        return;
      }

      let authResp;
      try {
        authResp = await startAuthentication({ optionsJSON: opts });
      } catch (err) {
        if (err.name === "NotAllowedError") {
          showAlert(
            "Sign-in was cancelled or timed out. Please try again.",
            "warning",
          );
          logEvent("login_cancelled", "login", false, err.message);
        } else {
          showAlert("Authenticator error: " + err.message, "danger");
          logEvent("login_authenticator_error", "login", false, err.message);
        }
        return;
      }

      const verifyRes = await fetch("/api/webauthn/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, authResp }),
      });

      const verifyData = await verifyRes.json();
      if (verifyData.verified) {
        logEvent("login_success", "login", true, null);
        showAlert("Sign-in successful! Redirecting...", "success");
        setTimeout(() => (window.location.href = "/dashboard.html"), 2000);
      } else {
        logEvent("login_failed", "login", false, verifyData.error);
        showAlert(
          verifyData.error || "Sign-in failed. Please try again.",
          "danger",
        );
      }
    } catch (err) {
      logEvent("login_network_error", "login", false, err.message);
      showAlert("Network error. Is the server running?", "danger");
    }
  });
}

// ── HELPERS ───────────────────────────────────────────────
function showAlert(message, type) {
  const box = document.getElementById("alert-box");
  if (!box) return;
  box.className = `alert alert-${type}`;
  box.textContent = message;
  box.classList.remove("d-none");
}

async function logEvent(eventType, task, success, errorMessage) {
  try {
    await fetch("/api/auth/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType, task, success, errorMessage }),
    });
  } catch (_) {}
}
