// Widget Treningsbelastning — Scriptable (Medium)
// Viser denne uken vs forrige uke (rullende 7d vs forrige 7d).
// sRPE = varighet_min × (RPE/10), RPE lagres 1–100.

const BASE  = "https://filip-vita.vercel.app";
const TOKEN = "fc30c9a6442f64e4272c86b7d92ba12d50a49e8ee8a6ea7dd1876a684dd4cac5";
const API   = `${BASE}/api/widget?token=${encodeURIComponent(TOKEN)}`;

const BG1 = new Color("#0f172a"), BG2 = new Color("#1e293b");
const FG = new Color("#f1f5f9"), DIM = new Color("#94a3b8");
const GREEN = new Color("#22c55e"), YELLOW = new Color("#eab308"), RED = new Color("#ef4444");

function srpe(rows) {
  return Math.round((rows || []).reduce((sum, r) => {
    if (r.rpe == null) return sum;
    const dur = r.duration_min ?? (r.source === 'sprint' ? 75 : 60);
    return sum + dur * (r.rpe / 10);
  }, 0));
}

function loadColor(v) {
  return v >= 3000 ? RED : v >= 1500 ? YELLOW : GREEN;
}

function trendArrow(curr, prev) {
  if (prev === 0) return { arrow: "→", pct: null, color: DIM };
  const diff = ((curr - prev) / prev) * 100;
  if (diff > 5)  return { arrow: "↑", pct: Math.round(diff), color: RED };
  if (diff < -5) return { arrow: "↓", pct: Math.round(-diff), color: GREEN };
  return { arrow: "→", pct: Math.round(Math.abs(diff)), color: YELLOW };
}

function drawCompare(thisWeek, prevWeek) {
  const W = 300, H = 90;
  const ctx = new DrawContext();
  ctx.size = new Size(W, H);
  ctx.opaque = false;
  ctx.respectScreenScale = true;

  const maxVal = Math.max(thisWeek, prevWeek, 500);
  const barH = 28, gap = 14, labelW = 70, barMaxW = W - labelW - 10;

  // Forrige uke
  const prevW = Math.max(4, Math.round(barMaxW * (prevWeek / maxVal)));
  ctx.setFillColor(new Color("#334155"));
  ctx.fillRect(new Rect(labelW, 0, prevW, barH));
  ctx.setFont(Font.systemFont(10)); ctx.setTextColor(DIM);
  ctx.drawTextInRect("FORRIGE", new Rect(0, 6, labelW - 6, 14));
  if (prevWeek > 0) {
    ctx.setFont(Font.boldSystemFont(11)); ctx.setTextColor(new Color("#94a3b8"));
    ctx.drawTextInRect(`${prevWeek}`, new Rect(labelW + prevW + 4, 6, 60, 14));
  }

  // Denne uken
  const thisW = Math.max(4, Math.round(barMaxW * (thisWeek / maxVal)));
  ctx.setFillColor(loadColor(thisWeek));
  ctx.fillRect(new Rect(labelW, barH + gap, thisW, barH));
  ctx.setFont(Font.systemFont(10)); ctx.setTextColor(FG);
  ctx.drawTextInRect("DENNE", new Rect(0, barH + gap + 6, labelW - 6, 14));
  if (thisWeek > 0) {
    ctx.setFont(Font.boldSystemFont(11)); ctx.setTextColor(FG);
    ctx.drawTextInRect(`${thisWeek}`, new Rect(labelW + thisW + 4, barH + gap + 6, 60, 14));
  }

  return ctx.getImage();
}

function errWidget(msg) {
  const w = new ListWidget(); w.backgroundColor = BG1;
  const t = w.addText("Belastning utilgjengelig"); t.textColor = FG; t.font = Font.boldSystemFont(14);
  w.addSpacer(4);
  const e = w.addText(String(msg)); e.textColor = DIM; e.font = Font.systemFont(10);
  return w;
}

async function main() {
  let data;
  try {
    const req = new Request(API); req.timeoutInterval = 12;
    data = await req.loadJSON();
  } catch(e) { return errWidget("Nettverksfeil"); }
  if (!data || data.error) return errWidget(data?.error ?? "Ukjent feil");

  const thisWeek = srpe(data.last7load);
  const prevWeek = srpe(data.prev7load);
  const trend = trendArrow(thisWeek, prevWeek);

  const w = new ListWidget();
  const g = new LinearGradient(); g.colors=[BG1,BG2]; g.locations=[0,1]; w.backgroundGradient=g;
  w.setPadding(14,16,12,16);
  w.url = `${BASE}/treningsplan.html`;

  // Header
  const head = w.addStack(); head.centerAlignContent();
  const title = head.addText("📊 Belastning"); title.textColor=FG; title.font=Font.boldSystemFont(13);
  head.addSpacer();
  const badge = head.addText(`${trend.arrow}${trend.pct != null ? " " + trend.pct + "%" : ""}`);
  badge.textColor = trend.color; badge.font = Font.boldSystemFont(13);
  w.addSpacer(10);

  // Sammenligningsdiagram
  const img = w.addImage(drawCompare(thisWeek, prevWeek));
  img.imageSize = new Size(300, 90);

  w.addSpacer(8);

  const foot = w.addText("sRPE · varighet × RPE/10 · rullende 7 dager");
  foot.textColor = DIM; foot.font = Font.systemFont(9);
  foot.centerAlignText();

  return w;
}

const widget = await main();
if (config.runsInWidget) { Script.setWidget(widget); }
else { await widget.presentMedium(); }
Script.complete();
