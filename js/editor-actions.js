// js/editor-actions.js
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
                    const currentIndent = child.getAttribute('indent') || 0;

                    // **INÍCIO DA NOVA LÓGICA**
                    // Se o recuo for maior que 1, converte o parágrafo para citação.
                    if (currentIndent > 1) {
                        writer.rename(child, 'blockQuote');
                        writer.removeAttribute('indent', child);
                    
                    // Se não houver recuo (for igual a 0), aplica o recuo simples (nível 1) e justifica.
                    } else if (currentIndent === 0) {
                        writer.setAttribute('alignment', 'justify', child);
                        writer.setAttribute('indent', 1, child);
                    }
                    // Parágrafos com recuo nível 1 são ignorados e permanecem como estão.
                    // **FIM DA NOVA LÓGICA**
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
