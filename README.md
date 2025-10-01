# Power Editor - Editor de Documentos de Alta Performance

Este repositório contém o código-fonte do Power Editor, um editor de documentos web projetado para ser uma alternativa de alta performance a uma solução previamente implementada com Google Apps Script no Google Documentos.

## 1. Contexto do Projeto

Este projeto nasceu da necessidade de otimizar um fluxo de trabalho intensivo que dependia de scripts no Google Documentos. A solução original, embora funcional, sofria com um problema crítico: a latência. Cada ação que dependia de um script (como inserir um modelo de texto) exigia uma chamada de servidor ao ecossistema do Google, resultando em um tempo de resposta lento que impactava diretamente a produtividade.

O objetivo principal foi migrar as funcionalidades essenciais para uma aplicação web autônoma, construída com HTML, CSS e JavaScript puro (Vanilla JS). O pilar central desta migração é a **velocidade**. Ao executar a maior parte da lógica no lado do cliente (client-side), eliminamos a dependência de chamadas de servidor para as operações do dia a dia, garantindo uma resposta instantânea aos comandos do usuário.

## 2. Visão Geral da Aplicação

A aplicação é uma SPA (Single Page Application) leve, sem dependência de frameworks, focada em duas áreas principais:

1.  **Área de Edição Avançada:** Um editor de texto rico (*rich text editor*) com funcionalidades de formatação, automação e ferramentas de produtividade.
2.  **Barra Lateral Inteligente:** Um painel completo para gerenciamento de modelos de documento, com organização flexível, busca avançada e um sistema de backup robusto com feedback visual claro.

A filosofia é "performance em primeiro lugar", utilizando tecnologias web nativas para garantir a execução mais rápida possível diretamente no navegador do usuário.

## 3. Principais Funcionalidades

A aplicação evoluiu para uma ferramenta de produtividade robusta, com as seguintes funcionalidades:

#### Identidade Visual e Experiência do Usuário
-   **Interface Moderna:** A interface incorpora uma paleta de cores coesa e elementos de design modernos para uma experiência de usuário agradável.
-   **Notificações "Toast" Não-Bloqueantes:** Todas as mensagens de feedback (sucesso, erro, confirmação) são exibidas através de um sistema de notificações "toast" que não interrompem o fluxo de trabalho.
-   **Acesso Rápido com Botão Flutuante (FAB):** Um botão discreto com um ícone de raio (⚡) fica posicionado sobre a área do editor, garantindo acesso rápido à paleta de comandos.

#### Área de Edição Avançada
-   **Barra de Ferramentas Otimizada:** Ações essenciais estão diretamente na barra de ferramentas do editor para acesso rápido.
-   **Formatação de Texto e Parágrafo:** Suporte completo para **Negrito**, *Itálico*, <u>Sublinhado</u>, listas, citações e alinhamento.
-   **Ferramentas de Produtividade:**
    -   **Ditado por Voz:** Utilize o microfone para transcrever sua fala diretamente no editor.
    -   **Ajuste de Texto Quebrado (PDF):** Cole textos copiados de PDFs e, com um clique, remova todas as quebras de linha indesejadas, unificando o conteúdo em parágrafos coesos instantaneamente.
    -   **Gerenciador de Substituições Automáticas:** Crie regras personalizadas (ex: `*id` se transforma em `(#id: ;fl.)`) para automatizar a digitação de termos recorrentes.

#### Gerenciador de Modelos Inteligente (Sidebar)
-   **Sistema de Variáveis Dinâmicas:**
    -   **Criação de Modelos Inteligentes:** Crie modelos com placeholders usando a sintaxe `{{nome_da_variavel}}`.
    -   **Preenchimento Guiado:** Ao usar um modelo com variáveis, uma janela pop-up (modal) é exibida, solicitando que você preencha um formulário com os valores para cada variável.
    -   **Inserção Automatizada:** O texto é inserido no editor com todas as variáveis já substituídas.
-   **Reorganização com Arrastar e Soltar (Drag and Drop):** Reordene todas as abas, incluindo Favoritos (⭐) e Power (⚡), simplesmente arrastando-as para a posição desejada para personalizar completamente seu layout.
-   **Organização por Abas:** Crie, renomeie, personalize com uma paleta de cores expandida e exclua abas para organizar seus modelos. Inclui abas especiais para **Favoritos (⭐)** e **Power (⚡)**, representadas por ícones para uma interface mais limpa.
-   **Gerenciamento Completo de Modelos (CRUD):** Crie, edite, exclua e mova modelos entre abas de forma intuitiva.
-   **Busca Rápida e Otimizada:** Filtre sua lista de modelos instantaneamente com suporte a operadores lógicos `E` e `OU`. A busca agora utiliza "debounce" para garantir a performance mesmo em listas muito grandes.
-   **Card de Status de Backup:** Feedback visual imediato sobre a data e hora do último backup.

#### Paleta de Comandos Rápidos (Power Palette)
-   **Acesso Instantâneo:** Abra a paleta a qualquer momento com o atalho `Ctrl + .` ou clicando no botão flutuante (FAB).
-   **Busca de Modelos Otimizada:** Encontre e insira modelos da sua aba **Power** digitando apenas parte do nome, sem precisar usar o mouse ou navegar pela sidebar.
-   **Navegação por Teclado:** Use as setas para cima/baixo e a tecla `Enter` para selecionar e inserir um modelo, mantendo o fluxo de trabalho focado no teclado.

