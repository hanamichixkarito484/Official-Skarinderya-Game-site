/* ===========================================================
   Shared auth/nav logic used on every page
   =========================================================== */

// Updates the navbar auth area based on whether someone is logged in,
// and shows/hides the CMS link if they are an admin.
async function refreshNavAuthUI() {
  const authArea = document.getElementById("nav-auth-area");
  const cmsLink = document.getElementById("nav-cms-link");
  if (!authArea) return;

  const { data: { session } } = await supabaseClient.auth.getSession();

  if (!session) {
    authArea.innerHTML = `
      <a href="login.html">Log In</a>
      <a href="signup.html">Sign Up</a>
    `;
    if (cmsLink) cmsLink.style.display = "none";
    return;
  }

  const user = session.user;

  // Look up this user's role in the profiles table
  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .single();

  const isAdmin = profile && profile.role === "admin";
  const name = (profile && profile.display_name) || user.email;

  authArea.innerHTML = `
    <span>Hi, ${name}${isAdmin ? ' <span class="badge-admin">Admin</span>' : ""}</span>
    <button id="logout-btn">Log Out</button>
  `;

  document.getElementById("logout-btn").addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "index.html";
  });

  if (cmsLink) cmsLink.style.display = isAdmin ? "inline" : "none";
}

// ---------- Login form handling (login.html) ----------
function setupLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const msgEl = document.getElementById("login-msg");
    msgEl.textContent = "Logging in...";
    msgEl.className = "form-msg";

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
      msgEl.textContent = error.message;
      msgEl.className = "form-msg error";
    } else {
      msgEl.textContent = "Success! Redirecting...";
      msgEl.className = "form-msg success";
      setTimeout(() => (window.location.href = "index.html"), 800);
    }
  });
}

// ---------- Sign-up form handling (signup.html) ----------
function setupSignupForm() {
  const form = document.getElementById("signup-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("signup-name").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;
    const msgEl = document.getElementById("signup-msg");
    msgEl.textContent = "Creating your account...";
    msgEl.className = "form-msg";

    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name }, // picked up by the DB trigger to create the profile row
      },
    });

    if (error) {
      msgEl.textContent = error.message;
      msgEl.className = "form-msg error";
      return;
    }

    msgEl.textContent = "Account created! Check your email to confirm, then log in.";
    msgEl.className = "form-msg success";
    form.reset();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  refreshNavAuthUI();
  setupLoginForm();
  setupSignupForm();
});
