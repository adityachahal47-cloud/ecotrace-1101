/**
 * EcoTrace Extension — Popup Script
 *
 * Handles login, tab switching, analysis requests, and result display.
 */

const API_URL = "http://localhost:8000";
const WEB_URL = "http://localhost:3000";

// DOM elements
const loginSection = document.getElementById("login-section");
const mainSection = document.getElementById("main-section");
const resultSection = document.getElementById("result-section");
const loadingSection = document.getElementById("loading-section");

// Auth
const emailInput = document.getElementById("email-input");
const passwordInput = document.getElementById("password-input");
const loginBtn = document.getElementById("login-btn");
const loginError = document.getElementById("login-error");
const userEmail = document.getElementById("user-email");
const logoutBtn = document.getElementById("logout-btn");

// Analyze
const analyzeSelectionBtn = document.getElementById("analyze-selection-btn");
const imageUrlInput = document.getElementById("image-url-input");
const analyzeImageBtn = document.getElementById("analyze-image-btn");
const contentUrlInput = document.getElementById("content-url-input");
const analyzeUrlBtn = document.getElementById("analyze-url-btn");

// Result
const resultCard = document.getElementById("result-card");
const resultIcon = document.getElementById("result-icon");
const resultVerdict = document.getElementById("result-verdict");
const resultMeta = document.getElementById("result-meta");
const resultBar = document.getElementById("result-bar");
const resultLink = document.getElementById("result-link");

// --- State ---
let authToken = null;
let currentEmail = null;

// --- Init ---
async function init() {
  const stored = await chrome.storage.local.get(["authToken", "userEmail"]);
  if (stored.authToken) {
    authToken = stored.authToken;
    currentEmail = stored.userEmail || "";
    showMain();
  } else {
    showLogin();
  }

  // Check for pending analysis from context menu (right-click)
  try {
    const pending = await chrome.storage.local.get("pendingAnalysis");
    if (pending.pendingAnalysis) {
      const { type, content } = pending.pendingAnalysis;
      // Clear pending immediately
      await chrome.storage.local.remove("pendingAnalysis");
      chrome.action.setBadgeText({ text: "" });

      if (authToken && content) {
        // Auto-trigger analysis
        analyze(type, content);
      } else if (!authToken) {
        showError("Please sign in first, then right-click again to analyze.");
      }
      return; // Skip selection check since we have pending
    }
  } catch (e) {
    // No pending analysis
  }

  // Check for selected text from content script
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: "GET_SELECTION" }, (response) => {
        if (response?.text) {
          analyzeSelectionBtn.disabled = false;
          analyzeSelectionBtn.textContent = `Analyze: "${response.text.substring(0, 40)}..."`;
          analyzeSelectionBtn.dataset.text = response.text;
        }
      });
    }
  } catch (e) {
    // Content script might not be loaded
  }
}

// --- Auth ---
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showError("Please enter email and password");
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Signing in...";

  try {
    // Use Supabase REST API for login
    const supabaseUrl = await getSupabaseUrl();
    const supabaseKey = await getSupabaseKey();

    const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error_description || data.msg || "Login failed");
    }

    authToken = data.access_token;
    currentEmail = email;
    await chrome.storage.local.set({ authToken, userEmail: email });
    showMain();
  } catch (err) {
    showError(err.message);
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Sign In";
  }
});

logoutBtn.addEventListener("click", async () => {
  authToken = null;
  currentEmail = null;
  await chrome.storage.local.remove(["authToken", "userEmail"]);
  showLogin();
});

// --- Tabs ---
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");
  });
});

// --- Analyze ---
analyzeSelectionBtn.addEventListener("click", () => {
  const text = analyzeSelectionBtn.dataset.text;
  if (text) analyze("text", text);
});

analyzeImageBtn.addEventListener("click", () => {
  const url = imageUrlInput.value.trim();
  if (url) analyze("image", url);
});

analyzeUrlBtn.addEventListener("click", () => {
  const url = contentUrlInput.value.trim();
  if (url) analyze("image", url); // Default to image for URLs
});

async function analyze(type, content) {
  if (!authToken) return showLogin();

  resultSection.classList.add("hidden");
  loadingSection.classList.remove("hidden");

  try {
    const res = await fetch(`${API_URL}/api/analyze/json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        type,
        content,
        source: "extension",
      }),
    });

    if (res.status === 401) {
      await chrome.storage.local.remove(["authToken", "userEmail"]);
      showLogin();
      return;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Analysis failed");
    }

    const result = await res.json();
    showResult(result);
  } catch (err) {
    loadingSection.classList.add("hidden");
    alert(err.message || "Analysis failed");
  }
}

// --- Display ---
function showLogin() {
  loginSection.classList.remove("hidden");
  mainSection.classList.add("hidden");
  resultSection.classList.add("hidden");
  loadingSection.classList.add("hidden");
  loginError.classList.add("hidden");
}

function showMain() {
  loginSection.classList.add("hidden");
  mainSection.classList.remove("hidden");
  userEmail.textContent = currentEmail;
}

function showError(msg) {
  loginError.textContent = msg;
  loginError.classList.remove("hidden");
}

function showResult(result) {
  loadingSection.classList.add("hidden");
  resultSection.classList.remove("hidden");

  const isAI = result.final_verdict === "ai_generated";
  const percentage = Math.round(result.ai_likelihood * 100);

  resultCard.className = `result-card ${isAI ? "ai" : "real"}`;
  resultIcon.innerHTML = isAI
    ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
    : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#51CF66" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>';

  resultVerdict.textContent = isAI ? "AI-Generated" : "Likely Real";
  resultMeta.textContent = `${percentage}% AI likelihood | ${result.agreement_level} agreement`;
  resultBar.style.width = `${percentage}%`;
  resultLink.href = `${WEB_URL}/result/${result.request_id}`;
}

// --- Supabase config ---
function getSupabaseUrl() {
  return "https://bgwlngawrardbucfejdx.supabase.co";
}

function getSupabaseKey() {
  return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnd2xuZ2F3cmFyZGJ1Y2ZlamR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MzQ0OTEsImV4cCI6MjA4NzAxMDQ5MX0.7eXl_gg7Gj4Lj8Jw4kllUVUSwZVLVZ_PMsGcONTHvXU";
}

// Start
init();
