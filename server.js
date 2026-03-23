/*
  ╔══════════════════════════════════════════════════════════════╗
  ║  TASKFLOW — SERVIDOR LOCAL v2                                ║
  ║  Node.js + Express + Socket.io                               ║
  ║                                                              ║
  ║  COMO RODAR:                                                 ║
  ║  1. npm install                                              ║
  ║  2. node server.js                                           ║
  ║  3. Acesse http://SEU_IP:3000 em qualquer máquina da rede    ║
  ╚══════════════════════════════════════════════════════════════╝
*/

const express    = require("express");
const http       = require("http");
const { Server } = require("socket.io");
const path       = require("path");
const fs         = require("fs");

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: "*", methods: ["GET","POST"] }
});

const PORT        = 3000;
const TASKS_FILE  = path.join(__dirname, "tasks.json");
const USERS_FILE  = path.join(__dirname, "users.json");

const AVATAR_COLORS = [
  "#1A4E8A","#276645","#7B3494","#9A5B1E",
  "#B03060","#1A7A6E","#5A3E8A","#7A4E1A",
  "#2E6B9E","#8A2E2E","#4A7A2E","#6E2E7A",
];

/* ── Usuários ── */
function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE))
      return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  } catch(e) { console.error("Erro ao carregar users.json:", e.message); }
  return [
    {id:"u1",name:"Ana Beatriz",  email:"ana@corp.com",      role:"admin", title:"Gerente de Projetos",av:"AB",clr:"#1A4E8A"},
    {id:"u2",name:"Carlos Mendes",email:"carlos@corp.com",   role:"collab",title:"Dev Sênior",          av:"CM",clr:"#276645"},
    {id:"u3",name:"Fernanda Lima",email:"fernanda@corp.com", role:"collab",title:"Designer UX",         av:"FL",clr:"#7B3494"},
    {id:"u4",name:"Rafael Torres",email:"rafael@corp.com",   role:"collab",title:"Analista de Dados",   av:"RT",clr:"#9A5B1E"},
  ];
}
function saveUsers() {
  try { fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8"); }
  catch(e) { console.error("Erro ao salvar users.json:", e.message); }
}

/* ── Tarefas ── */
function loadTasks() {
  try {
    if (fs.existsSync(TASKS_FILE))
      return JSON.parse(fs.readFileSync(TASKS_FILE, "utf8"));
  } catch(e) { console.error("Erro ao carregar tasks.json:", e.message); }
  const NOW = Date.now();
  return [
    {id:"t1",title:"Migração do banco para PostgreSQL",desc:"Planejar e executar migração completa do MySQL para PostgreSQL.",priority:"high",status:"pending",assignee:"u2",creator:"u1",due:"2026-03-28",tags:["infra","backend"],comments:[],history:[{a:"criada",u:"u1",ts:NOW-86400000}]},
    {id:"t2",title:"Redesign do dashboard de relatórios",desc:"Atualizar componentes visuais seguindo o novo design system.",priority:"medium",status:"in_progress",assignee:"u3",creator:"u1",due:"2026-04-05",tags:["design","frontend"],comments:[],history:[{a:"criada",u:"u1",ts:NOW-172800000}]},
    {id:"t3",title:"Documentar API de autenticação",desc:"Criar documentação OpenAPI 3.0 para todos os endpoints.",priority:"low",status:"done",assignee:"u2",creator:"u2",due:"2026-03-20",tags:["docs","backend"],comments:[],history:[{a:"criada",u:"u2",ts:NOW-259200000},{a:"concluída",u:"u2",ts:NOW-3600000}]},
    {id:"t4",title:"Análise de métricas Q1 2026",desc:"Consolidar KPIs e preparar deck executivo para a diretoria.",priority:"high",status:"pending",assignee:"u4",creator:"u1",due:"2026-03-31",tags:["dados","relatório"],comments:[],history:[{a:"criada",u:"u1",ts:NOW-43200000}]},
    {id:"t5",title:"Setup do ambiente de staging",desc:"Configurar staging espelhando produção.",priority:"medium",status:"in_progress",assignee:"u2",creator:"u2",due:"2026-04-10",tags:["infra","devops"],comments:[],history:[{a:"criada",u:"u2",ts:NOW-108000000}]},
  ];
}
function saveTasks() {
  try { fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), "utf8"); }
  catch(e) { console.error("Erro ao salvar tasks.json:", e.message); }
}

/* ── Estado em memória ── */
let users = loadUsers();
let tasks = loadTasks();
const connectedUsers = new Map(); // socketId → {socketId,userId,userName,userTitle}
const editingTasks   = new Map(); // taskId   → {userId, userName}

/* ── HTTP ── */
app.use(express.static(__dirname));
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

/* ── Helpers ── */
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

