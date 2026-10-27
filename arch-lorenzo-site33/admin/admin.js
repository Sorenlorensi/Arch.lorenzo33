(function () {
  var C = window.CFG, $ = function (i) { return document.getElementById(i); };
  var say = function (t) { $("st").textContent = t; };
  var token = sessionStorage.getItem("al_token");
  function hd(extra) { return Object.assign({ apikey: C.SUPABASE_ANON_KEY, Authorization: "Bearer " + token }, extra || {}); }
  function rest(path, opt) { opt = opt || {}; opt.headers = hd(opt.headers);
    return fetch(C.SUPABASE_URL + "/rest/v1/" + path, opt).then(function (r) { if (r.status === 401) { logout(); throw new Error("Sessão expirada. Entre novamente."); } if (!r.ok) throw new Error("Sem permissão ou dados inválidos."); return r.status === 204 ? null : r.text().then(function (t) { return t ? JSON.parse(t) : null; }); }); }
  var J = { "Content-Type": "application/json", Prefer: "return=minimal" };
  var slug = function (s) { return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); };
  function gate() { $("login").hidden = !!token; $("app").hidden = !token; $("out").hidden = !token; if (token) load(); }
  function logout() { token = null; sessionStorage.removeItem("al_token"); gate(); }
  $("login").onsubmit = function (e) { e.preventDefault();
    fetch(C.SUPABASE_URL + "/auth/v1/token?grant_type=password", { method: "POST", headers: { apikey: C.SUPABASE_ANON_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ email: $("em").value, password: $("pw").value }) })
      .then(function (r) { return r.json(); }).then(function (d) { if (!d.access_token) { say("E-mail ou senha incorretos."); return; } token = d.access_token; sessionStorage.setItem("al_token", token); $("pw").value = ""; say(""); gate(); }); };
  $("out").onclick = logout;
  function el(tag, props) { var e = Object.assign(document.createElement(tag), props || {}); for (var i = 2; i < arguments.length; i++) e.append(arguments[i]); return e; }
  function load() { tab("p"); $("dlg").open && $("dlg").close(); var box = $("list"); box.replaceChildren();
    rest("projects?select=*&order=sort").then(function (data) {
      say(data.length ? "" : "Nenhum projeto ainda. Clique em Novo projeto.");
      data.forEach(function (p) {
        var r = el("div", { className: "row" }, el("img", { src: p.cover_url || "", alt: "" }), el("div", { textContent: p.title + " (" + p.category + ")" + (p.published ? "" : " [oculto]") + (p.featured ? " ★" : "") }));
        var ed = el("button", { textContent: "Editar" }); ed.onclick = function () { edit(p); };
        var du = el("button", { textContent: "Duplicar" }); du.onclick = function () { var c = Object.assign({}, p); delete c.id; delete c.created_at; c.title += " (cópia)"; c.slug = slug(c.title) + "-" + Date.now().toString(36); c.published = false; rest("projects", { method: "POST", headers: J, body: JSON.stringify(c) }).then(load).catch(function (e) { say(e.message); }); };
        var de = el("button", { textContent: "Excluir" }); de.onclick = function () { if (!confirm('Excluir "' + p.title + '"?')) return; rest("projects?id=eq." + p.id, { method: "DELETE" }).then(function () { say("Projeto excluído."); load(); }).catch(function (e) { say(e.message); }); };
        r.append(ed, du, de); box.append(r); });
    }).catch(function (e) { say(e.message); }); }
  function edit(p) { p = p || {}; var f = $("pf"); f.reset(); $("dlg").showModal(); $("p-cover").hidden = !p.cover_url; $("p-cover").src = p.cover_url || ""; f.dataset.cover = p.cover_url || ""; f.dataset.gallery = JSON.stringify(p.gallery || []);
    ["id", "title", "category", "location", "area", "year", "sort", "description"].forEach(function (k) { f[k].value = p[k] == null ? (k === "sort" ? 0 : "") : p[k]; });
    f.published.checked = p.published !== false; f.featured.checked = !!p.featured; }
  $("new").onclick = function () { edit(); }; $("cx").onclick = function () { $("dlg").close(); };
  function up(file) { var ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[file.type];
    if (!ext) return Promise.reject(new Error("Use JPG, PNG ou WebP.")); if (file.size > 5242880) return Promise.reject(new Error("Imagem acima de 5 MB."));
    var path = crypto.randomUUID() + "." + ext;
    return fetch(C.SUPABASE_URL + "/storage/v1/object/projects/" + path, { method: "POST", headers: hd({ "Content-Type": file.type }), body: file })
      .then(function (r) { if (!r.ok) throw new Error("Falha no envio da imagem."); return C.SUPABASE_URL + "/storage/v1/object/public/projects/" + path; }); }
  $("pf").onsubmit = function (e) { e.preventDefault(); var f = e.target; say("Salvando…");
    var cover = f.dataset.cover, gallery = JSON.parse(f.dataset.gallery || "[]"), chain = Promise.resolve();
    if (f.cover.files[0]) chain = chain.then(function () { return up(f.cover.files[0]).then(function (u) { cover = u; }); });
    Array.prototype.forEach.call(f.gallery.files, function (file) { chain = chain.then(function () { return up(file).then(function (u) { gallery.push(u); }); }); });
    chain.then(function () {
      var row = { title: f.title.value.trim(), category: f.category.value, location: f.location.value, area: f.area.value, year: f.year.value ? +f.year.value : null, sort: +f.sort.value || 0, description: f.description.value, cover_url: cover || null, gallery: gallery, published: f.published.checked, featured: f.featured.checked };
      if (f.id.value) return rest("projects?id=eq." + f.id.value, { method: "PATCH", headers: J, body: JSON.stringify(row) });
      row.slug = slug(row.title) + "-" + Date.now().toString(36); return rest("projects", { method: "POST", headers: J, body: JSON.stringify(row) });
    }).then(function () { say("Projeto salvo. Já aparece no site."); $("dlg").close(); load(); }).catch(function (err) { say("Erro: " + err.message); }); };
  $("tl").onclick = load;
  $("tc").onclick = function () { tab("c"); var box = $("v-c"); box.replaceChildren();
    rest("leads?select=*&order=created_at.desc").then(function (d) { say(d.length ? "" : "Nenhum contato recebido.");
      d.forEach(function (l) { box.append(el("div", { className: "row" }, el("div", { textContent: new Date(l.created_at).toLocaleDateString("pt-BR") + " — " + l.name + " — " + l.contact + " — " + (l.project_type || "") + " — " + (l.location || "") + " — " + (l.message || "") }))); });
    }).catch(function (e) { say(e.message); }); };
  function tab(n) { ["p", "s", "c"].forEach(function (k) { $("v-" + k).hidden = k !== n; }); ["tl", "ts", "tc"].forEach(function (b, i) { $(b).className = ["p", "s", "c"][i] === n ? "k" : ""; }); }
  // ---- Site: textos, cores, imagens ----
  var COLORS = [["color_bg", "Fundo claro", "#f6f4ef"], ["color_ink", "Texto", "#1c1b19"], ["color_dark", "Fundo escuro", "#1b1a18"], ["color_gold", "Destaque", "#b08d57"]];
  function lum(h) { var c = [1, 3, 5].map(function (i) { var v = parseInt(h.substr(i, 2), 16) / 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; }
  function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
  var DEF = {};
  $("ts").onclick = function () { tab("s"); say("Carregando…");
    Promise.all([rest("site_settings?select=key,value"), fetch("../index.html").then(function (r) { return r.text(); })]).then(function (res) {
      var S = {}; res[0].forEach(function (x) { S[x.key] = x.value; });
      var doc = new DOMParser().parseFromString(res[1], "text/html"), box = $("txt"); box.replaceChildren(); DEF = {};
      doc.querySelectorAll("[data-t]").forEach(function (n) { var k = n.dataset.t, d = n.textContent.trim(); DEF[k] = d;
        var long = d.length > 70, inp = el(long ? "textarea" : "input", { name: k, value: S[k] || d, maxLength: 2000 }); if (long) inp.rows = 3;
        box.append(el("label", { textContent: n.dataset.label }, inp)); });
      $("cols").replaceChildren(); COLORS.forEach(function (c) { $("cols").append(el("label", { textContent: c[1] }, el("input", { type: "color", name: c[0], value: S[c[0]] || c[2] }))); });
      ["hero", "logo"].forEach(function (k) { var im = $("p-" + k); im.hidden = !S["img_" + k]; im.src = S["img_" + k] || ""; });
      say(""); }).catch(function (e) { say(e.message); }); };
  $("ssave").onclick = function () { var rows = [], cols = {};
    document.querySelectorAll("#txt [name]").forEach(function (i) { if (i.value.trim()) rows.push({ key: i.name, value: i.value.trim() }); });
    document.querySelectorAll("#cols [name]").forEach(function (i) { cols[i.name] = i.value; rows.push({ key: i.name, value: i.value }); });
    if (ratio(cols.color_ink, cols.color_bg) < 4.5) return say("Texto e fundo claro estão com pouco contraste. Escolha cores mais distantes.");
    if (ratio(cols.color_dark, "#f6f4ef") < 4.5) return say("O fundo escuro está claro demais para o texto branco. Escolha um tom mais escuro.");
    say("Salvando…"); var chain = Promise.resolve();
    [["hero", "i-hero"], ["logo", "i-logo"]].forEach(function (x) { var f = $(x[1]).files[0]; if (f) chain = chain.then(function () { return up(f).then(function (u) { rows.push({ key: "img_" + x[0], value: u }); }); }); });
    chain.then(function () { return rest("site_settings", { method: "POST", headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(rows) }); })
      .then(function () { say("Alterações salvas. Já aparecem no site."); }).catch(function (e) { say("Erro: " + e.message); }); };
  gate();
})();
