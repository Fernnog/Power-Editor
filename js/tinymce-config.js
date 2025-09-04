Arquivo: js/tinymce-config.js
const TINYMCE_CONFIG = {
    selector: '#editor',
plugins: 'lists autoresize pagebreak visualblocks',

toolbar: 'undo redo | blocks | bold italic underline | bullist numlist | alignjustify | customIndent customBlockquote | pagebreak visualblocks | customMicButton customAiButton customReplaceButton customOdtButton',

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

    // Botão de citação personalizado com 7cm e itálico
    editor.ui.registry.addButton('customBlockquote', {
        icon: 'quote',
        tooltip: 'Transformar em citação (7cm + itálico)',
        onAction: function() {
            const selectedNode = editor.selection.getNode();

            // Verifica se já está em um blockquote
            if (selectedNode.closest('blockquote')) {
                // Se já é blockquote, remove a formatação
                editor.execCommand('mceBlockQuote');
            } else {
                // Aplica blockquote e força os estilos corretos
                editor.execCommand('mceBlockQuote');

                // Força aplicação dos estilos após comando
                setTimeout(() => {
                    const blockquote = editor.selection.getNode().closest('blockquote');
                    if (blockquote) {
                        editor.dom.setStyle(blockquote, 'margin-left', '7cm');
                        editor.dom.setStyle(blockquote, 'margin-right', '0');
                        editor.dom.setStyle(blockquote, 'font-style', 'italic');
                        editor.dom.setStyle(blockquote, 'padding-left', '15px');
                        editor.dom.setStyle(blockquote, 'border-left', '3px solid #ccc');
                        editor.dom.setStyle(blockquote, 'color', '#333');

                        // Remove recuo de primeira linha de parágrafos dentro da citação
                        const paragraphs = editor.dom.select('p', blockquote);
                        paragraphs.forEach(p => {
                            editor.dom.setStyle(p, 'text-indent', '0');
                        });
                    }
                }, 10);
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

    // Botão de Download ODT Corrigido
    editor.ui.registry.addButton('customOdtButton', {
        text: '📄',
        tooltip: 'Salvar como documento (.odt/.rtf)',
        onAction: function() {
            const editorContent = editor.getContent();

            try {
                // Gera arquivo ODT válido usando estrutura XML apropriada
                const odtXmlContent = generateValidODTContent(editorContent);

                // Tenta criar um ODT real se possível, senão fallback para RTF
                if (typeof JSZip !== 'undefined') {
                    createODTFile(odtXmlContent);
                } else {
                    // Fallback: gera RTF compatível com Word
                    createRTFFile(editorContent);
                }

            } catch (error) {
                console.error('Erro ao gerar arquivo:', error);
                // Em caso de erro, gera um arquivo RTF simples
                createRTFFile(editorContent);
            }
        }
    });

    // Funções auxiliares para geração de arquivos ODT/RTF
    function generateValidODTContent(htmlContent) {
        // Remove tags HTML e converte para texto estruturado
        const textContent = htmlContent
            .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gs, (match, content) => {
                return `[CITAÇÃO]${content.replace(/<[^>]*>/g, '')}[/CITAÇÃO]`;
            })
            .replace(/<p[^>]*>(.*?)<\/p>/gs, '$1\n\n')
            .replace(/<strong[^>]*>(.*?)<\/strong>/gs, '$1')
            .replace(/<em[^>]*>(.*?)<\/em>/gs, '$1')
            .replace(/<u[^>]*>(.*?)<\/u>/gs, '$1')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');

        // Estrutura ODT válida
        return `<?xml version="1.0" encoding="UTF-8"?>


  
    
      ${textContent.split('\n\n').map(paragraph => {
          if (paragraph.trim()) {
              if (paragraph.includes('[CITAÇÃO]')) {
                  const citationText = paragraph.replace(/[CITAÇÃO](.*?)[\/CITAÇÃO]/gs, '$1');
                  return <text:p text:style-name="Citacao">${citationText.trim()}</text:p>;
              } else {
                  return <text:p text:style-name="Standard">${paragraph.trim()}</text:p>;
              }
          }
          return '';
      }).filter(p => p).join('\n      ')}
    
  
`;
        }
    function createODTFile(xmlContent) {
        const zip = new JSZip();

        // Manifest
        const manifest = `<?xml version="1.0" encoding="UTF-8"?>


  
  
  
`;
        // Estilos
        const styles = `<?xml version="1.0" encoding="UTF-8"?>


  
    
      
      
    
    
      
      
    
  
`;
        zip.file("META-INF/manifest.xml", manifest);
        zip.file("content.xml", xmlContent);
        zip.file("styles.xml", styles);

        zip.generateAsync({type:"blob"}).then(function(content) {
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'documento.odt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    function createRTFFile(htmlContent) {
        // Converte HTML para RTF
        let rtfContent = htmlContent
            .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gs, (match, content) => {
                return `\\li4032 \\i ${content.replace(/<[^>]*>/g, '')} \\i0 \\li0\\par `;
            })
            .replace(/<p[^>]*>(.*?)<\/p>/gs, '\\fi1134 $1\\par ')
            .replace(/<strong[^>]*>(.*?)<\/strong>/gs, '\\b $1\\b0 ')
            .replace(/<em[^>]*>(.*?)<\/em>/gs, '\\i $1\\i0 ')
            .replace(/<u[^>]*>(.*?)<\/u>/gs, '\\ul $1\\ul0 ')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');

        const rtfDocument = `{\\rtf1\\ansi\\deff0 

{\fonttbl {\f0 Arial;}}
\f0\fs32\qj 
${rtfContent}
}`;
        const blob = new Blob([rtfDocument], { type: 'application/rtf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'documento.rtf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // --- INÍCIO DO NOVO CÓDIGO DA RÉGUA ---

    let horizontalMarker, verticalMarker;

    editor.on('init', () => {
        const rulerH = document.getElementById('ruler-horizontal');
        const rulerV = document.getElementById('ruler-vertical');

        // Cria os marcadores visuais
        horizontalMarker = document.createElement('div');
        horizontalMarker.className = 'ruler-marker';
        if (rulerH) rulerH.appendChild(horizontalMarker);

        verticalMarker = document.createElement('div');
        verticalMarker.className = 'ruler-marker';
        if (rulerV) rulerV.appendChild(verticalMarker);

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
        if (horizontalMarker) {
            horizontalMarker.style.display = 'block';
            horizontalMarker.style.transform = `translateX(${cursorX}px)`;
        }
        if (verticalMarker) {
            verticalMarker.style.display = 'block';
            verticalMarker.style.transform = `translateY(${cursorY}px)`;
        }
    });

    // --- FIM DO NOVO CÓDIGO DA RÉGUA ---
}

};
