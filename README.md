# Simmer & Stir — Cooking Game Website

A static website (Home, About, Features, Dishes, Customers) with login/sign-up,
an admin CMS for managing dishes and viewing messages, and a floating
"Message Us" button on every page. Hosted for free on **GitHub Pages**, backed
by **Supabase** (free tier) for accounts, dish content, and messages.

Follow these steps in order. None of them require the command line — everything
can be done in a web browser.

---

## Part 1 — Put the code on GitHub

1. **Create a GitHub account:** go to https://github.com/join and sign up (it's free).
2. **Create a new repository:**
   - Click the **+** icon (top right) → **New repository**.
   - Name it something like `cooking-game-site`.
   - Set it to **Public** (required for free GitHub Pages).
   - Do NOT check "Add a README" (we already have one).
   - Click **Create repository**.
3. **Upload the files:**
   - On your new repo's page, click **"uploading an existing file"** (or **Add file → Upload files**).
   - Drag in every file and folder from this project (`index.html`, `about.html`,
     `css/`, `js/`, etc.) — you can drag whole folders in most browsers.
   - Scroll down and click **Commit changes**.
4. **Turn on GitHub Pages:**
   - In your repo, go to **Settings → Pages** (left sidebar).
   - Under "Build and deployment", set **Source** to **Deploy from a branch**.
   - Set **Branch** to `main` and folder to `/ (root)`, then **Save**.
   - After a minute, GitHub will show you a live URL like
     `https://yourusername.github.io/cooking-game-site/`. That's your website!

---

## Part 2 — Set up the backend (Supabase)

This powers login, sign-up, the CMS, and the message box.

1. Go to https://supabase.com and sign up for a free account.
2. Click **New Project**. Pick any name and password (save the password somewhere safe), and choose a region close to you.
3. Once the project is ready, go to **Project Settings → API**.
   - Copy the **Project URL**.
   - Copy the **anon public** key.
4. Open `js/supabase-client.js` in your GitHub repo (click the file, then the pencil/edit icon), and paste your values in:
   ```js
   const SUPABASE_URL = "https://xxxxxxx.supabase.co";
   const SUPABASE_ANON_KEY = "eyJhbGciOi...";
   ```
   Commit the change.

5. **Create the database tables.** In Supabase, go to the **SQL Editor**, paste the
   following, and click **Run**:

   ```sql
   -- Profiles table: extends each auth user with a role and display name
   create table profiles (
     id uuid references auth.users on delete cascade primary key,
     display_name text,
     role text default 'user',
     created_at timestamp with time zone default now()
   );

   -- Dishes table: content managed via the CMS, shown on the Dishes page
   create table dishes (
     id uuid default gen_random_uuid() primary key,
     name text not null,
     description text,
     price numeric,
     image_url text,
     created_at timestamp with time zone default now()
   );

   -- Messages table: submissions from the "Message Us" button
   create table messages (
     id uuid default gen_random_uuid() primary key,
     name text,
     email text,
     body text,
     created_at timestamp with time zone default now()
   );

   -- Enable Row Level Security
   alter table profiles enable row level security;
   alter table dishes enable row level security;
   alter table messages enable row level security;

   -- Anyone can read their own profile; admins are checked client-side via this table
   create policy "Users can view own profile" on profiles
     for select using (auth.uid() = id);
   create policy "Users can insert own profile" on profiles
     for insert with check (auth.uid() = id);

   -- Anyone (including logged-out visitors) can read dishes
   create policy "Anyone can view dishes" on dishes
     for select using (true);
   -- Only admins can add/edit/delete — enforced by policy below
   create policy "Admins can manage dishes" on dishes
     for all using (
       exists (select 1 from profiles where id = auth.uid() and role = 'admin')
     );

   -- Anyone can submit a message; only admins can read/delete them
   create policy "Anyone can send a message" on messages
     for insert with check (true);
   create policy "Admins can view messages" on messages
     for select using (
       exists (select 1 from profiles where id = auth.uid() and role = 'admin')
     );
   create policy "Admins can delete messages" on messages
     for delete using (
       exists (select 1 from profiles where id = auth.uid() and role = 'admin')
     );
   ```

6. **Turn off email confirmation (optional, for easier testing):**
   - Go to **Authentication → Providers → Email**, and toggle off "Confirm email" if you don't want to deal with confirmation emails while testing. You can turn it back on later.

7. **Make yourself an admin:**
   - Sign up for an account on your live website first (this creates your user + profile row).
   - In Supabase, go to **Table Editor → profiles**, find your row, and change
     `role` from `user` to `admin`. Save.
   - Refresh your website and log in — you'll now see a **CMS** link in the nav bar.

---

## Part 3 — Test it

- Visit your GitHub Pages URL.
- Try signing up, logging in, and logging out.
- Click **Message Us** and send a test message.
- Log in as your admin account, open the **CMS** link, and:
  - Add a dish — it should immediately appear on the **Dishes** page.
  - See your test message in the Message Inbox.

---

## File structure

```
cooking-game-site/
├── index.html          Home page
├── about.html
├── features.html
├── dishes.html          Pulls dish content live from Supabase
├── customers.html
├── login.html
├── signup.html
├── cms.html             Admin-only dashboard
├── css/
│   └── style.css        Cozy warm theme, Times New Roman
├── js/
│   ├── supabase-client.js   <-- paste your Supabase URL/key here
│   ├── auth.js               Login/signup/nav logic
│   ├── messages.js           Floating message button + modal
│   └── cms.js                Admin dish CRUD + message inbox
└── README.md (this file)
```

## Notes & things you may want to customize
- Colors and fonts live in `css/style.css` under the `:root` section at the top.
- To add more admins later, just flip `role` to `admin` for any user row in the `profiles` table.
- Dish images: paste any public image URL into the CMS's "Image URL" field (e.g. an image hosted on Imgur).
- If you'd rather use Firebase instead of Supabase, the HTML/CSS stays the same — only `supabase-client.js`, `auth.js`, `messages.js`, and `cms.js` would need to be swapped for Firebase equivalents. Just ask and I can build that version too.
