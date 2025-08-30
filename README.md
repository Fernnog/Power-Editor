# Editor de Documentos - Projeto de Migração e Otimização

Este repositório contém o código-fonte de um editor de documentos web projetado para ser uma alternativa de alta performance a uma solução previamente implementada com Google Apps Script no Google Documentos.

## 1. Contexto do Projeto

Este projeto nasceu da necessidade de otimizar um fluxo de trabalho intensivo que dependia de scripts no Google Documentos. A solução original, embora funcional, sofria com um problema crítico: a latência. Cada ação que dependia de um script (como inserir um modelo de texto) exigia uma chamada de servidor ao ecossistema do Google, resultando em um tempo de resposta lento que impactava diretamente a produtividade.

O objetivo principal foi migrar as funcionalidades essenciais para uma aplicação web autônoma, construída com HTML, CSS e JavaScript puro (Vanilla JS). O pilar central desta migração é a **velocidade**. Ao executar toda a lógica no lado do cliente (client-side), eliminamos a dependência de chamadas de servidor, garantindo uma resposta instantânea aos comandos do usuário.

A interface original contava com um painel lateral para gerenciamento de modelos de texto. Esta nova aplicação replica e aprimora essa experiência, oferecendo um ganho de performance drástico e funcionalidades expandidas.

## 2. Visão Geral da Aplicação

A aplicação é uma SPA (Single Page Application) leve, sem dependência de frameworks, focada em duas áreas principais:

1.  **Área de Edição Avançada:** Um editor de texto rico (*rich text editor*) com funcionalidades de formatação, automação e ferramentas de produtividade.
2.  **Barra Lateral Inteligente:** Um painel completo para gerenciamento de modelos de documento, organizado por abas coloridas, com busca avançada, e um sistema de backup robusto.

A filosofia é "performance em primeiro lugar", utilizando tecnologias web nativas para garantir a execução mais rápida possível diretamente no navegador do usuário.

## 3. Principais Funcionalidades

A aplicação evoluiu para uma ferramenta de produtividade robusta, com as seguintes funcionalidades:

#### Área de Edição Avançada
-   **Formatação de Texto e Parágrafo:** Suporte completo para **Negrito**, *Itálico*, <u>Sublinhado</u>, listas numeradas, listas com marcadores, citações (blockquote) e alinhamento de texto (Esquerda, Centro, Justificado).
-   **Controle de Estilo:** Ajuste de espaçamento entre linhas e recuo de primeira linha.
-   **Automação com 1 Clique:**
    -   **"Formatar Doc":** Aplica instantaneamente um padrão de formatação profissional a todo o documento (recuo de 3cm para parágrafos, espaçamento de 1.5 entre linhas), garantindo consistência visual.
    -   **"Apagar Doc":** Limpa todo o conteúdo do editor com uma confirmação de segurança.
-   **Ferramentas de Produtividade:**
    -   **Ditado por Voz:** Utilize o microfone para transcrever sua fala diretamente no editor, com suporte a múltiplos idiomas e comandos de pontuação por voz (ex: "vírgula", "nova linha").
    -   **Busca e Substituição:** Uma ferramenta rápida para localizar e substituir todas as ocorrências de um termo no documento.

#### Gerenciador de Modelos Inteligente (Sidebar)
-   **Organização por Abas:**
    -   **Gestão Completa:** Crie, renomeie e exclua abas para organizar seus modelos por contexto ou categoria.
    -   **Personalização Visual:** Atribua cores distintas a cada aba a partir de uma paleta, facilitando a identificação visual.
    -   **Interface Centralizada:** As ações para a aba ativa (excluir, renomear, alterar cor) estão centralizadas em um painel de ações limpo, melhorando a usabilidade.
    -   **Aba de Favoritos:** Uma aba especial dedicada para agrupar seus modelos mais utilizados, acessíveis de qualquer lugar.
-   **Gerenciamento de Modelos (CRUD):**
    -   **Criar:** Salve o conteúdo do editor principal como um novo modelo com um único clique.
    -   **Ler:** Visualize todos os seus modelos em uma lista clara, com indicadores de cor correspondentes à sua aba de origem.
    -   **Atualizar:** Edite o nome e o conteúdo de qualquer modelo através de uma janela (modal) dedicada, que suporta formatação de texto (negrito, itálico, sublinhado).
    -   **Excluir:** Remova modelos que não são mais necessários.
    -   **Mover:** Realoque modelos facilmente entre diferentes abas.
