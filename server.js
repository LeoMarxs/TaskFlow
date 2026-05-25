/*
  ╔══════════════════════════════════════════════════════════════╗
  ║  TASKFLOW — SERVIDOR LOCAL v3                                ║
  ║  Node.js + Express + Socket.io + bcrypt (autenticação)       ║
  ║                                                              ║
  ║  COMO RODAR:                                                 ║
  ║  1. npm install                                              ║
  ║  2. node server.js                                           ║
  ║  3. Acesse http://SEU_IP:3000 em qualquer máquina da rede    ║
  ║                                                              ║
  ║  ADMIN PADRÃO (primeiro acesso):                             ║
  ║  Email: admin@corp.com  |  Senha: admin123                   ║
  ║  Troque a senha após o primeiro login!                       ║
  ╚══════════════════════════════════════════════════════════════╝
*/

const express    = require("express");
const http       = require("http");
const { Server } = require("socket.io");
const path       = require("path");
const fs         = require("fs");
const bcrypt     = require("bcrypt");
const crypto     = require("crypto");

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: "*", methods: ["GET","POST"] }
});

const PORT        = 3000;
const TASKS_FILE  = path.join(__dirname, "tasks.json");
const USERS_FILE  = path.join(__dirname, "users.json");
const BCRYPT_ROUNDS = 10;

const AVATAR_COLORS = [
  "#1A4E8A","#276645","#7B3494","#9A5B1E",
  "#B03060","#1A7A6E","#5A3E8A","#7A4E1A",
  "#2E6B9E","#8A2E2E","#4A7A2E","#6E2E7A",
];

/* ══════════════════════════════════════════════════════════════
   SESSÕES — token aleatório gerado no login, válido até logout
   ou reinício do servidor. Mapa: token → { userId, socketId }
══════════════════════════════════════════════════════════════ */
const sessions = new Map(); // token → { userId }

function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { userId });
  return token;
}

function getSessionUser(token) {
  if (!token) return null;
  const sess = sessions.get(token);
  if (!sess) return null;
  return users.find(u => u.id === sess.userId) || null;
}

function destroySession(token) {
  sessions.delete(token);
}

/* ══════════════════════════════════════════════════════════════
   USUÁRIOS
══════════════════════════════════════════════════════════════ */

// Hash pré-computado para "admin123" — senha padrão do admin inicial
const DEFAULT_ADMIN_HASH = "$2b$10$u9a6mjc8e1n3ZL2tNTS/4OPDTmoD.E/gHUYz/tP72HzL3vDND/u7a";

const DEFAULT_USERS = [
  {
    id: "u1",
    name: "Administrador",
    email: "admin@corp.com",
    role: "admin",
    title: "Administrador do Sistema",
    av: "AD",
    clr: "#1A4E8A",
    passwordHash: DEFAULT_ADMIN_HASH,
    mustChangePassword: true, // força troca na primeira entrada
  },
];

function loadUsers() {
  const loaded = loadFile(USERS_FILE);
  if (loaded && loaded.some(u => u.role === "admin" && u.passwordHash))
    return loaded;
  return DEFAULT_USERS;
}

function saveUsers() {
  atomicWrite(USERS_FILE, JSON.stringify(users, null, 2));
}

/* Retorna versão "pública" do usuário (sem passwordHash) para o cliente */
function publicUser(u) {
  const { passwordHash, ...pub } = u;
  return pub;
}
function publicUsers() { return users.map(publicUser); }

