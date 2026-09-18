// Detect environment: use localhost when running locally, or your Render URL when hosted on Vercel
const API_URL =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://login-system-97ea.onrender.com";

// Form and view elements
const loginSection = document.getElementById("loginSection");
const registerSection = document.getElementById("registerSection");
const toRegisterLink = document.getElementById("toRegisterLink");
const toLoginLink = document.getElementById("toLoginLink");

// Switch views
toRegisterLink.addEventListener("click", (e) => {
  e.preventDefault();
  loginSection.classList.add("hidden");
  registerSection.classList.remove("hidden");
  clearMessages();
});

toLoginLink.addEventListener("click", (e) => {
  e.preventDefault();
  registerSection.classList.add("hidden");
  loginSection.classList.remove("hidden");
  clearMessages();
});

function clearMessages() {
  const loginMsg = document.getElementById("loginMessage");
  const regMsg = document.getElementById("registerMessage");
  if (loginMsg) loginMsg.textContent = "";
  if (regMsg) regMsg.textContent = "";
}

function showMessage(elementId, text, isError = false) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = text;
  el.className = isError ? "message error" : "message success";
}

// 1. Handle Registration
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;
    const btn = document.getElementById("regBtn");

    btn.disabled = true;
    showMessage("registerMessage", "Creating your account...");

    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed.");
      }

      showMessage("registerMessage", "Registration successful! Redirecting to sign in...");
      setTimeout(() => {
        registerForm.reset();
        registerSection.classList.add("hidden");
        loginSection.classList.remove("hidden");
        showMessage("loginMessage", "Account created! Please sign in.");
      }, 1200);
    } catch (err) {
      showMessage("registerMessage", err.message || "Cannot connect to server.", true);
    } finally {
      btn.disabled = false;
    }
  });
}

// 2. Handle Login
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const btn = document.getElementById("loginBtn");

    btn.disabled = true;
    showMessage("loginMessage", "Signing in (please wait up to 30s if free server is waking up)...");

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid credentials.");
      }

      // Save token and user details to localStorage
      localStorage.setItem("token", data.token);
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      showMessage("loginMessage", "Login successful! Redirecting...");
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 800);
    } catch (err) {
      showMessage("loginMessage", err.message || "Cannot connect to server.", true);
    } finally {
      btn.disabled = false;
    }
  });
}
