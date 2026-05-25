# TaskFlow Corporate

> Sistema de gestão colaborativa de tarefas para equipes em rede local.

---

## O que é o TaskFlow?

O TaskFlow Corporate é uma aplicação web de gerenciamento de tarefas desenvolvida para equipes que trabalham no mesmo escritório ou rede local. Ele permite que todos os membros da equipe vejam, criem e atualizem tarefas em tempo real, além de visualizarem quem está online e o que cada pessoa está fazendo no momento.

O sistema foi construído do zero como um único arquivo HTML, sem frameworks pesados, e evoluiu para uma aplicação cliente-servidor completa com Node.js e Socket.io para suportar múltiplos usuários simultâneos — agora com autenticação por senha, tokens de sessão seguros e proteção automática contra perda de dados.

---

## Como foi feito

### Tecnologias utilizadas

| Camada | Tecnologia | Função |
|---|---|---|
| Interface | HTML + CSS + JavaScript puro | Toda a UI sem frameworks |
| Servidor | Node.js + Express | Serve os arquivos e a API |
| Tempo real | Socket.io | Sincronização entre usuários |
| Segurança | bcrypt + crypto | Hash de senhas e tokens de sessão |
| Fontes | Google Fonts | Playfair Display + IBM Plex Sans |
| Persistência | JSON no disco | tasks.json e users.json com escrita atômica |

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
│   │  backups/    (BD)   │                │ │
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
- **Autenticação por senha** — login com email e senha protegida por bcrypt
- **Tokens de sessão** — cada login gera um token seguro que valida todas as operações
- **Troca de senha** — usuários podem trocar a própria senha a qualquer momento
- **Redefinição de senha** — administradores podem redefinir a senha de qualquer usuário
- **Escrita atômica** — gravação segura que nunca corrompe dados mesmo com queda de energia
- **Backup automático** — cópias dos dados criadas a cada 30 minutos automaticamente
- **Recuperação automática** — ao reiniciar, o servidor tenta restaurar dados de backups se necessário
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

████████╗ █████╗ ███████╗██╗  ██╗███████╗██╗      ██████╗ ██╗    ██╗
╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝██╔════╝██║     ██╔═══██╗██║    ██║
   ██║   ███████║███████╗█████╔╝ █████╗  ██║     ██║   ██║██║ █╗ ██║
   ██║   ██╔══██║╚════██║██╔═██╗ ██╔══╝  ██║     ██║   ██║██║███╗██║
   ██║   ██║  ██║███████║██║  ██╗██║     ███████╗╚██████╔╝╚███╔███╔╝
   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝
            ╔════════════════════════════════════════╗
            ║   TaskFlow Server v3 — ONLINE          ║
            ║   http://localhost:3000                ║
            ║   Compartilhe: http://SEU_IP:3000      ║
            ║   Windows IP: ipconfig                 ║
            ║   Mac/Linux:  ifconfig                 ║
            ╠════════════════════════════════════════╣
            ║   Admin padrão: admin@corp.com         ║
            ║   Senha padrão: admin123               ║
            ╚════════════════════════════════════════╝

