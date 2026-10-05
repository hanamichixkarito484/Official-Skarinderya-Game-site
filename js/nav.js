/* ===========================================================
   Hamburger menu toggle, shared across every page
   =========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("nav-toggle");
  const menu = document.getElementById("nav-menu");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  // Close the menu after picking a link, or when clicking anywhere else
  menu.addEventListener("click", (e) => {
    if (e.target.tagName === "A") menu.classList.remove("open");
  });
  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && e.target !== toggle) {
      menu.classList.remove("open");
    }
  });
});
