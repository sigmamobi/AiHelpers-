# Edge Function Setup Guide (Web UI)  
_Set up `generate_ai_response` in <15 min — no CLI needed_

---

## 0. Prerequisites
| What | Why |
|------|-----|
| Supabase project | Created in dashboard |
| `generate_ai_response/index.ts` source | You have it in your repo (`supabase/functions/generate_ai_response/index.ts`) |
| OpenAI API key | Will be stored as secret |
| Service-role key | Needed inside the function to bypass RLS (find in Settings → API) |

---

## 1. Open the Edge Functions section
1. Sign-in at [app.supabase.com](https://app.supabase.com) and choose your project.  
2. In the left sidebar expand **Functions** and click **Edge Functions**.

---

## 2. Create the function shell
1. Press **New Function**.  
2. Fill the modal:  
   • **Name** → `generate_ai_response`  
   • **Path** (autofills) → `/generate_ai_response`  
   • ✅ **Verify JWT** (leave ON)  
   • Leave **Private** unchecked – JWT will still be required.  
3. Click **Create Function** – an online editor opens.

---

## 3. Paste your code
1. In your code editor open  
   `supabase/functions/generate_ai_response/index.ts`.  
2. Select **all** and copy.  
3. Back in the Supabase editor, replace the boiler-plate with the copied code.  
4. Hit **Save** (top-right).

---

## 4. Add environment secrets
1. Still inside the function screen, switch to **Settings** tab.  
2. Scroll to **Secrets** → **Add Secret**:  

| Name | Value | Notes |
|------|-------|-------|
| `OPENAI_API_KEY` | _sk-…_ | From OpenAI dashboard |
| `SERVICE_ROLE_KEY` | _service_role key_ | Settings → API |

3. Click **Save Secrets**.

---

## 5. Deploy
1. Press **Deploy** (top-right).  
2. Wait for “Deployment succeeded” toast.  
3. Supabase now shows an invoke URL:  
   ```
   https://<project-ref>.functions.supabase.co/generate_ai_response
   ```

---

## 6. Quick smoke test
1. Go to **Invoke** tab.  
2. Paste sample JSON in the body:
   ```json
   {
     "chatId": "test-chat",
     "userMessage": "Hello, AI!",
     "assistantId": "<some-assistant-uuid>"
   }
   ```
3. Click **Invoke Function**.  
4. You should receive `200` with `{ "aiResponse": … }`.

---

## 7. Wire secrets into the app
Add to your local `.env` (already done earlier):  
```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon>
OPENAI_API_KEY=<same as secret>
```

> The client **never** sees the service-role key — only the Edge Function does.


## 8. Troubleshooting

| Issue | Fix |
|-------|-----|
| `401 Unauthorized` | Ensure JWT in `Authorization` header when invoking |
| `Invalid JWT` in logs | Function set to “Verify JWT” but request missing/invalid token |
| `429` from OpenAI | Check quota, lower request rate |
| RLS blocks inserts | Confirm service-role key injected and function runs with it |

---

🎉 Your Edge Function is live and ready to serve AI replies.
