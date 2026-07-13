// utils.js — shared utilities, loaded as a plain script (no module)

// ── i18n ──────────────────────────────────────────────────────────────────────
let _lang = localStorage.getItem('lang') || 'no';

const TRANSLATIONS = {
  no: {
    // Nav
    'nav.ai': 'AI', 'nav.dashboard': 'Dashboard', 'nav.gym': 'Gym',
    'nav.sprint': 'Sprint', 'nav.sovn': 'Søvn', 'nav.gjoremal': 'Gjøremål',
    'nav.kalender': 'Kalender', 'nav.treningsplan': 'Treningsoversikt',
    'nav.investments': 'Investeringer', 'nav.business': 'Business',
    'nav.logout': 'Logg ut', 'nav.pdf': 'Eksporter PDF',
    // Common
    'loading': 'Laster…', 'no_data': 'Ingen data', 'save': 'Lagre',
    'cancel': 'Avbryt', 'delete': 'Slett', 'close': 'Lukk', 'add': 'Legg til',
    'edit': 'Rediger', 'reset': 'Nullstill', 'date': 'Dato', 'notes': 'Notater', 'unit.sec': 'sek',
    'note.expand': 'Vis mer', 'note.collapse': 'Vis mindre',
    // Knee pain
    'knee.before': 'Før', 'knee.during': 'Under', 'knee.after': 'Etter',
    'knee.dayafter': 'Dagen etter',
    'pain.meter': 'Smerteskala 0–10',
    'he.add_set': 'sett', 'he.add_ex': 'øvelse', 'he.new_ex_name': 'Navn på øvelse:',
    'he.saving': 'Lagrer …', 'he.saved': 'Lagret', 'he.save_err': 'Lagring feilet',
    'pain.manual_btn': '+ Manuell',
    'knee.before_short': 'FØR', 'knee.during_short': 'UNDER',
    'knee.after_short': 'ETTER', 'knee.dayafter_short': 'D.ETTER',
    'knee.before_session': 'Før økt', 'knee.during_session': 'Under økt',
    'knee.after_session': 'Etter økt', 'knee.pain': 'Smerte',
    'knee.pain_0_10': 'Smerte (0–10)',
    // Session types
    'session.strength_power': 'Styrke Power',
    'session.strength_capacity': 'Styrke Kapasitet',
    'session.mobility': 'Sirkulasjon & Mobilitet',
    'session.daily_rehab': 'Daglig Rehab',
    'session.rest_day': 'Hviledag', 'session.rest': 'Hvile', 'session.off': 'Fri',
    // Dashboard
    'dash.sleep': 'Søvn', 'dash.knee': 'Knesmerte', 'dash.injuries_card': 'Skader', 'dash.session': 'Dagens økt',
    'dash.focus': 'Fokus', 'dash.daily_focus': 'Dagens fokus',
    'dash.tasks': 'Gjøremål', 'dash.next_event': 'Neste hendelse',
    'dash.overview': 'Oversikt', 'dash.this_week': 'Denne uken',
    'dash.calendar': 'Kalender', 'dash.today': 'I dag', 'dash.upcoming': 'Kommende',
    'dash.status': 'Status', 'dash.full_overview': 'Full treningsoversikt →',
    'dash.sleep_score': 'Søvnscore', 'dash.hrv': 'HRV', 'dash.rhr': 'Hvilepuls',
    'dash.deep_sleep': 'Dyp søvn', 'dash.deep': 'Dyp', 'dash.tonight': 'I natt',
    'dash.hr_unit': 't', 'dash.min_unit': 'm',
    'dash.cfg_error': 'Sett SUPABASE_URL og SUPABASE_ANON_KEY som miljøvariabler i Vercel.',
    'dash.yesterday': 'I går', 'dash.days_ago': '{n} dager siden',
    'dash.offline': 'Ingen nettverkstilkobling — data kan være utdatert',
    'dash.no_session': 'Ingen økt planlagt i dag', 'dash.rest_day': 'Hviledag',
    'dash.no_events': 'Ingen kommende hendelser', 'dash.no_data': 'Ingen data',
    'dash.no_today': 'Ingen hendelser i dag',
    'dash.active_tasks': '{n} aktive', 'dash.little_data': 'Lite data',
    'dash.go_to_session': 'Gå til økt →', 'dash.go_to_sleep': 'Gå til søvn →',
    'dash.go_to_sprint': 'Gå til sprint →',
    'dash.recovery_day': 'Restitusjonsdag', 'dash.tomorrow': 'I morgen', 'dash.overdue': 'Forfalt',
    'dash.all_ok': 'Alt ser bra ut i dag', 'dash.no_pain': 'Ingen smertelogg',
    'dash.load_pain': 'Belastning × smerte',
    'dash.acwr_label': 'ACWR (7d:28d)',
    'dash.pain_label': 'Smerte (0–10)',
    'dash.risk_line': 'Risikogrense 1.5',
    'dash.pain_limit': 'Smertegrense {n}',
    'dash.load_pain_empty': 'For lite data til ACWR ennå',
    'dash.sleep_dur_lbl': 'Søvnlengde', 'dash.trend_7d': 'Trend (7 dager)',
    'dash.no_imp_todos': 'Ingen viktige gjøremål',
    'dash.todo_err': 'Kunne ikke fullføre gjøremål',
    'dash.move_today': 'I dag', 'dash.move_tomorrow': 'I morgen',
    'dash.moved': 'Flyttet', 'dash.move_err': 'Kunne ikke flytte gjøremål',
    'dash.untitled': '(uten tittel)', 'dash.allday': 'Heldags',
    'dash.open_sprint': 'Åpne Sprint', 'dash.open_gym': 'Åpne Gym',
    'dash.badge_styrke': 'Styrke', 'dash.badge_kondisjon': 'Kondisjon',
    'dash.badge_soccer': 'Fotball',
    'dash.focus_soccer_warmup': 'God oppvarming før fotball — aktiver kneet',
    'dash.focus_soccer_knee': 'Pass på retningsendringer og landinger for kneet',
    'dash.focus_soccer_log': 'Logg fotball som aktivitet etter økten',
    'dash.focus_knee_dayafter': 'Registrer knesmerte fra forrige økt',
    'dash.focus_careful_sprint': 'Vær forsiktig med høy toppfart i dag',
    'dash.focus_no_push': 'Ikke push gjennom smerte i dag',
    'dash.focus_pain_after': 'Smerte etter siste økt: {n}/10',
    'dash.focus_reduced_load': 'Vurder redusert belastning i dag',
    'dash.focus_sleep_sub': '{h} søvn sist natt',
    'dash.focus_under8': 'Du sov under 8 timer i natt',
    'dash.focus_under8_sub': '{h} registrert',
    'dash.focus_restitusjon': 'Prioriter restitusjon — stevne i morgen',
    'dash.focus_sleep_early': 'Sov tidlig i kveld',
    'dash.focus_heavy_tmrw': 'Tung økt i morgen — prioriter søvn',
    'dash.focus_rehab': 'Fullfør rehabiliteringsøvelser',
    'dash.focus_rehab_dayafter': 'Registrer smerte etter gårsdagens rehab-økt',
    'dash.focus_rehab_pain_warning': 'Høy smerte etter rehab — ta det forsiktig i dag',
    'dash.focus_rehab_overdue': 'Rehab ikke gjennomført de siste 3 dagene',
    'dash.focus_active_rest': 'Aktiv restitusjon anbefales',
    'dash.focus_warmup': 'Prioriter god oppvarming',
    'dash.focus_knee_log': 'Logg knesmerte etter økten',
    'dash.focus_sprint_warmup': 'Full sprintoppvarming før maksdrag',
    'dash.focus_sprint_log': 'Logg sprintdata etter økten',
    'dash.focus_intensity': 'Hold deg innen planlagt intensitet',
    'dash.cat_styrke': 'Styrke', 'dash.cat_sprint': 'Sprint',
    'dash.cat_rehab': 'Rehab', 'dash.cat_recovery': 'Recovery',
    'dash.cat_sovn': 'Søvn', 'dash.cat_warning': 'OBS',
    'dash.cat_kalender': 'Kalender',
    'dash.from_plan': 'Fra ukeplanen', 'dash.from_focus': 'Fra dagens fokus',
    'dash.add_todo_ph': 'Legg til viktig gjøremål…',
    'dash.cal_nothing_planned': 'Ingenting planlagt', 'dash.cal_not_connected': 'Kalender ikke tilkoblet',
    // v2 readiness / session card
    'dash.readiness_lbl': 'Readiness',
    'dash.sleep_score_lbl': 'Søvnscore',
    'dash.rec_vol_lbl': 'Volum', 'dash.rec_int_lbl': 'Intensitet',
    'dash.rec_high': 'Høy', 'dash.rec_mod': 'Moderat', 'dash.rec_low': 'Lav',
    'dash.rec_heavy': 'Tung', 'dash.rec_moderate': 'Moderat', 'dash.rec_light': 'Lett',
    'dash.risk_high': '⚠ Høy risiko', 'dash.risk_mod': '~ Moderat', 'dash.risk_low': '✓ Lav risiko',
    'dash.focus_area_sprint': 'Akselerasjon · Maksimal hastighet',
    'dash.focus_area_styrke': 'Muskelstyrke · Progressiv overload',
    'dash.focus_area_kondi': 'Aerob kapasitet · Mobilitet',
    'dash.focus_area_soccer': 'Retningsendring · Eksplosivitet',
    'dash.focus_area_rehab': 'Kne-rehab · Smertefri bevegelse',
    'dash.ai_avoid_sprint': 'Unngå sprint >95%',
    'dash.ai_avoid_sprint_sub': 'Smerte {n}/10 etter siste økt — hold under submaks',
    'dash.low_readiness': 'Lav readiness',
    'dash.low_readiness_sub': 'Vurder roligere økt — kroppen restituerer',
    'dash.high_readiness': 'Optimal form',
    'dash.high_readiness_sub': 'Grønt lys for planlagt intensitet',
    'dash.ai_default_tip': 'Full oppvarming gir best ytelse og lavest skaderisiko',
    'dash.rest_mobility': 'Mobilitet & sirkulasjon',
    'dash.rest_mobility_sub': '10–15 min lette øvelser for kne og hofte',
    'dash.rest_walk': 'Lett gåtur',
    'dash.rest_walk_sub': '20–30 min rolig gange — aktiv restitusjon',
    'dash.rest_sleep_goal': 'Søvnmål: 8–9 timer',
    'dash.rest_sleep_sub': 'Legg deg tidlig — neste økt krever full restitusjon',
    'dash.training_day': 'Treningsdag',
    // Week-strip chips
    'dash.chip_sprint': 'Sprint', 'dash.chip_soccer': 'Fotball', 'dash.chip_basket': 'Basket',
    'dash.chip_sirk': 'Sirk.', 'dash.chip_mobil': 'Mobil.', 'dash.chip_kondi': 'Kondi.',
    'dash.chip_styrke': 'Styrke', 'dash.chip_hvile': 'Hvile', 'dash.chip_rehab': 'Rehab',
    // Gym
    'gym.log_session': 'Lagre økt', 'gym.finish_save': 'Fullfør og lagre', 'gym.reset': 'Nullstill',
    'gym.sets': 'Sett', 'gym.reps': 'Reps', 'gym.weight': 'Vekt',
    'gym.rest': 'Pause', 'gym.timer': 'Timer',
    'gym.start': 'Start økt', 'gym.finish': 'Fullfør økt',
    'gym.session_saved': 'Økt lagret!', 'gym.session_restored': 'Økt gjenopprettet', 'gym.save_error': 'Feil ved lagring',
    'gym.day_after_title': 'Registrer smerte dagen etter',
    'gym.day_after_saved': 'Smerte etter rehab lagret',
    'gym.history': 'Økthistorikk', 'gym.full_log': 'Se full øktlogg →',
    'gym.no_history': 'Ingen loggede økter ennå',
    'gym.pain_missing': 'Smerte ikke ført',
    'gym.delete_confirm': 'Slett denne økten?',
    'gym.deleted': 'Økt slettet', 'gym.delete_error': 'Feil ved sletting',
    'gym.monday': 'Mandag', 'gym.wednesday': 'Onsdag', 'gym.friday': 'Fredag',
    // A6 — ukedagsnavn (0=søn..6=lør) for dynamiske dag-pills
    'wd.0': 'Søndag', 'wd.1': 'Mandag', 'wd.2': 'Tirsdag', 'wd.3': 'Onsdag',
    'wd.4': 'Torsdag', 'wd.5': 'Fredag', 'wd.6': 'Lørdag',
    // A6 — dag-typer (auto-oversatt etikett på en dag)
    'daytype.strength': 'Styrke', 'daytype.strength_capacity': 'Styrke Kapasitet',
    'daytype.strength_power': 'Styrke Power', 'daytype.power': 'Power',
    'daytype.mobility': 'Sirkulasjon & Mobilitet', 'daytype.conditioning': 'Kondisjon',
    'daytype.rest': 'Hvile', 'daytype.rehab': 'Rehab',
    'daytype.soccer': 'Fotball', 'daytype.basketball': 'Basketball', 'daytype.track': 'Friidrett',
    'daytype.sprint': 'Sprint', 'daytype.meet': 'Stevne',
    // A6 — dag-redigering UI
    'gym.add_day': '+ Økt', 'gym.new_day': 'Ny økt', 'gym.day_weekday': 'Ukedag',
    'gym.session_name_lbl': 'Navn (valgfritt)', 'gym.session_name_ph': 'La stå tomt for å bruke type',
    'gym.rename_prompt': 'Nytt navn på økt:', 'gym.dblclick_rename': 'Dobbeltklikk for å gi nytt navn', 'gym.rename_day': 'Gi nytt navn', 'gym.rename_label': 'Navn på økt',
    'gym.edit_sets': 'Rediger øvelser', 'gym.edit_pain': 'Rediger smerte', 'gym.edit_session': 'Rediger økt', 'gym.no_sets_logged': 'Ingen sett logget',
    'gym.day_type': 'Økttype', 'gym.day_type_none': 'Ingen',
    'gym.create_day': 'Opprett økt', 'gym.delete_day': 'Slett økt',
    'gym.delete_day_confirm': 'Slett denne økten og alle øvelsene på den?',
    'gym.day_exists': 'En økt med dette navnet finnes allerede.',
    'gym.day_created': 'Økt opprettet', 'gym.day_deleted': 'Økt slettet',
    'gym.copy_from': 'Kopier øvelser fra', 'gym.copy_empty': 'Tom økt (ingen øvelser)',
    'gym.day_copied': 'Økt opprettet med kopierte øvelser',
    'gym.add_section': '+ Seksjon', 'gym.section_name_ph': 'Navn på seksjon',
    'gym.section_added': 'Seksjon lagt til', 'gym.section_exists': 'Seksjonen finnes allerede',
    'gym.drag_section': 'Dra for å endre rekkefølge', 'gym.delete_section': 'Slett seksjon',
    'gym.confirm_delete_section': 'Slett seksjonen «{name}»?',
    'gym.confirm_delete_section_ex': 'Slett seksjonen «{name}» og {n} øvelse(r)?',
    'gym.section_deleted': 'Seksjon slettet',
    'gym.no_sections_yet': 'Ingen seksjoner ennå. Legg til en for å begynne.',
    'gym.ex_unit': 'øv', 'gym.sets_unit': 'sett', 'gym.add_exercise_btn': '+ Øvelse',
    'gym.finish_first': 'Fullfør den aktive økta først',
    'confirm.delete_exercise': 'Slett øvelse?',
    'confirm.delete_session': 'Slett denne økten?',
    'confirm.clear_day': 'Tøm planen for denne dagen?',
    'confirm.delete_activity': 'Slett denne aktiviteten?',
    'confirm.delete_runs': 'Slett alle løp fra {date}?',
    'gym.ready': 'Klar!',
    'gjoremal.add_ph': 'Legg til gjøremål…',
    'sprint.notes_ph': 'Løpsforhold, teknikk, annet…',
    'rpe.hint': 'Dra: 1 = veldig lett · 100 = maks',
    'rir.label': 'RIR (reps i reserve)',
    'rir.hint': '0 = failure · 3 = målet ditt · 5 = veldig lett',
    'gym.sets_done': '{done} av {total} sett fullført',
    'gym.select_day': 'Velg dag', 'gym.exercises': 'Øvelser',
    'gym.pick_and_start': 'Velg dag og trykk start når du er klar.',
    'gym.start_session': '▷ Start økt', 'gym.exercises_lc': 'øvelser', 'gym.exercises_cap': 'Øvelser',
    'gym.new_session': 'Ny økt',
    'gym.active_session': 'Aktiv økt', 'gym.no_session': 'Ingen økt',
    'gym.session_time': 'Økt-tid', 'gym.warmup': 'Oppvarming',
    'gym.rir_effort': 'Innsats (RIR)',
    // B1 — progressive overload-coach
    'po.title': 'Overload-coach', 'po.subtitle': 'Forslag til neste økt',
    'po.no_data': 'Logg noen økter, så foreslår jeg progresjon her.',
    'po.try': 'Prøv {w} {u}', 'po.try_reps': 'Prøv {r}',
    'po.aim': 'Sikt {lo}–{hi} reps · {rir} RIR',
    'po.level_up': '✓ Klarte {hi} m/{rir} RIR — øk vekt (~{w} {u})',
    'po.up_easy': '✓ {hi} reps lett ({rir} RIR) — øk vekt (~{w} {u})',
    'po.hold_grind': 'Traff {hi} men {rir} RIR — hold, bygg margin',
    'po.too_light': 'Lett ({rir} RIR) — press reps mot {hi}, så vekt',
    'po.too_heavy': 'Tungt ({rir} RIR) — under reps, hold vekt',
    'po.plateau_easy': 'Platå {n} økter men {rir} RIR — du holder igjen, press på',
    'po.hold_pain': 'Hold vekt — du logget smerte ({p}) sist',
    'po.need_rir': 'Logg RIR for å progressere — vet ikke innsatsen',
    'po.need_pain': 'Logg knesmerte for å progressere — vet ikke belastningen',
    'po.plateau': 'Platå {n} økter — deload ~10 %, bygg opp igjen',
    'po.progress': '↑ klar for mer', 'po.keep': 'Behold',
    'po.press_top': 'Hold — press mot toppen ({r})',
    'po.last': 'Sist: {w} {u} × {r}',
    'po.collapse': 'Skjul', 'po.expand': 'Vis coach',
    'po.even_out': 'Jevn ut: {n} × {w} {u}',
    'po.last_sets': 'Sist: {n} × {w} {u}',
    'po.last_mixed': 'Sist: {list} {u}',
    'gym.knee_panel': 'Knesmerte — Logg',
    'gym.select_exercise_first': 'Velg en øvelse først',
    'gym.exercise_added': '{name} lagt til',
    'gym.exercise_deleted': 'Øvelse slettet',
    'gym.fill_sets_reps': 'Fyll inn sett og reps',
    'gym.knee_not_saved': 'Knesmerte ikke lagret: {msg}',
    'gym.select_pain_score': 'Velg smertescore 0–10',
    'gym.weight_saved': '{name}: {w} {u} lagret',
    'gym.session': 'Økt', 'gym.session_done': 'Økt fullført!', 'gym.save_in_sidebar': 'Lagre i sidepanelet →',
    'gym.dismiss': 'Avvis', 'gym.today_session': 'Dagens økt', 'gym.knee_before_session': 'Knesmerte — Før økt',
    'gym.session_status': 'Øktstatus', 'gym.active_exercise': 'Aktiv øvelse', 'gym.no_active_exercise': 'Ingen aktiv øvelse',
    'gym.tap_exercise': 'Trykk på en øvelse for å begynne', 'gym.next_exercise': 'Neste øvelse',
    'gym.tools': 'Verktøy', 'gym.rest_timer': 'Hviletimer', 'gym.not_running': 'Ikke i drift',
    'gym.notes': 'Notater', 'gym.notes_ph': 'Kommentarer…', 'gym.register_pain': 'Registrer smerte',
    'gym.live_pain': 'Smerte',
    'gym.add_set_br': 'Legg til<br>sett', 'gym.jump_next_br': 'Hopp til<br>neste', 'gym.finish_br': 'Fullfør<br>økt',
    'gym.date': 'Dato', 'gym.after_session': 'Etter økt', 'gym.day_after': 'Dagen etter',
    'gym.exercise_ph': 'Øvelse', 'gym.sets_ph': 'Sett', 'gym.reps_ph': 'Reps',
    'gym.daily_rehab': 'Daglig Rehab', 'gym.no_warmup_data': 'Ingen oppvarmingsdata',
    'gym.loading_exercises': 'Laster øvelser…', 'gym.col_sets': 'Sett', 'gym.col_reps': 'Reps',
    'gym.col_weight': 'Vekt ({u})', 'gym.col_notes': 'Notater', 'gym.complete_exercise': 'Fullfør øvelse',
    'gym.all_done': 'Alle øvelser fullført ✓', 'gym.no_warmup_phase': 'Ingen oppvarmingsdata',
    'gym.rest_range': 'Velg mellom 5 sek og 10 min', 'gym.fill_day_after': 'Kan fylles inn dagen etter',
    'gym.notif_rest_done': 'Hviletimer ferdig', 'gym.notif_rest_body': 'Tid for neste sett!',
    'notif.enable': 'Slå på varsler', 'notif.enabled': 'Varsler på ✓',
    'notif.denied': 'Varsler er avslått — slå på i telefonens innstillinger',
    'notif.unsupported': 'Varsler støttes ikke her',
    'notif.ios_install': 'Legg appen til på Hjem-skjermen først (Del → Legg til på Hjem-skjerm)',
    'notif.no_vapid': 'Serveren mangler VAPID-nøkler', 'notif.error': 'Kunne ikke slå på varsler',
    'notif.title': 'Varsler', 'notif.overdue': 'Forfalte', 'notif.reminders': 'Påminnelser',
    'notif.rest_timers': 'Hviletimere', 'notif.today': 'I dag', 'notif.empty': 'Ingen aktive varsler',
    'notif.calendar': 'Kalender', 'notif.sleep': 'Søvn', 'notif.dismiss': 'Lukk',
    'notif.sleep_low_title': 'Lav søvnscore i natt', 'notif.sleep_low_sub': 'Score {score} — prioriter restitusjon i dag',
    'gm.reminder': 'Påminnelse', 'gm.add_reminder': 'Påminnelse', 'gm.reminder_set': 'Påminnelse satt',
    'gm.reminder_cleared': 'Påminnelse fjernet', 'gm.reminder_at': 'Påminnelse {time}',
    'gm.reminder_past': 'Velg et tidspunkt frem i tid', 'gm.clear_reminder': 'Fjern påminnelse',
    'gm.clear_date': 'Fjern forfallsdato',
    'gm.reminder_body': 'Husk!',
    'gym.sets_progress': '{done} / {total} sett',
    'gym.ring_done': 'ferdig',
    'gym.notes_zero': '0 notater',
    'gym.lines_one': '1 linje', 'gym.lines_many': '{n} linjer',
    'gym.min_one_set': 'Minst 1 sett kreves',
    'gym.remove_set': 'Fjern sett',
    'gym.hist_sets': '{ex} øv · {sets} sett',
    'gym.reset_unsaved_confirm': 'Økta er ikke lagret — starte ny uten å lagre?',
    'gym.offline_retry': 'Ingen nett — økta lagres automatisk når du er online igjen',
    'gym.rename_exercise': 'Gi øvelsen nytt navn',
    'gym.block_exercise': 'Blokker øvelse (permanent, pga skade)',
    'gym.unblock_exercise': 'Ta med øvelsen igjen',
    'gm.saved': 'Lagret',
    'offline_now': 'Du er offline — viser sist lagrede data',
    'online_again': 'Online igjen',
    'sw_updated': 'Ny versjon lastet — gjelder fra neste sidebytte',
    'tp.duration': 'Varighet (min)',
    'tp.min_played': 'Minutter i kamp/spill (valgfritt)', 'tp.min_played_short': '{n} min spilt',
    'tp.ql_btn': '⚡ Logg dagens økt', 'tp.ql_rest': 'I dag er hviledag — ingenting å logge',
    'tp.week_load': 'Ukeslast (sRPE)',
    'tp.week_load_hint': 'RPE/10 × aktivitetsvekt — sprint tungt, gåtur ~0',
    'tp.load_mult': 'Belastningsvekt (multiplikator)',
    'tp.load_mult_hint': 'Forhåndsutfylt med type-standard. Juster om intensiteten avviker.',
    'tp.preset_none': 'Velg preset…',
    'tp.preset_apply': 'Bruk',
    'tp.preset_save': 'Lagre som…',
    'tp.preset_delete': 'Slett',
    'tp.preset_pick': 'Velg en preset først',
    'tp.preset_name_prompt': 'Navn på preset (f.eks. «USA football»)',
    'tp.preset_saved': 'Preset lagret',
    'tp.preset_deleted': 'Preset slettet',
    'tp.preset_delete_confirm': 'Slette preset «{name}»?',
    'tp.preset_applied_hint': 'Fylt inn — trykk «Lagre plan» for å ta i bruk',
    // Sprint
    'sprint.personal_records': 'Personlige rekorder',
    'sprint.goals': 'Sprintmål', 'sprint.log': 'Logg økt',
    'sprint.add_run': '+ Legg til løp',
    'sprint.distance': 'Distanse', 'sprint.type': 'Type', 'sprint.time': 'Tid (sek)',
    'sprint.evaluation': 'Evaluering', 'sprint.rpe': 'RPE (1–100)',
    'sprint.log_btn': 'Logg økt', 'sprint.history': 'Smerte — siste 5 økter',
    'sprint.fill_fields': 'Fyll inn distanse og tid',
    'sprint.add_first': 'Legg til minst ett løp før du lagrer',
    'sprint.save_error': 'Feil ved lagring av økt: {msg}',
    'sprint.knee_error': 'Smerte ikke lagret: {msg}',
    'sprint.runs_saved': '{n} løp lagret!', 'sprint.new_pb': 'Ny PB! {pbs}',
    'sprint.invalid': 'Ugyldig verdi', 'sprint.rpe_range': 'RPE må være 1–100',
    'sprint.pain_range': 'Smerte må være 0–10',
    'sprint.updating': 'Oppdaterer alle {n} løp på denne datoen',
    'sprint.save_fail': 'Lagringsfeil', 'sprint.deleted': 'Økt slettet',
    'sprint.dismiss': 'Dra opp', 'sprint.dismissed': 'Økt arkivert',
    'sprint.training': 'Trening', 'sprint.competition': 'Stevne',
    'sprint.training_outdoor': 'Trening (ute)',
    'sprint.edit_knee': 'Rediger smerte — ',
    'sprint.knee_updated': 'Smerte oppdatert',
    'sprint.knee_save_error': 'Feil ved lagring: {msg}',
    'sprint.runs': 'Løp', 'sprint.goal': 'Mål',
    'sprint.runs_count': '{n} løp',
    'sprint.run_num': 'Løp {n}', 'sprint.delete_session': 'Slett økt',
    'sprint.no_sessions': 'Ingen loggede økter', 'sprint.no_data_yet': 'Ingen data ennå',
    'sprint.no_runs_yet': 'Ingen løp lagt til ennå',
    'sprint.goal_reached': '✓ Mål nådd!', 'sprint.from_goal': '{n}s fra mål',
    'sprint.reset_baseline': 'Nullstill baseline', 'sprint.baseline_reset': 'Baseline nullstilt til {time}s',
    'sprint.edit_goal': 'Endre mål', 'sprint.goal_saved': 'Mål oppdatert til {time}s',
    'sprint.goal_invalid': 'Ugyldig måltid', 'sprint.goal_col_missing': 'Mangler kolonne — kjør 028_sprint_goal_time.sql i Supabase',
    'sprint.dist_add': '+ Legg til distanse', 'sprint.dist_delete': 'Slett distanse',
    'sprint.dist_name_ph': 'Distanse (f.eks. 300m)', 'sprint.dist_goal_ph': 'Mål-tid (sek)', 'sprint.dist_start_ph': 'Baseline (sek, valgfritt)',
    'sprint.dist_none': 'Ingen mål satt ennå', 'sprint.dist_name_req': 'Skriv inn en distanse', 'sprint.dist_goal_req': 'Skriv inn en mål-tid',
    'sprint.dist_exists': '{d} finnes allerede', 'sprint.dist_added': '{d} lagt til', 'sprint.dist_deleted': '{d} slettet',
    'sprint.dist_del_confirm': 'Slette {d}? Mål og PB for denne distansen forsvinner.',
    'sprint.lvl_label': 'Akselerasjon', 'sprint.lvl_low': 'Lav', 'sprint.lvl_mid': 'Middels', 'sprint.lvl_high': 'Høy',
    'tp.soccer_lvl': 'Intensitet',
    // Søvn
    'sovn.title': 'Søvn & Restitusjon', 'sovn.score_lbl': 'Søvnscore', 'sovn.rhr': 'Hvilepuls',
    'sovn.recovery': 'God restitusjon', 'sovn.solid': 'Solid søvnnatt',
    'sovn.moderate': 'Middels restitusjon', 'sovn.hard': 'Krevende natt',
    'sovn.no_data': 'Ingen søvndata', 'sovn.sleeping': 'Sover videre?',
    'sovn.sync_auto': 'Synces automatisk',
    'sovn.sprint_ready': 'Bra grunnlag for sprint i dag',
    'sovn.train_ready': 'Klar for trening',
    'sovn.light_session': 'Lett økt kan være lurt',
    'sovn.rest': 'Prioriter hvile i dag',
    'sovn.registered': 'Registrert {d}', 'sovn.waiting': 'Venter på data',
    'sovn.architecture': 'Søvnarkitektur', 'sovn.readiness': 'Treningsberedskap',
    'sovn.no_phase': 'Ingen fasedata for i dag',
    'sovn.deep': 'Dyp søvn', 'sovn.rem': 'REM', 'sovn.light': 'Lett søvn',
    'sovn.awake': 'Våken', 'sovn.total': 'Total søvn',
    'sovn.awake_exceptional': 'Eksepsjonelt', 'sovn.awake_good': 'Bra',
    'sovn.awake_acceptable': 'Akseptabelt', 'sovn.awake_restless': 'Litt urolig',
    'sovn.awake_fragmented': 'Fragmentert',
    'sovn.awake_advice_exceptional': 'Under 5 min er eksepsjonelt. Nesten ingen avbrudd – søvnen var sammenhengende og effektiv.',
    'sovn.awake_advice_good': '{v} min er under referansegrensen på 20 min for unge friske voksne. Solid søvnkontinuitet.',
    'sovn.awake_advice_acceptable': '{v} min er akseptabelt for en idrettsutøver med høy treningsbelastning (6 økter/uke) – studier viser 30–48 min WASO hos unge sprint/styrke-utøvere. Sikt mot under 20 min.',
    'sovn.awake_advice_restless': '{v} min våken fragmenterer søvnen. Vanlige årsaker hos deg: sen skjermbruk, skolepress eller sosialt rett før leggetid. Koble av 30–45 min før du legger deg.',
    'sovn.awake_advice_fragmented': '{v} min våken er for mye. Sannsynlig årsak: stress (skole/sosialt) eller sen skjerm holder nervesystemet aktivert. Fragmentert søvn saboterer restitusjon selv om totaltiden ser bra ut – HRV og RHR vil lide.',
    'sovn.awake_ctx_none': 'nesten ingen avbrudd',
    'sovn.awake_ctx_good': '{v} min våken (bra)',
    'sovn.awake_ctx_acceptable': '{v} min våken (akseptabelt)',
    'sovn.awake_ctx_restless': '{v} min våken – litt urolig',
    'sovn.awake_ctx_fragmented': '{v} min våken – fragmentert',
    'sovn.copy_sync': 'Kopier sync-kommando', 'sovn.copied': '✓ Kopiert!',
    'sovn.arch_excellent': 'Fremragende søvnkvalitet',
    'sovn.arch_deep': 'Dyp søvn solid i natt',
    'sovn.arch_low_deep': 'Lite dyp søvn i natt',
    'sovn.arch_low_rem': 'REM under normalen',
    'sovn.arch_good_rem': 'Bra REM-søvn i natt',
    'sovn.arch_normal': 'Søvnkvalitet normal',
    'sovn.ready_high': 'Klar for høy intensitet',
    'sovn.ready_good': 'Bra grunnlag for trening',
    'sovn.ready_moderate': 'Moderat restitusjon',
    'sovn.ready_rest': 'Vurder hvile i dag',
    'sovn.ready_high_desc': 'Søvn, HRV og hvilepuls er over din normal',
    'sovn.bb_label': 'Body battery',
    'sovn.bb_curve': 'Body battery gjennom dagen',
    'sovn.bb_curve_empty': 'Ingen body battery-data for denne dagen',
    'sovn.bb_peak': 'Topp',
    'sovn.bb_low': 'Bunn',
    'sovn.bb_axis': 'nivå',
    'sovn.ready_good_desc': 'God restitusjon over natten',
    'sovn.ready_moderate_desc': 'Vurder å holde intensiteten nede',
    'sovn.ready_rest_desc': 'Søvnkvalitet under normalen',
    'sovn.no_today': 'Ingen data for i dag',
    'sovn.hrv_optimal': 'Optimal', 'sovn.hrv_good': 'Bra',
    'sovn.hrv_low': 'Lav', 'sovn.hrv_critical': 'Kritisk', 'sovn.hrv_alarm': 'Alarm',
    'sovn.rhr_peak': 'Toppform', 'sovn.rhr_excellent': 'Excellent',
    'sovn.rhr_normal': 'Normal', 'sovn.rhr_elevated': 'Forhøyet',
    'sovn.rhr_high': 'Høy', 'sovn.rhr_alarm': 'Alarm',
    'sovn.sleep_optimal': 'Optimal', 'sovn.sleep_good': 'Bra',
    'sovn.sleep_little': 'For lite', 'sovn.sleep_critical': 'Kritisk',
    'sovn.score_excellent': 'Fremragende', 'sovn.score_good': 'God',
    'sovn.score_ok': 'Akseptabel', 'sovn.score_bad': 'Dårlig',
    'sovn.1day': '1 dag med data', 'sovn.no_history': 'Ingen historikk ennå',
    'sovn.auto_fill': 'Grafen fylles automatisk hver morgen kl 07:45',
    'sovn.missing': 'Mangler data',
    'sovn.goal_8h': '8t mål', 'sovn.hours': 'timer', 'sovn.score_100': '/100',
    'sovn.leg_deep': 'Dyp søvn', 'sovn.leg_rem': 'REM', 'sovn.leg_light': 'Lett søvn',
    'sovn.leg_hrv': 'HRV (ms)', 'sovn.leg_rhr': 'Hvilepuls (bpm)',
    'sovn.leg_score': 'Søvnscore (0–100)',
    'sovn.hrv_advice_optimal': 'Nervesystemet er restituert. Grønt lys for sprint og høy intensitet i dag.',
    'sovn.hrv_advice_good': 'God restitusjon. Moderat til høy intensitet fungerer fint.',
    'sovn.hrv_advice_low': 'HRV under normalen. Hold intensiteten moderat — unngå maksøkter og rep til failure i dag.',
    'sovn.hrv_advice_critical': 'HRV svært lav. Kroppen er under stress. Lett aktivitet eller hviledag — ellers risikerer du overtrening.',
    'sovn.hrv_advice_alarm': '⚠️ Ekstremt lav HRV. Hvil i dag. Sjekk om du er syk, dehydrert eller sover for lite.',
    'sovn.rhr_advice_peak': 'Svært lav hvilepuls — tegn på god kondisjon og full restitusjon. Grønt lys for hard trening.',
    'sovn.rhr_advice_excellent': 'Optimal hvilepuls for sprinter. Kroppen er godt restituert.',
    'sovn.rhr_advice_normal': 'Normal hvilepuls. Ingenting å bekymre seg for.',
    'sovn.rhr_advice_elevated': 'Lett forhøyet hvilepuls. Kan indikere stress, dårlig søvn eller tidlig sykdom. Vurder roligere økt.',
    'sovn.rhr_advice_high': 'Forhøyet hvilepuls. Kroppen er under press — hvil eller lett økt i dag.',
    'sovn.rhr_advice_alarm': '⚠️ Høy hvilepuls. Ikke tren intensivt. Kan indikere sykdom eller alvorlig underrestitusjon.',
    'sovn.sleep_advice_optimal': 'Optimal søvnlengde. Kroppen har fått det den trenger for full restitusjon.',
    'sovn.sleep_advice_good': 'Tilstrekkelig søvn, men litt under idealet. Med 6 økter/uke restituerer du best på 8–9t — sikt mot å legge deg litt tidligere.',
    'sovn.sleep_advice_little': 'Under anbefalt søvnmengde. Legg deg 30–60 min tidligere i kveld. Unngå hard trening sent på dagen.',
    'sovn.sleep_advice_critical': '⚠️ Kritisk lite søvn. Ingen høyintensitetsøkt i dag. Prioriter søvn over alt annet i kveld.',
    'sovn.score_advice_excellent': 'Fremragende søvnkvalitet. Kroppen har restituert optimalt.',
    'sovn.score_advice_good': 'God søvnkvalitet. Du er godt restituert.',
    'sovn.score_advice_ok': 'Søvnkvaliteten kan forbedres. Unngå skjerm og koffein siste 2t før legging.',
    'sovn.score_advice_bad': 'Dårlig søvnkvalitet. Prioriter søvnhygiene: fast leggetid, mørkt rom, ingen koffein etter kl 14.',
    'sovn.you_slept': 'Du sov ',
    'sovn.score_sub': 'Søvnscore',
    'sovn.copy_prompt': 'Kopier kommandoen under:',
    'sovn.prev_day': 'Forrige dag', 'sovn.next_day': 'Neste dag', 'sovn.fetched': 'Søvn hentet ✓',
    'sovn.fetch_now': 'Hent søvn nå', 'sovn.fetching': 'Henter…', 'sovn.no_new': 'Ingen ny søvndata', 'sovn.fetch_err': 'Henting feilet',
    // Gjøremål
    'gm.title': 'Gjøremål', 'gm.sub': 'Oppgaver & mål',
    'gm.active': 'Aktive', 'gm.important': 'Viktige',
    'gm.filter_all': 'Alle', 'gm.filter_active': 'Aktive',
    'gm.filter_important': 'Viktige', 'gm.filter_done': 'Fullførte',
    'gm.add_placeholder': 'Legg til gjøremål…', 'gm.new_list': 'Ny liste…',
    'gm.add_btn': 'Legg til', 'gm.important_btn': 'Viktig',
    'gm.chip_due': '+ dato', 'gm.chip_reminder': '⏰ Påminnelse', 'gm.chip_today': 'I dag', 'gm.chip_tomorrow': 'I morgen',
    'gm.no_todos': 'Ingen gjøremål her', 'gm.no_todos_empty': 'Ingen gjøremål',
    'gm.loading': 'Laster…', 'gm.lists': 'Lister',
    'gm.delete_list': 'Slett listen "{n}" og alle dens gjøremål?',
    'gm.list_deleted': '"{n}" slettet',
    'gm.added': 'Lagt til', 'gm.saved': 'Lagret', 'gm.deleted': 'Slettet',
    'gm.save_error': 'Feil ved lagring',
    'gm.active_count': '{n} aktive', 'gm.overdue_prefix': '⚠ ',
    'gm.add_date': '+ dato', 'gm.click_edit': 'Klikk for å redigere',
    'gm.change_date': 'Endre forfallsdato',
    'gm.detail': 'Detaljer', 'gm.detail_title_label': 'Tittel', 'gm.detail_list_label': 'Liste',
    'gm.detail_due_label': 'Forfallsdato', 'gm.detail_remind_label': 'Påminnelse',
    'gm.mark_done': 'Marker fullført', 'gm.mark_active': 'Marker som aktiv',
    'gm.detail_none': 'Ingen', 'gm.detail_important_on': 'Viktig', 'gm.detail_important_off': 'Marker som viktig',
    'gm.quick_today_title': 'Sett forfall til i dag (klikk igjen for å fjerne)',
    'gm.quick_tomorrow_title': 'Sett forfall til i morgen (klikk igjen for å fjerne)',
    'gm.date_removed': 'Dato fjernet',
    'gm.completed': 'Fullført ✓', 'gm.undo': 'Angre',
    'gm.stats_active': 'Aktive', 'gm.stats_important': 'Viktige',
    'gm.stats_done': 'Fullført i dag', 'gm.stats_overdue': 'Forfalt',
    'gm.sub_tasks': 'Gjøremål for i dag og fremover',
    'gm.update_error': 'Kunne ikke oppdatere', 'gm.delete_error': 'Kunne ikke slette',
    'gm.rename': 'Gi nytt navn', 'gm.rename_prompt': 'Nytt navn på listen:', 'gm.new_list_prompt': 'Navn på ny liste:', 'gm.list_exists': 'Listen finnes allerede', 'gm.list_renamed': 'Liste omdøpt',
    'gm.drag_list': 'Dra for å sortere',
    'gm.edit_done': 'Ferdig', 'gm.edit_lists_hint': 'Dra for å sortere · ✎ navn · ✕ slett',
    'gm.date_placeholder_no': 'dd.mm.yyyy', 'gm.date_placeholder_en': 'mm.dd.yyyy',
    // Kalender
    'kal.title': 'Kalender', 'kal.today': 'I dag', 'kal.new_event': 'Ny hendelse', 'kal.add_event': 'Hendelse',
    'kal.add_placeholder': 'Tittel, dato, klokkeslett…',
    'kal.all_day': 'Heldagsarrangement', 'kal.no_events': 'Ingen hendelser',
    'kal.no_today': 'Ingen hendelser i dag', 'kal.no_upcoming': 'Ingen kommende',
    'kal.added': 'Hendelse lagt til', 'kal.deleted': 'Hendelse slettet',
    'kal.updated': 'Hendelse oppdatert', 'kal.save_error': 'Feil ved lagring',
    'kal.del_error': 'Feil ved sletting', 'kal.loading': 'Laster…',
    'kal.table_missing': 'Mangler database-tabell. Kjør supabase/migrations/006_calendar_events.sql i Supabase SQL Editor.',
    'kal.error_prefix': 'Feil: ',
    'kal.del_confirm': 'Slett denne hendelsen?',
    'kal.whole_day': 'Hele dagen', 'kal.week_view': 'Uke', 'kal.agenda_view': 'Agenda', 'kal.month_view': 'Måned',
    'kal.prev': '‹', 'kal.next': '›',
    'kal.quick_add_ph': 'Sprint torsdag 17:00…', 'kal.events': 'Hendelser',
    'kal.next_event': 'Neste hendelse', 'kal.no_events_use_quick': '<div class="ae-title">Ingen planer denne dagen</div><div class="ae-sub">Bruk «Rask legg til» for å fylle inn</div>',
    'kal.no_time': 'Uten tid', 'kal.gcal_readonly': 'Google Calendar · skrivebeskyttet',
    'kal.gcal_recurring': 'Gjentakende', 'kal.scope_this': 'Denne dagen', 'kal.scope_following': 'Denne og fremover', 'kal.scope_series': 'Hele serien',
    'kal.gcal_del_confirm': 'Slette denne Google-hendelsen?', 'kal.gcal_del_following_confirm': 'Slette denne og alle fremtidige forekomster?', 'kal.gcal_del_series_confirm': 'Slette HELE serien?',
    'kal.gcal_err_scope': 'Mangler skrivetilgang til Google. Tokenet må fornyes med kalender-scope.',
    'kal.title_lbl': 'Tittel', 'kal.start': 'Start', 'kal.end': 'Slutt',
    'kal.category': 'Kategori', 'kal.notes': 'Notater',
    'kal.cat_styrke': 'Styrke', 'kal.cat_stevne': 'Stevne', 'kal.cat_kirke': 'Kirke',
    'kal.cat_fridag': 'Fridag', 'kal.cat_other': 'Annet',
    'kal.dest_gcal': 'Google Cal', 'kal.dest_local': 'Lokal',
    'kal.unauthorized': 'Ikke innlogget — logg inn på nytt',
    // Treningsplan
    'tp.title': 'Treningsoversikt', 'tp.history': 'Økthistorikk',
    'tp.no_sessions': 'Ingen loggede økter ennå',
    'tp.no_sessions_full': '<div class="empty" style="grid-column:1/-1;padding:20px 0">Ingen loggede økter ennå</div>',
    'tp.edit_pain': 'Rediger smerteverdier',
    'tp.notes': 'Notater', 'tp.trend_up': '↓ Knesmerte forbedres',
    'tp.trend_down': '↑ Knesmerte øker', 'tp.trend_stable': '— Knesmerte stabil',
    'tp.gym_badge': '✓ Gym', 'tp.sprint_badge': '⚡ Sprint',
    'tp.runs': 'Løp ({n})', 'tp.completed': '✓ Fullført',
    'tp.loading': 'Laster øktlogg…', 'tp.save_error': 'Feil ved lagring',
    'tp.saved': 'Lagret', 'tp.day_cleared': 'Dag tømt',
    'tp.select_activity': 'Velg aktivitetstype', 'tp.select_date': 'Velg dato',
    'tp.activity_saved': 'Aktivitet lagret', 'tp.delete_error': 'Feil ved sletting',
    'tp.activity_deleted': 'Aktivitet slettet', 'tp.save_plan': 'Lagre plan',
    'tp.plan_saved': 'Plan lagret', 'tp.plan_load_error': 'Kunne ikke laste plan',
    'tp.add_activity': 'Aktivitet', 'tp.loading_log': 'Laster øktlogg…',
    'tp.hero_loading': 'I dag — laster…',
    'tp.today': 'I dag', 'tp.week': 'Uke', 'tp.next': 'Neste',
    'tp.rest': 'Hviledag', 'tp.free': 'Fri',
    'tp.no_session_planned': 'Ingen planlagt økt',
    'tp.session_logged': '✓ Logget', 'tp.edit_session': 'Rediger økt',
    'tp.act_easy': 'Rolig dag', 'tp.act_replaced': 'Erstattet planlagt økt (valgfritt)',
    'tp.kpi_sessions': 'Treninger<br>denne uke', 'tp.kpi_left': 'Planlagte<br>igjen',
    'tp.prev_week': '← Forrige uke', 'tp.next_week': 'Neste uke →', 'tp.week_lbl': 'Uke —',
    'tp.select_day': 'Velg en dag', 'tp.session_activity': 'Økt / Aktivitet',
    'tp.plan_placeholder': 'Legg inn økt…', 'tp.notes_placeholder': 'Mål, teknikk, kommentarer…',
    'tp.save': 'Lagre', 'tp.clear_day': 'Tøm dag', 'tp.this_week': 'Denne uken',
    'tp.custom': 'Egendefinert…', 'tp.multi_assign': 'Sett samme økt på flere dager',
    'tp.group_gym': 'Styrkeøkter', 'tp.group_activity': 'Aktiviteter', 'tp.group_sprint': 'Sprint',
    'tp.apply': 'Bruk', 'tp.pick_days': 'Velg minst én dag', 'tp.multi_days_btn': 'Bruk på flere dager…',
    'tp.stat_done': 'Fullførte', 'tp.stat_planned': 'Planlagte',
    'tp.stat_consistency': 'Konsistens', 'tp.stat_rest': 'Hviledager',
    'tp.week_load': 'Ukens belastning', 'tp.edit_plan': '✎ Rediger ukeplan',
    // B3 — kne-dashboard
    'tp.session_fallback': 'Økt',
    'tp.inj_btn': '🩹 Plager', 'tp.inj_title': 'Plager & skader',
    'tp.inj_add': '+ Ny plage', 'tp.inj_part': 'Kroppsdel', 'tp.inj_side': 'Side',
    'tp.inj_status': 'Status', 'tp.inj_severity': 'Alvorlighet', 'tp.inj_start': 'Startet',
    'tp.inj_note': 'Notat', 'tp.inj_note_ph': 'Hva dreier det seg om? Hva provoserer, hva hjelper…',
    'tp.inj_save': 'Lagre plage', 'tp.inj_saved': 'Plage lagret', 'tp.inj_deleted': 'Plage slettet',
    'tp.inj_empty': 'Ingen plager ført inn', 'tp.inj_active': 'Aktive', 'tp.inj_archived': 'Arkivert',
    'tp.inj_need_part': 'Velg kroppsdel',
    'side.left': 'Venstre', 'side.right': 'Høyre', 'side.both': 'Begge', 'side.none': '–',
    'status.active': 'Aktiv', 'status.improving': 'Bedring', 'status.archived': 'Arkivert',
    'sev.mild': 'Mild', 'sev.moderate': 'Moderat', 'sev.severe': 'Alvorlig',
    'body.knee': 'Kne', 'body.hamstring': 'Hamstring', 'body.glute': 'Glute',
    'body.hipflexor': 'Hoftebøyer', 'body.hip': 'Hofte', 'body.shoulder': 'Skulder',
    'body.back': 'Rygg', 'body.neck': 'Nakke', 'body.ankle': 'Ankel', 'body.calf': 'Legg',
    'body.achilles': 'Akilles', 'body.foot': 'Fot', 'body.other': 'Annet',
    'tp.physio_btn': '🩺 Fysio-notat', 'tp.physio_title': 'Notat fra fysio/naprapat',
    'tp.physio_therapist': 'Terapeut', 'tp.physio_therapist_ph': 'F.eks. Andreas Havre',
    'tp.physio_note': 'Notat', 'tp.physio_note_ph': 'Hva sa terapeuten? Råd, øvelser, vurdering…',
    'tp.physio_save': 'Lagre notat', 'tp.physio_saved': 'Fysio-notat lagret',
    'tp.physio_recent': 'Siste notater', 'tp.physio_empty': 'Ingen notater ennå',
    'tp.physio_need_note': 'Skriv et notat først',
    'tp.physio_updated': 'Fysio-notat oppdatert', 'tp.physio_deleted': 'Fysio-notat slettet',
    'tp.physio_del_confirm': 'Slette dette notatet?',
    'tp.copy_one': 'Kopier', 'tp.copy_all': 'Kopier alle', 'tp.copied': 'Kopiert',
    'tp.copy_fail': 'Kunne ikke kopiere', 'tp.show_more': 'Vis mer', 'tp.show_less': 'Vis mindre',
    'tp.overload_config': '⚙ Overload-coach', 'tp.oc_title': 'Overload-coach-konfig',
    'tp.oc_enabled': 'Aktiv', 'tp.oc_enabled_tip': 'Aktiv = coachen følger med på denne øvelsen og foreslår vektøkning',
    'tp.oc_reps_min': 'Rep-min', 'tp.oc_reps_max': 'Rep-max',
    'tp.oc_step': 'Vektsteg (kg)', 'tp.oc_pain': 'Smertegrense (0–10)',
    'tp.oc_pain_tip': 'Smertegrense: hvis knesmerte ≥ denne verdien foreslår coachen IKKE økt vekt',
    'tp.oc_no_ex': 'Ingen øvelser funnet', 'tp.oc_saved': 'Overload-konfig lagret',
    'tp.trends': 'Trender', 'tp.tr_knee': 'Knesmerte', 'tp.tr_sleep': 'Søvn',
    'tp.tr_load': 'Belastning', 'tp.tr_2w': 'Siste 2 uker',
    'tp.tr_up': 'opp', 'tp.tr_down': 'ned', 'tp.tr_flat': 'stabil', 'tp.tr_nodata': 'mangler data',
    'tp.knee_dash': 'Kne & rehab', 'tp.inj_dash': 'Skader & rehab', 'tp.knee_trend': 'Smertetrend (14 d)',
    'tp.days_pain_free': 'Dager siden smerte', 'tp.rehab_streak': 'Rehab-streak',
    'tp.streak_days': '{n} dager', 'tp.streak_day': '{n} dag',
    'tp.knee_no_data': 'Ingen knedata ennå', 'tp.inj_no_data': 'Ingen skadedata ennå', 'tp.pain_free_now': 'Smertefri nå',
    'tp.days_unit': 'd', 'tp.last_pain': 'Siste smerte: {d}',
    'tp.log_activity': 'Logg aktivitet', 'tp.date': 'Dato', 'tp.activity': 'Aktivitet',
    'tp.describe_activity': 'Beskriv aktivitet', 'tp.knee': 'Knesmerte',
    'tp.knee_before': 'Før', 'tp.knee_during': 'Under', 'tp.knee_after': 'Etter', 'tp.knee_dayafter': 'D. etter',
    'tp.save_activity': 'Lagre aktivitet', 'tp.act_notes_ph': 'Kommentarer, inntrykk…',
    'tp.act_custom_ph': 'F.eks. Volleyball', 'tp.act_replaced_ph': 'F.eks. Sprint — tok det rolig pga hamstring',
    'tp.act_soccer': 'Fotball', 'tp.act_swim': 'Svømming', 'tp.act_cycle': 'Sykling',
    'tp.act_basketball': 'Basketball', 'tp.act_padel': 'Padel', 'tp.act_amfootball': 'Amerikansk fotball',
    'tp.act_walk': 'Turgåing', 'tp.act_frisbee': 'Frisbeegolf', 'tp.act_swim_rec': 'Bading',
    'tp.act_other': 'Annet', 'tp.edit_weekly_plan': 'Rediger ukeplan',
    'tp.rest_rehab': 'Hvile & rehab', 'tp.rest': 'Hvile', 'tp.delete': 'Slett',
    'tp.wp_placeholder': 'F.eks. Sprint, Soccer, Hvile…',
    // Profil
    'tp.profile_btn': '👤 Profil',
    'tp.profile_title': 'Profil & innstillinger',
    'tp.prof_personal': 'Personlig info',
    'tp.prof_name': 'Fullt navn', 'tp.prof_name_ph': 'F.eks. Filip Lund',
    'tp.prof_birth': 'Fødselsdato',
    'tp.prof_leg': 'Dominant ben',
    'tp.prof_leg_left': 'Venstre', 'tp.prof_leg_right': 'Høyre',
    'tp.prof_phase': 'Treningsfase',
    'tp.prof_phase_pre': 'Forsesong', 'tp.prof_phase_comp': 'Konkurransesong',
    'tp.prof_phase_off': 'Off-sesong', 'tp.prof_phase_trans': 'Overgang',
    'tp.prof_height': 'Høyde (cm)',
    'tp.prof_save': 'Lagre profil', 'tp.prof_saved': 'Profil lagret',
    'tp.prof_weight_section': 'Vekt',
    'tp.prof_weight': 'Vekt (kg)', 'tp.prof_weight_date': 'Dato',
    'tp.prof_add_weight': 'Logg', 'tp.prof_weight_hist': 'Historikk',
    'tp.prof_no_weight': 'Ingen målinger ennå',
    'tp.prof_weight_saved': 'Vekt lagret', 'tp.prof_weight_del': 'Slett',
    'tp.prof_coaches': 'Trener / Coach',
    'tp.prof_coach_name': 'Navn', 'tp.prof_coach_role': 'Rolle / Type',
    'tp.prof_coach_role_ph': 'F.eks. Friidrett, Fotball, Styrke…',
    'tp.prof_add_coach': '+ Legg til trener',
    'tp.prof_no_coaches': 'Ingen trenere registrert',
    'tp.prof_coach_saved': 'Trener lagret', 'tp.prof_coach_deleted': 'Trener slettet',
    'tp.prof_role_head': 'Hovedtrener', 'tp.prof_role_asst': 'Assistent',
    'tp.prof_role_track': 'Friidrett', 'tp.prof_role_soccer': 'Fotball',
    'tp.prof_role_strength': 'Styrke', 'tp.prof_role_physio': 'Fysioterapeut',
    'tp.prof_role_other': 'Annet',
    // Egendefinerte aktiviteter
    'tp.manage_acts_btn': '🏃 Administrer aktiviteter',
    'tp.manage_acts_title': 'Aktiviteter',
    'tp.manage_acts_empty': 'Ingen aktiviteter',
    'tp.act_builtin_label': 'Innebygd',
    'tp.act_rename': 'Gi nytt navn',
    'tp.act_rename_ph': 'Nytt navn...',
    'tp.act_rename_save': 'Lagre',
    'tp.act_renamed': 'Aktivitet omdøpt – alle oppføringer oppdatert',
    'tp.act_rename_error': 'Feil ved omdøping',
    'tp.act_delete_builtin': 'Innebygde aktiviteter kan ikke slettes',
    'tp.act_name': 'Navn', 'tp.act_name_ph': 'F.eks. Tennis',
    'tp.act_load_mult': 'Belastningsvekt',
    'tp.act_add': '+ Legg til aktivitet',
    'tp.act_saved': 'Aktivitet lagret', 'tp.act_deleted': 'Aktivitet slettet',
    'tp.act_need_name': 'Skriv inn et navn',
    'tp.act_name_exists': 'En aktivitet med dette navnet finnes allerede',
    'tp.group_custom': 'Mine aktiviteter',
    // AI
    'ai.title': 'AI Overseer',
    'ai.subtitle': 'Personlig assistent · {model} · Søvn · Sprint · Rehab',
    'ai.sub_pre': 'Personlig assistent', 'ai.sub_post': 'Søvn · Sprint · Rehab',
    'ai.clear': 'Tøm samtale', 'ai.cleared': 'Samtale tømt',
    'ai.copy_report': 'Kopier AI-helserapport', 'ai.report_building': 'Bygger rapport…',
    'ai.report_copied': 'AI-helserapport kopiert til utklippstavlen', 'ai.report_copy_fail': 'Kunne ikke kopiere — prøv igjen',
    // Diagnose-melding (kort skadestatus til trener/fysio, deterministisk)
    'ai.copy_diag': 'Kopier diagnose', 'ai.diag_copied': 'Diagnose kopiert til utklippstavlen',
    'ai.copy_sleep': 'Kopier søvnanalyse', 'ai.sleep_copied': 'Søvnanalyse kopiert til utklippstavlen',
    'ai.copy_gym': 'Kopier øvelser', 'ai.copy_gym_title': 'Velg dager å kopiere',
    'ai.copy_gym_btn': 'Kopier valgte', 'ai.copy_gym_copied': 'Øvelser kopiert til utklippstavlen',
    'ai.copy_gym_none': 'Velg minst én dag', 'ai.copy_gym_empty': 'Ingen øvelser funnet for valgte dager',
    'diag.header': 'Skadestatus', 'diag.none': 'Ingen aktive plager.',
    'diag.last7': 'Siste 7 dager: {n} økter, snitt RPE {rpe}/100.',
    'diag.pain_line': 'Smerte 7d (maks før/under/etter/d.etter): {b}/{d}/{a}/{da} av 10.',
    'diag.pain_none': 'Ingen smertelogg siste 7 dager.',
    'inj.since': 'siden',
    'inj.side_left': 'venstre', 'inj.side_right': 'høyre', 'inj.side_both': 'begge',
    'inj.sev_mild': 'mild', 'inj.sev_moderate': 'moderat', 'inj.sev_severe': 'alvorlig',
    'inj.st_active': 'aktiv', 'inj.st_improving': 'i bedring',
    'gym.cardio_edit': 'Endre maskin/tid', 'gym.cardio_time_ph': 'f.eks. 5–8 min', 'gym.add_cardio': '+ Legg til kondisjon',
    'cardio.bike': 'Sykkel', 'cardio.treadmill': 'Tredemølle', 'cardio.elliptical': 'Ellipse',
    'cardio.rower': 'Romaskin', 'cardio.skierg': 'SkiErg', 'cardio.stairmaster': 'Stairmaster',
    'cardio.walk': 'Gange', 'cardio.jogging': 'Jogging',
    'gym.rename_section': 'Endre seksjonsnavn',
    // Ukesrapporter (søn–lør, auto-generert lørdag morgen, lagret i Supabase)
    'ws.panel_title': 'Ukesrapporter', 'ws.regenerate': '↻ Lag på nytt',
    'ws.generating': 'Lager…', 'ws.week_ending': 'Uke t.o.m. {date}',
    'ws.current': 'DENNE UKA', 'ws.none': 'Ingen rapporter ennå — den første lages automatisk lørdag morgen.',
    'ws.close': 'Lukk', 'ws.gen_failed': 'Klarte ikke lage rapporten', 'ws.saved': 'Ukesrapport lagret',
    'ws.new_badge': 'NY',
    'ai.empty_title': 'Klar til analyse',
    'ai.empty_sub': 'Spør om trening, knesmerte, søvn eller form.\nHenter data automatisk fra alle logger.',
    'ai.placeholder': 'Skriv en melding…',
    'ai.hint': 'Enter for å sende · Shift+Enter for ny linje',
    'ai.daily_soft_cap': 'Du har sendt {n} meldinger i dag — bare en vennlig påminnelse om API-budsjettet.',
    'ai.you': 'Deg', 'ai.ai_label': 'AI',
    'ai.quick1': 'Klar for i dag?', 'ai.quick2': 'Passe på i dag?',
    'ai.quick3': '2-ukers progresjon?', 'ai.quick4': 'Verste risiko nå?', 'ai.quick5': 'Hva mangler jeg?',
    'ai.quick1_prompt': 'Er jeg klar for økten som er planlagt i dag basert på søvn, HRV og kne?',
    'ai.quick2_prompt': 'Hva bør jeg passe på eller unngå i dagens økt basert på dataene mine?',
    'ai.quick3_prompt': 'Er søvn, kne og form bedre eller verre enn for 14 dager siden?',
    'ai.quick4_prompt': 'Hva er den største risikoen for meg akkurat nå — kne, overbelastning, underbelastning eller noe annet?',
    'ai.quick5_prompt': 'Hva trener jeg for lite av akkurat nå — styrke, rolig volum, sprint, mobilitet eller restitusjon?',
    'ai.err_timeout': 'Forespørselen tok for lang tid (30s) — prøv igjen',
    'ai.err_network': 'Nettverksfeil — sjekk tilkobling og prøv igjen',
    'ai.err_generic': 'Feil {status} — prøv igjen', 'ai.model': 'Sonnet 4.6',
    // Modal — felles
    'ai.modal_copy_btn': 'Kopier til utklippstavle',
    // Modal — AI-helserapport
    'ai.modal_report_title': 'AI-helserapport',
    'ai.modal_report_desc': 'Fullstendig kontekstpakke til ekstern AI (f.eks. ChatGPT). Lim inn i en ny samtale.',
    'ai.modal_report_includes': 'Innhold',
    'ai.modal_report_r1': 'Utøverprofil', 'ai.modal_report_r1s': 'navn, høyde, vekt, dominantben, treningsfase, trenere',
    'ai.modal_report_r2': 'Aktive plager', 'ai.modal_report_r2s': 'alle aktive/bedring-skader med alvorlighet og notat',
    'ai.modal_report_r3': 'Fysio-notater', 'ai.modal_report_r3s': 'de nyeste notatene fra fysio/naprapat',
    'ai.modal_report_r4': 'Siste 7 dager', 'ai.modal_report_r4s': 'søvn, HRV, RHR, kne- og skadesmerte, RPE per dag',
    'ai.modal_report_r5': 'Miljø & spørsmål', 'ai.modal_report_r5s': 'nåværende sted, aktiviteter og tre konkrete spørsmål til AI',
    'ai.modal_report_hint': '~800 tokens · kun strukturert tekst',
    // Modal — Diagnose
    'ai.modal_diag_title': 'Diagnosestatus',
    'ai.modal_diag_desc': 'Kort skadestatus til trener eller fysio. Inkluderer aktive plager, smertenivå og treningsbelastning.',
    'ai.modal_diag_also': 'Inkludert automatisk',
    'ai.modal_diag_r1': 'Smerte per skade', 'ai.modal_diag_r1s': 'maks før/under/etter/dagen etter, siste 7 dager',
    'ai.modal_diag_r2': 'Treningsbelastning', 'ai.modal_diag_r2s': 'antall økter og snitt-RPE siste 7 dager',
    'ai.modal_diag_hint': '~200 tokens · deterministisk, ingen AI',
    // Modal — Søvnanalyse
    'ai.modal_sleep_title': 'Søvnanalyse',
    'ai.modal_sleep_desc': 'Eksporterer søvndata for analyse i ekstern AI. Velg ønsket periode.',
    'ai.modal_sleep_7n': '7 netter', 'ai.modal_sleep_7s': '1 uke',
    'ai.modal_sleep_14n': '14 netter', 'ai.modal_sleep_14s': '2 uker',
    'ai.modal_sleep_30n': '30 netter', 'ai.modal_sleep_30s': '1 måned',
    'ai.modal_sleep_includes': 'Per natt',
    'ai.modal_sleep_r1': 'Søvntid', 'ai.modal_sleep_r1s': 'timer og minutter, legging- og oppvåkningstidspunkt',
    'ai.modal_sleep_r2': 'HRV & RHR', 'ai.modal_sleep_r2s': 'hjertefrekvensvariabilitet og hvilepuls',
    'ai.modal_sleep_r3': 'Score & arkitektur', 'ai.modal_sleep_r3s': 'søvnscore, dyp søvn %, REM % · snitt over perioden',
    'ai.modal_sleep_r4': 'Døgnrytme', 'ai.modal_sleep_r4s': 'variasjon i leggetid — mål på søvnregularitet',
    'ai.modal_sleep_hint7': '~300 tokens · 7 netter',
    'ai.modal_sleep_hint14': '~500 tokens · 14 netter',
    'ai.modal_sleep_hint30': '~900 tokens · 30 netter',
    // Modal — Ukesoppsummering
    'ai.copy_ws': 'Kopier ukesoppsummering',
    'ai.ws_copied': 'Ukesoppsummering kopiert til utklippstavlen',
    'ai.modal_ws_title': 'Kopier ukesoppsummering',
    'ai.modal_ws_desc': 'Velg hvilken uke du vil kopiere. Nyttig til å gi en ekstern AI historisk kontekst.',
    'ai.modal_ws_preview': 'Forhåndsvisning',
    'ai.modal_ws_hint': 'Velg en uke',
    // Generisk smertelogg (injury_pain)
    'pain.block_0_10': 'Smerte (0–10)',
    'pain.no_severe': 'Ingen aktive alvorlige plager',
    'pain.manual_entry': 'Manuell registrering',
    'pain.manual_saved': 'Manuell smerte lagret',
    'pain.save_err': 'Feil ved lagring av smerte: {msg}',
    'pain.manual_notes_ph': 'F.eks. etter kamp, trening hjemme…',
    // Login
    'login.sub': 'Logg inn for å fortsette', 'login.email': 'E-post',
    'login.password': 'Passord', 'login.email_ph': 'din@epost.no',
    'login.btn': 'Logg inn', 'login.loading': 'Logger inn…',
    'login.empty': 'Fyll inn e-post og passord',
    'login.lockout': 'For mange forsøk. Prøv igjen om {m} min.',
    'login.attempts_left': '{n} forsøk igjen.',
    'login.q1': 'Hvilket år begynte du med friidrett?',
    'login.q2': 'Hva het din første lærer?',
    'login.q_error': 'Feil svar. Prøv igjen.',
    'login.q_btn': 'Bekreft',
    'login.q_title': 'Sikkerhetsspørsmål',
    'err.load_data': 'Lasting feilet — sjekk tilkobling',
    // Investments
    'inv.select_ticker': 'Velg aksje…', 'inv.search_placeholder': 'Søk ticker eller navn…',
    'inv.favorite': 'Favoritt', 'inv.add_stock': 'Legg til aksje', 'inv.no_matches': 'Ingen treff',
    'inv.no_quote_data': 'Ingen kursdata tilgjengelig',
    'inv.quote_error': 'Kunne ikke hente kurs',
    'inv.ticker': 'Ticker', 'inv.name': 'Navn',
    'inv.status_watchlist': 'Watchlist', 'inv.status_open': 'Åpen', 'inv.status_closed': 'Lukket',
    'inv.locked': 'Låst', 'inv.register_buy': 'Registrer kjøp', 'inv.register_sell': 'Registrer salg',
    'inv.empty_title': 'Velg en aksje for å se detaljer',
    'inv.open': 'Åpning', 'inv.high': 'Høy', 'inv.low': 'Lav', 'inv.earnings': 'Resultat', 'inv.mcap': 'Markedsverdi', 'inv.range_start': 'Start',
    'inv.tab_analysis': 'Analyse', 'inv.tab_journal': 'Journal',
    'inv.result': 'Resultat', 'inv.pl_nok': 'Gevinst/tap (NOK)', 'inv.pl_pct': 'Gevinst/tap (%)', 'inv.days_held': 'Dager holdt',
    'inv.locked_msg': 'Posisjon er lukket — analyse er låst', 'inv.edit': 'Rediger', 'inv.edit_analysis': 'Rediger analyse',
    'inv.thesis': 'Tese', 'inv.thesis_why': 'Hvorfor', 'inv.thesis_catalyst': 'Katalysator',
    'inv.thesis_horizon': 'Horisont', 'inv.thesis_must': 'Må skje',
    'inv.ta': 'Teknisk analyse', 'inv.ta_trend': 'Trend', 'inv.ta_rsi': 'RSI', 'inv.ta_support': 'Støtte',
    'inv.ta_resistance': 'Motstand', 'inv.ta_macd': 'MACD', 'inv.ta_volume': 'Volumkommentar', 'inv.ta_comment': 'TA-kommentar',
    'inv.plan': 'Plan', 'inv.plan_entry': 'Inngang', 'inv.plan_stop': 'Stop loss',
    'inv.plan_t1': 'Mål 1', 'inv.plan_t2': 'Mål 2', 'inv.plan_horizon': 'Tidshorisont',
    'inv.risk': 'Risiko', 'inv.risk_wrong': 'Hva kan gå galt', 'inv.risk_sell': 'Selg-trigger', 'inv.risk_buy_more': 'Kjøp mer-trigger',
    'inv.journal_placeholder': 'Skriv et notat…', 'inv.journal_empty': 'Ingen oppføringer ennå',
    'inv.jt_note': 'Notat', 'inv.jt_buy': 'Kjøp', 'inv.jt_sell': 'Salg', 'inv.jt_update': 'Oppdatering',
    'inv.jt_stop_loss': 'Stop loss', 'inv.jt_target_hit': 'Mål nådd',
    'inv.buy_date': 'Kjøpsdato', 'inv.buy_price': 'Kjøpskurs', 'inv.quantity': 'Antall', 'inv.commission': 'Kurtasje',
    'inv.sell_date': 'Salgsdato', 'inv.sell_price': 'Salgskurs', 'inv.quantity_sold': 'Antall solgt',
    'inv.saved': 'Lagret', 'inv.err_save': 'Lagring feilet', 'inv.err_ticker': 'Ticker er påkrevd', 'inv.err_fields': 'Fyll ut alle felt', 'inv.err_duplicate': 'Allerede lagt til',
    'inv.search_stock': 'Søk aksje', 'inv.search_stock_placeholder': 'Skriv navn eller ticker…', 'inv.selected_stock': 'Valgt aksje', 'inv.searching': 'Søker…', 'inv.search_error': 'Søk feilet',
    'inv.no_chart_data': 'Ingen graf-data tilgjengelig', 'inv.range_1d': '1D', 'inv.range_1u': '1U', 'inv.range_1m': '1M', 'inv.range_3m': '3M', 'inv.range_1y': '1Å', 'inv.range_5y': '5Å',
    'inv.position': 'Posisjon', 'inv.avg_price': 'Snittkurs', 'inv.total_qty': 'Antall', 'inv.invested': 'Investert',
    'inv.market_value': 'Markedsverdi', 'inv.unrealized_pl': 'Urealisert gevinst/tap', 'inv.buy_more': 'Kjøp mer',
    'inv.lots_title': 'Kjøp', 'inv.lots_empty': 'Ingen kjøp registrert', 'inv.lot_remaining': 'gjenstår',
    'inv.delete_lot': 'Slett kjøp', 'inv.delete_lot_confirm': 'Slette dette kjøpet? Kan ikke angres.',
    'inv.sales_title': 'Salg', 'inv.sales_empty': 'Ingen salg registrert',
    'inv.err_qty_exceeds': 'Antall solgt overstiger tilgjengelig beholdning',
    'inv.tab_position': 'Posisjon',
    // Business
    'biz.accounting': 'Virksomhetsoversikt', 'biz.revenue': 'Inntekt',
    'biz.expense': 'Utgift', 'biz.profit': 'Fortjeneste',
    'biz.lowtier': 'For mange lavpris-kunder',
    'biz.customers': 'Kunder',
    'biz.customer': 'Kunde', 'biz.contact': 'Kontakt', 'biz.tier': 'Nivå',
    'biz.price': 'Pris', 'biz.start': 'Start', 'biz.status': 'Status',
    'biz.delete_customer': 'Slett kunde',
    'biz.lovable': 'Lovable-abonnement', 'biz.plan': 'Plan', 'biz.cost_nok': 'Kostnad (NOK)',
    'biz.leadgen': 'Leadgenerator', 'biz.leadgen_type': 'Type prompt',
    'biz.type_research': 'Research', 'biz.type_lovable': 'Lovable-nettside',
    'biz.type_sales': 'Salgshenvendelse',
    'biz.city': 'Sted', 'biz.industry': 'Bransje',
    'biz.maps_paste': 'Google Maps-utklipp',
    'biz.maps_placeholder': 'Lim inn alt kopiert fra Google Maps…',
    'biz.brand_colors': 'Merkevarefarger (valgfritt)',
    'biz.copy': 'Kopier', 'biz.copied': 'Kopiert!', 'biz.copy_failed': 'Kopiering feilet',
    'biz.copied_toast': 'Prompt kopiert',
    'biz.tier_lav': 'Lav', 'biz.tier_medium': 'Medium', 'biz.tier_hoy': 'Høy', 'biz.tier_custom': 'Egendefinert',
    'biz.status_aktiv': 'Aktiv', 'biz.status_pauset': 'Pauset', 'biz.status_avsluttet': 'Avsluttet',
  },
  en: {
    // Nav
    'nav.ai': 'AI', 'nav.dashboard': 'Dashboard', 'nav.gym': 'Gym',
    'nav.sprint': 'Sprint', 'nav.sovn': 'Sleep', 'nav.gjoremal': 'Tasks',
    'nav.kalender': 'Calendar', 'nav.treningsplan': 'Training Overview',
    'nav.investments': 'Investments', 'nav.business': 'Business',
    'nav.logout': 'Log out', 'nav.pdf': 'Export PDF',
    // Common
    'loading': 'Loading…', 'no_data': 'No data', 'save': 'Save',
    'cancel': 'Cancel', 'delete': 'Delete', 'close': 'Close', 'add': 'Add',
    'edit': 'Edit', 'reset': 'Reset', 'date': 'Date', 'notes': 'Notes', 'unit.sec': 'sec',
    'note.expand': 'Show more', 'note.collapse': 'Show less',
    // Knee pain
    'knee.before': 'Before', 'knee.during': 'During', 'knee.after': 'After',
    'knee.dayafter': 'Day after',
    'pain.meter': 'Pain scale 0–10',
    'he.add_set': 'set', 'he.add_ex': 'exercise', 'he.new_ex_name': 'Exercise name:',
    'he.saved': 'Saved', 'he.saving': 'Saving …', 'he.save_err': 'Save failed',
    'pain.manual_btn': '+ Manual',
    'knee.before_short': 'BEFORE', 'knee.during_short': 'DURING',
    'knee.after_short': 'AFTER', 'knee.dayafter_short': 'D.AFTER',
    'knee.before_session': 'Before session', 'knee.during_session': 'During session',
    'knee.after_session': 'After session', 'knee.pain': 'Pain',
    'knee.pain_0_10': 'Pain (0–10)',
    // Session types
    'session.strength_power': 'Strength Power',
    'session.strength_capacity': 'Strength Capacity',
    'session.mobility': 'Mobility & Conditioning',
    'session.daily_rehab': 'Daily Rehab',
    'session.rest_day': 'Rest Day', 'session.rest': 'Rest', 'session.off': 'Off',
    // Dashboard
    'dash.sleep': 'Sleep', 'dash.knee': 'Knee Pain', 'dash.injuries_card': 'Injuries', 'dash.session': "Today's Session",
    'dash.focus': 'Focus', 'dash.daily_focus': 'Daily Focus',
    'dash.tasks': 'Tasks', 'dash.next_event': 'Next Event',
    'dash.overview': 'Overview', 'dash.this_week': 'This Week',
    'dash.calendar': 'Calendar', 'dash.today': 'Today', 'dash.upcoming': 'Upcoming',
    'dash.status': 'Status', 'dash.full_overview': 'Full training overview →',
    'dash.sleep_score': 'Sleep score', 'dash.hrv': 'HRV', 'dash.rhr': 'Resting HR',
    'dash.deep_sleep': 'Deep sleep', 'dash.deep': 'Deep', 'dash.tonight': 'Last night',
    'dash.hr_unit': 'h', 'dash.min_unit': 'm',
    'dash.cfg_error': 'Set SUPABASE_URL and SUPABASE_ANON_KEY as environment variables in Vercel.',
    'dash.yesterday': 'Yesterday', 'dash.days_ago': '{n} days ago',
    'dash.offline': 'No network connection — data may be outdated',
    'dash.no_session': 'No session planned today', 'dash.rest_day': 'Rest day',
    'dash.no_events': 'No upcoming events', 'dash.no_data': 'No data',
    'dash.no_today': 'No events today',
    'dash.active_tasks': '{n} active', 'dash.little_data': 'Little data',
    'dash.go_to_session': 'Go to session →', 'dash.go_to_sleep': 'Go to sleep →',
    'dash.go_to_sprint': 'Go to sprint →',
    'dash.recovery_day': 'Recovery day', 'dash.tomorrow': 'Tomorrow', 'dash.overdue': 'Overdue',
    'dash.all_ok': 'All looks good today', 'dash.no_pain': 'No pain log',
    'dash.load_pain': 'Load × pain',
    'dash.acwr_label': 'ACWR (7d:28d)',
    'dash.pain_label': 'Pain (0–10)',
    'dash.risk_line': 'Risk threshold 1.5',
    'dash.pain_limit': 'Pain threshold {n}',
    'dash.load_pain_empty': 'Not enough data for ACWR yet',
    'dash.sleep_dur_lbl': 'Sleep duration', 'dash.trend_7d': 'Trend (7 days)',
    'dash.no_imp_todos': 'No important tasks',
    'dash.todo_err': 'Could not complete task',
    'dash.move_today': 'Today', 'dash.move_tomorrow': 'Tomorrow',
    'dash.moved': 'Moved', 'dash.move_err': 'Could not move task',
    'dash.untitled': '(untitled)', 'dash.allday': 'All day',
    'dash.open_sprint': 'Open Sprint', 'dash.open_gym': 'Open Gym',
    'dash.badge_styrke': 'Strength', 'dash.badge_kondisjon': 'Conditioning',
    'dash.badge_soccer': 'Soccer',
    'dash.focus_soccer_warmup': 'Good warm-up before soccer — activate the knee',
    'dash.focus_soccer_knee': 'Mind cuts and landings for the knee',
    'dash.focus_soccer_log': 'Log soccer as an activity after the session',
    'dash.focus_knee_dayafter': 'Log knee pain from previous session',
    'dash.focus_careful_sprint': 'Be careful with high top speed today',
    'dash.focus_no_push': 'Do not push through pain today',
    'dash.focus_pain_after': 'Pain after last session: {n}/10',
    'dash.focus_reduced_load': 'Consider reduced load today',
    'dash.focus_sleep_sub': '{h} sleep last night',
    'dash.focus_under8': 'You slept under 8 hours last night',
    'dash.focus_under8_sub': '{h} recorded',
    'dash.focus_restitusjon': 'Prioritize recovery — competition tomorrow',
    'dash.focus_sleep_early': 'Sleep early tonight',
    'dash.focus_heavy_tmrw': 'Heavy session tomorrow — prioritize sleep',
    'dash.focus_rehab': 'Complete rehabilitation exercises',
    'dash.focus_rehab_dayafter': 'Log pain from yesterday\'s rehab session',
    'dash.focus_rehab_pain_warning': 'High pain after rehab — take it easy today',
    'dash.focus_rehab_overdue': 'Rehab not done in the last 3 days',
    'dash.focus_active_rest': 'Active recovery recommended',
    'dash.focus_warmup': 'Prioritize a good warm-up',
    'dash.focus_knee_log': 'Log knee pain after the session',
    'dash.focus_sprint_warmup': 'Full sprint warm-up before max runs',
    'dash.focus_sprint_log': 'Log sprint data after the session',
    'dash.focus_intensity': 'Stay within planned intensity',
    'dash.cat_styrke': 'Strength', 'dash.cat_sprint': 'Sprint',
    'dash.cat_rehab': 'Rehab', 'dash.cat_recovery': 'Recovery',
    'dash.cat_sovn': 'Sleep', 'dash.cat_warning': 'NOTE',
    'dash.cat_kalender': 'Calendar',
    'dash.from_plan': 'From weekly plan', 'dash.from_focus': 'From daily focus',
    'dash.add_todo_ph': 'Add important task…',
    'dash.cal_nothing_planned': 'Nothing planned', 'dash.cal_not_connected': 'Calendar not connected',
    // v2 readiness / session card
    'dash.readiness_lbl': 'Readiness',
    'dash.sleep_score_lbl': 'Sleep Score',
    'dash.rec_vol_lbl': 'Volume', 'dash.rec_int_lbl': 'Intensity',
    'dash.rec_high': 'High', 'dash.rec_mod': 'Moderate', 'dash.rec_low': 'Low',
    'dash.rec_heavy': 'Heavy', 'dash.rec_moderate': 'Moderate', 'dash.rec_light': 'Light',
    'dash.risk_high': '⚠ High risk', 'dash.risk_mod': '~ Moderate', 'dash.risk_low': '✓ Low risk',
    'dash.focus_area_sprint': 'Acceleration · Max velocity',
    'dash.focus_area_styrke': 'Muscle strength · Progressive overload',
    'dash.focus_area_kondi': 'Aerobic capacity · Mobility',
    'dash.focus_area_soccer': 'Direction change · Explosiveness',
    'dash.focus_area_rehab': 'Knee rehab · Pain-free movement',
    'dash.ai_avoid_sprint': 'Avoid sprint >95%',
    'dash.ai_avoid_sprint_sub': 'Pain {n}/10 after last session — stay sub-max today',
    'dash.low_readiness': 'Low readiness',
    'dash.low_readiness_sub': 'Consider an easier session — recovery deficit',
    'dash.high_readiness': 'Peak form',
    'dash.high_readiness_sub': 'Green light for planned intensity today',
    'dash.ai_default_tip': 'Full warm-up gives best performance and lowest injury risk',
    'dash.rest_mobility': 'Mobility & circulation',
    'dash.rest_mobility_sub': '10–15 min light stretching for knee and hip',
    'dash.rest_walk': 'Easy walk',
    'dash.rest_walk_sub': '20–30 min easy walking — active recovery',
    'dash.rest_sleep_goal': 'Sleep target: 8–9 hours',
    'dash.rest_sleep_sub': 'Go to bed early — next session needs full recovery',
    'dash.training_day': 'Training day',
    // Week-strip chips
    'dash.chip_sprint': 'Sprint', 'dash.chip_soccer': 'Soccer', 'dash.chip_basket': 'Basket',
    'dash.chip_sirk': 'Circ.', 'dash.chip_mobil': 'Mob.', 'dash.chip_kondi': 'Cond.',
    'dash.chip_styrke': 'Strength', 'dash.chip_hvile': 'Rest', 'dash.chip_rehab': 'Rehab',
    // Gym
    'gym.log_session': 'Save session', 'gym.finish_save': 'Finish & Save', 'gym.reset': 'Reset',
    'gym.sets': 'Sets', 'gym.reps': 'Reps', 'gym.weight': 'Weight',
    'gym.rest': 'Rest', 'gym.timer': 'Timer',
    'gym.start': 'Start session', 'gym.finish': 'Finish session',
    'gym.session_saved': 'Session saved!', 'gym.session_restored': 'Session restored', 'gym.save_error': 'Error saving',
    'gym.day_after_title': 'Log day-after pain',
    'gym.day_after_saved': 'Post-rehab pain logged',
    'gym.history': 'Session History', 'gym.full_log': 'See full session log →',
    'gym.no_history': 'No sessions logged yet',
    'gym.pain_missing': 'Pain not logged',
    'gym.delete_confirm': 'Delete this session?',
    'gym.deleted': 'Session deleted', 'gym.delete_error': 'Error deleting',
    'gym.monday': 'Monday', 'gym.wednesday': 'Wednesday', 'gym.friday': 'Friday',
    // A6 — weekday names (0=Sun..6=Sat) for dynamic day-pills
    'wd.0': 'Sunday', 'wd.1': 'Monday', 'wd.2': 'Tuesday', 'wd.3': 'Wednesday',
    'wd.4': 'Thursday', 'wd.5': 'Friday', 'wd.6': 'Saturday',
    // A6 — day types (auto-translated label on a day)
    'daytype.strength': 'Strength', 'daytype.strength_capacity': 'Strength Capacity',
    'daytype.strength_power': 'Strength Power', 'daytype.power': 'Power',
    'daytype.mobility': 'Mobility & Conditioning', 'daytype.conditioning': 'Conditioning',
    'daytype.rest': 'Rest', 'daytype.rehab': 'Rehab',
    'daytype.soccer': 'Soccer', 'daytype.basketball': 'Basketball', 'daytype.track': 'Track',
    'daytype.sprint': 'Sprint', 'daytype.meet': 'Competition',
    // A6 — day editing UI
    'gym.add_day': '+ Session', 'gym.new_day': 'New session', 'gym.day_weekday': 'Weekday',
    'gym.session_name_lbl': 'Name (optional)', 'gym.session_name_ph': 'Leave empty to use type',
    'gym.rename_prompt': 'New session name:', 'gym.dblclick_rename': 'Double-click to rename', 'gym.rename_day': 'Rename session', 'gym.rename_label': 'Session name',
    'gym.edit_sets': 'Edit exercises', 'gym.edit_pain': 'Edit pain', 'gym.edit_session': 'Edit session', 'gym.no_sets_logged': 'No sets logged',
    'gym.day_type': 'Session type', 'gym.day_type_none': 'None',
    'gym.create_day': 'Create session', 'gym.delete_day': 'Delete session',
    'gym.delete_day_confirm': 'Delete this session and all its exercises?',
    'gym.day_exists': 'A session with this name already exists.',
    'gym.day_created': 'Session created', 'gym.day_deleted': 'Session deleted',
    'gym.copy_from': 'Copy exercises from', 'gym.copy_empty': 'Empty session (no exercises)',
    'gym.day_copied': 'Session created with copied exercises',
    'gym.add_section': '+ Section', 'gym.section_name_ph': 'Section name',
    'gym.section_added': 'Section added', 'gym.section_exists': 'Section already exists',
    'gym.drag_section': 'Drag to reorder', 'gym.delete_section': 'Delete section',
    'gym.confirm_delete_section': 'Delete section "{name}"?',
    'gym.confirm_delete_section_ex': 'Delete section "{name}" and {n} exercise(s)?',
    'gym.section_deleted': 'Section deleted',
    'gym.no_sections_yet': 'No sections yet. Add one to get started.',
    'gym.ex_unit': 'ex', 'gym.sets_unit': 'sets', 'gym.add_exercise_btn': '+ Exercise',
    'gym.finish_first': 'Finish the active session first',
    'confirm.delete_exercise': 'Delete exercise?',
    'confirm.delete_session': 'Delete this session?',
    'confirm.clear_day': 'Clear the plan for this day?',
    'confirm.delete_activity': 'Delete this activity?',
    'confirm.delete_runs': 'Delete all runs from {date}?',
    'gym.ready': 'Ready!',
    'gjoremal.add_ph': 'Add task…',
    'sprint.notes_ph': 'Conditions, technique, other…',
    'rpe.hint': 'Drag: 1 = very easy · 100 = max',
    'rir.label': 'RIR (reps in reserve)',
    'rir.hint': '0 = failure · 3 = your target · 5 = very easy',
    'gym.sets_done': '{done} of {total} sets completed',
    'gym.select_day': 'Select day', 'gym.exercises': 'Exercises',
    'gym.pick_and_start': 'Pick a day and press start when ready.',
    'gym.start_session': '▷ Start session', 'gym.exercises_lc': 'exercises', 'gym.exercises_cap': 'Exercises',
    'gym.new_session': 'New session',
    'gym.active_session': 'Active session', 'gym.no_session': 'No session',
    'gym.session_time': 'Session time', 'gym.warmup': 'Warm-up',
    'gym.rir_effort': 'Effort (RIR)',
    // B1 — progressive overload coach
    'po.title': 'Overload coach', 'po.subtitle': 'Suggestions for next session',
    'po.no_data': 'Log a few sessions and I’ll suggest progression here.',
    'po.try': 'Try {w} {u}', 'po.try_reps': 'Try {r}',
    'po.aim': 'Aim {lo}–{hi} reps · {rir} RIR',
    'po.level_up': '✓ Hit {hi} w/{rir} RIR — add weight (~{w} {u})',
    'po.up_easy': '✓ {hi} reps easy ({rir} RIR) — add weight (~{w} {u})',
    'po.hold_grind': 'Hit {hi} but {rir} RIR — hold, build margin',
    'po.too_light': 'Easy ({rir} RIR) — push reps to {hi}, then weight',
    'po.too_heavy': 'Heavy ({rir} RIR) — under reps, hold weight',
    'po.plateau_easy': 'Plateau {n} sessions but {rir} RIR — you’re holding back, push',
    'po.hold_pain': 'Hold weight — you logged pain ({p}) last time',
    'po.need_rir': 'Log RIR to progress — effort unknown',
    'po.need_pain': 'Log knee pain to progress — load unknown',
    'po.plateau': 'Plateau {n} sessions — deload ~10%, rebuild',
    'po.progress': '↑ ready for more', 'po.keep': 'Keep',
    'po.press_top': 'Hold — push toward the top ({r})',
    'po.last': 'Last: {w} {u} × {r}',
    'po.collapse': 'Hide', 'po.expand': 'Show coach',
    'po.even_out': 'Even out: {n} × {w} {u}',
    'po.last_sets': 'Last: {n} × {w} {u}',
    'po.last_mixed': 'Last: {list} {u}',
    'gym.knee_panel': 'Knee Pain — Log',
    'gym.select_exercise_first': 'Select an exercise first',
    'gym.exercise_added': '{name} added',
    'gym.exercise_deleted': 'Exercise deleted',
    'gym.fill_sets_reps': 'Enter sets and reps',
    'gym.knee_not_saved': 'Knee pain not saved: {msg}',
    'gym.select_pain_score': 'Select a pain score 0–10',
    'gym.weight_saved': '{name}: {w} {u} saved',
    'gym.session': 'Session', 'gym.session_done': 'Session complete!', 'gym.save_in_sidebar': 'Save in the sidebar →',
    'gym.dismiss': 'Dismiss', 'gym.today_session': "Today's session", 'gym.knee_before_session': 'Knee pain — Before session',
    'gym.session_status': 'Session status', 'gym.active_exercise': 'Active exercise', 'gym.no_active_exercise': 'No active exercise',
    'gym.tap_exercise': 'Tap an exercise to begin', 'gym.next_exercise': 'Next exercise',
    'gym.tools': 'Tools', 'gym.rest_timer': 'Rest timer', 'gym.not_running': 'Not running',
    'gym.notes': 'Notes', 'gym.notes_ph': 'Comments…', 'gym.register_pain': 'Log pain',
    'gym.live_pain': 'Pain',
    'gym.add_set_br': 'Add<br>set', 'gym.jump_next_br': 'Jump to<br>next', 'gym.finish_br': 'Finish<br>session',
    'gym.date': 'Date', 'gym.after_session': 'After session', 'gym.day_after': 'Day after',
    'gym.exercise_ph': 'Exercise', 'gym.sets_ph': 'Sets', 'gym.reps_ph': 'Reps',
    'gym.daily_rehab': 'Daily Rehab', 'gym.no_warmup_data': 'No warm-up data',
    'gym.loading_exercises': 'Loading exercises…', 'gym.col_sets': 'Sets', 'gym.col_reps': 'Reps',
    'gym.col_weight': 'Weight ({u})', 'gym.col_notes': 'Notes', 'gym.complete_exercise': 'Complete exercise',
    'gym.all_done': 'All exercises done ✓', 'gym.no_warmup_phase': 'No warm-up data',
    'gym.rest_range': 'Choose between 5 sec and 10 min', 'gym.fill_day_after': 'Can be filled in the day after',
    'gym.notif_rest_done': 'Rest timer done', 'gym.notif_rest_body': 'Time for the next set!',
    'notif.enable': 'Enable notifications', 'notif.enabled': 'Notifications on ✓',
    'notif.denied': 'Notifications blocked — enable in your phone settings',
    'notif.unsupported': 'Notifications not supported here',
    'notif.ios_install': 'Add the app to your Home Screen first (Share → Add to Home Screen)',
    'notif.no_vapid': 'Server is missing VAPID keys', 'notif.error': 'Could not enable notifications',
    'notif.title': 'Notifications', 'notif.overdue': 'Overdue', 'notif.reminders': 'Reminders',
    'notif.rest_timers': 'Rest timers', 'notif.today': 'Today', 'notif.empty': 'No active notifications',
    'notif.calendar': 'Calendar', 'notif.sleep': 'Sleep', 'notif.dismiss': 'Dismiss',
    'notif.sleep_low_title': 'Low sleep score last night', 'notif.sleep_low_sub': 'Score {score} — prioritize recovery today',
    'gm.reminder': 'Reminder', 'gm.add_reminder': 'Reminder', 'gm.reminder_set': 'Reminder set',
    'gm.reminder_cleared': 'Reminder cleared', 'gm.reminder_at': 'Reminder {time}',
    'gm.reminder_past': 'Pick a time in the future', 'gm.clear_reminder': 'Clear reminder',
    'gm.clear_date': 'Clear due date',
    'gm.reminder_body': 'Reminder!',
    'gym.sets_progress': '{done} / {total} sets',
    'gym.ring_done': 'done',
    'gym.notes_zero': '0 notes',
    'gym.lines_one': '1 line', 'gym.lines_many': '{n} lines',
    'gym.min_one_set': 'At least 1 set required',
    'gym.remove_set': 'Remove set',
    'gym.hist_sets': '{ex} ex · {sets} sets',
    'gym.reset_unsaved_confirm': 'Session not saved — start a new one without saving?',
    'gym.offline_retry': 'Offline — the session will save automatically when you reconnect',
    'gym.rename_exercise': 'Rename exercise',
    'gym.block_exercise': 'Block exercise (permanent, due to injury)',
    'gym.unblock_exercise': 'Include exercise again',
    'gm.saved': 'Saved',
    'offline_now': "You're offline — showing last saved data",
    'online_again': 'Back online',
    'sw_updated': 'New version loaded — applies on next page change',
    'tp.duration': 'Duration (min)',
    'tp.min_played': 'Game minutes (optional)', 'tp.min_played_short': '{n} min played',
    'tp.ql_btn': '⚡ Log today\'s session', 'tp.ql_rest': 'Today is a rest day — nothing to log',
    'tp.week_load': 'Weekly load (sRPE)',
    'tp.week_load_hint': 'RPE/10 × activity weight — sprint heavy, walk ~0',
    'tp.load_mult': 'Load weight (multiplier)',
    'tp.load_mult_hint': 'Pre-filled with type default. Adjust if intensity differs.',
    'tp.preset_none': 'Choose preset…',
    'tp.preset_apply': 'Apply',
    'tp.preset_save': 'Save as…',
    'tp.preset_delete': 'Delete',
    'tp.preset_pick': 'Pick a preset first',
    'tp.preset_name_prompt': 'Preset name (e.g. “USA football”)',
    'tp.preset_saved': 'Preset saved',
    'tp.preset_deleted': 'Preset deleted',
    'tp.preset_delete_confirm': 'Delete preset “{name}”?',
    'tp.preset_applied_hint': 'Filled in — press “Save plan” to apply',
    // Sprint
    'sprint.personal_records': 'Personal Records',
    'sprint.goals': 'Sprint Goals', 'sprint.log': 'Log Session',
    'sprint.add_run': '+ Add run',
    'sprint.distance': 'Distance', 'sprint.type': 'Type', 'sprint.time': 'Time (sec)',
    'sprint.evaluation': 'Evaluation', 'sprint.rpe': 'RPE (1–100)',
    'sprint.log_btn': 'Log Session', 'sprint.history': 'Pain — Last 5 Sessions',
    'sprint.fill_fields': 'Enter distance and time',
    'sprint.add_first': 'Add at least one run before saving',
    'sprint.save_error': 'Error saving session: {msg}',
    'sprint.knee_error': 'Pain not saved: {msg}',
    'sprint.runs_saved': '{n} run(s) saved!', 'sprint.new_pb': 'New PB! {pbs}',
    'sprint.invalid': 'Invalid value', 'sprint.rpe_range': 'RPE must be 1–100',
    'sprint.pain_range': 'Pain must be 0–10',
    'sprint.updating': 'Updating all {n} runs on this date',
    'sprint.save_fail': 'Save error', 'sprint.deleted': 'Session deleted',
    'sprint.dismiss': 'Swipe up', 'sprint.dismissed': 'Session archived',
    'sprint.training': 'Training', 'sprint.competition': 'Competition',
    'sprint.training_outdoor': 'Training (outdoor)',
    'sprint.edit_knee': 'Edit pain — ',
    'sprint.knee_updated': 'Pain updated',
    'sprint.knee_save_error': 'Error saving: {msg}',
    'sprint.runs': 'Runs', 'sprint.goal': 'Goal',
    'sprint.runs_count': '{n} runs',
    'sprint.run_num': 'Run {n}', 'sprint.delete_session': 'Delete session',
    'sprint.no_sessions': 'No logged sessions', 'sprint.no_data_yet': 'No data yet',
    'sprint.no_runs_yet': 'No runs added yet',
    'sprint.goal_reached': '✓ Goal reached!', 'sprint.from_goal': '{n}s from goal',
    'sprint.reset_baseline': 'Reset baseline', 'sprint.baseline_reset': 'Baseline reset to {time}s',
    'sprint.edit_goal': 'Edit goal', 'sprint.goal_saved': 'Goal updated to {time}s',
    'sprint.goal_invalid': 'Invalid goal time', 'sprint.goal_col_missing': 'Missing column — run 028_sprint_goal_time.sql in Supabase',
    'sprint.dist_add': '+ Add distance', 'sprint.dist_delete': 'Delete distance',
    'sprint.dist_name_ph': 'Distance (e.g. 300m)', 'sprint.dist_goal_ph': 'Goal time (sec)', 'sprint.dist_start_ph': 'Baseline (sec, optional)',
    'sprint.dist_none': 'No goals set yet', 'sprint.dist_name_req': 'Enter a distance', 'sprint.dist_goal_req': 'Enter a goal time',
    'sprint.dist_exists': '{d} already exists', 'sprint.dist_added': '{d} added', 'sprint.dist_deleted': '{d} deleted',
    'sprint.dist_del_confirm': 'Delete {d}? Its goal and PB will be removed.',
    'sprint.lvl_label': 'Acceleration', 'sprint.lvl_low': 'Low', 'sprint.lvl_mid': 'Med', 'sprint.lvl_high': 'High',
    'tp.soccer_lvl': 'Intensity',
    // Søvn
    'sovn.title': 'Sleep & Recovery', 'sovn.score_lbl': 'Sleep Score', 'sovn.rhr': 'Resting HR',
    'sovn.recovery': 'Good Recovery', 'sovn.solid': 'Solid Night',
    'sovn.moderate': 'Moderate Recovery', 'sovn.hard': 'Tough Night',
    'sovn.no_data': 'No sleep data', 'sovn.sleeping': 'Still sleeping?',
    'sovn.sync_auto': 'Syncs automatically',
    'sovn.sprint_ready': 'Good basis for sprint today',
    'sovn.train_ready': 'Ready to train',
    'sovn.light_session': 'Consider a light session',
    'sovn.rest': 'Prioritize rest today',
    'sovn.registered': 'Recorded {d}', 'sovn.waiting': 'Waiting for data',
    'sovn.architecture': 'Sleep Architecture', 'sovn.readiness': 'Training Readiness',
    'sovn.no_phase': 'No phase data for today',
    'sovn.deep': 'Deep sleep', 'sovn.rem': 'REM', 'sovn.light': 'Light sleep',
    'sovn.awake': 'Awake', 'sovn.total': 'Total sleep',
    'sovn.awake_exceptional': 'Exceptional', 'sovn.awake_good': 'Good',
    'sovn.awake_acceptable': 'Acceptable', 'sovn.awake_restless': 'A bit restless',
    'sovn.awake_fragmented': 'Fragmented',
    'sovn.awake_advice_exceptional': 'Under 5 min is exceptional. Almost no interruptions – sleep was continuous and efficient.',
    'sovn.awake_advice_good': '{v} min is below the 20-min reference for healthy young adults. Solid sleep continuity.',
    'sovn.awake_advice_acceptable': '{v} min is acceptable for an athlete with high training load (6 sessions/week) – studies show 30–48 min WASO in young sprint/strength athletes. Aim for under 20 min.',
    'sovn.awake_advice_restless': '{v} min awake fragments your sleep. Common causes for you: late screen time, school pressure or socializing right before bed. Wind down 30–45 min before sleep.',
    'sovn.awake_advice_fragmented': '{v} min awake is too much. Likely cause: stress (school/social) or late screens keeping the nervous system activated. Fragmented sleep sabotages recovery even if total time looks fine – HRV and RHR will suffer.',
    'sovn.awake_ctx_none': 'almost no interruptions',
    'sovn.awake_ctx_good': '{v} min awake (good)',
    'sovn.awake_ctx_acceptable': '{v} min awake (acceptable)',
    'sovn.awake_ctx_restless': '{v} min awake – a bit restless',
    'sovn.awake_ctx_fragmented': '{v} min awake – fragmented',
    'sovn.copy_sync': 'Copy sync command', 'sovn.copied': '✓ Copied!',
    'sovn.arch_excellent': 'Outstanding sleep quality',
    'sovn.arch_deep': 'Deep sleep solid tonight',
    'sovn.arch_low_deep': 'Low deep sleep tonight',
    'sovn.arch_low_rem': 'REM below normal',
    'sovn.arch_good_rem': 'Good REM sleep tonight',
    'sovn.arch_normal': 'Sleep quality normal',
    'sovn.ready_high': 'Ready for high intensity',
    'sovn.ready_good': 'Good basis for training',
    'sovn.ready_moderate': 'Moderate recovery',
    'sovn.ready_rest': 'Consider rest today',
    'sovn.ready_high_desc': 'Sleep, HRV and resting HR are above your normal',
    'sovn.bb_label': 'Body battery',
    'sovn.bb_curve': 'Body Battery through the day',
    'sovn.bb_curve_empty': 'No body battery data for this day',
    'sovn.bb_peak': 'Peak',
    'sovn.bb_low': 'Low',
    'sovn.bb_axis': 'level',
    'sovn.ready_good_desc': 'Good overnight recovery',
    'sovn.ready_moderate_desc': 'Consider keeping intensity low',
    'sovn.ready_rest_desc': 'Sleep quality below normal',
    'sovn.no_today': 'No data for today',
    'sovn.hrv_optimal': 'Optimal', 'sovn.hrv_good': 'Good',
    'sovn.hrv_low': 'Low', 'sovn.hrv_critical': 'Critical', 'sovn.hrv_alarm': 'Alarm',
    'sovn.rhr_peak': 'Peak Form', 'sovn.rhr_excellent': 'Excellent',
    'sovn.rhr_normal': 'Normal', 'sovn.rhr_elevated': 'Elevated',
    'sovn.rhr_high': 'High', 'sovn.rhr_alarm': 'Alarm',
    'sovn.sleep_optimal': 'Optimal', 'sovn.sleep_good': 'Good',
    'sovn.sleep_little': 'Too little', 'sovn.sleep_critical': 'Critical',
    'sovn.score_excellent': 'Outstanding', 'sovn.score_good': 'Good',
    'sovn.score_ok': 'Acceptable', 'sovn.score_bad': 'Poor',
    'sovn.1day': '1 day of data', 'sovn.no_history': 'No history yet',
    'sovn.auto_fill': 'Chart fills automatically every morning at 07:45',
    'sovn.missing': 'Missing data',
    'sovn.goal_8h': '8h goal', 'sovn.hours': 'hours', 'sovn.score_100': '/100',
    'sovn.leg_deep': 'Deep sleep', 'sovn.leg_rem': 'REM', 'sovn.leg_light': 'Light sleep',
    'sovn.leg_hrv': 'HRV (ms)', 'sovn.leg_rhr': 'Resting HR (bpm)',
    'sovn.leg_score': 'Sleep score (0–100)',
    'sovn.hrv_advice_optimal': 'Nervous system is recovered. Green light for sprint and high intensity today.',
    'sovn.hrv_advice_good': 'Good recovery. Moderate to high intensity is fine.',
    'sovn.hrv_advice_low': 'HRV below normal. Keep intensity moderate — avoid max sessions and failure reps today.',
    'sovn.hrv_advice_critical': 'HRV very low. Body is under stress. Light activity or rest day — otherwise you risk overtraining.',
    'sovn.hrv_advice_alarm': '⚠️ Extremely low HRV. Rest today. Check if you are sick, dehydrated or sleeping too little.',
    'sovn.rhr_advice_peak': 'Very low resting HR — sign of good fitness and full recovery. Green light for hard training.',
    'sovn.rhr_advice_excellent': 'Optimal resting HR for a sprinter. Body is well recovered.',
    'sovn.rhr_advice_normal': 'Normal resting HR. Nothing to worry about.',
    'sovn.rhr_advice_elevated': 'Slightly elevated resting HR. May indicate stress, poor sleep or early illness. Consider an easier session.',
    'sovn.rhr_advice_high': 'Elevated resting HR. Body is under pressure — rest or easy session today.',
    'sovn.rhr_advice_alarm': '⚠️ High resting HR. Do not train intensively. May indicate illness or serious under-recovery.',
    'sovn.sleep_advice_optimal': 'Optimal sleep duration. Body has received what it needs for full recovery.',
    'sovn.sleep_advice_good': 'Sufficient sleep, but slightly below ideal. With 6 sessions/week you recover best on 8–9h — aim to go to bed a bit earlier.',
    'sovn.sleep_advice_little': 'Below recommended sleep amount. Go to bed 30–60 min earlier tonight. Avoid hard training late in the day.',
    'sovn.sleep_advice_critical': '⚠️ Critically little sleep. No high-intensity session today. Prioritize sleep above all else tonight.',
    'sovn.score_advice_excellent': 'Outstanding sleep quality. Body has recovered optimally.',
    'sovn.score_advice_good': 'Good sleep quality. You are well recovered.',
    'sovn.score_advice_ok': 'Sleep quality could be improved. Avoid screens and caffeine in the last 2h before bed.',
    'sovn.score_advice_bad': 'Poor sleep quality. Prioritize sleep hygiene: fixed bedtime, dark room, no caffeine after 2pm.',
    'sovn.you_slept': 'You slept ',
    'sovn.score_sub': 'Sleep score',
    'sovn.copy_prompt': 'Copy the command below:',
    'sovn.prev_day': 'Previous day', 'sovn.next_day': 'Next day', 'sovn.fetched': 'Sleep fetched ✓',
    'sovn.fetch_now': 'Fetch sleep now', 'sovn.fetching': 'Fetching…', 'sovn.no_new': 'No new sleep data', 'sovn.fetch_err': 'Fetch failed',
    // Gjøremål
    'gm.title': 'Tasks', 'gm.sub': 'Tasks & goals',
    'gm.active': 'Active', 'gm.important': 'Important',
    'gm.filter_all': 'All', 'gm.filter_active': 'Active',
    'gm.filter_important': 'Important', 'gm.filter_done': 'Completed',
    'gm.add_placeholder': 'Add task…', 'gm.new_list': 'New list…',
    'gm.add_btn': 'Add', 'gm.important_btn': 'Important',
    'gm.chip_due': '+ date', 'gm.chip_reminder': '⏰ Reminder', 'gm.chip_today': 'Today', 'gm.chip_tomorrow': 'Tomorrow',
    'gm.no_todos': 'No tasks here', 'gm.no_todos_empty': 'No tasks',
    'gm.loading': 'Loading…', 'gm.lists': 'Lists',
    'gm.delete_list': 'Delete list "{n}" and all its tasks?',
    'gm.list_deleted': '"{n}" deleted',
    'gm.added': 'Added', 'gm.saved': 'Saved', 'gm.deleted': 'Deleted',
    'gm.save_error': 'Error saving',
    'gm.active_count': '{n} active', 'gm.overdue_prefix': '⚠ ',
    'gm.add_date': '+ date', 'gm.click_edit': 'Click to edit',
    'gm.change_date': 'Change due date',
    'gm.detail': 'Details', 'gm.detail_title_label': 'Title', 'gm.detail_list_label': 'List',
    'gm.detail_due_label': 'Due date', 'gm.detail_remind_label': 'Reminder',
    'gm.mark_done': 'Mark done', 'gm.mark_active': 'Mark as active',
    'gm.detail_none': 'None', 'gm.detail_important_on': 'Important', 'gm.detail_important_off': 'Mark as important',
    'gm.quick_today_title': 'Set due date to today (click again to clear)',
    'gm.quick_tomorrow_title': 'Set due date to tomorrow (click again to clear)',
    'gm.date_removed': 'Date cleared',
    'gm.completed': 'Completed ✓', 'gm.undo': 'Undo',
    'gm.stats_active': 'Active', 'gm.stats_important': 'Important',
    'gm.stats_done': 'Done today', 'gm.stats_overdue': 'Overdue',
    'gm.sub_tasks': 'Tasks for today and ahead',
    'gm.update_error': 'Could not update', 'gm.delete_error': 'Could not delete',
    'gm.rename': 'Rename', 'gm.rename_prompt': 'New list name:', 'gm.new_list_prompt': 'Name of new list:', 'gm.list_exists': 'List already exists', 'gm.list_renamed': 'List renamed',
    'gm.drag_list': 'Drag to reorder',
    'gm.edit_done': 'Done', 'gm.edit_lists_hint': 'Drag to reorder · ✎ rename · ✕ delete',
    'gm.date_placeholder_no': 'mm.dd.yyyy', 'gm.date_placeholder_en': 'mm.dd.yyyy',
    // Kalender
    'kal.title': 'Calendar', 'kal.today': 'Today', 'kal.new_event': 'New event', 'kal.add_event': 'Event',
    'kal.add_placeholder': 'Title, date, time…',
    'kal.all_day': 'All-day event', 'kal.no_events': 'No events',
    'kal.no_today': 'No events today', 'kal.no_upcoming': 'No upcoming',
    'kal.added': 'Event added', 'kal.deleted': 'Event deleted',
    'kal.updated': 'Event updated', 'kal.save_error': 'Error saving',
    'kal.del_error': 'Error deleting', 'kal.loading': 'Loading…',
    'kal.table_missing': 'Database table missing. Run supabase/migrations/006_calendar_events.sql in the Supabase SQL Editor.',
    'kal.error_prefix': 'Error: ',
    'kal.del_confirm': 'Delete this event?',
    'kal.whole_day': 'All day', 'kal.week_view': 'Week', 'kal.agenda_view': 'Agenda', 'kal.month_view': 'Month',
    'kal.prev': '‹', 'kal.next': '›',
    'kal.quick_add_ph': 'Sprint Thursday 17:00…', 'kal.events': 'Events',
    'kal.next_event': 'Next event', 'kal.no_events_use_quick': '<div class="ae-title">Nothing planned this day</div><div class="ae-sub">Use “Quick add” to fill it in</div>',
    'kal.no_time': 'No time', 'kal.gcal_readonly': 'Google Calendar · read-only',
    'kal.gcal_recurring': 'Recurring', 'kal.scope_this': 'This day', 'kal.scope_following': 'This and following', 'kal.scope_series': 'Whole series',
    'kal.gcal_del_confirm': 'Delete this Google event?', 'kal.gcal_del_following_confirm': 'Delete this and all following occurrences?', 'kal.gcal_del_series_confirm': 'Delete the WHOLE series?',
    'kal.gcal_err_scope': 'No write access to Google. The token must be renewed with calendar scope.',
    'kal.title_lbl': 'Title', 'kal.start': 'Start', 'kal.end': 'End',
    'kal.category': 'Category', 'kal.notes': 'Notes',
    'kal.cat_styrke': 'Strength', 'kal.cat_stevne': 'Competition', 'kal.cat_kirke': 'Church',
    'kal.cat_fridag': 'Day off', 'kal.cat_other': 'Other',
    'kal.dest_gcal': 'Google Cal', 'kal.dest_local': 'Local',
    'kal.unauthorized': 'Not logged in — please sign in again',
    // Treningsplan
    'tp.title': 'Training Overview', 'tp.history': 'Session History',
    'tp.no_sessions': 'No sessions logged yet',
    'tp.no_sessions_full': '<div class="empty" style="grid-column:1/-1;padding:20px 0">No sessions logged yet</div>',
    'tp.edit_pain': 'Edit pain values',
    'tp.notes': 'Notes', 'tp.trend_up': '↓ Knee pain improving',
    'tp.trend_down': '↑ Knee pain worsening', 'tp.trend_stable': '— Knee pain stable',
    'tp.gym_badge': '✓ Gym', 'tp.sprint_badge': '⚡ Sprint',
    'tp.runs': 'Runs ({n})', 'tp.completed': '✓ Completed',
    'tp.loading': 'Loading session log…', 'tp.save_error': 'Error saving',
    'tp.saved': 'Saved', 'tp.day_cleared': 'Day cleared',
    'tp.select_activity': 'Select activity type', 'tp.select_date': 'Select date',
    'tp.activity_saved': 'Activity saved', 'tp.delete_error': 'Error deleting',
    'tp.activity_deleted': 'Activity deleted', 'tp.save_plan': 'Save plan',
    'tp.plan_saved': 'Plan saved', 'tp.plan_load_error': 'Could not load plan',
    'tp.add_activity': 'Activity', 'tp.loading_log': 'Loading session log…',
    'tp.hero_loading': 'Today — loading…',
    'tp.today': 'Today', 'tp.week': 'Week', 'tp.next': 'Next',
    'tp.rest': 'Rest day', 'tp.free': 'Off',
    'tp.no_session_planned': 'No session planned',
    'tp.session_logged': '✓ Logged', 'tp.edit_session': 'Edit session',
    'tp.act_easy': 'Easy day', 'tp.act_replaced': 'Replaced planned session (optional)',
    'tp.kpi_sessions': 'Sessions<br>this week', 'tp.kpi_left': 'Planned<br>left',
    'tp.prev_week': '← Previous week', 'tp.next_week': 'Next week →', 'tp.week_lbl': 'Week —',
    'tp.select_day': 'Select a day', 'tp.session_activity': 'Session / Activity',
    'tp.plan_placeholder': 'Enter session…', 'tp.notes_placeholder': 'Goals, technique, comments…',
    'tp.save': 'Save', 'tp.clear_day': 'Clear day', 'tp.this_week': 'This week',
    'tp.custom': 'Custom…', 'tp.multi_assign': 'Set the same session on several days',
    'tp.group_gym': 'Strength sessions', 'tp.group_activity': 'Activities', 'tp.group_sprint': 'Sprint',
    'tp.apply': 'Apply', 'tp.pick_days': 'Pick at least one day', 'tp.multi_days_btn': 'Apply to several days…',
    'tp.stat_done': 'Completed', 'tp.stat_planned': 'Planned',
    'tp.stat_consistency': 'Consistency', 'tp.stat_rest': 'Rest days',
    'tp.week_load': "Week's load", 'tp.edit_plan': '✎ Edit weekly plan',
    // B3 — knee dashboard
    'tp.session_fallback': 'Session',
    'tp.inj_btn': '🩹 Injuries', 'tp.inj_title': 'Injuries & complaints',
    'tp.inj_add': '+ New injury', 'tp.inj_part': 'Body part', 'tp.inj_side': 'Side',
    'tp.inj_status': 'Status', 'tp.inj_severity': 'Severity', 'tp.inj_start': 'Started',
    'tp.inj_note': 'Note', 'tp.inj_note_ph': 'What is it? What provokes it, what helps…',
    'tp.inj_save': 'Save injury', 'tp.inj_saved': 'Injury saved', 'tp.inj_deleted': 'Injury deleted',
    'tp.inj_empty': 'No injuries logged', 'tp.inj_active': 'Active', 'tp.inj_archived': 'Archived',
    'tp.inj_need_part': 'Select body part',
    'side.left': 'Left', 'side.right': 'Right', 'side.both': 'Both', 'side.none': '–',
    'status.active': 'Active', 'status.improving': 'Improving', 'status.archived': 'Archived',
    'sev.mild': 'Mild', 'sev.moderate': 'Moderate', 'sev.severe': 'Severe',
    'body.knee': 'Knee', 'body.hamstring': 'Hamstring', 'body.glute': 'Glute',
    'body.hipflexor': 'Hip flexor', 'body.hip': 'Hip', 'body.shoulder': 'Shoulder',
    'body.back': 'Back', 'body.neck': 'Neck', 'body.ankle': 'Ankle', 'body.calf': 'Calf',
    'body.achilles': 'Achilles', 'body.foot': 'Foot', 'body.other': 'Other',
    'tp.physio_btn': '🩺 Physio note', 'tp.physio_title': 'Note from physio/therapist',
    'tp.physio_therapist': 'Therapist', 'tp.physio_therapist_ph': 'E.g. Andreas Havre',
    'tp.physio_note': 'Note', 'tp.physio_note_ph': 'What did the therapist say? Advice, exercises, assessment…',
    'tp.physio_save': 'Save note', 'tp.physio_saved': 'Physio note saved',
    'tp.physio_recent': 'Recent notes', 'tp.physio_empty': 'No notes yet',
    'tp.physio_need_note': 'Write a note first',
    'tp.physio_updated': 'Physio note updated', 'tp.physio_deleted': 'Physio note deleted',
    'tp.physio_del_confirm': 'Delete this note?',
    'tp.copy_one': 'Copy', 'tp.copy_all': 'Copy all', 'tp.copied': 'Copied',
    'tp.copy_fail': 'Could not copy', 'tp.show_more': 'Show more', 'tp.show_less': 'Show less',
    'tp.overload_config': '⚙ Overload coach', 'tp.oc_title': 'Overload coach config',
    'tp.oc_enabled': 'Enabled', 'tp.oc_enabled_tip': 'Enabled = coach tracks this exercise and suggests weight increases',
    'tp.oc_reps_min': 'Rep min', 'tp.oc_reps_max': 'Rep max',
    'tp.oc_step': 'Step (kg)', 'tp.oc_pain': 'Pain limit (0–10)',
    'tp.oc_pain_tip': 'Pain limit: if knee pain ≥ this value, the coach will NOT suggest increasing weight',
    'tp.oc_no_ex': 'No exercises found', 'tp.oc_saved': 'Overload config saved',
    'tp.trends': 'Trends', 'tp.tr_knee': 'Knee pain', 'tp.tr_sleep': 'Sleep',
    'tp.tr_load': 'Load', 'tp.tr_2w': 'Last 2 weeks',
    'tp.tr_up': 'up', 'tp.tr_down': 'down', 'tp.tr_flat': 'stable', 'tp.tr_nodata': 'no data',
    'tp.knee_dash': 'Knee & rehab', 'tp.inj_dash': 'Injuries & rehab', 'tp.knee_trend': 'Pain trend (14 d)',
    'tp.days_pain_free': 'Days since pain', 'tp.rehab_streak': 'Rehab streak',
    'tp.streak_days': '{n} days', 'tp.streak_day': '{n} day',
    'tp.knee_no_data': 'No knee data yet', 'tp.inj_no_data': 'No injury data yet', 'tp.pain_free_now': 'Pain-free now',
    'tp.days_unit': 'd', 'tp.last_pain': 'Last pain: {d}',
    'tp.log_activity': 'Log activity', 'tp.date': 'Date', 'tp.activity': 'Activity',
    'tp.describe_activity': 'Describe activity', 'tp.knee': 'Knee pain',
    'tp.knee_before': 'Before', 'tp.knee_during': 'During', 'tp.knee_after': 'After', 'tp.knee_dayafter': 'D. after',
    'tp.save_activity': 'Save activity', 'tp.act_notes_ph': 'Comments, impressions…',
    'tp.act_custom_ph': 'E.g. Volleyball', 'tp.act_replaced_ph': 'E.g. Sprint — took it easy due to hamstring',
    'tp.act_soccer': 'Soccer', 'tp.act_swim': 'Swimming', 'tp.act_cycle': 'Cycling',
    'tp.act_basketball': 'Basketball', 'tp.act_padel': 'Padel', 'tp.act_amfootball': 'Football',
    'tp.act_walk': 'Walking', 'tp.act_frisbee': 'Disc golf', 'tp.act_swim_rec': 'Swimming (rec)',
    'tp.act_other': 'Other', 'tp.edit_weekly_plan': 'Edit weekly plan',
    'tp.rest_rehab': 'Rest & rehab', 'tp.rest': 'Rest', 'tp.delete': 'Delete',
    'tp.wp_placeholder': 'E.g. Sprint, Soccer, Rest…',
    // Profile
    'tp.profile_btn': '👤 Profile',
    'tp.profile_title': 'Profile & settings',
    'tp.prof_personal': 'Personal info',
    'tp.prof_name': 'Full name', 'tp.prof_name_ph': 'E.g. Filip Lund',
    'tp.prof_birth': 'Date of birth',
    'tp.prof_leg': 'Dominant leg',
    'tp.prof_leg_left': 'Left', 'tp.prof_leg_right': 'Right',
    'tp.prof_phase': 'Training phase',
    'tp.prof_phase_pre': 'Pre-season', 'tp.prof_phase_comp': 'Competition',
    'tp.prof_phase_off': 'Off-season', 'tp.prof_phase_trans': 'Transition',
    'tp.prof_height': 'Height (cm)',
    'tp.prof_save': 'Save profile', 'tp.prof_saved': 'Profile saved',
    'tp.prof_weight_section': 'Weight',
    'tp.prof_weight': 'Weight (kg)', 'tp.prof_weight_date': 'Date',
    'tp.prof_add_weight': 'Log', 'tp.prof_weight_hist': 'History',
    'tp.prof_no_weight': 'No measurements yet',
    'tp.prof_weight_saved': 'Weight logged', 'tp.prof_weight_del': 'Delete',
    'tp.prof_coaches': 'Coach / Coaches',
    'tp.prof_coach_name': 'Name', 'tp.prof_coach_role': 'Role / Type',
    'tp.prof_coach_role_ph': 'E.g. Track, Soccer, Strength…',
    'tp.prof_add_coach': '+ Add coach',
    'tp.prof_no_coaches': 'No coaches registered',
    'tp.prof_coach_saved': 'Coach saved', 'tp.prof_coach_deleted': 'Coach deleted',
    'tp.prof_role_head': 'Head coach', 'tp.prof_role_asst': 'Assistant',
    'tp.prof_role_track': 'Track & Field', 'tp.prof_role_soccer': 'Soccer',
    'tp.prof_role_strength': 'Strength', 'tp.prof_role_physio': 'Physiotherapist',
    'tp.prof_role_other': 'Other',
    // Custom activities
    'tp.manage_acts_btn': '🏃 Manage activities',
    'tp.manage_acts_title': 'Activities',
    'tp.manage_acts_empty': 'No activities',
    'tp.act_builtin_label': 'Built-in',
    'tp.act_rename': 'Rename',
    'tp.act_rename_ph': 'New name...',
    'tp.act_rename_save': 'Save',
    'tp.act_renamed': 'Activity renamed – all entries updated',
    'tp.act_rename_error': 'Rename error',
    'tp.act_delete_builtin': 'Built-in activities cannot be deleted',
    'tp.act_name': 'Name', 'tp.act_name_ph': 'E.g. Tennis',
    'tp.act_load_mult': 'Load multiplier',
    'tp.act_add': '+ Add activity',
    'tp.act_saved': 'Activity saved', 'tp.act_deleted': 'Activity deleted',
    'tp.act_need_name': 'Enter a name',
    'tp.act_name_exists': 'An activity with this name already exists',
    'tp.group_custom': 'My activities',
    // AI
    'ai.title': 'AI Overseer',
    'ai.subtitle': 'Personal assistant · {model} · Sleep · Sprint · Rehab',
    'ai.sub_pre': 'Personal assistant', 'ai.sub_post': 'Sleep · Sprint · Rehab',
    'ai.clear': 'Clear chat', 'ai.cleared': 'Chat cleared',
    'ai.copy_report': 'Copy AI Health Report', 'ai.report_building': 'Building report…',
    'ai.report_copied': 'AI health report copied to clipboard', 'ai.report_copy_fail': 'Could not copy — try again',
    // Diagnosis message (short injury status for coach/physio, deterministic)
    'ai.copy_diag': 'Copy diagnosis', 'ai.diag_copied': 'Diagnosis copied to clipboard',
    'ai.copy_sleep': 'Copy sleep analysis', 'ai.sleep_copied': 'Sleep analysis copied to clipboard',
    'ai.copy_gym': 'Copy exercises', 'ai.copy_gym_title': 'Select days to copy',
    'ai.copy_gym_btn': 'Copy selected', 'ai.copy_gym_copied': 'Exercises copied to clipboard',
    'ai.copy_gym_none': 'Select at least one day', 'ai.copy_gym_empty': 'No exercises found for selected days',
    'diag.header': 'Injury status', 'diag.none': 'No active issues.',
    'diag.last7': 'Last 7 days: {n} sessions, avg RPE {rpe}/100.',
    'diag.pain_line': 'Pain 7d (max pre/during/post/next-day): {b}/{d}/{a}/{da} of 10.',
    'diag.pain_none': 'No pain logged in the last 7 days.',
    'inj.since': 'since',
    'inj.side_left': 'left', 'inj.side_right': 'right', 'inj.side_both': 'both',
    'inj.sev_mild': 'mild', 'inj.sev_moderate': 'moderate', 'inj.sev_severe': 'severe',
    'inj.st_active': 'active', 'inj.st_improving': 'improving',
    'gym.cardio_edit': 'Change machine/time', 'gym.cardio_time_ph': 'e.g. 5–8 min', 'gym.add_cardio': '+ Add cardio',
    'cardio.bike': 'Bike', 'cardio.treadmill': 'Treadmill', 'cardio.elliptical': 'Elliptical',
    'cardio.rower': 'Rower', 'cardio.skierg': 'SkiErg', 'cardio.stairmaster': 'Stairmaster',
    'cardio.walk': 'Walk', 'cardio.jogging': 'Jogging',
    'gym.rename_section': 'Rename section',
    // Weekly reports (Sun–Sat, auto-generated Saturday morning, stored in Supabase)
    'ws.panel_title': 'Weekly reports', 'ws.regenerate': '↻ Regenerate',
    'ws.generating': 'Generating…', 'ws.week_ending': 'Week ending {date}',
    'ws.current': 'THIS WEEK', 'ws.none': 'No reports yet — the first one is generated automatically on Saturday morning.',
    'ws.close': 'Close', 'ws.gen_failed': 'Could not generate the report', 'ws.saved': 'Weekly report saved',
    'ws.new_badge': 'NEW',
    'ai.empty_title': 'Ready to analyze',
    'ai.empty_sub': 'Ask about training, knee pain, sleep or form.\nFetches data automatically from all logs.',
    'ai.placeholder': 'Write a message…',
    'ai.hint': 'Enter to send · Shift+Enter for new line',
    'ai.daily_soft_cap': "You've sent {n} messages today — just a friendly heads-up about the API budget.",
    'ai.you': 'You', 'ai.ai_label': 'AI',
    'ai.quick1': 'Ready today?', 'ai.quick2': 'Watch out today?',
    'ai.quick3': '2-week progress?', 'ai.quick4': 'Biggest risk now?', 'ai.quick5': 'What am I missing?',
    'ai.quick1_prompt': "Am I ready for today's planned session based on my sleep, HRV and knee?",
    'ai.quick2_prompt': 'What should I be careful about or avoid in today\'s session based on my data?',
    'ai.quick3_prompt': 'Is my sleep, knee and form better or worse than 14 days ago?',
    'ai.quick4_prompt': 'What is my biggest risk right now — knee, overload, underload or something else?',
    'ai.quick5_prompt': 'What am I training too little of right now — strength, easy volume, sprinting, mobility or recovery?',
    'ai.err_timeout': 'Request timed out (30s) — please try again',
    'ai.err_network': 'Network error — check connection and try again',
    'ai.err_generic': 'Error {status} — please try again', 'ai.model': 'Sonnet 4.6',
    // Modal — shared
    'ai.modal_copy_btn': 'Copy to clipboard',
    // Modal — AI Health Report
    'ai.modal_report_title': 'AI Health Report',
    'ai.modal_report_desc': 'Complete context package for external AI (e.g. ChatGPT). Paste into a new conversation.',
    'ai.modal_report_includes': 'Contents',
    'ai.modal_report_r1': 'Athlete profile', 'ai.modal_report_r1s': 'name, height, weight, dominant leg, training phase, coaches',
    'ai.modal_report_r2': 'Active issues', 'ai.modal_report_r2s': 'all active/improving injuries with severity and notes',
    'ai.modal_report_r3': 'Physio notes', 'ai.modal_report_r3s': 'the latest notes from physio/chiropractor',
    'ai.modal_report_r4': 'Last 7 days', 'ai.modal_report_r4s': 'sleep, HRV, RHR, knee & injury pain, RPE per day',
    'ai.modal_report_r5': 'Environment & questions', 'ai.modal_report_r5s': 'current location, activities and three concrete questions for the AI',
    'ai.modal_report_hint': '~800 tokens · structured text only',
    // Modal — Diagnosis
    'ai.modal_diag_title': 'Injury status',
    'ai.modal_diag_desc': 'Short injury status for your coach or physio. Includes active issues, pain levels and training load.',
    'ai.modal_diag_also': 'Included automatically',
    'ai.modal_diag_r1': 'Pain per injury', 'ai.modal_diag_r1s': 'max pre/during/post/next-day, last 7 days',
    'ai.modal_diag_r2': 'Training load', 'ai.modal_diag_r2s': 'session count and avg RPE last 7 days',
    'ai.modal_diag_hint': '~200 tokens · deterministic, no AI',
    // Modal — Sleep analysis
    'ai.modal_sleep_title': 'Sleep analysis',
    'ai.modal_sleep_desc': 'Exports sleep data for external AI analysis. Choose your period.',
    'ai.modal_sleep_7n': '7 nights', 'ai.modal_sleep_7s': '1 week',
    'ai.modal_sleep_14n': '14 nights', 'ai.modal_sleep_14s': '2 weeks',
    'ai.modal_sleep_30n': '30 nights', 'ai.modal_sleep_30s': '1 month',
    'ai.modal_sleep_includes': 'Per night',
    'ai.modal_sleep_r1': 'Sleep duration', 'ai.modal_sleep_r1s': 'hours and minutes, bedtime and wake time',
    'ai.modal_sleep_r2': 'HRV & RHR', 'ai.modal_sleep_r2s': 'heart rate variability and resting heart rate',
    'ai.modal_sleep_r3': 'Score & architecture', 'ai.modal_sleep_r3s': 'sleep score, deep sleep %, REM % · period averages',
    'ai.modal_sleep_r4': 'Circadian rhythm', 'ai.modal_sleep_r4s': 'bedtime spread — measure of sleep regularity',
    'ai.modal_sleep_hint7': '~300 tokens · 7 nights',
    'ai.modal_sleep_hint14': '~500 tokens · 14 nights',
    'ai.modal_sleep_hint30': '~900 tokens · 30 nights',
    // Modal — Weekly summary
    'ai.copy_ws': 'Copy weekly summary',
    'ai.ws_copied': 'Weekly summary copied to clipboard',
    'ai.modal_ws_title': 'Copy weekly summary',
    'ai.modal_ws_desc': 'Choose which week to copy. Useful for giving an external AI historical context.',
    'ai.modal_ws_preview': 'Preview',
    'ai.modal_ws_hint': 'Select a week',
    // Generic pain log (injury_pain)
    'pain.block_0_10': 'Pain (0–10)',
    'pain.no_severe': 'No active severe injuries',
    'pain.manual_entry': 'Manual entry',
    'pain.manual_saved': 'Manual pain logged',
    'pain.save_err': 'Pain not saved: {msg}',
    'pain.manual_notes_ph': 'E.g. after game, home training…',
    // Login
    'login.sub': 'Log in to continue', 'login.email': 'Email',
    'login.password': 'Password', 'login.email_ph': 'your@email.com',
    'login.btn': 'Log in', 'login.loading': 'Logging in…',
    'login.empty': 'Please enter email and password',
    'login.lockout': 'Too many attempts. Try again in {m} min.',
    'login.attempts_left': '{n} attempts left.',
    'login.q1': 'What year did you start track and field?',
    'login.q2': 'What was your first teacher\'s name?',
    'login.q_error': 'Wrong answer. Try again.',
    'login.q_btn': 'Confirm',
    'login.q_title': 'Security questions',
    'err.load_data': 'Load failed — check connection',
    // Investments
    'inv.select_ticker': 'Select stock…', 'inv.search_placeholder': 'Search ticker or name…',
    'inv.favorite': 'Favorite', 'inv.add_stock': 'Add stock', 'inv.no_matches': 'No matches',
    'inv.no_quote_data': 'No quote data available',
    'inv.quote_error': 'Could not fetch quote',
    'inv.ticker': 'Ticker', 'inv.name': 'Name',
    'inv.status_watchlist': 'Watchlist', 'inv.status_open': 'Open', 'inv.status_closed': 'Closed',
    'inv.locked': 'Locked', 'inv.register_buy': 'Register buy', 'inv.register_sell': 'Register sell',
    'inv.empty_title': 'Select a stock to see details',
    'inv.open': 'Open', 'inv.high': 'High', 'inv.low': 'Low', 'inv.earnings': 'Earnings', 'inv.mcap': 'Market cap', 'inv.range_start': 'Start',
    'inv.tab_analysis': 'Analysis', 'inv.tab_journal': 'Journal',
    'inv.result': 'Result', 'inv.pl_nok': 'P/L (NOK)', 'inv.pl_pct': 'P/L (%)', 'inv.days_held': 'Days held',
    'inv.locked_msg': 'Position is closed — analysis is locked', 'inv.edit': 'Edit', 'inv.edit_analysis': 'Edit analysis',
    'inv.thesis': 'Thesis', 'inv.thesis_why': 'Why', 'inv.thesis_catalyst': 'Catalyst',
    'inv.thesis_horizon': 'Horizon', 'inv.thesis_must': 'Must happen',
    'inv.ta': 'Technical analysis', 'inv.ta_trend': 'Trend', 'inv.ta_rsi': 'RSI', 'inv.ta_support': 'Support',
    'inv.ta_resistance': 'Resistance', 'inv.ta_macd': 'MACD', 'inv.ta_volume': 'Volume comment', 'inv.ta_comment': 'TA comment',
    'inv.plan': 'Plan', 'inv.plan_entry': 'Entry', 'inv.plan_stop': 'Stop loss',
    'inv.plan_t1': 'Target 1', 'inv.plan_t2': 'Target 2', 'inv.plan_horizon': 'Time horizon',
    'inv.risk': 'Risk', 'inv.risk_wrong': 'What could go wrong', 'inv.risk_sell': 'Sell trigger', 'inv.risk_buy_more': 'Buy more trigger',
    'inv.journal_placeholder': 'Write a note…', 'inv.journal_empty': 'No entries yet',
    'inv.jt_note': 'Note', 'inv.jt_buy': 'Buy', 'inv.jt_sell': 'Sell', 'inv.jt_update': 'Update',
    'inv.jt_stop_loss': 'Stop loss', 'inv.jt_target_hit': 'Target hit',
    'inv.buy_date': 'Buy date', 'inv.buy_price': 'Buy price', 'inv.quantity': 'Quantity', 'inv.commission': 'Commission',
    'inv.sell_date': 'Sell date', 'inv.sell_price': 'Sell price', 'inv.quantity_sold': 'Quantity sold',
    'inv.saved': 'Saved', 'inv.err_save': 'Save failed', 'inv.err_ticker': 'Ticker is required', 'inv.err_fields': 'Fill all fields', 'inv.err_duplicate': 'Already added',
    'inv.search_stock': 'Search stock', 'inv.search_stock_placeholder': 'Type name or ticker…', 'inv.selected_stock': 'Selected stock', 'inv.searching': 'Searching…', 'inv.search_error': 'Search failed',
    'inv.no_chart_data': 'No chart data available', 'inv.range_1d': '1D', 'inv.range_1u': '1W', 'inv.range_1m': '1M', 'inv.range_3m': '3M', 'inv.range_1y': '1Y', 'inv.range_5y': '5Y',
    'inv.position': 'Position', 'inv.avg_price': 'Avg. price', 'inv.total_qty': 'Quantity', 'inv.invested': 'Invested',
    'inv.market_value': 'Market value', 'inv.unrealized_pl': 'Unrealized P/L', 'inv.buy_more': 'Buy more',
    'inv.lots_title': 'Buys', 'inv.lots_empty': 'No buys registered', 'inv.lot_remaining': 'remaining',
    'inv.delete_lot': 'Delete buy', 'inv.delete_lot_confirm': 'Delete this buy? Cannot be undone.',
    'inv.sales_title': 'Sales', 'inv.sales_empty': 'No sales registered',
    'inv.err_qty_exceeds': 'Quantity sold exceeds available holdings',
    'inv.tab_position': 'Position',
    // Business
    'biz.accounting': 'Business Command Center', 'biz.revenue': 'Revenue',
    'biz.expense': 'Expense', 'biz.profit': 'Profit',
    'biz.lowtier': 'Too many low-tier clients',
    'biz.customers': 'Customers',
    'biz.customer': 'Customer', 'biz.contact': 'Contact', 'biz.tier': 'Tier',
    'biz.price': 'Price', 'biz.start': 'Start', 'biz.status': 'Status',
    'biz.delete_customer': 'Delete customer',
    'biz.lovable': 'Lovable subscription', 'biz.plan': 'Plan', 'biz.cost_nok': 'Cost (NOK)',
    'biz.leadgen': 'Lead Generator', 'biz.leadgen_type': 'Prompt type',
    'biz.type_research': 'Research', 'biz.type_lovable': 'Lovable website',
    'biz.type_sales': 'Sales outreach',
    'biz.city': 'City', 'biz.industry': 'Industry',
    'biz.maps_paste': 'Google Maps Paste',
    'biz.maps_placeholder': 'Paste everything copied from Google Maps...',
    'biz.brand_colors': 'Brand colors (optional)',
    'biz.copy': 'Copy', 'biz.copied': 'Copied!', 'biz.copy_failed': 'Copy failed',
    'biz.copied_toast': 'Prompt copied',
    'biz.tier_lav': 'Low', 'biz.tier_medium': 'Medium', 'biz.tier_hoy': 'High', 'biz.tier_custom': 'Custom',
    'biz.status_aktiv': 'Active', 'biz.status_pauset': 'Paused', 'biz.status_avsluttet': 'Ended',
  },
};

