// ===== Constants & Utilities =====
const SHOW_Y = 140; // show sidebar after this scroll
const HIDE_Y = 40; // hide when back near the top

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

// ===== Sidebar visibility (hysteresis) =====
(function () {
  let visible = false,
    ticking = false;
  function apply(y) {
    if (!visible && y > SHOW_Y) {
      visible = true;
      document.body.classList.add("side-visible");
    } else if (visible && y < HIDE_Y) {
      visible = false;
      document.body.classList.remove("side-visible");
    }
  }
  function onScroll() {
    const y = window.scrollY || window.pageYOffset || 0;
    if (!ticking) {
      requestAnimationFrame(() => {
        apply(y);
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("load", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();
})();

// ===== Clone header links into sidebar + active section highlighting =====
(function () {
  const sideLinks = $("#sideLinks");
  const mainLinks = $("#navLinks");
  if (mainLinks && sideLinks) sideLinks.innerHTML = mainLinks.innerHTML;

  const sectionIds = $$("#main section[id]").map((s) => s.id);
  const allNavs = [mainLinks, sideLinks].filter(Boolean);
  const mapList = allNavs.map((nav) => {
    const m = {};
    if (!nav) return m;
    for (const a of $$('a[href^="#"]', nav)) {
      m[a.getAttribute("href").slice(1)] = a;
    }
    return m;
  });
  function mark(id) {
    for (const m of mapList) {
      if (!m) continue;
      for (const a of Object.values(m)) {
        a?.removeAttribute("aria-current");
      }
      const a = m[id];
      if (a) a.setAttribute("aria-current", "page");
    }
  }
  if ("IntersectionObserver" in globalThis) {
    const io = new IntersectionObserver(
      (entries) => {
        let mostVisible = null;
        let maxRatio = 0;
        for (const e of entries) {
          if (e.intersectionRatio > maxRatio) {
            maxRatio = e.intersectionRatio;
            mostVisible = e;
          }
        }
        if (mostVisible?.isIntersecting) mark(mostVisible.target.id);
      },
      {
        rootMargin: "-30% 0px -60% 0px",
        threshold: Array.from({ length: 21 }, (_, i) => i / 20),
      }
    );
    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
  }
})();

// ===== Copy helpers =====
(function () {
  function copy(val) {
    navigator.clipboard?.writeText(val).then(() => live("Copied to clipboard"));
  }
  $("#copyPhone")?.addEventListener("click", () => copy("+353894601090"));
  $("#copyEmail")?.addEventListener("click", () =>
    copy("Eoin00Fitzsimons@gmail.com")
  );
  $("#copyEmail2")?.addEventListener("click", () =>
    copy("Eoin00Fitzsimons@gmail.com")
  );
  $("#year").textContent = new Date().getFullYear();
})();

// ===== Animate skill bars on scroll =====
(function () {
  if ("IntersectionObserver" in globalThis) {
    const skillsSection = $("#skills");
    if (!skillsSection) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const skills = $$(".skill", skillsSection);
            for (const skill of skills) {
              skill.classList.add("animated");
            }
            observer.disconnect();
          }
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(skillsSection);
  }
})();

// ===== Scroll to top button =====
(function () {
  const scrollBtn = document.createElement("button");
  scrollBtn.className = "scroll-to-top";
  scrollBtn.setAttribute("aria-label", "Scroll to top");
  scrollBtn.innerHTML = "↑";
  scrollBtn.style.cssText = `
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), var(--accent-2));
    color: #0b0b12;
    border: none;
    font-size: 24px;
    font-weight: 700;
    cursor: pointer;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease, transform 0.2s ease;
    z-index: 999;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  `;

  document.body.appendChild(scrollBtn);

  function toggleScrollBtn() {
    const scrollY = globalThis.scrollY || globalThis.pageYOffset || 0;
    if (scrollY > 400) {
      scrollBtn.style.opacity = "1";
      scrollBtn.style.visibility = "visible";
    } else {
      scrollBtn.style.opacity = "0";
      scrollBtn.style.visibility = "hidden";
    }
  }

  scrollBtn.addEventListener("click", () => {
    globalThis.scrollTo({ top: 0, behavior: "smooth" });
  });

  scrollBtn.addEventListener("mouseenter", () => {
    scrollBtn.style.transform = "translateY(-4px)";
  });

  scrollBtn.addEventListener("mouseleave", () => {
    scrollBtn.style.transform = "translateY(0)";
  });

  globalThis.addEventListener("scroll", toggleScrollBtn, { passive: true });
  toggleScrollBtn();
})();

// ===== Games: data + cards + modal =====
(function () {
  const ghUser = "EoinFitzsimons";
  const games = [
    {
      title: "Eoin's Building Game",
      repo: "Eoin-s-Building-Game",
      tech: ["JavaScript"],
      blurb: "A browser-based building game made with JavaScript.",
    },
    {
      title: "Eoin's Football Game",
      repo: "Eoin-s-Football-Game",
      tech: ["HTML"],
      blurb: "Pick-up & play football mini‑game in the browser.",
    },
    {
      title: "Eoin's Text Game",
      repo: "Eoin-s-Text-Game",
      tech: ["JavaScript"],
      blurb: "Interactive text adventure built with JS.",
    },
    {
      title: "Eoin's Racing Game",
      repo: "Eoin-s-Racing-Game",
      tech: ["HTML"],
      blurb: "Arcade‑style racing game, runs entirely in the browser.",
    },
    {
      title: "Skyworks-Concourse",
      repo: "Skyworks-Concourse",
      tech: ["HTML"],
      blurb:
        "A browser‑playable, single‑file isometric game set in a retro‑futuristic cargo concourse suspended above the clouds. Explore modular buildings and corridors, complete multi‑type quests, dodge and discover.",
    },
    {
      title: "Rith-Dearg",
      repo: "Rith-Dearg",
      tech: ["HTML"],
      blurb: "A platforming game of a red squirrel in Ireland.",
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
