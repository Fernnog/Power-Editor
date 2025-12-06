<p align="center">
  <svg width="120" height="120" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#a12050;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#ce2a66;stop-opacity:1" />
      </linearGradient>
    </defs>
    <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#f0f0f0" stroke="#cccccc" stroke-width="0.5"/>
    <path d="M14 2V8H20" fill="#e0e0e0" stroke="#cccccc" stroke-width="0.5"/>
    <polygon points="13 11 9 16 12 16 11 20 15 15 12 15 13 11" fill="url(#grad1)"/>
  </svg>
</p>

# Power Editor - Editor de Documentos de Alta Performance

Este repositório contém o código-fonte do Power Editor (v1.1.2), um editor de documentos web projetado para ser uma alternativa de alta performance a soluções baseadas em nuvem. Focado em agilidade, o sistema roda totalmente no lado do cliente (client-side), oferecendo ferramentas avançadas de automação jurídica e integração com Inteligência Artificial.

## 1. Contexto do Projeto

Este projeto nasceu da necessidade de otimizar um fluxo de trabalho intensivo que dependia de scripts no Google Documentos. A solução original sofria com latência devido às chamadas constantes de servidor.

O Power Editor resolve isso migrando as funcionalidades essenciais para uma aplicação web autônoma (Vanilla JS + TinyMCE). O pilar central é a **velocidade** e a **segurança de dados local**. Ao executar a lógica no navegador, eliminamos a latência e garantimos resposta instantânea, com persistência automática de dados e chaves de API salvas localmente.

## 2. Visão Geral da Aplicação

A aplicação é uma SPA (Single Page Application) leve, sem dependência de frameworks pesados (como React ou Vue), focada em:

1.  **Área de Edição Avançada:** Um editor rico (*rich text*) turbinado com IA e automação.
2.  **Barra Lateral Inteligente:** Um sistema de gestão de conhecimento (KM) com pastas, abas, busca e modelos.
3.  **Central de IA:** Integração direta com Google Gemini para transcrição, correção gramatical e refinamento jurídico.

## 3. Principais Funcionalidades

### 🧠 Inteligência Artificial e Ditado (Power Dictation)
A ferramenta de voz foi totalmente reformulada na versão 1.1.2, transformando-se em uma central de produção de texto:
*   **Buffer de Rascunho Seguro:** O texto ditado não vai direto para o documento. Ele aparece em uma área de rascunho onde você pode ver o reconhecimento em tempo real. Se fechar a janela, o texto é salvo automaticamente.
*   **Visualização de Áudio:** Uma onda sonora animada confirma visualmente que o microfone está captando áudio.
*   **Três Modos de Inserção:**
    1.  **Inserir:** Cola o texto cru, exatamente como foi ditado.
    2.  **Revisar ✨:** Usa a IA para corrigir gramática, pontuação e capitalização antes de inserir.
    3.  **Jurídico ⚖️:** Transforma linguagem coloquial em **norma culta jurídica**. A IA atua como um assistente sênior de Direito do Trabalho, substituindo termos como "mandar embora" por "dispensa" e formatando menções a leis (ex: CLT, CF/88).

### 🚀 Produtividade e Automação
*   **Power Palette (`Ctrl + .`):** Uma paleta de comandos rápida (estilo VS Code) para inserir modelos sem tirar as mãos do teclado.
*   **Ajuste de Texto Quebrado (PDF):** Cole textos copiados de PDFs e, com um clique, remova quebras de linha indesejadas, unificando parágrafos.
*   **Gerenciador de Substituições:** Crie regras (ex: `*id` vira `(#id: ;fl.)`) que são aplicadas automaticamente enquanto você digita.
*   **Changelog Integrado:** Histórico de versões acessível diretamente na barra de status do editor, facilitando o acompanhamento das novidades.

### 📂 Gerenciamento de Modelos (Sidebar)
*   **Organização Híbrida:** Use **Abas** para grandes categorias e **Pastas** para organização detalhada.
*   **Drag and Drop Total:** Arraste modelos entre pastas, mova abas de lugar e solte variáveis de sistema diretamente no texto.
*   **Modelos Inteligentes:**
    *   **Snippets:** Blocos reutilizáveis (ex: `{{snippet:Assinatura}}`).
    *   **Variáveis de Escolha:** Menus dropdown (`{{status:choice(Pendente|Pago)}}`).
    *   **Lógica Condicional:** Blocos que aparecem apenas se uma condição for atendida (`{{#if:parte=Reclamante}}...{{/if}}`).
    *   **Variáveis de Sistema:** Tags visuais para `{{data_atual}}`, `{{hora_atual}}`, etc.

