// Portfolio interactions: boot log, portrait that follows the cursor,
// sensor wires to each memory, the "who are you looking for" query,
// reveal on scroll and a lightbox.
(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- Boot ---------- */
  const boot = $("#boot");
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch {} },
  };
  const lines = [
    "> подключение нейроинтерфейса ......... ок",
    "> субъект: ВИЛЬМОН ВАЛЕРИЯ",
    "> профиль: нарратив / сценарии / ИИ / код",
    "> найдено воспоминаний: 5",
    "> целостность личности: 100%",
    "> начинаю перенос_",
  ];
  function endBoot() {
    boot.classList.add("is-done");
    store.set("booted", "1");
    removeEventListener("keydown", endBoot);
    boot.removeEventListener("click", endBoot);
  }
  if (reduced || store.get("booted")) {
    boot.classList.add("is-done");
  } else {
    const log = $("#bootLog");
    let i = 0;
    const tick = () => {
      if (boot.classList.contains("is-done")) return;
      if (i < lines.length) { log.textContent += (i ? "\n" : "") + lines[i++]; setTimeout(tick, 260); }
      else setTimeout(endBoot, 500);
    };
    setTimeout(tick, 200);
    addEventListener("keydown", endBoot);
    boot.addEventListener("click", endBoot);
  }

  /* ---------- Portrait + sensors + wires ---------- */
  const portrait = $("#portrait");
  const img = $(".portrait__img", portrait);
  const svg = $("#wires");
  const hero = $("#hero");
  const nodes = $$(".node");
  // Sensor spots on the avatar's head, in % of the picture: left side for left nodes, right for right.
  const spots = [[34, 17], [34, 32], [36, 48], [60, 9], [74, 24], [73, 45]];
  const layer = document.createElement("div");
  layer.className = "portrait__sensors";
  Object.assign(layer.style, { position: "absolute", inset: 0, pointerEvents: "none", transformStyle: "preserve-3d", transition: "transform .12s linear" });
  const dots = spots.map(([x, y]) => {
    const d = document.createElement("i");
    Object.assign(d.style, { position: "absolute", left: x + "%", top: y + "%", width: "1px", height: "1px" });
    layer.append(d);
    return d;
  });
  portrait.append(layer);

  const NS = "http://www.w3.org/2000/svg";
  const mk = (tag, cls) => { const e = document.createElementNS(NS, tag); if (cls) e.setAttribute("class", cls); svg.append(e); return e; };
  const parts = nodes.map(() => ({ wire: mk("path", "wire"), pulse: mk("path", "wire--pulse"), glow: mk("circle", "sensor-glow"), pad: mk("circle", "sensor") }));

  const narrow = matchMedia("(max-width: 900px)");
  function draw() {
    const h = hero.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${h.width} ${h.height}`);
    nodes.forEach((n, k) => {
      const s = dots[+n.dataset.sensor].getBoundingClientRect();
      const a = $("a", n).getBoundingClientRect();
      const sx = s.left - h.left, sy = s.top - h.top;
      const left = n.dataset.side === "l";
      const ey = a.top + a.height / 2 - h.top;
      let d;
      if (narrow.matches) {
        // Cards sit under the portrait: the wire runs down the page edge and into the card's side.
        const ex = (left ? a.left : a.right) - h.left;
        const gx = left ? ex - 9 : ex + 9;
        d = `M${sx},${sy} C${gx},${sy} ${gx},${ey - 30} ${gx},${ey} S${ex},${ey} ${ex},${ey}`;
      } else {
        // Wire rises off the head first, then sweeps out to the node.
        const ex = (left ? a.right : a.left) - h.left;
        const lift = 90 + k % 3 * 40;
        d = `M${sx},${sy} C${sx + (left ? -20 : 20)},${sy - lift} ${ex + (left ? 120 : -120)},${ey} ${ex},${ey}`;
      }
      const p = parts[k];
      p.wire.setAttribute("d", d);
      p.pulse.setAttribute("d", d);
      p.pulse.style.animationDelay = `${-k * 0.4}s`;
      p.pad.setAttribute("cx", sx); p.pad.setAttribute("cy", sy); p.pad.setAttribute("r", 7);
      p.glow.setAttribute("cx", sx); p.glow.setAttribute("cy", sy); p.glow.setAttribute("r", 2.4);
    });
  }

  let mx = 0, my = 0, tx = 0, ty = 0, raf = 0;
  function frame() {
    tx += (mx - tx) * 0.12; ty += (my - ty) * 0.12;
    const t = `rotateY(${tx * 6}deg) rotateX(${-ty * 4}deg) translate3d(${tx * 8}px, ${ty * 4}px, 0)`;
    img.style.transform = t;
    layer.style.transform = t;
    draw();
    raf = Math.abs(mx - tx) + Math.abs(my - ty) > 0.002 ? requestAnimationFrame(frame) : 0;
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  if (!reduced) {
    addEventListener("pointermove", (e) => {
      const r = portrait.getBoundingClientRect();
      mx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth / 2)));
      my = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (innerHeight / 2)));
      kick();
    }, { passive: true });
  }
  // Touch screens have no cursor: the head sways gently on its own while the hero is visible.
  if (!reduced && matchMedia("(hover: none)").matches && "IntersectionObserver" in window) {
    let on = false, t0 = performance.now();
    const sway = (now) => {
      if (!on) return;
      const t = (now - t0) / 1000;
      mx = Math.sin(t * 0.7) * 0.5; my = Math.sin(t * 0.45) * 0.25;
      kick();
      requestAnimationFrame(sway);
    };
    new IntersectionObserver(([e]) => { const was = on; on = e.isIntersecting; if (on && !was) requestAnimationFrame(sway); }).observe(portrait);
  }
  addEventListener("resize", draw);
  addEventListener("load", draw);
  document.fonts?.ready.then(draw);
  draw();

  const hot = (k, on) => {
    nodes[k].classList.toggle("is-hot", on);
    parts[k].wire.classList.toggle("is-hot", on);
    parts[k].pulse.classList.toggle("is-hot", on);
    parts[k].pad.classList.toggle("is-hot", on);
  };
  nodes.forEach((n, k) => {
    n.addEventListener("pointerenter", () => hot(k, true));
    n.addEventListener("pointerleave", () => hot(k, false));
    n.addEventListener("focusin", () => hot(k, true));
    n.addEventListener("focusout", () => hot(k, false));
  });

  // Sync counter in the HUD.
  const sync = $("#sync");
  let pct = 0;
  const count = () => { pct = Math.min(100, pct + 3); sync.textContent = pct; if (pct < 100) setTimeout(count, 30); };
  setTimeout(count, reduced ? 0 : 1400);

  /* ---------- Query: reorder memories for the visitor ---------- */
  const orders = {
    narrative: ["mercy", "witch", "deckforge", "code", "video"],
    vibe: ["witch", "code", "mercy", "deckforge", "video"],
    ai: ["deckforge", "video", "mercy", "witch", "code"],
  };
  const answers = {
    narrative: "Пишу истории, где у морального выбора нет правильного ответа, и довожу их до сцены, диалога и игры. Первым открыт сценарий Digital Mercy.",
    vibe: "Собираю играбельные прототипы игр с Claude Code и Codex: от идеи до релиза на itch.io. Первой открыта моя игра Almost a Witch.",
    ai: "Делаю внутриигровой контент с ИИ: карты, боссов, ресурсы и маскота DeckForge, игра вышла в релиз. Первым открыт DeckForge.",
  };
  const answerEl = $("#queryAnswer");
  const mems = Object.fromEntries($$(".mem").map((m) => [m.dataset.mem, m]));
  $$(".query__opts button").forEach((b) => {
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => {
      const f = b.dataset.focus;
      $$(".query__opts button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      const list = $("#memories");
      orders[f].forEach((id, i) => {
        list.append(mems[id]); // real DOM order, so keyboard and screen readers follow it too
        mems[id].classList.toggle("is-focus", i === 0);
        const num = $(".mem__file", mems[id]).firstChild;
        num.textContent = `ВОСПОМИНАНИЕ 0${i + 1} `;
      });
      nodes.forEach((n) => {
        n.classList.toggle("is-dim", !n.dataset.for.split(" ").includes(f));
        const i = orders[f].indexOf(n.dataset.target);
        if (i >= 0) $(".node__n", n).textContent = `0${i + 1}`;
      });
      answerEl.textContent = answers[f];
      answerEl.classList.add("is-set");
      draw();
    });
  });

  /* ---------- Reveal on scroll ---------- */
  const revealables = $$(".mem__head, .witch, .strip, .mercy, .why, .memq, .media2, .cast, .deck, .protos, .code, .sess, .contact > *");
  if (!reduced && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    revealables.forEach((el) => { el.classList.add("reveal"); io.observe(el); });
  }

  /* ---------- Memory fragment: decays unless someone pays attention ---------- */
  const mq = $("#memq");
  if (mq) {
    const text = $("#memqText"), pctEl = $("#memqPct"), bar = $("#memqBar");
    const phrase = text.textContent;
    text.setAttribute("aria-label", phrase);
    text.textContent = "";
    const GLYPHS = "░▒▓█#%&@*+=/\\<>01";
    // Words stay whole when the line wraps; each letter keeps its width when it turns into noise.
    const cells = [];
    phrase.split(" ").forEach((word, wi) => {
      if (wi) { const sp = document.createElement("span"); sp.className = "sp"; sp.textContent = " "; text.append(sp); }
      const w = document.createElement("span");
      w.className = "word"; w.setAttribute("aria-hidden", "true");
      [...word].forEach((ch) => {
        const c = document.createElement("span");
        c.className = "ch"; c.textContent = ch;
        w.append(c); cells.push({ el: c, ch, lost: false });
      });
      text.append(w);
    });
    const fix = () => cells.forEach((c) => { c.el.style.width = ""; c.el.style.width = c.el.getBoundingClientRect().width + "px"; });
    document.fonts?.ready.then(fix); addEventListener("resize", fix); fix();
    const letters = cells;
    const show = () => {
      const ok = letters.filter((c) => !c.lost).length / letters.length;
      const p = Math.round(ok * 100);
      pctEl.textContent = p; bar.style.width = p + "%";
      mq.classList.toggle("is-low", p < 50);
    };
    const lose = (c) => { c.lost = true; c.el.classList.add("lost"); c.el.textContent = GLYPHS[Math.random() * GLYPHS.length | 0]; };
    const restore = (c, delay) => setTimeout(() => {
      let n = 0;
      const spin = () => {
        if (n++ < 6) { c.el.textContent = GLYPHS[Math.random() * GLYPHS.length | 0]; setTimeout(spin, 40); return; }
        c.el.textContent = c.ch; c.el.classList.remove("lost"); c.lost = false; show();
      };
      spin();
    }, delay);
    let watching = false, last = 0;
    const remember = () => { letters.filter((c) => c.lost).forEach((c, i) => restore(c, i * 25)); };
    mq.addEventListener("pointerenter", () => { watching = true; remember(); });
    mq.addEventListener("pointerleave", () => { watching = false; last = performance.now(); });
    mq.addEventListener("click", remember);
    if (!reduced) {
      // Out of attention, a letter fades about every second, down to half of the phrase.
      setInterval(() => {
        if (watching || document.hidden || performance.now() - last < 4000) return;
        const alive = letters.filter((c) => !c.lost);
        if (alive.length > letters.length * 0.5) { lose(alive[Math.random() * alive.length | 0]); show(); }
      }, 950);
      // Scrolling the fragment into view brings it back, like recalling it.
      new IntersectionObserver(([e]) => { if (e.isIntersecting) { last = performance.now(); remember(); } }, { threshold: 0.6 }).observe(mq);
    }
    show();
  }

  /* ---------- Lightbox ---------- */
  const lb = $("#lightbox"), lbImg = $("img", lb), lbClose = $(".lightbox__close", lb);
  let opener = null;
  const open = (f) => {
    opener = f;
    lbImg.src = f.dataset.full;
    lbImg.alt = $("img", f)?.alt || "";
    lb.hidden = false;
    lbClose.focus();
  };
  // Pictures open with a click, Enter or Space; focus returns to the picture on close.
  $$(".shot[data-full]").forEach((f) => {
    f.tabIndex = 0;
    f.setAttribute("role", "button");
    f.setAttribute("aria-label", "Открыть крупно: " + ($("img", f)?.alt || "изображение"));
    f.addEventListener("click", () => open(f));
    f.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(f); } });
  });
  const close = () => { lb.hidden = true; lbImg.removeAttribute("src"); opener?.focus(); opener = null; };
  lb.addEventListener("click", close);
  addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    // The close button is the only control inside, so Tab stays on it.
    if (e.key === "Tab") { e.preventDefault(); lbClose.focus(); }
  });

  // Only one video plays at a time.
  // Looping background clips (autoplay) are left alone.
  const players = $$("video:not([autoplay])");
  players.forEach((v) => v.addEventListener("play", () => players.forEach((o) => o !== v && o.pause())));
})();