function t(key, vars = {}) {
  const str = TRANSLATIONS[_lang]?.[key] ?? TRANSLATIONS.no[key] ?? key;
  return String(str).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

// Distanse-koder («60m_flying») skal ALDRI vises rått — alltid «60m (flying)».
// Funker også på koder inni lengre strenger (f.eks. lagret session_type).
function distLabel(d) {
  return String(d ?? '').replace(/(\d+\s*k?m)_([a-zA-ZæøåÆØÅ]+)/g, '$1 ($2)');
}

function fmtLocale() { return _lang === 'en' ? 'en-US' : 'no-NO'; }

// ── Vekt-enhet (kg ↔ lbs) ────────────────────────────────────────────────────
// All lagring/in-memory er ALLTID i kg (kanonisk). Konverter kun ved
// visning (fromKg) og inntasting (toKg).
// Enheten er FRIKOBLET fra språk: localStorage 'unit' ('kg'|'lbs') vinner.
// Uten eksplisitt valg følges språket som før (no=kg, en=lbs) — bakoverkompatibelt.
const LB_PER_KG = 2.2046226218;
function weightUnit() {
  try {
    const u = localStorage.getItem('unit');
    if (u === 'kg' || u === 'lbs') return u;
  } catch (e) {}
  return _lang === 'en' ? 'lbs' : 'kg';
}
function toggleUnit() {
  const next = weightUnit() === 'kg' ? 'lbs' : 'kg';
  try { localStorage.setItem('unit', next); } catch (e) {}
  // Sidene re-rendrer vektvisninger via samme hook som språkbytte
  if (typeof onLangChange === 'function') onLangChange();
  else applyLang();
}
// kg (number|''|null) → tall i gjeldende enhet for visning ('' hvis tomt)
function fromKg(kg) {
  if (kg === '' || kg == null || isNaN(parseFloat(kg))) return '';
  const n = parseFloat(kg);
  return weightUnit() === 'lbs' ? Math.round(n * LB_PER_KG * 10) / 10 : Math.round(n * 100) / 100;
}
// verdi i gjeldende enhet → kg (number, eller NaN hvis ugyldig)
function toKg(val) {
  const n = parseFloat(val);
  if (isNaN(n)) return NaN;
  return weightUnit() === 'lbs' ? Math.round((n / LB_PER_KG) * 100) / 100 : n;
}
// steg for vektinput i gjeldende enhet (2.5 kg ≈ 5 lbs)
function weightStep(big = true) {
  if (weightUnit() === 'lbs') return big ? 5 : 1;
  return big ? 2.5 : 0.5;
}

// ── Felles nav (én kilde — injiseres i <nav class="main-nav" data-nav>) ─────
// Sidene har kun en tom placeholder; markupen her er eneste kilde.
// data-unit på placeholderen → kg/lbs-knapp tas med (kun gym).
// Aktiv fane settes fortsatt av siden selv: [data-p="…"].classList.add('active')
const NAV_TABS = [
  ['ai.html', 'ai', 'nav.ai', 'AI'],
  ['dashboard.html', 'dashboard', 'nav.dashboard', 'Dashboard'],
  ['gym.html', 'gym', 'nav.gym', 'Gym'],
  ['sprint.html', 'sprint', 'nav.sprint', 'Sprint'],
  ['sovn.html', 'sovn', 'nav.sovn', 'Søvn'],
  ['gjoremal.html', 'gjoremal', 'nav.gjoremal', 'Gjøremål'],
  ['kalender.html', 'kalender', 'nav.kalender', 'Kalender'],
  ['treningsplan.html', 'treningsplan', 'nav.treningsplan', 'Treningsoversikt'],
  ['investments.html', 'investments', 'nav.investments', 'Investments'],
  ['business.html', 'business', 'nav.business', 'Business'],
];
function injectNav() {
  const nav = document.querySelector('nav.main-nav[data-nav]');
  if (!nav) return;
  const withUnit = nav.dataset.unit !== undefined;
  nav.innerHTML = `
  <div class="nav-inner">
    <div class="nav-tabs">
      ${NAV_TABS.map(([href, p, key, txt]) =>
        `<a href="${href}" class="nav-tab" data-p="${p}"><span class="nav-tab-label" data-i18n="${key}">${txt}</span><span class="nav-tab-dot" data-dot="${p}" style="display:none"></span></a>`).join('\n      ')}
    </div>
    <div class="nav-actions">
      <a href="treningsdagbok.html" id="diaryLink" class="nav-act" data-i18n-title="nav.pdf" title="Eksporter PDF"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>PDF</a>
      ${withUnit ? '<button id="unitBtn" onclick="toggleUnit()" class="nav-act nav-act-mono" title="kg ↔ lbs">kg</button>' : ''}
      <div id="notifWrap" class="nav-notif-wrap">
        <button id="notifBtn" onclick="toggleNotifPanel(event)" class="nav-act nav-icon" data-i18n-title="notif.title" title="Varsler"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg><span id="notifBadge" class="notif-badge" style="display:none">0</span></button>
        <div id="notifPanel" class="notif-panel" style="display:none"></div>
      </div>
      <button id="langBtn" onclick="toggleLang()" class="nav-act nav-icon">🇺🇸</button>
      <button id="settingsNavBtn" onclick="window.openSettingsModal?.()" class="nav-act nav-icon" title="Innstillinger" style="display:none"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>
      <button onclick="signOut()" class="nav-act" data-i18n="nav.logout">Logg ut</button>
    </div>
  </div>`;
  // Bevar horisontal scroll-posisjon i nav-stripa på tvers av sidebytter
  const navTabs = nav.querySelector('.nav-tabs');
  if (navTabs) {
    const saved = sessionStorage.getItem('navScrollLeft');
    if (saved) navTabs.scrollLeft = +saved;
    navTabs.addEventListener('scroll', () =>
      sessionStorage.setItem('navScrollLeft', navTabs.scrollLeft), { passive: true });
  }
}
injectNav();

// ── Varselsenter: per-side varsler med lest-status ──────────────────────────
// Hvert varsel hører til ÉN side (item.page = nav data-p). Uleste varsler gir:
//   • en rød prikk på riktig fane i toppnav (_renderNavBadges)
//   • et banner-kort øverst når du åpner den siden (_maybeShowPageBanners),
//     som samtidig markerer dem lest (localStorage 'notifRead').
// Bjella er nå et SEKUNDÆRT senter (skjult på mobil via CSS) — primær-signalet
// er prikkene på fanene + banneret. Rødt = ulest varsel, ikke "forfall".
let _notifItems   = [];
let _notifOpen    = false;
let _bannerItems  = [];
let _bannersShown = false;

// section → side (matcher nav data-p). Bestemmer hvilken fane som lyser.
const NOTIF_PAGE = {
  overdue: 'gjoremal', reminder: 'gjoremal', today: 'gjoremal',
  rest: 'gym', calendar: 'kalender', sleep: 'sovn',
};
const NOTIF_ICON = {
  overdue: '⚠️', reminder: '⏰', today: '📋',
  rest: '⏱️', calendar: '📅', sleep: '😴',
};
// "Stille" seksjoner: vises i bjelle-panelet, men gir IKKE rødt badge,
// fane-prikk eller banner. Kalender er ren info — ikke noe å handle på.
const NOTIF_SILENT = new Set(['calendar']);

function _notifCurrentPage() {
  return (location.pathname.split('/').pop() || 'index.html').toLowerCase().replace(/\.html$/, '') || 'index';
}
function _notifTodayStr() { return new Date().toLocaleDateString('sv'); } // YYYY-MM-DD lokal

// ── Lest-status (localStorage; enkel og offline-trygg, synker ikke på tvers
//    av enheter — bevisst valg for en personlig app) ──────────────────────────
function _notifReadMap() { try { return JSON.parse(localStorage.getItem('notifRead') || '{}'); } catch { return {}; } }
function _notifIsRead(key) { return !!_notifReadMap()[key]; }
function _notifMarkRead(keys) {
  const m = _notifReadMap(); let changed = false;
  for (const k of keys) if (!m[k]) { m[k] = Date.now(); changed = true; }
  if (!changed) return;
  const cut = Date.now() - 30 * 864e5;            // rydd nøkler eldre enn 30 dager
  for (const k in m) if (m[k] < cut) delete m[k];
  localStorage.setItem('notifRead', JSON.stringify(m));
}

// Kalenderhendelser i dag (gjenbruker dashboardets sessionStorage-cache).
async function _notifCalendarToday() {
  try {
    const CK = `cal_cache_${today()}`;
    const cached = sessionStorage.getItem(CK);
    if (cached) {
      const { ts, data } = JSON.parse(cached);
      if (Date.now() - ts < 30 * 60 * 1000 && data) return data.today || [];
    }
    const { data: { session } } = await db.auth.getSession();
    if (!session) return [];
    const res = await fetch('/api/google-calendar', { headers: { Authorization: `Bearer ${session.access_token}` } });
    if (!res.ok) return [];
    const data = await res.json();
    sessionStorage.setItem(CK, JSON.stringify({ ts: Date.now(), data }));
    return data.today || [];
  } catch { return []; }
}

async function loadNotifications() {
  if (typeof db === 'undefined' || !db) return null;   // db ikke klar enda
  const nowIso   = new Date().toISOString();
  const todayStr = _notifTodayStr();
  const items = [];
  try {
    // 1) Gjøremål → Gjøremål. Ett item per todo: forfalt > påminnelse > i dag.
    const { data: todos } = await db.from('todos')
      .select('id,title,due_date,remind_at,completed')
      .eq('completed', false);
    for (const td of todos || []) {
      const overdue = td.due_date && td.due_date < todayStr;
      const isToday = td.due_date === todayStr;
      const remind  = td.remind_at && td.remind_at <= nowIso;
      let section = null;
      if (overdue)      section = 'overdue';
      else if (remind)  section = 'reminder';
      else if (isToday) section = 'today';
      if (!section) continue;
      items.push({
        key: `todo:${td.id}:${section}`, section, page: 'gjoremal',
        title: td.title,
        when: section === 'reminder' ? td.remind_at : td.due_date,
        remindAt: (section === 'overdue' && remind) ? td.remind_at : null,
        url: 'gjoremal.html',
      });
    }
    // 2) Hviletimere → Gym.
    const { data: rests } = await db.from('scheduled_notifications')
      .select('id,title,fire_at,url')
      .eq('kind', 'rest').eq('sent', false).eq('cancelled', false)
      .gt('fire_at', nowIso);
    for (const r of rests || [])
      items.push({ key: `rest:${r.id}`, section: 'rest', page: 'gym', title: r.title, when: r.fire_at, url: r.url || 'gym.html' });
    // 3) Søvn → Søvn: lav score i natt.
    try {
      const { data: sleep } = await db.from('health_data')
        .select('date,sleep_score').eq('date', todayStr).maybeSingle();
      if (sleep && sleep.sleep_score != null && sleep.sleep_score < 70) {
        items.push({ key: `sleep:${todayStr}`, section: 'sleep', page: 'sovn',
          i18nTitle: 'notif.sleep_low_title', score: sleep.sleep_score,
          when: todayStr + 'T08:00:00', url: 'sovn.html' });
      }
    } catch (e) {}
    // 4) Kalender → Kalender: hendelser i dag som ikke er passert.
    for (const ev of await _notifCalendarToday()) {
      items.push({ key: `cal:${ev.id}`, section: 'calendar', page: 'kalender',
        title: ev.summary || t('dash.untitled'),
        when: ev.start?.dateTime || (ev.start?.date ? ev.start.date + 'T00:00:00' : nowIso),
        allDay: !ev.start?.dateTime, url: 'kalender.html' });
    }
  } catch (e) { return null; }

  _notifItems = items;
  _renderNotifBadge();
  _renderNavBadges();
  if (_notifOpen) _renderNotifPanel();
  _maybeShowPageBanners();
  return items;
}

// Driver badge + fane-prikker + bannere — stille seksjoner holdes utenfor.
function _unreadItems() { return _notifItems.filter(i => !NOTIF_SILENT.has(i.section) && !_notifIsRead(i.key)); }
// Driver bjelle-panelet — stille seksjoner vises alltid; resten kun når ulest.
function _panelItems() { return _notifItems.filter(i => NOTIF_SILENT.has(i.section) || !_notifIsRead(i.key)); }

// ── Tekst-hjelpere (tospråklig) ─────────────────────────────────────────────
function _notifClock(iso) {
  return new Date(iso).toLocaleTimeString(fmtLocale(), { hour: '2-digit', minute: '2-digit' });
}
function _notifTitle(i) { return i.i18nTitle ? t(i.i18nTitle) : (i.title || ''); }
function _notifSub(i) {
  switch (i.section) {
    case 'sleep':    return t('notif.sleep_low_sub', { score: i.score });
    case 'calendar': return i.allDay ? t('kal.whole_day') : _notifClock(i.when);
    case 'rest':
    case 'reminder': return _notifClock(i.when);
    case 'overdue':
    case 'today': {
      const base = fmtDate(i.when);
      return i.remindAt ? `${base} · ⏰ ${_notifClock(i.remindAt)}` : base;
    }
    default: return '';
  }
}

// ── Bjelle-senter (sekundært; desktop) ──────────────────────────────────────
function _renderNotifBadge() {
  const b = document.getElementById('notifBadge');
  if (!b) return;
  const n = _unreadItems().length;
  b.textContent = n > 9 ? '9+' : String(n);
  b.style.display = n > 0 ? 'flex' : 'none';
  const btn = document.getElementById('notifBtn');
  if (btn) btn.classList.toggle('has-notif', n > 0);
}

function _renderNotifPanel() {
  const panel = document.getElementById('notifPanel');
  if (!panel) return;
  const groups = [
    ['overdue',  t('notif.overdue')],
    ['reminder', t('notif.reminders')],
    ['calendar', t('notif.calendar')],
    ['rest',     t('notif.rest_timers')],
    ['sleep',    t('notif.sleep')],
    ['today',    t('notif.today')],
  ];
  const shown = _panelItems();
  let html = `<div class="notif-head">${t('notif.title')}</div>`;
  let any = false;
  for (const [section, label] of groups) {
    const list = shown.filter(i => i.section === section);
    if (!list.length) continue;
    any = true;
    html += `<div class="notif-group-label">${label}</div>`;
    html += list.map(i => {
      const todoId = i.key.startsWith('todo:') ? i.key.split(':')[1] : null;
      const canOpen = todoId && typeof openDetail === 'function';
      const extraAttr = canOpen
        ? `onclick="event.preventDefault();_notifMarkRead(['${i.key}']);_notifOpen=false;_closeNotifPanel(document.getElementById('notifPanel'));openDetail('${todoId}')"`
        : '';
      return `<a class="notif-item notif-${section}" href="${i.url}" ${extraAttr}>
        <span class="notif-dot"></span>
        <span class="notif-text">${escHtml(_notifTitle(i))}</span>
        <span class="notif-when">${escHtml(_notifSub(i))}</span>
      </a>`;
    }).join('');
  }
  if (!any) html += `<div class="notif-empty">${t('notif.empty')}</div>`;
  panel.innerHTML = html;
}

// Glid/fade panelet inn og ut via .menu-anim/.open. Ved lukking venter vi på
// transitionend før display:none (faller tilbake til timeout under reduced-motion).
function _openNotifPanel(panel) {
  panel.classList.add('menu-anim');
  panel.style.display = 'block';
  void panel.offsetWidth;                 // tving reflow så .open animerer fra lukket-tilstand
  panel.classList.add('open');
}
function _closeNotifPanel(panel) {
  panel.classList.remove('open');
  const done = () => { if (!panel.classList.contains('open')) panel.style.display = 'none'; };
  if (_prefersReducedMotion && _prefersReducedMotion()) { done(); return; }
  let fired = false;
  panel.addEventListener('transitionend', function te() {
    fired = true; panel.removeEventListener('transitionend', te); done();
  }, { once: true });
  setTimeout(() => { if (!fired) done(); }, 220);   // sikkerhetsnett
}

function toggleNotifPanel(ev) {
  if (ev) ev.stopPropagation();
  _notifOpen = !_notifOpen;
  const panel = document.getElementById('notifPanel');
  if (!panel) return;
  if (_notifOpen) {
    _openNotifPanel(panel);
    _renderNotifPanel();                  // vis det vi har umiddelbart
    loadNotifications().catch(() => {});  // og hent ferskt (db garantert klar her)
  } else {
    _closeNotifPanel(panel);
  }
}

document.addEventListener('click', (e) => {
  if (!_notifOpen) return;
  const wrap = document.getElementById('notifWrap');
  if (wrap && !wrap.contains(e.target)) {
    _notifOpen = false;
    const p = document.getElementById('notifPanel');
    if (p) _closeNotifPanel(p);
  }
});

// ── Per-side prikker i toppnav ──────────────────────────────────────────────
function _renderNavBadges() {
  const unreadPages = new Set(_unreadItems().map(i => i.page));
  document.querySelectorAll('.nav-tab-dot[data-dot]').forEach(d => {
    d.style.display = unreadPages.has(d.dataset.dot) ? 'block' : 'none';
  });
}

// ── Banner-kort øverst på siden ─────────────────────────────────────────────
function _ensureBannerWrap() {
  let w = document.getElementById('pageBannerWrap');
  if (w) return w;
  w = document.createElement('div');
  w.id = 'pageBannerWrap';
  w.className = 'page-banner-wrap';
  const nav = document.querySelector('nav.main-nav');
  if (nav && nav.parentNode) nav.parentNode.insertBefore(w, nav.nextSibling);
  else document.body.insertBefore(w, document.body.firstChild);
  return w;
}

function _renderPageBanners(items) {
  _bannerItems = items;
  const w = _ensureBannerWrap();
  if (!items.length) { w.innerHTML = ''; return; }
  w.innerHTML = items.map((i, idx) => {
    const todoId = i.key.startsWith('todo:') ? i.key.split(':')[1] : null;
    const canOpen = todoId && typeof openDetail === 'function';
    const bodyExtra = canOpen
      ? `onclick="event.preventDefault();_notifMarkRead(['${i.key}']);openDetail('${todoId}')"`
      : '';
    return `
    <div class="page-banner page-banner-${i.section}" data-banner="${idx}">
      <span class="page-banner-icon">${NOTIF_ICON[i.section] || '🔔'}</span>
      <a class="page-banner-body" href="${i.url}" ${bodyExtra}>
        <span class="page-banner-title">${escHtml(_notifTitle(i))}</span>
        <span class="page-banner-sub">${escHtml(_notifSub(i))}</span>
      </a>
      <button class="page-banner-close" aria-label="${t('notif.dismiss')}" onclick="_dismissBanner(${idx})">✕</button>
    </div>`;
  }).join('');
}
function _dismissBanner(idx) {
  const el = document.querySelector(`[data-banner="${idx}"]`);
  if (!el) return;
  el.classList.add('closing');
  setTimeout(() => el.remove(), 200);
}

// Vises én gang per sidelast: uleste varsler for DENNE siden → banner + lest.
function _maybeShowPageBanners() {
  if (_bannersShown) return;
  const page = _notifCurrentPage();
  const mine = _unreadItems().filter(i => i.page === page);
  if (!mine.length) return;
  _bannersShown = true;
  _renderPageBanners(mine);
  _notifMarkRead(mine.map(i => i.key));   // å åpne siden = varselet er sett
  _renderNotifBadge();
  _renderNavBadges();
}

// Re-render dynamisk varsel-tekst ved språkbytte (kalles fra toggleLang).
function _relangNotifs() {
  _renderNotifPanel();
  _renderNavBadges();
  if (_bannerItems.length) _renderPageBanners(_bannerItems);
}

// Førstegangshenting: poll til global `db` finnes (maks ~5 s @ 150 ms).
(function _notifBoot() {
  let tries = 0;
  const iv = setInterval(() => {
    if (typeof db !== 'undefined' && db) { clearInterval(iv); loadNotifications().catch(() => {}); }
    else if (++tries > 33) clearInterval(iv);
  }, 150);
})();

function applyLang() {
  document.documentElement.lang = _lang === 'en' ? 'en' : 'no';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  // data-i18n-html: for strenger som inneholder markup (f.eks. <br>)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });
  const btn = document.getElementById('langBtn');
  if (btn) btn.textContent = _lang === 'no' ? '🇺🇸' : '🇳🇴';
  const ub = document.getElementById('unitBtn');
  if (ub) ub.textContent = weightUnit();
}

// ── Offline-status + Service Worker (alle sider) ────────────────────────────
window.addEventListener('offline', () => { try { toast(t('offline_now'), 'err'); } catch (e) {} });
window.addEventListener('online',  () => { try { toast(t('online_again')); } catch (e) {} });
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
  // SW har hentet en ny sideversjon i bakgrunnen (SWR) — si ifra, maks én gang
  let _swToastShown = false;
  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data?.type === 'SW_UPDATED' && !_swToastShown) {
      _swToastShown = true;
      try { toast(t('sw_updated')); } catch (err) {}
    }
  });
}

