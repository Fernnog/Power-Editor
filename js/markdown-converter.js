// js/markdown-converter.js

const MarkdownConverter = (() => {
    // Inicializa o serviço de conversão de HTML para Markdown uma única vez.
    const turndownService = new TurndownService({ 
        headingStyle: 'atx', 
        codeBlockStyle: 'fenced' 
    });

    // ADICIONADAS: Regras explícitas para garantir a conversão de negrito e itálico.
    // Isso captura tanto <strong> quanto <b>, e <em> quanto <i>.
    turndownService.addRule('strong', {
        filter: ['strong', 'b'],
        replacement: function (content) {
            return '**' + content + '**';
        }
    });

    turndownService.addRule('emphasis', {
        filter: ['em', 'i'],
        replacement: function (content) {
            return '*' + content + '*';
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
            return htmlContent; // Retorna o original em caso de erro
        }
        return turndownService.turndown(htmlContent);
    }

    /**
     * Converte uma string Markdown para o formato HTML.
     * @param {string} markdownContent - O conteúdo Markdown a ser convertido.
     * @returns {string} O conteúdo convertido para HTML.
     */
    function markdownToHtml(markdownContent) {
        if (typeof marked === 'undefined') {
            console.error('A biblioteca Marked não está disponível.');
            return markdownContent; // Retorna o original em caso de erro
        }
        return marked.parse(markdownContent);
    }

    // Expõe as funções públicas do módulo
    return {
        htmlToMarkdown,
        markdownToHtml
    };
})();
