const TINYMCE_CONFIG = {
    selector: '#editor',
    
    plugins: 'lists autoresize pagebreak visualblocks',
    
    toolbar: 'undo redo | blocks | bold italic underline | bullist numlist | alignjustify | customIndent blockquote | pagebreak visualblocks | customMicButton customAiButton customReplaceButton customOdtButton',
    
    menubar: false,
    statusbar: false,
    
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

        // Botão de Correção com IA (VERSÃO CORRIGIDA)
        editor.ui.registry.addButton('customAiButton', {
            text: 'A✓',
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
                
                // Obter referência ao botão e adicionar classe de processamento
                const aiButton = editor.getContainer().querySelector('[title="Corrigir Texto com IA"]');
                
                try {
                    // Adicionar classe de processamento
                    if (aiButton) aiButton.classList.add('processing');
                    
                    // Adiciona uma classe CSS ao texto selecionado para feedback visual
                    const range = editor.selection.getRng();
                    const span = editor.dom.create('span', { class: 'ia-processing' });
                    range.surroundContents(span);
                    
                    const correctedText = await GeminiService.correctText(selectedText, CONFIG.apiKey);
                    
                    // Remove o feedback visual e substitui o texto
                    editor.dom.remove(span);
                    editor.selection.setContent(correctedText);
                    
                } catch (error) {
                    console.error("Erro na correção de texto:", error);
                    // Remove o feedback visual em caso de erro
                    const processingElements = editor.dom.select('.ia-processing');
                    processingElements.forEach(el => editor.dom.unwrap(el));
                } finally {
                    // Remover classe de processamento
                    if (aiButton) aiButton.classList.remove('processing');
                }
            }
        });

        // Botão de Substituir Termos
        editor.ui.registry.addButton('customReplaceButton', {
            text: 'A↔B',
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
            text: '📄',
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
        
        // --- INÍCIO DO NOVO CÓDIGO DA RÉGUA ---

        let horizontalMarker, verticalMarker;

        editor.on('init', () => {
            const rulerH = document.getElementById('ruler-horizontal');
            const rulerV = document.getElementById('ruler-vertical');

            // Cria os marcadores visuais
            horizontalMarker = document.createElement('div');
            horizontalMarker.className = 'ruler-marker';
            rulerH.appendChild(horizontalMarker);

            verticalMarker = document.createElement('div');
            verticalMarker.className = 'ruler-marker';
            rulerV.appendChild(verticalMarker);
            
            // Estilo para os marcadores (adicionado via JS para simplicidade)
            const markerStyle = document.createElement('style');
            markerStyle.innerHTML = `
                .ruler-marker {
                    position: absolute;
                    background-color: rgba(206, 42, 102, 0.6); /* Cor primária com transparência */
                    z-index: 6;
                    display: none; /* Começa escondido */
                }
                #ruler-horizontal .ruler-marker {
                    top: 0;
                    width: 1px;
                    height: 100%;
                }
                #ruler-vertical .ruler-marker {
                    left: 0;
                    width: 100%;
                    height: 1px;
                }
            `;
            document.head.appendChild(markerStyle);

            // Inicialização do módulo de Ditado (movido para dentro do evento 'init')
            if (typeof SpeechDictation !== 'undefined' && SpeechDictation.isSupported()) {
                SpeechDictation.init({ 
                    micIcon: document.getElementById('dictation-mic-icon'), 
                    langSelect: document.getElementById('dictation-lang-select'), 
                    statusDisplay: document.getElementById('dictation-status'), 
                    dictationModal: document.getElementById('dictation-modal'),
                    toolbarMicButton: editor.getContainer().querySelector('[title="Ditar texto"]'),
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

        // Evento que dispara sempre que o cursor muda de posição
        editor.on('NodeChange', (e) => {
            if (!horizontalMarker) return;

            // Pega as coordenadas do editor e do cursor
            const editorRect = editor.getContainer().getBoundingClientRect();
            const cursorRect = editor.selection.getRng().getBoundingClientRect();

            // Calcula a posição relativa do cursor dentro do editor
            const cursorX = cursorRect.left - editorRect.left;
            const cursorY = cursorRect.top - editorRect.top;

            // Mostra e posiciona os marcadores
            horizontalMarker.style.display = 'block';
            verticalMarker.style.display = 'block';
            horizontalMarker.style.transform = `translateX(${cursorX}px)`;
            verticalMarker.style.transform = `translateY(${cursorY}px)`;
        });

        // --- FIM DO NOVO CÓDIGO DA RÉGUA ---
    }
};