function isAdmin(socketId) {
  const conn = getConnectedUser(socketId);
  if (!conn) return false;
  return users.find(u => u.id === conn.userId)?.role === "admin";
}

/* ── Eventos Socket.io ── */
io.on("connection", (socket) => {
  console.log(`[+] ${socket.id}`);

  // JOIN — usuário entra após login
  socket.on("join", (data) => {
    connectedUsers.set(socket.id, {
      socketId: socket.id, userId: data.userId,
      userName: data.userName, userTitle: data.userTitle,
    });
    console.log(`[LOGIN] ${data.userName}`);
    socket.emit("init", { tasks, users, online: getOnlineList(), editing: getEditingMap() });
    socket.broadcast.emit("user_joined", { userId: data.userId, userName: data.userName, userTitle: data.userTitle });
    io.emit("online_update", getOnlineList());
  });

  // TASK CRUD
  socket.on("task_create", (task) => {
    tasks.unshift(task); saveTasks();
    socket.broadcast.emit("task_created", task);
    console.log(`[TASK+] "${task.title}"`);
  });

  socket.on("task_update", ({ id, patch, histEntry }) => {
    const idx = tasks.findIndex(t => t.id === id); if (idx < 0) return;
    tasks[idx] = histEntry
      ? { ...tasks[idx], ...patch, history: [...(tasks[idx].history||[]), histEntry] }
      : { ...tasks[idx], ...patch };
    saveTasks();
    socket.broadcast.emit("task_updated", { id, patch, histEntry });
  });

  socket.on("task_delete", (taskId) => {
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

  // USER_CREATE — admin cria novo funcionário
  socket.on("user_create", (data, cb) => {
    if (!isAdmin(socket.id)) return cb?.({ error: "Sem permissão de administrador" });
    if (!data.name?.trim())  return cb?.({ error: "Nome é obrigatório" });
    if (!data.email?.trim()) return cb?.({ error: "Email é obrigatório" });
    if (users.find(u => u.email.toLowerCase() === data.email.trim().toLowerCase()))
      return cb?.({ error: "Este email já está cadastrado" });

    const newUser = {
      id:    nextUserId(),
      name:  data.name.trim(),
      email: data.email.trim().toLowerCase(),
      role:  data.role === "admin" ? "admin" : "collab",
      title: (data.title||"").trim() || "Colaborador",
      av:    data.av ? data.av.toUpperCase().slice(0,2) : makeInitials(data.name),
      clr:   data.clr || pickColor(),
    };
    users.push(newUser); saveUsers();
    io.emit("user_created", newUser);
    console.log(`[USER+] ${newUser.name} (${newUser.email})`);
    cb?.({ ok: true, user: newUser });
  });

  // USER_UPDATE — admin edita dados de um funcionário
  socket.on("user_update", (data, cb) => {
    if (!isAdmin(socket.id)) return cb?.({ error: "Sem permissão de administrador" });
    const idx = users.findIndex(u => u.id === data.id);
    if (idx < 0) return cb?.({ error: "Usuário não encontrado" });
    if (data.patch.email) {
      const conflict = users.find(u => u.id !== data.id && u.email.toLowerCase() === data.patch.email.toLowerCase());
      if (conflict) return cb?.({ error: "Este email já está em uso" });
    }
    // Garante ao menos 1 admin
    if (data.patch.role === "collab" && users[idx].role === "admin") {
      const adminCount = users.filter(u => u.role === "admin").length;
      if (adminCount <= 1) return cb?.({ error: "Deve existir ao menos um administrador" });
    }
    users[idx] = { ...users[idx], ...data.patch };
    saveUsers();
    io.emit("user_updated", { id: data.id, patch: data.patch });
    console.log(`[USER~] ${users[idx].name}`);
    cb?.({ ok: true, user: users[idx] });
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

  // DISCONNECT
  socket.on("disconnect", () => {
    const u = getConnectedUser(socket.id);
    if (u) {
      console.log(`[-] ${u.userName}`);
      for (const [tid, ed] of editingTasks.entries())
        if (ed.userId === u.userId) editingTasks.delete(tid);
      connectedUsers.delete(socket.id);
      io.emit("user_left",      { userId: u.userId });
      io.emit("online_update",  getOnlineList());
      io.emit("editing_update", getEditingMap());
    }
  });
});

/* ── Start ── */
server.listen(PORT, "0.0.0.0", () => {
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║   TaskFlow Server — RODANDO            ║");
  console.log(`║   http://localhost:${PORT}                 ║`);
  console.log("║   Compartilhe: http://SEU_IP:" + PORT + "     ║");
  console.log("║   Windows IP: ipconfig                 ║");
  console.log("║   Mac/Linux:  ifconfig                 ║");
  console.log("╚════════════════════════════════════════╝\n");
});
