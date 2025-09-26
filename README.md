Com certeza. Com base em todas as evoluções que implementamos e discutimos, atualizei o arquivo `README.md` para refletir o estado atual e futuro do projeto.

Ele agora inclui a nova "Paleta de Comandos", o rebranding da aba "Power", a mudança para ícones, e um roadmap de desenvolvimento completo com as ideias que acabamos de analisar.

---

### `README.md` (Versão Atualizada)

# Editor de Documentos - Projeto de Migração e Otimização

Este repositório contém o código-fonte de um editor de documentos web projetado para ser uma alternativa de alta performance a uma solução previamente implementada com Google Apps Script no Google Documentos.

## 1. Contexto do Projeto

Este projeto nasceu da necessidade de otimizar um fluxo de trabalho intensivo que dependia de scripts no Google Documentos. A solução original, embora funcional, sofria com um problema crítico: a latência. Cada ação que dependia de um script (como inserir um modelo de texto) exigia uma chamada de servidor ao ecossistema do Google, resultando em um tempo de resposta lento que impactava diretamente a produtividade.

O objetivo principal foi migrar as funcionalidades essenciais para uma aplicação web autônoma, construída com HTML, CSS e JavaScript puro (Vanilla JS). O pilar central desta migração é a **velocidade**. Ao executar a maior parte da lógica no lado do cliente (client-side), eliminamos a dependência de chamadas de servidor para as operações do dia a dia, garantindo uma resposta instantânea aos comandos do usuário.

## 2. Visão Geral da Aplicação

A aplicação é uma SPA (Single Page Application) leve, sem dependência de frameworks, focada em duas áreas principais:

1.  **Área de Edição Avançada:** Um editor de texto rico (*rich text editor*) com funcionalidades de formatação, automação e ferramentas de produtividade.
2.  **Barra Lateral Inteligente:** Um painel completo para gerenciamento de modelos de documento, organizado por abas coloridas, com busca avançada, e um sistema de backup robusto com feedback visual claro.

A filosofia é "performance em primeiro lugar", utilizando tecnologias web nativas para garantir a execução mais rápida possível diretamente no navegador do usuário.

## 3. Principais Funcionalidades

A aplicação evoluiu para uma ferramenta de produtividade robusta, com as seguintes funcionalidades:

#### Identidade Visual e Experiência do Usuário
-   **Interface Moderna:** A interface incorpora uma paleta de cores coesa e elementos de design modernos para uma experiência de usuário agradável.
-   **Notificações "Toast" Não-Bloqueantes:** Todas as mensagens de feedback (sucesso, erro, confirmação) são exibidas através de um sistema de notificações "toast" que não interrompem o fluxo de trabalho.
-   **Acesso Rápido com Botão Flutuante (FAB):** Um botão discreto com um ícone de raio (⚡) fica posicionado sobre a área do editor, garantindo acesso rápido à paleta de comandos, especialmente em dispositivos móveis.

#### Área de Edição Avançada
-   **Barra de Ferramentas Otimizada:** Ações essenciais estão diretamente na barra de ferramentas do editor para acesso rápido.
-   **Formatação de Texto e Parágrafo:** Suporte completo para **Negrito**, *Itálico*, <u>Sublinhado</u>, listas, citações e alinhamento.
-   **Ferramentas de Produtividade:**
    -   **Ditado por Voz:** Utilize o microfone para transcrever sua fala diretamente no editor.
    -   **Correção Inteligente com IA (Gemini):** Selecione um texto e, com um clique, envie-o para a API do Google para corrigir erros de gramática, ortografia e pontuação.
    -   **Gerenciador de Substituições Automáticas:** Crie regras personalizadas (ex: `*id` se transforma em `(#id: ;fl.)`) para automatizar a digitação de termos recorrentes.

#### Gerenciador de Modelos Inteligente (Sidebar)
-   **Sistema de Variáveis Dinâmicas:**
    -   **Criação de Modelos Inteligentes:** Crie modelos com placeholders usando a sintaxe `{{nome_da_variavel}}`.
    -   **Preenchimento Guiado:** Ao usar um modelo com variáveis, uma janela pop-up (modal) é exibida, solicitando que você preencha um formulário com os valores para cada variável.
    -   **Inserção Automatizada:** O texto é inserido no editor com todas as variáveis já substituídas.
-   **Card de Status de Backup:** Feedback visual imediato sobre a data e hora do último backup.
-   **Organização por Abas:** Crie, renomeie, personalize com uma paleta de cores expandida e exclua abas para organizar seus modelos. Inclui abas especiais e otimizadas para **Favoritos (⭐)** e **Power (⚡)**, que agora são representadas por ícones para uma interface mais limpa.
-   **Gerenciamento Completo de Modelos (CRUD):** Crie, edite, exclua e mova modelos entre abas de forma intuitiva.
-   **Busca Rápida e Avançada:** Filtre sua lista de modelos instantaneamente com suporte a operadores lógicos `E` e `OU`.

#### Paleta de Comandos Rápidos (Power Palette)
-   **Acesso Instantâneo:** Abra a paleta a qualquer momento com o atalho `Ctrl + .` ou clicando no botão flutuante (FAB).
-   **Busca de Modelos Otimizada:** Encontre e insira modelos da sua aba **Power** digitando apenas parte do nome, sem precisar usar o mouse ou navegar pela sidebar.
-   **Navegação por Teclado:** Use as setas para cima/baixo e a tecla `Enter` para selecionar e inserir um modelo, mantendo o fluxo de trabalho focado no teclado.

