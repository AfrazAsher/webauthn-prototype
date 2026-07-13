// const { startRegistration, startAuthentication } = SimpleWebAuthnBrowser;

// // ── REGISTRATION ──────────────────────────────────────────
// const registerBtn = document.getElementById("register-btn");
// if (registerBtn) {
//   registerBtn.addEventListener("click", async () => {
//     const username = document.getElementById("username").value.trim();

//     if (!username) {
//       showAlert("Please enter your email address.", "warning");
//       return;
//     }

//     logEvent("registration_start", "register", null, null);

//     try {
//       const optRes = await fetch("/api/webauthn/register/options", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ username }),
//       });

//       const opts = await optRes.json();
//       if (!optRes.ok) {
//         showAlert(
//           opts.error || "Failed to get registration options.",
//           "danger",
//         );
//         logEvent("registration_options_failed", "register", false, opts.error);
//         return;
//       }

//       let attResp;
//       try {
//         attResp = await startRegistration({ optionsJSON: opts });
//         console.log("=== CLIENT: REGISTRATION RESPONSE ===");
//         console.log(
//           "Transports reported by browser:",
//           attResp.response?.transports,
//         );
//         console.log("======================================");
//       } catch (err) {
//         if (err.name === "NotAllowedError") {
//           showAlert(
//             "Registration was cancelled or timed out. Please try again.",
//             "warning",
//           );
//           logEvent("registration_cancelled", "register", false, err.message);
//         } else {
//           showAlert("Authenticator error: " + err.message, "danger");
//           logEvent(
//             "registration_authenticator_error",
//             "register",
//             false,
//             err.message,
//           );
//         }
//         return;
//       }

//       const verifyRes = await fetch("/api/webauthn/register/verify", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ username, attResp }),
//       });

//       const verifyData = await verifyRes.json();
//       if (verifyData.verified) {
//         logEvent("registration_success", "register", true, null);
//         showAlert(
//           "Registration successful! Redirecting to sign in...",
//           "success",
//         );
//         setTimeout(() => (window.location.href = "/login.html"), 2000);
//       } else {
//         logEvent(
//           "registration_verify_failed",
//           "register",
//           false,
//           verifyData.error,
//         );
//         showAlert(verifyData.error || "Verification failed.", "danger");
//       }
//     } catch (err) {
//       logEvent("registration_network_error", "register", false, err.message);
//       showAlert("Network error. Is the server running?", "danger");
//     }
//   });
// }

// // ── LOGIN ─────────────────────────────────────────────────
// const loginBtn = document.getElementById("login-btn");
// if (loginBtn) {
//   loginBtn.addEventListener("click", async () => {
//     const username = document.getElementById("username").value.trim();

//     if (!username) {
//       showAlert("Please enter your email address.", "warning");
//       return;
//     }

//     logEvent("login_start", "login", null, null);

//     try {
//       const optRes = await fetch("/api/webauthn/login/options", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ username }),
//       });

//       const opts = await optRes.json();
//       console.log("=== CLIENT: LOGIN OPTIONS RECEIVED ===");
//       console.log(
//         "allowCredentials:",
//         JSON.stringify(opts.allowCredentials, null, 2),
//       );
//       console.log("=======================================");

//       if (!optRes.ok) {
//         showAlert(opts.error || "Failed to get login options.", "danger");
//         logEvent("login_options_failed", "login", false, opts.error);
//         return;
//       }

//       let authResp;
//       try {
//         authResp = await startAuthentication({ optionsJSON: opts });
//       } catch (err) {
//         console.log("=== CLIENT: AUTHENTICATION ERROR ===");
//         console.log("Error name:", err.name);
//         console.log("Error message:", err.message);
//         console.log("=====================================");
//         if (err.name === "NotAllowedError") {
//           showAlert(
//             "Sign-in was cancelled or timed out. Please try again.",
//             "warning",
//           );
//           logEvent("login_cancelled", "login", false, err.message);
//         } else {
//           showAlert("Authenticator error: " + err.message, "danger");
//           logEvent("login_authenticator_error", "login", false, err.message);
//         }
//         return;
//       }

//       const verifyRes = await fetch("/api/webauthn/login/verify", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ username, authResp }),
//       });

//       const verifyData = await verifyRes.json();
//       if (verifyData.verified) {
//         logEvent("login_success", "login", true, null);
//         showAlert("Sign-in successful! Redirecting...", "success");
//         //setTimeout(() => (window.location.href = "/dashboard.html"), 2000);
//       } else {
//         logEvent("login_failed", "login", false, verifyData.error);
//         if (window.location.pathname !== "/failure.html") {
//           showAlert("Sign-in failed. Redirecting...", "danger");
//           setTimeout(() => {
//             window.location.href =
//               "/failure.html?email=" + encodeURIComponent(username);
//           }, 1500);
//         } else {
//           showAlert(
//             verifyData.error || "Sign-in failed. Please try again.",
//             "danger",
//           );
//         }
//       }
//     } catch (err) {
//       logEvent("login_network_error", "login", false, err.message);
//       showAlert("Network error. Is the server running?", "danger");
//     }
//   });
// }

// // ── HELPERS ───────────────────────────────────────────────
// function showAlert(message, type) {
//   const box = document.getElementById("alert-box");
//   if (!box) return;
//   box.className = `alert alert-${type}`;
//   box.textContent = message;
//   box.classList.remove("d-none");
// }

// async function logEvent(eventType, task, success, errorMessage) {
//   try {
//     await fetch("/api/auth/log", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ eventType, task, success, errorMessage }),
//     });
//   } catch (_) {}
// }