function toggleLang() {
  _lang = _lang === 'no' ? 'en' : 'no';
  localStorage.setItem('lang', _lang);
  applyLang();
  // Varselsenter eies av utils.js — re-render uavhengig av side
  _relangNotifs();
  // Re-render dynamic content if a page-level function exists
  if (typeof onLangChange === 'function') onLangChange();
}

// ── Session note expand/collapse ─────────────────────────────────────────────
function toggleNoteExpand(btn) {
  const wrap = btn.previousElementSibling;
  const expanded = wrap.classList.toggle('expanded');
  btn.textContent = expanded ? t('note.collapse') : t('note.expand');
}

// Render a note block with icon + expand toggle.
// noteText: raw string, returns HTML string.
const _NOTE_ICON = `<svg class="snp-icon" width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M13 1H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h2l3 2 3-2h2a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M5 6h6M5 9h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

function renderNoteBlock(noteText) {
  if (!noteText) return '';
  return `<div class="sess-notes-preview">${_NOTE_ICON}${escHtml(noteText)}</div>`;
}

// ── Core utilities ────────────────────────────────────────────────────────────
let _tt;

function toast(msg, type = 'ok', action = null) {
  const el = document.getElementById('toast');
  clearTimeout(_tt);
  el.className = `toast ${type} show`;
  if (action && action.label && typeof action.fn === 'function') {
    el.innerHTML = '';
    const span = document.createElement('span');
    span.textContent = msg;
    const btn = document.createElement('button');
    btn.className = 'toast-action';
    btn.textContent = action.label;
    btn.onclick = () => {
      clearTimeout(_tt);
      el.classList.remove('show');
      el.style.pointerEvents = '';
      try { action.fn(); } catch (e) {}
    };
    el.appendChild(span);
    el.appendChild(btn);
    el.style.pointerEvents = 'auto';
    _tt = setTimeout(() => { el.classList.remove('show'); el.style.pointerEvents = ''; }, 6000);
  } else {
    el.textContent = msg;
    el.style.pointerEvents = '';
    _tt = setTimeout(() => el.classList.remove('show'), 3000);
  }
}

async function signOut() {
  localStorage.removeItem('ai_chat_history');
  localStorage.removeItem('ai_draft');
  if (db) await db.auth.signOut();
  window.location.href = 'login.html';
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function fmtDate(ds) {
  if (!ds) return '';
  const d = new Date(ds + 'T12:00:00');
  if (_lang === 'en') {
    // English: mm.dd.yyyy
    return `${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}.${String(d.getFullYear())}`;
  } else {
    // Norwegian: dd.mm.yyyy
    return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getFullYear())}`;
  }
}

