<p align="center">
  <img src="assets/logo.png" alt="Logotipo do Plano de Leitura" width="150">
</p>

# Power Editor - Editor de Documentos de Alta Performance

Este repositório contém o código-fonte do Power Editor (v1.1.4), um editor de documentos web projetado para ser uma alternativa de alta performance a soluções baseadas em nuvem. Focado em agilidade, o sistema roda totalmente no lado do cliente (client-side), oferecendo ferramentas avançadas de automação jurídica e integração com Inteligência Artificial.

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
A ferramenta de voz foi revolucionada na versão 1.1.4, introduzindo processamento de sinal digital (DSP) profissional:
*   **Visualização de Áudio Profissional:** Um canvas de espectro de áudio real, com barras coloridas que reagem dinamicamente à frequência e volume da voz, substituindo animações CSS estáticas.
*   **Tratamento de Áudio (DSP):** Filtros passa-alta (85Hz) para remover ruídos graves e compressores dinâmicos para nivelar o volume da voz antes do reconhecimento.
*   **Validação de Hardware:** O sistema verifica ativamente o fluxo de dados do microfone. Se o visualizador não se move, o usuário sabe instantaneamente que o microfone não está captando áudio.
*   **Três Modos de Inserção:**
    1.  **Inserir:** Cola o texto cru, exatamente como foi ditado.
    2.  **Revisar ✨:** Usa a IA para corrigir gramática, pontuação e capitalização antes de inserir.
    3.  **Jurídico ⚖️:** Transforma linguagem coloquial em **norma culta jurídica**. A IA atua como um assistente sênior de Direito do Trabalho.

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
-   `css/components.css`: Estilos específicos para componentes, modais e o novo visualizador de áudio.
-   `js/script.js`: Controlador principal (Controller), gerencia estado global e inicialização.
-   `js/config.js`: *(Depreciado/Legado)* Mantido apenas para compatibilidade.

### Módulos de Funcionalidade
-   **`js/speech.js`: (ATUALIZADO)** Gerencia a Web Speech API, agora com classe `AudioVisualizer` e lógica DSP integrada.
-   `js/changelog.js`: Gerencia o histórico de versões e exibe as novidades na UI.
-   `js/tinymce-config.js`: Configuração do editor TinyMCE e barra de ferramentas.
-   `js/gemini-service.js`: Serviço de comunicação com a API Google Gemini.
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

### Versão Atual: 1.1.4 🚀
-   ✅ **Visualizador de Áudio Real (DSP):** Canvas de espectro com tratamento de sinal (filtro/compressor).
-   ✅ **Validação de Hardware:** Feedback visual preciso sobre a captura do microfone.
-   ✅ **Correção de Layout:** Ajuste flexbox no modal de ditado para evitar sobreposições.

### Futuro
-   [ ] **Temas Personalizados:** Criador de temas onde o usuário define as cores.
-   [ ] **Sincronização Cloud:** Integração opcional com Firebase/Supabase para sincronizar modelos entre dispositivos.
-   [ ] **Histórico de Documentos:** Salvar snapshots do conteúdo do editor localmente.

---
