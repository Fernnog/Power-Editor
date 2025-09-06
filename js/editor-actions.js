// Substitua TODO o conteúdo de 'editor-actions.js' por este código atualizado.
const EditorActions = (() => {

    /**
     * Aplica formatação customizada ao documento no editor CKEditor.
     * @param {object} editor - A instância ativa do CKEditor.
     */
    function formatDocument(editor) {
        if (!editor) {
            alert('Editor não está pronto. Tente novamente.');
            return;
        }

        const model = editor.model;
        const root = model.document.getRoot();

        model.change(writer => {
            for (const child of root.getChildren()) {
                // Aplica a regra apenas a parágrafos que não fazem parte de uma lista.
                if (child.is('element', 'paragraph') && !child.hasAttribute('listItemId')) {
                    const currentIndent = child.getAttribute('indent');

                    // Se já tiver qualquer nível de recuo, converte para citação (6cm).
                    if (currentIndent > 0) {
                        writer.rename(child, 'blockQuote');
                        writer.removeAttribute('indent', child);
                    } else {
                        // Se não tiver recuo, aplica justificação e o recuo de 3cm (nível 1).
                        writer.setAttribute('alignment', 'justify', child);
                        writer.setAttribute('indent', 1, child);
                    }
                }
            }
        });

        editor.editing.view.focus();
        alert('Documento formatado com sucesso!');
    }

    /**
     * Limpa todo o conteúdo do editor.
     * @param {object} editor - A instância ativa do CKEditor.
     */
    function clearDocument(editor) {
         if (editor) {
            editor.setData('');
        }
    }

    return {
        formatDocument,
        clearDocument
    };
})();