#### Persistência e Segurança de Dados
-   **Salvamento Automático no Navegador:** Todo o seu trabalho, incluindo a ordem das abas, modelos e regras de substituição, é salvo automaticamente no `LocalStorage`.
-   **Backup e Restauração:** Exporte e importe todos os seus dados em um único arquivo `JSON`.
-   **Backup Automático por Inatividade:** Para segurança extra, a aplicação inicia o download de um arquivo de backup após um breve período de inatividade.

## 4. Como Executar

Por ser uma aplicação totalmente client-side, a execução é extremamente simples. Nenhuma configuração de API é necessária.

1.  **Clone ou faça o download deste repositório.**
2.  **Abra o arquivo `index.html` em qualquer navegador moderno** (Chrome, Firefox, Edge, etc.).

A aplicação estará pronta para uso imediato.

## 5. Estrutura de Arquivos

-   `index.html`: Define a estrutura da página, incluindo os containers para a **Paleta de Comandos** e o **botão flutuante (FAB)**.
-   `css/style.css`: Contém todas as regras de estilização, incluindo os estilos de feedback visual para o **arrastar e soltar (Drag and Drop)** das abas.
-   `js/script.js`: O cérebro da aplicação. Gerencia o estado (`appState`), eventos principais e a lógica de renderização.
-   `js/tinymce-config.js`: Centraliza a configuração do editor TinyMCE, incluindo a definição do novo botão para **ajustar texto quebrado**.
-   `js/editor-actions.js`: Contém funções de ações específicas do editor.
-   `js/ModalManager.js`: Módulo para gerenciamento de janelas modais dinâmicas.
-   `js/NotificationService.js`: Módulo dedicado que encapsula a lógica para notificações "toast".
-   `js/CommandPalette.js`: Módulo que controla toda a lógica da Paleta de Comandos.
-   `js/markdown-converter.js`: Módulo com funções para converter HTML para Markdown e vice-versa.
-   `js/backup-manager.js`: Módulo de suporte para a lógica de backup.
-   `js/speech.js`: Módulo para a API de Reconhecimento de Voz.
-   `js/gemini-service.js`: Módulo para comunicação com a API do Google AI (Gemini). **(Atualmente inativo na UI principal)**.
-   `js/ui-icons.js`: Arquivo central para constantes de ícones SVG.
-   `js/config.js`: **(Legado)** Arquivo de configuração que era usado para armazenar a chave de API. **Não é mais necessário para as funcionalidades atuais**.
-   `README.md`: Este arquivo.

## 6. Roadmap de Desenvolvimento

### Recém-Implementado
-   ✅ **Ferramenta de Ajuste de Texto Quebrado (PDF):** Substituição da antiga funcionalidade de IA por uma ferramenta prática para limpar textos copiados de PDFs.
-   ✅ **Reorganização Total das Abas com Arrastar e Soltar (Drag and Drop):** Agora é possível reordenar todas as abas, incluindo Favoritos e Power, para uma organização totalmente personalizada.
-   ✅ **Otimização de Busca com "Debounce":** A performance da busca na sidebar foi aprimorada para evitar sobrecarga em listas de modelos muito grandes.
-   ✅ Sistema de Notificações "Toast"
-   ✅ Variáveis Dinâmicas nos Modelos (`{{variavel}}`)
-   ✅ Paleta de Comandos Rápidos (Power Palette)

### Curto Prazo (Quick Wins & UX)
-   [ ] **Memória de Variáveis:** Salvar os valores preenchidos no `LocalStorage` para pré-preencher o formulário na próxima vez que o mesmo modelo for usado.
-   [ ] **Criar um modal de "Configurações":** Um local central para o usuário gerenciar preferências, como chaves de API para futuras integrações, sem precisar editar arquivos de código.

### Médio Prazo (Arquitetura e Funcionalidades)
-   [ ] **Variáveis Globais e do Sistema:** Permitir que o usuário defina variáveis globais (ex: `{{meu_nome}}`) em uma área de configurações, e usar variáveis geradas pelo sistema (ex: `{{data_por_extenso}}`).
-   [ ] **Reintroduzir e expandir ferramentas de IA:** Adicionar novas ações inteligentes como "Resumir Texto", "Ajustar Tom" (formal, amigável), ou "Expandir Ideia" através de um menu de IA dedicado.
-   [ ] **Refatorar `script.js`:** Desmembrar o arquivo principal em módulos menores e mais focados (ex: `stateManager.js`, `uiRenderer.js`, `eventHandlers.js`) para melhorar a manutenibilidade do código.

### Longo Prazo (Visão Futura)
-   [ ] **Histórico de Versões:** Implementar um sistema que salva "snapshots" do documento no `LocalStorage` periodicamente, permitindo reverter para versões anteriores.
-   [ ] **Sincronização entre Dispositivos (Cloud):** Explorar a possibilidade de usar serviços como Firebase (Firestore/Auth) para permitir que os usuários acessem seus modelos e documentos de qualquer lugar.
