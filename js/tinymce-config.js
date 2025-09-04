const TINYMCE_CONFIG = {
    selector: '#editor',
    
    plugins: 'lists autoresize pagebreak visualblocks',
    
    toolbar: 'undo redo | blocks | bold italic underline | bullist numlist | alignjustify | customIndent customBlockquote | pagebreak visualblocks | customMicButton customAiButton customReplaceButton customCopyFormatted customOdtButton',
    
    menubar: false,
    statusbar: false,
    
    content_style: 'body { font-family:Arial,sans-serif; font-size:16px; line-height: 1.5; text-align: justify; } p { margin-bottom: 1em; } blockquote { margin-left: 7cm; margin-right: 0; padding-left: 15px; border-left: 3px solid #ccc; color: #333; font-style: italic; } blockquote p { text-indent: 0 !important; }',
    
    height: 600,
    autoresize_bottom_margin: 30,

    setup: function(editor) {
        // --- MELHORIA DE ARQUITETURA: Centralizando constantes da UI ---
        // Este objeto centraliza os textos e tooltips dos botões, 
        // facilitando a manutenção e a consistência da interface.
        const UI_CONSTANTS = {
            mic: { text: '🎤', tooltip: 'Ditar texto' },
            aiBrain: { text: 'A🧠', tooltip: 'Corrigir Texto com IA' },
            replace: { text: 'A→B', tooltip: 'Gerenciar Substituições' },
            copyFormatted: { text: '📋✨', tooltip: 'Copiar Formatado (compatível com Google Docs)' },
            downloadDoc: { text: '📄', tooltip: 'Salvar como documento (.odt/.rtf)' },
            processing: { text: '⏳', tooltip: 'Processando...' }
        };

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
                
                if (selectedNode.closest('blockquote')) {
                    editor.execCommand('mceBlockQuote');
                } else {
                    editor.execCommand('mceBlockQuote');
                    setTimeout(() => {
                        const blockquote = editor.selection.getNode().closest('blockquote');
                        if (blockquote) {
                            editor.dom.setStyle(blockquote, 'margin-left', '7cm');
                            editor.dom.setStyle(blockquote, 'margin-right', '0');
                            editor.dom.setStyle(blockquote, 'font-style', 'italic');
                            editor.dom.setStyle(blockquote, 'padding-left', '15px');
                            editor.dom.setStyle(blockquote, 'border-left', '3px solid #ccc');
                            editor.dom.setStyle(blockquote, 'color', '#333');
                            
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
            text: UI_CONSTANTS.mic.text,
            tooltip: UI_CONSTANTS.mic.tooltip,
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
            text: UI_CONSTANTS.aiBrain.text,
            tooltip: UI_CONSTANTS.aiBrain.tooltip,
            onAction: async function(api) { // 'api' permite controlar o estado do botão
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
                    // --- MELHORIA DE UX: Feedback visual durante o processamento ---
                    api.setEnabled(false);
                    api.setText(UI_CONSTANTS.processing.text);

                    editor.formatter.apply('ia_processing_marker');
                    
                    const correctedText = await GeminiService.correctText(selectedText, CONFIG.apiKey);
                    
                    editor.formatter.remove('ia_processing_marker');
                    editor.selection.setContent(correctedText);
                    
                } catch (error) {
                    console.error("Erro na correção de texto:", error);
                    editor.formatter.remove('ia_processing_marker');
                    alert('Ocorreu um erro ao corrigir o texto. Veja o console para detalhes.');
                } finally {
                    // --- MELHORIA DE UX: Restaura o botão ao estado original ---
                    api.setEnabled(true);
                    api.setText(UI_CONSTANTS.aiBrain.text);
                }
            }
        });

        // Botão de Substituir Termos
        editor.ui.registry.addButton('customReplaceButton', {
            text: UI_CONSTANTS.replace.text,
            tooltip: UI_CONSTANTS.replace.tooltip,
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

        // Botão de Copiar Formatado para Google Docs
        editor.ui.registry.addButton('customCopyFormatted', {
            text: UI_CONSTANTS.copyFormatted.text,
            tooltip: UI_CONSTANTS.copyFormatted.tooltip,
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

        // Botão de Download ODT/RTF Corrigido
        editor.ui.registry.addButton('customOdtButton', {
            text: UI_CONSTANTS.downloadDoc.text,
            tooltip: UI_CONSTANTS.downloadDoc.tooltip,
            onAction: function() {
                const editorContent = editor.getContent();
                
                try {
                    const odtXmlContent = generateValidODTContent(editorContent);
                    
                    if (typeof JSZip !== 'undefined') {
                        createODTFile(odtXmlContent);
                    } else {
                        createRTFFile(editorContent);
                    }
                    
                } catch (error) {
                    console.error('Erro ao gerar arquivo:', error);
                    createRTFFile(editorContent);
                }
            }
        });
        
        // Funções auxiliares para geração de arquivos ODT/RTF
        function generateValidODTContent(htmlContent) {
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

            return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" 
                        xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" 
                        xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" 
                        xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0">
  <office:body>
    <office:text>
      ${textContent.split('\n\n').map(paragraph => {
          if (paragraph.trim()) {
              if (paragraph.includes('[CITAÇÃO]')) {
                  const citationText = paragraph.replace(/\[CITAÇÃO\](.*?)\[\/CITAÇÃO\]/gs, '$1');
                  return `<text:p text:style-name="Citacao">${citationText.trim()}</text:p>`;
              } else {
                  return `<text:p text:style-name="Standard">${paragraph.trim()}</text:p>`;
              }
          }
          return '';
      }).filter(p => p).join('\n      ')}
    </office:text>
  </office:body>
</office:document-content>`;
        }

        function createODTFile(xmlContent) {
            const zip = new JSZip();
            
            const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">
  <manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.text"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`;

            const styles = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" 
                       xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" 
                       xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0">
  <office:styles>
    <style:style style:name="Standard" style:family="paragraph">
      <style:paragraph-properties fo:text-align="justify" fo:text-indent="3cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="16pt"/>
    </style:style>
    <style:style style:name="Citacao" style:family="paragraph">
      <style:paragraph-properties fo:text-align="justify" fo:margin-left="7cm" fo:text-indent="0cm"/>
      <style:text-properties style:font-name="Arial" fo:font-size="16pt" fo:font-style="italic"/>
    </style:style>
  </office:styles>
</office:document-styles>`;

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
{\\fonttbl {\\f0 Arial;}}
\\f0\\fs32\\qj 
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
        
        editor.on('init', () => {
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
    }
};