```

**5.** Acesse no navegador:
```
http://localhost:3000
```

### A partir da segunda vez

Só precisa dos passos **1**, **2** e **4**. O `npm install` não é necessário novamente.

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

**3.** Todos abrem esse endereço no navegador e fazem login com email e senha.

> Todos os computadores precisam estar na mesma rede Wi-Fi ou cabo.

---

## Usuários e acesso

Na tela de login, o usuário informa seu **email corporativo** e sua **senha**. O sistema valida as credenciais no servidor — a senha nunca trafega em texto puro após o login.

### Perfis de acesso

| Perfil | O que pode fazer |
|---|---|
| **Administrador** | Tudo — incluindo gerenciar a equipe, redefinir senhas, ver todas as tarefas e acessar relatórios |
| **Colaborador** | Criar tarefas, gerenciar suas próprias tarefas, comentar, usar o Kanban e trocar a própria senha |

### Administrador padrão

```
Email: admin@corp.com
Senha: admin123
```

> **Importante:** troque a senha do administrador padrão logo no primeiro acesso. O sistema solicitará isso automaticamente.

---

## Login e segurança

### Como funciona o login

1. O usuário informa email e senha na tela de login
2. O servidor valida a senha usando **bcrypt** — a comparação leva ~100ms intencionalmente para dificultar ataques de força bruta
3. Se as credenciais estiverem corretas, o servidor gera um **token de sessão** de 256 bits e o devolve ao cliente
4. Todas as operações subsequentes (criar tarefas, gerenciar usuários, etc.) são validadas pelo token no servidor
5. O token é invalidado quando o usuário clica em **Sair** ou o servidor reinicia

### Armazenamento de senhas

As senhas **nunca são salvas em texto puro**. O sistema armazena apenas o hash gerado pelo bcrypt, que é uma transformação irreversível. Mesmo quem tiver acesso direto ao `users.json` não consegue descobrir as senhas originais.

### Troca de senha (qualquer usuário)

1. Clique em **🔒 Trocar senha** na sidebar
2. Informe a senha atual
3. Informe e confirme a nova senha (mínimo 6 caracteres)
4. Clique em **Salvar nova senha**

### Redefinição de senha (apenas administradores)

1. Clique em **Equipe** na sidebar
2. Clique em **Redefinir senha** no card do funcionário
3. Defina e confirme a nova senha
4. Clique em **Redefinir senha**

O usuário cuja senha foi redefinida será solicitado a criar uma nova senha no próximo login.

---

## Proteção de dados contra quedas de energia

O sistema possui três camadas de proteção para garantir que nenhum dado seja perdido mesmo em caso de queda de energia ou desligamento inesperado do servidor.

### Escrita atômica

A cada alteração (nova tarefa, comentário, edição), o sistema grava os dados em um arquivo temporário antes de substituir o arquivo principal. Só quando a gravação estiver 100% completa o arquivo original é substituído. Isso garante que uma queda de energia no meio de uma gravação **nunca corrompe os dados** — o pior caso é perder apenas a última ação realizada.

### Backup automático a cada 30 minutos

O servidor cria automaticamente uma pasta `backups/` e salva cópias dos arquivos de dados com timestamp no nome:

```
backups/
  tasks-2026-05-25T14-30-00.json
  users-2026-05-25T14-30-00.json
  tasks-2026-05-25T15-00-00.json
  users-2026-05-25T15-00-00.json
  ...
```

Os últimos **48 backups** são mantidos (equivalente a 24 horas de histórico). Os mais antigos são removidos automaticamente.

### Recuperação automática na inicialização

Se o servidor reiniciar e encontrar um arquivo corrompido, ele tenta recuperar os dados automaticamente nessa ordem:

1. O arquivo temporário `.tmp` da última gravação interrompida
2. O backup mais recente da pasta `backups/`
3. Se nada funcionar, começa com os dados padrão

Quando uma recuperação ocorre, o servidor exibe uma mensagem de aviso no terminal informando de qual fonte os dados foram restaurados.

> **Dica:** a pasta `backups/` também pode ser copiada manualmente para um pen drive ou HD externo como backup adicional.

---

## Gerenciamento de equipe

Apenas administradores têm acesso à aba **Equipe** na sidebar.

### Adicionar funcionário

1. Clique em **Equipe** na sidebar
2. Clique em **+ Adicionar funcionário**
3. Preencha nome, email, cargo e perfil de acesso
4. Defina uma **senha inicial** para o novo funcionário (mínimo 6 caracteres)
5. As iniciais do avatar são preenchidas automaticamente
6. Escolha uma cor para o avatar
7. Clique em **Adicionar funcionário**

O novo funcionário aparece instantaneamente para todos e já pode fazer login com a senha definida. Na primeira entrada, o sistema pedirá que ele troque a senha.

### Editar funcionário

1. Clique em **Equipe** na sidebar
2. Clique em **Editar** no card do funcionário
3. Altere os campos desejados (nome, email, cargo, perfil)
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
- O campo de senha nunca é editável pela tela de edição — use **Redefinir senha** para alterar a senha de um funcionário

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
├── server.js       → servidor Node.js (Express + Socket.io + bcrypt)
├── index.html      → interface completa do TaskFlow
├── package.json    → dependências do projeto
├── tasks.json      → tarefas salvas (gerado automaticamente)
├── users.json      → usuários cadastrados com hash de senha
├── backups/        → backups automáticos com timestamp (gerado automaticamente)
└── README.md       → este arquivo
```

