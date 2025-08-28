# Editor de Documentos - Projeto de Migração e Otimização

Este repositório contém o código-fonte de um editor de documentos web projetado para ser uma alternativa de alta performance a uma solução previamente implementada com Google Apps Script no Google Documentos.

## 1. Contexto do Projeto

Este projeto nasceu da necessidade de otimizar um fluxo de trabalho intensivo que dependia de scripts no Google Documentos. A solução original, embora funcional, sofria com um problema crítico: a latência. Cada ação que dependia de um script (como inserir um modelo de texto) exigia uma chamada de servidor ao ecossistema do Google, resultando em um tempo de resposta lento que impactava diretamente a produtividade.

O objetivo principal foi migrar as funcionalidades essenciais para uma aplicação web autônoma, construída com HTML, CSS e JavaScript puro (Vanilla JS). O pilar central desta migração é a **velocidade**. Ao executar toda a lógica no lado do cliente (client-side), eliminamos a dependência de chamadas de servidor, garantindo uma resposta instantânea aos comandos do usuário.

A interface original contava com um painel lateral para gerenciamento de modelos de texto. Esta nova aplicação replica e aprimora essa experiência, oferecendo um ganho de performance drástico e funcionalidades expandidas.

## 2. Visão Geral da Aplicação

A aplicação é uma SPA (Single Page Application) leve, sem dependência de frameworks, focada em duas áreas principais:

1.  **Área de Edição:** Um editor de texto rico (*rich text editor*) com funcionalidades de formatação essenciais.
2.  **Barra Lateral Inteligente:** Um painel para gerenciamento completo de modelos de documento, permitindo busca, criação, edição, exclusão e inserção de conteúdo pré-definido.

A filosofia é "performance em primeiro lugar", utilizando tecnologias web nativas para garantir a execução mais rápida possível diretamente no navegador do usuário.

## 3. Principais Funcionalidades

A aplicação evoluiu para se tornar uma ferramenta de produtividade robusta, com as seguintes funcionalidades:

#### Editor de Texto Avançado
-   **Formatação Básica:** **Negrito**, *Itálico* e <u>Sublinhado</u>.
-   **Alinhamento de Parágrafo:** Esquerda, Centro e Justificado.
-   **Formatação de Parágrafo:** Controle de espaçamento entre linhas e **recuo de primeira linha**, uma funcionalidade específica para formatação de documentos formais.

#### Gerenciador de Modelos Inteligente
-   **CRUD Completo:**
    -   **Criar:** Salve o conteúdo do editor principal como um novo modelo com um único clique no botão "Adicionar".
    -   **Ler:** Visualize todos os seus modelos em uma lista clara e pesquisável.
    -   **Atualizar:** Edite o nome e o conteúdo de qualquer modelo existente através de uma janela (modal) dedicada.
    -   **Excluir:** Remova modelos que não são mais necessários com uma confirmação de segurança.
-   **Edição com Formatação (Rich Text):** A janela de edição de modelos possui sua própria barra de ferramentas, permitindo aplicar **negrito, itálico e sublinhado** diretamente no conteúdo do modelo.
-   **Persistência Automática:** Todos os seus modelos são salvos automaticamente no `LocalStorage` do seu navegador. Você pode fechar a aba e reabri-la sem perder seu trabalho.
-   **Busca Rápida:** Filtre sua lista de modelos instantaneamente digitando no campo de pesquisa.
-   **Backup e Restauração:**
    -   **Exportar:** Salve todos os seus modelos (incluindo a formatação) em um arquivo `JSON` local.
    -   **Importar:** Carregue modelos a partir de um arquivo `JSON`, substituindo sua lista atual (ideal para compartilhar modelos ou restaurar um backup).

## 4. Como Executar

Por ser uma aplicação totalmente client-side, não há necessidade de um servidor web ou processo de build.

1.  Clone ou faça o download deste repositório.
2.  Basta abrir o arquivo `index.html` em qualquer navegador moderno (Chrome, Firefox, Edge, etc.).

## 5. Estrutura de Arquivos

-   `index.html`: Define a estrutura da página, incluindo a área do editor, a barra lateral e o modal de edição de modelos.
-   `style.css`: Contém todas as regras de estilização para garantir uma interface limpa, organizada e responsiva, incluindo os estilos do modal.
-   `script.js`: O cérebro da aplicação. Gerencia toda a lógica, manipulação do DOM, eventos, funcionalidades do editor e o gerenciamento completo dos modelos, incluindo a persistência no `LocalStorage`.
-   `README.md`: Este arquivo.

## 6. Roadmap de Desenvolvimento

Com a base atual sólida, o plano de evolução inclui:

#### Curto Prazo (Próximas Implementações)
-   [ ] **Melhoria de Performance:** Adicionar "debounce" à função de busca para otimizar a filtragem em listas de modelos muito grandes.
-   [ ] **Editor:** Adicionar mais opções de formatação, como listas numeradas e não numeradas, e cores de texto.

#### Médio Prazo (Arquitetura e Melhorias de UX)
-   [ ] **Arquitetura:** Refatorar o `script.js` para modularizar o gerenciamento de estado (`AppState`), separando os dados da lógica de visualização para melhorar a manutenibilidade.
-   [ ] **Categorização de Modelos:** Implementar um sistema de tags ou pastas para permitir que os usuários organizem seus modelos de forma mais granular, facilitando a localização em grandes coleções.

#### Longo Prazo (Visão Futura)
-   [ ] **Modelos com Variáveis:** Introduzir um sistema de placeholders (ex: `{{nome_do_cliente}}` ou `{{numero_do_processo}}`) que, ao inserir o modelo, solicitaria ao usuário que preenchesse os valores, automatizando ainda mais a criação de documentos.
-   [ ] **Sincronização na Nuvem (Opcional):** Explorar opções para salvar e sincronizar modelos em um serviço de nuvem (como Firebase ou um backend próprio), permitindo o acesso aos modelos de diferentes dispositivos.
