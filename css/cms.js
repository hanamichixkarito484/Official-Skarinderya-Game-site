/* ===========================================================
   CMS Dashboard logic (cms.html)
   Only accessible to users whose profiles.role = 'admin'
   =========================================================== */

async function guardCmsAccess() {
  const gate = document.getElementById("cms-gate");
  const content = document.getElementById("cms-content");

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    gate.textContent = "Please log in as an admin to view the CMS.";
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
async function loadDishesTable() {
  const tbody = document.getElementById("dishes-tbody");
  const { data: dishes, error } = await supabaseClient
    .from("dishes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="4">Error loading dishes: ${error.message}</td></tr>`;
    return;
  }

  tbody.innerHTML = dishes
    .map(
      (d) => `
    <tr>
      <td>${d.name}</td>
      <td>${d.description || ""}</td>
      <td>${d.price ? "$" + d.price : ""}</td>
      <td class="inline-actions">
        <button onclick="deleteDish('${d.id}')" class="danger">Delete</button>
      </td>
    </tr>`
    )
    .join("");
}

async function deleteDish(id) {
  if (!confirm("Delete this dish?")) return;
  await supabaseClient.from("dishes").delete().eq("id", id);
  loadDishesTable();
}

function setupAddDishForm() {
  const form = document.getElementById("add-dish-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("dish-name").value.trim();
    const description = document.getElementById("dish-description").value.trim();
    const price = document.getElementById("dish-price").value;
    const image_url = document.getElementById("dish-image").value.trim();

    await supabaseClient.from("dishes").insert({ name, description, price, image_url });
    form.reset();
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

document.addEventListener("DOMContentLoaded", async () => {
  const ok = await guardCmsAccess();
  if (!ok) return;
  setupAddDishForm();
  loadDishesTable();
  loadMessagesTable();
});
