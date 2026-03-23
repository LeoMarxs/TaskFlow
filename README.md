# TaskFlow Corporate

> Sistema de gestão colaborativa de tarefas para equipes em rede local.

---

## O que é o TaskFlow?

O TaskFlow Corporate é uma aplicação web de gerenciamento de tarefas desenvolvida para equipes que trabalham no mesmo escritório ou rede local. Ele permite que todos os membros da equipe vejam, criem e atualizem tarefas em tempo real, além de visualizarem quem está online e o que cada pessoa está fazendo no momento.

O sistema foi construído do zero como um único arquivo HTML, sem frameworks pesados, e evoluiu para uma aplicação cliente-servidor completa com Node.js e Socket.io para suportar múltiplos usuários simultâneos.

---

## Como foi feito

### Tecnologias utilizadas

| Camada | Tecnologia | Função |
|---|---|---|
| Interface | HTML + CSS + JavaScript puro | Toda a UI sem frameworks |
| Servidor | Node.js + Express | Serve os arquivos e a API |
| Tempo real | Socket.io | Sincronização entre usuários |
| Fontes | Google Fonts | Playfair Display + IBM Plex Sans |
| Persistência | JSON no disco | tasks.json e users.json |

### Arquitetura

```
┌────────────────────────────────────────────┐
│             REDE LOCAL (Wi-Fi/Cabo)        │
│                                            │
│   Computador Host                          │
│   ┌─────────────────────┐                  │
│   │   node server.js    │                  │
│   │   porta 3000        │◄───────────────┐ |
│   │                     │                │ │
│   │  tasks.json  (BD)   │                │ │
│   │  users.json  (BD)   │                │ │
│   └─────────────────────┘                │ │
│             ▲                            │ │
│             │ Socket.io (tempo real)     │ │
│             ▼                            │ │
│   ┌──────────────┐  ┌──────────────┐     │ │
│   │ Computador A │  │ Computador B │─────┘ │
│   │ (navegador)  │  │ (navegador)  │       │
│   └──────────────┘  └──────────────┘       │
└────────────────────────────────────────────┘
```

### Funcionalidades

- **Dashboard** — visão geral com estatísticas, progresso da equipe, gráfico de tarefas por membro e atividade recente
- **Lista de tarefas** — todas as tarefas com filtros por prioridade, status e usuário, e ordenação por múltiplos campos
- **Minhas tarefas** — visão filtrada apenas para as tarefas do usuário logado
- **Kanban Board** — arrastar e soltar tarefas entre colunas (Pendente, Em Progresso, Concluída) com limite de WIP
- **Gestão de equipe** — adicionar, editar e remover funcionários (apenas administradores)
- **Presença em tempo real** — veja quem está online e quem está editando uma tarefa agora
- **Comentários com @menções** — mencione colegas nos comentários com autocomplete
- **Notificações** — alertas de novas tarefas, menções e mudanças
- **Tema claro/escuro** — alternável pelo botão na topbar ou pelo atalho Ctrl + Shift + D
- **Zoom** — controle de escala da interface para melhor legibilidade
- **Histórico** — cada tarefa registra todas as ações realizadas

---

## Pré-requisito

Instale o **Node.js LTS** no computador que vai ser o servidor:

https://nodejs.org

Apenas o computador host precisa do Node.js. Os demais acessam pelo navegador.

---

## Como rodar

### Primeira vez

**1.** Abra o **Prompt de Comando** (Win + R, digite cmd, Enter)

**2.** Navegue até a pasta do projeto:
```
cd C:\caminho\para\taskflow-server-v2
```

**3.** Instale as dependências:
```
npm install
```

**4.** Inicie o servidor:
```
node server.js
```

Você verá:
```
╔════════════════════════════════════════╗
║   TaskFlow Server — RODANDO            ║
║   http://localhost:3000                ║
╚════════════════════════════════════════╝
```

**5.** Acesse no navegador:
```
http://localhost:3000
```

### A partir da segunda vez

Só precisa dos passos **1**, **2** e **4**. O npm install não é necessário novamente.

---

## Como a equipe acessa

**1.** Descubra o IP do computador host. No cmd:
```
ipconfig
```
Procure **"Endereço IPv4"** — exemplo: `192.168.1.100`

**2.** Compartilhe o endereço com a equipe:
```
http://192.168.1.100:3000
```

**3.** Todos abrem esse endereço no navegador e fazem login com seu email.

> Todos os computadores precisam estar na mesma rede Wi-Fi ou cabo.

---

## Usuários e acesso

Na tela de login, o usuário digita seu **email corporativo**. Não há senha — o controle de acesso é feito pelo email cadastrado.

### Perfis de acesso

| Perfil | O que pode fazer |
|---|---|
| **Administrador** | Tudo — incluindo gerenciar a equipe, ver todas as tarefas e acessar relatórios |
| **Colaborador** | Criar tarefas, gerenciar suas próprias tarefas, comentar e usar o Kanban |