/* ══════════════════════════════════════════════════════════════
   TAREFAS
══════════════════════════════════════════════════════════════ */
function loadFile(filePath) {
  // 1. Tenta o arquivo principal
  try {
    if (fs.existsSync(filePath))
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch(e) {
    console.error(`Erro ao carregar ${path.basename(filePath)}:`, e.message);
  }
  // 2. Tenta o .tmp (gravação interrompida por queda de energia)
  const tmp = filePath + ".tmp";
  try {
    if (fs.existsSync(tmp)) {
      const data = JSON.parse(fs.readFileSync(tmp, "utf8"));
      console.warn(`[RECOVER] Recuperado de ${path.basename(tmp)}`);
      return data;
    }
  } catch(_) {}
  // 3. Tenta o backup mais recente
  try {
    const name = path.basename(filePath, ".json");
    if (fs.existsSync(BACKUP_DIR)) {
      const bkps = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith(name + "-")).sort();
      if (bkps.length > 0) {
        const latest = path.join(BACKUP_DIR, bkps[bkps.length - 1]);
        const data = JSON.parse(fs.readFileSync(latest, "utf8"));
        console.warn(`[RECOVER] Restaurado do backup: ${bkps[bkps.length - 1]}`);
        return data;
      }
    }
  } catch(_) {}
  return null;
}

function loadTasks() {
  return loadFile(TASKS_FILE) || [];
}
function saveTasks() {
  atomicWrite(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

/* ══════════════════════════════════════════════════════════════
   ESCRITA ATÔMICA E BACKUP AUTOMÁTICO
   
   atomicWrite: grava em arquivo .tmp e só substitui o original
   quando a escrita estiver 100% completa. Assim uma queda de
   energia no meio da gravação nunca corrompe o arquivo anterior
   — o pior caso é perder apenas a última alteração.

   Backup automático: a cada BACKUP_INTERVAL minutos, copia os
   arquivos para a pasta /backups com timestamp no nome. Os
   últimos BACKUP_MAX backups são mantidos; os mais antigos são
   removidos automaticamente.
══════════════════════════════════════════════════════════════ */
const BACKUP_DIR      = path.join(__dirname, "backups");
const BACKUP_INTERVAL = 30;   // minutos entre cada backup automático
const BACKUP_MAX      = 48;   // quantos backups manter (48 × 30min = 24h)

function atomicWrite(filePath, content) {
  const tmp = filePath + ".tmp";
  try {
    fs.writeFileSync(tmp, content, "utf8"); // grava no temporário
    fs.renameSync(tmp, filePath);           // substitui atomicamente
  } catch(e) {
    console.error(`Erro ao salvar ${path.basename(filePath)}:`, e.message);
    // tenta limpar o .tmp se existir
    try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch(_) {}
  }
}

function runBackup() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);
    const ts   = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const copy = (src, name) => {
      if (fs.existsSync(src))
        fs.copyFileSync(src, path.join(BACKUP_DIR, `${name}-${ts}.json`));
    };
    copy(TASKS_FILE, "tasks");
    copy(USERS_FILE, "users");

    // Remove backups antigos além do limite
    const files = fs.readdirSync(BACKUP_DIR).sort(); // ordem cronológica
    const taskBkps  = files.filter(f => f.startsWith("tasks-"));
    const usersBkps = files.filter(f => f.startsWith("users-"));
    [taskBkps, usersBkps].forEach(list => {
      while (list.length > BACKUP_MAX) {
        fs.unlinkSync(path.join(BACKUP_DIR, list.shift()));
      }
    });
    console.log(`[BACKUP] ${ts}`);
  } catch(e) {
    console.error("[BACKUP] Erro:", e.message);
  }
}

// Inicia o ciclo de backup automático
setInterval(runBackup, BACKUP_INTERVAL * 60 * 1000);

/* ══════════════════════════════════════════════════════════════
   ESTADO EM MEMÓRIA
══════════════════════════════════════════════════════════════ */
let users = loadUsers();
let tasks = loadTasks();
const connectedUsers = new Map(); // socketId → { socketId, userId, userName, userTitle, token }
const editingTasks   = new Map(); // taskId   → { userId, userName }

/* ══════════════════════════════════════════════════════════════
   HTTP
══════════════════════════════════════════════════════════════ */
app.use(express.static(__dirname));
app.use(express.json());

// Retorna lista pública de usuários (sem senha) para popular tela de login
app.get("/api/users", (req, res) => res.json(publicUsers()));