// NEW CODE
const { startRegistration, startAuthentication } = SimpleWebAuthnBrowser;

// ── PREFILL EMAIL ON FAILURE PAGE ─────────────────────────
const usernameInput = document.getElementById("username");
if (usernameInput) {
  const params = new URLSearchParams(window.location.search);
  const emailFromUrl = params.get("email");

  if (emailFromUrl) {
    usernameInput.value = emailFromUrl;
  }
}

// ── REGISTRATION ──────────────────────────────────────────
const registerBtn = document.getElementById("register-btn");

if (registerBtn) {
  registerBtn.addEventListener("click", async () => {
    const username = document.getElementById("username").value.trim();

    if (!username) {
      showAlert("Please enter your email address.", "warning");
      return;
    }

    setButtonLoading(registerBtn, true, "Registering...");
    await logEvent("registration_start", "register", null, null);

    try {
      const optRes = await fetch("/api/webauthn/register/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const opts = await safeJson(optRes);

      if (!optRes.ok) {
        showAlert(
          opts.error || opts.details || "Failed to get registration options.",
          "danger",
        );

        await logEvent(
          "registration_options_failed",
          "register",
          false,
          opts.error || opts.details || "Failed to get registration options.",
        );

        return;
      }

      let attResp;

      try {
        attResp = await startRegistration({ optionsJSON: opts });

        console.log("=== CLIENT: REGISTRATION RESPONSE ===");
        console.log(
          "Transports reported by browser:",
          attResp.response?.transports,
        );
        console.log("======================================");
      } catch (err) {
        if (err.name === "NotAllowedError") {
          showAlert(
            "Registration was cancelled or timed out. Please try again.",
            "warning",
          );

          await logEvent(
            "registration_cancelled",
            "register",
            false,
            err.message,
          );
        } else {
          showAlert("Authenticator error: " + err.message, "danger");

          await logEvent(
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

      const verifyData = await safeJson(verifyRes);

      if (verifyData.verified) {
        await logEvent("registration_success", "register", true, null);

        showAlert(
          "Registration successful! Redirecting to sign in...",
          "success",
        );

        setTimeout(() => {
          window.location.href =
            "/login.html?email=" + encodeURIComponent(username);
        }, 2000);
      } else {
        const errorMessage =
          verifyData.error || verifyData.details || "Verification failed.";

        await logEvent(
          "registration_verify_failed",
          "register",
          false,
          errorMessage,
        );

        showAlert(errorMessage, "danger");
      }
    } catch (err) {
      await logEvent(
        "registration_network_error",
        "register",
        false,
        err.message,
      );

      showAlert("Network error. Is the server running?", "danger");
    } finally {
      setButtonLoading(registerBtn, false, "Register Passkey");
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

    setButtonLoading(loginBtn, true, "Checking...");
    await logEvent("login_start", "login", null, null);

    try {
      const optRes = await fetch("/api/webauthn/login/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const opts = await safeJson(optRes);

      console.log("=== CLIENT: LOGIN OPTIONS RECEIVED ===");
      console.log(
        "allowCredentials:",
        JSON.stringify(opts.allowCredentials, null, 2),
      );
      console.log("=======================================");

      if (!optRes.ok) {
        const errorMessage =
          opts.error || opts.details || "Failed to get login options.";

        showAlert(errorMessage, "danger");

        await logEvent("login_options_failed", "login", false, errorMessage);

        return;
      }

      let authResp;

      try {
        authResp = await startAuthentication({ optionsJSON: opts });
      } catch (err) {
        console.log("=== CLIENT: AUTHENTICATION ERROR ===");
        console.log("Error name:", err.name);
        console.log("Error message:", err.message);
        console.log("=====================================");

        if (err.name === "NotAllowedError") {
          showAlert(
            "Sign-in was cancelled or timed out. Please try again.",
            "warning",
          );

          await logEvent("login_cancelled", "login", false, err.message);
        } else {
          showAlert("Authenticator error: " + err.message, "danger");

          await logEvent(
            "login_authenticator_error",
            "login",
            false,
            err.message,
          );
        }

        return;
      }

      const verifyRes = await fetch("/api/webauthn/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, authResp }),
      });

      const verifyData = await safeJson(verifyRes);

      if (verifyData.verified) {
        await logEvent("login_success", "login", true, null);
        showAlert("Sign-in successful. Task complete.", "success");
        setTimeout(() => {
          window.location.href = "/dashboard.html";
        }, 2000);
      } else {
        const errorMessage =
          verifyData.error || verifyData.details || "Sign-in failed.";

        await logEvent("login_failed", "login", false, errorMessage);

        if (window.location.pathname !== "/failure.html") {
          showAlert(
            "Sign-in failed. Redirecting to failure screen...",
            "danger",
          );

          await logEvent(
            "login_redirect_to_failure",
            "login",
            false,
            errorMessage,
          );

          setTimeout(() => {
            window.location.href =
              "/failure.html?email=" + encodeURIComponent(username);
          }, 1500);
        } else {
          showAlert(
            errorMessage || "Sign-in failed. Please try again.",
            "danger",
          );
        }
      }
    } catch (err) {
      await logEvent("login_network_error", "login", false, err.message);

      showAlert("Network error. Is the server running?", "danger");
    } finally {
      setButtonLoading(loginBtn, false, "Use your Fingerprint / PIN");
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
  } catch (_) {
    // Logging should not break the main user flow
  }
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch (_) {
    return {};
  }
}

function setButtonLoading(button, isLoading, loadingText) {
  if (!button) return;

  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.disabled = true;
    button.textContent = loadingText;
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || loadingText;
  }
}