// Tospråklig time-/minutt-format fra desimaltimer: 6.77 → "6t 46m" / "6h 46m".
// Bruk overalt der søvn/varighet i timer vises — aldri rå desimal + "t".
function fmtHM(h) {
  if (h == null || isNaN(h) || h <= 0) return '–';
  const hu = t('dash.hr_unit'), mu = t('dash.min_unit');
  const mins = Math.round(h * 60);
  const hh = Math.floor(mins / 60), mm = mins % 60;
  if (hh <= 0) return `${mm}${mu}`;
  return mm > 0 ? `${hh}${hu} ${mm}${mu}` : `${hh}${hu}`;
}

function painColor(s) {
  if (s === null || s === undefined) return 'var(--text-tertiary)';
  if (s <= 3) return 'var(--success)';
  if (s <= 5) return 'var(--warning)';
  if (s <= 7) return 'rgba(242,130,60,1)';
  return 'var(--danger)';
}

// Delt RPE-slider (1–100). id = unik id på <input>. value = startverdi (null = tom).
// Returnerer HTML. Les verdien med rpeValue(id) → tall eller null.
function rpeSliderHTML(id, value = null) {
  const v = (value == null || value === '') ? '' : value;
  const shown = v === '' ? '–' : v;
  const cls = v === '' ? 'rpe-slider-val empty' : 'rpe-slider-val';
  return `<div class="rpe-slider-wrap">
    <div class="rpe-slider-top">
      <span>${t('sprint.rpe')}</span>
      <span class="${cls}" id="${id}-val">${shown}</span>
    </div>
    <input type="range" min="0" max="100" step="5" value="${v === '' ? 0 : v}" id="${id}"
      class="rpe-slider" data-touched="${v === '' ? '0' : '1'}"
      oninput="rpeSliderInput('${id}')">
    <div class="rpe-slider-hint">${t('rpe.hint')}</div>
  </div>`;
}
function rpeSliderInput(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.dataset.touched = '1';
  const valEl = document.getElementById(id + '-val');
  if (valEl) { valEl.textContent = el.value; valEl.className = 'rpe-slider-val'; }
}
// Verdi: null hvis aldri rørt (= ikke logget), ellers tallet (0 tillatt for "rolig dag").
function rpeValue(id) {
  const el = document.getElementById(id);
  if (!el || el.dataset.touched !== '1') return null;
  const n = parseInt(el.value, 10);
  return isNaN(n) ? null : n;
}

