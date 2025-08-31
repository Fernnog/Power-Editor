# Editor de Documentos - Projeto de Migração e Otimização

Este repositório contém o código-fonte de um editor de documentos web projetado para ser uma alternativa de alta performance a uma solução previamente implementada com Google Apps Script no Google Documentos.

## 1. Contexto do Projeto

Este projeto nasceu da necessidade de otimizar um fluxo de trabalho intensivo que dependia de scripts no Google Documentos. A solução original, embora funcional, sofria com um problema crítico: a latência. Cada ação que dependia de um script (como inserir um modelo de texto) exigia uma chamada de servidor ao ecossistema do Google, resultando em um tempo de resposta lento que impactava diretamente a produtividade.

O objetivo principal foi migrar as funcionalidades essenciais para uma aplicação web autônoma, construída com HTML, CSS e JavaScript puro (Vanilla JS). O pilar central desta migração é a **velocidade**. Ao executar a maior parte da lógica no lado do cliente (client-side), eliminamos a dependência de chamadas de servidor para as operações do dia a dia, garantindo uma resposta instantânea aos comandos do usuário.

## 2. Visão Geral da Aplicação

A aplicação é uma SPA (Single Page Application) leve, sem dependência de frameworks, focada em duas áreas principais:

1.  **Área de Edição Avançada:** Um editor de texto rico (*rich text editor*) com funcionalidades de formatação, automação e ferramentas de produtividade.
2.  **Barra Lateral Inteligente:** Um painel completo para gerenciamento de modelos de documento, organizado por abas coloridas, com busca avançada, e um sistema de backup robusto.

A filosofia é "performance em primeiro lugar", utilizando tecnologias web nativas para garantir a execução mais rápida possível diretamente no navegador do usuário.

## 3. Principais Funcionalidades

A aplicação evoluiu para uma ferramenta de produtividade robusta, com as seguintes funcionalidades:

#### Identidade Visual Renovada
-   A interface foi atualizada para incorporar uma nova paleta de cores da marca, aplicada em elementos-chave como botões de ação primários, ícones e o status de backup, criando uma experiência de usuário mais coesa e moderna.

#### Área de Edição Avançada
-   **Formatação de Texto e Parágrafo:** Suporte completo para **Negrito**, *Itálico*, <u>Sublinhado</u>, listas numeradas, listas com marcadores, citações (blockquote) e alinhamento de texto.
-   **Controle de Estilo:** Ajuste de espaçamento entre linhas e recuo de primeira linha.
-   **Automação com 1 Clique:**
    -   **"Formatar Doc":** Aplica instantaneamente um padrão de formatação profissional a todo o documento.
    -   **"Apagar Doc":** Limpa todo o conteúdo do editor com uma confirmação de segurança.
-   **Ferramentas de Produtividade:**
    -   **Ditado por Voz:** Utilize o microfone para transcrever sua fala diretamente no editor.
    -   **Busca e Substituição:** Uma ferramenta rápida para localizar e substituir todas as ocorrências de um termo.
    -   **Correção Inteligente com IA:** Selecione qualquer trecho de texto e clique no botão **A✓** para enviá-lo à API do Google (Gemini). A IA corrige erros de gramática, ortografia e pontuação, substituindo automaticamente o texto original pela versão aprimorada.

#### Gerenciador de Modelos Inteligente (Sidebar)
-   **Organização por Abas:**
    -   **Gestão Completa:** Crie, renomeie, exclua e personalize as cores de suas abas.
    -   **Aba de Favoritos:** Uma aba especial dedicada para agrupar seus modelos mais utilizados.
-   **Gerenciamento de Modelos (CRUD):**
    -   **Criar, Ler, Atualizar e Excluir** modelos de texto de forma intuitiva.
    -   **Mover:** Realoque modelos facilmente entre diferentes abas.
-   **Busca Rápida e Avançada:** Filtre sua lista de modelos instantaneamente com suporte a operadores lógicos `E` e `OU`.

