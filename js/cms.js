/* ===========================================================
   CMS Dashboard logic (cms.html)
   Only accessible to users whose profiles.role = 'admin'
   =========================================================== */

async function guardCmsAccess() {
  const gate = document.getElementById("cms-gate");
  const content = document.getElementById("cms-content");

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    gate.innerHTML = 'Please <a href="login.html">log in as an admin</a> to view the CMS.';
    return false;
  }

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    gate.textContent = "You do not have admin access.";
    return false;
  }

  gate.style.display = "none";
  content.style.display = "block";
  return true;
}

// ---------- Dishes CRUD ----------
let currentDishes = [];
let editingDishId = null;

async function loadDishesTable() {
  const tbody = document.getElementById("dishes-tbody");
  const { data: dishes, error } = await supabaseClient
    .from("dishes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="3">Error loading dishes: ${error.message}</td></tr>`;
    return;
  }

  currentDishes = dishes || [];

  tbody.innerHTML = currentDishes
    .map(
      (d) => `
    <tr>
      <td>${escapeHtml(d.name)}</td>
      <td>${escapeHtml(d.description || "")}</td>
      <td class="inline-actions">
        <button onclick="startEditDish('${d.id}')">Edit</button>
        <button onclick="deleteDish('${d.id}')" class="danger">Delete</button>
      </td>
    </tr>`
    )
    .join("");
}

async function deleteDish(id) {
  if (!confirm("Delete this dish?")) return;
  await supabaseClient.from("dishes").delete().eq("id", id);
  if (editingDishId === id) resetDishForm();
  loadDishesTable();
}

function startEditDish(id) {
  const dish = currentDishes.find((d) => d.id === id);
  if (!dish) return;
  editingDishId = id;
  document.getElementById("dish-name").value = dish.name || "";
  document.getElementById("dish-description").value = dish.description || "";
  document.getElementById("dish-image").value = dish.image_url || "";
  document.getElementById("dish-image-file").value = "";
  document.getElementById("dish-form-submit-btn").textContent = "Update Dish";
  document.getElementById("dish-form-cancel-btn").style.display = "inline-block";
  document.getElementById("dish-form-msg").textContent = "";
  document.getElementById("add-dish-form").scrollIntoView({ behavior: "smooth" });
}

function resetDishForm() {
  editingDishId = null;
  document.getElementById("add-dish-form").reset();
  document.getElementById("dish-form-submit-btn").textContent = "Add Dish";
  document.getElementById("dish-form-cancel-btn").style.display = "none";
}

function setupAddDishForm() {
  const form = document.getElementById("add-dish-form");
  const msgEl = document.getElementById("dish-form-msg");

  document.getElementById("dish-form-cancel-btn").addEventListener("click", resetDishForm);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("dish-name").value.trim();
    const description = document.getElementById("dish-description").value.trim();
    const fileInput = document.getElementById("dish-image-file");
    let image_url = document.getElementById("dish-image").value.trim();

    msgEl.textContent = "Saving...";
    msgEl.className = "form-msg";

    // A chosen file always takes priority over a pasted URL
    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      const path = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const { error: uploadError } = await supabaseClient.storage.from("dish-images").upload(path, file);
      if (uploadError) {
        msgEl.textContent = "Image upload failed: " + uploadError.message;
        msgEl.className = "form-msg error";
        return;
      }
      const { data: urlData } = supabaseClient.storage.from("dish-images").getPublicUrl(path);
      image_url = urlData.publicUrl;
    }

    let error;
    if (editingDishId) {
      const payload = { name, description };
      if (image_url) payload.image_url = image_url; // leave existing image if nothing new was given
      ({ error } = await supabaseClient.from("dishes").update(payload).eq("id", editingDishId));
    } else {
      ({ error } = await supabaseClient.from("dishes").insert({ name, description, image_url }));
    }

    if (error) {
      msgEl.textContent = "Error: " + error.message;
      msgEl.className = "form-msg error";
      return;
    }

    msgEl.textContent = editingDishId ? "Dish updated!" : "Dish added!";
    msgEl.className = "form-msg success";
    resetDishForm();
    loadDishesTable();
  });
}