// ── RIR-slider (gym) ────────────────────────────────────────────────────────
// Filip tenker i RIR (reps i reserve) på styrke, ikke RPE. Slideren VISER RIR 0–5,
// men vi LAGRER fortsatt RPE (0–100) i gym_log.rpe slik at belastning/ACWR/AI er
// uendret. Mapping: RPE = 100 − RIR×10  (RIR 0→100, 3→70, 5→50).
// `rpe`-arg = lagret RPE (for redigering av eksisterende økt) eller null = ny økt.
function rirSliderHTML(id, rpe = null) {
  const rir = (rpe == null || rpe === '') ? '' : Math.max(0, Math.min(5, Math.round((100 - rpe) / 10 * 2) / 2));
  const shown = rir === '' ? '–' : rir;
  const cls = rir === '' ? 'rpe-slider-val empty' : 'rpe-slider-val';
  return `<div class="rpe-slider-wrap">
    <div class="rpe-slider-top">
      <span>${t('rir.label')}</span>
      <span class="${cls}" id="${id}-val">${shown}</span>
    </div>
    <input type="range" min="0" max="5" step="0.5" value="${rir === '' ? 3 : rir}" id="${id}"
      class="rpe-slider" data-touched="${rir === '' ? '0' : '1'}"
      oninput="rpeSliderInput('${id}')">
    <div class="rpe-slider-hint">${t('rir.hint')}</div>
  </div>`;
}
// Leser RIR-slideren → lagret RPE (0–100), eller null hvis aldri rørt.
function rirValue(id) {
  const el = document.getElementById(id);
  if (!el || el.dataset.touched !== '1') return null;
  const rir = parseFloat(el.value);
  if (isNaN(rir)) return null;
  return Math.max(0, Math.min(100, 100 - rir * 10));
}

