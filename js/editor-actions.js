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
        document.execCommand('justifyFull'); // ADICIONADO: Garante que todo o texto seja justificado.
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
     * Aplica ou remove a formatação de citação (blockquote) no parágrafo atual.
     * Funciona como um interruptor (toggle).
     */
    function formatAsBlockquote() {
        if (!editor) return;

        // 1. Obter a seleção atual do usuário
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        let node = selection.getRangeAt(0).startContainer;
        let inBlockquote = false;

        // 2. Verificar se a seleção atual já está dentro de um elemento <blockquote>
        // Para isso, subimos na árvore de elementos a partir do cursor.
        while (node && node !== editor) {
            if (node.nodeName === 'BLOCKQUOTE') {
                inBlockquote = true;
                break;
            }
            node = node.parentNode;
        }

        // 3. Executar o comando apropriado com base no estado encontrado
        if (inBlockquote) {
            // Se já for uma citação, o comando 'formatBlock' com 'p' reverte para um parágrafo normal.
            document.execCommand('formatBlock', false, 'p');
        } else {
            // Caso contrário, aplica a formatação de citação como antes.
            document.execCommand('formatBlock', false, 'blockquote');
        }

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
