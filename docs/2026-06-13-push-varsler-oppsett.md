# Push-varsler — oppsett (2026-06-13)

## Hva var galt
Hviletimeren ba service worker-en (`sw.js`) fyre varselet med `setTimeout`.
**iOS dreper service worker-en når PWA-en er i bakgrunnen**, så `setTimeout`
fyrer aldri — varselet dukket først opp når du åpnet appen igjen og SW-en våknet.
Eneste pålitelige måte å levere varsel til telefonen mens du er i andre apper, er
**ekte Web Push (VAPID)**: serveren sender varselet, og det fyrer selv om appen er
lukket. Det er nå på plass — og brukes både av hviletimeren og av nye
gjøremål-påminnelser.

## Du må gjøre 4 ting (engangsoppsett)

### 1. Kjør databasemigrasjonen
Supabase → SQL Editor → lim inn og kjør `supabase/migrations/044_push_notifications.sql`.
Lager tabellene `push_subscriptions` og `scheduled_notifications` + kolonnen
`todos.remind_at`.

### 2. Lag en gratis QStash-konto (planleggeren)
QStash leverer varselet på *nøyaktig riktig sekund* selv i bakgrunnen
(gratis: 500 meldinger/dag — mer enn nok).
- Gå til https://console.upstash.com → QStash.
- Kopier **QSTASH_TOKEN** (under «Request Builder» / «Tokens»).

### 3. Legg til miljøvariabler i Vercel
Project → Settings → Environment Variables (Production + Preview):

```
VAPID_PUBLIC_KEY   = <din public key>
VAPID_PRIVATE_KEY  = <din private key — ALDRI commit denne>
VAPID_SUBJECT      = mailto:filip.lund09@gmail.com
QSTASH_TOKEN       = <fra steg 2>
```

`SUPABASE_SERVICE_ROLE_KEY` og `CRON_SECRET` finnes allerede — gjenbrukes.
Generer VAPID-nøklene med `npx web-push generate-vapid-keys` og lim verdiene
DIREKTE inn i Vercel Environment Variables — aldri i en fil i repoet.
(De gamle nøklene som lå her ble lekket til GitHub 15.06.2026 og må ikke brukes.)

### 4. Deploy + slå på varsler på telefonen
- Push/deploy.
- iPhone (KRITISK rekkefølge): åpne dashboardet i Safari → Del →
  **Legg til på Hjem-skjerm**. Åpne appen *fra Hjem-skjermen* (ikke Safari).
  iOS gir bare Web Push til installerte PWA-er.
- I gym: åpne Hviletimer → trykk **🔔 Slå på varsler** → godkjenn.
  (Eller sett en påminnelse på et gjøremål — samme tillatelse.)

## Test
1. Start en hviletimer på 30 sek, lås telefonen / bytt til en annen app.
   Varselet skal komme når timeren er over — uten å åpne appen.
2. Gjøremål → ⏰ → sett påminnelse 2 min frem → lås telefonen. Skal pinge.

## Slik virker det (kort)
- `enableNotifications()` (utils.js) ber om tillatelse + abonnerer → lagres i
  `push_subscriptions`.
- Start hviletimer / sett påminnelse → `schedulePush()` → `/api/push/schedule`
  lagrer en rad i `scheduled_notifications` og ber QStash kalle `/api/push/fire`
  på riktig tid.
- `/api/push/fire` sender varselet via VAPID til alle enheter. Idempotent
  (én levering, hindrer dobbelt). Stopp/fullfør → `/api/push/cancel`.
- Foran­grunn dekkes fortsatt av SW-timeren; samme `tag` («rest-timer») gjør at
  evt. dobbel kollapser til ett varsel.

## Uten QStash (valgfritt alternativ)
Er du på **Vercel Pro** og vil slippe QStash, bruk reserveruten `/api/push/sweep`
i stedet — legg denne i `vercel.json` under `crons` (presisjon da ±60 s, OK for
gjøremål, litt grovt for hviletimer):
```json
{ "path": "/api/push/sweep", "schedule": "* * * * *" }
```
NB: Vercel **Hobby** tillater maks 2 cron-jobber og kun daglig frekvens — da
funker ikke per-minutt-cron, og du bør bruke QStash. Derfor er QStash standard.
