// js/tinymce-config.js

const TINYMCE_CONFIG = {
    selector: '#editor',
    
    plugins: 'lists pagebreak visualblocks wordcount',
    
    // ATUALIZADO: Incluído 'customGrammarFixButton' na toolbar
    toolbar: 'undo redo | blocks | bold italic underline | bullist numlist | alignjustify | customIndent customBlockquote | pagebreak visualblocks | customMicButton customAiButton customReplaceButton customGrammarFixButton | customPowerVariableButton | customPasteMarkdown customCopyFormatted customOdtButton | customThemeButton customDeleteButton',
    
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

        // Botão de Ajustar Texto Quebrado
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
                            const textoAjustado = data.text.replace(/\n/g, ' ').trim();
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

        // ADICIONADO: Novo botão de correção gramatical via IA
        editor.ui.registry.addButton('customGrammarFixButton', {
            icon: 'custom-ai-brain',
            tooltip: 'Corrigir Gramática do Texto Selecionado',
            onAction: async function() {
                const selectedText = editor.selection.getContent({format: 'text'}).trim();

                if (!selectedText) {
                    NotificationService.show('Por favor, selecione um trecho de texto para corrigir.', 'info');
                    return;
                }

                if (typeof GeminiService === 'undefined' || !GeminiService.correctText) {
                    NotificationService.show('O serviço de IA não está disponível no momento.', 'error');
                    return;
                }

                try {
                    NotificationService.show('A IA está corrigindo a gramática. Aguarde...', 'info', 2000);
                    
                    const correctedText = await GeminiService.correctText(selectedText);
                    
                    editor.selection.setContent(correctedText);
                    NotificationService.show('Texto corrigido com sucesso!', 'success');

                } catch (error) {
                    console.error("Erro ao corrigir texto:", error);
                    NotificationService.show('Ocorreu um erro ao tentar corrigir o texto. Tente novamente.', 'error');
                }
            }
        });

        // Botão: Inserir Ação Rápida (Variável Dinâmica)
        editor.ui.registry.addButton('customPowerVariableButton', {
            icon: 'custom-lightning',
            tooltip: 'Inserir Ação Rápida (Variável Dinâmica)',
            onAction: function() {
                ModalManager.show({
                    type: 'powerVariableCreator',
                    title: 'Criador de Ações Rápidas',
                    onSave: (data) => {
                        if (!data || !data.name) return;

                        const blueprint = POWER_VARIABLE_BLUEPRINTS.find(b => b.type === data.type);
                        if (!blueprint) {
                            NotificationService.show('Tipo de ação inválido.', 'error');
                            return;
                        }

                        const variableString = blueprint.build(data.name, data.options);
                        editor.execCommand('mceInsertContent', false, variableString);
                        NotificationService.show('Ação Rápida inserida!', 'success');
                    }
                });
            }
        });

        // Botão: Colar do Markdown
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
                    NotificationService.show('Não foi possível ler o conteúdo.', 'error');
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
                    NotificationService.show('Texto copiado em formato Markdown!', 'success');
                } catch (error) {
                    console.error('Erro ao copiar como Markdown:', error);
                    NotificationService.show('Erro ao tentar copiar o texto.', 'error');
                }
            }
        });

        // Botão de Download (.md)
        editor.ui.registry.addButton('customOdtButton', {
            icon: 'custom-download-doc',
            tooltip: 'Salvar como documento Markdown (.md)',
            onAction: function() {
                const editorContent = editor.getContent();
                try {
                    let fileName = prompt("Digite o nome do arquivo para salvar:", "meu_documento");
                    if (fileName === null) return; 
                    
                    fileName = fileName.trim() || 'documento_sem_nome';
                    if (!fileName.toLowerCase().endsWith('.md')) fileName += '.md';

                    const markdownContent = MarkdownConverter.htmlToMarkdown(editorContent);
                    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                } catch (error) {
                    console.error('Erro ao gerar arquivo Markdown:', error);
                    NotificationService.show('Erro ao tentar salvar o documento.', 'error');
                }
            }
        });

        // Seletor de Tema
        editor.ui.registry.addMenuButton('customThemeButton', {
            icon: 'custom-theme-switcher',
            tooltip: 'Mudar Tema do Editor',
            fetch: function (callback) {
                const items = [
                    { type: 'menuitem', text: 'Modo Claro (Padrão)', onAction: () => applyTheme('light') },
                    { type: 'menuitem', text: 'Modo Escuro', onAction: () => applyTheme('theme-dark') },
                    { type: 'menuitem', text: 'Amarelo Suave', onAction: () => applyTheme('theme-custom-yellow') }
                ];
                callback(items);
            }
        });
        
        // Botão de Apagar Documento
        editor.ui.registry.addButton('customDeleteButton', {
            icon: 'custom-delete-doc',
            tooltip: 'Apagar todo o conteúdo',
            onAction: function() {
                NotificationService.showConfirm({
                    message: 'Tem certeza que deseja apagar todo o conteúdo? Esta ação é irreversível.',
                    onConfirm: () => {
                        editor.setContent('');
                        NotificationService.show('Conteúdo do editor apagado.', 'info');
                    }
                });
            }
        });

        // Atalho Ctrl + .
        editor.on('keydown', function(event) {
            if (event.ctrlKey && event.key === '.') {
                event.preventDefault();
                event.stopPropagation();
                if (typeof CommandPalette !== 'undefined' && CommandPalette.open) {
                    CommandPalette.open();
                }
            }
        });

        editor.on('init', () => {
            const savedTheme = localStorage.getItem('editorTheme');
            if (savedTheme) applyTheme(savedTheme);

            if (typeof ChangelogManager !== 'undefined') ChangelogManager.init(editor);
        
            if (typeof SpeechDictation !== 'undefined' && SpeechDictation.isSupported()) {
                SpeechDictation.init({ 
                    micIcon: document.getElementById('dictation-mic-icon'), 
                    langSelect: document.getElementById('dictation-lang-select'), 
                    statusDisplay: document.getElementById('dictation-status'), 
                    dictationModal: document.getElementById('dictation-modal'),
                    toolbarMicButton: editor.getContainer().querySelector('[aria-label="Ditar texto"]'),
                    waveAnimation: document.getElementById('dictation-wave'),
                    textArea: document.getElementById('dictation-textarea'),
                    interimDisplay: document.getElementById('dictation-interim'),
                    saveStatus: document.getElementById('dictation-save-status'),
                    btnClear: document.getElementById('btn-clear-dictation'),
                    btnInsertRaw: document.getElementById('btn-insert-raw'),
                    btnInsertFix: document.getElementById('btn-insert-fix'),
                    btnInsertLegal: document.getElementById('btn-insert-legal'),
                    onInsert: (text) => { 
                        editor.execCommand('mceInsertContent', false, text);
                        NotificationService.show('Texto inserido com sucesso!', 'success');
                    } 
                });
                
                const closeBtn = document.getElementById('dictation-close-btn');
                if (closeBtn) closeBtn.addEventListener('click', () => { 
                    SpeechDictation.stop(); 
                    document.getElementById('dictation-modal').classList.remove('visible'); 
                });
            }
        });

        // Drag & Drop
        editor.on('drop', function(event) {
            event.preventDefault();
            const modelId = event.dataTransfer.getData('text/plain');
            if (!modelId || !modelId.startsWith('system-var-')) return;

            const type = modelId.replace('system-var-', '');
            const blueprint = POWER_VARIABLE_BLUEPRINTS.find(bp => bp.type === type);
            if (blueprint) {
                const tempModel = { content: blueprint.build(blueprint.label) };
                const processedContent = _processSystemVariables(tempModel.content);
                editor.execCommand('mceInsertContent', false, processedContent);
            }
        });
        
        // Detecção Automática de Markdown no Paste
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
                NotificationService.show('Markdown detectado e formatado!', 'info', 2500);
            }
        });

        // Substituição Automática (Texto Rápido)
        editor.on('keyup', function(e) {
            if (e.keyCode !== 32 && e.keyCode !== 13) return; 
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
                let triggerFound = textBeforeCursor.endsWith(triggerNormalSpace) ? triggerNormalSpace : (textBeforeCursor.endsWith(triggerNbsp) ? triggerNbsp : null);
                
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
