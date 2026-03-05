

const USERS_KEY = "chahia_users_v1";
const SESSION_KEY = "chahia_session_v1";

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

// very light password check (demo)
function isValidPassword(pw) {
  return typeof pw === "string" && pw.length >= 6;
}

export const AuthStore = {
  getSession() {
    return loadSession();
  },

  signUp({ name, email, password }) {
    const users = loadUsers();
    const e = normalizeEmail(email);

    if (!name || name.trim().length < 2) {
      throw new Error("Name is required.");
    }
    if (!e.includes("@")) {
      throw new Error("Valid email is required.");
    }
    if (!isValidPassword(password)) {
      throw new Error("Password must be at least 6 characters.");
    }
    if (users.some((u) => u.email === e)) {
      throw new Error("This email is already registered.");
    }

    // NOTE: storing plain password is NOT secure. OK for demo/PFE local mode only.
    const user = { id: crypto.randomUUID(), name: name.trim(), email: e, password };
    users.push(user);
    saveUsers(users);

    return { id: user.id, name: user.name, email: user.email };
  },

  signIn({ email, password, remember }) {
    const users = loadUsers();
    const e = normalizeEmail(email);

    const user = users.find((u) => u.email === e && u.password === password);
    if (!user) throw new Error("Invalid email or password.");

    const session = {
      user: { id: user.id, name: user.name, email: user.email },
      // if remember = false, we still store session, but we can clear on tab close if you want later
      remember: !!remember,
      ts: Date.now(),
    };
    saveSession(session);
    return session.user;
  },

  signOut() {
    clearSession();
  },
};