// js/markdown-converter.js

const MarkdownConverter = (() => {
    const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        bulletListMarker: '-',
        emDelimiter: '*'
    });

    turndownService.addRule('paragraph', {
        filter: 'p',
        replacement: function (content) {
            // Garante que haja duas quebras de linha após cada parágrafo para a renderização correta do Markdown.
            return content + '\n\n';
        }
    });

    // REGRA APRIMORADA: Converte <strong>, <b> E <span style="font-weight: bold;">
    turndownService.addRule('strong', {
        filter: function (node, options) {
            return (
                node.nodeName === 'STRONG' ||
                node.nodeName === 'B' ||
                (node.nodeName === 'SPAN' && node.style.fontWeight === 'bold') ||
                (node.nodeName === 'SPAN' && parseInt(node.style.fontWeight, 10) >= 700)
            );
        },
        replacement: function (content) {
            return '**' + content + '**';
        }
    });

    // REGRA APRIMORADA: Converte <em>, <i> E <span style="font-style: italic;">
    turndownService.addRule('emphasis', {
        filter: function (node, options) {
            return (
                node.nodeName === 'EM' ||
                node.nodeName === 'I' ||
                (node.nodeName === 'SPAN' && node.style.fontStyle === 'italic')
            );
        },
        replacement: function (content) {
            return '*' + content + '*';
        }
    });

    // REGRA 4: Lidar com o sublinhado (<u>).
    turndownService.addRule('underline', {
        filter: 'u',
        replacement: function (content) {
            return content;
        }
    });

    /**
     * Converte uma string HTML para o formato Markdown.
     * @param {string} htmlContent - O conteúdo HTML a ser convertido.
     * @returns {string} O conteúdo convertido para Markdown.
     */
    function htmlToMarkdown(htmlContent) {
        if (typeof turndownService === 'undefined') {
            console.error('A biblioteca Turndown não está disponível.');
            return htmlContent;
        }
        
        console.log("%c--- DEBUG: Conversão para Markdown ---", "color: #17a2b8; font-weight: bold;");
        console.log("1. HTML CAPTURADO DO EDITOR:", htmlContent);
        
        const markdownContent = turndownService.turndown(htmlContent);

        console.log("2. RESULTADO DA CONVERSÃO:", markdownContent);
        console.log("--------------------------------------");

        return markdownContent.trim();
    }

    /**
     * Converte uma string Markdown para o formato HTML.
     * @param {string} markdownContent - O conteúdo Markdown a ser convertido.
     * @returns {string} O conteúdo convertido para HTML.
     */
    function markdownToHtml(markdownContent) {
        if (typeof marked === 'undefined') {
            console.error('A biblioteca Marked não está disponível.');
            return markdownContent;
        }
        return marked.parse(markdownContent);
    }

    // Expõe as funções públicas do módulo
    return {
        htmlToMarkdown,
        markdownToHtml
    };
})();
