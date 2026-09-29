/* ===========================================================
   Shared auth/nav logic used on every page
   =========================================================== */

// Updates the navbar auth area based on whether someone is logged in,
// and shows/hides the CMS link if they are an admin.
async function refreshNavAuthUI() {
  const cmsLink = document.getElementById("nav-cms-link");
  if (!cmsLink) return;

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return;

  // Only show the CMS link to a logged-in admin
  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (profile && profile.role === "admin") cmsLink.style.display = "inline";
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
      setTimeout(() => (window.location.href = "cms.html"), 800);
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
