# Supabase Setup Guide ― AI Assistant App

This guide walks you through configuring a brand-new Supabase backend for the **AI Assistant** project.  
By the end you will have:

1. A Supabase project with all tables, RLS policies and triggers installed  
2. Seed data for the 30 predefined AI assistants  
3. A deployed Edge Function `generate_ai_response` that safely calls the OpenAI API  
4. Local `.env` / `app.json` populated so the React Native / Web app connects successfully  

> **Estimated time:** 25 – 40 minutes

---

## 0. Prerequisites

| Tool | Purpose | Install command |
|------|---------|-----------------|
| Supabase account | Cloud backend | <https://supabase.com> |
| Supabase CLI ≥ 1.158 | Migrations & Edge Functions | `brew install supabase/tap/supabase` <br/>or see CLI docs |
| Node .js ≥ 16 | Needed by CLI | `nvm install --lts` |
| Deno (bundled in CLI) | Runs Edge Functions | comes with CLI |
| OpenAI API key | Edge Function secrets | <https://platform.openai.com/account/api-keys> |
| Git repo cloned | Contains `/supabase` folder with `schema.sql`, `seed/assistants.sql`, `functions/generate_ai_response` | `git clone …` |

---

## 1. Create the Supabase Project

1. Log in to the Supabase dashboard → **New Project**  
2. Fill in:   
   • **Project Name** `ai-assistant`  
   • **DB Password** – strong & kept safe  
   • **Region** – nearest to major users  
3. Click **Create new project** – provisioning takes ≈ 1–2 min  
4. After it’s “Initializing… done”, open **Project Settings → API** and copy:

   | Name | Value | Keep where? |
   |------|-------|-------------|
   | `SUPABASE_URL` | `https://<project-ref>.supabase.co` | `.env` + `app.json` |
   | `anon` public key | `SUPABASE_ANON_KEY` | `.env` + `app.json` |
   | `service_role` key | **DO NOT** expose to client – used only in Edge Functions | `.env`, Function secrets |

---

## 2. Bootstrap the Database

### 2.1 Link CLI

```bash
cd clean-ai-app/ai-assistant        # project root
supabase link --project-ref <project-ref>
```

### 2.2 Apply schema & RLS

```bash
# execute the full schema (tables, indexes, triggers, policies)
supabase db push supabase/schema.sql
```

CLI returns `Finished  ✅` when all objects are created.

### 2.3 Seed assistants

```bash
supabase db push supabase/seed/assistants.sql
```

Verify in Dashboard → **Table Editor → assistants** (30 rows).

> Need to reseed? Run `supabase db push supabase/seed/assistants.sql --force`.

---

## 3. Deploy the Edge Function

### 3.1 Prepare environment variables

```bash
supabase functions secrets set \
  OPENAI_API_KEY="<your-openai-key>" \
  SUPABASE_SERVICE_ROLE_KEY="<service_role_key>"
```

> Only the service role key has permission to bypass RLS inside the function.

### 3.2 Deploy

```bash
supabase functions deploy generate_ai_response --project-ref <project-ref>
```

Output should end with  
`Deployed Edge Function generate_ai_response at /functions/v1/generate_ai_response`.

### 3.3 Local test

```bash
curl -X POST \
  -H "Authorization: Bearer <anon_or_service_key>" \
  -H "Content-Type: application/json" \
  -d '{"chatId":"test","userMessage":"Hello","assistantId":"<some-id>"}' \
  https://<project-ref>.functions.supabase.co/generate_ai_response
```

Should return JSON with `aiResponse`.

---

## 4. Configure the Front-End

### 4.1 `.env`

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
OPENAI_API_KEY=<openai_key>
```

> **Never** commit the file. `.gitignore` already excludes `.env`.

### 4.2 `app.json`

```jsonc
{
  "expo": {
    "extra": {
      "supabaseUrl": "https://<project-ref>.supabase.co",
      "supabaseAnonKey": "<anon_key>",
      "appEnv": "development"
    }
  }
}
```

### 4.3 Restart Expo

```bash
npm run web -- --port 8085   # or expo start
```

Login / signup now works (Supabase Auth).  
Chat messages persist and AI answers stream back in real-time.

---

## 5. Optional Local Development with `supabase start`

Want offline Postgres + Edge Functions?

```bash
supabase stop            # if running
supabase start           # launches local containers
supabase db reset        # applies schema & seed locally
```

Update `.env`:

```
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=...
```

---

## 6. Troubleshooting

| Symptom | Fix |
|---------|-----|
| **`403` Unauthorized** from Edge | Ensure correct header `Authorization: Bearer ANON_KEY` |
| Edge function `Invalid JWT` | Function secrets not set / wrong key type |
| RLS block insert/select | Confirm policies under **Auth → Policies**; use `service_role` in server contexts |
| Schema push fails `function … already exists` | Use `--overwrite` flag or drop objects manually |

---

## 7. What’s Next?

- Grant an **admin** role (Postgres) to manage assistants & feedback tables  
- Enable Supabase Storage for user avatars / assistant icons  
- Add rate-limits via **pg\_net** or **supabase/functions rate-limit**  
- Set up **Realtime** channel filters for messages to stream directly into the chat UI  
- Add automated backups & point-in-time-recovery in **Project Settings → Backups**

Happy building! 🚀