// ── Smerte-måler (0–10) ─────────────────────────────────────────────────────
// Delt komponent. Én rad med 11 trykkbare segmenter; ett trykk setter verdi og
// fyller 0..v farget av painColor(v). value = startverdi (null/'' = ikke logget,
// = tall vises "–", ingen fyll). MERK: 0 er en GYLDIG logget verdi (≠ ikke logget) —
// derfor sjekkes value != null eksplisitt, aldri "if (value)".
// Tilstand lagres i DOM (data-v + data-touched på wrapperen) så flere målere kan
// leve samtidig. Les med painMeterValue(id) → tall|null.
// opts: { label } = valgfri inline-etikett til venstre (allerede oversatt tekst).
//       { onset } = JS-uttrykk som kjøres ETTER at måleren er oppdatert, for
//                   live-kontekster som persisterer hvert trykk. Bruk `$v` som
//                   plassholder for verdien, f.eks. "selectSbPain($v)" eller
//                   "selectGymInjuryPain('abc','before',$v)". Utelat for
//                   "les ved lagring"-bruk (les da med painMeterValue(id)).
function painMeterHTML(id, value = null, opts = {}) {
  const touched = (value != null && value !== '');
  const v = touched ? Math.max(0, Math.min(10, Math.round(Number(value)))) : null;
  const col = touched ? painColor(v) : 'var(--text-tertiary)';
  const label = opts.label ? `<span class="pain-meter-label">${opts.label}</span>` : '';
  let segs = '';
  for (let i = 0; i <= 10; i++) {
    const fill = touched && i <= v;
    const sty = fill ? ` style="background:${col};border-color:${col}"` : '';
    const onset = opts.onset ? (';' + opts.onset.replace(/\$v/g, i)) : '';
    segs += `<button type="button" class="pain-seg${fill ? ' fill' : ''}" data-i="${i}"${sty}`
      + ` aria-label="${i}" onclick="painMeterSet('${id}',${i})${onset}"></button>`;
  }
  return `<div class="pain-meter" id="${id}" role="group" aria-label="${opts.label || t('pain.meter')}"`
    + ` data-v="${touched ? v : ''}" data-touched="${touched ? '1' : '0'}">`
    + `${label}<div class="pain-meter-segs">${segs}</div>`
    + `<span class="pain-meter-num" id="${id}-num" style="color:${col}">${touched ? v : '–'}</span></div>`;
}
// onclick-handler per segment: toggle verdi (klikk samme igjen = fjern).
function painMeterSet(id, v) {
  const wrap = document.getElementById(id);
  if (!wrap) return;
  const cur = wrap.dataset.v === '' ? null : parseInt(wrap.dataset.v, 10);
  const newV = (cur === v) ? null : v;
  wrap.dataset.v = newV ?? '';
  wrap.dataset.touched = (newV != null) ? '1' : '0';
  wrap.querySelectorAll('.pain-seg').forEach(b => {
    const i = parseInt(b.dataset.i, 10);
    if (newV != null && i <= newV) { b.classList.add('fill'); b.style.background = painColor(newV); b.style.borderColor = painColor(newV); }
    else { b.classList.remove('fill'); b.style.background = ''; b.style.borderColor = ''; }
  });
  const num = document.getElementById(id + '-num');
  if (num) { num.textContent = (newV != null) ? newV : '–'; num.style.color = (newV != null) ? painColor(newV) : 'var(--text-tertiary)'; }
}
// Verdi: null hvis aldri rørt (= ikke logget), ellers tallet (0 er gyldig).
function painMeterValue(id) {
  const wrap = document.getElementById(id);
  if (!wrap || wrap.dataset.touched !== '1') return null;
  const n = parseInt(wrap.dataset.v, 10);
  return isNaN(n) ? null : n;
}

