# Supabase Setup Guide  
_Bring your AI-Assistant backend online in ~30 minutes_

---

## 0. Prerequisites

| Tool / Account | Why it’s needed | Install / link |
|----------------|-----------------|----------------|
| Supabase account | Cloud Postgres, Auth, Edge Fns | https://supabase.com |
| Supabase CLI ≥ v2 | apply schema / seed, deploy functions | `brew install supabase/tap/supabase` |
| Node ≥ 16 | CLI runtime | https://nodejs.org |
| PostgreSQL (mobile dev optional) | local dev with `supabase start` | installed with CLI |
| OpenAI API key | AI responses | https://platform.openai.com/account/api-keys |
| Repo cloned | contains `/supabase` folder | `git clone …` |

---

## 1. Create a Supabase project

1. Sign in at `app.supabase.com` → **New project**.  
2. Fill in:
   - **Project name:** `ai-assistant`
   - **DB password:** strong & saved
   - **Region:** closest to users  
3. Wait 1–2 min while it provisions.  
4. Open **Project Settings → API** and copy:

   | Var | Value | Where we’ll use it |
   |-----|-------|--------------------|
   | Project URL | `https://<ref>.supabase.co` | `.env`, `app.json` |
   | `anon` public key | `SUPABASE_ANON_KEY` | `.env`, `app.json` |
   | `service_role` key | **DO NOT** put in client code | CLI secrets, `.env` (as `SERVICE_ROLE_KEY`) |

---

## 2. Apply the database schema

### Option A – Supabase Dashboard

1. Left sidebar → **SQL Editor → New query**  
2. Open repo file `supabase/schema.sql`, copy all, paste, **Run**.  
3. You should see “Success, no rows returned”.

### Option B – Supabase CLI (recommended for teams / CI)

```bash
cd ai-assistant      # repo root
supabase login       # opens browser (or use --token)
supabase link --project-ref <project-ref>
supabase db push     # runs schema.sql
```

---

## 3. Seed initial assistants

### Dashboard

1. SQL Editor → **New query**  
2. Copy `supabase/seed/assistants.sql` → **Run**  
3. Check **Table Editor → assistants** — should list ~30 rows.

### CLI

```bash
supabase db seed --file supabase/seed/assistants.sql
```

---

## 4. Configure CORS (Auth → Settings)

For local web dev (Expo Web default port 8082):

| Field | Value |
|-------|-------|
| **Site URL** | `http://localhost:8082` |
| **Redirect URLs** | `http://localhost:8082` |

Click **Save**.  
Add production URLs later (e.g. `https://app.yoursite.com`).

---

## 5. Edge Function `generate_ai_response`

### 5.1 Install & link CLI (if not done)

```bash
brew install supabase/tap/supabase   # already installed?
supabase login --token '<access-token>'
supabase link --project-ref <project-ref>
```

Generate an access-token in Dashboard → Account → Access Tokens if browser flow fails.

### 5.2 Inject secrets

> The CLI forbids names starting with `SUPABASE_`; we use `SERVICE_ROLE_KEY`.

```bash
supabase secrets set OPENAI_API_KEY="sk-..." \
                     SERVICE_ROLE_KEY="<service_role_key>"
```

### 5.3 Deploy

```bash
# from repo root
supabase functions deploy generate_ai_response
```

Success output ends with:

```
Deployed Edge Function generate_ai_response at /functions/v1/generate_ai_response
```

### 5.4 Smoke test (optional)

```bash
supabase functions invoke generate_ai_response \
  --body '{"chatId":"test","userMessage":"Hello","assistantId":"<uuid>"}'
```

Expect `200 OK` JSON with `"aiResponse"`.

---

## 6. Environment variables

Create `.env` (never commit) in repo root:

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon-public-key>
SERVICE_ROLE_KEY=<service-role-key>      # used only by Edge Fns
OPENAI_API_KEY=<your-openai-key>

EXPO_PUBLIC_APP_ENV=development
APP_URL=http://localhost:8082            # web URL for redirect
```

Update `app.config.js` / `app.json` `extra` section to read these vars if not already.

After editing `.env`, restart Expo:

```bash
# kill Metro if running
npx expo start --web --port 8082
```

---

## 7. Common pitfalls

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Failed to fetch` on login | CORS or wrong URL/key | Ensure step 4 done and `.env` matches Dashboard |
| 401 / 403 from Edge Fn | Missing JWT or wrong secret | Call function via Supabase client; verify secrets |
| `Env name cannot start with SUPABASE_` | Wrong secret name | Use `SERVICE_ROLE_KEY` instead |
| OpenAI 429 / 401 | Quota or invalid key | Check dashboard / billing & secret value |
| Realtime not firing | Row Level Security or channel name | Confirm RLS policies and `filter: chat_id=eq.<id>` |

---

🎉 Your Supabase backend is live!  
Next → run the Expo app, register a user, open a chat, and watch AI replies stream in real time.  
Happy building!
