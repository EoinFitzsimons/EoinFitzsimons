// ===== Constants & Utilities =====
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function lockScroll(on) {
  document.body.classList.toggle("body-lock", !!on);
}

function live(msg) {
  const region = $("#liveRegion");
  if (region) {
    region.textContent = "";
    setTimeout(() => {
      region.textContent = msg;
    }, 30);
  }
}

// Focus trap helpers
function tabbables(root) {
  return $$(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    root
  ).filter(
    (el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden")
  );
}
function trapFocus(container) {
  const els = tabbables(container);
  if (!els.length) return () => {};
  const first = els[0],
    last = els.at(-1);
  function onKey(e) {
    if (e.key !== "Tab") return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
  container.addEventListener("keydown", onKey);
  return () => container.removeEventListener("keydown", onKey);
}

// ===== Theme Toggle =====
(function () {
  const root = document.documentElement;
  const btn = $("#themeToggle");
  if (!btn) return;
  let light = root.classList.contains("theme-light");
  btn.addEventListener("click", () => {
    light = !light;
    root.classList.toggle("theme-light", light);
    btn.title = light ? "Switch to dark" : "Switch to light";
  });
})();

// ===== Header actions =====
(function () {
  $("#printBtn")?.addEventListener("click", () => globalThis.print());
})();

// ===== Mobile menu =====
(function () {
  const burger = $("#hamburger");
  const links = $("#navLinks");
  if (!burger || !links) return;

  function closeMenu() {
    links.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    lockScroll(false);
    burger.focus();
  }

  burger.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    burger.setAttribute("aria-expanded", String(open));
    lockScroll(open);
  });

  document.addEventListener("click", (e) => {
    if (!links.classList.contains("open")) return;
    if (e.target.closest("#navLinks, #hamburger")) return; // inside
    closeMenu();
  });
  links.addEventListener("click", (e) => {
    if (e.target.closest("a")) closeMenu();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && links.classList.contains("open")) closeMenu();
  });
})();

