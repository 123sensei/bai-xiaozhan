const authSetup = document.getElementById("authSetup");
const authPanel = document.getElementById("authPanel");
const accountPanel = document.getElementById("accountPanel");
const authForm = document.getElementById("authForm");
const authTabs = document.getElementById("authTabs");
const authTitle = document.getElementById("authTitle");
const authBadge = document.getElementById("authBadge");
const authSubmit = document.getElementById("authSubmit");
const authMsg = document.getElementById("authMsg");
const nickRow = document.getElementById("nickRow");
const authNick = document.getElementById("authNick");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const accountName = document.getElementById("accountName");
const accountEmail = document.getElementById("accountEmail");
const accountAvatar = document.getElementById("accountAvatar");
const accountStatus = document.getElementById("accountStatus");
const accountBan = document.getElementById("accountBan");
const signOutBtn = document.getElementById("signOutBtn");
const passwordToggle = document.getElementById("passwordToggle");
const passwordForm = document.getElementById("passwordForm");
const newPassword = document.getElementById("newPassword");
const newPassword2 = document.getElementById("newPassword2");
const passwordMsg = document.getElementById("passwordMsg");
const passwordSubmit = document.getElementById("passwordSubmit");

let authClient = null;
let mode = "signin";

function loadSupabase(callback) {
  if (window.supabase && window.supabase.createClient) {
    callback(window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY));
    return;
  }
  const script = document.createElement("script");
  script.src = "vendor/supabase.js";
  script.onload = function () {
    callback(window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY));
  };
  script.onerror = function () {
    callback(null);
  };
  document.head.appendChild(script);
}

function showMsg(text, ok) {
  authMsg.textContent = text;
  authMsg.classList.toggle("ok", ok === true);
  authMsg.hidden = false;
}

function mapError(message) {
  if (/Invalid login credentials/i.test(message)) {
    return "邮箱或密码不对。";
  }
  if (/Email not confirmed/i.test(message)) {
    return "邮箱还没确认，先去收件箱点链接。";
  }
  if (/User already registered/i.test(message)) {
    return "这个邮箱已经注册过，直接登录就行。";
  }
  if (/Password should be at least/i.test(message)) {
    return "密码至少 6 位。";
  }
  if (/rate limit|too many/i.test(message)) {
    return "操作太频繁，等几分钟再试。";
  }
  return message;
}

function setMode(next) {
  mode = next;
  const isSignup = mode === "signup";
  authTitle.textContent = isSignup ? "注册" : "登录";
  authSubmit.textContent = isSignup ? "注册" : "登录";
  authBadge.textContent = isSignup ? "新账号" : "邮箱";
  nickRow.hidden = !isSignup;
  authPassword.setAttribute("autocomplete", isSignup ? "new-password" : "current-password");
  authTabs.querySelectorAll("button").forEach(function (button) {
    button.classList.toggle("active", button.getAttribute("data-mode") === mode);
  });
  authMsg.hidden = true;
}

function renderAccount(session) {
  const user = session.user;
  const meta = user.user_metadata || {};
  const fallbackName = meta.nickname || (user.email || "").split("@")[0] || "小白";

  authPanel.hidden = true;
  accountPanel.hidden = false;
  accountEmail.textContent = user.email || "";
  accountName.textContent = fallbackName;
  accountAvatar.textContent = fallbackName.slice(0, 1);
  accountStatus.textContent = "正常";
  accountStatus.classList.remove("banned");
  accountBan.hidden = true;

  authClient.from("profiles").select("nickname, banned, ban_reason").eq("id", user.id).single().then(function (result) {
    const profile = result.data;
    if (!profile) {
      return;
    }
    if (profile.nickname) {
      accountName.textContent = profile.nickname;
      accountAvatar.textContent = profile.nickname.slice(0, 1);
    }
    if (profile.banned) {
      accountStatus.textContent = "已封禁";
      accountStatus.classList.add("banned");
      accountBan.hidden = false;
      accountBan.textContent = "账号已被封禁，站内功能停用。" +
        (profile.ban_reason ? "原因：" + profile.ban_reason + "。" : "") +
        " 申诉发邮件到 3989685170@qq.com。";
    }
  });
}

authTabs.addEventListener("click", function (event) {
  const button = event.target.closest("button[data-mode]");
  if (button) {
    setMode(button.getAttribute("data-mode"));
  }
});

authForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const email = authEmail.value.trim();
  const password = authPassword.value;
  const nickname = authNick.value.trim();

  authMsg.hidden = true;
  authSubmit.disabled = true;
  const done = function () {
    authSubmit.disabled = false;
  };

  if (mode === "signup") {
    authClient.auth.signUp({
      email: email,
      password: password,
      options: { data: { nickname: nickname } }
    }).then(function (result) {
      done();
      if (result.error) {
        showMsg(mapError(result.error.message));
        return;
      }
      if (result.data.session) {
        renderAccount(result.data.session);
        return;
      }
      showMsg("注册成功，去邮箱点确认链接（可能在垃圾箱），然后回来登录。", true);
    });
    return;
  }

  authClient.auth.signInWithPassword({ email: email, password: password }).then(function (result) {
    done();
    if (result.error) {
      showMsg(mapError(result.error.message));
      return;
    }
    renderAccount(result.data.session);
  });
});

passwordToggle.addEventListener("click", function () {
  passwordForm.hidden = !passwordForm.hidden;
  if (!passwordForm.hidden) {
    newPassword.focus();
  }
});

passwordForm.addEventListener("submit", function (event) {
  event.preventDefault();
  passwordMsg.hidden = true;
  passwordMsg.classList.remove("ok");

  const next = newPassword.value;
  const again = newPassword2.value;

  if (next.length < 6) {
    passwordMsg.textContent = "密码至少 6 位。";
    passwordMsg.hidden = false;
    return;
  }
  if (next !== again) {
    passwordMsg.textContent = "两次输入的密码不一致。";
    passwordMsg.hidden = false;
    return;
  }

  passwordSubmit.disabled = true;
  authClient.auth.updateUser({ password: next }).then(function (result) {
    passwordSubmit.disabled = false;
    if (result.error) {
      passwordMsg.textContent = mapError(result.error.message);
      passwordMsg.hidden = false;
      return;
    }
    newPassword.value = "";
    newPassword2.value = "";
    passwordMsg.textContent = "密码已更新，下次用新密码登录。";
    passwordMsg.classList.add("ok");
    passwordMsg.hidden = false;
  });
});

signOutBtn.addEventListener("click", function () {
  authClient.auth.signOut().then(function () {
    accountPanel.hidden = true;
    authPanel.hidden = false;
    passwordForm.hidden = true;
    newPassword.value = "";
    newPassword2.value = "";
    setMode("signin");
  });
});

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  authSetup.hidden = false;
  authPanel.hidden = true;
} else {
  loadSupabase(function (client) {
    authClient = client;
    if (!client) {
      authSetup.hidden = false;
      authSetup.querySelector("strong").textContent = "Supabase 脚本没加载出来";
      return;
    }
    client.auth.getSession().then(function (result) {
      const session = result.data.session;
      if (session) {
        renderAccount(session);
      } else {
        authPanel.hidden = false;
      }
    });
  });
}
