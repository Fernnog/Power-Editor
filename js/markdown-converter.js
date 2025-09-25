// js/markdown-converter.js

const MarkdownConverter = (() => {
    // Inicializa o serviço de conversão com opções para um Markdown mais limpo.
    const turndownService = new TurndownService({
        headingStyle: 'atx',      // Usa '#' para cabeçalhos
        codeBlockStyle: 'fenced', // Usa '```' para blocos de código
        bulletListMarker: '-',    // Usa '-' para listas não ordenadas
        emDelimiter: '*'          // Usa '*' para itálico
    });

    // REGRA 1: Manter a estrutura de parágrafos com quebras de linha duplas.
    // Esta regra garante consistência na separação entre parágrafos.
    turndownService.addRule('paragraph', {
        filter: 'p',
        replacement: function (content) {
            // Garante que haja duas quebras de linha após cada parágrafo para a renderização correta do Markdown.
            return content + '\n\n';
        }
    });

    // REGRA 2: Converter explicitamente negrito (<strong> e <b>).
    turndownService.addRule('strong', {
        filter: ['strong', 'b'],
        replacement: function (content) {
            return '**' + content + '**';
        }
    });

    // REGRA 3: Converter explicitamente itálico (<em> e <i>).
    turndownService.addRule('emphasis', {
        filter: ['em', 'i'],
        replacement: function (content) {
            return '*' + content + '*';
        }
    });

    // REGRA 4: Lidar com o sublinhado (<u>).
    // Markdown não possui um padrão universal para sublinhado, então a melhor prática é manter o texto sem a formatação.
    turndownService.addRule('underline', {
        filter: 'u',
        replacement: function (content) {
            return content;
        }
    });
    
    // NOTA: As regras para listas (ul, ol, li) e citações (blockquote) são bem gerenciadas
    // pelas configurações padrão do Turndown e não precisam de regras customizadas explícitas.

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
        
        // --- DIAGNÓSTICO SOLICITADO ---
        console.log("%c--- DEBUG: Conversão para Markdown ---", "color: #17a2b8; font-weight: bold;");
        console.log("1. HTML CAPTURADO DO EDITOR:", htmlContent);
        
        const markdownContent = turndownService.turndown(htmlContent);

        console.log("2. RESULTADO DA CONVERSÃO:", markdownContent);
        console.log("--------------------------------------");
        // ------------------------------------

        return markdownContent.trim(); // .trim() para remover espaços em branco extras no final.
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
