/* CW Cast: painel da produção do podcast (calendário, conferência, meta, métricas, riscos, melhorias, reunião, equipe).
   Base: painel da Jamille; dados no Supabase da Central pelo adaptador CTX.db. */
window.iniciarCast = function (CTX) {
  "use strict";
  var ROOT = document.getElementById("cast-root");
  /* ---------- dados fixos ---------- */
  var TYPES = {
    gravacao_podcast: { label: "Gravação de podcast (estúdio CW)", short: "Gravação", bg: "#59327A", fg: "#FFFFFF", bd: "#59327A" },
    gravacao_giro: { label: "Gravação Giro do Food", short: "Grav. Giro", bg: "#A543FA", fg: "#FFFFFF", bd: "#A543FA" },
    edicao: { label: "Edição", short: "Edição", bg: "#FFB600", fg: "#3B2150", bd: "#FFB600" },
    aprovacao: { label: "Aprovação", short: "Aprovação", bg: "#FFB600", fg: "#3B2150", bd: "#59327A" },
    publicacao: { label: "Publicação de episódio", short: "Episódio", bg: "#A543FA", fg: "#FFFFFF", bd: "#59327A" },
    video_extra: { label: "Vídeo extra no YouTube (terça)", short: "Vídeo YT", bg: "#F4EDF7", fg: "#59327A", bd: "#A543FA" },
    corte: { label: "Corte IG / Short YouTube", short: "Corte", bg: "#E6D2FC", fg: "#59327A", bd: "#D2AEF8" },
    divulgacao: { label: "Divulgação (teaser, card/thumb)", short: "Divulgação", bg: "#F1E4FD", fg: "#59327A", bd: "#C9A0F5" },
    post_giro: { label: "Post Giro do Food (quinta)", short: "Post Giro", bg: "#FFC9C9", fg: "#7A1F1F", bd: "#FF9B9B" },
    agendamento: { label: "Lembrete: agendar episódio", short: "Agendar", bg: "#FFF4D1", fg: "#59327A", bd: "#FFB600" },
    risco: { label: "Risco / alerta", short: "Risco", bg: "#FF5959", fg: "#FFFFFF", bd: "#FF5959" }
  };
  var STATUS = { pendente: "Pendente", andamento: "Em andamento", concluido: "Concluído" };
  var ICON = { pendente: "○", andamento: "◐", concluido: "✓" };
  /* Etapa editável dentro do próprio card: [chave, texto completo, texto curto no card, status resultante] */
  var STAGES = {
    aprovacao: [["", "Aguardando aprovação", "", "pendente"], ["ajustes", "Ajustes pedidos", "Ajustes pedidos", "andamento"], ["aprovado", "Aprovado · aguardando agendamento", "Aprovado · aguardando agendamento", "concluido"], ["agendado", "Agendado", "Agendado", "concluido"]],
    edicao: [["", "Não iniciada", "", "pendente"], ["mesa", "Na mesa de edição", "Na mesa de edição", "andamento"], ["revisao", "Em revisão", "Em revisão", "andamento"], ["pronto", "Editado", "Editado", "concluido"]]
  };
  var stageOf = function (type, key) { return (STAGES[type] || []).filter(function (s) { return s[0] === (key || ""); })[0]; };
  var HOL = { "2026-10-12": "Nsa. Sra. Aparecida", "2026-11-02": "Finados", "2026-11-15": "Proclamação da República", "2026-11-20": "Consciência Negra", "2026-12-25": "Natal" };
  var OFF = { gravacao: -21, edicao: -10, aprovacao: -4, agendamento: -7, capa: -5, teaser: -2 };
  var START = "2026-10-01", END = "2026-12-31", MONTHS = ["2026-10", "2026-11", "2026-12"];
  var MNAME = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  var DNAME = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  var EPISODES = [
    { date: "2026-10-19", guest: "Tauan", rec: "skip", ed: "andamento", gs: "confirmado", notes: "Cortes na sequência (3 por dia nos slots)." },
    { date: "2026-10-26", guest: "Rei do Frango", rec: "skip", ed: "andamento", gs: "confirmado", notes: "Cortes na sequência (3 por dia nos slots)." },
    { date: "2026-11-02", guest: "Will", show: "Aceleração Delivery", rec: "skip", ed: "andamento", gs: "confirmado", notes: "Bate-papo com o Will no Aceleração Delivery. 02/11 é feriado (Finados), mas a postagem fica programada com antecedência." },
    { date: "2026-11-09", guest: "Fabrício", show: "Burguer Perfeito", rec: "skip", ed: "andamento", gs: "confirmado" },
    { date: "2026-11-16", guest: "Caio", show: "Panela", rec: "skip", ed: "andamento", gs: "confirmado" },
    { date: "2026-11-23", guest: "Magno Fernandes", rec: "skip", ed: "andamento", gs: "confirmado" },
    { date: "2026-11-30", guest: "", rec: "skip", notes: "Episódio ainda não gravado e sem convidado definido. A gravação pode ser a de 18/11 (convidados a confirmar).",
      risk: { on: true, description: "Episódio ainda não gravado: sem convidado definido." }, sub: "Definir episódio reserva (ex.: bate-papo ou reprise com cortes inéditos)." }
  ];

  /* ---------- datas ---------- */
  var pad = function (n) { return String(n).padStart(2, "0"); };
  var toD = function (s) { var p = s.split("-").map(Number); return new Date(Date.UTC(p[0], p[1] - 1, p[2])); };
  var iso = function (d) { return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()); };
  var add = function (s, n) { var d = toD(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
  var wd = function (s) { var w = toD(s).getUTCDay(); return w === 0 ? 7 : w; };
  var prevBiz = function (s) { while (wd(s) > 5) s = add(s, -1); return s; };
  var diff = function (a, b) { return Math.round((toD(a) - toD(b)) / 864e5); };
  var br = function (s) { return s ? s.split("-").reverse().join("/") : ""; };
  var dm = function (s) { return s ? s.slice(8, 10) + "/" + s.slice(5, 7) : ""; };
  var mondayOf = function (s) { return add(s, 1 - wd(s)); };
  var TODAY = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };

  /* ---------- calendário base (rotina + episódios) ---------- */
  function mk(p) {
    return { id: p.id, title: p.title, type: p.type, date: p.date == null ? null : p.date, slot: p.slot || null, owner: p.owner || "", status: p.status || "pendente",
      guest: p.guest || "", gs: p.gs || "", jira: p.jira || "", material: p.material || "", notes: p.notes || "", risk: p.risk || { on: false, description: "" },
      sub: p.sub || "", stage: p.stage || "", sug: !!p.sug, ideal: !!p.ideal, ph: !!p.ph, ep: p.ep || null, scheduled: !!p.scheduled };
  }
  function bundle(ep) {
    var label = ep.guest ? ep.guest + (ep.show ? " — " + ep.show : "") : "Episódio a definir";
    var pid = "ep-" + ep.date + "-pub", at = function (n) { return prevBiz(add(ep.date, n)); };
    var c = { ep: pid, guest: ep.guest || "", gs: ep.gs || "", ph: !ep.guest };
    var o = [mk(Object.assign({ id: pid, type: "publicacao", date: ep.date, title: "Publicação: " + label, notes: ep.notes || "", risk: ep.risk, sub: ep.sub }, c))];
    if (ep.rec !== "skip") o.push(mk(Object.assign({ id: "ep-" + ep.date + "-gravacao", type: "gravacao_podcast", date: ep.rec === "unknown" ? null : at(OFF.gravacao), sug: true, title: "Gravação: " + label,
      notes: ep.rec === "unknown" ? "Data da gravação não definida: confirmar com o time se já foi gravado e quando." : "Data sugerida (editável)." }, c)));
    o.push(mk(Object.assign({ id: "ep-" + ep.date + "-edicao", type: "edicao", date: at(OFF.edicao), title: "Edição: " + label, sug: !ep.ed, status: ep.ed || "pendente", stage: ep.ed ? "mesa" : "", notes: ep.ed ? "Episódio já gravado e na mesa de edição." : "" }, c)));
    o.push(mk(Object.assign({ id: "ep-" + ep.date + "-aprovacao", type: "aprovacao", date: at(OFF.aprovacao), title: "Aprovação: " + label, sug: true }, c)));
    o.push(mk(Object.assign({ id: "ep-" + ep.date + "-capa", type: "divulgacao", date: at(OFF.capa), title: "Card/thumb: " + label, sug: true }, c)));
    o.push(mk(Object.assign({ id: "ep-" + ep.date + "-teaser", type: "divulgacao", date: at(OFF.teaser), title: "Teaser: " + label, sug: true }, c)));
    o.push(mk(Object.assign({ id: "ep-" + ep.date + "-agendar", type: "agendamento", date: add(ep.date, OFF.agendamento),
      title: "Agendar episódio de " + dm(ep.date) + (ep.guest ? " (" + ep.guest + ")" : ""),
      notes: 'Quando o episódio estiver agendado na plataforma, marque "Agendado" no card de publicação.' }, c)));
    return o;
  }
  function buildBase() {
    var out = [], first = EPISODES.map(function (e) { return e.date; }).sort()[0], byDate = {};
    EPISODES.forEach(function (e) { byDate[e.date] = e; });
    for (var d = START; d <= END; d = add(d, 1)) {
      var w = wd(d);
      for (var s = 1; s <= 3; s++) out.push(mk({ id: "rec-corte-" + d + "-" + s, type: "corte", date: d, slot: s, title: "Corte " + s + "/3 (Instagram + Shorts)" }));
      if (w === 1 && d >= first) bundle(byDate[d] || { date: d, rec: "suggest" }).forEach(function (x) { out.push(x); });
      if (w === 2) out.push(mk({ id: "rec-video-" + d, type: "video_extra", date: d, title: "Vídeo novo no YouTube — tema a definir" }));
      if (w === 3) out.push(mk({ id: "rec-giro-grav-" + d, type: "gravacao_giro", date: d, ideal: true, title: "Gravação Giro do Food com Glauton (ideal)", guest: "Glauton", gs: "confirmado" }));
      if (w === 4) out.push(mk({ id: "rec-giro-post-" + d, type: "post_giro", date: d, title: "Post Giro do Food com Glauton", guest: "Glauton", gs: "confirmado" }));
    }
    out.push(mk({ id: "seed-gravacao-2026-11-18", type: "gravacao_podcast", date: "2026-11-18", sug: true, gs: "a_confirmar",
      title: "Gravação de podcast (estúdio CW) — convidados a confirmar",
      notes: "Pode coincidir com a gravação do Giro do Food (quarta): sem problema. Pode servir ao episódio de 30/11.",
      risk: { on: true, description: "Convidados ainda a confirmar." }, sub: "Se nenhum convidado confirmar, remarcar a gravação ou usar episódio reserva." }));
    return out;
  }
  var BASE = buildBase(), BASEMAP = {};
  BASE.forEach(function (b) { BASEMAP[b.id] = b; });

  /* ---------- estado ---------- */
  var ov = new Map();            // edições salvas (db) por id
  var pending = new Map();       // edições ainda não gravadas
  var timers = {};
  var TEAM_FIXA = ["Anália Jamille", "Fabiano Bessa", "Daniel Timeu", "Augusto", "Gabriel"];
  var team = { names: TEAM_FIXA.slice(), defaults: {} };
  var cache = null;
  var db = null, canWrite = true, dbOk = false, saving = 0, lastErr = "";
  var st = { tab: "resultados", rm: "views", rf: "abertos", mf: "abertas", cf: "todos", repWeek: null, copyFallback: "", month: MONTHS.indexOf(TODAY.slice(0, 7)) >= 0 ? TODAY.slice(0, 7) : MONTHS[0], owner: "", type: "", panel: undefined };

  function cards() {
    if (cache) return cache;
    var out = [];
    BASE.forEach(function (b) { var o = ov.get(b.id); if (o && o.deleted) return; out.push(o ? Object.assign({}, b, o) : b); });
    ov.forEach(function (o, id) { if (!BASEMAP[id] && !o.deleted) out.push(Object.assign(mk({ id: id, title: "", type: "edicao" }), o)); });
    if (CTX.ajustarCard) out = out.map(function (c) { return CTX.ajustarCard(c, ov.get(c.id)) || c; });
    cache = out;
    return out;
  }
  function getCard(id) { var o = ov.get(id); return o ? Object.assign({}, BASEMAP[id] || mk({ id: id, title: "", type: "edicao" }), o) : BASEMAP[id]; }
  var own = function (c) { return c.owner || team.defaults[c.type] || ""; };
  var inits = function (n) { return n.replace(/\(.*?\)/g, "").trim().split(/\s+/).slice(0, 2).map(function (s) { return s[0]; }).join("").toUpperCase(); };
  var passes = function (c) { return (!st.type || c.type === st.type) && (!st.owner || (st.owner === "_none" ? !own(c) : own(c) === st.owner)); };
  var byId = function (id) { return cards().find(function (c) { return c.id === id; }); };

  function remState(r) {
    var pub = byId(r.ep);
    if (!pub) return { s: "orphan" };
    if (pub.scheduled) return { s: "ok" };
    if (TODAY > pub.date) return { s: "past" };
    if (TODAY < r.date) return { s: "upcoming" };
    return TODAY === r.date ? { s: "today", pub: pub } : { s: "late", late: diff(TODAY, r.date), pub: pub };
  }
  function dueReminders() {
    return cards().filter(function (c) { return c.type === "agendamento"; }).map(function (r) { var x = remState(r); x.r = r; return x; })
      .filter(function (x) { return x.s === "today" || x.s === "late"; }).sort(function (a, b) { return a.pub.date < b.pub.date ? -1 : 1; });
  }
  function remText(x) {
    var who = x.pub.guest ? " (" + x.pub.guest + ")" : "";
    if (x.s === "today") return "Hoje é o prazo para agendar o episódio de " + br(x.pub.date) + who + ".";
    return "O episódio de " + br(x.pub.date) + who + " ainda não está agendado. O prazo era " + br(x.r.date) + " (" + x.late + (x.late === 1 ? " dia" : " dias") + " de atraso).";
  }

  /* ---------- gravação (db) ---------- */
  function setSync() {
    var el = document.getElementById("cast-sync");
    var txt = !dbOk ? "Sem conexão para salvar" : lastErr ? lastErr : saving ? "Salvando…" : canWrite ? "Salvo para o time" : "Somente leitura";
    el.innerHTML = '<span class="dot' + (!dbOk || lastErr || !canWrite ? " off" : "") + '"></span>' + esc(txt);
  }
  function touch(id, patch) {
    var next = Object.assign({}, getCard(id), patch);
    ov.set(id, next); pending.set(id, next); cache = null;
    clearTimeout(timers[id]);
    timers[id] = setTimeout(function () { flush(id); }, 500);
  }
  function flush(id) {
    var data = pending.get(id); if (!data || !db) return;
    saving++; setSync();
    db.doc("cards/" + id).set(JSON.parse(JSON.stringify(data))).then(function () {
      if (pending.get(id) === data) pending.delete(id); lastErr = "";
    }).catch(function (e) { lastErr = e && e.code === "invalid_argument" ? "Você não tem permissão para editar" : "Não foi possível salvar. Tente de novo."; if (e && e.code === "invalid_argument") canWrite = false; })
      .then(function () { saving--; setSync(); });
  }
  /* "Agendado" vive na publicação; o lembrete acompanha (concluído quando agendado). */
  function setScheduled(pubId, val) {
    touch(pubId, { scheduled: !!val });
    cards().filter(function (x) { return x.type === "agendamento" && x.ep === pubId; }).forEach(function (r) { touch(r.id, { status: val ? "concluido" : "pendente" }); });
  }
  function removeCard(id) {
    if (BASEMAP[id]) touch(id, { deleted: true });
    else { ov.delete(id); pending.delete(id); cache = null; if (db) db.doc("cards/" + id).delete().catch(function () { lastErr = "Não foi possível excluir."; setSync(); }); }
  }
  function saveTeam() {
    if (!db) return;
    saving++; setSync();
    db.doc("config/team").set({ names: team.names, defaults: team.defaults }).then(function () { lastErr = ""; })
      .catch(function () { lastErr = "Não foi possível salvar a equipe."; }).then(function () { saving--; setSync(); });
  }

  /* ---------- views ---------- */
  function chip(c, small) {
    var t = TYPES[c.type] || TYPES.risco, late = c.type === "agendamento" && (remState(c).s === "late" || remState(c).s === "today");
    var bg = late ? "#FF5959" : t.bg, fg = late ? "#fff" : t.fg, bd = late ? "#FF5959" : t.bd, o = own(c);
    return '<span class="chip' + (c.sug && c.status !== "concluido" ? " sug" : "") + (c.status === "concluido" ? " done" : "") + '" draggable="true" data-drag="' + esc(c.id) + '" data-open-day="' + esc(c.date || "") + '" title="' + esc(t.label + " — " + c.title) + '" style="background:' + bg + ";color:" + fg + ";border-color:" + bd + '">' +
      "<span>" + ICON[c.status] + '</span><span class="t">' + esc(c.title) + (stageOf(c.type, c.stage) && stageOf(c.type, c.stage)[2] ? '<span class="stg">' + esc(stageOf(c.type, c.stage)[2]) + "</span>" : "") + "</span>" + (o ? '<span class="who">' + esc(inits(o)) + "</span>" : "") + "</span>";
  }
  function dayItems(d) { return cards().filter(function (c) { return c.date === d && passes(c); }); }
  var ORDER = ["agendamento", "publicacao", "gravacao_podcast", "gravacao_giro", "edicao", "aprovacao", "video_extra", "post_giro", "divulgacao", "risco", "corte"];
  var sortDay = function (a, b) { return ORDER.indexOf(a.type) - ORDER.indexOf(b.type) || (a.slot || 0) - (b.slot || 0); };

  function ownerFilter() {
    var names = teamNames();
    return '<select id="f-owner" aria-label="Filtrar por responsável"><option value="">Todos os responsáveis</option><option value="_none"' + (st.owner === "_none" ? " selected" : "") + ">Sem responsável</option>" +
      names.map(function (n) { return "<option" + (st.owner === n ? " selected" : "") + ">" + esc(n) + "</option>"; }).join("") + "</select>" +
      '<select id="f-type" aria-label="Filtrar por tipo"><option value="">Todos os tipos</option>' +
      Object.keys(TYPES).map(function (k) { return '<option value="' + k + '"' + (st.type === k ? " selected" : "") + ">" + esc(TYPES[k].short) + "</option>"; }).join("") + "</select>";
  }
  function teamNames() {
    var s = new Set(team.names);
    cards().forEach(function (c) { if (c.owner) s.add(c.owner); });
    return Array.from(s);
  }
  function legend() {
    return '<div class="legend">' + Object.keys(TYPES).map(function (k) { var t = TYPES[k]; return '<span><i style="background:' + t.bg + ";border-color:" + t.bd + '"></i>' + esc(t.label) + "</span>"; }).join("") +
      '<span><i style="background:transparent;border-style:dashed;border-color:var(--muted)"></i>sugestão (data não combinada)</span></div>';
  }

  function viewMonth() {
    var ym = st.month, y = +ym.slice(0, 4), m = +ym.slice(5), first = ym + "-01", n = new Date(Date.UTC(y, m, 0)).getUTCDate();
    var idx = MONTHS.indexOf(ym), cells = [], lead = wd(first) - 1, i;
    for (i = 0; i < lead; i++) cells.push(null);
    for (i = 1; i <= n; i++) cells.push(ym + "-" + pad(i));
    while (cells.length % 7) cells.push(null);
    var html = '<div class="toolbar"><div class="monthnav"><button class="round" data-act="prev"' + (idx <= 0 ? " disabled" : "") + ' aria-label="Mês anterior">‹</button><h2>' + MNAME[m - 1] + " " + y + '</h2><button class="round" data-act="next"' + (idx >= MONTHS.length - 1 ? " disabled" : "") + ' aria-label="Próximo mês">›</button></div>' + ownerFilter() + "</div>" + legend();
    html += '<div class="gscroll"><div class="gin"><div class="dow">' + ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"].map(function (x) { return "<div>" + x + "</div>"; }).join("") + '</div><div class="grid">';
    cells.forEach(function (d) {
      if (!d) { html += '<div class="cell empty"></div>'; return; }
      var list = dayItems(d).sort(sortDay), cortes = list.filter(function (c) { return c.type === "corte"; }), rest = list.filter(function (c) { return c.type !== "corte"; });
      html += '<div class="cell' + (d === TODAY ? " today" : "") + (wd(d) > 5 ? " wk" : "") + '" data-day="' + d + '" role="button" tabindex="0" aria-label="Dia ' + Number(d.slice(8)) + '">' +
        '<div class="dnum"><span class="n' + (d === TODAY ? " today" : "") + '">' + Number(d.slice(8)) + "</span>" + (HOL[d] ? '<span class="hol" title="Feriado: a postagem segue programada">' + esc(HOL[d]) + "</span>" : "") + "</div>" +
        rest.slice(0, 6).map(chip).join("") + (rest.length > 6 ? '<span class="more">+' + (rest.length - 6) + " no dia</span>" : "") +
        (cortes.length ? '<span class="cortes">✂ ' + cortes.length + " cortes · " + cortes.filter(function (c) { return c.status === "concluido"; }).length + "/" + cortes.length + "</span>" : "") + "</div>";
    });
    html += "</div></div></div>";
    var undated = cards().filter(function (c) { return !c.date && passes(c); });
    if (undated.length) html += '<div class="tray"><h3>Sem data (a confirmar). Clique para definir a data</h3><div class="items">' + undated.map(function (c) { return chip(c).replace('data-open-day=""', 'data-open-day="undated"'); }).join("") + "</div></div>";
    return html;
  }

  function viewNext30() {
    var end = add(TODAY, 29), win = cards().filter(function (c) { return c.date && c.date >= TODAY && c.date <= end && passes(c); });
    var main = win.filter(function (c) { return c.type !== "corte" && c.type !== "agendamento"; }), cn = function (l, s) { return l.filter(function (c) { return c.status === s; }).length; };
    var risk = main.filter(function (c) { return c.risk && c.risk.on; }).length;
    var cort = win.filter(function (c) { return c.type === "corte"; });
    var html = '<div class="toolbar"><strong>De ' + dm(TODAY) + " a " + dm(end) + "</strong>" + ownerFilter() + "</div>" +
      '<div class="stats"><div class="stat" style="background:var(--yellow);color:#3B2150"><b>' + (cn(main, "pendente") + cn(main, "andamento")) + "</b><span>Pendentes</span></div>" +
      '<div class="stat" style="background:var(--heart);color:#fff"><b>' + cn(main, "concluido") + "</b><span>Concluídas</span></div>" +
      '<div class="stat" style="background:var(--carnation);color:#fff"><b>' + (risk + dueReminders().length) + "</b><span>Em risco</span></div></div>" +
      '<div class="hint" style="margin:0 0 6px">Entregas principais, sem contar os cortes. Cortes no período: ' + cort.length + " slots · " + cn(cort, "concluido") + " concluídos · " + cort.filter(function (c) { return !own(c); }).length + " sem responsável.</div>";
    var weeks = [], d;
    for (d = TODAY; d <= end; d = add(d, 1)) { var mo = mondayOf(d); if (weeks.indexOf(mo) < 0) weeks.push(mo); }
    weeks.forEach(function (mo) {
      html += '<section class="week"><h3>Semana de ' + dm(mo) + " a " + dm(add(mo, 6)) + "</h3>";
      for (var k = 0; k < 7; k++) {
        var day = add(mo, k); if (day < TODAY || day > end) continue;
        var li = dayItems(day).sort(sortDay), co = li.filter(function (c) { return c.type === "corte"; });
        html += '<div class="row' + (day === TODAY ? " today" : "") + '"><button class="d" data-day="' + day + '"><b>' + dm(day) + "</b><span>" + DNAME[toD(day).getUTCDay()] + "</span>" + (HOL[day] ? '<span class="hol" style="display:block">' + esc(HOL[day]) + "</span>" : "") + '</button><div class="items">' +
          li.filter(function (c) { return c.type !== "corte"; }).map(chip).join("") + (co.length ? '<button class="cortes" data-day="' + day + '">✂ ' + co.length + " cortes</button>" : "") + "</div></div>";
      }
      html += "</section>";
    });
    return html;
  }

  function viewAlerts() {
    var all = cards(), html = '<div class="panel"><h3>Agendamento de episódios</h3><p>O episódio precisa estar agendado até a segunda-feira da semana anterior à publicação.</p><ul class="alist">';
    var rems = all.filter(function (c) { return c.type === "agendamento"; }).map(function (r) { var x = remState(r); x.r = r; return x; }).filter(function (x) { return x.s !== "orphan" && x.s !== "past"; }).sort(function (a, b) { return a.r.date < b.r.date ? -1 : 1; });
    rems.slice(0, 8).forEach(function (x) {
      var tag = x.s === "ok" ? "✓ agendado" : x.s === "upcoming" ? "prazo " + br(x.r.date) : x.s === "today" ? "prazo é hoje" : "atrasado " + x.late + "d";
      html += '<li><span class="dt">' + dm(x.r.date) + '</span><button class="link" data-day="' + esc(x.r.ep ? byId(x.r.ep).date : x.r.date) + '">' + esc(x.r.title) + "</button> <strong style=\"color:" + (x.s === "late" || x.s === "today" ? "var(--carnation)" : "inherit") + '">' + tag + "</strong></li>";
    });
    html += "</ul></div>";
    function group(title, list, fmt) {
      if (!list.length) return "";
      return '<div class="panel"><h3>' + esc(title) + " · " + list.length + '</h3><ul class="alist">' + list.slice(0, 40).map(function (c) {
        return '<li><span class="dt">' + (c.date ? dm(c.date) : "—") + '</span><button class="link" data-day="' + esc(c.date || "undated") + '">' + esc(fmt ? fmt(c) : c.title) + "</button></li>";
      }).join("") + "</ul></div>";
    }
    html += group("Aprovados, aguardando agendamento", all.filter(function (c) { return c.type === "aprovacao" && c.stage === "aprovado"; }));
    var live = all.filter(function (c) { return c.status !== "concluido" && c.type !== "agendamento"; });
    html += group("Riscos sinalizados", live.filter(function (c) { return c.risk && c.risk.on; }), function (c) { return c.title + ": " + (c.risk.description || "risco") + (c.sub ? " · Plano B: " + c.sub : ""); });
    html += group("Convidado a confirmar", live.filter(function (c) { return c.gs === "a_confirmar"; }));
    html += group("Gravação sem data", live.filter(function (c) { return !c.date; }));
    var noOwner = {};
    live.filter(function (c) { return !own(c) && (!c.date || c.date >= TODAY); }).forEach(function (c) { (noOwner[c.type] = noOwner[c.type] || []).push(c); });
    var keys = Object.keys(noOwner);
    if (keys.length) html += '<div class="panel"><h3>Sem responsável</h3><p>Defina o responsável padrão de cada tipo na aba Equipe para preencher tudo de uma vez.</p><ul class="alist">' + keys.map(function (k) {
      var l = noOwner[k].filter(function (c) { return c.date; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
      return "<li><span class=\"dt\">" + noOwner[k].length + "</span><span>" + esc(TYPES[k].label) + (l.length ? " (de " + dm(l[0].date) + " a " + dm(l[l.length - 1].date) + ")" : "") + "</span></li>";
    }).join("") + "</ul></div>";
    return html;
  }

  function viewTeam() {
    var html = '<div class="panel"><h3>Equipe</h3><p>Um nome por linha. Esses nomes aparecem na lista de responsáveis de cada atribuição.</p>' +
      '<textarea id="team-names" rows="6" placeholder="Ex.: Maria Silva&#10;João Souza">' + esc(team.names.join("\n")) + "</textarea></div>" +
      '<div class="panel"><h3>Responsável padrão por tipo</h3><p>Aplica o nome a todas as atribuições daquele tipo que ainda não têm responsável (inclusive os 3 cortes de cada dia).</p><div class="defaults">';
    var names = teamNames();
    Object.keys(TYPES).filter(function (k) { return k !== "risco"; }).forEach(function (k) {
      html += '<label class="f">' + esc(TYPES[k].short) + '<select data-default="' + k + '"><option value="">— ninguém —</option>' + names.map(function (n) { return "<option" + ((team.defaults[k] || "") === n ? " selected" : "") + ">" + esc(n) + "</option>"; }).join("") + "</select></label>";
    });
    return html + '</div><button class="btn" data-act="save-team"' + (canWrite ? "" : " disabled") + ">Salvar equipe</button></div>";
  }

  /* ---------- painel do dia ---------- */
  function taskHtml(c) {
    var t = TYPES[c.type] || TYPES.risco, names = teamNames(), dis = canWrite ? "" : " disabled", cur = c.owner || "";
    var opts = '<option value="">' + (team.defaults[c.type] ? "Padrão: " + esc(team.defaults[c.type]) : "— sem responsável —") + "</option>" + names.map(function (n) { return "<option" + (cur === n ? " selected" : "") + ">" + esc(n) + "</option>"; }).join("");
    if (cur && names.indexOf(cur) < 0) opts += "<option selected>" + esc(cur) + "</option>";
    var sched = c.type === "publicacao" ? '<div class="agendar"><label class="chk"><input type="checkbox" data-f="scheduled"' + (c.scheduled ? " checked" : "") + dis + ">Episódio já está AGENDADO na plataforma</label><small>Prazo: segunda-feira da semana anterior à publicação (" + esc(br(add(c.date || TODAY, OFF.agendamento))) + ").</small></div>" : "";
    var rbox = "", rpub = c.type === "agendamento" ? byId(c.ep) : null;
    if (rpub) rbox = '<div class="agendar row2"><button class="btn big' + (rpub.scheduled ? " ok" : "") + '" data-act="sched" data-pub="' + esc(rpub.id) + '"' + dis + ">" + (rpub.scheduled ? "✓ Agendado · desfazer" : "Marcar como agendado") + "</button><small>Episódio de " + esc(br(rpub.date)) + (rpub.guest ? " (" + esc(rpub.guest) + ")" : "") + " · prazo para agendar: " + esc(br(c.date)) + "</small></div>";
    var jira = c.jira ?' · <a href="https://cardapio-web.atlassian.net/browse/' + encodeURIComponent(c.jira) + '" target="_blank" rel="noreferrer">abrir ' + esc(c.jira) + "</a>" : "";
    return '<article class="task" data-id="' + esc(c.id) + '"><div class="bar" style="background:' + t.bg + ";color:" + t.fg + ";border-color:" + t.bd + '">' + esc(t.short) + (c.slot ? " " + c.slot + "/3" : "") + (c.sug ? " · sugestão" : "") + '<em>' + ICON[c.status] + " " + STATUS[c.status] + "</em></div>" +
      '<input type="text" class="title" data-f="title" value="' + esc(c.title) + '" aria-label="Título"' + dis + ">" +
      (STAGES[c.type] ? '<label class="f" style="margin-bottom:8px">Etapa<select data-f="stage"' + dis + ">" + STAGES[c.type].map(function (s) { return '<option value="' + s[0] + '"' + ((c.stage || "") === s[0] ? " selected" : "") + ">" + esc(s[1]) + "</option>"; }).join("") + "</select></label>" : "") +
      (c.auto ? '<p class="hint" style="margin:0 0 8px">' + esc(c.auto) + "</p>" : "") + '<div class="fields"><label class="f">Responsável<select data-f="owner"' + dis + ">" + opts + "</select></label>" +
      '<label class="f">Status<select data-f="status"' + dis + ">" + Object.keys(STATUS).map(function (k) { return '<option value="' + k + '"' + (c.status === k ? " selected" : "") + ">" + STATUS[k] + "</option>"; }).join("") + "</select></label>" +
      '<label class="f">Data<input type="date" data-f="date" value="' + esc(c.date || "") + '"' + dis + "></label></div>" + sched + rbox +
      '<details><summary>Mais detalhes</summary><div class="more-f"><div class="fields">' +
      '<label class="f">Convidado<input type="text" data-f="guest" value="' + esc(c.guest) + '"' + dis + "></label>" +
      '<label class="f">Convidado confirmado?<select data-f="gs"' + dis + '><option value="">—</option><option value="confirmado"' + (c.gs === "confirmado" ? " selected" : "") + '>Confirmado</option><option value="a_confirmar"' + (c.gs === "a_confirmar" ? " selected" : "") + ">A confirmar</option></select></label>" +
      '<label class="f">Task do Jira (ex.: SCC-1836)<input type="text" data-f="jira" value="' + esc(c.jira) + '"' + dis + "></label>" +
      '<label class="f">Link do material<input type="text" data-f="material" value="' + esc(c.material) + '" placeholder="Drive / Notion / YouTube"' + dis + "></label></div>" +
      (c.material && /^https?:\/\//.test(c.material) ? '<a href="' + esc(c.material) + '" target="_blank" rel="noreferrer">abrir material</a>' : "") + (jira ? "<div>" + jira.slice(3) + "</div>" : "") +
      '<label class="chk"><input type="checkbox" data-f="risk.on"' + (c.risk && c.risk.on ? " checked" : "") + dis + ">Sinalizar risco</label>" +
      '<input type="text" data-f="risk.description" placeholder="Descrição do risco" value="' + esc(c.risk ? c.risk.description : "") + '"' + dis + ">" +
      '<label class="f">Substituição prevista (plano B)<input type="text" data-f="sub" value="' + esc(c.sub) + '" placeholder="ex.: episódio reserva"' + dis + "></label>" +
      '<label class="f">Observações<textarea data-f="notes" rows="3"' + dis + ">" + esc(c.notes) + "</textarea></label>" +
      '<label class="chk"><input type="checkbox" data-f="sug"' + (c.sug ? " checked" : "") + dis + ">A data é só uma sugestão</label></div></details>" +
      '<div class="foot"><button class="btn ghost" data-act="del"' + dis + ">Excluir</button></div></article>";
  }
  function renderPanel() {
    var ov_ = document.getElementById("cast-overlay"), p = st.panel;
    if (p === undefined) { ov_.innerHTML = ""; return; }
    var list = (p === "undated" ? cards().filter(function (c) { return !c.date; }) : cards().filter(function (c) { return c.date === p; })).sort(sortDay);
    var head = p === "undated" ? "Gravações sem data" : DNAME[toD(p).getUTCDay()] + ", " + br(p);
    var html = '<div class="scrim" data-act="close"></div><aside class="drawer" role="dialog" aria-label="Atribuições do dia"><div class="dhead"><div><h2>' + esc(head) + "</h2>" +
      (HOL[p] ? '<div class="hol">Feriado: ' + esc(HOL[p]) + ". As postagens seguem programadas.</div>" : "") + '</div><button class="x" data-act="close" aria-label="Fechar">×</button></div>';
    if (!canWrite) html += '<div class="notice">Você pode ver, mas não editar este calendário.</div>';
    if (p !== "undated" && canWrite) html += '<div class="addbox"><select id="new-type" aria-label="Tipo">' + Object.keys(TYPES).map(function (k) { return '<option value="' + k + '"' + (k === "edicao" ? " selected" : "") + ">" + esc(TYPES[k].short) + "</option>"; }).join("") + '</select><input type="text" id="new-title" placeholder="Nova atribuição neste dia"><button class="btn" data-act="add">Adicionar</button></div>';
    html += list.length ? list.map(taskHtml).join("") : '<div class="empty-note">Nenhuma atribuição neste dia.</div>';
    ov_.innerHTML = html + "</aside>";
  }
  function openPanel(d) { st.panel = d; renderPanel(); var e = document.querySelector(".drawer"); if (e) e.scrollTop = 0; }

  /* ---------- render geral ---------- */
  function renderBanner() {
    var due = dueReminders(), el = document.getElementById("cast-banner");
    el.innerHTML = due.length && st.tab !== "painel" ? '<div class="alertbar"><b>⏰ Agendamento pendente (' + due.length + ')</b><ul>' + due.map(function (x) { return "<li><span>" + esc(remText(x)) + '</span><button class="link" data-day="' + esc(x.pub.date) + '">abrir episódio</button>' + (canWrite ? '<button class="link" data-act="sched" data-pub="' + esc(x.pub.id) + '">marcar como agendado</button>' : "") + "</li>"; }).join("") + "</ul></div>" : "";
    document.getElementById("cast-notice").innerHTML = db ? "" : '<div class="notice">As edições não serão salvas para o time nesta visualização.</div>';
  }
  function renderMain() {
    var f = document.activeElement;
    var m = document.getElementById("cast-main");
    m.innerHTML = viewFor();
  }
  function render() { renderTabs(); renderBanner(); renderMain(); setSync(); }

  /* ---------- eventos ---------- */
  ROOT.addEventListener("click", function (e) {
    var t = e.target.closest("[data-tab],[data-act],[data-day],[data-open-day]");
    if (!t) return;
    if (t.dataset.tab) { st.tab = t.dataset.tab; render(); return; }
    var a = t.dataset.act;
    if (a && gAct(t, a)) return;
    if (a === "prev" || a === "next") { var i = MONTHS.indexOf(st.month) + (a === "next" ? 1 : -1); if (MONTHS[i]) { st.month = MONTHS[i]; render(); } return; }
    if (a === "sched") { var pp = byId(t.dataset.pub); if (pp && canWrite) { setScheduled(pp.id, !pp.scheduled); renderPanel(); render(); } return; }
    if (a === "close") { st.panel = undefined; renderPanel(); return; }
    if (a === "add") {
      var ti = document.getElementById("new-title"), ty = document.getElementById("new-type"), title = ti.value.trim() || TYPES[ty.value].short;
      var id = "m-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      touch(id, mk({ id: id, type: ty.value, title: title, date: st.panel }));
      renderPanel(); render(); return;
    }
    if (a === "del") { var art = t.closest(".task"); if (t.dataset.sure) { removeCard(art.dataset.id); renderPanel(); render(); } else { t.dataset.sure = "1"; t.textContent = "Confirmar exclusão"; } return; }
    if (a === "save-team") {
      team.names = document.getElementById("team-names").value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
      document.querySelectorAll("[data-default]").forEach(function (s) { if (s.value) team.defaults[s.dataset.default] = s.value; else delete team.defaults[s.dataset.default]; });
      saveTeam(); render(); return;
    }
    var day = t.dataset.day || t.dataset.openDay;
    if (day) openPanel(day === "undated" ? "undated" : day);
  });
  ROOT.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && st.panel !== undefined) { st.panel = undefined; renderPanel(); }
    if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("cell") && e.target.dataset.day) { e.preventDefault(); openPanel(e.target.dataset.day); }
    if (e.key === "Enter" && e.target.id === "new-title") document.querySelector('[data-act="add"]').click();
    if (e.key === "Enter" && e.target.closest && e.target.closest(".entry") && e.target.inputMode === "numeric") { var rb = e.target.closest(".entry").querySelector('[data-act="reg-seg"]'); if (rb) rb.click(); }
  });
  ROOT.addEventListener("change", function (e) {
    var t = e.target;
    if (t.dataset && t.dataset.col) { gField(t, true); return; }
    if (t.id === "f-rstatus") { st.rf = t.value; renderMain(); return; }
    if (t.id === "f-mstatus") { st.mf = t.value; renderMain(); return; }
    if (t.id === "f-conf") { st.cf = t.value; renderMain(); return; }
    if (t.id === "f-owner") { st.owner = t.value; render(); return; }
    if (t.id === "f-type") { st.type = t.value; render(); return; }
    editField(t, true);
  });
  ROOT.addEventListener("input", function (e) { if (e.target.closest(".task") && /^(text|textarea)$/.test(e.target.type)) editField(e.target, false); });
  ROOT.addEventListener("input", function (e) { var t = e.target; if (t.dataset && t.dataset.col && t.tagName !== "SELECT" && t.type !== "checkbox" && t.type !== "date") gField(t, false); });
  function editField(t, commit) {
    var art = t.closest(".task"), f = t.dataset.f;
    if (!art || !f) return;
    var id = art.dataset.id, v = t.type === "checkbox" ? t.checked : t.value, cur = getCard(id);
    if (f === "status" && cur.type === "agendamento" && cur.ep) { setScheduled(cur.ep, v === "concluido"); if (commit) { renderPanel(); render(); } return; }
    if (f === "stage") {
      var sg = stageOf(cur.type, v);
      touch(id, { stage: v, status: sg ? sg[3] : cur.status, stageManual: true });
      if (cur.type === "aprovacao" && v === "agendado" && cur.ep) setScheduled(cur.ep, true);
      if (commit) { renderPanel(); render(); }
      return;
    }
    if (f === "scheduled") { setScheduled(id, v); if (commit) { renderPanel(); render(); } return; }
    if (f === "risk.on") touch(id, { risk: { on: v, description: cur.risk ? cur.risk.description : "" } });
    else if (f === "risk.description") touch(id, { risk: { on: cur.risk ? cur.risk.on || !!v : !!v, description: v } });
    else if (f === "jira") touch(id, { jira: String(v).trim().toUpperCase() });
    else if (f === "date") { touch(id, { date: v || null, sug: false }); if (commit) { renderPanel(); render(); } return; }
    else touch(id, (function () { var o = {}; o[f] = v; return o; })());
    if (commit && /^(status|owner|scheduled|gs|sug|risk\.on)$/.test(f)) { var bar = art.querySelector(".bar em"); if (bar && f === "status") bar.textContent = ICON[v] + " " + STATUS[v]; render(); }
    else if (f === "title") renderMain();
  }
  /* arrastar e soltar entre dias */
  ROOT.addEventListener("dragstart", function (e) { var c = e.target.closest && e.target.closest("[data-drag]"); if (c && canWrite) { e.dataTransfer.setData("text/plain", c.dataset.drag); e.dataTransfer.effectAllowed = "move"; } else if (c) e.preventDefault(); });
  ROOT.addEventListener("dragover", function (e) { var c = e.target.closest && e.target.closest(".cell[data-day]"); if (c) { e.preventDefault(); document.querySelectorAll(".cell.over").forEach(function (x) { x.classList.remove("over"); }); c.classList.add("over"); } });
  ROOT.addEventListener("drop", function (e) {
    var c = e.target.closest && e.target.closest(".cell[data-day]"); document.querySelectorAll(".cell.over").forEach(function (x) { x.classList.remove("over"); });
    if (!c) return; e.preventDefault(); var id = e.dataTransfer.getData("text/plain");
    if (id && getCard(id)) { touch(id, { date: c.dataset.day, sug: false }); render(); }
  });

  /* ========== GESTÃO: meta, métricas, conferência, riscos, melhorias e reunião ========== */
  var nf = new Intl.NumberFormat("pt-BR"), pf = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
  var fN = function (v) { return v == null || v === "" || isNaN(v) ? "—" : nf.format(v); };
  var pf2 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
  var fP = function (v) { return v == null || isNaN(v) ? "—" : (Math.abs(v) < 1 ? pf2 : pf).format(v) + "%"; };
  var S = { metricas: new Map(), riscos: new Map(), melhorias: new Map(), semana: new Map(), conf: new Map(), seguidores: new Map(), yt_diario: new Map(), ig_diario: new Map(), videos: new Map(), config: new Map() };
  var gPending = new Map(), gTimers = {};
  var gGet = function (col, id) { return S[col].get(id) || {}; };
  var dis_ = function () { return canWrite ? "" : " disabled"; };
  var newId = function (p) { return p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); };
  var rList = function (col) { return Array.from(S[col], function (e) { return Object.assign({ id: e[0] }, e[1]); }); };

  function gPut(col, id, patch) {
    var next = Object.assign({}, S[col].get(id) || {}, patch), k = col + "/" + id;
    S[col].set(id, next); gPending.set(k, next);
    clearTimeout(gTimers[k]); gTimers[k] = setTimeout(function () { gFlush(col, id); }, 500);
  }
  function gFlush(col, id) {
    var k = col + "/" + id, data = gPending.get(k); if (!data || !db) return;
    saving++; setSync();
    db.doc(k).set(JSON.parse(JSON.stringify(data))).then(function () { if (gPending.get(k) === data) gPending.delete(k); lastErr = ""; })
      .catch(function (e) { lastErr = e && e.code === "invalid_argument" ? "Você não tem permissão para editar" : "Não foi possível salvar. Tente de novo."; if (e && e.code === "invalid_argument") canWrite = false; })
      .then(function () { saving--; setSync(); });
  }
  function gDel(col, id) {
    S[col].delete(id); gPending.delete(col + "/" + id);
    if (db) db.doc(col + "/" + id).delete().catch(function () { lastErr = "Não foi possível excluir."; setSync(); });
  }
  function gField(t, commit) {
    var col = t.dataset.col, id = t.dataset.id, k = t.dataset.k;
    var v = t.type === "checkbox" ? t.checked : t.type === "number" ? (t.value === "" ? null : Number(t.value)) : t.value;
    if (col === "seguidores" && k === "total" && v != null) v = Number(String(t.value).replace(/\D/g, "")) || null;   // "11.007" é onze mil e sete, não 11,007
    var p = k.split("."), patch = {};
    if (p.length === 2) { var o = Object.assign({}, gGet(col, id)[p[0]] || {}); o[p[1]] = v; patch[p[0]] = o; } else patch[k] = v;
    gPut(col, id, patch);
    if (commit && (t.tagName === "SELECT" || t.type === "checkbox" || t.type === "date")) { renderTabs(); renderBanner(); renderMain(); }
  }
  function editingMain() { var a = document.activeElement; return !!(a && a.closest && a.closest("#cast-main") && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)); }
  function gRender() { renderTabs(); renderBanner(); if (st.tab !== "equipe" && !editingMain()) renderMain(); setSync(); }
  function gSubscribe() {
    ["metricas", "riscos", "melhorias", "semana", "conf", "seguidores", "yt_diario", "ig_diario"].forEach(function (c) {
      db.collection(c).onSnapshot(function (snap) {
        var m = new Map(); snap.docs.forEach(function (d) { m.set(d.id, d.data()); });
        gPending.forEach(function (v, k) { if (k.indexOf(c + "/") === 0) m.set(k.slice(c.length + 1), v); });
        S[c] = m; gRender();
      }, function () { lastErr = "Sem acesso aos dados salvos"; setSync(); });
    });
    db.doc("videos/estudio").onSnapshot(function (d) { if (d.exists) { S.videos.set("estudio", d.data()); gRender(); } });
    db.doc("config/meta").onSnapshot(function (d) { if (d.exists) { S.config.set("meta", d.data()); gRender(); } });
    db.doc("config/metas").onSnapshot(function (d) { if (d.exists) { S.config.set("metas", d.data()); gRender(); } });
  }

  /* ----- campos de formulário (todos gravam no db pelo gField) ----- */
  var fid = function (col, id, k) { return "f-" + col + "-" + id + "-" + k.replace(/\./g, "-"); };
  function txt(col, id, k, label, val, type, ph) {
    return '<label class="f">' + esc(label) + '<input type="' + (type || "text") + '" id="' + esc(fid(col, id, k)) + '" data-col="' + col + '" data-id="' + esc(id) + '" data-k="' + k + '" value="' + esc(val == null ? "" : val) + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : "") + dis_() + "></label>";
  }
  function area(col, id, k, label, val, rows, ph) {
    return '<label class="f">' + esc(label) + '<textarea rows="' + (rows || 3) + '" id="' + esc(fid(col, id, k)) + '" data-col="' + col + '" data-id="' + esc(id) + '" data-k="' + k + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : "") + dis_() + ">" + esc(val) + "</textarea></label>";
  }
  function sel(col, id, k, label, list, val) {
    return '<label class="f">' + esc(label) + '<select id="' + esc(fid(col, id, k)) + '" data-col="' + col + '" data-id="' + esc(id) + '" data-k="' + k + '"' + dis_() + ">" +
      list.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(val || "") === o[0] ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select></label>";
  }
  function ownerSel(col, id, k, label, val) {
    var names = teamNames(); if (val && names.indexOf(val) < 0) names.push(val);
    return sel(col, id, k, label, [["", "— definir —"]].concat(names.map(function (n) { return [n, n]; })), val);
  }
  function chk(col, id, k, label, val, extra) {
    return '<label class="chk"><input type="checkbox" id="' + esc(fid(col, id, k)) + '" data-col="' + col + '" data-id="' + esc(id) + '" data-k="' + k + '"' + (val ? " checked" : "") + dis_() + "><span>" + esc(label) + "</span>" + (extra || "") + "</label>";
  }
  var dlt = function (c, p) {
    if (c == null || p == null || p === 0 || isNaN(c) || isNaN(p)) return "";
    var d = (c - p) / Math.abs(p) * 100;
    return '<small class="' + (d >= 0 ? "up" : "down") + '">' + (d >= 0 ? "▲ " : "▼ ") + pf.format(Math.abs(d)) + "% vs. anterior</small>";
  };

  /* ----- meta oficial: +2.000 seguidores no @cw.cast ----- */
  var SL = { ok: "No ritmo", warn: "Atenção", bad: "Atrasada", none: "Sem dado" };
  var metList = function () { return rList("metricas").sort(function (a, b) { return String(a.fim || "").localeCompare(String(b.fim || "")); }); };
  /* ----- seguidores: leitura diária e ritmo necessário ----- */
  function segSeries() {
    var map = {};
    metList().forEach(function (w) { if (w.ig && w.ig.seguidores != null && w.fim) map[w.fim] = w.ig.seguidores; });
    S.seguidores.forEach(function (v, id) { if (v && v.total != null && v.total !== "" && !isNaN(Number(v.total))) map[id] = Number(v.total); });
    return Object.keys(map).sort().map(function (d) { return { d: d, total: map[d] }; });
  }
  var sgn = function (v) { return v == null || isNaN(v) ? "—" : (v > 0 ? "+" : "") + nf.format(Math.round(v)); };
  var fD = function (v) { return v == null || isNaN(v) ? "—" : pf.format(v); };
  function igMeta(asOf) {
    var m = Object.assign({ base: 10629, base_data: "2026-10-14", meta: 2000, inicio: "2026-10-01", fim: "2026-12-31" }, S.config.get("meta") || {});
    m.base = Number(m.base) || 0; m.meta = Number(m.meta) || 2000;
    var ser = segSeries().filter(function (p) { return p.d >= m.inicio && p.d <= m.fim && (!asOf || p.d <= asOf); }), last = ser[ser.length - 1];
    // a contagem começa na data-base (o número anotado); antes dela não há leitura, então o esperado também parte dali
    var zero = m.base_data && m.base_data >= m.inicio ? m.base_data : add(m.inicio, -1);
    var hoje0 = asOf || TODAY, ref = last ? last.d : hoje0, total = Math.max(diff(m.fim, zero), 1), el = Math.max(0, Math.min(total, diff(ref, zero)));
    var r = { m: m, last: last ? { fim: last.d } : null, ref: ref, esperado: m.meta * el / total, atual: last ? last.total : null, original: m.meta / total };
    r.ganhos = r.atual == null ? null : r.atual - m.base;
    r.faltam = r.ganhos == null ? null : Math.max(m.meta - r.ganhos, 0);
    r.ratio = r.ganhos == null || r.esperado <= 0 ? null : r.ganhos / r.esperado;
    r.status = r.ratio == null ? "none" : r.ratio >= 0.95 ? "ok" : r.ratio >= 0.8 ? "warn" : "bad";
    r.diasRestantes = Math.max(diff(m.fim, ref), 1);
    r.dia = r.faltam == null ? null : r.faltam / r.diasRestantes;
    r.precisa = r.dia == null ? null : r.dia * 7;
    r.rows = [];
    var pd = zero, pt = m.base;
    ser.forEach(function (p) {
      var dias = Math.max(diff(p.d, pd), 1), ganho = p.total - pt, prevAcum = pt - m.base;
      r.rows.push({ d: p.d, total: p.total, ganho: ganho, dias: dias, porDia: ganho / dias, need: Math.max(m.meta - prevAcum, 0) / Math.max(diff(m.fim, pd), 1), acum: p.total - m.base, src: S.seguidores.has(p.d) ? "diario" : "semana" });
      pd = p.d; pt = p.total;
    });
    r.media = r.ganhos == null ? null : r.ganhos / Math.max(diff(ref, zero), 1);
    r.zero = zero;
    r.hoje = r.rows.filter(function (x) { return x.d === hoje0; })[0] || null;
    r.start = ref >= hoje0 ? add(ref, 1) : hoje0;
    return r;
  }
  /* ----- projeção: no ritmo dos últimos 7 dias, onde a meta chega em 31/12 ----- */
  function projecao(r) {
    var m = r.m, ser = segSeries().filter(function (p) { return p.d >= m.inicio && p.d <= m.fim; });
    if (m.base_data && m.base_data >= add(m.inicio, -1) && (!ser.length || m.base_data < ser[0].d)) ser.unshift({ d: m.base_data, total: m.base });
    if (ser.length < 2 || r.ganhos == null) return null;
    var last = ser[ser.length - 1], corte = add(last.d, -7), base = ser[0];
    for (var i = ser.length - 2; i >= 0; i--) { if (ser[i].d <= corte) { base = ser[i]; break; } }
    var ritmo = (last.total - base.total) / Math.max(diff(last.d, base.d), 1), restam = Math.max(diff(m.fim, last.d), 0);
    var final = r.ganhos + Math.max(ritmo, 0) * restam;
    return { ser: ser, last: last, base: base, ritmo: ritmo, restam: restam, final: final, pct: final / m.meta * 100,
             bate: r.faltam === 0 ? last.d : ritmo > 0 ? add(last.d, Math.ceil(r.faltam / ritmo)) : null };
  }
  function projStatus(pj, r) { return !pj ? "none" : pj.final >= r.m.meta ? "ok" : pj.final >= r.m.meta * 0.85 ? "warn" : "bad"; }
  function projChart(pj, r) {
    var m = r.m, W = 700, H = 240, L = 46, R = 12, T = 14, B = 28, x0 = add(m.inicio, -1), dias = Math.max(diff(m.fim, x0), 1);
    var max = Math.max(m.meta, pj.final) * 1.08;
    var X = function (d) { return L + (W - L - R) * Math.max(0, Math.min(1, diff(d, x0) / dias)); }, Y = function (v) { return T + (H - T - B) * (1 - Math.max(v, 0) / max); };
    var s = '<svg viewBox="0 0 700 240" role="img" aria-label="Seguidores conquistados, meta e projeção até ' + br(m.fim) + '" class="segchart">';
    [0, 0.5, 1].forEach(function (f) { var v = max * f; s += '<line class="cg" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v) + '" y2="' + Y(v) + '"/><text class="ct" x="' + (L - 6) + '" y="' + (Y(v) + 3) + '" text-anchor="end">' + fN(Math.round(v)) + "</text>"; });
    s += '<line x1="' + X(x0) + '" y1="' + Y(0) + '" x2="' + X(m.fim) + '" y2="' + Y(m.meta) + '" stroke="#9aa0aa" stroke-width="2" stroke-dasharray="4 5"/>';
    s += '<text class="ct" x="' + (X(m.fim) - 4) + '" y="' + (Y(m.meta) - 6) + '" text-anchor="end">meta +' + fN(m.meta) + "</text>";
    var pts = pj.ser.map(function (p) { return X(p.d) + "," + Y(p.total - m.base); }).join(" ");
    s += '<polyline points="' + pts + '" fill="none" stroke="#7c3aed" stroke-width="3" stroke-linejoin="round"/>';
    s += '<line x1="' + X(pj.last.d) + '" y1="' + Y(r.ganhos) + '" x2="' + X(m.fim) + '" y2="' + Y(pj.final) + '" stroke="' + (pj.final >= m.meta ? "#16a34a" : "#dc2626") + '" stroke-width="3" stroke-dasharray="8 6"/>';
    s += '<circle cx="' + X(pj.last.d) + '" cy="' + Y(r.ganhos) + '" r="5" fill="#7c3aed"/>';
    s += '<text class="cv" x="' + (X(m.fim) - 4) + '" y="' + (Y(pj.final) + (pj.final >= m.meta ? -8 : 16)) + '" text-anchor="end">projeção +' + fN(Math.round(pj.final)) + "</text>";
    [m.inicio, add(m.inicio, Math.round(dias / 2)), m.fim].forEach(function (d) { s += '<text class="ct" x="' + X(d) + '" y="' + (H - 8) + '" text-anchor="middle">' + dm(d) + "</text>"; });
    return s + "</svg>";
  }
  function projCard(r) {
    var pj = projecao(r), m = r.m;
    if (!pj) return '<section class="card"><div class="cardhead"><h3>Projeção até ' + br(m.fim) + '</h3></div><div class="empty-note">Precisa de pelo menos duas leituras de seguidores para projetar. O robô registra uma por dia.</div></section>';
    var st2 = projStatus(pj, r), frase = pj.final >= m.meta
      ? "No ritmo atual, batemos a meta em <b>" + br(pj.bate) + "</b> e chegamos a <b>+" + fN(Math.round(pj.final)) + "</b> em " + br(m.fim) + " (" + fN(Math.round(pj.pct)) + "% da meta)."
      : "No ritmo atual, chegamos a <b>+" + fN(Math.round(pj.final)) + "</b> em " + br(m.fim) + " (" + fN(Math.round(pj.pct)) + "% da meta). Para bater, o ritmo precisa subir de <b>" + fD(pj.ritmo) + "</b> para <b>" + fN(Math.ceil(r.dia)) + "</b> por dia.";
    return '<section class="card"><div class="cardhead"><h3>Projeção até ' + br(m.fim) + '</h3><span class="pill ' + st2 + '">' + (st2 === "ok" ? "Bate a meta" : st2 === "warn" ? "Perto" : "Não bate") + "</span></div>" +
      '<div class="kpis"><div class="kpi"><span>Ritmo atual</span><b>' + (pj.ritmo >= 0 ? "+" : "") + fD(pj.ritmo) + "</b><small>por dia (de " + dm(pj.base.d) + " a " + dm(pj.last.d) + ")</small></div>" +
      '<div class="kpi"><span>Precisa por dia</span><b>' + fN(Math.ceil(r.dia || 0)) + "</b><small>até " + br(m.fim) + "</small></div>" +
      '<div class="kpi ' + (st2 === "ok" ? "ok" : st2 === "bad" ? "bad" : "") + '"><span>Projeção em ' + dm(m.fim) + "</span><b>+" + fN(Math.round(pj.final)) + "</b><small>" + fN(Math.round(pj.pct)) + "% da meta</small></div>" +
      '<div class="kpi"><span>Bate a meta em</span><b>' + (pj.bate && pj.bate <= m.fim ? dm(pj.bate) : "—") + "</b><small>" + (pj.bate && pj.bate <= m.fim ? "no ritmo atual" : "não bate no ritmo atual") + "</small></div></div>" +
      projChart(pj, r) + '<p class="hint">' + frase + " O ritmo usa os últimos 7 dias de leitura; muda todo dia com a leitura nova do robô.</p></section>";
  }
  function meterHtml(r) {
    var pct = r.ganhos == null ? 0 : Math.max(0, Math.min(100, r.ganhos / r.m.meta * 100)), ep = Math.min(100, r.esperado / r.m.meta * 100);
    return '<div class="meter" role="img" aria-label="Progresso da meta de seguidores"><i style="width:' + pct + '%"></i><u style="left:' + ep + '%" title="Esperado até hoje"></u></div>';
  }
  function hojeTxt(r) { return r.hoje ? sgn(r.hoje.ganho) + (r.hoje.dias > 1 ? " em " + r.hoje.dias + "d" : "") : "sem leitura"; }
  function segEntry() {
    if (!canWrite) return "";
    return '<div class="entry"><label class="f">Data<input type="date" value="' + TODAY + '"></label><label class="f">Seguidores do perfil<input type="text" inputmode="numeric" placeholder="total nesse dia (ex.: 11010)"></label><button class="btn" data-act="reg-seg">Registrar</button></div>';
  }
  function metaMini(r) {
    var m = r.m;
    return '<section class="card"><div class="cardhead"><h3>Meta de seguidores</h3><span class="pill ' + r.status + '">' + SL[r.status] + "</span></div>" +
      '<div class="big"><b>' + sgn(r.ganhos) + "</b><span>de " + fN(m.meta) + " novos · faltam <strong>" + fN(r.faltam) + "</strong></span></div>" + meterHtml(r) +
      '<div class="trio"><div><span>Precisa por dia</span><b>' + (r.dia == null ? "—" : fN(Math.ceil(r.dia))) + "</b></div><div><span>Média até agora</span><b>" + fD(r.media) + "</b></div><div><span>Hoje</span><b>" + hojeTxt(r) + "</b></div></div>" + segEntry() +
      (function () { var pj = projecao(r); return pj ? '<p class="hint" style="margin:6px 0 0"><b>Projeção ' + dm(r.m.fim) + ":</b> +" + fN(Math.round(pj.final)) + " (" + fN(Math.round(pj.pct)) + "% da meta) no ritmo de " + fD(pj.ritmo) + "/dia" + (pj.final >= r.m.meta && pj.bate ? "; bate em " + dm(pj.bate) : "") + ".</p>" : ""; })() +
      '<p class="hint">' + (r.last ? "Última leitura: " + br(r.last.fim) + ". " : "Sem leitura ainda. ") + go("meta", "Ver ritmo dia a dia") + "</p></section>";
  }

  var SVGNS = '<svg viewBox="0 0 700 240" role="img" aria-label="Seguidores novos por dia: registrado e necessário" class="segchart">';
  function segChart(r) {
    if (r.dia == null) return '<div class="empty-note">Registre a primeira leitura de seguidores para ver o gráfico.</div>';
    var items = r.rows.slice(-10).map(function (x) { return { d: x.d, v: x.porDia, need: x.need, f: false }; }), k;
    for (k = 0; k < 7; k++) { var dd = add(r.start, k); if (dd <= r.m.fim) items.push({ d: dd, v: r.dia, f: true }); }
    var max = Math.max.apply(null, items.map(function (x) { return x.v; }).concat([r.dia * 1.5, 1])), L = 40, R = 8, T = 16, B = 30, W = 700, H = 240, n = items.length, step = (W - L - R) / n, bw = Math.min(40, step * 0.6);
    var y = function (v) { return T + (H - T - B) * (1 - v / max); }, s = SVGNS;
    [0, 0.5, 1].forEach(function (f) { var v = max * f; s += '<line class="cg" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="ct" x="' + (L - 6) + '" y="' + (y(v) + 3) + '" text-anchor="end">' + fN(Math.round(v)) + "</text>"; });
    items.forEach(function (x, i) {
      var cx = L + step * i + step / 2, h = Math.max(y(0) - y(Math.max(x.v, 0)), 0), good = !x.f && x.v >= x.need;
      s += '<rect class="' + (x.f ? "cb-fut" : good ? "cb-ok" : "cb-bad") + '" x="' + (cx - bw / 2) + '" y="' + (y(0) - h) + '" width="' + bw + '" height="' + h + '" rx="5"/>';
      s += '<text class="ct" x="' + cx + '" y="' + (H - 10) + '" text-anchor="middle">' + dm(x.d) + "</text>";
      if (!x.f) s += '<text class="cv" x="' + cx + '" y="' + (y(0) - h - 5) + '" text-anchor="middle">' + fD(x.v) + "</text>";
    });
    s += '<line class="cl" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(r.dia) + '" y2="' + y(r.dia) + '"/><text class="clt" x="' + (W - R) + '" y="' + (y(r.dia) - 6) + '" text-anchor="end">precisa de ' + fN(Math.ceil(r.dia)) + " por dia</text></svg>";
    return s;
  }
  function viewMeta() {
    var r = igMeta(), m = r.m, d = dis_();
    var html = metasTrimestre() + '<h2 style="font-size:16px;margin:22px 0 6px">Seguidores em detalhe</h2><section class="card hero"><div class="cardhead"><h3>+' + fN(m.meta) + " seguidores no @cw.cast</h3><span class=\"pill " + r.status + '">' + SL[r.status] + '</span></div><div class="herogrid"><div><div class="big"><b>' + (r.faltam == null ? "—" : fN(r.faltam)) + "</b><span>seguidores faltam até " + br(m.fim) + "</span></div>" + meterHtml(r) +
      '<div class="mrow"><span>Conquistados <b>' + sgn(r.ganhos) + "</b></span><span>Esperado até hoje <b>+" + fN(Math.round(r.esperado)) + "</b></span><span>Seguidores agora <b>" + fN(r.atual) + "</b>" + (r.last ? " (" + dm(r.last.fim) + ")" : "") + "</span></div></div>" +
      '<div class="tiles"><div class="kpi"><span>Precisamos por dia</span><b>' + (r.dia == null ? "—" : fN(Math.ceil(r.dia))) + '</b><small>recalculado a cada leitura</small></div><div class="kpi"><span>Plano original</span><b>' + fN(Math.ceil(r.original)) + "</b><small>por dia, desde " + dm(add(r.zero, 1)) + "</small></div>" +
      '<div class="kpi"><span>Média até agora</span><b>' + fD(r.media) + "</b><small>por dia</small></div><div class=\"kpi\"><span>Ganho de hoje</span><b>" + hojeTxt(r) + "</b><small>" + (r.hoje ? "leitura de " + dm(r.hoje.d) : "registre a leitura de hoje") + "</small></div></div></div>" +
      "<h4 class=\"sechead\">Registrar leitura</h4>" + segEntry() + '<p class="hint">Anote o total de seguidores do perfil, de preferência no mesmo horário todo dia. Se pular um dia, o ganho é dividido entre os dias.</p></section>';
    html += projCard(r);
    html += '<div class="cols"><section class="card"><div class="cardhead"><h3>Seguidores novos por dia</h3></div>' + segChart(r) + '<div class="legend2"><span><i class="lg ok"></i>Bateu o necessário</span><span><i class="lg bad"></i>Abaixo do necessário</span><span><i class="lg fut"></i>Próximos dias</span></div></section>';
    html += '<section class="card"><div class="cardhead"><h3>Próximos dias</h3></div>';
    if (r.dia == null) html += '<div class="empty-note">Sem leitura ainda.</div>';
    else {
      html += '<div class="tablewrap flat"><table class="hist"><thead><tr><th>Dia</th><th>Precisa ganhar</th><th>Total no fim do dia</th></tr></thead><tbody>';
      for (var k = 0; k < 7; k++) { var dd = add(r.start, k); if (dd > m.fim) break; html += "<tr><td>" + DNAME[toD(dd).getUTCDay()] + " " + dm(dd) + "</td><td>+" + fN(Math.ceil(r.dia)) + "</td><td>" + fN(Math.round(r.atual + r.dia * diff(dd, r.ref))) + "</td></tr>"; }
      html += '</tbody></table></div><p class="hint">Se o ganho ficar abaixo disso, o número por dia sobe para os dias seguintes. Se passar, ele cai.</p>';
    }
    html += "</section></div>";
    html += '<section class="card"><div class="cardhead"><h3>Registro dia a dia</h3></div>' + (r.rows.length ? '<div class="tablewrap flat"><table class="hist"><thead><tr><th>Data</th><th>Seguidores</th><th>Ganho no período</th><th>Por dia</th><th>Precisava por dia</th><th>Situação</th><th></th></tr></thead><tbody>' +
      r.rows.slice().reverse().map(function (x) {
        var ok = x.porDia >= x.need;
        return "<tr><td>" + br(x.d) + "</td><td>" + (x.src === "diario" ? '<input type="number" class="cell-in" id="' + esc(fid("seguidores", x.d, "total")) + '" data-col="seguidores" data-id="' + esc(x.d) + '" data-k="total" value="' + x.total + '"' + d + ">" : fN(x.total) + ' <span class="quiet">(semana)</span>') + "</td><td>" + sgn(x.ganho) + (x.dias > 1 ? " em " + x.dias + "d" : "") + "</td><td>" + fD(x.porDia) + "</td><td>" + fD(x.need) + '</td><td><span class="tag ' + (ok ? "ok" : "bad") + '">' + (ok ? "No ritmo" : "Abaixo") + "</span></td><td>" + (x.src === "diario" && canWrite ? '<button class="btn ghost mini" data-act="del-g" data-col="seguidores" data-id="' + esc(x.d) + '">Excluir</button>' : "") + "</td></tr>";
      }).join("") + "</tbody></table></div>" : '<div class="empty-note">Nenhuma leitura ainda.</div>') + "</section>";
    html += '<details class="card"><summary>Ajustar base e meta</summary><div class="more-f"><div class="fields">' + txt("config", "meta", "base", "Seguidores na data-base", m.base, "number") + txt("config", "meta", "base_data", "Data da base", m.base_data, "date") + txt("config", "meta", "meta", "Meta de novos seguidores", m.meta, "number") + txt("config", "meta", "inicio", "Início do período", m.inicio, "date") + txt("config", "meta", "fim", "Fim do período", m.fim, "date") + "</div>" +
      '<p class="hint">A base é o número de seguidores antes da contagem começar (' + fN(m.base) + " em " + br(m.base_data) + "). Se você souber o número exato de 01/10, troque aqui e todo o ritmo se ajusta.</p></div></details>";
    return '<div class="stack">' + html + "</div>";
  }

  /* ----- rotina semanal obrigatória ----- */
  var ROT = [["r_cal", "Atualizar o calendário e o status das produções", 3, "até quarta"], ["r_conf", "Conferir os episódios agendados", 1, "segunda"], ["r_rel", "Registrar as métricas de YouTube e Instagram (relatório semanal)", 5, "até sexta"],
    ["r_rar", "Revisar problemas, riscos e ações corretivas", 5, "até sexta"], ["r_mel", "Registrar propostas de melhoria", 5, "até sexta"], ["r_reu", "Reunião de acompanhamento com o Felipe", 5, "até sexta"]];
  function rotina(mon) {
    var wk = gGet("semana", mon), cur = mon === mondayOf(TODAY), w = wd(TODAY);
    var items = ROT.map(function (x) { var done = !!wk[x[0]]; return { k: x[0], label: x[1], due: x[2], dia: x[3], done: done, late: cur && !done && w > x[2] }; });
    return { items: items, done: items.filter(function (i) { return i.done; }).length, late: items.filter(function (i) { return i.late; }).length };
  }

  /* ----- conferência dos episódios ----- */
  var CONF = [["titulo", "Título e descrição aprovados", -4], ["thumb", "Thumb e card prontos", -5], ["teaser", "Teaser publicado", -2], ["cortes", "Cortes da semana editados", -1], ["agendado", "Agendado na plataforma", -7], ["link", "Link do YouTube conferido", 0]];
  function confPubs() { return cards().filter(function (c) { return c.type === "publicacao" && c.date && c.date >= add(TODAY, -7) && c.date <= add(TODAY, 35); }).sort(function (a, b) { return a.date < b.date ? -1 : 1; }); }
  function confItems(p) {
    var cf = gGet("conf", p.id);
    return CONF.map(function (x) { var done = x[0] === "agendado" ? !!p.scheduled : !!cf[x[0]], due = prevBiz(add(p.date, x[2])); return { k: x[0], label: x[1], due: due, done: done, late: !done && TODAY > due }; });
  }
  function confLate() {
    var l = [];
    confPubs().forEach(function (p) { if (p.status === "concluido" && TODAY > p.date) return; confItems(p).forEach(function (i) { if (i.late && i.k !== "agendado") l.push({ p: p, i: i }); }); });
    return { count: l.length, list: l };
  }
  var epName = function (p) { return p.guest ? p.guest : "episódio a definir"; };

  /* ----- riscos, melhorias ----- */
  var IMP = { alto: 0, medio: 1, baixo: 2 }, IMPL = { alto: "Alto", medio: "Médio", baixo: "Baixo" };
  var impN = function (r) { return IMP[r.impacto] == null ? 1 : IMP[r.impacto]; };
  var RST = [["aberto", "Aberto"], ["andamento", "Em andamento"], ["resolvido", "Resolvido"]];
  var MST = [["proposta", "Proposta"], ["testando", "Testando"], ["concluida", "Concluída"], ["descartada", "Descartada"]];
  function riscosAbertos() { return rList("riscos").filter(function (r) { return r.status !== "resolvido"; }).sort(function (a, b) { return impN(a) - impN(b) || String(a.prazo || "9").localeCompare(String(b.prazo || "9")); }); }
  function calRiscos() { return cards().filter(function (c) { return c.risk && c.risk.on && c.status !== "concluido" && (!c.date || c.date >= add(TODAY, -3)); }); }

  /* ----- views ----- */
  /* ========== RESULTADOS: as 5 métricas do dia a dia do @cw.cast (robô do Instagram, todo dia de manhã) ========== */
  var RM = [["views", "Visualizações"], ["ganho", "Seguidores ganhos"], ["salvamentos", "Salvamentos"], ["comentarios", "Comentários"], ["compart", "Compartilhamentos"]];
  var RMN = {}; RM.forEach(function (x) { RMN[x[0]] = x[1]; });
  function igDia(d) {   // números de um dia; seguidores ganhos = seguiram - deixaram (Instagram) ou a diferença entre as leituras
    var i = S.ig_diario.get(d) || {}, o = { views: i.views, salvamentos: i.salvamentos, comentarios: i.comentarios, compart: i.compart, ganho: null };
    if (i.seguiram != null && i.deixaram != null) o.ganho = i.seguiram - i.deixaram;
    else {
      var a = S.seguidores.get(d), b = S.seguidores.get(add(d, -1));
      if (a && b && a.total != null && b.total != null && !isNaN(Number(a.total)) && !isNaN(Number(b.total))) o.ganho = Number(a.total) - Number(b.total);
    }
    ["views", "salvamentos", "comentarios", "compart"].forEach(function (k) { if (o[k] != null) o[k] = Number(o[k]); });
    return o;
  }
  function somaDias(k, de, ate) {   // soma de k entre duas datas (inclusive) e quantos dias tinham dado
    var s = 0, n = 0;
    for (var d = de; d <= ate; d = add(d, 1)) { var v = igDia(d)[k]; if (v != null && !isNaN(v)) { s += v; n++; } }
    return { s: s, n: n };
  }
  function ultimoDia() {   // último dia fechado com número do Instagram (hoje ainda está em andamento)
    for (var k = 1; k <= 5; k++) { var d = add(TODAY, -k), x = igDia(d); if (x.views != null || x.ganho != null) return d; }
    return add(TODAY, -1);
  }
  function rmChart(k, fim) {
    var dias = [], i;
    for (i = 29; i >= 0; i--) { var d = add(fim, -i); dias.push({ d: d, v: igDia(d)[k] }); }
    var vals = dias.map(function (x) { return x.v; }).filter(function (v) { return v != null && !isNaN(v); });
    if (!vals.length) return '<div class="empty-note">Ainda sem dados de ' + esc(RMN[k].toLowerCase()) + '. O robô começa a trazer este número na próxima leitura.</div>';
    var max = Math.max.apply(null, vals.concat([1])), min = Math.min.apply(null, vals.concat([0])), W = 700, H = 220, L = 46, R = 8, T = 16, B = 26, n = dias.length, step = (W - L - R) / n, bw = Math.max(4, step * 0.66);
    var y = function (v) { return T + (H - T - B) * (1 - (v - min) / Math.max(max - min, 1)); }, s = '<svg viewBox="0 0 700 220" role="img" aria-label="' + esc(RMN[k]) + ' por dia, últimos 30 dias" class="segchart">';
    [min, (min + max) / 2, max].forEach(function (v) { s += '<line class="cg" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="ct" x="' + (L - 6) + '" y="' + (y(v) + 3) + '" text-anchor="end">' + fN(Math.round(v)) + "</text>"; });
    var media = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
    dias.forEach(function (x, j) {
      var cx = L + step * j + step / 2;
      if (x.v != null && !isNaN(x.v)) { var y0 = y(Math.max(min, 0)), y1 = y(x.v); s += '<rect class="' + (x.v >= media ? "cb-ok" : "cb-mid") + '" x="' + (cx - bw / 2) + '" y="' + Math.min(y0, y1) + '" width="' + bw + '" height="' + Math.max(Math.abs(y0 - y1), 1) + '" rx="3"><title>' + dm(x.d) + ": " + fN(x.v) + "</title></rect>"; }
      if (j % 5 === 4 || j === n - 1) s += '<text class="ct" x="' + cx + '" y="' + (H - 8) + '" text-anchor="middle">' + dm(x.d) + "</text>";
    });
    s += '<line class="cl" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(media) + '" y2="' + y(media) + '"/><text class="clt" x="' + (W - R) + '" y="' + (y(media) - 6) + '" text-anchor="end">média ' + fD(media) + "/dia</text></svg>";
    return s;
  }
  function viewResultados() {
    var fim = ultimoDia(), ini7 = add(fim, -6), ant7 = add(fim, -13), x = igDia(fim), k = st.rm || "views";
    var html = '<p class="hint" style="margin-top:0">Instagram do @cw.cast. Os números entram sozinhos todo dia de manhã; o dia de hoje aparece amanhã, já fechado. Metas e projeção do trimestre na aba ' + go("meta", "Metas") + ".</p>";
    html += '<div class="kpis">' + RM.map(function (m) {
      var a = somaDias(m[0], ini7, fim), b = somaDias(m[0], ant7, add(ini7, -1)), v = x[m[0]];
      return '<button class="kpi kbtn' + (k === m[0] ? " on" : "") + '" data-act="rm" data-m="' + m[0] + '"><span>' + esc(m[1]) + "</span><b>" + (m[0] === "ganho" ? sgn(v) : fN(v)) + "</b><small>em " + dm(fim) + "</small>" +
        "<small>7 dias: " + (a.n ? (m[0] === "ganho" ? sgn(a.s) : fN(a.s)) : "—") + "</small>" + (a.n && b.n ? dlt(a.s, b.s) : "") + "</button>";
    }).join("") + "</div>";
    html += '<section class="card"><div class="cardhead"><h3>' + esc(RMN[k]) + ' por dia</h3><span class="quiet">últimos 30 dias · toque num número acima para trocar</span></div>' + rmChart(k, fim) +
      '<div class="legend2"><span><i class="lg ok"></i>Acima da média</span><span><i class="lg mid"></i>Abaixo da média</span></div></section>';
    var rows = "";
    for (var i = 0; i < 14; i++) {
      var d = add(fim, -i), z = igDia(d);
      rows += "<tr><td>" + DNAME[toD(d).getUTCDay()] + " " + dm(d) + "</td><td>" + fN(z.views) + "</td><td>" + sgn(z.ganho) + "</td><td>" + fN(z.salvamentos) + "</td><td>" + fN(z.comentarios) + "</td><td>" + fN(z.compart) + "</td></tr>";
    }
    html += '<section class="card"><div class="cardhead"><h3>Dia a dia</h3></div><div class="tablewrap flat"><table class="hist"><thead><tr><th>Dia</th>' + RM.map(function (m) { return "<th>" + esc(m[1]) + "</th>"; }).join("") + "</tr></thead><tbody>" + rows + "</tbody></table></div></section>";
    var yo = 0, ys = 0, yn = 0;
    for (var j = 0; j < 7; j++) { var yy = S.yt_diario.get(add(fim, -j - 2)); if (yy) { yo += Number(yy.org) || 0; ys += Number(yy.subs) || 0; yn++; } }
    html += '<section class="card"><div class="cardhead"><h3>YouTube</h3><span class="quiet">7 dias até ' + dm(add(fim, -2)) + " (o YouTube fecha com 2 dias de atraso)</span></div>" +
      (yn ? '<div class="trio"><div><span>Views orgânicas</span><b>' + fN(yo) + "</b></div><div><span>Inscritos</span><b>" + sgn(ys) + "</b></div><div><span>Detalhe</span><b>" + go("metricas", "Métricas detalhadas") + "</b></div></div>" : '<div class="empty-note">Sem leitura do YouTube nesses dias.</div>') + "</section>";
    return '<div class="stack">' + html + "</div>";
  }

  /* ----- metas do trimestre: seguidores (config/meta) + views, salvamentos, comentários e compartilhamentos (config/metas) ----- */
  function metaTri(k, alvo, m) {
    var ontem = add(TODAY, -1), ate = ontem < m.fim ? ontem : m.fim, feito = somaDias(k, m.inicio, ate);
    var total = Math.max(diff(m.fim, m.inicio) + 1, 1), passados = Math.max(Math.min(diff(ate, m.inicio) + 1, total), 0), restam = Math.max(diff(m.fim, ate), 0);
    var r14 = somaDias(k, add(ate, -13), ate), ritmo = r14.n ? r14.s / r14.n : null;
    var proj = ritmo == null ? null : feito.s + ritmo * restam, esperado = alvo ? alvo * passados / total : null;
    var falta = alvo ? Math.max(alvo - feito.s, 0) : null, precisa = alvo && restam ? falta / restam : null;
    var status = !alvo || proj == null ? "none" : proj >= alvo ? "ok" : proj >= alvo * 0.85 ? "warn" : "bad";
    var desde = null; for (var d = m.inicio; d <= ate; d = add(d, 1)) { if (igDia(d)[k] != null) { desde = d; break; } }
    return { k: k, alvo: alvo, feito: feito.s, dias: feito.n, ritmo: ritmo, proj: proj, esperado: esperado, falta: falta, precisa: precisa, restam: restam, status: status, desde: desde };
  }
  function metaCard(t, rotulo) {
    var pct = t.alvo ? Math.max(0, Math.min(100, t.feito / t.alvo * 100)) : 0, ep = t.alvo ? Math.min(100, t.esperado / t.alvo * 100) : 0;
    return '<section class="card mcard"><div class="cardhead"><h3>' + esc(rotulo) + '</h3><span class="pill ' + t.status + '">' + (t.status === "ok" ? "Bate a meta" : t.status === "warn" ? "Perto" : t.status === "bad" ? "Não bate" : t.alvo ? "Sem dado" : "Sem meta") + "</span></div>" +
      '<div class="big"><b>' + fN(Math.round(t.feito)) + "</b><span>" + (t.alvo ? "de " + fN(t.alvo) + " no trimestre" : "no trimestre (defina a meta abaixo)") + "</span></div>" +
      (t.alvo ? '<div class="meter" role="img" aria-label="Progresso da meta"><i style="width:' + pct + '%"></i><u style="left:' + ep + '%" title="Esperado até ontem"></u></div>' : "") +
      '<div class="trio"><div><span>Ritmo (14 dias)</span><b>' + (t.ritmo == null ? "—" : fD(t.ritmo)) + "</b></div><div><span>Precisa por dia</span><b>" + (t.precisa == null ? "—" : fN(Math.ceil(t.precisa))) + "</b></div><div><span>Projeção no fim</span><b>" + (t.proj == null ? "—" : fN(Math.round(t.proj))) + "</b></div></div>" +
      (t.desde && t.desde > add(TODAY, -80) && t.k !== "views" && t.dias < 20 ? '<p class="hint" style="margin:6px 0 0">Contando desde ' + dm(t.desde) + ", quando o robô começou a ler este número.</p>" : "") + "</section>";
  }
  function metasTrimestre() {
    var r = igMeta(), m = r.m, mt = S.config.get("metas") || {}, pj = projecao(r);
    var seg = { status: projStatus(pj, r), feito: r.ganhos, alvo: m.meta, proj: pj ? pj.final : null };
    var html = '<h2 style="font-size:16px;margin:4px 0 6px">Metas do trimestre <span class="quiet" style="font-size:12px">' + br(m.inicio) + " a " + br(m.fim) + "</span></h2>" +
      '<p class="hint" style="margin-top:0">Projeção = o que já foi feito + o ritmo médio dos últimos 14 dias até o fim do trimestre.</p><div class="cols mgrid">';
    html += '<section class="card mcard"><div class="cardhead"><h3>Seguidores ganhos</h3><span class="pill ' + seg.status + '">' + (seg.status === "ok" ? "Bate a meta" : seg.status === "warn" ? "Perto" : seg.status === "bad" ? "Não bate" : "Sem dado") + "</span></div>" +
      '<div class="big"><b>' + sgn(r.ganhos) + "</b><span>de " + fN(m.meta) + " no trimestre</span></div>" + meterHtml(r) +
      '<div class="trio"><div><span>Ritmo (7 dias)</span><b>' + (pj ? fD(pj.ritmo) : "—") + "</b></div><div><span>Precisa por dia</span><b>" + (r.dia == null ? "—" : fN(Math.ceil(r.dia))) + "</b></div><div><span>Projeção no fim</span><b>" + (pj ? "+" + fN(Math.round(pj.final)) : "—") + "</b></div></div></section>";
    [["views", "Visualizações"], ["salvamentos", "Salvamentos"], ["comentarios", "Comentários"], ["compart", "Compartilhamentos"]].forEach(function (x) {
      html += metaCard(metaTri(x[0], Number(mt[x[0]]) || 0, m), x[1]);
    });
    html += "</div>";
    html += '<details class="card"><summary>Definir metas do trimestre</summary><div class="more-f"><div class="fields">' + txt("config", "meta", "meta", "Seguidores novos", m.meta, "number") +
      txt("config", "metas", "views", "Visualizações", mt.views, "number") + txt("config", "metas", "salvamentos", "Salvamentos", mt.salvamentos, "number") +
      txt("config", "metas", "comentarios", "Comentários", mt.comentarios, "number") + txt("config", "metas", "compart", "Compartilhamentos", mt.compart, "number") + "</div>" +
      '<p class="hint">Valores somados do trimestre inteiro (' + br(m.inicio) + " a " + br(m.fim) + '). O período e a base de seguidores ficam em "Ajustar base e meta", lá embaixo.</p></div></details>';
    return html;
  }

  function viewFor() {
    var m = { resultados: viewResultados, painel: viewPainel, mes: viewMonth, "30": viewNext30, conf: viewConf, meta: viewMeta, eps: viewEps, metricas: viewMetricas, riscos: viewRiscos, melhorias: viewMelhorias, reuniao: viewReuniao, alertas: viewAlerts, equipe: viewTeam };
    var body = (m[st.tab] || viewResultados)();
    if (st.tab === "mes" || st.tab === "30") body = '<div class="seg" role="tablist" aria-label="Visão do calendário"><button data-tab="mes"' + (st.tab === "mes" ? ' class="on"' : "") + '>Mês</button><button data-tab="30"' + (st.tab === "30" ? ' class="on"' : "") + ">Próximos 30 dias</button></div>" + body;
    return body;
  }
  var go = function (tab, label) { return '<button class="link" data-tab="' + tab + '">' + label + "</button>"; };
  var kpi = function (cls, n, label) { return '<div class="kpi ' + cls + '"><span>' + esc(label) + "</span><b>" + n + "</b></div>"; };

  /* ----- agendamento crítico (regra de 72 horas) e episódios do YouTube Studio ----- */
  var PUB_HOUR = 11;
  function spHour() { try { return Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", hour: "numeric", hourCycle: "h23" }).format(new Date())); } catch (e) { return 0; } }
  /* Crítico: episódio sem agendamento depois das 11h de três dias antes da publicação (72 horas, publicando às 11h). */
  function crit72(pub) {
    if (!pub || pub.scheduled || !pub.date) return null;
    var limit = add(pub.date, -3);
    return { limit: limit, over: TODAY > limit || (TODAY === limit && spHour() >= PUB_HOUR) };
  }
  function remText(x) {
    var who = x.pub.guest ? " (" + x.pub.guest + ")" : "", c = crit72(x.pub), pre = c && c.over ? "CRÍTICO, passou do limite de 72 horas: " : "";
    if (x.s === "today") return pre + "Hoje é o prazo para agendar o episódio de " + br(x.pub.date) + who + "." + (c && !c.over ? " Vira crítico em " + dm(c.limit) + " às " + PUB_HOUR + "h." : "");
    return pre + "O episódio de " + br(x.pub.date) + who + " ainda não está agendado. O prazo era " + br(x.r.date) + " (" + x.late + (x.late === 1 ? " dia" : " dias") + " de atraso)." + (c && !c.over ? " Vira crítico em " + dm(c.limit) + " às " + PUB_HOUR + "h." : "");
  }
  function critList() { return confPubs().filter(function (p) { var c = crit72(p); return p.date >= TODAY && c && c.over; }); }

  var mmss = function (s) { s = Math.round(Number(s) || 0); var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ":" + pad(m) : m) + ":" + pad(x); };
  var studio = function () { return S.videos.get("estudio") || null; };
  function studioTiles() {
    var e = studio(); if (!e || !e.total) return "";
    var t = e.total, k = function (l, v) { return '<div class="kpi"><span>' + esc(l) + "</span><b>" + v + "</b><small>" + esc(e.periodo || "") + " · Studio</small></div>"; };
    return k("CTR das thumbnails", pf2.format(t.ctr) + "%") + k("Impressões", fN(t.imp)) + k("Duração média da visualização", mmss(t.avg_s));
  }
  function viewEps() {
    var e = studio();
    if (!e) return '<div class="empty-note">Nenhum dado do YouTube Studio carregado ainda. Exporte a aba Conteúdo no YouTube Studio e peça ao Claude da gestão para importar na Central.</div>';
    var t = e.total || {}, it = e.itens || [], d = dis_();
    var eps = it.filter(function (i) { return i.tipo === "episodio"; }).sort(function (a, b) { return String(b.pub || "").localeCompare(String(a.pub || "")); });
    var outros = it.filter(function (i) { return i.tipo !== "episodio"; }).sort(function (a, b) { return b.views - a.views; }).slice(0, 15);
    var kp = function (l, v, s) { return '<div class="kpi"><span>' + esc(l) + "</span><b>" + v + "</b>" + (s ? "<small>" + esc(s) + "</small>" : "") + "</div>"; };
    var html = '<div class="stack"><div class="kpis" style="margin:0">' + kp("Visualizações", fN(t.views), e.periodo) + kp("Horas assistidas", fN(Math.round(t.horas)), e.periodo) + kp("Inscritos", fN(t.subs), e.periodo) + kp("Impressões das miniaturas", fN(t.imp), e.periodo) + kp("CTR das miniaturas", pf2.format(t.ctr) + "%", e.periodo) + kp("Duração média da visualização", mmss(t.avg_s), e.periodo) + "</div>";
    html += '<section class="card"><div class="cardhead"><h3>Episódios</h3><span class="quiet">dados de ' + esc(e.periodo || "") + "</span></div>" + (eps.length ? '<div class="tablewrap flat"><table class="hist"><thead><tr><th>Episódio</th><th>Publicado</th><th>Views</th><th>Primeiros 7 dias</th><th>Horas</th><th>Inscritos</th><th>Duração média</th><th>Retenção</th><th>CTR</th><th>Impressões</th></tr></thead><tbody>' +
      eps.map(function (i) {
        var d7 = i.d7 ? fN(i.d7.views) + " views · " + sgn(i.d7.subs) + " inscr." + (i.d7.dias < 7 ? ' <span class="quiet">(parcial, ' + i.d7.dias + " dias)</span>" : "") : "—";
        return '<tr><td class="t"><b>' + esc(i.ep) + "</b> " + esc(i.titulo) + "</td><td>" + (i.pub ? br(i.pub) : "—") + "</td><td>" + fN(i.views) + "</td><td>" + d7 + "</td><td>" + fD(i.horas) + "</td><td>" + sgn(i.subs) + "</td><td>" + mmss(i.avg_s) + "</td><td>" + (i.ret != null ? fP(i.ret) : "—") + "</td><td>" + pf2.format(i.ctr) + "%</td><td>" + fN(i.imp) + "</td></tr>";
      }).join("") + "</tbody></table></div>" : '<div class="empty-note">Nenhum episódio na lista.</div>') +
      '<p class="hint">Views, horas, inscritos, CTR e impressões são do período indicado. Primeiros 7 dias contam a partir da publicação (parcial quando a semana ainda não terminou). Retenção é a porcentagem média do vídeo assistida; duração média é o tempo médio por visualização.</p></section>';
    var best = function (key, hi) { var c = eps.filter(function (i) { return i[key] != null; }).sort(function (a, b) { return hi ? b[key] - a[key] : a[key] - b[key]; })[0]; return c; };
    var bv = best("views", true), bc = best("ctr", true), br_ = best("ret", true), lines_ = [];
    if (bv) lines_.push("Mais vistos no período: " + bv.ep + " (" + fN(bv.views) + " views).");
    if (bc) lines_.push("Melhor CTR de miniatura: " + bc.ep + " (" + pf2.format(bc.ctr) + "%), contra " + pf2.format(t.ctr) + "% do canal.");
    if (br_) lines_.push("Maior retenção: " + br_.ep + " (" + fP(br_.ret) + " do vídeo assistido).");
    if (lines_.length) html += '<section class="card"><div class="cardhead"><h3>Leitura rápida</h3></div><ul class="alist" style="gap:6px">' + lines_.map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") + "</ul></section>";
    html += '<section class="card"><div class="cardhead"><h3>Cortes, Shorts e outros vídeos</h3><span class="quiet">15 mais vistos no período</span></div><div class="tablewrap flat"><table class="hist"><thead><tr><th>Vídeo</th><th>Tipo</th><th>Views</th><th>Horas</th><th>Inscritos</th><th>Duração média</th><th>CTR</th><th>Impressões</th></tr></thead><tbody>' +
      outros.map(function (i) { return '<tr><td class="t">' + esc(i.titulo) + "</td><td>" + (i.tipo === "short" ? "Short" : "Vídeo") + "</td><td>" + fN(i.views) + "</td><td>" + fD(i.horas) + "</td><td>" + sgn(i.subs) + "</td><td>" + mmss(i.avg_s) + "</td><td>" + pf2.format(i.ctr) + "%</td><td>" + fN(i.imp) + "</td></tr>"; }).join("") + "</tbody></table></div></section>";
    return html + '<p class="hint">Fonte: ' + esc(e.fonte || "YouTube Studio") + ". Atualizado em " + br(e.atualizado) + ". Para atualizar, exporte a aba Conteúdo do YouTube Studio e peça ao Claude da gestão para importar na Central.</p></div>";
  }

  /* ----- Painel: tudo o que pede atenção, item por item ----- */
  function byRem(p) { var r = cards().filter(function (x) { return x.type === "agendamento" && x.ep === p.id; })[0]; if (!r) return null; var s = remState(r); s.r = r; return s; }
  function attnGroup(title, tone, items, tab, tabLabel) {
    if (!items.length) return "";
    return '<div class="agrp"><h4><span class="dotc ' + tone + '"></span>' + esc(title) + '<span class="cnt">' + items.length + "</span></h4>" + items.join("") + (tab ? '<div class="more">' + go(tab, tabLabel) + "</div>" : "") + "</div>";
  }
  function viewPainel() {
    var mon = mondayOf(TODAY), due = dueReminders(), cl = confLate(), rk = riscosAbertos(), cr = calRiscos(), rt = rotina(mon), r = igMeta();
    var total = critList().length + due.filter(function (x) { return !(crit72(x.pub) && crit72(x.pub).over); }).length + cl.count + rk.length + cr.length;
    var crits = critList(), critIds = {}; crits.forEach(function (p) { critIds[p.id] = true; }); due = due.filter(function (x) { return !critIds[x.pub.id]; });
    var gCt = attnGroup("CRÍTICO: episódio sem agendamento fora do limite de 72 horas", "bad", crits.map(function (p) {
      return '<div class="irow crit"><span class="tag bad">Crítico</span><div class="itxt"><b>' + esc(epName(p)) + " · publica em " + dm(p.date) + "</b><span>O limite era " + dm(add(p.date, -3)) + " às " + PUB_HOUR + "h. Agende no YouTube e marque como agendado.</span></div><div class=\"iact\">" +
        (canWrite ? '<button class="btn mini" data-act="sched" data-pub="' + esc(p.id) + '">Marcar agendado</button>' : "") + '<button class="btn mini sec" data-day="' + esc(p.date) + '">Abrir</button></div></div>';
    }), "", "");
    var gAg = attnGroup("Episódios sem agendamento no prazo", "bad", due.map(function (x) {
      return '<div class="irow"><div class="itxt"><b>' + esc(epName(x.pub)) + " · publica em " + dm(x.pub.date) + "</b><span>" + (x.s === "today" ? "O prazo para agendar é hoje" : "Prazo era " + dm(x.r.date) + " · " + x.late + (x.late === 1 ? " dia" : " dias") + " de atraso") + " · vira crítico em " + dm(add(x.pub.date, -3)) + " às " + PUB_HOUR + "h" + '</span></div><div class="iact">' +
        (canWrite ? '<button class="btn mini" data-act="sched" data-pub="' + esc(x.pub.id) + '">Marcar agendado</button>' : "") + '<button class="btn mini sec" data-day="' + esc(x.pub.date) + '">Abrir</button></div></div>';
    }), "alertas", "Ver todas as pendências");
    var gCf = attnGroup("Conferência atrasada · marque quando concluir", "bad", cl.list.map(function (x) {
      return '<label class="irow check"><input type="checkbox" data-col="conf" data-id="' + esc(x.p.id) + '" data-k="' + x.i.k + '"' + dis_() + '><div class="itxt"><b>' + esc(epName(x.p)) + " · publica em " + dm(x.p.date) + "</b><span>" + esc(x.i.label) + " <em>venceu em " + dm(x.i.due) + "</em></span></div></label>";
    }), "conf", "Abrir a conferência completa");
    var gRk = attnGroup("Riscos abertos", "warn", rk.map(function (x) {
      return '<button class="irow linkrow" data-tab="riscos"><span class="tag ' + (x.impacto === "alto" ? "bad" : x.impacto === "baixo" ? "idle" : "warn") + '">' + (IMPL[x.impacto] || "Médio") + '</span><div class="itxt"><b>' + esc(x.titulo || "(sem título)") + "</b><span>" + (x.acao ? "Ação: " + esc(x.acao.length > 120 ? x.acao.slice(0, 120) + "…" : x.acao) : "Sem ação corretiva definida") + " · " + (x.resp ? esc(x.resp) : "sem responsável") + " · " + (x.prazo ? "prazo " + dm(x.prazo) : "sem prazo") + "</span></div></button>";
    }), "riscos", "Abrir o registro de riscos");
    var gCr = attnGroup("Sinalizados no calendário", "warn", cr.map(function (c) {
      return '<button class="irow linkrow" data-day="' + esc(c.date || "undated") + '"><span class="tag warn">' + (c.date ? dm(c.date) : "sem data") + '</span><div class="itxt"><b>' + esc(c.title) + "</b><span>" + esc(c.risk.description || "risco") + (c.sub ? " · Plano B: " + esc(c.sub) : "") + "</span></div></button>";
    }), "", "");
    var left = '<section class="card attn"><div class="cardhead"><h3>Atenção agora</h3><span class="pill ' + (total ? "bad" : "ok") + '">' + (total ? total + (total === 1 ? " pendência" : " pendências") : "Tudo em dia") + "</span></div>" +
      (total ? gCt + gAg + gCf + gRk + gCr : '<div class="empty-note">Nenhum atraso, risco aberto ou conferência vencida. Bom trabalho.</div>') + "</section>";

    var next = confPubs().filter(function (p) { return p.date >= TODAY; }).slice(0, 4);
    var rot = '<section class="card"><div class="cardhead"><h3>Rotina da semana</h3><span class="pill ' + (rt.late ? "bad" : rt.done === rt.items.length ? "ok" : "none") + '">' + rt.done + "/" + rt.items.length + '</span></div><ul class="rot">' + rt.items.map(function (i) {
      return '<li class="' + (i.late ? "late" : "") + '">' + chk("semana", mon, i.k, i.label) + "<small>" + (i.late ? "atrasado" : i.dia) + "</small></li>";
    }).join("") + "</ul></section>";
    var eps = '<section class="card"><div class="cardhead"><h3>Próximos episódios</h3></div><ul class="mini">' + (next.length ? next.map(function (p) {
      var rem = byRem(p);
      return '<li><span class="dt">' + dm(p.date) + '</span><button class="link ttl" data-day="' + esc(p.date) + '">' + esc(epName(p)) + "</button>" +
        (p.scheduled ? '<span class="tag ok">Agendado</span>' : crit72(p) && crit72(p).over ? '<span class="tag bad">CRÍTICO</span>' : rem && rem.late ? '<span class="tag bad">Sem agendar · ' + rem.late + "d</span>" : '<span class="tag warn">Agendar até ' + dm(rem ? rem.r.date : add(p.date, OFF.agendamento)) + "</span>") + "</li>";
    }).join("") : '<li class="quiet">Nenhum episódio nas próximas semanas.</li>') + "</ul></section>";
    return '<div class="dash"><div class="stack">' + left + '</div><div class="stack">' + metaMini(r) + rot + eps + "</div></div>";
  }

  /* ----- estrutura do aplicativo: menu lateral e cabeçalho de página ----- */
  var ICONS = {
    resultados: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    painel: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    mes: '<rect x="3" y="4" width="18" height="17" rx="2.5"/><path d="M3 9h18M8 2v4M16 2v4"/>',
    conf: '<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>',
    alertas: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/>',
    eps: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5l5 2.5-5 2.5z"/>',
    meta: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
    metricas: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
    riscos: '<path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18h.01"/>',
    melhorias: '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"/>',
    reuniao: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    equipe: '<circle cx="9" cy="8" r="3.5"/><path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1"/><path d="M17 4.5a3.5 3.5 0 0 1 0 7M22 21v-1a5 5 0 0 0-3-4.6"/>'
  };
  var NAV = [["Resultados", [["resultados", "Resultados"], ["meta", "Metas"]]], ["Produção", [["mes", "Calendário"], ["conf", "Conferência"], ["alertas", "Pendências"]]], ["Mais", [["painel", "Resumo da semana"], ["eps", "Episódios e vídeos"], ["metricas", "Métricas detalhadas"], ["riscos", "Riscos"], ["melhorias", "Melhorias"], ["reuniao", "Reunião"], ["equipe", "Equipe"]]]];
  var PAGES = {
    resultados: ["Resultados do @cw.cast", "Views, seguidores ganhos, salvamentos, comentários e compartilhamentos, dia a dia"],
    painel: ["Resumo da semana", function () { var mo = mondayOf(TODAY); return "Hoje, " + br(TODAY) + " · semana de " + dm(mo) + " a " + dm(add(mo, 6)); }],
    mes: ["Calendário", "Gravações, edições, aprovações e publicações do trimestre"], "30": ["Calendário", "Gravações, edições, aprovações e publicações do trimestre"],
    conf: ["Conferência dos episódios", "Seis checagens por episódio, com prazo antes da publicação"], alertas: ["Pendências", "Prazos de agendamento, aprovações e itens sem responsável"],
    meta: ["Metas do trimestre", "Onde estamos, quanto falta e a projeção até o fim do trimestre"], metricas: ["Métricas detalhadas", "YouTube, Instagram e TikTok, semana a semana"], eps: ["Episódios e vídeos", "Desempenho por episódio: views, primeiros 7 dias, CTR e retenção"],
    riscos: ["Riscos", "Problemas, riscos e ações corretivas"], melhorias: ["Melhorias", "Propostas baseadas nos indicadores"], reuniao: ["Reunião", "Relatório pronto para a reunião com o Felipe"], equipe: ["Equipe", "Quem faz o quê"]
  };
  function pageHead() {
    var p = PAGES[st.tab] || PAGES.painel, t = document.getElementById("cast-ptitle"), s = document.getElementById("cast-psub");
    if (t) t.textContent = p[0]; if (s) s.textContent = typeof p[1] === "function" ? p[1]() : p[1];
  }
  function renderTabs() {
    var B = { alertas: dueReminders().length, conf: confLate().count, riscos: riscosAbertos().length, painel: rotina(mondayOf(TODAY)).late }, act = st.tab === "30" ? "mes" : st.tab;
    document.getElementById("cast-tabs").innerHTML = NAV.map(function (g) {
      return '<div class="ngrp"><div class="nlabel">' + g[0] + "</div>" + g[1].map(function (t) {
        return '<button class="nv' + (act === t[0] ? " on" : "") + '" data-tab="' + t[0] + '"' + (act === t[0] ? ' aria-current="page"' : "") + '><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[t[0]] + "</svg><span>" + t[1] + "</span>" + (B[t[0]] ? '<i class="nb">' + B[t[0]] + "</i>" : "") + "</button>";
      }).join("") + "</div>";
    }).join("");
    pageHead();
    if (CTX.aoMudarSecao) CTX.aoMudarSecao(act, B);
  }

  function viewConf() {
    var pubs = confPubs(), html = '<div class="toolbar"><select id="f-conf" aria-label="Filtrar episódios"><option value="todos"' + (st.cf !== "pend" ? " selected" : "") + '>Todos os episódios</option><option value="pend"' + (st.cf === "pend" ? " selected" : "") + '>Só com pendência</option></select></div><p class="hint" style="margin-top:0">Cada episódio tem seis checagens com prazo relativo à publicação. O agendamento vem do calendário; as outras você marca aqui. Itens vencidos ficam em vermelho.</p>';
    if (st.cf === "pend") pubs = pubs.filter(function (p) { return confItems(p).some(function (i) { return !i.done; }); });
    if (!pubs.length) return html + '<div class="empty-note">Nenhum episódio para mostrar.</div>';
    pubs.forEach(function (p) {
      var it = confItems(p), cf = gGet("conf", p.id), late = it.filter(function (i) { return i.late; }).length, done = it.filter(function (i) { return i.done; }).length, past = TODAY > p.date;
      html += '<article class="conf' + (late ? " hot" : "") + '"><header><h3>' + esc(epName(p)) + '</h3><span class="when">' + (past ? "publicado em " : "publica em ") + br(p.date) + (past ? "" : " (" + diff(p.date, TODAY) + " dias)") + '</span><span class="tag ' + (late ? "bad" : done === it.length ? "ok" : "idle") + '">' + done + "/" + it.length + " feitos" + (late ? " · " + late + " atrasado" + (late > 1 ? "s" : "") : "") + '</span><button class="link" style="margin-left:auto" data-day="' + esc(p.date) + '">abrir no calendário</button></header><ul class="cklist">' +
        it.map(function (i) {
          var box = i.k === "agendado" ? '<label class="chk"><input type="checkbox" data-act="sched" data-pub="' + esc(p.id) + '"' + (i.done ? " checked" : "") + dis_() + "><span>" + esc(i.label) + "</span></label>" : chk("conf", p.id, i.k, i.label, i.done);
          return '<li class="' + (i.late ? "late" : "") + '">' + box + "<small>" + (i.done ? "ok" : (i.late ? "venceu " : "até ") + dm(i.due)) + "</small></li>";
        }).join("") + "</ul>" + area("conf", p.id, "nota", "Observações da conferência", cf.nota, 2, "ex.: thumb aguardando aprovação do convidado") + "</article>";
    });
    return html;
  }

  function diaADia() {   // últimos 14 dias de Instagram e YouTube, do robô
    var dias = {}, k;
    [["seguidores", "s"], ["ig_diario", "i"], ["yt_diario", "y"]].forEach(function (c) { S[c[0]].forEach(function (v, id) { if (id >= add(TODAY, -15)) (dias[id] = dias[id] || {})[c[1]] = v || {}; }); });
    var ids = Object.keys(dias).sort().reverse().slice(0, 14);
    if (!ids.length) return "";
    var segs = segSeries(), ganho = function (d) { for (var j = segs.length - 1; j > 0; j--) if (segs[j].d === d) return diff(d, segs[j - 1].d) === 1 ? segs[j].total - segs[j - 1].total : null; return null; };
    var ultY = ids.filter(function (x) { return dias[x].y; })[0], ultI = ids.filter(function (x) { return dias[x].i && dias[x].i.views != null && x < TODAY; })[0];
    var resumo = [];
    if (ultI) resumo.push("Instagram em " + dm(ultI) + ": " + fN(dias[ultI].i.views) + " views, " + fN(dias[ultI].i.alcance) + " contas alcançadas" + (ganho(ultI) != null ? ", " + sgn(ganho(ultI)) + " seguidores" : "") + ".");
    if (ultY) resumo.push("YouTube em " + dm(ultY) + ": " + fN(dias[ultY].y.org) + " views orgânicas, " + fN(dias[ultY].y.ads) + " de anúncio, " + sgn(dias[ultY].y.subs) + " inscritos.");
    var html = '<h2 style="font-size:16px;margin:18px 0 6px">Dia a dia</h2>' + (resumo.length ? '<p class="hint" style="margin-top:0">' + resumo.join(" ") + "</p>" : "") +
      '<div class="tablewrap"><table class="hist"><thead><tr><th>Dia</th><th>Seguidores IG</th><th>Ganho IG</th><th>Views IG</th><th>Alcance IG</th><th>YT orgânicas</th><th>YT anúncio</th><th>Inscritos YT</th><th>Horas YT</th></tr></thead><tbody>';
    for (k = 0; k < ids.length; k++) {
      var d = ids[k], x = dias[d], s2 = x.s || {}, i2 = x.i || {}, y2 = x.y || {}, g = ganho(d);
      html += "<tr><td>" + DNAME[toD(d).getUTCDay()] + " " + dm(d) + "</td><td>" + fN(s2.total != null ? s2.total : i2.seguidores) + "</td><td>" + (g == null ? "—" : sgn(g)) + "</td><td>" + fN(i2.views) + "</td><td>" + fN(i2.alcance) + "</td><td>" + fN(y2.org) + "</td><td>" + fN(y2.ads) + "</td><td>" + (y2.subs == null ? "—" : sgn(y2.subs)) + "</td><td>" + fD(y2.horas) + "</td></tr>";
    }
    return html + '</tbody></table></div><p class="hint" style="margin-top:6px">Atualiza sozinho todo dia de manhã. O YouTube fecha os números com 2 a 3 dias de atraso, por isso os dias mais recentes dele aparecem depois.</p>';
  }
  function viewMetricas() {
    var ws = metList(), cur = ws[ws.length - 1], prev = ws[ws.length - 2], r = igMeta(), d = dis_();
    var html = '<div class="toolbar"><strong>Métricas de Instagram, TikTok e YouTube</strong>' + (canWrite ? '<button class="btn" data-act="new-sem">+ Registrar semana</button>' : "") + "</div>" + '<p class="hint" style="margin-top:0">A meta de +2.000 seguidores e o ritmo diário estão na aba ' + go("meta", "Meta de seguidores") + ". Instagram e YouTube entram sozinhos todo dia de manhã (TikTok quando a conexão de métricas for refeita).</p>" + diaADia();
    if (!cur) return html + '<div class="empty-note">Nenhuma semana registrada ainda. O YouTube é preenchido toda segunda pela rotina automática; o Instagram vem do PDF do Insights.</div>';
    var c = cur.ig || {}, p = (prev && prev.ig) || {}, cy = cur.yt || {}, py = (prev && prev.yt) || {};
    var tile = function (l, a, b) { return '<div class="kpi"><span>' + esc(l) + "</span><b>" + fN(a) + "</b>" + dlt(a, b) + "</div>"; };
    html += '<h2 style="font-size:16px;margin:18px 0 0">Instagram <span class="quiet" style="font-size:12px">' + esc(cur.periodo_ig || "") + "</span></h2><div class=\"kpis\">" +
      tile("Seguidores", c.seguidores, p.seguidores) + tile("Visualizações", c.views, p.views) + tile("Contas alcançadas", c.alcance, p.alcance) + tile("Interações", c.interacoes, p.interacoes) +
      tile("Visitas ao perfil", c.visitas, p.visitas) + tile("Toques no link da bio", c.toques, p.toques) + tile("Mediana de views por post", c.med_views, p.med_views) + tile("Mediana de interações por post", c.med_inter, p.med_inter) + tile("Compartilhamentos", c.compart, p.compart) + tile("Salvamentos", c.salvamentos, p.salvamentos) + "</div>";
    if (c.visitas) html += '<p class="hint" style="margin-top:-6px">Funil do perfil: ' + fN(c.toques) + " toques no link para " + fN(c.visitas) + " visitas (" + fP(c.toques / c.visitas * 100) + "). Compartilhamentos por mil visualizações: " + (c.views ? pf.format(c.compart / c.views * 1000) : "—") + ".</p>";
    var ct = cur.tt || {}, pt = (prev && prev.tt) || {};
    if (ws.some(function (w) { return w.tt && Object.keys(w.tt).length; }))
      html += '<h2 style="font-size:16px;margin:18px 0 0">TikTok <span class="quiet" style="font-size:12px">' + esc(cur.periodo_ig || "") + "</span></h2><div class=\"kpis\">" +
        tile("Seguidores", ct.seguidores, pt.seguidores) + tile("Views dos vídeos da semana", ct.views, pt.views) + tile("Curtidas", ct.curtidas, pt.curtidas) +
        tile("Comentários", ct.comentarios, pt.comentarios) + tile("Compartilhamentos", ct.compart, pt.compart) + tile("Vídeos postados", ct.posts, pt.posts) +
        tile("Mediana de views por vídeo", ct.med_views, pt.med_views) + "</div>" +
        '<p class="hint" style="margin-top:-6px">Views, curtidas e compartilhamentos somam os vídeos postados na semana, contados até hoje.</p>';
    html += '<h2 style="font-size:16px;margin:18px 0 0">YouTube <span class="quiet" style="font-size:12px">' + esc(cur.periodo_yt || "") + "</span></h2><div class=\"kpis\">" +
      tile("Views orgânicas", cy.org, py.org) + tile("Views de anúncio", cy.ads, py.ads) + tile("Horas assistidas (total)", cy.horas, py.horas) + tile("Inscritos líquidos", cy.subs, py.subs) + studioTiles() + "</div>" +
      '<p class="hint" style="margin-top:-6px">Sem meta no YouTube: acompanhamento geral. A análise é sempre pelas views orgânicas (a maior parte das views do canal vem de anúncio).</p>';
    html += '<h2 style="font-size:16px;margin:18px 0 8px">Histórico</h2><div class="tablewrap"><table class="hist"><thead><tr><th>Semana até</th><th>Seguidores</th><th>Views IG</th><th>Visitas</th><th>Toques</th><th>Seg. TikTok</th><th>Views TikTok</th><th>YT orgânicas</th><th>YT inscritos</th></tr></thead><tbody>' +
      ws.slice().reverse().map(function (w) { var a = w.ig || {}, t = w.tt || {}, y = w.yt || {}; return "<tr><td>" + br(w.fim) + "</td><td>" + fN(a.seguidores) + "</td><td>" + fN(a.views) + "</td><td>" + fN(a.visitas) + "</td><td>" + fN(a.toques) + "</td><td>" + fN(t.seguidores) + "</td><td>" + fN(t.views) + "</td><td>" + fN(y.org) + "</td><td>" + fN(y.subs) + "</td></tr>"; }).join("") + "</tbody></table></div>";
    html += '<h2 style="font-size:16px;margin:18px 0 8px">Editar semanas</h2>' + ws.slice().reverse().map(function (w, ix) {
      return '<details class="weekedit"' + (ix === 0 ? "" : "") + "><summary>Semana até " + br(w.fim) + "</summary>" + '<div class="grp"><div class="fields">' + txt("metricas", w.id, "fim", "Data de fechamento", w.fim, "date") + txt("metricas", w.id, "periodo_ig", "Período do Instagram", w.periodo_ig, "text", "ex.: 01/10 a 14/10") + txt("metricas", w.id, "periodo_yt", "Período do YouTube", w.periodo_yt, "text", "ex.: 07/10 a 13/10") + txt("metricas", w.id, "fonte", "Fonte dos dados", w.fonte) + "</div></div>" +
        '<div class="grp"><h4>Instagram</h4><div class="fields">' + [["seguidores", "Seguidores"], ["views", "Visualizações"], ["alcance", "Contas alcançadas"], ["interacoes", "Interações"], ["visitas", "Visitas ao perfil"], ["toques", "Toques no link"], ["med_views", "Mediana de views"], ["med_inter", "Mediana de interações"], ["compart", "Compartilhamentos"], ["salvamentos", "Salvamentos"], ["posts", "Publicações"]].map(function (f) { return txt("metricas", w.id, "ig." + f[0], f[1], (w.ig || {})[f[0]], "number"); }).join("") + "</div></div>" +
        '<div class="grp"><h4>TikTok</h4><div class="fields">' + [["seguidores", "Seguidores"], ["views", "Views dos vídeos da semana"], ["curtidas", "Curtidas"], ["comentarios", "Comentários"], ["compart", "Compartilhamentos"], ["posts", "Vídeos postados"], ["med_views", "Mediana de views"]].map(function (f) { return txt("metricas", w.id, "tt." + f[0], f[1], (w.tt || {})[f[0]], "number"); }).join("") + "</div></div>" +
        '<div class="grp"><h4>YouTube</h4><div class="fields">' + [["org", "Views orgânicas"], ["ads", "Views de anúncio"], ["horas", "Horas assistidas"], ["subs", "Inscritos líquidos"]].map(function (f) { return txt("metricas", w.id, "yt." + f[0], f[1], (w.yt || {})[f[0]], "number"); }).join("") + "</div></div>" +
        '<div class="grp more-f">' + area("metricas", w.id, "melhores", "Melhores conteúdos (um por linha)", w.melhores, 3) + area("metricas", w.id, "piores", "Piores conteúdos (um por linha)", w.piores, 3) + area("metricas", w.id, "analise", "Análise: por que performou assim", w.analise, 4) + "</div>" +
        (canWrite ? '<div class="foot" style="display:flex;justify-content:flex-end;margin-top:8px"><button class="btn ghost" data-act="del-g" data-col="metricas" data-id="' + esc(w.id) + '">Excluir semana</button></div>' : "") + "</details>";
    }).join("");
    return html;
  }

  function riscoCard(r) {
    var late = r.prazo && r.prazo < TODAY && r.status !== "resolvido", flags = "";
    if (r.status !== "resolvido") {
      if (!r.resp) flags += '<span class="tag warn">Defina o responsável</span>';
      if (!r.prazo) flags += '<span class="tag warn">Defina o prazo</span>';
      if (!r.acao) flags += '<span class="tag warn">Falta a ação corretiva</span>';
      if (late) flags += '<span class="tag bad">Prazo vencido</span>';
    }
    return '<article class="rar ' + (r.impacto || "medio") + (r.status === "resolvido" ? " resolvido" : "") + '"><input type="text" class="tt" id="' + esc(fid("riscos", r.id, "titulo")) + '" data-col="riscos" data-id="' + esc(r.id) + '" data-k="titulo" value="' + esc(r.titulo) + '" placeholder="Título do risco ou problema" aria-label="Título"' + dis_() + ">" +
      (flags ? '<div class="flags">' + flags + "</div>" : "") + area("riscos", r.id, "desc", "O que está acontecendo", r.desc, 2) +
      '<div class="fields">' + sel("riscos", r.id, "impacto", "Impacto", [["alto", "Alto"], ["medio", "Médio"], ["baixo", "Baixo"]], r.impacto) + sel("riscos", r.id, "prob", "Probabilidade", [["alta", "Alta"], ["media", "Média"], ["baixa", "Baixa"]], r.prob) + sel("riscos", r.id, "status", "Status", RST, r.status) + "</div>" +
      area("riscos", r.id, "acao", "Ação corretiva", r.acao, 2, "o que será feito para resolver") +
      '<div class="fields">' + ownerSel("riscos", r.id, "resp", "Responsável", r.resp) + txt("riscos", r.id, "prazo", "Prazo", r.prazo, "date") + txt("riscos", r.id, "criado", "Registrado em", r.criado, "date") + "</div>" +
      (canWrite ? '<div class="foot"><button class="btn ghost" data-act="del-g" data-col="riscos" data-id="' + esc(r.id) + '">Excluir</button></div>' : "") + "</article>";
  }
  function viewRiscos() {
    var f = st.rf, all = rList("riscos").filter(function (r) { return f === "todos" || (f === "abertos" ? r.status !== "resolvido" : r.status === f); });
    all.sort(function (a, b) { return (a.status === "resolvido") - (b.status === "resolvido") || impN(a) - impN(b) || String(a.prazo || "9").localeCompare(String(b.prazo || "9")); });
    var html = '<div class="toolbar"><strong>Problemas, riscos e ações corretivas</strong><select id="f-rstatus" aria-label="Filtrar por status"><option value="abertos"' + (f === "abertos" ? " selected" : "") + ">Abertos</option>" + RST.map(function (o) { return '<option value="' + o[0] + '"' + (f === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + '<option value="todos"' + (f === "todos" ? " selected" : "") + ">Todos</option></select>" + (canWrite ? '<button class="btn" data-act="new-risco">+ Registrar risco</button>' : "") + "</div>" +
      '<p class="hint" style="margin-top:0">Todo risco precisa de ação corretiva, responsável e prazo. Quando um problema for resolvido, mude o status para Resolvido em vez de excluir.</p>';
    html += all.length ? all.map(riscoCard).join("") : '<div class="empty-note">Nenhum risco neste filtro.</div>';
    var cr = calRiscos();
    if (cr.length) html += '<section class="panel wide" style="margin-top:14px"><h3>Sinalizados no calendário · ' + cr.length + "</h3><p>Marcados nas atribuições. Se for algo que precisa de ação, registre aqui com responsável e prazo.</p><ul class=\"alist\">" + cr.map(function (c) { return '<li><span class="dt">' + (c.date ? dm(c.date) : "—") + '</span><button class="link" data-day="' + esc(c.date || "undated") + '">' + esc(c.title + ": " + (c.risk.description || "risco") + (c.sub ? " · Plano B: " + c.sub : "")) + "</button></li>"; }).join("") + "</ul></section>";
    return html;
  }

  function melCard(m) {
    return '<article class="rar baixo"><input type="text" class="tt" id="' + esc(fid("melhorias", m.id, "titulo")) + '" data-col="melhorias" data-id="' + esc(m.id) + '" data-k="titulo" value="' + esc(m.titulo) + '" placeholder="Proposta de melhoria" aria-label="Título"' + dis_() + ">" +
      area("melhorias", m.id, "base", "Indicador que motivou a proposta", m.base, 2) + area("melhorias", m.id, "hipotese", "Hipótese", m.hipotese, 2) + area("melhorias", m.id, "medir", "Como medir e critério de sucesso", m.medir, 2) +
      '<div class="fields">' + sel("melhorias", m.id, "status", "Status", MST, m.status) + ownerSel("melhorias", m.id, "resp", "Responsável", m.resp) + txt("melhorias", m.id, "prazo", "Ler o resultado em", m.prazo, "date") + "</div>" +
      area("melhorias", m.id, "resultado", "Resultado", m.resultado, 2) + (canWrite ? '<div class="foot"><button class="btn ghost" data-act="del-g" data-col="melhorias" data-id="' + esc(m.id) + '">Excluir</button></div>' : "") + "</article>";
  }
  function viewMelhorias() {
    var f = st.mf, ord = { testando: 0, proposta: 1, concluida: 2, descartada: 3 }, all = rList("melhorias").filter(function (m) { return f === "todas" || (f === "abertas" ? m.status === "proposta" || m.status === "testando" : m.status === f); })
      .sort(function (a, b) { return (ord[a.status] == null ? 1 : ord[a.status]) - (ord[b.status] == null ? 1 : ord[b.status]); });
    var testing = rList("melhorias").filter(function (m) { return m.status === "testando"; }).length;
    var html = '<div class="toolbar"><strong>Propostas de melhoria</strong><select id="f-mstatus" aria-label="Filtrar por status"><option value="abertas"' + (f === "abertas" ? " selected" : "") + ">Propostas e em teste</option>" + MST.map(function (o) { return '<option value="' + o[0] + '"' + (f === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + '<option value="todas"' + (f === "todas" ? " selected" : "") + ">Todas</option></select>" + (canWrite ? '<button class="btn" data-act="new-mel">+ Nova proposta</button>' : "") + "</div>" +
      '<p class="hint" style="margin-top:0">Cada proposta nasce de um indicador e diz como será medida. Teste poucas por vez' + (testing > 2 ? ': <strong style="color:var(--bad)">há ' + testing + " em teste ao mesmo tempo, o ideal é no máximo 2.</strong>" : " (o ideal é no máximo 2 em teste).") + "</p>";
    return html + (all.length ? all.map(melCard).join("") : '<div class="empty-note">Nenhuma proposta neste filtro.</div>');
  }

  /* ----- reunião com o Felipe ----- */
  function lines(s) { return String(s || "").split("\n").map(function (x) { return x.trim(); }).filter(Boolean); }
  function ytWeek(mon) {
    var o = { n: 0, org: 0, ads: 0, horas: 0, subs: 0 }, i, d;
    for (i = 0; i < 7; i++) { d = S.yt_diario.get(add(mon, i)); if (d) { o.n++; o.org += Number(d.org) || 0; o.ads += Number(d.ads) || 0; o.horas += Number(d.horas) || 0; o.subs += Number(d.subs) || 0; } }
    return o;
  }
  /* O relatório depende da semana escolhida: semanas futuras ficam em branco; semanas passadas e a atual usam só os dados até o fim daquela semana. */
  function reportModel(mon) {
    var sun = add(mon, 6), future = mon > TODAY, cut = sun < TODAY ? sun : TODAY, isCur = !future && sun >= TODAY, past = !future && !isCur;
    var wk = gGet("semana", mon), sec = [], L, dd = function (a, b) { return a != null && b ? " (" + (a >= b ? "+" : "") + pf.format((a - b) / Math.abs(b) * 100) + "%)" : ""; };
    var none = future ? "Semana ainda não começou: sem dados." : "Nada registrado nesta semana.";
    if (future) {
      sec.push({ h: "1. Resultados", items: [], empty: none }, { h: "2. Riscos e bloqueios", items: [], empty: none }, { h: "3. Próximos 14 dias", items: [], empty: none }, { h: "4. Propostas de melhoria", items: [], empty: none });
      sec.push({ h: "5. Decisões necessárias do Felipe", items: lines(wk.decisoes), empty: "Nenhuma decisão registrada. Escreva abaixo o que precisa ser decidido." });
      return { sec: sec, future: true, past: false };
    }
    /* 1. Resultados */
    var r = igMeta(cut), ws = metList().filter(function (w) { return w.fim && w.fim <= cut; }), doc = ws.filter(function (w) { return w.fim >= mon && w.fim <= sun; }).pop();
    L = [];
    if (r.ganhos == null) L.push("Meta oficial (+" + fN(r.m.meta) + " seguidores no @cw.cast): sem leitura de seguidores até " + br(cut) + ".");
    else L.push("Meta oficial até " + br(r.ref) + ": " + sgn(r.ganhos) + " de " + fN(r.m.meta) + " novos seguidores (" + SL[r.status].toLowerCase() + "). Esperado até essa data: +" + fN(Math.round(r.esperado)) + ". Faltam " + fN(r.faltam) + "; é preciso entrar " + fN(Math.ceil(r.dia)) + " por dia até " + br(r.m.fim) + ".");
    if (r.ganhos != null) {
      var pre = r.rows.filter(function (x) { return x.d < mon; }), preTotal = pre.length ? pre[pre.length - 1].total : r.m.base, inW = r.rows.filter(function (x) { return x.d >= mon && x.d <= cut; });
      if (inW.length) {
        var ult = inW[inW.length - 1], g = ult.total - preTotal, nd = Math.max(diff(ult.d, pre.length ? pre[pre.length - 1].d : add(r.m.inicio, -1)), 1), need0 = Math.max(r.m.meta - (preTotal - r.m.base), 0) / Math.max(diff(r.m.fim, pre.length ? pre[pre.length - 1].d : add(r.m.inicio, -1)), 1);
        L.push("Seguidores na semana: " + sgn(g) + " em " + nd + (nd === 1 ? " dia" : " dias") + " (média de " + fD(g / nd) + " por dia; o necessário no início da semana era " + fD(need0) + " por dia). Total em " + dm(ult.d) + ": " + fN(ult.total) + ".");
      } else L.push("Sem leitura de seguidores dentro desta semana.");
    }
    var y = ytWeek(mon), py = ytWeek(add(mon, -7));
    if (y.n) L.push("YouTube (" + dm(mon) + " a " + dm(sun) + (y.n < 7 ? ", " + y.n + (y.n === 1 ? " dia" : " dias") + " com dado" : "") + "): " + fN(y.org) + " views orgânicas" + (y.n === 7 && py.n === 7 ? dd(y.org, py.org) : "") + " e " + fN(y.ads) + " de anúncio; " + fD(y.horas) + " horas assistidas; " + sgn(y.subs) + " inscritos líquidos. Sem meta oficial." + (py.n && !(y.n === 7 && py.n === 7) ? " (Sem comparação: a semana anterior ou esta tem dias sem dado.)" : ""));
    else if (doc && doc.yt && doc.yt.org != null) L.push("YouTube" + (doc.periodo_yt ? " (" + doc.periodo_yt + ")" : "") + ": " + fN(doc.yt.org) + " views orgânicas e " + fN(doc.yt.ads) + " de anúncio; " + fN(doc.yt.horas) + " horas assistidas; " + fN(doc.yt.subs) + " inscritos líquidos. Sem meta oficial.");
    else L.push("YouTube: sem dados registrados nesta semana.");
    var es = studio();
    if (es && es.total && es.total.fim >= mon && es.total.fim <= sun) {
      L.push("YouTube Studio (" + es.periodo + "): CTR das miniaturas " + pf2.format(es.total.ctr) + "% em " + fN(es.total.imp) + " impressões; duração média da visualização " + mmss(es.total.avg_s) + ".");
      (es.itens || []).filter(function (i) { return i.tipo === "episodio"; }).forEach(function (i) { L.push("Episódio " + i.ep + ": " + fN(i.views) + " views no período; CTR " + pf2.format(i.ctr) + "%; retenção " + (i.ret != null ? fP(i.ret) : "—") + "; primeiros 7 dias: " + (i.d7 ? fN(i.d7.views) + " views e " + sgn(i.d7.subs) + " inscritos" + (i.d7.dias < 7 ? " (parcial, " + i.d7.dias + " dias)" : "") : "—") + "."); });
    }
    if (doc && doc.ig && doc.ig.views != null) {
      var c = doc.ig, prev = ws.filter(function (w) { return w.fim < doc.fim && w.ig && w.ig.views != null; }).pop(), p = (prev && prev.ig) || {};
      L.push("Instagram" + (doc.periodo_ig ? " (" + doc.periodo_ig + ")" : "") + ": " + fN(c.views) + " visualizações" + dd(c.views, p.views) + ", " + fN(c.alcance) + " contas alcançadas, " + fN(c.interacoes) + " interações" + (c.salvamentos != null ? ", " + fN(c.salvamentos) + " salvamentos" : "") + ".");
      if (c.visitas != null) L.push("Funil do perfil: " + fN(c.visitas) + " visitas ao perfil e " + fN(c.toques) + " toques no link da bio" + (c.visitas ? " (" + fP(c.toques / c.visitas * 100) + ")" : "") + ". Mediana por post: " + fN(c.med_views) + " views e " + fN(c.med_inter) + " interações.");
      lines(doc.melhores).length && L.push("Melhores conteúdos: " + lines(doc.melhores).join(" | "));
      lines(doc.piores).length && L.push("Piores conteúdos: " + lines(doc.piores).join(" | "));
      doc.analise && L.push("Leitura: " + doc.analise);
    } else L.push("Instagram (Insights): sem fechamento de métricas registrado nesta semana.");
    sec.push({ h: "1. Resultados", items: L, empty: none });
    /* 2. Riscos e bloqueios */
    L = [];
    if (past) L.push("(Situação atual dos riscos que já estavam registrados no fim desta semana.)");
    rList("riscos").filter(function (x) { return x.status !== "resolvido" && (x.criado || "2026-10-15") <= cut; }).sort(function (a, b) { return impN(a) - impN(b); }).forEach(function (x) { L.push("[" + (IMPL[x.impacto] || "Médio").toUpperCase() + "] " + (x.titulo || "(sem título)") + (x.acao ? " | Ação: " + x.acao : " | Sem ação definida") + " | " + (x.resp ? "Resp.: " + x.resp : "sem responsável") + " | " + (x.prazo ? "Prazo: " + br(x.prazo) : "sem prazo")); });
    if (isCur) {
      dueReminders().forEach(function (x) { var cc = crit72(x.pub); L.push((cc && cc.over ? "" : "[ALTO] ") + remText(x)); });
      confLate().list.forEach(function (x) { L.push("[MÉDIO] " + epName(x.p) + " (" + dm(x.p.date) + "): '" + x.i.label + "' venceu em " + dm(x.i.due) + "."); });
      calRiscos().forEach(function (c) { L.push("Calendário: " + c.title + " — " + (c.risk.description || "risco") + (c.sub ? " (plano B: " + c.sub + ")" : "")); });
    }
    sec.push({ h: "2. Riscos e bloqueios", items: past && L.length === 1 ? [] : L, empty: none });
    /* 3. Próximos 14 dias (a partir do fim da semana escolhida) */
    L = []; var from = isCur ? TODAY : add(sun, 1), end = add(from, 13);
    cards().filter(function (c) { return c.date && c.date >= from && c.date <= end && (c.type === "publicacao" || c.type === "gravacao_podcast" || c.type === "gravacao_giro" || c.type === "video_extra"); }).sort(function (a, b) { return a.date < b.date ? -1 : 1; })
      .forEach(function (c) { L.push(dm(c.date) + " · " + TYPES[c.type].short + ": " + c.title.replace(/^(Publicação|Gravação): /, "") + (c.type === "publicacao" ? (c.scheduled ? " (agendado)" : " (NÃO agendado)") : "") + (c.gs === "a_confirmar" ? " (convidado a confirmar)" : "")); });
    sec.push({ h: "3. Próximos 14 dias" + (isCur ? "" : " (de " + dm(from) + " a " + dm(end) + ")"), items: L, empty: none });
    /* 4. Melhorias registradas até o fim da semana */
    L = rList("melhorias").filter(function (m) { return (m.status === "proposta" || m.status === "testando") && (m.criado || "2026-10-15") <= cut; }).sort(function (a, b) { return (a.status === "testando" ? 0 : 1) - (b.status === "testando" ? 0 : 1); })
      .map(function (m) { return "[" + (m.status === "testando" ? "EM TESTE" : "PROPOSTA") + "] " + (m.titulo || "(sem título)") + (m.base ? " | Base: " + m.base : "") + (m.medir ? " | Medir: " + m.medir : ""); });
    sec.push({ h: "4. Propostas de melhoria", items: L, empty: none });
    sec.push({ h: "5. Decisões necessárias do Felipe", items: lines(wk.decisoes), empty: "Nenhuma decisão registrada. Escreva abaixo o que precisa ser decidido." });
    return { sec: sec, future: false, past: past };
  }
  function reportText(mon) {
    var out = ["REUNIÃO DE ACOMPANHAMENTO · CW CAST", "Semana de " + br(mon) + " a " + br(add(mon, 6)), ""];
    reportModel(mon).sec.forEach(function (s) { out.push(s.h.toUpperCase()); (s.items.length ? s.items : [s.empty || "Nada registrado."]).forEach(function (i) { out.push("• " + i); }); out.push(""); });
    return out.join("\n");
  }
  function viewReuniao() {
    var mon = st.repWeek || mondayOf(TODAY), wk = gGet("semana", mon), model = reportModel(mon);
    var html = '<div class="toolbar"><div class="monthnav"><button class="round" data-act="rep-prev" aria-label="Semana anterior">‹</button><h2 style="font-size:17px;min-width:190px">Semana de ' + dm(mon) + " a " + dm(add(mon, 6)) + '</h2><button class="round" data-act="rep-next" aria-label="Próxima semana">›</button></div><button class="btn" data-act="copy-rel">Copiar relatório</button></div>';
    html += '<article class="sheet"><h2>Reunião de acompanhamento · CW Cast</h2><div class="sub">Semana de ' + br(mon) + " a " + br(add(mon, 6)) + " · " + (model.future ? "semana futura" : model.past ? "semana encerrada" : "semana atual") + " · gerado em " + br(TODAY) + "</div>" +
      model.sec.map(function (s) { return "<h3>" + esc(s.h) + "</h3>" + (s.items.length ? "<ul>" + s.items.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul>" : '<p class="none">' + esc(s.empty || "Nada registrado.") + "</p>"); }).join("") + "</article>";
    if (st.copyFallback) html += '<div class="editor"><label class="f">Seu navegador não permitiu copiar sozinho. Selecione o texto abaixo e copie:<textarea id="copy-fallback" rows="8" readonly>' + esc(st.copyFallback) + "</textarea></label></div>";
    html += '<div class="editor">' + area("semana", mon, "decisoes", "Decisões necessárias do Felipe (uma por linha, entram no relatório)", wk.decisoes, 3) + area("semana", mon, "ata", "Anotações da reunião e ações combinadas (registre as ações na aba Riscos ou Melhorias)", wk.ata, 5) + "</div>";
    return html;
  }

  /* ----- ações dos botões novos ----- */
  function gAct(t, a) {
    var d = t.dataset;
    if (a === "new-risco" && canWrite) { var id = newId("r"); gPut("riscos", id, { titulo: "", desc: "", impacto: "medio", prob: "media", acao: "", resp: "", prazo: "", status: "aberto", criado: TODAY }); st.rf = "abertos"; renderTabs(); renderMain(); var e1 = document.getElementById(fid("riscos", id, "titulo")); if (e1) e1.focus(); return true; }
    if (a === "new-mel" && canWrite) { var id2 = newId("m"); gPut("melhorias", id2, { titulo: "", base: "", hipotese: "", medir: "", resp: "", prazo: "", status: "proposta", resultado: "", criado: TODAY }); st.mf = "abertas"; renderMain(); var e2 = document.getElementById(fid("melhorias", id2, "titulo")); if (e2) e2.focus(); return true; }
    if (a === "new-sem" && canWrite) { var id3 = newId("w"); gPut("metricas", id3, { fim: TODAY, periodo_ig: "", periodo_yt: "", fonte: "", ig: {}, yt: {}, melhores: "", piores: "", analise: "" }); renderMain(); return true; }
    if (a === "del-g") { if (!canWrite) return true; if (d.sure) { gDel(d.col, d.id); renderTabs(); renderMain(); } else { d.sure = "1"; t.textContent = "Confirmar exclusão"; } return true; }
    if (a === "rm") { st.rm = d.m; renderMain(); return true; }
    if (a === "reg-seg" && canWrite) {
      var box = t.closest(".entry"), dt = box.querySelector('input[type="date"]').value || TODAY, tv = String(box.querySelector('input[type="text"],input[type="number"]').value || "").replace(/\D/g, "");
      if (tv === "") { box.querySelector('input[inputmode="numeric"]').focus(); return true; }
      gPut("seguidores", dt, { total: Number(tv), nota: "" }); renderTabs(); renderMain(); return true;
    }
    if (a === "rep-prev" || a === "rep-next") { st.repWeek = add(st.repWeek || mondayOf(TODAY), a === "rep-next" ? 7 : -7); st.copyFallback = ""; renderMain(); return true; }
    if (a === "copy-rel") {
      var text = reportText(st.repWeek || mondayOf(TODAY)), btn = t;
      var ok = function () { btn.textContent = "Copiado ✓"; setTimeout(function () { btn.textContent = "Copiar relatório"; }, 2000); };
      var fail = function () { st.copyFallback = text; renderMain(); var ta = document.getElementById("copy-fallback"); if (ta) { ta.focus(); ta.select(); } };
      try { navigator.clipboard.writeText(text).then(ok, fail); } catch (e) { fail(); }
      return true;
    }
    return false;
  }

  /* navegação pelo menu lateral da Central */
  window.castIrPara = function (t) { st.tab = t; st.panel = undefined; renderPanel(); render(); };

  /* ---------- inicialização ---------- */
  render();
  var uc = true;
  if (uc) {
    Promise.all([Promise.resolve(CTX.db), Promise.resolve(CTX.user)]).then(function (r) {
      db = r[0]; var user = r[1];
      if (!db) { render(); return; }
      dbOk = true;
      if (user) user.can("data.write").then(function (ok) { if (ok === false) { canWrite = false; setSync(); renderPanel(); render(); } });
      db.collection("cards").onSnapshot(function (snap) {
        var m = new Map(); snap.docs.forEach(function (d) { m.set(d.id, d.data()); });
        pending.forEach(function (v, id) { m.set(id, v); });
        ov = m; cache = null;
        var inPanel = document.activeElement && document.activeElement.closest && document.activeElement.closest(".drawer");
        renderTabs(); renderBanner(); if (st.tab !== "equipe" && !editingMain()) renderMain(); setSync(); if (!inPanel) renderPanel();
      }, function () { lastErr = "Sem acesso aos dados salvos"; setSync(); });
      gSubscribe();
      db.doc("config/team").onSnapshot(function (d) {
        if (d.exists) { var x = d.data(); team = { names: x.names && x.names.length ? x.names : TEAM_FIXA.slice(), defaults: x.defaults || {} }; cache = null; }
        var inPanel = document.activeElement && document.activeElement.closest && document.activeElement.closest(".drawer, #cast-main textarea");
        if (!inPanel) { render(); renderPanel(); }
      });
      render();
    });
  } else { render(); }
};

/* expõe um jeito de forçar novo desenho quando a Central atualizar o Jira ou o ao vivo */
