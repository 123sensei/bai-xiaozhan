const progressBar = document.getElementById("progressBar");
const tocLinks = Array.from(document.querySelectorAll("#tocNav a"));
const chapters = tocLinks
  .map(function (link) {
    return document.querySelector(link.getAttribute("href"));
  })
  .filter(Boolean);

const READ_KEY = "xiaobai-site-read";
let readIds = [];
try {
  readIds = JSON.parse(localStorage.getItem(READ_KEY) || "[]");
} catch (error) {
  readIds = [];
}
const readSet = new Set(Array.isArray(readIds) ? readIds : []);

const drawerNav = document.getElementById("drawerNav");
const tocFab = document.getElementById("tocFab");
const drawer = document.getElementById("tocDrawer");
const drawerBackdrop = document.getElementById("drawerBackdrop");
const drawerClose = document.getElementById("drawerClose");

if (drawerNav) {
  tocLinks.forEach(function (link) {
    const item = document.createElement("a");
    item.href = link.getAttribute("href");
    item.textContent = link.textContent.trim();
    drawerNav.appendChild(item);
  });
}

function openDrawer() {
  if (!drawer || !drawerBackdrop) {
    return;
  }
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  drawerBackdrop.hidden = false;
  document.body.classList.add("drawer-open");
}

function closeDrawer() {
  if (!drawer || !drawerBackdrop) {
    return;
  }
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  drawerBackdrop.hidden = true;
  document.body.classList.remove("drawer-open");
}

if (tocFab) {
  tocFab.addEventListener("click", openDrawer);
}

if (drawerClose) {
  drawerClose.addEventListener("click", closeDrawer);
}

if (drawerBackdrop) {
  drawerBackdrop.addEventListener("click", closeDrawer);
}

if (drawerNav) {
  drawerNav.addEventListener("click", function (event) {
    if (event.target.tagName === "A") {
      closeDrawer();
    }
  });
}

const toTop = document.createElement("button");
toTop.className = "to-top";
toTop.type = "button";
toTop.setAttribute("aria-label", "回到顶部");
toTop.textContent = "↑";
document.body.appendChild(toTop);

function persistRead() {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify(Array.from(readSet)));
  } catch (error) {
    return;
  }
}

function applyRead() {
  tocLinks.forEach(function (link) {
    const id = link.getAttribute("href").slice(1);
    const done = readSet.has(id);
    link.classList.toggle("read", done);
    if (drawerNav) {
      const mirror = drawerNav.querySelector('a[href="#' + id + '"]');
      if (mirror) {
        mirror.classList.toggle("read", done);
      }
    }
  });
}

function updateProgress() {
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = docHeight > 0 ? window.scrollY / docHeight : 0;
  progressBar.style.width = Math.min(100, Math.max(0, ratio * 100)) + "%";
  toTop.classList.toggle("show", window.scrollY > 600);
}

function updateActive() {
  let current = chapters[0];
  const line = window.scrollY + 120;
  chapters.forEach(function (chapter) {
    if (chapter.offsetTop <= line) {
      current = chapter;
    }
  });

  let changed = false;
  chapters.forEach(function (chapter) {
    if (chapter.offsetTop + chapter.offsetHeight < line && !readSet.has(chapter.id)) {
      readSet.add(chapter.id);
      changed = true;
    }
  });
  if (changed) {
    persistRead();
  }
  applyRead();

  tocLinks.forEach(function (link) {
    link.classList.toggle("active", link.getAttribute("href") === "#" + current.id);
  });

  if (drawerNav) {
    drawerNav.querySelectorAll("a").forEach(function (item) {
      item.classList.toggle("active", item.getAttribute("href") === "#" + current.id);
    });
  }
}

let ticking = false;
function onScroll() {
  if (ticking) {
    return;
  }
  ticking = true;
  window.requestAnimationFrame(function () {
    updateProgress();
    updateActive();
    ticking = false;
  });
}

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);
applyRead();
updateProgress();
updateActive();

toTop.addEventListener("click", function () {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

document.querySelectorAll("[data-copy]").forEach(function (button) {
  button.addEventListener("click", function () {
    const block = button.closest(".code-block");
    const code = block ? block.querySelector("code") : null;
    if (!code) {
      return;
    }
    const text = code.innerText;
    const done = function () {
      const original = button.textContent;
      button.textContent = "已复制";
      setTimeout(function () {
        button.textContent = original;
      }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () {
        fallbackCopy(text, done);
      });
    } else {
      fallbackCopy(text, done);
    }
  });
});

function fallbackCopy(text, done) {
  const area = document.createElement("textarea");
  area.value = text;
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  try {
    document.execCommand("copy");
    done();
  } catch (error) {
    return;
  }
  document.body.removeChild(area);
}

function closeHints() {
  document.querySelectorAll(".hint-pop.open").forEach(function (pop) {
    pop.classList.remove("open");
  });
  document.querySelectorAll('.hint-btn[aria-expanded="true"]').forEach(function (btn) {
    btn.setAttribute("aria-expanded", "false");
  });
}

document.querySelectorAll(".hint-btn").forEach(function (btn) {
  btn.addEventListener("click", function (event) {
    event.stopPropagation();
    const pop = btn.nextElementSibling;
    if (!pop) {
      return;
    }
    const wasOpen = pop.classList.contains("open");
    closeHints();
    if (wasOpen) {
      return;
    }
    pop.classList.add("open");
    btn.setAttribute("aria-expanded", "true");
    const rect = btn.getBoundingClientRect();
    pop.classList.toggle("flip", rect.left + 300 > window.innerWidth - 16);
  });
});

document.addEventListener("click", function (event) {
  if (!event.target.closest(".hint")) {
    closeHints();
  }
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeHints();
    closeDrawer();
    hideSearch();
  }
});

const checkBoxes = Array.from(document.querySelectorAll("[data-check]"));
const checkProgress = document.getElementById("checkProgress");
const CHECK_KEY = "xiaobai-site-checklist";

function readChecklist() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(CHECK_KEY) || "{}");
  } catch (error) {
    saved = {};
  }
  checkBoxes.forEach(function (box, index) {
    box.checked = saved["c" + index] === true;
  });
}

