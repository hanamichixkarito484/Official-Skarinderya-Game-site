/* ===========================================================
   Floating "Message Us" button + modal, present on every page
   =========================================================== */

function setupMessageBox() {
  const fab = document.getElementById("message-fab");
  const overlay = document.getElementById("message-overlay");
  const closeBtn = document.getElementById("message-close");
  const form = document.getElementById("message-form");
  const msgEl = document.getElementById("message-form-msg");

  if (!fab || !overlay || !form) return;

  fab.addEventListener("click", () => overlay.classList.add("open"));
  closeBtn.addEventListener("click", () => overlay.classList.remove("open"));
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("open");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("message-name").value.trim();
    const email = document.getElementById("message-email").value.trim();
    const body = document.getElementById("message-body").value.trim();

    msgEl.textContent = "Sending...";
    msgEl.className = "form-msg";

    const { error } = await supabaseClient.from("messages").insert({
      name,
      email,
      body,
    });

    if (error) {
      msgEl.textContent = "Something went wrong: " + error.message;
      msgEl.className = "form-msg error";
    } else {
      msgEl.textContent = "Message sent! We'll get back to you soon.";
      msgEl.className = "form-msg success";
      form.reset();
    }
  });
}

document.addEventListener("DOMContentLoaded", setupMessageBox);
