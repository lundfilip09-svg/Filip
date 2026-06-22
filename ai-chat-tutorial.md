# Slik redigerer du AI-chatten

## Filen du redigerer
`api/_lib/context.js` — øverst ligger `SYSTEM_PROMPT`, som er instruksjonene AI-en følger.

## Åpne filen
```bash
code ~/Dev/Dashboard/api/_lib/context.js
```
*(eller TextEdit, Cursor, hva du foretrekker)*

---

## Hva du kan endre

### Personlighet og tone
```
SVARSTIL: ...
```
Endre her hvis du vil ha kortere/lengre svar, mer direkte tone, mer fokus på et bestemt område osv.

### Skader og behandling
AI-en leser dette live fra databasen (`[PLAGER/SKADER]` og `[FYSIO-NOTATER]`).
Du trenger ikke røre koden — oppdater via appen, og AI-en ser det automatisk neste melding.

### Trenere og støttepersonell
Samme — redigeres via appen, hentes live via `[PROFIL]`-blokken.

### Mål og PB
Hentes live fra `sprint_records`-tabellen. Oppdater via appen.

### Noe som ikke finnes i appen ennå
Skriv det rett inn i `SYSTEM_PROMPT` som en ny seksjon, f.eks.:

```
ERNÆRING: Filip spiser ikke frokost før sprint-trening. Ta hensyn til dette når du gir råd om timing og energi.
```

---

## Lagre og publiser
```bash
cd ~/Dev/Dashboard && git add api/_lib/context.js && git commit -m "oppdater system prompt" && git push origin main
```
Vercel deployer automatisk — tar ~30 sekunder, så er endringen live.

---

## Sjekk at JS-en er gyldig før push
```bash
node --check ~/Dev/Dashboard/api/_lib/context.js
```
Ingen output = ingen feil.
