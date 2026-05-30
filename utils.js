// utils.js — shared utilities, loaded as a plain script (no module)

// ── i18n ──────────────────────────────────────────────────────────────────────
let _lang = localStorage.getItem('lang') || 'no';

const TRANSLATIONS = {
  no: {
    // Nav
    'nav.ai': 'AI', 'nav.dashboard': 'Dashboard', 'nav.gym': 'Gym',
    'nav.sprint': 'Sprint', 'nav.sovn': 'Søvn', 'nav.gjoremal': 'Gjøremål',
    'nav.kalender': 'Kalender', 'nav.treningsplan': 'Treningsoversikt',
    'nav.logout': 'Logg ut',
    // Common
    'loading': 'Laster…', 'no_data': 'Ingen data', 'save': 'Lagre',
    'cancel': 'Avbryt', 'delete': 'Slett', 'close': 'Lukk', 'add': 'Legg til',
    'edit': 'Rediger', 'reset': 'Nullstill', 'date': 'Dato', 'notes': 'Notater',
    // Knee pain
    'knee.before': 'Før', 'knee.during': 'Under', 'knee.after': 'Etter',
    'knee.dayafter': 'Dagen etter',
    'knee.before_short': 'FØR', 'knee.during_short': 'UNDER',
    'knee.after_short': 'ETTER', 'knee.dayafter_short': 'D.ETTER',
    'knee.before_session': 'Før økt', 'knee.during_session': 'Under økt',
    'knee.after_session': 'Etter økt', 'knee.pain': 'Knesmerte',
    'knee.pain_0_10': 'Knesmerte (0–10)',
    // Session types
    'session.strength_power': 'Styrke Power',
    'session.strength_capacity': 'Styrke Kapasitet',
    'session.mobility': 'Sirkulasjon & Mobilitet',
    'session.daily_rehab': 'Daglig Rehab',
    'session.rest_day': 'Hviledag', 'session.rest': 'Hvile', 'session.off': 'Fri',
    // Dashboard
    'dash.sleep': 'Søvn', 'dash.knee': 'Knesmerte', 'dash.session': 'Dagens økt',
    'dash.focus': 'Fokus', 'dash.daily_focus': 'Dagens fokus',
    'dash.tasks': 'Gjøremål', 'dash.next_event': 'Neste hendelse',
    'dash.overview': 'Oversikt', 'dash.this_week': 'Denne uken',
    'dash.calendar': 'Kalender', 'dash.today': 'I dag', 'dash.upcoming': 'Kommende',
    'dash.status': 'Status', 'dash.full_overview': 'Full treningsoversikt →',
    'dash.sleep_score': 'Søvnscore', 'dash.hrv': 'HRV', 'dash.rhr': 'Hvilepuls',
    'dash.deep_sleep': 'Dyp søvn', 'dash.tonight': 'I natt',
    'dash.yesterday': 'I går', 'dash.days_ago': '{n} dager siden',
    'dash.offline': 'Ingen nettverkstilkobling — data kan være utdatert',
    'dash.no_session': 'Ingen økt planlagt i dag', 'dash.rest_day': 'Hviledag',
    'dash.no_events': 'Ingen kommende hendelser', 'dash.no_data': 'Ingen data',
    'dash.active_tasks': '{n} aktive', 'dash.little_data': 'Lite data',
    'dash.go_to_session': 'Gå til økt →', 'dash.go_to_sleep': 'Gå til søvn →',
    'dash.go_to_sprint': 'Gå til sprint →',
    // Gym
    'gym.log_session': 'Lagre økt', 'gym.reset': 'Nullstill',
    'gym.sets': 'Sett', 'gym.reps': 'Reps', 'gym.weight': 'Vekt',
    'gym.rest': 'Pause', 'gym.timer': 'Timer',
    'gym.start': 'Start økt', 'gym.finish': 'Fullfør økt',
    'gym.session_saved': 'Økt lagret!', 'gym.save_error': 'Feil ved lagring',
    'gym.history': 'Økthistorikk', 'gym.full_log': 'Se full øktlogg →',
    'gym.no_history': 'Ingen loggede økter ennå',
    'gym.delete_confirm': 'Slett denne økten?',
    'gym.deleted': 'Økt slettet', 'gym.delete_error': 'Feil ved sletting',
    'gym.monday': 'Mandag', 'gym.wednesday': 'Onsdag', 'gym.friday': 'Fredag',
    'gym.select_day': 'Velg dag', 'gym.exercises': 'Øvelser',
    'gym.active_session': 'Aktiv økt', 'gym.no_session': 'Ingen økt',
    'gym.session_time': 'Økt-tid', 'gym.warmup': 'Oppvarming',
    'gym.knee_panel': 'Knesmerte — Logg',
    // Sprint
    'sprint.personal_records': 'Personlige rekorder',
    'sprint.goals': 'Sprintmål', 'sprint.log': 'Logg økt',
    'sprint.add_run': '+ Legg til løp',
    'sprint.distance': 'Distanse', 'sprint.type': 'Type', 'sprint.time': 'Tid (sek)',
    'sprint.evaluation': 'Evaluering', 'sprint.rpe': 'RPE (1–10)',
    'sprint.log_btn': 'Logg økt', 'sprint.history': 'Knesmerte — siste 5 økter',
    'sprint.fill_fields': 'Fyll inn distanse og tid',
    'sprint.add_first': 'Legg til minst ett løp før du lagrer',
    'sprint.save_error': 'Feil ved lagring av økt: {msg}',
    'sprint.knee_error': 'Knesmerte ikke lagret: {msg}',
    'sprint.runs_saved': '{n} løp lagret!', 'sprint.new_pb': 'Ny PB! {pbs}',
    'sprint.invalid': 'Ugyldig verdi', 'sprint.rpe_range': 'RPE må være 1–10',
    'sprint.pain_range': 'Smerte må være 0–10',
    'sprint.updating': 'Oppdaterer alle {n} løp på denne datoen',
    'sprint.save_fail': 'Lagringsfeil', 'sprint.deleted': 'Økt slettet',
    'sprint.training': 'Trening', 'sprint.competition': 'Stevne',
    'sprint.training_outdoor': 'Trening (ute)',
    'sprint.edit_knee': 'Rediger knesmerte — ',
    'sprint.knee_updated': 'Knesmerte oppdatert',
    'sprint.knee_save_error': 'Feil ved lagring: {msg}',
    'sprint.runs': 'Løp', 'sprint.goal': 'Mål',
    // Søvn
    'sovn.title': 'Søvn & Restitusjon', 'sovn.score_lbl': 'Søvnscore',
    'sovn.recovery': 'God restitusjon', 'sovn.solid': 'Solid søvnnatt',
    'sovn.moderate': 'Middels restitusjon', 'sovn.hard': 'Krevende natt',
    'sovn.no_data': 'Ingen søvndata', 'sovn.sleeping': 'Sover videre?',
    'sovn.synced_at': 'Synkronisert kl. {time}', 'sovn.sync_auto': 'Synces automatisk',
    'sovn.sprint_ready': 'Bra grunnlag for sprint i dag',
    'sovn.train_ready': 'Klar for trening',
    'sovn.light_session': 'Lett økt kan være lurt',
    'sovn.rest': 'Prioriter hvile i dag',
    'sovn.registered': 'Registrert {d}', 'sovn.waiting': 'Venter på data',
    'sovn.architecture': 'Søvnarkitektur', 'sovn.readiness': 'Treningsberedskap',
    'sovn.no_phase': 'Ingen fasedata for i dag',
    'sovn.deep': 'Dyp søvn', 'sovn.rem': 'REM', 'sovn.light': 'Lett søvn',
    'sovn.awake': 'Våken', 'sovn.total': 'Total søvn',
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
    'sovn.ready_high_desc': 'Score og hvilepuls er optimale',
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
    // Gjøremål
    'gm.title': 'Gjøremål', 'gm.sub': 'Oppgaver & mål',
    'gm.active': 'Aktive', 'gm.important': 'Viktige',
    'gm.filter_all': 'Alle', 'gm.filter_active': 'Aktive',
    'gm.filter_important': 'Viktige', 'gm.filter_done': 'Fullførte',
    'gm.add_placeholder': 'Legg til gjøremål…', 'gm.new_list': 'Ny liste…',
    'gm.add_btn': 'Legg til', 'gm.important_btn': 'Viktig',
    'gm.no_todos': 'Ingen gjøremål her', 'gm.no_todos_empty': 'Ingen gjøremål',
    'gm.loading': 'Laster…', 'gm.lists': 'Lister',
    'gm.delete_list': 'Slett listen "{n}" og alle dens gjøremål?',
    'gm.list_deleted': '"{n}" slettet',
    'gm.added': 'Lagt til', 'gm.saved': 'Lagret', 'gm.deleted': 'Slettet',
    'gm.save_error': 'Feil ved lagring',
    'gm.active_count': '{n} aktive', 'gm.overdue_prefix': '⚠ ',
    'gm.add_date': '+ dato', 'gm.click_edit': 'Klikk for å redigere',
    'gm.change_date': 'Endre forfallsdato',
    'gm.stats_active': 'Aktive', 'gm.stats_important': 'Viktige',
    'gm.stats_done': 'Fullført i dag', 'gm.stats_overdue': 'Forfalt',
    'gm.sub_tasks': 'Gjøremål for i dag og fremover',
    // Kalender
    'kal.title': 'Kalender', 'kal.today': 'I dag', 'kal.new_event': 'Ny hendelse',
    'kal.add_placeholder': 'Tittel, dato, klokkeslett…',
    'kal.all_day': 'Heldagsarrangement', 'kal.no_events': 'Ingen hendelser',
    'kal.no_today': 'Ingen hendelser i dag', 'kal.no_upcoming': 'Ingen kommende',
    'kal.added': 'Hendelse lagt til', 'kal.deleted': 'Hendelse slettet',
    'kal.updated': 'Hendelse oppdatert', 'kal.save_error': 'Feil ved lagring',
    'kal.del_error': 'Feil ved sletting', 'kal.loading': 'Laster…',
    'kal.del_confirm': 'Slett denne hendelsen?',
    'kal.whole_day': 'Hele dagen', 'kal.week_view': 'Uke', 'kal.agenda_view': 'Agenda',
    'kal.prev': '‹', 'kal.next': '›',
    // Treningsplan
    'tp.title': 'Treningsoversikt', 'tp.history': 'Økthistorikk',
    'tp.no_sessions': 'Ingen loggede økter ennå',
    'tp.knee': 'Knesmerte', 'tp.edit_pain': 'Rediger smerteverdier',
    'tp.notes': 'Notater', 'tp.trend_up': '↓ Knesmerte forbedres',
    'tp.trend_down': '↑ Knesmerte øker', 'tp.trend_stable': '— Knesmerte stabil',
    'tp.gym_badge': '✓ Gym', 'tp.sprint_badge': '⚡ Sprint',
    'tp.runs': 'Løp', 'tp.completed': '✓ Fullført',
    // AI
    'ai.title': 'AI Overseer',
    'ai.subtitle': 'Personlig assistent · {model} · Søvn · Sprint · Rehab',
    'ai.clear': 'Tøm samtale', 'ai.cleared': 'Samtale tømt',
    'ai.empty_title': 'Klar til analyse',
    'ai.empty_sub': 'Spør om trening, knesmerte, søvn eller form.\nHenter data automatisk fra alle logger.',
    'ai.placeholder': 'Skriv en melding…',
    'ai.hint': 'Enter for å sende · Shift+Enter for ny linje',
    'ai.you': 'Deg', 'ai.ai_label': 'AI',
    'ai.quick1': 'Ukens form', 'ai.quick2': 'Knesmerte-analyse',
    'ai.quick3': 'Neste økt', 'ai.quick4': 'Søvn vs kne', 'ai.quick5': 'HRV-status',
    'ai.quick1_prompt': 'Hvordan ser formen mi ut denne uken?',
    'ai.quick2_prompt': 'Analyser knesmerten min de siste dagene',
    'ai.quick3_prompt': 'Hva bør jeg fokusere på i neste økt?',
    'ai.quick4_prompt': 'Se etter mønstre mellom søvn og knesmerte',
    'ai.quick5_prompt': 'Er HRV-en min god nok til hard trening nå?',
    'ai.err_timeout': 'Forespørselen tok for lang tid (30s) — prøv igjen',
    'ai.err_network': 'Nettverksfeil — sjekk tilkobling og prøv igjen',
    // Login
    'login.sub': 'Logg inn for å fortsette', 'login.email': 'E-post',
    'login.password': 'Passord', 'login.email_ph': 'din@epost.no',
    'login.btn': 'Logg inn', 'login.loading': 'Logger inn…',
    'login.empty': 'Fyll inn e-post og passord',
  },
  en: {
    // Nav
    'nav.ai': 'AI', 'nav.dashboard': 'Dashboard', 'nav.gym': 'Gym',
    'nav.sprint': 'Sprint', 'nav.sovn': 'Sleep', 'nav.gjoremal': 'Tasks',
    'nav.kalender': 'Calendar', 'nav.treningsplan': 'Training Overview',
    'nav.logout': 'Log out',
    // Common
    'loading': 'Loading…', 'no_data': 'No data', 'save': 'Save',
    'cancel': 'Cancel', 'delete': 'Delete', 'close': 'Close', 'add': 'Add',
    'edit': 'Edit', 'reset': 'Reset', 'date': 'Date', 'notes': 'Notes',
    // Knee pain
    'knee.before': 'Before', 'knee.during': 'During', 'knee.after': 'After',
    'knee.dayafter': 'Day after',
    'knee.before_short': 'BEFORE', 'knee.during_short': 'DURING',
    'knee.after_short': 'AFTER', 'knee.dayafter_short': 'D.AFTER',
    'knee.before_session': 'Before session', 'knee.during_session': 'During session',
    'knee.after_session': 'After session', 'knee.pain': 'Knee pain',
    'knee.pain_0_10': 'Knee pain (0–10)',
    // Session types
    'session.strength_power': 'Strength Power',
    'session.strength_capacity': 'Strength Capacity',
    'session.mobility': 'Mobility & Conditioning',
    'session.daily_rehab': 'Daily Rehab',
    'session.rest_day': 'Rest Day', 'session.rest': 'Rest', 'session.off': 'Off',
    // Dashboard
    'dash.sleep': 'Sleep', 'dash.knee': 'Knee Pain', 'dash.session': "Today's Session",
    'dash.focus': 'Focus', 'dash.daily_focus': 'Daily Focus',
    'dash.tasks': 'Tasks', 'dash.next_event': 'Next Event',
    'dash.overview': 'Overview', 'dash.this_week': 'This Week',
    'dash.calendar': 'Calendar', 'dash.today': 'Today', 'dash.upcoming': 'Upcoming',
    'dash.status': 'Status', 'dash.full_overview': 'Full training overview →',
    'dash.sleep_score': 'Sleep score', 'dash.hrv': 'HRV', 'dash.rhr': 'Resting HR',
    'dash.deep_sleep': 'Deep sleep', 'dash.tonight': 'Last night',
    'dash.yesterday': 'Yesterday', 'dash.days_ago': '{n} days ago',
    'dash.offline': 'No network connection — data may be outdated',
    'dash.no_session': 'No session planned today', 'dash.rest_day': 'Rest day',
    'dash.no_events': 'No upcoming events', 'dash.no_data': 'No data',
    'dash.active_tasks': '{n} active', 'dash.little_data': 'Little data',
    'dash.go_to_session': 'Go to session →', 'dash.go_to_sleep': 'Go to sleep →',
    'dash.go_to_sprint': 'Go to sprint →',
    // Gym
    'gym.log_session': 'Save session', 'gym.reset': 'Reset',
    'gym.sets': 'Sets', 'gym.reps': 'Reps', 'gym.weight': 'Weight',
    'gym.rest': 'Rest', 'gym.timer': 'Timer',
    'gym.start': 'Start session', 'gym.finish': 'Finish session',
    'gym.session_saved': 'Session saved!', 'gym.save_error': 'Error saving',
    'gym.history': 'Session History', 'gym.full_log': 'See full session log →',
    'gym.no_history': 'No sessions logged yet',
    'gym.delete_confirm': 'Delete this session?',
    'gym.deleted': 'Session deleted', 'gym.delete_error': 'Error deleting',
    'gym.monday': 'Monday', 'gym.wednesday': 'Wednesday', 'gym.friday': 'Friday',
    'gym.select_day': 'Select day', 'gym.exercises': 'Exercises',
    'gym.active_session': 'Active session', 'gym.no_session': 'No session',
    'gym.session_time': 'Session time', 'gym.warmup': 'Warm-up',
    'gym.knee_panel': 'Knee Pain — Log',
    // Sprint
    'sprint.personal_records': 'Personal Records',
    'sprint.goals': 'Sprint Goals', 'sprint.log': 'Log Session',
    'sprint.add_run': '+ Add run',
    'sprint.distance': 'Distance', 'sprint.type': 'Type', 'sprint.time': 'Time (sec)',
    'sprint.evaluation': 'Evaluation', 'sprint.rpe': 'RPE (1–10)',
    'sprint.log_btn': 'Log Session', 'sprint.history': 'Knee Pain — Last 5 Sessions',
    'sprint.fill_fields': 'Enter distance and time',
    'sprint.add_first': 'Add at least one run before saving',
    'sprint.save_error': 'Error saving session: {msg}',
    'sprint.knee_error': 'Knee pain not saved: {msg}',
    'sprint.runs_saved': '{n} run(s) saved!', 'sprint.new_pb': 'New PB! {pbs}',
    'sprint.invalid': 'Invalid value', 'sprint.rpe_range': 'RPE must be 1–10',
    'sprint.pain_range': 'Pain must be 0–10',
    'sprint.updating': 'Updating all {n} runs on this date',
    'sprint.save_fail': 'Save error', 'sprint.deleted': 'Session deleted',
    'sprint.training': 'Training', 'sprint.competition': 'Competition',
    'sprint.training_outdoor': 'Training (outdoor)',
    'sprint.edit_knee': 'Edit knee pain — ',
    'sprint.knee_updated': 'Knee pain updated',
    'sprint.knee_save_error': 'Error saving: {msg}',
    'sprint.runs': 'Runs', 'sprint.goal': 'Goal',
    // Søvn
    'sovn.title': 'Sleep & Recovery', 'sovn.score_lbl': 'Sleep Score',
    'sovn.recovery': 'Good Recovery', 'sovn.solid': 'Solid Night',
    'sovn.moderate': 'Moderate Recovery', 'sovn.hard': 'Tough Night',
    'sovn.no_data': 'No sleep data', 'sovn.sleeping': 'Still sleeping?',
    'sovn.synced_at': 'Synced at {time}', 'sovn.sync_auto': 'Syncs automatically',
    'sovn.sprint_ready': 'Good basis for sprint today',
    'sovn.train_ready': 'Ready to train',
    'sovn.light_session': 'Consider a light session',
    'sovn.rest': 'Prioritize rest today',
    'sovn.registered': 'Recorded {d}', 'sovn.waiting': 'Waiting for data',
    'sovn.architecture': 'Sleep Architecture', 'sovn.readiness': 'Training Readiness',
    'sovn.no_phase': 'No phase data for today',
    'sovn.deep': 'Deep sleep', 'sovn.rem': 'REM', 'sovn.light': 'Light sleep',
    'sovn.awake': 'Awake', 'sovn.total': 'Total sleep',
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
    'sovn.ready_high_desc': 'Score and resting HR are optimal',
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
    // Gjøremål
    'gm.title': 'Tasks', 'gm.sub': 'Tasks & goals',
    'gm.active': 'Active', 'gm.important': 'Important',
    'gm.filter_all': 'All', 'gm.filter_active': 'Active',
    'gm.filter_important': 'Important', 'gm.filter_done': 'Completed',
    'gm.add_placeholder': 'Add task…', 'gm.new_list': 'New list…',
    'gm.add_btn': 'Add', 'gm.important_btn': 'Important',
    'gm.no_todos': 'No tasks here', 'gm.no_todos_empty': 'No tasks',
    'gm.loading': 'Loading…', 'gm.lists': 'Lists',
    'gm.delete_list': 'Delete list "{n}" and all its tasks?',
    'gm.list_deleted': '"{n}" deleted',
    'gm.added': 'Added', 'gm.saved': 'Saved', 'gm.deleted': 'Deleted',
    'gm.save_error': 'Error saving',
    'gm.active_count': '{n} active', 'gm.overdue_prefix': '⚠ ',
    'gm.add_date': '+ date', 'gm.click_edit': 'Click to edit',
    'gm.change_date': 'Change due date',
    'gm.stats_active': 'Active', 'gm.stats_important': 'Important',
    'gm.stats_done': 'Done today', 'gm.stats_overdue': 'Overdue',
    'gm.sub_tasks': 'Tasks for today and ahead',
    // Kalender
    'kal.title': 'Calendar', 'kal.today': 'Today', 'kal.new_event': 'New event',
    'kal.add_placeholder': 'Title, date, time…',
    'kal.all_day': 'All-day event', 'kal.no_events': 'No events',
    'kal.no_today': 'No events today', 'kal.no_upcoming': 'No upcoming',
    'kal.added': 'Event added', 'kal.deleted': 'Event deleted',
    'kal.updated': 'Event updated', 'kal.save_error': 'Error saving',
    'kal.del_error': 'Error deleting', 'kal.loading': 'Loading…',
    'kal.del_confirm': 'Delete this event?',
    'kal.whole_day': 'All day', 'kal.week_view': 'Week', 'kal.agenda_view': 'Agenda',
    'kal.prev': '‹', 'kal.next': '›',
    // Treningsplan
    'tp.title': 'Training Overview', 'tp.history': 'Session History',
    'tp.no_sessions': 'No sessions logged yet',
    'tp.knee': 'Knee Pain', 'tp.edit_pain': 'Edit pain values',
    'tp.notes': 'Notes', 'tp.trend_up': '↓ Knee pain improving',
    'tp.trend_down': '↑ Knee pain worsening', 'tp.trend_stable': '— Knee pain stable',
    'tp.gym_badge': '✓ Gym', 'tp.sprint_badge': '⚡ Sprint',
    'tp.runs': 'Runs', 'tp.completed': '✓ Completed',
    // AI
    'ai.title': 'AI Overseer',
    'ai.subtitle': 'Personal assistant · {model} · Sleep · Sprint · Rehab',
    'ai.clear': 'Clear chat', 'ai.cleared': 'Chat cleared',
    'ai.empty_title': 'Ready to analyze',
    'ai.empty_sub': 'Ask about training, knee pain, sleep or form.\nFetches data automatically from all logs.',
    'ai.placeholder': 'Write a message…',
    'ai.hint': 'Enter to send · Shift+Enter for new line',
    'ai.you': 'You', 'ai.ai_label': 'AI',
    'ai.quick1': 'Weekly form', 'ai.quick2': 'Knee analysis',
    'ai.quick3': 'Next session', 'ai.quick4': 'Sleep vs knee', 'ai.quick5': 'HRV status',
    'ai.quick1_prompt': 'How does my form look this week?',
    'ai.quick2_prompt': 'Analyze my knee pain over the last few days',
    'ai.quick3_prompt': 'What should I focus on in my next session?',
    'ai.quick4_prompt': 'Look for patterns between sleep and knee pain',
    'ai.quick5_prompt': 'Is my HRV good enough for hard training now?',
    'ai.err_timeout': 'Request timed out (30s) — please try again',
    'ai.err_network': 'Network error — check connection and try again',
    // Login
    'login.sub': 'Log in to continue', 'login.email': 'Email',
    'login.password': 'Password', 'login.email_ph': 'your@email.com',
    'login.btn': 'Log in', 'login.loading': 'Logging in…',
    'login.empty': 'Please enter email and password',
  },
};

