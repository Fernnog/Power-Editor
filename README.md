# Power Editor - Editor de Documentos de Alta Performance

Este repositório contém o código-fonte do Power Editor, um editor de documentos web projetado para ser uma alternativa de alta performance a uma solução previamente implementada com Google Apps Script no Google Documentos.

## 1. Contexto do Projeto

Este projeto nasceu da necessidade de otimizar um fluxo de trabalho intensivo que dependia de scripts no Google Documentos. A solução original, embora funcional, sofria com um problema crítico: a latência. Cada ação que dependia de um script (como inserir um modelo de texto) exigia uma chamada de servidor ao ecossistema do Google, resultando em um tempo de resposta lento que impactava diretamente a produtividade.

O objetivo principal foi migrar as funcionalidades essenciais para uma aplicação web autônoma, construída com HTML, CSS e JavaScript puro (Vanilla JS). O pilar central desta migração é a **velocidade**. Ao executar a maior parte da lógica no lado do cliente (client-side), eliminamos a dependência de chamadas de servidor para as operações do dia a dia, garantindo uma resposta instantânea aos comandos do usuário.

## 2. Visão Geral da Aplicação

A aplicação é uma SPA (Single Page Application) leve, sem dependência de frameworks, focada em duas áreas principais:

1.  **Área de Edição Avançada:** Um editor de texto rico (*rich text editor*) com funcionalidades de formatação, automação e ferramentas de produtividade.
2.  **Barra Lateral Inteligente:** Um painel completo para gerenciamento de modelos de documento, com organização flexível em abas e pastas, busca avançada e um sistema de backup robusto com feedback visual claro.

A filosofia é "performance em primeiro lugar", utilizando tecnologias web nativas para garantir a execução mais rápida possível diretamente no navegador do usuário.

## 3. Principais Funcionalidades

A aplicação evoluiu para uma ferramenta de produtividade robusta, com as seguintes funcionalidades:

#### Identidade Visual e Experiência do Usuário
-   **Interface Moderna:** A interface incorpora uma paleta de cores coesa e elementos de design modernos para uma experiência de usuário agradável.
-   **Temas Visuais com Persistência:** Personalize sua área de trabalho com temas como **Modo Claro**, **Modo Escuro** e **Amarelo Suave**. Sua escolha é salva automaticamente no navegador, garantindo que o editor sempre abra com a sua aparência preferida.
-   **Notificações "Toast" Não-Bloqueantes:** Todas as mensagens de feedback (sucesso, erro, confirmação) são exibidas através de um sistema de notificações "toast" que não interrompem o fluxo de trabalho.
-   **Acesso Rápido com Botão Flutuante (FAB):** Um botão discreto com um ícone de raio (⚡) fica posicionado sobre a área do editor, garantindo acesso rápido à paleta de comandos.

#### Área de Edição Avançada
-   **Barra de Ferramentas Otimizada:** Ações essenciais, como o novo seletor de temas, estão diretamente na barra de ferramentas para acesso rápido.
-   **Formatação de Texto e Parágrafo:** Suporte completo para **Negrito**, *Itálico*, <u>Sublinhado</u>, listas, citações e alinhamento.
-   **Ferramentas de Produtividade:**
    -   **Ditado por Voz:** Utilize o microfone para transcrever sua fala diretamente no editor.
    -   **Ajuste de Texto Quebrado (PDF):** Cole textos copiados de PDFs e, com um clique, remova todas as quebras de linha indesejadas, unificando o conteúdo em parágrafos coesos instantaneamente.
    -   **Gerenciador de Substituições Automáticas:** Crie regras personalizadas (ex: `*id` se transforma em `(#id: ;fl.)`) para automatizar a digitação de termos recorrentes.