async function getConfig() {
  const cached = sessionStorage.getItem('app_config');
  if (cached) return JSON.parse(cached);
  const r = await fetch('/api/config');
  if (!r.ok) throw new Error('Config-tjeneste svarte ' + r.status);
  const cfg = await r.json();
  if (cfg.error) throw new Error(cfg.error);
  sessionStorage.setItem('app_config', JSON.stringify(cfg));
  return cfg;
}

// ── Web Push (varsler som fyrer mens du er i andre apper) ───────────────────
// Hviletimeren og gjøremål-påminnelser bruker dette. iOS dreper service
// worker-en i bakgrunnen, så ekte Web Push (VAPID) er eneste pålitelige vei.
// MERK iOS: krever at PWA-en er lagt til på Hjem-skjermen først.
function notifSupported() {
  return ('Notification' in window) && ('serviceWorker' in navigator) && ('PushManager' in window);
}
function notifPermission() {
  return ('Notification' in window) ? Notification.permission : 'unsupported';
}
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}
async function getAccessToken() {
  try {
    if (typeof db === 'undefined' || !db) return null;
    const { data } = await db.auth.getSession();
    return data?.session?.access_token || null;
  } catch { return null; }
}

// Be om tillatelse + abonner. MÅ kalles fra en bruker-gest (klikk) pga iOS.
async function enableNotifications(opts = {}) {
  if (!notifSupported()) { toast(t('notif.unsupported'), 'err'); return false; }
  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isIOS && !standalone) { toast(t('notif.ios_install'), 'err'); return false; }

  let perm = Notification.permission;
  if (perm === 'default') { try { perm = await Notification.requestPermission(); } catch { perm = 'denied'; } }
  if (perm !== 'granted') { toast(t('notif.denied'), 'err'); return false; }

  try {
    const cfg = await getConfig();
    if (!cfg.vapidPublicKey) { toast(t('notif.no_vapid'), 'err'); return false; }
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(cfg.vapidPublicKey),
      });
    }
    const token = await getAccessToken();
    const r = await fetch('/api/push?action=subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ subscription: sub.toJSON() }),
    });
    if (!r.ok) throw new Error('subscribe ' + r.status);
    if (!opts.silent) toast(t('notif.enabled'));
    return true;
  } catch (e) {
    toast(t('notif.error'), 'err');
    return false;
  }
}

