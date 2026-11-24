const FEEDBACK_EMAIL = "3989685170@qq.com";

const GISCUS = {
  repo: "123sensei/xiaobai-site-discussions",
  repoId: "R_kgDOV496XA",
  category: "General",
  categoryId: "DIC_kwDOV496XM4DLzfE"
};

const BANNED_HINTS = ["加微信", "刷单", "代开发票", "博彩"];

const NICK_KEY = "xiaobai-nick";
const DRAFT_KEY = "xiaobai-feedback-draft";

const statusBar = document.getElementById("statusBar");
const statusText = document.getElementById("statusText");
const maintenanceCard = document.getElementById("maintenanceCard");
const loginForm = document.getElementById("loginForm");
const nickInput = document.getElementById("nickInput");
const userRow = document.getElementById("userRow");
const userName = document.getElementById("userName");
const avatar = document.getElementById("avatar");
const logoutBtn = document.getElementById("logoutBtn");
const fbName = document.getElementById("fbName");
const fbType = document.getElementById("fbType");
const fbBody = document.getElementById("fbBody");
const fbWarn = document.getElementById("fbWarn");
const fbEmail = document.getElementById("fbEmail");
const fbCount = document.getElementById("fbCount");
const fbNote = document.getElementById("fbNote");
const fbError = document.getElementById("fbError");
const banBanner = document.getElementById("banBanner");
const copyFeedback = document.getElementById("copyFeedback");
const clearDraft = document.getElementById("clearDraft");
const copyRules = document.getElementById("copyRules");
const appealBtn = document.getElementById("appealBtn");
const feedbackForm = document.getElementById("feedbackForm");
const giscusSetup = document.getElementById("giscusSetup");
const giscusContainer = document.getElementById("giscusContainer");
const copyGiscus = document.getElementById("copyGiscus");
const reportBtn = document.getElementById("reportBtn");

function getNick() {
  try {
    return localStorage.getItem(NICK_KEY) || "";
  } catch (error) {
    return "";
  }
}

function saveNick(value) {
  try {
    localStorage.setItem(NICK_KEY, value);
  } catch (error) {
    return;
  }
}

function clearNick() {
  try {
    localStorage.removeItem(NICK_KEY);
  } catch (error) {
    return;
  }
}

function renderAccount() {
  const nick = getNick();
  const oauthRow = document.querySelector(".oauth-row");
  if (nick) {
    loginForm.hidden = true;
    if (oauthRow) {
      oauthRow.hidden = true;
    }
    userRow.hidden = false;
    userName.textContent = nick;
    avatar.textContent = nick.slice(0, 1);
    if (!fbName.value) {
      fbName.value = nick;
    }
  } else {
    loginForm.hidden = false;
    if (oauthRow) {
      oauthRow.hidden = false;
    }
    userRow.hidden = true;
  }
}

loginForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const nick = nickInput.value.trim();
  if (!nick) {
    nickInput.focus();
    return;
  }
  saveNick(nick);
  nickInput.value = "";
  renderAccount();
});

logoutBtn.addEventListener("click", function () {
  clearNick();
  renderAccount();
});

function applyMaintenance() {
  if (!SITE_MAINTENANCE) {
    return;
  }
  document.body.classList.add("is-maintenance");
  statusBar.classList.add("maintenance");
  statusText.textContent = "系统维护中，讨论与反馈暂停";
  maintenanceCard.hidden = false;
}

function updateEmailLabel() {
  fbEmail.textContent = FEEDBACK_EMAIL || "未设置（在 community.js 顶部填写）";
}

function copyEmail() {
  if (!FEEDBACK_EMAIL) {
    return;
  }
  const done = function () {
    fbEmail.textContent = "已复制";
    setTimeout(function () {
      fbEmail.textContent = FEEDBACK_EMAIL;
    }, 1400);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(FEEDBACK_EMAIL).then(done).catch(function () {
      fallbackCopy(FEEDBACK_EMAIL, done);
    });
  } else {
    fallbackCopy(FEEDBACK_EMAIL, done);
  }
}

fbEmail.addEventListener("click", copyEmail);
fbEmail.addEventListener("keydown", function (event) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    copyEmail();
  }
});

function checkContent() {
  const value = fbBody.value;
  const hit = BANNED_HINTS.some(function (word) {
    return value.indexOf(word) > -1;
  });
  fbWarn.hidden = !hit;
}

fbBody.addEventListener("input", checkContent);

function openMail(subject, body) {
  const to = FEEDBACK_EMAIL ? encodeURIComponent(FEEDBACK_EMAIL) : "";
  window.location.href = "mailto:" + to +
    "?subject=" + encodeURIComponent(subject) +
    "&body=" + encodeURIComponent(body);
}

