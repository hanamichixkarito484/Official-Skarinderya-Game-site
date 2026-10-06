/* ===========================================================
   Page content loader
   Fetches admin-edited values from the "content_blocks" table and
   applies them to any element on the page marked with:
     data-content-key        -> plain text
     data-content-image-key  -> an <img>'s src (e.g. customer photos)
     data-content-video-key  -> a YouTube link/ID, OR a direct video
                                 file URL (e.g. one uploaded via the CMS)
   Also applies a site-wide background image if one has been saved
   under the key "site_background_image".
   If no saved value exists yet (or the fetch fails), the page just
   keeps showing its original built-in defaults - nothing breaks.
   =========================================================== */

function extractYouTubeId(input) {
  if (!input) return null;
  const trimmed = input.trim();
  // Already a bare 11-character YouTube ID
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  const patterns = [/youtu\.be\/([\w-]{11})/, /youtube\.com\/embed\/([\w-]{11})/, /[?&]v=([\w-]{11})/];
  for (const re of patterns) {
    const m = trimmed.match(re);
    if (m) return m[1];
  }
  return null;
}

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

    document.querySelectorAll("[data-content-image-key]").forEach((el) => {
      const key = el.getAttribute("data-content-image-key");
      if (map[key]) el.src = map[key];
    });

    document.querySelectorAll("[data-content-video-key]").forEach((el) => {
      const key = el.getAttribute("data-content-video-key");
      const raw = map[key];
      if (!raw) return;

      const youTubeId = extractYouTubeId(raw);
      if (youTubeId) {
        // A YouTube link/ID was saved - keep the existing iframe embed
        if (el.tagName === "IFRAME") {
          el.src = "https://www.youtube.com/embed/" + youTubeId;
        }
      } else {
        // Anything else is a direct video file URL (e.g. one uploaded via the CMS) -
        // an iframe can't play that natively, so swap in a real <video> element
        const video = document.createElement("video");
        video.src = raw;
        video.controls = true;
        video.style.width = "100%";
        video.style.height = "100%";
        video.style.display = "block";
        el.replaceWith(video);
      }
    });

    if (map["site_background_image"]) {
      document.body.style.backgroundImage = `url("${map["site_background_image"]}")`;
    }
  } catch (e) {
    // Fail silently - default page content is already showing
  }
}

document.addEventListener("DOMContentLoaded", applyPageContent);
