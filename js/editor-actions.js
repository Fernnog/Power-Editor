const EditorActions = (() => {
    /**
     * Aplica formatação padrão (recuo e espaçamento) ao documento no editor TinyMCE.
     * Percorre os elementos de primeiro nível para aplicar as regras.
     */
    function formatDocument() {
        const editor = tinymce.activeEditor;
        if (!editor) {
            alert("O editor não está pronto.");
            return;
        }
        
        // Agrupa todas as alterações em uma única transação para permitir um único "Desfazer"
        editor.undoManager.transact(() => {
            const elements = editor.getBody().children; // Pega os filhos diretos do corpo do editor
            
            for (let i = 0; i < elements.length; i++) {
                const el = elements[i];
                
                // Aplica espaçamento 1.5 a todos os blocos
                editor.dom.setStyle(el, 'lineHeight', '1.5');
        
                // Aplica recuo a parágrafos e remove dos outros elementos
                if (el.tagName === 'P') {
                    editor.dom.setStyle(el, 'textIndent', '3cm');
                } else if (el.tagName === 'UL' || el.tagName === 'OL') {
                    // Para listas, usamos margin para indentar o bloco todo
                    editor.dom.setStyle(el, 'marginLeft', '3cm');
                    editor.dom.setStyle(el, 'textIndent', ''); // Garante que não haja recuo de primeira linha
                } else {
                    editor.dom.setStyle(el, 'textIndent', '');
                }
            }
            
            // Garante que todo o texto seja justificado.
            editor.execCommand('justifyFull');
        });

        editor.focus();
        alert('Documento formatado com sucesso!');
    }

    // Expõe publicamente apenas a função necessária.
    return {
        formatDocument
    };
})();