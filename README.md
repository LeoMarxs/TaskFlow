# TaskFlow Corporate — Servidor Local

Sistema de gestão de tarefas com presença em tempo real para uso em rede local (Wi-Fi ou cabo).

---

## Pré-requisito

Instale o **Node.js** (versão LTS): https://nodejs.org

---

## Como rodar (apenas na máquina host)

```bash
# 1. Entre na pasta do projeto
cd taskflow-server

# 2. Instale as dependências (só precisa fazer uma vez)
npm install

# 3. Inicie o servidor
node server.js
```

O terminal vai mostrar algo assim:

```
╔════════════════════════════════════════╗
║   TaskFlow Server — RODANDO            ║
║   http://localhost:3000                ║
╚════════════════════════════════════════╝
```

---

## Como os outros acessam

1. Descubra o **IP da máquina que está rodando o servidor**:
   - **Windows**: abra o Prompt de Comando e digite `ipconfig` → procure "Endereço IPv4" (ex: 192.168.1.100)
   - **Mac/Linux**: abra o Terminal e digite `ifconfig` → procure "inet" (ex: 192.168.1.100)

2. Nos outros computadores, abra o navegador e acesse:
   ```
   http://192.168.1.100:3000
   ```
   (substitua pelo IP da sua máquina)

3. Todos que acessarem esse endereço estarão **conectados simultaneamente** e se verão online.

---

## Estrutura dos arquivos

```
taskflow-server/
├── server.js      → servidor Node.js (Express + Socket.io)
├── index.html     → interface do TaskFlow
├── package.json   → dependências do projeto
├── tasks.json     → tarefas salvas (criado automaticamente)
└── README.md      → este arquivo
```

---

## O que funciona em tempo real

- ✅ Presença — veja quem está online agora
- ✅ Indicador de edição — saiba quando alguém está editando uma tarefa
- ✅ Criação de tarefas — aparece instantaneamente para todos
- ✅ Edição de tarefas — atualizações refletem em tempo real
- ✅ Exclusão de tarefas — removida para todos simultaneamente
- ✅ Comentários — visíveis para todos ao ser postado
- ✅ Mudança de status (Kanban drag-and-drop) — sincronizada
- ✅ Persistência — tarefas salvas em tasks.json ao reiniciar o servidor

---

## Parando o servidor

Pressione `Ctrl + C` no terminal onde o servidor está rodando.

---

## Dúvidas comuns

**"Não consigo acessar pelo IP"**
→ Verifique se o firewall do Windows permite conexões na porta 3000.
→ No Windows: Painel de Controle → Windows Defender Firewall → Permitir app → adicione Node.js.

**"As tarefas summiram ao reiniciar"**
→ O arquivo `tasks.json` guarda tudo. Se ele foi apagado, os dados iniciais de demo são carregados.

**"Posso usar pela internet (não só na rede local)?"**
→ Para acesso remoto, você precisaria de um serviço como ngrok, Railway ou VPS. Me pergunte se quiser!