function updateCount() {
  fbCount.textContent = fbBody.value.length + " / 800";
}

function feedbackSubject() {
  const name = fbName.value.trim() || "匿名读者";
  return "[" + fbType.value + "] 来自 " + name + " 的反馈";
}

function feedbackContent() {
  const name = fbName.value.trim() || "匿名读者";
  return "类型：" + fbType.value + "\n署名：" + name + "\n\n" + fbBody.value.trim() + "\n\n（来自小白搭站说明书 · 社区与反馈）";
}

function saveDraft() {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      type: fbType.value,
      name: fbName.value,
      body: fbBody.value
    }));
  } catch (error) {
    return;
  }
}

function restoreDraft() {
  let draft = null;
  try {
    draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
  } catch (error) {
    draft = null;
  }
  if (!draft) {
    return;
  }
  if (draft.type) {
    fbType.value = draft.type;
  }
  if (draft.name) {
    fbName.value = draft.name;
  }
  if (draft.body) {
    fbBody.value = draft.body;
  }
  checkContent();
}

function onEdit() {
  saveDraft();
  updateCount();
  fbNote.hidden = true;
  fbError.hidden = true;
}

feedbackForm.addEventListener("input", onEdit);
feedbackForm.addEventListener("change", onEdit);

feedbackForm.addEventListener("submit", function (event) {
  event.preventDefault();
  if (!fbBody.value.trim()) {
    fbError.hidden = false;
    fbBody.focus();
    return;
  }
  openMail(feedbackSubject(), feedbackContent());
  fbNote.hidden = false;
});