// ---------- Messages inbox ----------
async function loadMessagesTable() {
  const tbody = document.getElementById("messages-tbody");
  const { data: msgs, error } = await supabaseClient
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="4">Error loading messages: ${error.message}</td></tr>`;
    return;
  }

  tbody.innerHTML = msgs
    .map(
      (m) => `
    <tr>
      <td>${m.name}</td>
      <td>${m.email}</td>
      <td>${m.body}</td>
      <td class="inline-actions">
        <button onclick="deleteMessage('${m.id}')" class="danger">Delete</button>
      </td>
    </tr>`
    )
    .join("");
}

async function deleteMessage(id) {
  if (!confirm("Delete this message?")) return;
  await supabaseClient.from("messages").delete().eq("id", id);
  loadMessagesTable();
}

// ---------- Page Content editor ----------
// Each entry: { key, label, default } — "default" is the text already
// built into the page, shown until an admin saves a different value.
const CONTENT_MANIFEST = {
  "Home": [
    { key: "home_hero_title", label: "Hero title", default: "Cook, Create, and Serve Up Fun!" },
    { key: "home_hero_subtitle", label: "Hero subtitle", default: "Welcome to Skarinderya, the cozy cooking game where you build your dream restaurant, invent new dishes, and delight a growing crowd of hungry customers." },
    { key: "home_intro_heading", label: "Intro heading", default: "What is Skarinderya?" },
    { key: "home_intro_text", label: "Intro paragraph", default: "Skarinderya is a warm, relaxing cooking simulation game. Chop, sizzle, plate, and serve as you grow from a humble food cart to a beloved neighborhood restaurant. Along the way, unlock new recipes, decorate your kitchen, and win over a cast of quirky, hungry customers." },
    { key: "home_feature1_title", label: "Feature card 1 title", default: "🍳 Cook Real Recipes" },
    { key: "home_feature1_text", label: "Feature card 1 text", default: "Dozens of dishes inspired by cuisines from around the world." },
    { key: "home_feature2_title", label: "Feature card 2 title", default: "🏪 Build Your Restaurant" },
    { key: "home_feature2_text", label: "Feature card 2 text", default: "Upgrade your kitchen and dining room as your reputation grows." },
    { key: "home_feature3_title", label: "Feature card 3 title", default: "🧑‍🤝‍🧑 Meet Your Customers" },
    { key: "home_feature3_text", label: "Feature card 3 text", default: "Every customer has a story, a favorite dish, and a personality." },
  ],
  "About": [
    { key: "about_title", label: "Page title", default: "About Skarinderya" },
    { key: "about_intro_text", label: "Intro paragraph", default: "Skarinderya began as a small passion project between a handful of developers who love both cooking and cozy games. We wanted to create something that felt like a warm kitchen on a rainy afternoon — simple to pick up, endlessly satisfying, and full of charm." },
    { key: "about_mission_heading", label: "Mission heading", default: "Our Mission" },
    { key: "about_mission_text", label: "Mission paragraph", default: "We believe games can be relaxing without being boring. Every recipe, character, and kitchen upgrade in Skarinderya is designed to bring a small moment of comfort to your day." },
    { key: "about_team_heading", label: "Team section heading", default: "Our Team" },
    { key: "about_team1_title", label: "Team card 1 title", default: "Development" },
    { key: "about_team1_text", label: "Team card 1 text", default: "A small team of engineers and designers building the game engine, art, and recipes." },
    { key: "about_team2_title", label: "Team card 2 title", default: "Community" },
    { key: "about_team2_text", label: "Team card 2 text", default: "We listen closely to player feedback through our message box and community events." },
    { key: "about_team3_title", label: "Team card 3 title", default: "Culinary Advisors" },
    { key: "about_team3_text", label: "Team card 3 text", default: "Real home cooks and chefs help make sure every dish feels authentic." },
    { key: "about_team4_title", label: "Team card 4 title", default: "Mickey Saballegue" },
    { key: "about_team4_text", label: "Team card 4 text", default: "One of the Main Programmers for Skarinderya." },
  ],
  "Features": [
    { key: "features_title", label: "Page title", default: "Game Features" },
    { key: "features_intro", label: "Intro paragraph", default: "Everything that makes Skarinderya cozy, deep, and endlessly replayable." },
    { key: "features_card1_title", label: "Card 1 title", default: "🥘 100+ Recipes" },
    { key: "features_card1_text", label: "Card 1 text", default: "Unlock dishes from breakfast staples to elaborate five-course dinners." },
    { key: "features_card2_title", label: "Card 2 title", default: "🛠️ Kitchen Customization" },
    { key: "features_card2_text", label: "Card 2 text", default: "Redesign your kitchen and dining area with dozens of themes and furniture sets." },
    { key: "features_card3_title", label: "Card 3 title", default: "📈 Restaurant Progression" },
    { key: "features_card3_text", label: "Card 3 text", default: "Grow your reputation, hire staff, and expand from a food cart to a five-star bistro." },
    { key: "features_card4_title", label: "Card 4 title", default: "🧑‍🍳 Character Stories" },
    { key: "features_card4_text", label: "Card 4 text", default: "Every regular customer has a personality, favorite order, and small story arc." },
  ],
  "Dishes": [
    { key: "dishes_title", label: "Page title", default: "Dishes" },
    { key: "dishes_intro", label: "Intro paragraph", default: "These dishes are managed live by our developers through the CMS — new recipes appear here as soon as they're added." },
  ],
  "Customers": [
    { key: "customers_title", label: "Page title", default: "Meet Our Customers" },
    { key: "customers_intro", label: "Intro paragraph", default: "Every player who visits your restaurant has a story. Here are a few fan favorites from the Skarinderya community." },
    { key: "customers_kapre_title", label: "Kapre title", default: "🌳 Kapre" },
    { key: "customers_kapre_text", label: "Kapre bio", default: "Big, gentle, and endlessly patient! Kapre lumbers in every evening from the old balete tree out back, and he's the calmest, most good-natured customer in the whole restaurant — nothing rattles him, and he's always happy to wait his turn. His favorite order is a hearty bowl of Kare-Kare, and he never leaves without a friendly nod on his way out." },
    { key: "customers_manananggal_title", label: "Manananggal title", default: "🦇 Manananggal" },
    { key: "customers_manananggal_text", label: "Manananggal bio", default: "A sweet night owl who shows up right after sunset — but don't keep her waiting! Manananggal likes to be greeted and seated the moment she flies in. Once she's settled with her favorite Dinuguan, she's wonderful company for the rest of the night." },
    { key: "customers_duwende_title", label: "Duwende title", default: "🍄 Duwende" },
    { key: "customers_duwende_text", label: "Duwende bio", default: "Small, polite, and a little mischievous! Duwende always says a cheerful \"tabi tabi po\" before stepping inside. He's more easygoing than Manananggal, but don't let him wait too long — if he feels forgotten, he'll quietly slip away without a word. Keep his favorite Arroz Caldo coming and he'll be a loyal regular." },
    { key: "customers_testimonials_heading", label: "Testimonials heading", default: "What Real Players Say" },
    { key: "customers_testimonial1", label: "Testimonial 1", default: "\"This game feels like a warm hug after a long day.\"" },
    { key: "customers_testimonial2", label: "Testimonial 2", default: "\"I love watching my little food cart grow into a full restaurant.\"" },
    { key: "customers_testimonial3", label: "Testimonial 3", default: "\"The customer stories are so charming — I look forward to new ones every update.\"" },
  ],
};

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function loadContentEditor() {
  const container = document.getElementById("content-editor-fields");
  const tabsContainer = document.getElementById("content-page-tabs");
  const pageNames = Object.keys(CONTENT_MANIFEST);

  const { data: rows } = await supabaseClient.from("content_blocks").select("key, value");
  const savedMap = {};
  (rows || []).forEach((r) => (savedMap[r.key] = r.value));

  // One small tab button per page
  tabsContainer.innerHTML = pageNames
    .map((name, i) => `<button type="button" class="content-page-tab-btn${i === 0 ? " active" : ""}" data-page="${name}">${name}</button>`)
    .join("");

  // One field group per page; only the first is visible at a time
  let html = "";
  pageNames.forEach((pageName, i) => {
    html += `<div class="content-page-group" data-page-group="${pageName}"${i === 0 ? "" : ' style="display:none;"'}>`;
    CONTENT_MANIFEST[pageName].forEach((field) => {
      const currentValue = savedMap[field.key] !== undefined ? savedMap[field.key] : field.default;
      html += `
        <label for="content-${field.key}">${field.label}</label>
        <textarea id="content-${field.key}" data-key="${field.key}" rows="2">${escapeHtml(currentValue)}</textarea>
      `;
    });
    html += `</div>`;
  });
  container.innerHTML = html;

  tabsContainer.querySelectorAll(".content-page-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      tabsContainer.querySelectorAll(".content-page-tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const page = btn.getAttribute("data-page");
      container.querySelectorAll(".content-page-group").forEach((g) => {
        g.style.display = g.getAttribute("data-page-group") === page ? "" : "none";
      });
    });
  });
}

// ---------- Customer Images (upload or link) ----------
async function setupCustomerImages() {
  const rows = document.querySelectorAll(".customer-image-row");
  if (!rows.length) return;

  // Show each customer's current image (saved one if it exists, else the built-in default)
  const { data } = await supabaseClient.from("content_blocks").select("key, value");
  const saved = {};
  (data || []).forEach((r) => (saved[r.key] = r.value));
  const defaults = {
    customers_kapre_image: "images/kapre.png",
    customers_manananggal_image: "images/manananggal.png",
    customers_duwende_image: "images/duwende.png",
  };

  rows.forEach((row) => {
    const key = row.getAttribute("data-key");
    row.querySelector(".customer-image-preview").src = saved[key] || defaults[key];
  });

  document.querySelectorAll(".cust-save-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const who = btn.getAttribute("data-who");
      const key = `customers_${who}_image`;
      const fileInput = document.getElementById(`cust-${who}-file`);
      const urlInput = document.getElementById(`cust-${who}-url`);
      const msgEl = document.getElementById(`cust-${who}-msg`);
      const preview = btn.closest(".customer-image-row").querySelector(".customer-image-preview");

      msgEl.textContent = "Saving...";
      msgEl.className = "form-msg";

      let value = urlInput.value.trim();

      // A chosen file always takes priority over a pasted link
      if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        const path = `customers/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
        const { error: uploadError } = await supabaseClient.storage.from("site-media").upload(path, file);
        if (uploadError) {
          msgEl.textContent = "Upload failed: " + uploadError.message;
          msgEl.className = "form-msg error";
          return;
        }
        const { data: urlData } = supabaseClient.storage.from("site-media").getPublicUrl(path);
        value = urlData.publicUrl;
      }

      if (!value) {
        msgEl.textContent = "Choose a file or paste an image link first.";
        msgEl.className = "form-msg error";
        return;
      }

      const { error } = await supabaseClient.from("content_blocks").upsert({ key, value });
      if (error) {
        msgEl.textContent = "Error: " + error.message;
        msgEl.className = "form-msg error";
        return;
      }

      msgEl.textContent = "Saved! Check the Customers page.";
      msgEl.className = "form-msg success";
      preview.src = value;
      fileInput.value = "";
      urlInput.value = "";
    });
  });
}

