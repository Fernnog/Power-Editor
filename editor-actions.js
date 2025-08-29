const EditorActions = (() => {
    // Referência privada ao editor, mantendo o módulo autônomo.
    const editor = document.getElementById('editor');

    /**
     * Aplica formatação padrão (recuo e espaçamento) ao documento no editor.
     * Percorre os elementos de primeiro nível para aplicar as regras.
     */
    function formatDocument() {
        if (!editor) return;
        
        const elements = editor.querySelectorAll(':scope > *'); // Seleciona apenas filhos diretos
        elements.forEach(el => {
            // Aplica espaçamento 1.5 a todos os blocos
            el.style.lineHeight = '1.5';
    
            // Aplica recuo a parágrafos e remove dos outros elementos
            if (el.tagName === 'P') {
                el.style.textIndent = '3cm';
            } else if (el.tagName === 'UL' || el.tagName === 'OL') {
                // Para listas, usamos margin para indentar o bloco todo
                el.style.marginLeft = '3cm';
                el.style.textIndent = ''; // Garante que não haja recuo de primeira linha em listas
            } else {
                el.style.textIndent = '';
            }
        });
        editor.focus();
        alert('Documento formatado com sucesso!');
    }

    /**
     * Alterna o recuo da primeira linha do parágrafo atual.
     */
    function indentFirstLine() {
        if (!editor) return;

        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        let node = selection.getRangeAt(0).startContainer;

        // Sobe na árvore DOM até encontrar um parágrafo (P) ou o próprio editor
        while (node && node.nodeName !== 'P' && node !== editor) {
            node = node.parentNode;
        }

        // Se encontrou um parágrafo, alterna o recuo
        if (node && node.nodeName === 'P') {
            node.style.textIndent = node.style.textIndent ? '' : '3cm';
        }
        editor.focus();
    }

    /**
     * Limpa todo o conteúdo do editor, com uma confirmação prévia.
     */
    function clearDocument() {
        if (!editor) return;

        if (confirm('Tem certeza que deseja apagar todo o conteúdo do editor?')) {
            editor.innerHTML = '<p><br></p>';
            editor.focus();
        }
    }

    /**
     * Aplica ou remove a formatação de citação (blockquote) ao texto selecionado.
     */
    function formatAsBlockquote() {
        if (!editor) return;
        // O comando 'formatBlock' alterna a tag 'blockquote' no parágrafo atual.
        document.execCommand('formatBlock', false, 'blockquote');
        editor.focus();
    }

    // Expõe as funções publicamente para serem chamadas a partir de script.js
    return {
        formatDocument,
        indentFirstLine,
        clearDocument,
        formatAsBlockquote
    };
})();
