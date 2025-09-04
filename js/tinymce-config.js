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

        // Botão de Correção com IA
        editor.ui.registry.addButton('customAiButton', {
            text: 'A🧠',
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

        // Botão de Copiar Formatado para Google Docs
        editor.ui.registry.addButton('customCopyFormatted', {
            text: '📋✨',
            tooltip: 'Copiar Formatado (compatível com Google Docs)',
            onAction: async function() {
                try {
                    const originalContent = editor.getContent();
                    const optimizedContent = convertForGoogleDocs(originalContent);
                    
                    // Tenta usar a API moderna de clipboard
                    if (navigator.clipboard && window.ClipboardItem) {
                        const blob = new Blob([optimizedContent], { type: 'text/html' });
                        const clipboardItem = new ClipboardItem({ 'text/html': blob });
                        await navigator.clipboard.write([clipboardItem]);
                    } else {
                        // Fallback para navegadores mais antigos
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
                    
                    // Feedback visual de sucesso
                    showCopyNotification('Texto copiado e otimizado para Google Docs!');
                    
                } catch (error) {
                    console.error('Erro ao copiar conteúdo formatado:', error);
                    showCopyNotification('Erro ao copiar. Tente usar Ctrl+C manual.', 'error');
                }
            }
        });

        // Botão de Download ODT/RTF Corrigido
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
            
            // Manifest
            const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">
  <manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.text"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`;

            // Estilos
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

        // Função auxiliar para converter conteúdo para compatibilidade com Google Docs
        function convertForGoogleDocs(htmlContent) {
            // Cria um container temporário para manipular o HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;
            
            // Processa todos os parágrafos com text-indent
            const paragraphs = tempDiv.querySelectorAll('p');
            paragraphs.forEach(p => {
                const textIndent = p.style.textIndent || '';
                
                // Se tem text-indent de 3cm, converte para uma abordagem que o Google Docs reconhece
                if (textIndent === '3cm' || textIndent.includes('3cm')) {
                    // Remove o text-indent CSS
                    p.style.textIndent = '';
                    p.style.marginLeft = '';
                    p.style.paddingLeft = '';
                    
                    // Pega o conteúdo atual do parágrafo
                    const originalContent = p.innerHTML.trim();
                    
                    // Adiciona espaços em branco equivalentes a 3cm no início da primeira linha
                    // Usando uma combinação de espaços não-quebráveis e tabulações
                    const indentSpaces = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
                    
                    // Aplica o recuo apenas à primeira linha, preservando quebras de linha internas
                    if (originalContent) {
                        p.innerHTML = indentSpaces + originalContent;
                    }
                    
                    // Aplicar estilo específico que o Google Docs interpreta melhor para primeira linha
                    p.style.textIndent = '3cm';
                    p.style.marginLeft = '0';
                    p.style.paddingLeft = '0';
                }
            });
            
            // Garante que blockquotes mantenham formatação (já funciona, mas reforça)
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

        // Função para mostrar notificação de feedback
        function showCopyNotification(message, type = 'success') {
            // Remove notificação existente se houver
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
            
            // Remove automaticamente após 4 segundos
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 4000);
        }
        
        // Inicialização após editor estar pronto
        editor.on('init', () => {
            // Inicialização do módulo de Ditado
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