// ---------- Gameplay Video (link or direct upload) ----------
async function setupVideoForm() {
  const currentEl = document.getElementById("video-current");
  const linkInput = document.getElementById("video-youtube-link");
  const fileInput = document.getElementById("video-upload-file");
  const saveBtn = document.getElementById("save-video-btn");
  const msgEl = document.getElementById("video-save-msg");

  const { data } = await supabaseClient
    .from("content_blocks")
    .select("value")
    .eq("key", "home_gameplay_video")
    .maybeSingle();
  currentEl.value = (data && data.value) || "(using the built-in default video)";

  saveBtn.addEventListener("click", async () => {
    msgEl.textContent = "Saving...";
    msgEl.className = "form-msg";

    let value = linkInput.value.trim();

    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      const path = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const { error: uploadError } = await supabaseClient.storage.from("site-media").upload(path, file);
      if (uploadError) {
        msgEl.textContent = "Upload failed: " + uploadError.message;
        msgEl.className = "form-msg error";
        return;
      }
      const { data: urlData } = supabaseClient.storage.from("site-media").getPublicUrl(path);
      value = urlData.publicUrl;
    }

    if (!value) {
      msgEl.textContent = "Paste a YouTube link or choose a file first.";
      msgEl.className = "form-msg error";
      return;
    }

    const { error } = await supabaseClient.from("content_blocks").upsert({ key: "home_gameplay_video", value });

    if (error) {
      msgEl.textContent = "Error: " + error.message;
      msgEl.className = "form-msg error";
      return;
    }

    msgEl.textContent = "Saved! Check the Home page to see it.";
    msgEl.className = "form-msg success";
    currentEl.value = value;
    linkInput.value = "";
    fileInput.value = "";
  });
}

