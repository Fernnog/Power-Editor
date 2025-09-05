const TINYMCE_CONFIG = {
    selector: '#editor',
    
    plugins: 'lists autoresize pagebreak visualblocks',
    
    toolbar: 'undo redo | blocks | bold italic underline | bullist numlist | alignjustify | customIndent customBlockquote | pagebreak visualblocks | customMicButton customAiButton customReplaceButton customCopyFormatted customOdtButton',
    
    menubar: false,
    statusbar: false,
    
    content_style: 'body { font-family:Arial,sans-serif; font-size:16px; line-height: 1.5; text-align: justify; } p { margin-bottom: 1em; } blockquote { margin-left: 7cm; margin-right: 0; padding-left: 15px; border-left: 3px solid #ccc; color: #333; font-style: italic; } blockquote p { text-indent: 0 !important; }',
    
    height: "100%",
    autoresize_bottom_margin: 30,

    setup: function(editor) {
        // --- Ícone de Carregamento para a função de IA ---
        const ICON_SPINNER = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`;

        // --- PASSO 1: Registrar todos os ícones customizados no catálogo do editor ---
        editor.ui.registry.addIcon('custom-spinner', ICON_SPINNER);
        editor.ui.registry.addIcon('custom-mic', ICON_MIC);
        editor.ui.registry.addIcon('custom-ai-brain', ICON_AI_BRAIN);
        editor.ui.registry.addIcon('custom-replace', ICON_REPLACE);
        editor.ui.registry.addIcon('custom-copy-formatted', ICON_COPY_FORMATTED);
        editor.ui.registry.addIcon('custom-download-doc', ICON_DOWNLOAD_DOC);

        // --- PASSO 2: Criar os botões da barra de ferramentas usando os ícones registrados ---
        
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

        // Botão de citação personalizado
        editor.ui.registry.addButton('customBlockquote', {
            icon: 'quote',
            tooltip: 'Transformar em citação (7cm + itálico)',
            onAction: function() {
                editor.execCommand('mceBlockQuote');
            }
        });

        // Botão de Ditado por Voz (Microfone)
        editor.ui.registry.addButton('customMicButton', {
            icon: 'custom-mic',
            tooltip: 'Ditar texto',
            onAction: function() {
                if (typeof SpeechDictation !== 'undefined' && SpeechDictation.isSupported()) {
                    SpeechDictation.start();
                } else {
                    alert('O reconhecimento de voz não é suportado neste navegador.');
                }
            }
        });

        // Botão de Correção com IA (com feedback de carregamento)
        editor.ui.registry.addButton('customAiButton', {
            icon: 'custom-ai-brain',
            tooltip: 'Corrigir Texto com IA',
            onAction: async function(api) {
                if (typeof CONFIG === 'undefined' || !CONFIG.apiKey || CONFIG.apiKey === "SUA_CHAVE_API_VAI_AQUI") {
                    alert("Erro de configuração: A chave de API não foi encontrada. Verifique o arquivo js/config.js");
                    return;
                }
                
                const selectedText = editor.selection.getContent({ format: 'text' });
                if (!selectedText) {
                    alert("Por favor, selecione o texto que deseja corrigir.");
                    return;
                }
                
                editor.formatter.register('ia_processing_marker', { inline: 'span', classes: 'ia-processing' });
                
                try {
                    api.setEnabled(false);
                    api.setIcon('custom-spinner');
                    const buttonElement = api.getEl();
                    if(buttonElement) buttonElement.classList.add('spinner');

                    editor.formatter.apply('ia_processing_marker');
                    
                    const correctedText = await GeminiService.correctText(selectedText, CONFIG.apiKey);
                    
                    editor.formatter.remove('ia_processing_marker');
                    editor.selection.setContent(correctedText);
                    
                } catch (error) {
                    console.error("Erro na correção de texto:", error);
                    editor.formatter.remove('ia_processing_marker');
                    alert('Ocorreu um erro ao corrigir o texto. Veja o console para detalhes.');
                } finally {
                    const buttonElement = api.getEl();
                    if(buttonElement) buttonElement.classList.remove('spinner');
                    api.setIcon('custom-ai-brain');
                    api.setEnabled(true);
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
                    }
                });
            }
        });

        // Botão de Copiar Formatado
        editor.ui.registry.addButton('customCopyFormatted', {
            icon: 'custom-copy-formatted',
            tooltip: 'Copiar Formatado (compatível com Google Docs)',
            onAction: function() { /* Lógica existente */ }
        });

        // Botão de Download
        editor.ui.registry.addButton('customOdtButton', {
            icon: 'custom-download-doc',
            tooltip: 'Salvar como documento (.odt/.rtf)',
            onAction: function() { /* Lógica existente */ }
        });
        
        // Inicialização de funcionalidades auxiliares do editor
        editor.on('init', () => {
            if (typeof SpeechDictation !== 'undefined' && SpeechDictation.isSupported()) {
                SpeechDictation.init({ 
                    micIcon: document.getElementById('dictation-mic-icon'), 
                    langSelect: document.getElementById('dictation-lang-select'), 
                    statusDisplay: document.getElementById('dictation-status'), 
                    dictationModal: document.getElementById('dictation-modal'),
                    toolbarMicButton: editor.getContainer().querySelector('[aria-label="Ditar texto"]'),
                    onResult: (transcript) => { 
                        editor.execCommand('mceInsertContent', false, transcript); 
                    } 
                });
                
                const closeBtn = document.getElementById('dictation-close-btn');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => { 
                        SpeechDictation.stop(); 
                    }); 
                }
            }
        });
    }
};
