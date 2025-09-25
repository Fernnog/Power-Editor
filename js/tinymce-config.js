// js/tinymce-config.js

const TINYMCE_CONFIG = {
    selector: '#editor',
    
    plugins: 'lists pagebreak visualblocks wordcount paste', // Plugin 'paste' é necessário para paste_preprocess
    
    toolbar: 'undo redo | blocks | bold italic underline | bullist numlist | alignjustify | customIndent customBlockquote | pagebreak visualblocks | customMicButton customAiButton customReplaceButton customCopyFormatted customOdtButton | customDeleteButton',
    
    menubar: false,
    statusbar: true,
    
    content_style: 'body { font-family:Arial,sans-serif; font-size:16px; line-height: 1.5; text-align: justify; } p { margin-bottom: 1em; } blockquote { margin-left: 7cm; margin-right: 0; padding-left: 15px; border-left: 3px solid #ccc; color: #333; font-style: italic; } blockquote p { text-indent: 0 !important; }',
    
    height: "100%",
    autoresize_bottom_margin: 30,

    setup: function(editor) {
        // --- Registro de Ícones Customizados ---
        editor.ui.registry.addIcon('custom-mic', ICON_MIC);
        editor.ui.registry.addIcon('custom-ai-brain', ICON_AI_BRAIN);
        editor.ui.registry.addIcon('custom-replace', ICON_REPLACE);
        editor.ui.registry.addIcon('custom-copy-formatted', ICON_COPY_FORMATTED);
        editor.ui.registry.addIcon('custom-download-doc', ICON_DOWNLOAD_DOC);
        editor.ui.registry.addIcon('custom-spinner', ICON_SPINNER);
        editor.ui.registry.addIcon('custom-delete-doc', ICON_DELETE_DOC);

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

        // Botão de Correção com IA
        editor.ui.registry.addButton('customAiButton', {
            icon: 'custom-ai-brain',
            tooltip: 'Corrigir Texto com IA',
            onAction: async function(api) {
                if (typeof CONFIG === 'undefined' || !CONFIG.apiKey || CONFIG.apiKey === "SUA_CHAVE_API_VAI_AQUI") {
                    NotificationService.show("Erro: A chave de API não foi encontrada. Verifique o arquivo js/config.js.", 'error', 6000);
                    return;
                }
                
                const selectedText = editor.selection.getContent({ format: 'text' });
                if (!selectedText) {
                    NotificationService.show("Por favor, selecione o texto que deseja corrigir.", 'info');
                    return;
                }
                
                editor.formatter.register('ia_processing_marker', { inline: 'span', classes: 'ia-processing' });
                
                try {
                    api.setEnabled(false);
                    api.setIcon('custom-spinner');

                    editor.formatter.apply('ia_processing_marker');
                    
                    const correctedText = await GeminiService.correctText(selectedText, CONFIG.apiKey);
                    
                    editor.formatter.remove('ia_processing_marker');
                    editor.selection.setContent(correctedText);
                    
                } catch (error) {
                    console.error("Erro na correção de texto:", error);
                    editor.formatter.remove('ia_processing_marker');
                    NotificationService.show('Ocorreu um erro ao corrigir o texto. Veja o console para detalhes.', 'error');
                } finally {
                    api.setEnabled(true);
                    api.setIcon('custom-ai-brain');
                }
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
                        modifyStateAndBackup(() => {
                            appState.replacements = data.replacements;
                        });
                        NotificationService.show('Regras de substituição salvas!', 'success');
                    }
                });
            }
        });

        // Botão de Copiar Formatado (MODIFICADO PARA MARKDOWN)
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

        // Botão de Download (MODIFICADO PARA MARKDOWN)
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

        editor.on('init', () => {
            if (typeof SpeechDictation !== 'undefined' && SpeechDictation.isSupported()) {
                SpeechDictation.init({ 
                    micIcon: document.getElementById('dictation-mic-icon'), 
                    langSelect: document.getElementById('dictation-lang-select'), 
                    statusDisplay: document.getElementById('dictation-status'), 
                    dictationModal: document.getElementById('dictation-modal'),
                    toolbarMicButton: editor.getContainer().querySelector('[aria-label="Ditar texto"]'),
                    onResult: (transcript) => { editor.execCommand('mceInsertContent', false, transcript); } 
                });
                const closeBtn = document.getElementById('dictation-close-btn');
                if (closeBtn) closeBtn.addEventListener('click', () => { SpeechDictation.stop(); });
            }
        });
        
        // --- NOVA LÓGICA PARA COLAR MARKDOWN ---
        editor.on('paste_preprocess', function (plugin, args) {
            const pastedText = args.content;
            // Verifica se o texto colado parece ser Markdown (contém caracteres especiais de MD)
            // e não contém tags HTML, para evitar dupla conversão.
            const isLikelyMarkdown = /[*_#`[\]()~]/.test(pastedText) && !/<[a-z][\s\S]*>/i.test(pastedText);

            if (isLikelyMarkdown) {
                // Converte o texto Markdown colado para HTML usando o novo módulo
                const htmlContent = MarkdownConverter.markdownToHtml(pastedText);
                // Substitui o conteúdo da área de transferência pelo HTML convertido
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
