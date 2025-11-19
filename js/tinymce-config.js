// js/tinymce-config.js

const CHANGELOG_DATA = {
    currentVersion: '1.1.0',
    history: [
       {
            version: '1.1.0',
            title: '🎙️ A Revolução do Ditado: Rascunho Seguro e Feedback Visual',
            content: `
                <ul>
                    <li><strong>NOVO - Área de Rascunho Inteligente (Buffer):</strong> O ditado não insere mais o texto "às cegas" no documento. Agora, suas palavras aparecem instantaneamente em uma área de edição dedicada. Você vê o texto se formando em tempo real (com feedback provisório) e pode revisar tudo antes de clicar em "Inserir".</li>
                    <li><strong>NOVO - Cofre de Voz (Auto-Save):</strong> Nunca mais perca uma ideia por falha na internet ou fechamento acidental. O sistema agora salva cada palavra ditada automaticamente na memória do navegador. Ao reabrir a ferramenta de voz, seu texto estará lá, intacto, esperando por você.</li>
                    <li><strong>NOVO - Visualizador de Onda Sonora:</strong> Chega da dúvida "será que o microfone está ligado?". Uma nova animação de ondas sonoras (Sound Wave) aparece ao lado do ícone, oferecendo feedback visual claro e moderno de que o sistema está ouvindo ativamente.</li>
                </ul>
            `
        },
        {
            version: '1.0.9',
            title: '✨ Clareza Total: Redesign do Criador de Ações Rápidas com Ajuda Integrada',
            content: `
                <ul>
                    <li><strong>NOVO - Layout de Cartões e Organização Visual:</strong> A janela "Criador de Ações Rápidas" foi completamente redesenhada. Cada opção agora é apresentada em um "cartão" individual com separadores visuais, tornando a interface mais limpa, organizada e fácil de navegar.</li>
                    <li><strong>NOVO - Ajuda Contextual e Detalhada:</strong> Chega de dúvidas! Cada cartão agora possui um <strong>ícone de ajuda (i)</strong>. Ao clicar, uma janela se abre com uma explicação detalhada sobre o que a funcionalidade faz, como usá-la e um <strong>exemplo prático de código</strong>, eliminando a confusão entre "Menu de Opções" e "Lógica Condicional".</li>
                    <li><strong>Experiência Aprimorada:</strong> Com o novo design e a ajuda integrada, criar modelos inteligentes tornou-se um processo muito mais intuitivo e guiado, reduzindo a curva de aprendizado e permitindo que você aproveite ao máximo as funcionalidades avançadas.</li>
                </ul>
            `
        },
       {
    version: '1.0.8',
    title: '🚀 Assistente de Lógica Condicional e Simplificação da Interface',
    content: `
        <ul>
            <li><strong>NOVO - Assistente de Lógica Condicional (Se...Então...):</strong> Cansado de decorar a sintaxe <code>{{#if...}}</code>? A nova opção "Lógica Condicional" abre um assistente passo a passo. Basta criar sua pergunta (ex: "Singular ou Plural?"), definir as opções e preencher o texto para cada uma. O sistema monta o código complexo para você, tornando a criação de documentos inteligentes mais rápida e visual do que nunca.</li>
            <li><strong>Interface Simplificada e Intuitiva:</strong> As opções "Número do Processo", "Nome da Parte" e "Status da Decisão" foram removidas da lista de Ações Rápidas. Elas eram redundantes, pois as mesmas funcionalidades podem ser alcançadas de forma mais flexível com as ferramentas "Caixa de Pergunta" e "Menu de Opções". O resultado é uma interface mais limpa e focada no que é essencial.</li>
        </ul>
    `
},
        {
            version: '1.0.7',
            title: '✨ Polimento de Interface e Qualidade de Vida',
            content: `
                <ul>
                    <li><strong>Ícone de Variável Refinado:</strong> O ícone de raio (⚡️) na barra lateral foi ajustado em tamanho e cor (agora fúcsia), garantindo maior consistência visual com os outros elementos da interface.</li>
                    <li><strong>Centralização Inteligente de Modais:</strong> As janelas de diálogo (como "Salvar Modelo") agora aparecem centralizadas sobre a área de edição de texto, e não mais no centro da tela inteira. Isso mantém o foco do usuário onde a ação está ocorrendo.</li>
                    <li><strong>Guia de Funcionalidades Aprimorado:</strong> A janela de ajuda foi otimizada para melhor usabilidade:
                        <ul>
                            <li>Adicionada uma <strong>barra de rolagem</strong> para garantir que todo o conteúdo seja acessível, mesmo em telas menores.</li>
                            <li>Implementado um botão <strong>"Copiar Exemplo"</strong> em cada seção, permitindo que você utilize os códigos de sintaxe avançada de forma rápida e sem erros.</li>
                        </ul>
                    </li>
                </ul>
            `
        },
        {
    version: '1.0.6',
    title: '🚀 Modelos Inteligentes: Lógica Condicional e Agilidade na Criação',
    content: `
        <ul>
            <li><strong>Lógica Condicional ("Se...Então..."):</strong> Crie modelos que se adaptam a diferentes cenários. Use a nova sintaxe <code>{{#if:variavel=valor}}...{{/if}}</code> para lidar com variações como singular/plural ou masculino/feminino em um único modelo, eliminando redundância.</li>
            <li><strong>Criação de Modelos Acelerada:</strong> Ao clicar em "Adicionar", o conteúdo do editor principal é automaticamente transferido para a janela de criação de modelo, economizando tempo e cliques.</li>
            <li><strong>Feedback Visual Aprimorado:</strong>
                <ul>
                    <li><strong>Ícone de Raio (⚡️):</strong> Modelos com variáveis agora são facilmente identificáveis na barra lateral por um novo ícone, substituindo a antiga engrenagem.</li>
                    <li><strong>Realce de Sintaxe:</strong> Dentro do editor de modelos, a sintaxe <code>{{...}}</code> é destacada com um fundo fúcsia pulsante, confirmando seu reconhecimento pelo sistema.</li>
                </ul>
            </li>
            <li><strong>Documentação Atualizada:</strong> O guia de ajuda (ícone 'i') foi atualizado com instruções detalhadas e exemplos da nova e poderosa funcionalidade de lógica condicional.</li>
        </ul>
    `
},
        {
            version: '1.0.5',
            title: '🚀 Aprimoramento de Variáveis de Sistema',
            content: `
                <ul>
                    <li><strong>Clique para Copiar:</strong> Clicar em uma variável de sistema (ex: "Data Atual") na aba Power ⚡️ agora copia seu código (<code>{{data_atual}}</code>) para a área de transferência.</li>
                    <li><strong>Arrastar e Soltar Inteligente:</strong> Arrastar uma variável de sistema para o editor agora insere seu valor final processado (ex: "10/10/2025") em vez do código, agilizando a criação de documentos.</li>
                </ul>
            `
        },
        {
            version: '1.0.4',
            title: '⚡️ Power Tab Overhaul & UX Polish',
            content: `
                <ul>
                    <li><strong>Arrastar e Soltar Inteligente:</strong> Corrigido o comportamento crítico de arrastar e soltar. Agora, ao arrastar uma variável de sistema (como "Data Atual") para o editor, o valor final (ex: "05/09/2024") é inserido, em vez do código <code>{{data_atual}}</code>.</li>
                    <li><strong>Fluxo de Criação Simplificado:</strong> O botão "Adicionar" na aba Power agora funciona de forma intuitiva. Ele abre a janela padrão para criar um <strong>novo modelo rápido</strong>, em vez do antigo pop-up confuso.</li>
                    <li><strong>Clique para Copiar:</strong> Clicar em uma variável de sistema (as tags fúcsia) agora copia seu código (ex: <code>{{hora_atual}}</code>) diretamente para a área de transferência, facilitando a construção de modelos complexos.</li>
                    <li><strong>Consistência Visual:</strong> As variáveis de sistema são apresentadas como "tags" sem botões de ação, reforçando que são elementos nativos e não editáveis, distinguindo-as claramente dos seus modelos personalizados.</li>
                </ul>
            `
        }
    ]
};