### 🎨 Interface e UX
*   **Temas Persistentes:** Escolha entre Claro, Escuro ou Amarelo Suave (foco em leitura). A preferência é salva no navegador.
*   **Notificações Toast:** Feedback visual não-intrusivo para todas as ações.
*   **Segurança de Chaves:** A chave da API do Google Gemini é solicitada uma única vez e salva no "Cofre" do navegador (`LocalStorage`), sem risco de exposição no código-fonte.

## 4. Estrutura de Arquivos

A arquitetura foi modularizada para facilitar a manutenção e a escalabilidade.

### Núcleo (Core)
-   `index.html`: Estrutura principal, modais e templates.
-   `css/style.css`: Estilização completa, variáveis de temas e animações.
-   `js/script.js`: Controlador principal (Controller), gerencia estado global e inicialização.
-   `js/config.js`: *(Depreciado/Legado)* Mantido apenas para compatibilidade, não contém mais chaves sensíveis.

### Módulos de Funcionalidade
-   **`js/changelog.js`: (NOVO)** Gerencia o histórico de versões e exibe as novidades na UI. Separado da configuração do editor para segurança.
-   `js/tinymce-config.js`: Configuração do editor TinyMCE e barra de ferramentas.
-   `js/speech.js`: API de reconhecimento de voz e integração com os botões de ação (Inserir/Revisar/Jurídico).
-   `js/gemini-service.js`: Serviço de comunicação com a API Google Gemini. Inclui o novo prompt de "Persona Jurídica".
-   `js/SidebarManager.js`: Gerencia a renderização e eventos da barra lateral (pastas, drag & drop).
-   `js/CommandPalette.js`: Lógica da paleta de comandos flutuante.
-   `js/ModalManager.js`: Sistema centralizado para exibição de janelas modais dinâmicas.
-   `js/NotificationService.js`: Sistema de notificações "toast".
-   `js/backup-manager.js`: Lógica de salvamento automático e exportação JSON.

### Utilitários e Helpers
-   `js/editor-actions.js`: Ações auxiliares do editor.
-   `js/markdown-converter.js`: Conversão bidirecional HTML <-> Markdown.
-   `js/ui-icons.js`: Biblioteca de ícones SVG.

## 5. Como Executar

A aplicação é **100% Client-Side**. Não requer Node.js, Python ou servidor backend.

1.  **Clone o repositório.**
2.  **Abra o arquivo `index.html`** em qualquer navegador moderno (Chrome/Edge recomendados para suporte total à Web Speech API).
3.  **Configuração Inicial:** Ao tentar usar uma função de IA (como o botão "Revisar"), o sistema pedirá sua chave de API do Google Gemini. Cole-a e ela será salva com segurança no seu navegador.

## 6. Roadmap e Histórico

### Versão Atual: 1.1.2 🚀
-   ✅ **Separação de Arquitetura:** Changelog desacoplado em `js/changelog.js`.
-   ✅ **Modo Jurídico (IA):** Novo botão no ditado que formaliza o texto para peças processuais.
-   ✅ **Múltiplos Modos de Inserção:** Escolha entre texto cru, revisado ou jurídico.

### Implementações Recentes
-   ✅ Rascunho Seguro (Buffer) para ditado.
-   ✅ Cofre de Chaves no LocalStorage (Fim do `config.js` com dados sensíveis).
-   ✅ Assistente de Lógica Condicional (GUI para criar `{{#if...}}`).
-   ✅ Arrastar e Soltar Variáveis de Sistema.

### Futuro
-   [ ] **Temas Personalizados:** Criador de temas onde o usuário define as cores.
-   [ ] **Sincronização Cloud:** Integração opcional com Firebase/Supabase para sincronizar modelos entre dispositivos.
-   [ ] **Histórico de Documentos:** Salvar snapshots do conteúdo do editor localmente.