// Rota de login via HTTP — valida email+senha e devolve token
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: "Email e senha são obrigatórios" });

  const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user)
    return res.status(401).json({ error: "Email não encontrado" });

  if (!user.passwordHash)
    return res.status(401).json({ error: "Usuário sem senha cadastrada. Contate o administrador." });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok)
    return res.status(401).json({ error: "Senha incorreta" });

  const token = createSession(user.id);
  console.log(`[LOGIN] ${user.name} (${user.email})`);
  res.json({ ok: true, token, user: publicUser(user) });
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

/* ══════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════ */
function getConnectedUser(socketId) { return connectedUsers.get(socketId) || null; }

function getOnlineList() {
  const seen = new Set(), list = [];
  for (const u of connectedUsers.values()) {
    if (!seen.has(u.userId)) {
      seen.add(u.userId);
      list.push({ userId: u.userId, userName: u.userName, userTitle: u.userTitle });
    }
  }
  return list;
}

function getEditingMap() {
  const map = {};
  for (const [tid, d] of editingTasks.entries()) map[tid] = d;
  return map;
}

function makeInitials(name) {
  const p = name.trim().split(/\s+/);
  return p.length === 1 ? p[0].slice(0,2).toUpperCase() : (p[0][0]+p[p.length-1][0]).toUpperCase();
}

function pickColor() {
  const used = new Set(users.map(u => u.clr));
  return AVATAR_COLORS.find(c => !used.has(c)) || AVATAR_COLORS[Math.floor(Math.random()*AVATAR_COLORS.length)];
}

function nextUserId() {
  const nums = users.map(u => parseInt(u.id.replace("u",""),10)).filter(n => !isNaN(n));
  return "u" + (Math.max(0,...nums) + 1);
}

// Verifica se o socket autenticado pertence a um admin
function isAdmin(socketId) {
  const conn = getConnectedUser(socketId);
  if (!conn) return false;
  return users.find(u => u.id === conn.userId)?.role === "admin";
}

// Verifica token e retorna o usuário, ou null se inválido
function authSocket(socketId) {
  const conn = getConnectedUser(socketId);
  if (!conn) return null;
  return getSessionUser(conn.token);
}