### Administrador padrão

```
Email: mayara@corp.com
```

---

## Gerenciamento de equipe

Apenas administradores têm acesso à aba **Equipe** na sidebar.

### Adicionar funcionário
1. Clique em **Equipe** na sidebar
2. Clique em **+ Adicionar funcionário**
3. Preencha nome, email, cargo e perfil de acesso
4. As iniciais do avatar são preenchidas automaticamente
5. Escolha uma cor para o avatar
6. Clique em **Adicionar funcionário**

O novo funcionário aparece instantaneamente para todos e já pode fazer login.

### Editar funcionário
1. Clique em **Equipe** na sidebar
2. Clique em **Editar** no card do funcionário
3. Altere os campos desejados
4. Clique em **Salvar alterações**

### Remover funcionário
1. Clique em **Equipe** na sidebar
2. Clique em **Remover** no card do funcionário
3. Confirme a remoção

> Se o funcionário removido estiver logado no momento, ele será desconectado automaticamente.

**Regras de segurança:**
- Não é possível remover a própria conta
- Deve existir sempre ao menos um administrador
- Emails duplicados são bloqueados

---

## Gerenciamento de tarefas

### Criar tarefa
- Clique em **+ Nova tarefa** na topbar ou sidebar
- Ou pressione a tecla **N** (fora de campos de texto)

### Campos de uma tarefa

| Campo | Descrição |
|---|---|
| Título | Nome curto e descritivo da tarefa |
| Descrição | Detalhes, critérios de aceite, links |
| Prioridade | Alta, Média ou Baixa |
| Status | Pendente, Em Progresso ou Concluída |
| Responsável | Membro da equipe que vai executar |
| Prazo | Data limite para conclusão |
| Tags | Categorias livres separadas por vírgula |

### Alterar status
- Abra a tarefa e use os botões **Iniciar**, **Concluir** ou **Reabrir**
- Ou arraste o card entre as colunas no **Kanban Board**

### Comentários e menções
- Abra qualquer tarefa e use o campo de comentário
- Digite @ seguido do nome para mencionar um colega
- O colega mencionado recebe uma notificação

---

## Atalhos de teclado

| Atalho | Ação |
|---|---|
| N | Nova tarefa (fora de campos de texto) |
| ? | Mostrar lista de atalhos |
| Ctrl + Enter | Enviar comentário ou formulário |
| Ctrl + = | Aumentar zoom |
| Ctrl + - | Diminuir zoom |
| Ctrl + 0 | Zoom 100% |
| Ctrl + Shift + D | Alternar tema claro/escuro |
| Esc | Fechar modal |
| @ | Mencionar usuário em comentário |
| Seta para cima/baixo | Navegar no autocomplete de menções |

---

## Estrutura dos arquivos

```
taskflow-server-v2/
├── server.js       → servidor Node.js (Express + Socket.io)
├── index.html      → interface completa do TaskFlow
├── package.json    → dependências do projeto
├── tasks.json      → tarefas salvas (gerado automaticamente)
├── users.json      → usuários cadastrados (gerado automaticamente)
└── README.md       → este arquivo
```

---

## Persistência de dados

Todos os dados são salvos automaticamente em arquivos JSON:

- **tasks.json** — todas as tarefas, comentários e histórico
- **users.json** — todos os usuários cadastrados

Se o servidor for reiniciado, os dados são preservados. Se os arquivos forem apagados, o sistema recria com os dados de demonstração padrão.

> Faça backup desses dois arquivos regularmente para não perder os dados.

---

## Dúvidas comuns

**O computador host precisa ficar ligado?**
Sim. Enquanto o servidor (node server.js) estiver rodando, todos os outros podem acessar. Se o computador desligar ou o terminal fechar, os outros perdem a conexão. Os dados ficam salvos e voltam quando o servidor reiniciar.

**Posso acessar de fora da rede (internet)?**
Não na configuração atual. O sistema funciona apenas na rede local (mesmo Wi-Fi ou cabo). Para acesso pela internet seria necessário um serviço como Railway, Render ou um VPS.

**O que acontece se eu fechar o terminal acidentalmente?**
Basta abrir o cmd novamente, navegar até a pasta e rodar node server.js. Os dados não são perdidos.

**Posso ter mais de um administrador?**
Sim. Basta entrar como admin, ir em Equipe, editar o funcionário desejado e trocar o perfil para Administrador.

**O navegador está mostrando a versão antiga após uma atualização?**
Pressione Ctrl + Shift + R para forçar o recarregamento sem cache.

---

## Suporte

Em caso de dúvidas ou problemas, verifique:

1. O servidor está rodando? (node server.js no terminal)
2. Os computadores estão na mesma rede?
3. O firewall do Windows está bloqueando a porta 3000?

Para liberar a porta no firewall, rode no cmd como Administrador:
```
netsh advfirewall firewall add rule name="TaskFlow" dir=in action=allow protocol=TCP localport=3000
```