-   **Busca Rápida e Avançada:** Filtre sua lista de modelos instantaneamente. A busca suporta operadores lógicos como `E` e `OU`, permitindo refinar os resultados com precisão (ex: "contrato E distrato").

#### Persistência e Segurança de Dados
-   **Salvamento Automático no Navegador:** Todo o seu trabalho, incluindo modelos, abas e suas configurações, é salvo automaticamente no `LocalStorage` do seu navegador. Você pode fechar a página e reabri-la sem perder nada.
-   **Backup e Restauração Manual:**
    -   **Exportar:** Salve todos os seus modelos e abas em um único arquivo `JSON` local.
    -   **Importar:** Carregue um arquivo de backup `JSON` para restaurar sua configuração ou compartilhá-la entre diferentes computadores.
-   **Backup Automático por Inatividade:** Para uma camada extra de segurança, a aplicação detecta quando você faz alterações e, após um breve período de inatividade, automaticamente inicia o download de um arquivo de backup `JSON` atualizado, nomeado com data e hora.

## 4. Como Executar

Por ser uma aplicação totalmente client-side, não há necessidade de um servidor web ou processo de build.

1.  Clone ou faça o download deste repositório.
2.  Basta abrir o arquivo `index.html` em qualquer navegador moderno (Chrome, Firefox, Edge, etc.).

## 5. Estrutura de Arquivos

-   `index.html`: Define a estrutura da página, incluindo a área do editor, a barra lateral, o painel de ações de abas e os modais.
-   `style.css`: Contém todas as regras de estilização para garantir uma interface limpa, organizada e responsiva, incluindo os estilos para os novos componentes de UI.
-   `script.js`: O cérebro da aplicação. Gerencia o estado (`appState`), a manipulação do DOM, todos os eventos, a lógica de renderização, o gerenciamento de modelos e abas, e a orquestração da persistência e dos backups.
-   `editor-actions.js`: Módulo que encapsula ações de formatação e automação específicas do editor principal (ex: "Formatar Doc", "Recuo").
-   `speech.js`: Módulo dedicado que encapsula toda a lógica da API de Reconhecimento de Voz (Speech-to-Text).
-   `backup-manager.js`: Módulo de suporte para a lógica de backup, cuja funcionalidade é atualmente orquestrada a partir de `script.js`.
-   `README.md`: Este arquivo.

## 6. Roadmap de Desenvolvimento

Com a base atual sólida, o plano de evolução inclui:

#### Curto Prazo (Quick Wins & UX)
-   [ ] **Melhorar Interações:** Substituir o uso de `prompt()` (para renomear abas e na função de substituir) pelo sistema de Modal já existente na aplicação, criando uma experiência de usuário mais consistente e agradável.
-   [ ] **Implementar "Desfazer":** Adicionar a funcionalidade de "Desfazer" (`Ctrl+Z`) para a ação de "Busca e Substituição", oferecendo uma rede de segurança crucial para o usuário.
-   [ ] **Otimizar Busca:** Adicionar "debounce" à função de busca para otimizar a performance em listas de modelos muito grandes, evitando a filtragem a cada tecla pressionada.

#### Médio Prazo (Arquitetura e Funcionalidades)
-   [ ] **Refatorar Lógica de Backup:** Consolidar a lógica de backup, atualmente dividida entre `script.js` e `backup-manager.js`, em um único módulo coeso para aderir ao Princípio da Responsabilidade Única.
-   [ ] **Variáveis Dinâmicas:** Introduzir um sistema de placeholders nos modelos (ex: `{{nome_do_cliente}}`, `{{numero_do_processo}}`). Ao inserir um modelo, o sistema solicitaria ao usuário que preenchesse os valores, automatizando ainda mais a criação de documentos.
-   [ ] **Editor de Modelos Avançado:** Aprimorar o modal de edição de modelos para incluir mais opções de formatação (listas, alinhamento, etc.), equiparando-o ao editor principal.

#### Longo Prazo (Visão Futura)
-   [ ] **Perfis de Formatação:** Evoluir a função "Formatar Doc" para um sistema de **"Perfis de Formatação"**, permitindo que os usuários criem, salvem e apliquem diferentes conjuntos de regras de estilo com um clique.
-   [ ] **Histórico de Versões:** Implementar um sistema que salva "snapshots" do documento no `LocalStorage` periodicamente, permitindo ao usuário restaurar versões anteriores do seu trabalho.
-   [ ] **Sincronização na Nuvem (Opcional):** Explorar opções para salvar e sincronizar modelos em um serviço de nuvem (como Firebase ou um backend próprio), permitindo o acesso aos modelos de diferentes dispositivos.
