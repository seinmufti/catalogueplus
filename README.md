# Catalogue+

React + TypeScript catalogue app with an **admin panel** (desktop only) and a **customer catalogue** (mobile-first), backed by Supabase.

## Dev server (designation port **5176**)

```bash
npm install
npm run dev
```

- Home: [http://localhost:5176/](http://localhost:5176/)
- Admin: [http://localhost:5176/admin](http://localhost:5176/admin) — blocked on viewports ≤767px
- Customer: [http://localhost:5176/catalogueplus/aksesuaratali](http://localhost:5176/catalogueplus/aksesuaratali) — phone frame on desktop

Port is fixed via [`.cursor/designation.json`](.cursor/designation.json) and `strictPort: true` in Vite.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run [`supabase/migrations/001_products.sql`](supabase/migrations/001_products.sql).
3. Env vars in `.env.local`:
   - `VITE_SUPABASE_URL` — Project Settings → API → **Project URL**
   - `VITE_SUPABASE_ANON_KEY` — **Publishable** or legacy anon key

**Automated wiring (optional):** create a [Personal Access Token](https://supabase.com/dashboard/account/tokens) with **Projects** read and **Database** read-write, then:

```powershell
$env:SUPABASE_ACCESS_TOKEN = "sbp_..."
npm run supabase:wire
```

This fills in the project URL and runs `001_products.sql`.

Restart `npm run dev` after changing env vars.

### Security note

The migration enables **open RLS** for MVP (no admin login). Anyone with the anon key can read/write products and upload images. Tighten policies and add authentication before exposing the app publicly.

## Scripts

| Command        | Description        |
| -------------- | ------------------ |
| `npm run dev`  | Dev server :5176   |
| `npm run build`| Production build   |
| `npm run preview` | Preview build   |

## Manual verification

- [ ] With `.env.local` configured, admin loads the product table.
- [ ] **Add product** uploads an image and inserts a row; table refreshes.
- [ ] Customer route shows products in a **3×3** grid; page 2 appears when there are more than 9 items.
- [ ] `/admin` on a narrow viewport (or mobile) shows “Only available on PC”.
- [ ] Customer route on desktop shows a **390×844** rectangular frame.
- [ ] Starting dev while port 5176 is in use fails loudly (`strictPort`).