/* ══════════════════════════════════════════════════════════════
   EVENTOS SOCKET.IO
══════════════════════════════════════════════════════════════ */
io.on("connection", (socket) => {
  console.log(`[socket+] ${socket.id}`);

  // JOIN — enviado pelo cliente após login bem-sucedido via HTTP
  // data: { userId, userName, userTitle, token }
  socket.on("join", (data) => {
    // Valida o token antes de aceitar a conexão
    const sessionUser = getSessionUser(data.token);
    if (!sessionUser || sessionUser.id !== data.userId) {
      socket.emit("auth_error", { error: "Sessão inválida. Faça login novamente." });
      return;
    }

    connectedUsers.set(socket.id, {
      socketId: socket.id,
      userId:   data.userId,
      userName: data.userName,
      userTitle: data.userTitle,
      token:    data.token,
    });

    socket.emit("init", {
      tasks,
      users: publicUsers(),
      online: getOnlineList(),
      editing: getEditingMap(),
    });
    socket.broadcast.emit("user_joined", {
      userId: data.userId, userName: data.userName, userTitle: data.userTitle,
    });
    io.emit("online_update", getOnlineList());
  });

  // TASK CRUD — requer sessão válida
  socket.on("task_create", (task) => {
    if (!authSocket(socket.id)) return;
    tasks.unshift(task); saveTasks();
    socket.broadcast.emit("task_created", task);
    console.log(`[TASK+] "${task.title}"`);
  });

  socket.on("task_update", ({ id, patch, histEntry }) => {
    if (!authSocket(socket.id)) return;
    const idx = tasks.findIndex(t => t.id === id); if (idx < 0) return;
    tasks[idx] = histEntry
      ? { ...tasks[idx], ...patch, history: [...(tasks[idx].history||[]), histEntry] }
      : { ...tasks[idx], ...patch };
    saveTasks();
    socket.broadcast.emit("task_updated", { id, patch, histEntry });
  });

  socket.on("task_delete", (taskId) => {
    if (!authSocket(socket.id)) return;
    const t = tasks.find(t => t.id === taskId);
    tasks = tasks.filter(t => t.id !== taskId); saveTasks();
    socket.broadcast.emit("task_deleted", taskId);
    console.log(`[TASK-] "${t?.title}"`);
  });

  // EDITING
  socket.on("editing_start", (taskId) => {
    const u = getConnectedUser(socket.id); if (!u) return;
    editingTasks.set(taskId, { userId: u.userId, userName: u.userName });
    io.emit("editing_update", getEditingMap());
  });

  socket.on("editing_stop", (taskId) => {
    editingTasks.delete(taskId);
    io.emit("editing_update", getEditingMap());
  });

  // USER_CREATE — admin cria novo funcionário com senha inicial
  socket.on("user_create", async (data, cb) => {
    if (!isAdmin(socket.id)) return cb?.({ error: "Sem permissão de administrador" });
    if (!data.name?.trim())     return cb?.({ error: "Nome é obrigatório" });
    if (!data.email?.trim())    return cb?.({ error: "Email é obrigatório" });
    if (!data.password?.trim()) return cb?.({ error: "Senha inicial é obrigatória" });
    if (data.password.length < 6) return cb?.({ error: "Senha deve ter ao menos 6 caracteres" });
    if (users.find(u => u.email.toLowerCase() === data.email.trim().toLowerCase()))
      return cb?.({ error: "Este email já está cadastrado" });

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    const newUser = {
      id:           nextUserId(),
      name:         data.name.trim(),
      email:        data.email.trim().toLowerCase(),
      role:         data.role === "admin" ? "admin" : "collab",
      title:        (data.title||"").trim() || "Colaborador",
      av:           data.av ? data.av.toUpperCase().slice(0,2) : makeInitials(data.name),
      clr:          data.clr || pickColor(),
      passwordHash,
      mustChangePassword: true, // usuário deve trocar no primeiro login
    };
    users.push(newUser); saveUsers();
    io.emit("user_created", publicUser(newUser));
    console.log(`[USER+] ${newUser.name} (${newUser.email})`);
    cb?.({ ok: true, user: publicUser(newUser) });
  });

  // USER_UPDATE — admin edita dados de um funcionário (sem senha)
  socket.on("user_update", (data, cb) => {
    if (!isAdmin(socket.id)) return cb?.({ error: "Sem permissão de administrador" });
    const idx = users.findIndex(u => u.id === data.id);
    if (idx < 0) return cb?.({ error: "Usuário não encontrado" });
    if (data.patch.email) {
      const conflict = users.find(u => u.id !== data.id && u.email.toLowerCase() === data.patch.email.toLowerCase());
      if (conflict) return cb?.({ error: "Este email já está em uso" });
    }
    if (data.patch.role === "collab" && users[idx].role === "admin") {
      const adminCount = users.filter(u => u.role === "admin").length;
      if (adminCount <= 1) return cb?.({ error: "Deve existir ao menos um administrador" });
    }
    // Nunca permite sobrescrever passwordHash por aqui
    const { passwordHash, ...safePatch } = data.patch;
    users[idx] = { ...users[idx], ...safePatch };
    saveUsers();
    io.emit("user_updated", { id: data.id, patch: safePatch });
    console.log(`[USER~] ${users[idx].name}`);
    cb?.({ ok: true, user: publicUser(users[idx]) });
  });

  // ADMIN_RESET_PASSWORD — admin redefine senha de outro usuário
  socket.on("admin_reset_password", async (data, cb) => {
    if (!isAdmin(socket.id)) return cb?.({ error: "Sem permissão de administrador" });
    const { userId, newPassword } = data || {};
    if (!newPassword || newPassword.length < 6)
      return cb?.({ error: "Nova senha deve ter ao menos 6 caracteres" });
    const idx = users.findIndex(u => u.id === userId);
    if (idx < 0) return cb?.({ error: "Usuário não encontrado" });
    users[idx].passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    users[idx].mustChangePassword = true;
    saveUsers();
    console.log(`[PASSWD-RESET] ${users[idx].name} por admin`);
    cb?.({ ok: true });
  });

  // CHANGE_PASSWORD — usuário troca a própria senha
  socket.on("change_password", async (data, cb) => {
    const conn = getConnectedUser(socket.id);
    if (!conn) return cb?.({ error: "Não autenticado" });
    const { currentPassword, newPassword } = data || {};
    if (!currentPassword || !newPassword)
      return cb?.({ error: "Preencha todos os campos" });
    if (newPassword.length < 6)
      return cb?.({ error: "Nova senha deve ter ao menos 6 caracteres" });
    if (currentPassword === newPassword)
      return cb?.({ error: "A nova senha deve ser diferente da atual" });

    const user = users.find(u => u.id === conn.userId);
    if (!user) return cb?.({ error: "Usuário não encontrado" });

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return cb?.({ error: "Senha atual incorreta" });

    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    user.mustChangePassword = false;
    saveUsers();
    console.log(`[PASSWD] ${user.name} trocou a senha`);
    cb?.({ ok: true });
  });

  // USER_DELETE — admin remove um funcionário
  socket.on("user_delete", (userId, cb) => {
    if (!isAdmin(socket.id)) return cb?.({ error: "Sem permissão de administrador" });
    const conn = getConnectedUser(socket.id);
    if (userId === conn?.userId) return cb?.({ error: "Você não pode excluir sua própria conta" });
    const target = users.find(u => u.id === userId);
    if (!target) return cb?.({ error: "Usuário não encontrado" });
    if (target.role === "admin" && users.filter(u => u.role === "admin").length <= 1)
      return cb?.({ error: "Deve existir ao menos um administrador" });

    users = users.filter(u => u.id !== userId); saveUsers();
    io.emit("user_deleted", userId);
    console.log(`[USER-] ${target.name}`);
    cb?.({ ok: true });
  });

  // LOGOUT — invalida o token da sessão
  socket.on("logout", () => {
    const conn = getConnectedUser(socket.id);
    if (conn?.token) destroySession(conn.token);
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    const u = getConnectedUser(socket.id);
    if (u) {
      console.log(`[socket-] ${u.userName}`);
      for (const [tid, ed] of editingTasks.entries())
        if (ed.userId === u.userId) editingTasks.delete(tid);
      connectedUsers.delete(socket.id);
      io.emit("user_left",      { userId: u.userId });
      io.emit("online_update",  getOnlineList());
      io.emit("editing_update", getEditingMap());
    }
  });
});

