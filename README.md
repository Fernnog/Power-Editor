# Editor de Documentos - Projeto de Migração e Otimização

Este repositório contém o código-fonte de um editor de documentos web projetado para ser uma alternativa de alta performance a uma solução previamente implementada com Google Apps Script no Google Documentos.

## 1. Contexto do Projeto

Este projeto nasceu da necessidade de otimizar um fluxo de trabalho intensivo em um editor de texto que era potencializado por scripts no Google Documentos. A solução original, embora funcional, sofria com um problema crítico: a latência. Cada ação que dependia de um script (como inserir um modelo de texto) exigia uma chamada de servidor ao ecossistema do Google, resultando em um tempo de resposta lento que impactava diretamente a produtividade.

O objetivo principal é migrar as funcionalidades essenciais e a lógica de negócios para uma aplicação web autônoma, construída com HTML, CSS e JavaScript puro (Vanilla JS). O pilar central desta migração é a **velocidade**. Ao executar toda a lógica no lado do cliente (client-side), eliminamos a dependência de chamadas de servidor para operações do dia a dia, garantindo uma resposta instantânea aos comandos do usuário.

A interface original no Google Documentos contava com um painel lateral robusto onde modelos de texto ("autotextos") eram organizados, categorizados e podiam ser rapidamente inseridos no corpo do documento. A nova aplicação visa replicar e, futuramente, aprimorar essa experiência, mantendo a familiaridade da interface enquanto oferece um ganho de performance drástico.

Para uma referência visual da interface original que serve como inspiração para este projeto, consulte a imagem `interface-google-docs.png` na raiz deste repositório.

## 2. Visão Geral da Aplicação

A aplicação é uma SPA (Single Page Application) leve, sem dependência de frameworks, focada em duas áreas principais:

1.  **Área de Edição:** Um editor de texto rico (*rich text editor*) com funcionalidades básicas de formatação.
2.  **Barra Lateral (Sidebar):** Um painel para gerenciamento de modelos de documento, permitindo busca rápida e inserção de conteúdo pré-definido.

A filosofia é "performance em primeiro lugar", utilizando tecnologias web nativas para garantir a execução mais rápida possível diretamente no navegador do usuário.

## 3. Estrutura de Arquivos

O projeto é composto pelos seguintes arquivos:

-   `index.html`: Define a estrutura da página, incluindo a área do editor, a barra de ferramentas e a barra lateral.
-   `style.css`: Contém todas as regras de estilização para garantir uma interface limpa, organizada e responsiva.
-   `script.js`: O cérebro da aplicação. Gerencia toda a lógica, manipulação do DOM, eventos, funcionalidades do editor e o gerenciamento dos modelos.
-   `interface-google-docs.png`: (Opcional) Screenshot da interface original do Google Docs para referência visual do objetivo de design e funcionalidade.

## 4. Funcionalidades Implementadas

Atualmente, a aplicação suporta as seguintes funcionalidades:

#### Editor de Texto
-   Formatação de texto: **Negrito**, *Itálico* e <u>Sublinhado</u>.
-   Alinhamento de parágrafo: Esquerda, Centro e Justificado.
-   Controle de espaçamento entre linhas (Simples, 1.5, Duplo).
-   Adição de recuo de parágrafo.

#### Gerenciamento de Modelos
-   Listagem de modelos pré-definidos na barra lateral.
-   Inserção do conteúdo de um modelo no editor com um único clique.
-   Busca dinâmica para filtrar modelos pelo nome.
-   **Backup e Restauração:**
    -   **Exportar:** Salva todos os modelos atuais (incluindo sua formatação HTML) em um arquivo `JSON` local.
    -   **Importar:** Carrega modelos a partir de um arquivo `JSON`, substituindo a lista existente.

## 5. Roadmap de Desenvolvimento

Este documento será atualizado conforme novas funcionalidades forem implementadas. O plano atual de evolução inclui:

#### Curto Prazo (Próximas Implementações)
-   [ ] **Melhoria de UX:** Adicionar um diálogo de confirmação antes de importar modelos para evitar a sobreposição acidental de dados.
-   [ ] **Nova Funcionalidade:** Botão "Salvar como Modelo" que captura o conteúdo do editor e o adiciona à lista de modelos na barra lateral.
-   [ ] **Editor:** Adicionar suporte para listas numeradas e não numeradas.

#### Médio Prazo (Arquitetura e Melhorias)
-   [ ] **Arquitetura:** Refatorar o `script.js` para modularizar o estado da aplicação (ex: `stateManager`) e os manipuladores de eventos, melhorando a manutenibilidade.
-   [ ] **Performance:** Adicionar "debounce" à função de busca para otimizar a filtragem em listas de modelos muito grandes.
-   [ ] **Editor:** Implementar a funcionalidade de adicionar tabelas simples.

#### Longo Prazo (Visão Futura)
-   [ ] **Persistência de Dados:** Salvar automaticamente o conteúdo do editor e a lista de modelos no `LocalStorage` do navegador para que não se percam ao fechar a página.
-   [ ] **Categorização de Modelos:** Adicionar um sistema de tags ou pastas para organizar os modelos de forma mais granular.

## 6. Como Executar

Por ser uma aplicação totalmente client-side, não há necessidade de um servidor web ou processo de build.

1.  Clone ou faça o download deste repositório.
2.  Basta abrir o arquivo `index.html` em qualquer navegador moderno (Chrome, Firefox, Edge, etc.).
