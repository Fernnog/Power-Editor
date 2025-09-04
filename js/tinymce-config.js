const TINYMCE_CONFIG = {
    selector: '#editor',
    
    // Plugins adicionados: 'pagebreak' e 'hr' (simuladores de régua) e 'visualblocks' (melhoria de UX)
    plugins: 'lists autoresize pagebreak hr visualblocks',
    
    // Botões adicionados à barra de ferramentas para os novos plugins
    toolbar: 'undo redo | blocks | bold italic underline | bullist numlist | alignjustify | customIndent blockquote | hr pagebreak visualblocks | customMicButton customAiButton customReplaceButton customOdtButton',
    
    menubar: false,
    statusbar: false,
    
    // Regra de estilo corrigida: garante que o recuo da citação (7cm) não acumule com o recuo de primeira linha
    content_style: 'body { font-family:Arial,sans-serif; font-size:16px; line-height: 1.5; text-align: justify; } p { margin-bottom: 1em; } blockquote { margin-left: 7cm; margin-right: 0; padding-left: 15px; border-left: 3px solid #ccc; color: #333; font-style: italic; } blockquote p { text-indent: 0 !important; }',
    
    height: 600,
    autoresize_bottom_margin: 30,

    setup: function(editor) {
        // Botão para recuo de primeira linha (lógica original mantida)
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

        // Botão de Ditado por Voz (Microfone)
        editor.ui.registry.addButton('customMicButton', {
            text: '🎤',
            tooltip: 'Ditar texto',
            onAction: function() {
                if (typeof SpeechDictation !== 'undefined' && SpeechDictation.isSupported()) {
                    SpeechDictation.start();
                } else {
                    alert('O reconhecimento de voz não é suportado neste navegador.');
                }
            }
        });

        // Botão de Correção com IA
        editor.ui.registry.addButton('customAiButton', {
            text: '✨',
            tooltip: 'Corrigir Texto com IA',
            onAction: async function() {
                if (typeof CONFIG === 'undefined' || !CONFIG.apiKey || CONFIG.apiKey === "SUA_CHAVE_API_VAI_AQUI") {
                    alert("Erro de configuração: A chave de API não foi encontrada. Verifique o arquivo js/config.js");
                    return;
                }
                const selectedText = editor.selection.getContent({ format: 'text' });
                if (!selectedText) {
                    alert("Por favor, selecione o texto que deseja corrigir.");
                    return;
                }
                const button = this;
                button.setEnabled(false);
                const correctedText = await GeminiService.correctText(selectedText, CONFIG.apiKey);
                editor.selection.setContent(correctedText);
                button.setEnabled(true);
            }
        });

        // Botão de Substituir Termos
        editor.ui.registry.addButton('customReplaceButton', {
            text: 'A→B',
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

        // Botão de Download .ODT
        editor.ui.registry.addButton('customOdtButton', {
            icon: 'download',
            tooltip: 'Salvar como .odt (OpenOffice)',
            onAction: function() {
                const editorContent = editor.getContent();
                const fullHtml = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Documento</title></head><body>${editorContent}</body></html>`;
                const blob = new Blob([fullHtml], { type: 'application/vnd.oasis.opendocument.text' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'documento.odt';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        });
        
        // Inicialização do módulo de Ditado
        if (typeof SpeechDictation !== 'undefined' && SpeechDictation.isSupported()) {
            SpeechDictation.init({ 
                micIcon: document.getElementById('dictation-mic-icon'), 
                langSelect: document.getElementById('dictation-lang-select'), 
                statusDisplay: document.getElementById('dictation-status'), 
                dictationModal: document.getElementById('dictation-modal'),
                onResult: (transcript) => { 
                    editor.execCommand('mceInsertContent', false, transcript + ' '); 
                } 
            });
            
            document.getElementById('dictation-close-btn').addEventListener('click', () => { 
                SpeechDictation.stop(); 
            }); 
        }
    }
};