copyFeedback.addEventListener("click", function () {
  if (!fbBody.value.trim()) {
    fbError.hidden = false;
    fbBody.focus();
    return;
  }
  const text = feedbackSubject() + "\n\n" + feedbackContent();
  const done = function () {
    const original = copyFeedback.textContent;
    copyFeedback.textContent = "已复制";
    setTimeout(function () {
      copyFeedback.textContent = original;
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

clearDraft.addEventListener("click", function () {
  if (!window.confirm("确定清空已保存的草稿？")) {
    return;
  }
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (error) {
    return;
  }
  fbType.value = "内容建议";
  fbName.value = getNick();
  fbBody.value = "";
  updateCount();
  checkContent();
  fbNote.hidden = true;
  fbError.hidden = true;
});

copyRules.addEventListener("click", function () {
  const rules = [
    "社区规则",
    "1. 不骂人、不人身攻击。",
    "2. 不发广告：拉群、加微信、刷单、代开发票一律删除。",
    "3. 不发违法和侵权内容，包括盗版资源、别人的隐私、身份证照片。",
    "4. 不刷屏、不无意义灌水。",
    "5. 提问前先搜索教程和常见问题。",
    "",
    "处理方式：提醒 → 禁言 → 封号。封号仅由作者本人解封。",
    "申诉邮箱：" + FEEDBACK_EMAIL
  ].join("\n");
  const done = function () {
    const original = copyRules.textContent;
    copyRules.textContent = "已复制";
    setTimeout(function () {
      copyRules.textContent = original;
    }, 1600);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(rules).then(done).catch(function () {
      fallbackCopy(rules, done);
    });
  } else {
    fallbackCopy(rules, done);
  }
});

appealBtn.addEventListener("click", function () {
  fbType.value = "其他";
  fbBody.value = "昵称：\n被处理的内容或账号：\n我认为处理有误，因为：";
  saveDraft();
  updateCount();
  fbError.hidden = true;
  fbNote.hidden = true;
  document.getElementById("feedback").scrollIntoView({ behavior: "smooth" });
  fbBody.focus();
});

reportBtn.addEventListener("click", function () {
  const text = "请把下面几项填全，发出去即可：\n\n1. 违规内容所在的页面链接或讨论区链接：\n2. 对方的昵称：\n3. 具体情况（一句话）：\n\n（不要转发截图里的隐私信息）";
  openMail("举报违规内容", text);
});

copyGiscus.addEventListener("click", function () {
  const template = 'repo: "你的用户名/仓库名",\n' +
    'repoId: "在 giscus.app 生成的 repoId",\n' +
    'category: "General",\n' +
    'categoryId: "在 giscus.app 生成的 categoryId"';
  const done = function () {
    const original = copyGiscus.textContent;
    copyGiscus.textContent = "已复制";
    setTimeout(function () {
      copyGiscus.textContent = original;
    }, 1600);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(template).then(done).catch(function () {
      fallbackCopy(template, done);
    });
  } else {
    fallbackCopy(template, done);
  }
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
    document.body.removeChild(area);
    return;
  }
  document.body.removeChild(area);
}

const communitySearch = document.getElementById("communitySearch");
const communityResults = document.getElementById("communityResults");
const communitySections = Array.from(document.querySelectorAll("main section[id]"))
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

function hideCommunitySearch() {
  if (communityResults) {
    communityResults.hidden = true;
  }
}

function runCommunitySearch() {
  if (!communitySearch || !communityResults) {
    return;
  }
  const query = communitySearch.value.trim().toLowerCase();
  if (!query) {
    communityResults.innerHTML = "";
    hideCommunitySearch();
    return;
  }

  const hits = [];
  communitySections.forEach(function (item) {
    const inTitle = item.title.toLowerCase().indexOf(query) > -1;
    const position = item.text.toLowerCase().indexOf(query);
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
    communityResults.innerHTML = '<li class="search-empty">没找到，换个词试试</li>';
  } else {
    communityResults.innerHTML = hits.slice(0, 6).map(function (hit) {
      return '<li><button type="button" data-target="#' + hit.id + '">' +
        '<span class="res-title">' + escapeHtml(hit.title) + "</span>" +
        '<span class="res-snippet">' + escapeHtml(hit.snippet) + "</span>" +
        "</button></li>";
    }).join("");
  }
  communityResults.hidden = false;
}

if (communitySearch && communityResults) {
  communitySearch.addEventListener("input", runCommunitySearch);

  communitySearch.addEventListener("keydown", function (event) {
    if (event.key !== "Enter") {
      return;
    }
    const first = communityResults.querySelector("button[data-target]");
    if (first) {
      event.preventDefault();
      first.click();
    }
  });

  communityResults.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-target]");
    if (!button) {
      return;
    }
    const target = document.querySelector(button.getAttribute("data-target"));
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    hideCommunitySearch();
    communitySearch.blur();
  });

  document.addEventListener("click", function (event) {
    if (!event.target.closest(".search")) {
      hideCommunitySearch();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      hideCommunitySearch();
    }
  });
}

function lockFeedbackForBan(profile) {
  banBanner.hidden = false;
  banBanner.textContent = "账号已被封禁，反馈功能停用。" +
    (profile.ban_reason ? "原因：" + profile.ban_reason + "。" : "") +
    " 申诉发邮件到 " + FEEDBACK_EMAIL + "。";
  feedbackForm.querySelectorAll("input, select, textarea, button").forEach(function (element) {
    element.disabled = true;
  });
  feedbackForm.classList.add("is-locked");
}

function initAccountGate() {
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    return;
  }
  const script = document.createElement("script");
  script.src = "vendor/supabase.js";
  script.onload = function () {
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    client.auth.getSession().then(function (result) {
      const session = result.data.session;
      if (!session) {
        return;
      }
      client.from("profiles").select("nickname, banned, ban_reason").eq("id", session.user.id).single().then(function (profileResult) {
        const profile = profileResult.data;
        if (!profile) {
          return;
        }
        if (!fbName.value.trim() && profile.nickname) {
          fbName.value = profile.nickname;
          saveDraft();
        }
        if (profile.banned) {
          lockFeedbackForBan(profile);
        }
      });
    });
  };
  document.head.appendChild(script);
}

function initGiscus() {
  if (SITE_MAINTENANCE) {
    return;
  }
  if (!GISCUS.repo || !GISCUS.repoId) {
    return;
  }
  giscusSetup.hidden = true;
  giscusContainer.hidden = false;
  const script = document.createElement("script");
  script.src = "https://giscus.app/client.js";
  script.async = true;
  script.crossOrigin = "anonymous";
  script.setAttribute("data-repo", GISCUS.repo);
  script.setAttribute("data-repo-id", GISCUS.repoId);
  script.setAttribute("data-category", GISCUS.category);
  script.setAttribute("data-category-id", GISCUS.categoryId);
  script.setAttribute("data-mapping", "pathname");
  script.setAttribute("data-strict", "0");
  script.setAttribute("data-reactions-enabled", "1");
  script.setAttribute("data-emit-metadata", "0");
  script.setAttribute("data-input-position", "top");
  script.setAttribute("data-theme", "light");
  script.setAttribute("data-lang", "zh-CN");
  script.setAttribute("data-loading", "lazy");
  giscusContainer.appendChild(script);
}

restoreDraft();
updateCount();
renderAccount();
updateEmailLabel();
applyMaintenance();
initGiscus();
initAccountGate();