const TINYMCE_CONFIG = {
    selector: '#editor',
    
    plugins: 'lists pagebreak visualblocks wordcount',
    
    toolbar: 'undo redo | blocks | bold italic underline | bullist numlist | alignjustify | customIndent customBlockquote | pagebreak visualblocks | customMicButton customAiButton customReplaceButton | customPowerVariableButton | customPasteMarkdown customCopyFormatted customOdtButton | customThemeButton customDeleteButton',
    
    menubar: false,
    statusbar: true,
    
    formats: {
        bold: { inline: 'strong' },
        italic: { inline: 'em' },
        underline: { inline: 'u', exact: true },
    },
    
    content_style: 'body { font-family:Arial,sans-serif; font-size:16px; line-height: 1.5; text-align: justify; color: var(--editor-text-color); } p { margin-bottom: 1em; } blockquote { margin-left: 7cm; margin-right: 0; padding-left: 15px; border-left: 3px solid #ccc; color: #333; font-style: italic; } blockquote p { text-indent: 0 !important; }',
    
    height: "100%",
    autoresize_bottom_margin: 30,

    setup: function(editor) {
        // --- Função Auxiliar para Gerenciar Temas ---
        const applyTheme = (themeName) => {
            const body = document.body;
            // Limpa temas antigos
            body.classList.remove('theme-dark', 'theme-custom-yellow');
            
            // Adiciona o novo tema, se não for o padrão 'claro'
            if (themeName && themeName !== 'light') {
                body.classList.add(themeName);
            }
            
            // Salva a escolha do usuário
            localStorage.setItem('editorTheme', themeName);
        };
        
        // --- Registro de Ícones Customizados ---
        editor.ui.registry.addIcon('custom-mic', ICON_MIC);
        editor.ui.registry.addIcon('custom-ai-brain', ICON_AI_BRAIN);
        editor.ui.registry.addIcon('custom-replace', ICON_REPLACE);
        editor.ui.registry.addIcon('custom-copy-formatted', ICON_COPY_FORMATTED);
        editor.ui.registry.addIcon('custom-download-doc', ICON_DOWNLOAD_DOC);
        editor.ui.registry.addIcon('custom-spinner', ICON_SPINNER);
        editor.ui.registry.addIcon('custom-delete-doc', ICON_DELETE_DOC);
        editor.ui.registry.addIcon('custom-paste-markdown', ICON_PASTE_MARKDOWN);
        editor.ui.registry.addIcon('custom-join-lines', ICON_JOIN_LINES);
        editor.ui.registry.addIcon('custom-lightning', ICON_LIGHTNING);
        editor.ui.registry.addIcon('custom-theme-switcher', ICON_THEME_SWITCHER);

        // --- Definição dos Botões ---

        // Botão para recuo de primeira linha
        editor.ui.registry.addButton('customIndent', {
            icon: 'indent',
            tooltip: 'Recuo da Primeira Linha (3cm)',
            onAction: function() {
                const node = editor.selection.getNode();
                const blockElement = editor.dom.getParents(node, (e) => e.nodeName === 'P' || /^H[1-6]$/.test(e.nodeName), editor.getBody());
                
                if (blockElement.length > 0) {
                    const element = blockElement[0];
                    if (element.style.textIndent) {
                        element.style.textIndent = '';
                    } else {
                        element.style.textIndent = '3cm';
                    }
                }
            }
        });

        // Botão de citação
        editor.ui.registry.addButton('customBlockquote', {
            icon: 'quote',
            tooltip: 'Transformar em citação (7cm + itálico)',
            onAction: function() {
                editor.execCommand('mceBlockQuote');
            }
        });

        // Botão de Ditado por Voz
        editor.ui.registry.addButton('customMicButton', {
            icon: 'custom-mic',
            tooltip: 'Ditar texto',
            onAction: function() {
                if (typeof SpeechDictation !== 'undefined' && SpeechDictation.isSupported()) {
                    SpeechDictation.start();
                } else {
                    NotificationService.show('O reconhecimento de voz não é suportado neste navegador.', 'error');
                }
            }
        });

        // Botão de Ajustar Texto Quebrado (substituindo o de IA)
        editor.ui.registry.addButton('customAiButton', {
            icon: 'custom-join-lines',
            tooltip: 'Ajustar Texto Quebrado (de PDF)',
            onAction: function(api) {
                ModalManager.show({
                    type: 'textFixer',
                    title: 'Ajustar Texto Quebrado',
                    saveButtonText: 'Ajustar e Inserir',
                    onSave: (data) => {
                        if (data.text) {
                            // Lógica principal: remove quebras de linha e espaços extras
                            const textoAjustado = data.text.replace(/\n/g, ' ').trim();
                            
                            // Insere o texto processado no editor
                            editor.execCommand('mceInsertContent', false, textoAjustado);
                            NotificationService.show('Texto ajustado e inserido com sucesso!', 'success');
                        } else {
                            NotificationService.show('Nenhum texto foi inserido na caixa.', 'info');
                        }
                    }
                });
            }
        });

        // Botão de Substituir Termos
        editor.ui.registry.addButton('customReplaceButton', {
            icon: 'custom-replace',
            tooltip: 'Gerenciar Substituições',
            onAction: function () {
                ModalManager.show({
                    type: 'replacementManager',
                    title: 'Gerenciador de Substituições',
                    initialData: { replacements: appState.replacements || [] },
                    onSave: (data) => {
                        modifyDataState(() => {
                            appState.replacements = data.replacements;
                        });
                        NotificationService.show('Regras de substituição salvas!', 'success');
                    }
                });
            }
        });

        // NOVO BOTÃO: Inserir Ação Rápida (Variável Dinâmica)
        editor.ui.registry.addButton('customPowerVariableButton', {
            icon: 'custom-lightning',
            tooltip: 'Inserir Ação Rápida (Variável Dinâmica)',
            onAction: function() {
                ModalManager.show({
                    type: 'powerVariableCreator',
                    title: 'Criador de Ações Rápidas',
                    onSave: (data) => {
                        if (!data || !data.name) {
                            // O usuário pode ter fechado o modal no passo de configuração
                            return;
                        }

                        const blueprint = POWER_VARIABLE_BLUEPRINTS.find(b => b.type === data.type);
                        if (!blueprint) {
                            NotificationService.show('Tipo de ação inválido.', 'error');
                            return;
                        }

                        // Constrói a string da variável (ex: "{{nome:prompt}}")
                        const variableString = blueprint.build(data.name, data.options);

                        // Insere a string gerada no local do cursor do editor
                        editor.execCommand('mceInsertContent', false, variableString);
                        NotificationService.show('Ação Rápida inserida!', 'success');
                    }
                });
            }
        });

        // NOVO BOTÃO: Colar do Markdown
        editor.ui.registry.addButton('customPasteMarkdown', {
            icon: 'custom-paste-markdown',
            tooltip: 'Colar do Markdown',
            onAction: async function() {
                try {
                    const textFromClipboard = await navigator.clipboard.readText();
                    if (textFromClipboard) {
                        const htmlContent = MarkdownConverter.markdownToHtml(textFromClipboard);
                        editor.execCommand('mceInsertContent', false, htmlContent);
                        NotificationService.show('Conteúdo Markdown colado e formatado!', 'success');
                    } else {
                         NotificationService.show('A área de transferência está vazia.', 'info');
                    }
                } catch (error) {
                    console.error('Falha ao ler da área de transferência:', error);
                    NotificationService.show('Não foi possível ler o conteúdo. Verifique as permissões do navegador.', 'error');
                }
            }
        });

        // Botão de Copiar Formatado
        editor.ui.registry.addButton('customCopyFormatted', {
            icon: 'custom-copy-formatted',
            tooltip: 'Copiar como Markdown',
            onAction: async function() {
                try {
                    const htmlContent = editor.getContent();
                    const markdownContent = MarkdownConverter.htmlToMarkdown(htmlContent);
                    
                    await navigator.clipboard.writeText(markdownContent);
                    
                    NotificationService.show('Texto copiado para a área de transferência em formato Markdown!', 'success');
                    
                } catch (error) {
                    console.error('Erro ao copiar como Markdown:', error);
                    NotificationService.show('Ocorreu um erro ao tentar copiar o texto.', 'error');
                }
            }
        });

        // Botão de Download
        editor.ui.registry.addButton('customOdtButton', {
            icon: 'custom-download-doc',
            tooltip: 'Salvar como documento Markdown (.md)',
            onAction: function() {
                const editorContent = editor.getContent();
                try {
                    const markdownContent = MarkdownConverter.htmlToMarkdown(editorContent);
                    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'documento.md';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                } catch (error) {
                    console.error('Erro ao gerar arquivo Markdown:', error);
                    NotificationService.show('Ocorreu um erro ao tentar salvar o documento.', 'error');
                }
            }
        });

        // NOVO BOTÃO: Seletor de Tema
        editor.ui.registry.addMenuButton('customThemeButton', {
            icon: 'custom-theme-switcher',
            tooltip: 'Mudar Tema do Editor',
            fetch: function (callback) {
                const items = [
                    {
                        type: 'menuitem',
                        text: 'Modo Claro (Padrão)',
                        onAction: () => applyTheme('light')
                    },
                    {
                        type: 'menuitem',
                        text: 'Modo Escuro',
                        onAction: () => applyTheme('theme-dark')
                    },
                    {
                        type: 'menuitem',
                        text: 'Amarelo Suave',
                        onAction: () => applyTheme('theme-custom-yellow')
                    }
                ];
                callback(items);
            }
        });
        
        // BOTÃO DE APAGAR DOCUMENTO
        editor.ui.registry.addButton('customDeleteButton', {
            icon: 'custom-delete-doc',
            tooltip: 'Apagar todo o conteúdo',
            onAction: function() {
                NotificationService.showConfirm({
                    message: 'Tem certeza que deseja apagar todo o conteúdo do editor? Esta ação não pode ser desfeita.',
                    onConfirm: () => {
                        editor.setContent('');
                        NotificationService.show('Conteúdo do editor apagado.', 'info');
                    }
                });
            }
        });

        // ADICIONADO: Listener para o atalho da Paleta de Comandos dentro do editor
        editor.on('keydown', function(event) {
            // CORREÇÃO DE ATALHO: Mudado de Ctrl+Alt+P para Ctrl+. para consistência
            if (event.ctrlKey && event.key === '.') {
                event.preventDefault();
                event.stopPropagation();
                if (typeof CommandPalette !== 'undefined' && CommandPalette.open) {
                    CommandPalette.open();
                }
            }
        });

        editor.on('init', () => {
            // Carrega e aplica o tema salvo no LocalStorage
            const savedTheme = localStorage.getItem('editorTheme');
            if (savedTheme) {
                applyTheme(savedTheme);
            }

            // --- INÍCIO DA LÓGICA DO CHANGELOG ---
            try {
                const statusBar = editor.getContainer().querySelector('.tox-statusbar');
                const brandingLink = statusBar.querySelector('.tox-statusbar__branding');
                if (brandingLink) {
                    const versionEl = document.createElement('a');
                    versionEl.className = 'version-changelog-link';
                    versionEl.textContent = `| Versão ${CHANGELOG_DATA.currentVersion}`;
                    versionEl.title = 'Clique para ver o histórico de mudanças';

                    versionEl.onclick = () => {
                        ModalManager.show({
                            type: 'info',
                            title: 'Histórico de Versões',
                            initialData: {
                                title: `Novidades da Versão ${CHANGELOG_DATA.currentVersion}`,
                                cards: CHANGELOG_DATA.history.map(item => ({
                                    title: `Versão ${item.version} - ${item.title}`,
                                    content: item.content
                                }))
                            }
                        });
                    };
                    
                    // Insere o novo elemento logo após o link de branding do TinyMCE
                    brandingLink.parentNode.insertBefore(versionEl, brandingLink.nextSibling);
                }
            } catch (error) {
                console.error("Não foi possível adicionar o link de changelog:", error);
            }
            // --- FIM DA LÓGICA DO CHANGELOG ---
        
            // --- LÓGICA DE INICIALIZAÇÃO DO DITADO POR VOZ (ATUALIZADA) ---
            if (typeof SpeechDictation !== 'undefined' && SpeechDictation.isSupported()) {
                SpeechDictation.init({ 
                    // Elementos existentes
                    micIcon: document.getElementById('dictation-mic-icon'), 
                    langSelect: document.getElementById('dictation-lang-select'), 
                    statusDisplay: document.getElementById('dictation-status'), 
                    dictationModal: document.getElementById('dictation-modal'),
                    toolbarMicButton: editor.getContainer().querySelector('[aria-label="Ditar texto"]'),
                    
                    // NOVOS ELEMENTOS MAPEADOS PARA O BUFFER E ONDA SONORA
                    waveAnimation: document.getElementById('dictation-wave'),
                    textArea: document.getElementById('dictation-textarea'),
                    interimDisplay: document.getElementById('dictation-interim'),
                    saveStatus: document.getElementById('dictation-save-status'),
                    btnInsert: document.getElementById('btn-insert-dictation'),
                    btnClear: document.getElementById('btn-clear-dictation'),

                    // Ação final: inserir no TinyMCE quando o usuário clica em "Inserir"
                    onInsert: (text) => { 
                        editor.execCommand('mceInsertContent', false, text);
                        NotificationService.show('Texto ditado inserido com sucesso!', 'success');
                    } 
                });
                
                // Botão fechar do modal de ditado
                const closeBtn = document.getElementById('dictation-close-btn');
                if (closeBtn) closeBtn.addEventListener('click', () => { 
                    SpeechDictation.stop(); 
                    document.getElementById('dictation-modal').classList.remove('visible'); 
                });
            }
        });

        // ============================ INÍCIO DA LÓGICA DE DRAG & DROP ============================
        // Adiciona um manipulador de eventos 'drop' para capturar o momento em que o usuário
        // solta uma variável de sistema dentro do editor.
        editor.on('drop', function(event) {
            // Previne o comportamento padrão do editor/navegador para que possamos
            // implementar nossa própria lógica customizada.
            event.preventDefault();

            // Pega o ID da variável que foi armazenado durante o evento 'dragstart' em SidebarManager.js
            const modelId = event.dataTransfer.getData('text/plain');
            
            // Verifica se o item arrastado é de fato uma variável de sistema.
            // Se não for, interrompemos a função para não interferir com outros comportamentos (ex: arrastar uma imagem).
            if (!modelId || !modelId.startsWith('system-var-')) {
                return;
            }

            // Extrai o tipo da variável do ID (ex: 'data_atual' de 'system-var-data_atual').
            const type = modelId.replace('system-var-', '');
            const blueprint = POWER_VARIABLE_BLUEPRINTS.find(bp => bp.type === type);
            
            if (blueprint) {
                // Cria um modelo temporário contendo apenas o código da variável (ex: {{data_atual}}).
                const tempModel = { content: blueprint.build(blueprint.label) };
                
                // Usa a função global _processSystemVariables (de script.js) para converter o código no seu valor final.
                const processedContent = _processSystemVariables(tempModel.content);
                
                // Insere o conteúdo JÁ PROCESSADO na posição do cursor no editor.
                editor.execCommand('mceInsertContent', false, processedContent);
            }
        });
        // ============================ FIM DA LÓGICA DE DRAG & DROP ============================
        
        // --- LÓGICA DE DETECÇÃO AUTOMÁTICA DE MARKDOWN (CORRIGIDA) ---
        editor.on('paste_preprocess', function (plugin, args) {
            // Para contornar a limpeza do TinyMCE, extraímos o texto puro
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = args.content;
            const plainText = tempDiv.textContent || "";

            // Critérios de detecção aplicados no texto puro
            const isLikelyMarkdown = (
                /[*_#`[\]()~-]/.test(plainText) && // Contém caracteres de Markdown
                plainText.length > 5 && // Não é muito curto
                // Evita converter trechos de código ou URLs que contenham os caracteres
                !/https?:\/\//.test(plainText)
            );

            if (isLikelyMarkdown) {
                // Convertemos o texto PURO, não o conteúdo já processado pelo TinyMCE
                const htmlContent = MarkdownConverter.markdownToHtml(plainText);
                
                // Substituímos o conteúdo a ser colado pelo nosso HTML convertido
                args.content = htmlContent;
                NotificationService.show('Conteúdo Markdown colado e formatado!', 'info', 2500);
            }
        });

        // --- LÓGICA DE SUBSTITUIÇÃO AUTOMÁTICA ---
        editor.on('keyup', function(e) {
            if (e.keyCode !== 32 && e.keyCode !== 13) return; // Só continua para Espaço ou Enter
            if (!appState.replacements || appState.replacements.length === 0) return;

            const rng = editor.selection.getRng();
            const startNode = rng.startContainer;
            const startOffset = rng.startOffset;

            if (startNode.nodeType !== Node.TEXT_NODE) return;
            
            const textBeforeCursor = startNode.nodeValue.substring(0, startOffset);
            
            const sortedRules = [...appState.replacements].sort((a, b) => b.find.length - a.find.length);

            for (const rule of sortedRules) {
                const triggerNormalSpace = rule.find + ' ';
                const triggerNbsp = rule.find + '\u00A0';

                let triggerFound = null;
                if (textBeforeCursor.endsWith(triggerNormalSpace)) {
                    triggerFound = triggerNormalSpace;
                } else if (textBeforeCursor.endsWith(triggerNbsp)) {
                    triggerFound = triggerNbsp;
                }
                
                if (triggerFound) {
                    const replaceRng = document.createRange();
                    replaceRng.setStart(startNode, startOffset - triggerFound.length);
                    replaceRng.setEnd(startNode, startOffset);

                    editor.selection.setRng(replaceRng);
                    editor.selection.setContent(rule.replace + '\u00A0'); 

                    return;
                }
            }
        });
    }
};