#### Persistência e Segurança de Dados
-   **Salvamento Automático no Navegador:** Todo o seu trabalho é salvo automaticamente no `LocalStorage`.
-   **Backup e Restauração Manual:** Exporte e importe todos os seus dados (modelos e abas) em um único arquivo `JSON`.
-   **Backup Automático por Inatividade:** Para segurança extra, a aplicação inicia o download de um arquivo de backup `JSON` atualizado após um breve período de inatividade.

## 4. Como Executar

Por ser uma aplicação majoritariamente client-side, a execução é simples. No entanto, a nova funcionalidade de correção com IA requer uma pequena configuração.

1.  **Clone ou faça o download deste repositório.**

2.  **Configure sua Chave de API (Obrigatório para a função de IA):**
    A funcionalidade de correção de texto precisa de uma chave de API do Google AI Studio para funcionar.
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
    *   **Nota de Segurança:** Este arquivo `config.js` **não deve ser compartilhado ou enviado para repositórios públicos (como o GitHub)**. Ele foi projetado para ser um arquivo de configuração estritamente local.

3.  **Abra o arquivo `index.html` em qualquer navegador moderno** (Chrome, Firefox, Edge, etc.). A aplicação estará pronta para uso. A funcionalidade de IA só funcionará se o passo 2 for concluído corretamente.

## 5. Estrutura de Arquivos

-   `index.html`: Define a estrutura da página.
-   `css/style.css`: Contém todas as regras de estilização.
-   `js/script.js`: O cérebro da aplicação. Gerencia o estado (`appState`), a manipulação do DOM e os eventos principais, incluindo a orquestração da chamada para o serviço de IA.
-   `js/editor-actions.js`: Módulo com ações de formatação do editor.
-   `js/speech.js`: Módulo para a API de Reconhecimento de Voz.
-   `js/backup-manager.js`: Módulo de suporte para a lógica de backup.
-   `js/ModalManager.js`: Módulo para gerenciamento de janelas modais.
-   `js/gemini-service.js`: **(Novo)** Módulo dedicado que encapsula toda a lógica de comunicação com a API do Google AI (Gemini) para a funcionalidade de correção de texto.
-   `js/config.js`: **(Novo/Local)** Arquivo de configuração local **(não incluído no repositório)** para armazenar a chave de API do Google. É necessário criar este arquivo manualmente.
-   `README.md`: Este arquivo.

## 6. Roadmap de Desenvolvimento

Com a base atual sólida, o plano de evolução inclui:

#### Curto Prazo (Quick Wins & UX)
-   [ ] **Melhorar Gestão da Chave de API (UX):** Em vez de usar um arquivo `config.js`, criar um modal de "Configurações" onde o usuário possa inserir e salvar sua chave de API no `LocalStorage` do navegador, tornando a configuração mais amigável.
-   [ ] **Otimizar Busca:** Adicionar "debounce" à função de busca para otimizar a performance em listas de modelos muito grandes.

#### Médio Prazo (Arquitetura e Funcionalidades)
-   [ ] **Expandir Funcionalidades de IA:** Já que a integração com a API está pronta, adicionar novas ferramentas como "Mudar Tom do Texto" (formal, informal, etc.) ou "Expandir Ideia" (desenvolver um parágrafo a partir de uma frase).
-   [ ] **Variáveis Dinâmicas:** Introduzir um sistema de placeholders nos modelos (ex: `{{nome_do_cliente}}`). Ao inserir um modelo, o sistema solicitaria ao usuário que preenchesse os valores.

#### Longo Prazo (Visão Futura)
-   [ ] **Backend-for-Frontend (BFF) para Segurança da API:** Para uma versão pública da aplicação, implementar um pequeno servidor intermediário que guardaria a chave de API de forma segura, evitando sua exposição no lado do cliente.
-   [ ] **Perfis de Formatação:** Permitir que os usuários criem, salvem e apliquem diferentes conjuntos de regras de estilo com um clique.
-   [ ] **Histórico de Versões:** Implementar um sistema que salva "snapshots" do documento no `LocalStorage` periodicamente.