function updateChecklist() {
  const done = checkBoxes.filter(function (box) {
    return box.checked;
  }).length;
  checkProgress.innerHTML = "已完成 <strong>" + done + "</strong> / " + checkBoxes.length;
  const saved = {};
  checkBoxes.forEach(function (box, index) {
    saved["c" + index] = box.checked;
  });
  try {
    localStorage.setItem(CHECK_KEY, JSON.stringify(saved));
  } catch (error) {
    return;
  }
}

if (checkBoxes.length > 0 && checkProgress) {
  readChecklist();
  updateChecklist();
  checkBoxes.forEach(function (box) {
    box.addEventListener("change", updateChecklist);
  });
}

document.querySelectorAll(".check-jump").forEach(function (link) {
  link.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) {
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    tocLinks.forEach(function (item) {
      item.classList.toggle("active", item.getAttribute("href") === link.getAttribute("href"));
    });
  });
});

const searchInput = document.getElementById("siteSearch");
const searchResults = document.getElementById("searchResults");
const searchIndex = Array.from(document.querySelectorAll(".chapter[id]"))
  .map(function (section) {
    const title = section.querySelector("h2");
    return {
      id: section.id,
      title: title ? title.textContent.trim() : "",
      text: section.innerText || ""
    };
  })
  .filter(function (item) {
    return item.id && item.title;
  });

function escapeHtml(text) {
  return text.replace(/[&<>"]/g, function (char) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char];
  });
}

function hideSearch() {
  if (searchResults) {
    searchResults.hidden = true;
  }
}

function runSearch() {
  if (!searchInput || !searchResults) {
    return;
  }
  const query = searchInput.value.trim().toLowerCase();
  if (!query) {
    searchResults.innerHTML = "";
    hideSearch();
    return;
  }

  const hits = [];
  searchIndex.forEach(function (item) {
    const lowerTitle = item.title.toLowerCase();
    const lowerText = item.text.toLowerCase();
    const inTitle = lowerTitle.indexOf(query) > -1;
    const position = lowerText.indexOf(query);
    if (!inTitle && position < 0) {
      return;
    }
    let snippet;
    if (position > -1) {
      const start = Math.max(0, position - 24);
      const end = Math.min(item.text.length, position + query.length + 42);
      snippet = (start > 0 ? "…" : "") + item.text.slice(start, end).replace(/\s+/g, " ").trim() + (end < item.text.length ? "…" : "");
    } else {
      snippet = item.text.slice(0, 48).replace(/\s+/g, " ").trim() + "…";
    }
    hits.push({ id: item.id, title: item.title, snippet: snippet, weight: inTitle ? 1 : 0 });
  });

  hits.sort(function (a, b) {
    return b.weight - a.weight;
  });

  if (hits.length === 0) {
    searchResults.innerHTML = '<li class="search-empty">没找到，换个词试试</li>';
  } else {
    searchResults.innerHTML = hits.slice(0, 6).map(function (hit) {
      return '<li><button type="button" data-target="#' + hit.id + '">' +
        '<span class="res-title">' + escapeHtml(hit.title) + "</span>" +
        '<span class="res-snippet">' + escapeHtml(hit.snippet) + "</span>" +
        "</button></li>";
    }).join("");
  }
  searchResults.hidden = false;
}

if (searchInput && searchResults) {
  searchInput.addEventListener("input", runSearch);

  searchInput.addEventListener("keydown", function (event) {
    if (event.key !== "Enter") {
      return;
    }
    const first = searchResults.querySelector("button[data-target]");
    if (first) {
      event.preventDefault();
      first.click();
    }
  });

  searchResults.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-target]");
    if (!button) {
      return;
    }
    const target = document.querySelector(button.getAttribute("data-target"));
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    hideSearch();
    searchInput.blur();
  });

  document.addEventListener("click", function (event) {
    if (!event.target.closest(".search")) {
      hideSearch();
    }
  });
}

const siteBanner = document.getElementById("siteBanner");
if (siteBanner && window.SITE_MAINTENANCE) {
  siteBanner.hidden = false;
}