// ---------- Top-level CMS tabs (Manage Dishes / Page Content / Message Inbox) ----------
function setupCmsTabs() {
  const buttons = document.querySelectorAll(".cms-tab-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const target = "tab-" + btn.getAttribute("data-tab");
      document.querySelectorAll(".cms-tab-panel").forEach((panel) => {
        panel.style.display = panel.id === target ? "" : "none";
      });
    });
  });
}

function setupContentSaveButton() {
  const btn = document.getElementById("save-content-btn");
  const msgEl = document.getElementById("content-save-msg");

  btn.addEventListener("click", async () => {
    msgEl.textContent = "Saving...";
    msgEl.className = "form-msg";

    const textareas = document.querySelectorAll("#content-editor-fields textarea[data-key]");
    const rows = Array.from(textareas).map((ta) => ({
      key: ta.getAttribute("data-key"),
      value: ta.value,
    }));

    const { error } = await supabaseClient.from("content_blocks").upsert(rows, { onConflict: "key" });

    if (error) {
      msgEl.textContent = "Error saving: " + error.message;
      msgEl.className = "form-msg error";
    } else {
      msgEl.textContent = "All page content saved! Visit the live pages to see the changes.";
      msgEl.className = "form-msg success";
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const ok = await guardCmsAccess();
  if (!ok) return;
  document.getElementById("cms-logout").addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "index.html";
  });
  setupCmsTabs();
  setupAddDishForm();
  loadDishesTable();
  loadMessagesTable();
  loadContentEditor();
  setupContentSaveButton();
  setupVideoForm();
  setupCustomerImages();
});