// Sørg for at varsler er klare. Hvis ikke gitt tillatelse → prøv enable (gest).
async function ensurePushReady() {
  if (!notifSupported()) return false;
  if (Notification.permission === 'granted') {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        // Re-lagre gjeldende abonnement (idempotent upsert) så serveren alltid
        // har nøyaktig ett, riktig abonnement for denne enheten.
        const token = await getAccessToken();
        if (token) fetch('/api/push?action=subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ subscription: sub.toJSON() }),
        }).catch(() => {});
        return true;
      }
    } catch {}
    return enableNotifications({ silent: true });
  }
  return enableNotifications();
}

// Planlegg et server-levert varsel.
// opts: { kind, title, body, tag, url, delaySeconds | fireAt, todoId }
async function schedulePush(opts) {
  try {
    const token = await getAccessToken();
    if (!token) return null;
    const r = await fetch('/api/push?action=schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(opts),
    });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

// Kanseller et planlagt varsel. opts: { id } eller { todoId }
async function cancelPush(opts) {
  try {
    const token = await getAccessToken();
    if (!token) return;
    await fetch('/api/push?action=cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(opts),
    });
  } catch {}
}

// ── Auto-hent søvn ────────────────────────────────────────────────────────
// Henter søvn fra Garmin for de siste dagene som mangler i Supabase. Null oppsett
// for brukeren: kjøres når en side lastes. Trygt å kalle ofte (throttlet 10 min +
// server-vakt hopper over dager som alt finnes). Krever global `db` på siden.
// Returnerer true hvis ny søvndata ble lagret.
async function autoSyncSleep(days = 3) {
  if (typeof db === 'undefined' || !db) return false;
  const THROTTLE_MS = 10 * 60 * 1000;
  if (Date.now() - (+(localStorage.getItem('sleep_autosync_at') || 0)) < THROTTLE_MS) return false;
  const fmt = d => d.toLocaleDateString('sv');               // YYYY-MM-DD lokal
  const dates = Array.from({ length: days }, (_, n) => {
    const d = new Date(); d.setDate(d.getDate() - n); return fmt(d);
  });
  let have = new Set();
  try {
    const { data } = await db.from('health_data').select('date,sleep_score,sleep_hours').in('date', dates);
    have = new Set((data || []).filter(r => r.sleep_score || r.sleep_hours).map(r => r.date));
  } catch { return false; }
  const missing = dates.filter(d => !have.has(d));
  if (!missing.length) return false;
  localStorage.setItem('sleep_autosync_at', String(Date.now()));
  let got = false;
  for (const d of missing) {                                 // nyeste først
    try {
      const r = await fetch(`/api/garmin-sync?date=${d}`);
      const j = await r.json();
      if (j?.ok && j.data && (j.data.sleep_hours || j.data.sleep_score)) got = true;
    } catch { /* nettverk/timeout – prøver igjen neste gang siden lastes */ }
  }
  return got;
}

// ── Aktivitetsvektet belastning ──────────────────────────────────────────────
// source: 'gym'|'sprint'|'activity'  typeText = session_type/type/activity_type
// labelText = activity_label (fotball-nivå lagret her; sprint-nivå kodet i typeText-suffiks)
// Sprint/fotball-nivå: ':lav'=1.5  ':middels'=2.25  ':høy'/ingen=3.0 (old data → maks)
function loadMultiplier(source, typeText, labelText) {
  const s = (typeText  || '').toLowerCase();
  const l = (labelText || '').toLowerCase();
  if (source === 'gym') return 1.0;
  if (source === 'sprint') {
    const lvl = s.split(':')[1] || '';
    if (lvl === 'lav')     return 1.5;
    if (lvl === 'middels') return 2.25;
    return 3.0;
  }
  // activity source
  if (/fotball|soccer/.test(s)) {
    if (l === 'lav')     return 1.5;
    if (l === 'middels') return 2.25;
    return 3.0;
  }
  if (/padel|padle/.test(s))                             return 3.0;
  if (/basket/.test(s))                                  return 3.0;
  if (/løp|jog|run/.test(s))                             return 1.5;
  if (/frisbee|disc.?golf/.test(s))                      return 1.0;
  if (/bading|swim.*rec|rec.*swim/.test(s))              return 0.5;
  if (/svøm|swim|sykl|cycl|bike|ellipse|rehab/.test(s)) return 1.0;
  if (/rolig|lett|easy/.test(s))                         return 1.5;
  return 1.5;
}

// ── Nav-prefetch ──────────────────────────────────────────────────────────
// Varmer SW-cachen for neste side ved hover (desktop) / touchstart (mobil),
// så navigasjonen treffer cache. fetch() går gjennom SW-en (SWR) og funker
// derfor i både Safari og Chrome (<link rel=prefetch> gjør ikke det i Safari).
// Selve sideovergangen håndteres av View Transitions i styles.css — ingen JS.
// ── Offline-banner (vedvarende, alle sider) ────────────────────────────────
// Toast (over) er flyktig; banneret blir stående så man ser det også når en
// side åpnes mens man ALLEREDE er offline (vanlig på reise/ustabilt nett).
// Dashboard har sin egen banner i HTML — der hopper vi over.
function _initOfflineBanner() {
  let b = document.getElementById('offlineBanner');
  if (!b) {
    b = document.createElement('div');
    b.id = 'offlineBanner';
    b.setAttribute('data-i18n', 'dash.offline'); // applyLang() oppdaterer ved språkbytte
    b.style.cssText = 'display:none;position:fixed;top:0;left:0;right:0;z-index:200;' +
      'background:rgba(255,107,107,0.12);border-bottom:1px solid rgba(255,107,107,0.3);' +
      'padding:8px 16px;text-align:center;font-size:11px;font-family:var(--font-mono);' +
      'color:var(--danger);letter-spacing:0.04em';
    b.textContent = t('dash.offline');
    document.body.appendChild(b);
  }
  const update = () => { b.style.display = navigator.onLine ? 'none' : ''; };
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update();
}

/* ── Delte animasjons-hjelpere (brukes av alle sider) ──────────────────────
   Alle respekterer prefers-reduced-motion ved å hoppe rett til sluttverdi. */
const _prefersReducedMotion = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* countUp(el, to, opts): teller opp et tall ~600ms ved last.
   opts.decimals (default 0), opts.suffix/prefix, opts.duration (ms).
   Hopper til sluttverdi ved reduced-motion eller hvis 'to' ikke er endelig. */
function countUp(el, to, opts = {}) {
  if (!el) return;
  const { decimals = 0, prefix = '', suffix = '', duration = 600 } = opts;
  const fmt = v => prefix + Number(v).toFixed(decimals) + suffix;
  if (!isFinite(to)) { el.textContent = fmt(to || 0); return; }
  if (_prefersReducedMotion()) { el.textContent = fmt(to); return; }
  el.classList.add('counting');
  const start = performance.now();
  const from = 0;
  const tick = now => {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
    el.textContent = fmt(from + (to - from) * eased);
    if (p < 1) requestAnimationFrame(tick);
    else { el.textContent = fmt(to); el.classList.remove('counting'); }
  };
  requestAnimationFrame(tick);
}

/* countUpAll(root): kjør count-up på alle [data-countup] under root.
   data-countup="<tall>", data-cu-decimals, data-cu-suffix, data-cu-prefix. */
function countUpAll(root = document) {
  root.querySelectorAll('[data-countup]').forEach(el => {
    if (el.dataset.cuDone) return;
    el.dataset.cuDone = '1';
    countUp(el, parseFloat(el.getAttribute('data-countup')), {
      decimals: parseInt(el.dataset.cuDecimals || '0', 10),
      prefix: el.dataset.cuPrefix || '',
      suffix: el.dataset.cuSuffix || '',
    });
  });
}

/* staggerIn(els): legg .anim-in med trinnvis forsinkelse (maks 5 trinn). */
function staggerIn(els) {
  const list = [...els];
  list.forEach((el, i) => {
    el.style.setProperty('--anim-i', Math.min(i, 4));
    el.classList.add('anim-in');
  });
}

/* fadeInChart(canvasEl): kall etter at Chart.js har rendret. */
function fadeInChart(canvas) {
  if (!canvas) return;
  canvas.classList.add('chart-fade');
  requestAnimationFrame(() => requestAnimationFrame(() => canvas.classList.add('chart-ready')));
}

/* removeWithCollapse(el, after): kollaps-ut animasjon, så fjern fra DOM. */
function removeWithCollapse(el, after) {
  if (!el) { if (after) after(); return; }
  if (_prefersReducedMotion()) { el.remove(); if (after) after(); return; }
  el.classList.add('li-leave');
  el.addEventListener('animationend', () => { el.remove(); if (after) after(); }, { once: true });
}

document.addEventListener('DOMContentLoaded', () => {
  _initOfflineBanner();
  const warmed = new Set();
  const warm = href => {
    if (!href || href.startsWith('#') || href.startsWith('javascript') || warmed.has(href)) return;
    warmed.add(href);
    try { fetch(href, { credentials: 'same-origin' }).catch(() => {}); } catch (e) {}
  };
  document.querySelectorAll('a.nav-tab[href]').forEach(a => {
    const href = a.getAttribute('href');
    a.addEventListener('pointerenter', () => warm(href));
    a.addEventListener('touchstart',   () => warm(href), { passive: true });
  });

  // Opt-in entrance: <body data-entrance> → staggret fade+slide-up på topp-kortene.
  // Kun statiske kort som finnes ved last; JS-rendret innhold styrer sin egen anim.
  if (document.body.hasAttribute('data-entrance') && !_prefersReducedMotion()) {
    const root = document.querySelector('.page, main, .sovn-page, .gm-shell') || document.body;
    const cards = [...root.children].filter(c => c.matches('.card, [data-anim-card]'));
    if (cards.length) staggerIn(cards);
  }
});