---

## Persistência de dados

Todos os dados são salvos automaticamente em arquivos JSON com escrita atômica:

- **tasks.json** — todas as tarefas, comentários e histórico
- **users.json** — todos os usuários cadastrados (senhas armazenadas como hash bcrypt)
- **backups/** — cópias automáticas geradas a cada 30 minutos, mantendo as últimas 24 horas

Se o servidor for reiniciado, os dados são preservados. Se o `users.json` for apagado, o sistema recria com o administrador padrão (`admin@corp.com` / `admin123`).

> Para um backup extra de segurança, copie a pasta `backups/` para um pen drive ou HD externo regularmente.

---

## Dúvidas comuns

<details>
<summary><strong>O computador host precisa ficar ligado?</strong></summary>

Sim. Enquanto o servidor (`node server.js`) estiver rodando, todos os outros podem acessar. Se o computador desligar ou o terminal fechar, os outros perdem a conexão. Os dados ficam salvos nos arquivos e voltam quando o servidor reiniciar. As sessões de login são perdidas ao reiniciar — os usuários precisarão fazer login novamente.

</details>

<details>
<summary><strong>Houve uma queda de energia — os dados foram perdidos?</strong></summary>

Provavelmente não. O sistema usa escrita atômica para garantir que os arquivos nunca fiquem corrompidos. Ao reiniciar o servidor com `node server.js`, ele carrega os dados automaticamente. Se por algum motivo o arquivo principal estiver corrompido, o servidor tenta recuperar do arquivo temporário `.tmp` ou do backup mais recente na pasta `backups/` — e exibe uma mensagem no terminal informando o que foi restaurado.

</details>

<details>
<summary><strong>Esqueci a senha de um usuário — o que faço?</strong></summary>

Se você for administrador, acesse **Equipe**, clique em **Redefinir senha** no card do usuário e defina uma nova senha. Se for a senha do próprio admin e não houver outro admin, pare o servidor, edite o `users.json` diretamente e substitua o campo `passwordHash` pelo hash padrão: `$2b$10$u9a6mjc8e1n3ZL2tNTS/4OPDTmoD.E/gHUYz/tP72HzL3vDND/u7a` (corresponde à senha `admin123`). Salve e reinicie o servidor.

</details>

<details>
<summary><strong>Posso acessar de fora da rede (internet)?</strong></summary>

Não na configuração atual. O sistema funciona apenas na rede local (mesmo Wi-Fi ou cabo). Para acesso pela internet seria necessário um serviço como Railway, Render ou uma VPS com IP público.

</details>

<details>
<summary><strong>O que acontece se eu fechar o terminal acidentalmente?</strong></summary>

Basta abrir o `cmd` novamente, navegar até a pasta com `cd` e rodar `node server.js` de novo. Os dados em `tasks.json` e `users.json` não são perdidos. Os usuários precisarão fazer login novamente pois as sessões ficam em memória.

</details>

<details>
<summary><strong>Posso ter mais de um administrador?</strong></summary>

Sim. Basta entrar como admin, ir em **Equipe**, clicar em **Editar** no funcionário desejado e trocar o perfil para **Administrador**.

</details>

<details>
<summary><strong>O navegador está mostrando a versão antiga após uma atualização?</strong></summary>

Pressione `Ctrl + Shift + R` para forçar o recarregamento sem cache. Isso força o navegador a baixar a versão mais recente do servidor.

</details>

<details>
<summary><strong>Os usuários mudaram mas o sistema ainda mostra os antigos?</strong></summary>

Pare o servidor com `Ctrl + C`, edite o arquivo `users.json` diretamente com o Bloco de Notas, salve e rode `node server.js` novamente. No navegador pressione `Ctrl + Shift + R`.

</details>

---

## Suporte

Em caso de dúvidas ou problemas, verifique:

1. O servidor está rodando? (`node server.js` no terminal)
2. Os computadores estão na mesma rede?
3. O firewall do Windows está bloqueando a porta 3000?

Para liberar a porta no firewall, rode no cmd como Administrador:
```
netsh advfirewall firewall add rule name="TaskFlow" dir=in action=allow protocol=TCP localport=3000
```
