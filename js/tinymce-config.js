// Este arquivo (js/tinymce-config.js) agora importa as constantes de ícones de um novo módulo.
// Certifique-se de que 'js/ui-icons.js' existe e exporta esses ícones.
import {
    ICON_MIC,
    ICON_AI_BRAIN,
    ICON_REPLACE,
    ICON_COPY_FORMATTED,
    ICON_DOWNLOAD_DOC,
    ICON_SPINNER // Novo ícone para feedback de processamento da IA
} from './ui-icons.js'; // O caminho pode precisar de ajuste dependendo da estrutura final

const TINYMCE_CONFIG = {
    selector: '#editor',

    plugins: 'lists autoresize pagebreak visualblocks',

    // A toolbar foi atualizada para usar os novos ícones definidos em 'js/ui-icons.js'
    toolbar: 'undo redo | blocks | bold italic underline | bullist numlist | alignjustify | customIndent customBlockquote | pagebreak visualblocks | customMicButton customAiButton customReplaceButton customCopyFormatted customOdtButton',

    menubar: false,
    statusbar: false,

    content_style: 'body { font-family:Arial,sans-serif; font-size:16px; line-height: 1.5; text-align: justify; } p { margin-bottom: 1em; } blockquote { margin-left: 7cm; margin-right: 0; padding-left: 15px; border-left: 3px solid #ccc; color: #333; font-style: italic; } blockquote p { text-indent: 0 !important; }',

    height: 600,
    autoresize_bottom_margin: 30,

    setup: function(editor) {
        // O objeto UI_CONSTANTS foi removido daqui, pois os ícones agora são importados de 'js/ui-icons.js'.

        // Botão para recuo de primeira linha (lógica original mantida com pequeno ajuste para toggle)
        editor.ui.registry.addButton('customIndent', {
            icon: 'indent',
            tooltip: 'Recuo da Primeira Linha (3cm)',
            onAction: function() {
                const node = editor.selection.getNode();
                const blockElements = editor.dom.getParents(node, (e) => e.nodeName === 'P' || /^H[1-6]$/.test(e.nodeName), editor.getBody());

                if (blockElements.length > 0) {
                    const element = blockElements[0];
                    // Alterna o recuo: se já tem 3cm, remove; senão, aplica.
                    if (element.style.textIndent === '3cm') {
                        element.style.textIndent = '';
                    } else {
                        element.style.textIndent = '3cm';
                    }
                    editor.fire('change'); // Dispara evento para atualizar o estado do botão
                }
            }
        });

        // Botão de citação personalizado com 7cm e itálico (lógica original mantida com ajuste para toggle)
        editor.ui.registry.addButton('customBlockquote', {
            icon: 'quote',
            tooltip: 'Transformar em citação (7cm + itálico)',
            onAction: function() {
                const selectedNode = editor.selection.getNode();

                // Alterna citação: se já está em blockquote, remove. Senão, adiciona e estiliza.
                if (selectedNode.closest('blockquote')) {
                    editor.execCommand('mceBlockQuote'); // Remove a citação
                } else {
                    editor.execCommand('mceBlockQuote');
                    // Pequeno atraso para garantir que o elemento blockquote foi criado
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
                        editor.fire('change'); // Dispara evento para atualizar o estado do botão
                    }, 10);
                }
            }
        });

        // Botão de Ditado por Voz (Microfone) - Usando ICON_MIC importado
        editor.ui.registry.addButton('customMicButton', {
            text: ICON_MIC, // Atualizado para usar a constante importada
            tooltip: 'Ditar texto',
            onAction: function() {
                if (typeof SpeechDictation !== 'undefined' && SpeechDictation.isSupported()) {
                    SpeechDictation.start();
                } else {
                    alert('O reconhecimento de voz não é suportado neste navegador.');
                }
            }
        });

        // Botão de Correção com IA - Usando ICON_AI_BRAIN importado e ICON_SPINNER para feedback
        editor.ui.registry.addButton('customAiButton', {
            text: ICON_AI_BRAIN, // Atualizado para usar a constante importada
            tooltip: 'Corrigir Texto com IA',
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
                    // Feedback visual durante o processamento (Prioridade 2)
                    api.setEnabled(false);
                    api.setText(ICON_SPINNER); // Usa o novo ícone de spinner
                    api.setTooltip('Processando...'); // Atualiza o tooltip
                    editor.formatter.apply('ia_processing_marker');

                    const correctedText = await GeminiService.correctText(selectedText, CONFIG.apiKey);

                    editor.formatter.remove('ia_processing_marker');
                    editor.selection.setContent(correctedText);

                } catch (error) {
                    console.error("Erro na correção de texto:", error);
                    editor.formatter.remove('ia_processing_marker');
                    alert('Ocorreu um erro ao corrigir o texto. Veja o console para detalhes.');
                } finally {
                    // Restaura o botão ao estado original
                    api.setEnabled(true);
                    api.setText(ICON_AI_BRAIN); // Restaura o ícone original
                    api.setTooltip('Corrigir Texto com IA'); // Restaura o tooltip original
                }
            }
        });

        // Botão de Substituir Termos - Usando ICON_REPLACE importado
        editor.ui.registry.addButton('customReplaceButton', {
            text: ICON_REPLACE, // Atualizado para usar a constante importada
            tooltip: 'Gerenciar Substituições',
            onAction: function () {
                // 'ModalManager' e 'appState' são presumidos como globais ou importados de outros scripts.
                if (typeof ModalManager !== 'undefined' && typeof appState !== 'undefined' && typeof modifyStateAndBackup !== 'undefined') {
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
                } else {
                    console.error('Dependências (ModalManager, appState, modifyStateAndBackup) não disponíveis para o gerenciador de substituições.');
                }
            }
        });

        // Botão de Copiar Formatado para Google Docs - Usando ICON_COPY_FORMATTED importado
        editor.ui.registry.addButton('customCopyFormatted', {
            text: ICON_COPY_FORMATTED, // Atualizado para usar a constante importada
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

        // Botão de Download ODT/RTF - Usando ICON_DOWNLOAD_DOC importado
        editor.ui.registry.addButton('customOdtButton', {
            text: ICON_DOWNLOAD_DOC, // Atualizado para usar a constante importada
            tooltip: 'Salvar como documento (.odt/.rtf)',
            onAction: function() {
                const editorContent = editor.getContent();

                try {
                    const odtXmlContent = generateValidODTContent(editorContent);

                    // 'JSZip' é presumido como global.
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

        // Funções auxiliares para geração de arquivos ODT/RTF (mantidas sem alterações)
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

        // --- INÍCIO DA LÓGICA PARA ATUALIZAR ESTADO DOS BOTÕES (Prioridade 2) ---
        editor.on('NodeChange', function(e) {
            const node = e.element; // O elemento DOM atualmente selecionado ou o pai mais próximo

            // Lógica para 'customIndent'
            const customIndentButton = editor.ui.registry.getButton('customIndent');
            if (customIndentButton) {
                const blockElementForIndent = editor.dom.getParents(node, (el) => el.nodeName === 'P' || /^H[1-6]$/.test(el.nodeName), editor.getBody())[0];
                editor.ui.ui.get('customIndent').setActive(blockElementForIndent && blockElementForIndent.style.textIndent === '3cm');
            }

            // Lógica para 'customBlockquote'
            const customBlockquoteButton = editor.ui.registry.getButton('customBlockquote');
            if (customBlockquoteButton) {
                 editor.ui.ui.get('customBlockquote').setActive(!!node.closest('blockquote'));
            }
        });
        // --- FIM DA LÓGICA PARA ATUALIZAR ESTADO DOS BOTÕES ---

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