/* ══════════════════════════════════════════════════════════════
   START
══════════════════════════════════════════════════════════════ */

server.listen(PORT, "0.0.0.0", () => {
  console.log(`
████████╗ █████╗ ███████╗██╗  ██╗███████╗██╗      ██████╗ ██╗    ██╗
╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝██╔════╝██║     ██╔═══██╗██║    ██║
   ██║   ███████║███████╗█████╔╝ █████╗  ██║     ██║   ██║██║ █╗ ██║
   ██║   ██╔══██║╚════██║██╔═██╗ ██╔══╝  ██║     ██║   ██║██║███╗██║
   ██║   ██║  ██║███████║██║  ██╗██║     ███████╗╚██████╔╝╚███╔███╔╝
   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝ 
            ╔════════════════════════════════════════╗
            ║   TaskFlow Server v3 — ONLINE          ║
            ║   http://localhost:${PORT}                ║
            ║   Compartilhe: http://SEU_IP:${PORT}      ║
            ║   Windows IP: ipconfig                 ║
            ║   Mac/Linux:  ifconfig                 ║
            ╠════════════════════════════════════════╣
            ║   Admin padrão: admin@corp.com         ║
            ║   Senha padrão: admin123               ║
            ╚════════════════════════════════════════╝\n
  `);
});