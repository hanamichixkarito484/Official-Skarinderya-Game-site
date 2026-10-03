/* ===========================================================
   Page content loader
   Fetches admin-edited text from the "content_blocks" table and
   applies it to any element on the page marked with a
   data-content-key attribute. If no row exists for a key yet
   (or the fetch fails), the page just keeps showing its
   original built-in text - nothing breaks.
   =========================================================== */

async function applyPageContent() {
  try {
    const { data, error } = await supabaseClient.from("content_blocks").select("key, value");
    if (error || !data) return;

    const map = {};
    data.forEach((row) => (map[row.key] = row.value));

    document.querySelectorAll("[data-content-key]").forEach((el) => {
      const key = el.getAttribute("data-content-key");
      if (map[key] !== undefined && map[key] !== null && map[key] !== "") {
        el.textContent = map[key];
      }
    });
  } catch (e) {
    // Fail silently - default page text is already showing
  }
}

document.addEventListener("DOMContentLoaded", applyPageContent);