#### Gerenciador de Modelos Inteligente (Sidebar)
-   **<!-- NOVO --> Organização Hierárquica com Pastas:** Além das abas, agora você pode criar, renomear e excluir pastas dentro de cada aba para uma organização de segundo nível. A exclusão é segura, perguntando o que fazer com os modelos contidos (mover ou apagar) para evitar perda de dados.
-   **Sistema de Automação com Snippets e Variáveis Avançadas:** Transforme modelos simples em documentos inteligentes que se montam e se preenchem de forma semi-automática.
    -   **Modelos Encadeados (Snippets):** Crie modelos pequenos e reutilizáveis (ex: uma assinatura) e insira-os em modelos maiores com a sintaxe `{{snippet:Nome_Do_Modelo}}`.
    -   **Variáveis de Escolha:** Evite erros de digitação criando variáveis que geram um menu de opções. Use `{{status:choice(Pendente|Aprovado|Recusado)}}` para que o sistema apresente um menu suspenso.
    -   **Variáveis de Preenchimento Rápido:** Use `{{nome:prompt}}` para que o sistema peça a informação através de uma pergunta direta.
    -   **Variáveis de Sistema Automáticas:** `{{data_atual}}`, `{{data_por_extenso}}`, `{{hora_atual}}`.
-   **Reorganização com Arrastar e Soltar (Drag and Drop):** Reordene abas, mova modelos entre abas, ou organize modelos dentro e fora de pastas, tudo com um simples arrastar e soltar.
-   **<!-- MODIFICADO --> Organização por Abas e Menus de Contexto:** Crie, renomeie, personalize com uma paleta de cores expandida e exclua abas. Ações rápidas para abas e pastas estão disponíveis através de um menu de contexto (clique com o botão direito). As abas especiais **Favoritos (⭐)** e **Power (⚡)** possuem ícones para uma interface mais limpa e agora exibem um contador de modelos.
-   **Gerenciamento Completo de Modelos (CRUD):** Crie, edite, exclua e mova modelos entre abas de forma intuitiva.
-   **Busca Rápida e Otimizada:** Filtre sua lista de modelos instantaneamente com suporte a operadores lógicos `E` e `OU` e a opção de buscar apenas na aba atual. A busca utiliza "debounce" para garantir a performance.
-   **Card de Status de Backup:** Feedback visual imediato sobre a data e hora do último backup.

#### Paleta de Comandos Rápidos (Power Palette)
-   **Acesso Instantâneo:** Abra a paleta a qualquer momento com o atalho `Ctrl + .` ou clicando no botão flutuante (FAB).
-   **Busca de Modelos Otimizada:** Encontre e insira modelos da sua aba **Power** digitando apenas parte do nome, sem precisar usar o mouse ou navegar pela sidebar.
-   **Navegação por Teclado:** Use as setas para cima/baixo e a tecla `Enter` para selecionar e inserir um modelo.

#### Persistência e Segurança de Dados
-   **Salvamento Automático no Navegador:** Todo o seu trabalho, incluindo a ordem das abas, pastas, modelos, regras de substituição e preferência de tema, é salvo automaticamente no `LocalStorage`.
-   **Backup e Restauração:** Exporte e importe todos os seus dados em um único arquivo `JSON`.
-   **Backup Automático por Inatividade:** Para segurança extra, a aplicação inicia o download de um arquivo de backup após um breve período de inatividade.

## 4. Como Executar

Por ser uma aplicação totalmente client-side, a execução é extremamente simples. Nenhuma configuração de API é necessária.

1.  **Clone ou faça o download deste repositório.**
2.  **Abra o arquivo `index.html` em qualquer navegador moderno** (Chrome, Firefox, Edge, etc.).

A aplicação estará pronta para uso imediato.

## 5. Estrutura de Arquivos