function t(key, vars = {}) {
  const str = TRANSLATIONS[_lang]?.[key] ?? TRANSLATIONS.no[key] ?? key;
  return String(str).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

function fmtLocale() { return _lang === 'en' ? 'en-GB' : 'no-NO'; }

function applyLang() {
  document.documentElement.lang = _lang === 'en' ? 'en' : 'no';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });
  const btn = document.getElementById('langBtn');
  if (btn) btn.textContent = _lang === 'no' ? '🇺🇸' : '🇳🇴';
}

function toggleLang() {
  _lang = _lang === 'no' ? 'en' : 'no';
  localStorage.setItem('lang', _lang);
  applyLang();
  // Re-render dynamic content if a page-level function exists
  if (typeof onLangChange === 'function') onLangChange();
}

// ── Core utilities ────────────────────────────────────────────────────────────
let _tt;

function toast(msg, type = 'ok') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type} show`;
  clearTimeout(_tt);
  _tt = setTimeout(() => el.classList.remove('show'), 3000);
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
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getFullYear()).slice(2)}`;
}

function painColor(s) {
  if (s === null || s === undefined) return 'var(--text-tertiary)';
  if (s <= 3) return 'var(--success)';
  if (s <= 5) return 'var(--warning)';
  if (s <= 7) return 'rgba(242,130,60,1)';
  return 'var(--danger)';
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