// ===== Tabbed views (hash-routed) =====
(function () {
  const views = $$(".view[data-view]");
  const links = $$('#navLinks a[href^="#"]');
  const main = $("#main");
  if (!views.length) return;
  const names = new Set(views.map((v) => v.dataset.view));
  const aliases = {
    top: "home",
    about: "home",
    skills: "home",
    github: "projects",
    academic: "education",
  };
  const baseTitle = document.title;
  let current = null;
  function resolve(hash) {
    const raw = (hash || "").replace(/^#/, "");
    if (names.has(raw)) return raw;
    if (raw === "main" && current) return current; // skip link: stay on the current view
    return aliases[raw] || "home";
  }
  function show(name, { focus = false } = {}) {
    current = name;
    for (const v of views) v.hidden = v.dataset.view !== name;
    for (const a of links) {
      if (a.getAttribute("href") === `#${name}`) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    }
    const label = $(`#navLinks a[href="#${name}"]`)?.textContent.trim();
    document.title = name === "home" || !label ? baseTitle : `${label} | Eoin Fitzsimons`;
    globalThis.scrollTo({ top: 0, behavior: "auto" });
    if (focus && main) main.focus({ preventScroll: true });
  }
  globalThis.addEventListener("hashchange", () => show(resolve(location.hash), { focus: true }));
  for (const a of links) {
    a.addEventListener("click", (e) => {
      if (resolve(a.getAttribute("href")) !== current) return;
      e.preventDefault(); // already active: hashchange will not fire, so scroll back to the top
      show(current, { focus: true });
    });
  }
  show(resolve(location.hash));
})();

// ===== Copy helpers =====
(function () {
  function copy(val) {
    navigator.clipboard?.writeText(val).then(() => live("Copied to clipboard"));
  }
  $("#copyEmail")?.addEventListener("click", () =>
    copy("Eoin00Fitzsimons@gmail.com")
  );
  $("#copyEmail2")?.addEventListener("click", () =>
    copy("Eoin00Fitzsimons@gmail.com")
  );
  $("#year").textContent = new Date().getFullYear();
})();

// ===== Games: data + cards + modal =====
(function () {
  const ghUser = "EoinFitzsimons";
  const games = [
    {
      title: "Eoin's Building Game",
      repo: "Eoin-s-Building-Game",
      tech: ["JavaScript", "Three.js", "Web Audio"],
      blurb:
        "Voxel sandbox with procedural hills and forests, eighteen block types, a day/night cycle, blueprint building and save/load.",
    },
    {
      title: "Eoin's Football Game",
      repo: "Eoin-s-Football-Game",
      tech: ["JavaScript", "Canvas", "Web Audio"],
      blurb:
        "Football management game with a playable top-down canvas match: run the club, then step onto the pitch for the big games.",
    },
    {
      title: "Eoin's Text Game — Verge City",
      repo: "Eoin-s-Text-Game",
      tech: ["JavaScript", "Canvas", "Web Audio"],
      blurb:
        "One-night cyberpunk text adventure: twelve districts, stat and item-gated choices, a canvas map and eight endings.",
    },
    {
      title: "Eoin's Racing Game",
      repo: "Eoin-s-Racing-Game",
      tech: ["JavaScript", "Canvas"],
      blurb:
        "Top-down Formula 1 style racing: 16 teams, a 15-car field, weather, time trials and recorded engine audio.",
    },
    {
      title: "Rith Dearg",
      repo: "Rith-Dearg",
      tech: ["JavaScript", "Canvas", "Web Audio"],
      blurb:
        "Run, leap and tail-swipe a red squirrel across 25 Irish landscapes in a hand-coded canvas platformer with synthesised sound.",
    },
  ];

  const gamesGrid = $("#gamesGrid");
  function pagesUrl(repo) {
    return `https://${ghUser.toLowerCase()}.github.io/${repo}/`;
  }
  function repoUrl(repo) {
    return `https://github.com/${ghUser}/${repo}`;
  }
  function previewUrl(repo) {
    return `https://htmlpreview.github.io/?https://github.com/${ghUser}/${repo}/blob/main/index.html`;
  }
  function chip(label) {
    const span = document.createElement("span");
    span.className = "chip";
    span.textContent = label;
    return span;
  }

  for (const g of games) {
    const card = document.createElement("article");
    card.className = "game";
    card.innerHTML = `
      <div class="stage" role="img" aria-label="Game preview background">
        <img class="game-thumb" src="${pagesUrl(g.repo)}thumbnail.png" alt="${
      g.title
    } thumbnail" loading="lazy" onerror="this.style.display='none'">
      </div>
      <div class="content">
        <h3 style="margin:0">${g.title}</h3>
        <p class="muted" style="margin:.2rem 0 .4rem">${g.blurb}</p>
        <div class="links">
          <button class="btn btn-accent play-btn" data-title="${
            g.title
          }" data-url="${pagesUrl(g.repo)}" data-fallback="${previewUrl(
      g.repo
    )}">Play Demo</button>
          <a class="btn" href="${pagesUrl(
            g.repo
          )}" target="_blank" rel="noopener noreferrer">Open Demo</a>
          <a class="btn btn-ghost" href="${repoUrl(
            g.repo
          )}" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      </div>`;
    const techRow = document.createElement("div");
    techRow.className = "meta";
    techRow.style.marginTop = ".4rem";
    for (const t of g.tech) {
      techRow.appendChild(chip(t));
    }
    card.querySelector(".content").appendChild(techRow);
    gamesGrid.appendChild(card);
  }

  // Modal controls with focus trap & inert background
  const modal = $("#playModal");
  const frame = $("#gameFrame");
  const openNewTab = $("#openNewTab");
  const modalTitle = $("#modalTitle");
  const closeModal = $("#closeModal");
  const main = $("#main");
  const header = document.querySelector("header");
  const footer = document.querySelector("footer");
  let releaseTrap = null,
    lastFocus = null;

  function setBackgroundInert(on) {
    for (const el of [main, header, footer]) {
      if (!el) continue;
      if (on) {
        el.setAttribute("aria-hidden", "true");
        el.inert = true;
      } else {
        el.removeAttribute("aria-hidden");
        try {
          el.inert = false;
        } catch (e) {
          console.error("Failed to set inert property:", e);
        }
      }
    }
  }

  function openModal(title, url, fallback) {
    lastFocus = document.activeElement;
    modalTitle.textContent = `${title} - Loading...`;
    frame.setAttribute("loading", "lazy");
    frame.removeAttribute("sandbox");
    frame.setAttribute("referrerpolicy", "no-referrer");
    frame.src = url;
    openNewTab.href = url;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    setBackgroundInert(true);
    lockScroll(true);
    releaseTrap = trapFocus(modal);
    closeModal.focus();

    // Show loading indicator
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "game-loading";
    loadingDiv.textContent = "Loading game...";
    loadingDiv.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: var(--text);
      font-size: 1.2rem;
      z-index: 1;
    `;
    $("#modalTitle").parentElement.parentElement.appendChild(loadingDiv);

    frame.addEventListener("load", () => {
      modalTitle.textContent = title;
      const loader = $(".game-loading");
      if (loader) loader.remove();
    }, { once: true });

    frame.addEventListener("error", () => {
      modalTitle.textContent = `${title} - Error loading, trying fallback...`;
      frame.src = fallback;
      openNewTab.href = fallback;
    }, { once: true });

    setTimeout(() => {
      try {
        if (!frame.contentWindow) {
          frame.src = fallback;
          openNewTab.href = fallback;
          modalTitle.textContent = `${title} - Using fallback`;
        }
      } catch (e) {
        console.warn(
          "Could not access frame.contentWindow, possibly due to cross-origin restrictions:",
          e
        );
      }
    }, 3500);
  }

  function hideModal() {
    frame.src = "about:blank";
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    setBackgroundInert(false);
    lockScroll(false);
    if (releaseTrap) releaseTrap();
    if (lastFocus) lastFocus.focus();
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".play-btn");
    if (btn) {
      const { title, url, fallback } = btn.dataset;
      if (globalThis.matchMedia("(max-width: 860px)").matches) {
        globalThis.open(url, "_blank", "noopener");
      } else {
        openModal(title, url, fallback);
      }
    }
    if (e.target === modal || e.target === closeModal) {
      hideModal();
    }
  });
  document.addEventListener("keydown", (e) => {
    // Prevent arrow keys from scrolling the main window when the modal is open
    if (modal.classList.contains("open")) {
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          " ",
          "Spacebar",
        ].includes(e.key)
      ) {
        e.preventDefault();
      }
      if (e.key === "Escape") hideModal();
    }
    // ...existing code for other keydown events if needed...
  });
})();

// ===== Live GitHub stats =====
(function () {
  const targets = $$("[data-gh]");
  if (!targets.length) return;
  const user = "EoinFitzsimons";
  fetch(`https://api.github.com/users/${user}`, {
    headers: { Accept: "application/vnd.github+json" },
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (!data) return;
      for (const el of targets) {
        const value = data[el.dataset.gh];
        if (typeof value === "number") el.textContent = value.toLocaleString();
      }
    })
    .catch(() => {});
})();

// ===== Live repository metadata for the GitHub snapshot =====
(function () {
  const cards = $$(".repo-card[data-repo]");
  if (!cards.length) return;
  fetch("https://api.github.com/users/EoinFitzsimons/repos?per_page=100&sort=pushed", {
    headers: { Accept: "application/vnd.github+json" },
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((repos) => {
      if (!Array.isArray(repos)) return;
      const byName = new Map(repos.map((r) => [r.name, r]));
      const fmt = new Intl.DateTimeFormat("en-IE", { month: "short", year: "numeric" });
      for (const card of cards) {
        const repo = byName.get(card.dataset.repo);
        const chip = card.querySelector(".repo-updated");
        if (!repo || !chip) continue;
        const parts = [`Updated ${fmt.format(new Date(repo.pushed_at))}`];
        if (repo.stargazers_count > 0) parts.push(`${repo.stargazers_count} ★`);
        chip.textContent = parts.join(" · ");
        chip.hidden = false;
      }
    })
    .catch(() => {});
})();