-   `index.html`: Define a estrutura da página, incluindo os containers para a **Paleta de Comandos** e o **botão flutuante (FAB)**.
-   `css/style.css`: Contém todas as regras de estilização, incluindo os estilos para as **pastas**, feedback visual para o **arrastar e soltar (Drag and Drop)** e as **variáveis para os temas visuais**.
-   `js/script.js`: O cérebro da aplicação. Gerencia o estado (`appState`), eventos principais, a **lógica de processamento de modelos** e atua como o *controller* principal, conectando a UI aos dados.
-   `js/tinymce-config.js`: Centraliza a configuração do editor TinyMCE.
-   `js/editor-actions.js`: Contém funções de ações específicas do editor.
-   `js/ModalManager.js`: Módulo para gerenciamento de janelas modais dinâmicas.
-   `js/NotificationService.js`: Módulo dedicado que encapsula a lógica para notificações "toast".
-   `js/CommandPalette.js`: Módulo que controla toda a lógica da Paleta de Comandos.
-   **`js/SidebarManager.js`: (NOVO)** Módulo dedicado a renderizar e gerenciar toda a interatividade da barra lateral, incluindo abas, pastas e a lista de modelos. Controla a lógica de arrastar e soltar e menus de contexto.
-   `js/markdown-converter.js`: Módulo com funções para converter HTML para Markdown e vice-versa.
-   `js/backup-manager.js`: Módulo de suporte para a lógica de backup.
-   `js/speech.js`: Módulo para a API de Reconhecimento de Voz.
-   `js/gemini-service.js`: Módulo para comunicação com a API do Google AI (Gemini). **(Atualmente inativo na UI principal)**.
-   `js/ui-icons.js`: Arquivo central para constantes de ícones SVG.
-   `js/config.js`: **(Legado)** Arquivo de configuração. **Não é mais necessário para as funcionalidades atuais**.
-   `README.md`: Este arquivo.

## 6. Roadmap de Desenvolvimento

### Recém-Implementado
-   ✅ **<!-- NOVO --> Gerenciamento Completo de Pastas:** Adicionada a capacidade de criar, renomear e excluir pastas, com um fluxo de exclusão seguro para pastas com conteúdo.
-   ✅ Temas Visuais (Claro/Escuro/Amarelo) com Persistência
-   ✅ Sistema de Automação com Snippets e Variáveis Avançadas
-   ✅ Ferramenta de Ajuste de Texto Quebrado (PDF)
-   ✅ Reorganização Total das Abas com Arrastar e Soltar (Drag and Drop)
-   ✅ Otimização de Busca com "Debounce"
-   ✅ Sistema de Notificações "Toast"
-   ✅ Paleta de Comandos Rápidos (Power Palette)

### Curto Prazo (Quick Wins & UX)
-   [ ] **<!-- NOVO --> Substituir Prompts por Modais Customizados:** Substituir todas as chamadas `prompt()` (para criar/renomear abas e pastas) por modais gerenciados pelo `ModalManager.js` para uma UX coesa.
-   [ ] **Expandir Temas para a Interface Completa:** Aplicar o tema selecionado (Claro/Escuro) também na sidebar e nos modais.
-   [ ] **Criar um modal de "Configurações":** Um local central para o usuário gerenciar preferências e chaves de API para futuras integrações.

### Médio Prazo (Arquitetura e Funcionalidades)
-   [ ] **Criador de Temas Personalizado:** Permitir que o usuário crie e salve seus próprios temas de editor (cor de fundo e texto).
-   [ ] **<!-- MODIFICADO --> Expandir Variáveis e introduzir Condicionais:** Permitir que o usuário defina variáveis globais (ex: `{{meu_nome}}`) e introduzir lógica condicional nos modelos (ex: `{{#if:variavel}}...{{/if}}`).
-   [ ] **Reintroduzir e expandir ferramentas de IA:** Adicionar novas ações inteligentes como "Resumir Texto", "Ajustar Tom" (formal, amigável), ou "Expandir Ideia".
-   [ ] **Refatorar `script.js`:** Continuar desmembrando o arquivo principal em módulos menores e mais focados (ex: `TemplateProcessor.js`, `AppState.js`) para melhorar a manutenibilidade.

### Longo Prazo (Visão Futura)
-   [ ] **Histórico de Versões:** Implementar um sistema que salva "snapshots" do documento no `LocalStorage`, permitindo reverter para versões anteriores.
-   [ ] **Sincronização entre Dispositivos (Cloud):** Explorar a possibilidade de usar serviços como Firebase (Firestore/Auth) para permitir que os usuários acessem seus modelos e documentos de qualquer lugar.