#### Persistência e Segurança de Dados
-   **Salvamento Automático no Navegador:** Todo o seu trabalho, incluindo modelos, abas e regras de substituição, é salvo automaticamente no `LocalStorage`.
-   **Backup e Restauração:** Exporte e importe todos os seus dados em um único arquivo `JSON`.
-   **Backup Automático por Inatividade:** Para segurança extra, a aplicação inicia o download de um arquivo de backup após um breve período de inatividade.

## 4. Como Executar

Por ser uma aplicação majoritariamente client-side, a execução é simples. No entanto, a funcionalidade de correção com IA requer uma pequena configuração.

1.  **Clone ou faça o download deste repositório.**

2.  **Configure sua Chave de API (Obrigatório para a função de IA):**
    *   Navegue até a pasta `js/`.
    *   Crie um **novo arquivo** e nomeie-o exatamente como **`config.js`**.
    *   Abra este novo arquivo e cole o seguinte código dentro dele:
        ```javascript
        const CONFIG = {
            // IMPORTANTE: Cole sua chave de API do Google AI Studio aqui, dentro das aspas.
            apiKey: "SUA_CHAVE_API_VAI_AQUI"
        };
        ```
    *   Substitua `"SUA_CHAVE_API_VAI_AQUI"` pela sua chave de API real.
    *   **Nota de Segurança:** Este arquivo `config.js` **não deve ser compartilhado ou enviado para repositórios públicos**.

3.  **Abra o arquivo `index.html` em qualquer navegador moderno** (Chrome, Firefox, Edge, etc.). A aplicação estará pronta para uso.

## 5. Estrutura de Arquivos

-   `index.html`: Define a estrutura da página, incluindo os novos containers para a **Paleta de Comandos (`#command-palette-overlay`)** e o **botão flutuante (FAB)**.
-   `css/style.css`: Contém todas as regras de estilização, incluindo os novos estilos para a **Paleta de Comandos**, o **FAB reposicionado** e as **abas de ícone**.
-   `js/script.js`: O cérebro da aplicação. Gerencia o estado (`appState`) e os eventos principais. Agora contém a **lógica para renderizar abas especiais como ícones**.
-   `js/tinymce-config.js`: Centraliza a configuração do editor TinyMCE.
-   `js/ModalManager.js`: Módulo para gerenciamento de janelas modais.
-   `js/NotificationService.js`: Módulo dedicado que encapsula a lógica para notificações "toast".
-   `js/CommandPalette.js`: **(Novo)** Módulo que controla toda a lógica da Paleta de Comandos, incluindo busca, navegação e seleção.
-   `js/markdown-converter.js`: **(Novo)** Módulo com funções para converter HTML para Markdown e vice-versa.
-   `js/backup-manager.js`: Módulo de suporte para a lógica de backup.
-   `js/speech.js`: Módulo para a API de Reconhecimento de Voz.
-   `js/gemini-service.js`: Módulo para comunicação com a API do Google AI (Gemini).
-   `js/ui-icons.js`: Arquivo central para constantes de ícones SVG.
-   `js/config.js`: **(Local)** Arquivo de configuração para armazenar a chave de API (deve ser criado manually).
-   `README.md`: Este arquivo.

## 6. Roadmap de Desenvolvimento

### Recém-Implementado
-   ✅ Sistema de Notificações "Toast"
-   ✅ Variáveis Dinâmicas nos Modelos (`{{variavel}}`)
-   ✅ **Paleta de Comandos Rápidos** (Power Palette) com atalho `Ctrl + .`
-   ✅ **Rebranding e Otimização de Abas** (Aba "Power" ⚡ e "Favoritos" ⭐ como ícones)
-   ✅ **Botão de Acesso Rápido (FAB)** reposicionado sobre o editor para melhor UX.
-   ✅ **Paleta de Cores Expandida** para personalização das abas.

### Curto Prazo (Quick Wins & UX)
-   [ ] **Memória de Variáveis:** Salvar os valores preenchidos no `LocalStorage` para pré-preencher o formulário na próxima vez que o mesmo modelo for usado.
-   [ ] **Melhorar Gestão da Chave de API (UX):** Em vez de usar um arquivo `config.js`, criar um modal de "Configurações" onde o usuário possa inserir e salvar sua chave de API no `LocalStorage`.
-   [ ] **Otimizar Busca com "Debounce":** Adicionar um pequeno atraso à função de busca para otimizar a performance em listas de modelos muito grandes, evitando que a filtragem ocorra a cada tecla pressionada.

### Médio Prazo (Arquitetura e Funcionalidades)
-   [ ] **Variáveis Globais e Dinâmicas:** Permitir que o usuário defina variáveis globais (ex: `{{meu_nome}}`) em uma área de configurações, e usar variáveis geradas pelo sistema (ex: `{{data_atual}}`).
-   [ ] **Expandir Funcionalidades de IA:** Adicionar novas ferramentas como "Ajustar Tom do Texto" (formal, amigável) ou "Expandir Ideia" diretamente na barra de ferramentas.
-   [ ] **Refatorar `script.js`:** Desmembrar o arquivo principal em módulos menores e mais focados (ex: `stateManager.js`, `uiRenderer.js`) para melhorar a manutenibilidade do código.

### Longo Prazo (Visão Futura)
-   [ ] **Reorganização com Arrastar e Soltar (Drag and Drop):** Permitir que o usuário reordene modelos e abas arrastando-os na interface.
-   [ ] **Histórico de Versões:** Implementar um sistema que salva "snapshots" do documento no `LocalStorage` periodicamente, permitindo reverter para versões anteriores.
