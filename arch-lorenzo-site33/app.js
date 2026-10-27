(function () {
  var C = window.CFG, H = { apikey: C.SUPABASE_ANON_KEY, Authorization: "Bearer " + C.SUPABASE_ANON_KEY };
  var $ = function (i) { return document.getElementById(i); };
  if (C.WHATSAPP) { var w = $("wa-top"); w.href = "https://wa.me/" + C.WHATSAPP; w.hidden = false; }
  if (C.INSTAGRAM) { var a = document.createElement("a"); a.href = C.INSTAGRAM; a.textContent = "· Instagram"; $("ig").append(a); }

  // Projetos (precisa de JS: o conteúdo vem do painel)
  fetch(C.SUPABASE_URL + "/rest/v1/projects?select=*&published=eq.true&order=featured.desc,sort.asc,created_at.desc", { headers: H })
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (list) {
      var box = $("proj"); box.replaceChildren();
      if (!list.length) { box.textContent = "Em breve, novos projetos."; return; }
      list.forEach(function (p) {
        var art = document.createElement("article");
        if (p.cover_url) { var im = new Image(); im.src = p.cover_url; im.alt = p.title + ", projeto de " + p.category.toLowerCase(); im.loading = "lazy"; im.width = 800; im.height = 600; art.append(im); }
        var h = document.createElement("h3"); h.textContent = p.title;
        var s = document.createElement("small"); s.textContent = [p.category, p.location, p.area, p.year].filter(Boolean).join(" · ");
        art.append(h, s);
        if (p.description) { var d = document.createElement("p"); d.textContent = p.description; art.append(d); }
        box.append(art);
      });
    }).catch(function () { $("proj").textContent = "Não foi possível carregar os projetos agora."; });

  // Formulário (precisa de JS: grava o contato)
  var f = $("lead"), msg = $("msg");
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var d = Object.fromEntries(new FormData(f));
    if (!d.name || d.name.length < 2 || !d.contact || d.contact.length < 5) { msg.textContent = "Preencha nome e contato."; return; }
    if (!d.consent) { msg.textContent = "Marque a autorização para enviar."; return; }
    d.consent = true; msg.textContent = "Enviando…";
    fetch(C.SUPABASE_URL + "/rest/v1/leads", { method: "POST", headers: Object.assign({ "Content-Type": "application/json", Prefer: "return=minimal" }, H), body: JSON.stringify(d) })
      .then(function (r) {
        if (!r.ok) throw 0;
        f.reset(); msg.textContent = "Recebemos sua solicitação. ";
        if (C.WHATSAPP) { var b = document.createElement("a"); b.className = "btn"; b.textContent = "Continuar no WhatsApp";
          b.href = "https://wa.me/" + C.WHATSAPP + "?text=" + encodeURIComponent("Olá! Sou " + d.name + " e enviei um pedido de orçamento (" + d.project_type + ") pelo site."); msg.append(b); }
      }).catch(function () { msg.textContent = "Não foi possível enviar. Tente pelo WhatsApp."; });
  });
  // Textos, cores e imagens editados no painel
  fetch(C.SUPABASE_URL + "/rest/v1/site_settings?select=key,value", { headers: H }).then(function (r) { return r.ok ? r.json() : []; }).then(function (rows) {
    var S = {}; rows.forEach(function (x) { S[x.key] = x.value; });
    document.querySelectorAll("[data-t]").forEach(function (n) { if (S[n.dataset.t]) n.textContent = S[n.dataset.t]; });
    var hex = /^#[0-9a-fA-F]{6}$/, root = document.documentElement.style;
    [["color_bg", "--bg"], ["color_ink", "--ink"], ["color_dark", "--dark"], ["color_gold", "--gold"]].forEach(function (c) { if (hex.test(S[c[0]] || "")) root.setProperty(c[1], S[c[0]]); });
    var ok = function (u) { return u && u.indexOf(C.SUPABASE_URL + "/storage/") === 0; };
    if (ok(S.img_hero)) $("hero").style.background = 'linear-gradient(rgba(27,26,24,.65),rgba(27,26,24,.65)),url("' + S.img_hero + '") center/cover';
    if (ok(S.img_logo)) { var im = new Image(); im.src = S.img_logo; im.alt = "Arch.Lorenzo"; im.style.height = "38px"; $("logo").replaceChildren(im); }
  }).catch(function () {});
})();
