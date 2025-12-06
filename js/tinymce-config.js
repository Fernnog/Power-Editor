// js/tinymce-config.js

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
        // (Nota: As constantes ICON_... devem estar definidas no arquivo ui-icons.js carregado antes deste)
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
            // Atalho Ctrl + .
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

            // --- LÓGICA DO CHANGELOG (SEPARADA) ---
            if (typeof ChangelogManager !== 'undefined') {
                ChangelogManager.init(editor);
            }
        
            // --- LÓGICA DE INICIALIZAÇÃO DO DITADO POR VOZ ---
            if (typeof SpeechDictation !== 'undefined' && SpeechDictation.isSupported()) {
                SpeechDictation.init({ 
                    // Elementos existentes
                    micIcon: document.getElementById('dictation-mic-icon'), 
                    langSelect: document.getElementById('dictation-lang-select'), 
                    statusDisplay: document.getElementById('dictation-status'), 
                    dictationModal: document.getElementById('dictation-modal'),
                    toolbarMicButton: editor.getContainer().querySelector('[aria-label="Ditar texto"]'),
                    
                    // Elementos visuais (Buffer e Onda)
                    waveAnimation: document.getElementById('dictation-wave'),
                    textArea: document.getElementById('dictation-textarea'),
                    interimDisplay: document.getElementById('dictation-interim'),
                    saveStatus: document.getElementById('dictation-save-status'),
                    btnClear: document.getElementById('btn-clear-dictation'),
                    
                    // NOVOS BOTÕES (RAW, FIX, LEGAL)
                    btnInsertRaw: document.getElementById('btn-insert-raw'),
                    btnInsertFix: document.getElementById('btn-insert-fix'),
                    btnInsertLegal: document.getElementById('btn-insert-legal'),

                    // Ação final: inserir no TinyMCE
                    onInsert: (text) => { 
                        editor.execCommand('mceInsertContent', false, text);
                        NotificationService.show('Texto inserido com sucesso!', 'success');
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
        editor.on('drop', function(event) {
            event.preventDefault();
            const modelId = event.dataTransfer.getData('text/plain');
            
            if (!modelId || !modelId.startsWith('system-var-')) {
                return;
            }

            const type = modelId.replace('system-var-', '');
            const blueprint = POWER_VARIABLE_BLUEPRINTS.find(bp => bp.type === type);
            
            if (blueprint) {
                const tempModel = { content: blueprint.build(blueprint.label) };
                const processedContent = _processSystemVariables(tempModel.content);
                editor.execCommand('mceInsertContent', false, processedContent);
            }
        });
        // ============================ FIM DA LÓGICA DE DRAG & DROP ============================
        
        // --- LÓGICA DE DETECÇÃO AUTOMÁTICA DE MARKDOWN ---
        editor.on('paste_preprocess', function (plugin, args) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = args.content;
            const plainText = tempDiv.textContent || "";

            const isLikelyMarkdown = (
                /[*_#`[\]()~-]/.test(plainText) &&
                plainText.length > 5 &&
                !/https?:\/\//.test(plainText)
            );

            if (isLikelyMarkdown) {
                const htmlContent = MarkdownConverter.markdownToHtml(plainText);
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
