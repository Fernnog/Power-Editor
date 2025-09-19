const TINYMCE_CONFIG = {
    selector: '#editor',
    
    plugins: 'lists autoresize pagebreak visualblocks wordcount',
    
    // CORREÇÃO: 'customReplaceButton' foi adicionado à lista para garantir sua visibilidade.
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
                    alert('O reconhecimento de voz não é suportado neste navegador.');
                }
            }
        });

        // Botão de Correção com IA
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

                    editor.formatter.apply('ia_processing_marker');
                    
                    const correctedText = await GeminiService.correctText(selectedText, CONFIG.apiKey);
                    
                    editor.formatter.remove('ia_processing_marker');
                    editor.selection.setContent(correctedText);
                    
                } catch (error) {
                    console.error("Erro na correção de texto:", error);
                    editor.formatter.remove('ia_processing_marker');
                    alert('Ocorreu um erro ao corrigir o texto. Veja o console para detalhes.');
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
                    }
                });
            }
        });

        // Botão de Copiar Formatado
        editor.ui.registry.addButton('customCopyFormatted', {
            icon: 'custom-copy-formatted',
            tooltip: 'Copiar Formatado (compatível com Google Docs)',
            onAction: async function() {
                try {
                    const originalContent = editor.getContent();
                    const optimizedContent = convertForGoogleDocs(originalContent);
                    
                    if (navigator.clipboard && window.ClipboardItem) {
                        const blob = new Blob([optimizedContent], { type: 'text/html' });
                        const clipboardItem = new ClipboardItem({ 'text/html': blob });
                        await navigator.clipboard.write([clipboardItem]);
                    } else {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = optimizedContent;
                        tempDiv.style.position = 'absolute';
                        tempDiv.style.left = '-9999px';
                        document.body.appendChild(tempDiv);
                        
                        const range = document.createRange();
                        range.selectNode(tempDiv);
                        const selection = window.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(range);
                        
                        document.execCommand('copy');
                        document.body.removeChild(tempDiv);
                        selection.removeAllRanges();
                    }
                    
                    showCopyNotification('Texto copiado e otimizado para Google Docs!');
                    
                } catch (error) {
                    console.error('Erro ao copiar conteúdo formatado:', error);
                    showCopyNotification('Erro ao copiar. Tente usar Ctrl+C manual.', 'error');
                }
            }
        });

        // Botão de Download
        editor.ui.registry.addButton('customOdtButton', {
            icon: 'custom-download-doc',
            tooltip: 'Salvar como documento (.rtf)',
            onAction: function() {
                const editorContent = editor.getContent();
                try {
                    createRTFFile(editorContent);
                } catch (error) {
                    console.error('Erro ao gerar arquivo RTF:', error);
                    alert('Ocorreu um erro ao tentar salvar o documento.');
                }
            }
        });
        
        // BOTÃO DE APAGAR DOCUMENTO
        editor.ui.registry.addButton('customDeleteButton', {
            icon: 'custom-delete-doc',
            tooltip: 'Apagar todo o conteúdo',
            onAction: function() {
                if (confirm('Tem certeza que deseja apagar todo o conteúdo do editor? Esta ação não pode ser desfeita.')) {
                    editor.setContent('');
                }
            }
        });
        
        // Funções auxiliares (internas ao setup)
        function createRTFFile(htmlContent) {
            const escapeRtf = (str) => {
                return str.replace(/\\/g, '\\\\').replace(/{/g, '\\{').replace(/}/g, '\\}')
                          .replace(/[\u0080-\uFFFF]/g, (c) => `\\uc1\\u${c.charCodeAt(0)}*`);
            };

            const processNode = (node) => {
                let rtf = '';
                node.childNodes.forEach(child => {
                    if (child.nodeType === Node.TEXT_NODE) {
                        rtf += escapeRtf(child.textContent);
                    } else if (child.nodeType === Node.ELEMENT_NODE) {
                        const tagName = child.tagName.toLowerCase();
                        switch (tagName) {
                            case 'strong':
                            case 'b':
                                rtf += `{\\b ${processNode(child)}}`;
                                break;
                            case 'em':
                            case 'i':
                                rtf += `{\\i ${processNode(child)}}`;
                                break;
                            case 'u':
                                rtf += `{\\ul ${processNode(child)}}`;
                                break;
                            case 'p':
                                if (child.style.textIndent) {
                                    rtf += `\\pard\\fi5250\\li0 ${processNode(child)}\\par\n`;
                                } else {
                                    rtf += `\\pard\\fi0\\li0 ${processNode(child)}\\par\n`;
                                }
                                break;
                            case 'blockquote':
                                rtf += `\\pard\\li10500\\fi0 {\\i ${processNode(child)}}\\par\n`;
                                break;
                            case 'br':
                                 rtf += '\\line ';
                                 break;
                            default:
                                rtf += processNode(child);
                                break;
                        }
                    }
                });
                return rtf;
            };

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;
            const rtfBody = processNode(tempDiv);
            const rtfDocument = `{\\rtf1\\ansi\\ansicpg1252\\deff0
{\\fonttbl{\\f0 Arial;}}
\\pard\\sa200\\sl276\\slmult1\\qj\\f0\\fs32
${rtfBody}
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

        function convertForGoogleDocs(htmlContent) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;
            
            const paragraphs = tempDiv.querySelectorAll('p');
            paragraphs.forEach(p => {
                const textIndent = p.style.textIndent || '';
                
                if (textIndent === '3cm' || textIndent.includes('3cm')) {
                    p.style.textIndent = '';
                    p.style.marginLeft = '';
                    p.style.paddingLeft = '';
                    
                    const originalContent = p.innerHTML.trim();
                    const indentSpaces = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
                    
                    if (originalContent) {
                        p.innerHTML = indentSpaces + originalContent;
                    }
                    
                    p.style.textIndent = '3cm';
                    p.style.marginLeft = '0';
                    p.style.paddingLeft = '0';
                }
            });
            
            const blockquotes = tempDiv.querySelectorAll('blockquote');
            blockquotes.forEach(bq => {
                bq.style.marginLeft = '7cm';
                bq.style.textIndent = '0';
                bq.style.fontStyle = 'italic';
                bq.style.paddingLeft = '15px';
                bq.style.borderLeft = '3px solid #ccc';
            });
            
            return tempDiv.innerHTML;
        }

        function showCopyNotification(message, type = 'success') {
            const existingNotification = document.querySelector('.copy-notification');
            if (existingNotification) {
                existingNotification.remove();
            }
            
            const notification = document.createElement('div');
            notification.className = 'copy-notification';
            notification.innerHTML = `
                <div class="copy-notification-content ${type}">
                    <span>${message}</span>
                    <button onclick="this.parentElement.parentElement.remove()">&times;</button>
                </div>
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 4000);
        }
        
        // Listener para inicialização do editor (usado pelo Ditado)
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

        // CORREÇÃO: Lógica de substituição automática precisa e eficiente.
        editor.on('keyup', function(e) {
            // Aciona a lógica apenas quando a barra de espaço (código 32) ou Enter (código 13) é pressionada
            if (e.keyCode !== 32 && e.keyCode !== 13) {
                return;
            }
            if (!appState.replacements || appState.replacements.length === 0) {
                return;
            }
    
            const rng = editor.selection.getRng();
            const startNode = rng.startContainer;
            const startOffset = rng.startOffset;
    
            // Garante que estamos trabalhando com um nó de texto
            if (startNode.nodeType !== Node.TEXT_NODE) {
                return;
            }
            
            // Pega o texto do nó atual, da posição 0 até o cursor
            const textBeforeCursor = startNode.nodeValue.substring(0, startOffset);
            
            // Encontra a última palavra digitada (texto após o último espaço)
            const lastSpaceIndex = textBeforeCursor.lastIndexOf(' ');
            const word = textBeforeCursor.substring(lastSpaceIndex + 1);
    
            if (!word) {
                return;
            }
    
            const rule = appState.replacements.find(r => r.find === word);
    
            if (rule) {
                // Cria um "range" (seleção) que cobre exatamente a palavra a ser substituída
                const replaceRng = document.createRange();
                replaceRng.setStart(startNode, lastSpaceIndex + 1);
                replaceRng.setEnd(startNode, startOffset);
                
                // Define a seleção do editor para este range
                editor.selection.setRng(replaceRng);
                
                // Usa o comando nativo do TinyMCE para substituir a seleção pelo novo conteúdo.
                // Adicionamos um espaço no final para que o usuário possa continuar digitando.
                editor.selection.setContent(rule.replace + ' ');
            }
        });
    }
};
