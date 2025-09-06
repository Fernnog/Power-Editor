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

    let paragraphsAligned = 0;
    let quotesCreated = 0;

    model.change(writer => {
        for (const child of root.getChildren()) {
            // A verificação para ignorar itens de lista continua crucial
            if (child.is('element', 'paragraph') && !child.hasAttribute('listItemId')) {
                const currentIndent = child.getAttribute('indent') || 0;

                // REGRA 1: Se o recuo for grande, transforma em citação.
                if (currentIndent > 1) {
                    writer.setSelection(child, 'on');
                    editor.execute('blockQuote');
                    quotesCreated++;
                
                // REGRA 2: Se o recuo for pequeno (nível 1), remove o recuo.
                } else if (currentIndent === 1) {
                    writer.setSelection(child, 'on');
                    editor.execute('outdent'); // Comando para remover recuo
                    paragraphsAligned++;
                }
                // REGRA 3: Se o recuo for 0, nenhuma ação é necessária.
            }
        }
    });

    editor.editing.view.focus();

    // Feedback final e aprimorado para o usuário
    if (paragraphsAligned > 0 || quotesCreated > 0) {
        let feedbackMessage = "Formatação concluída!\n";
        if (paragraphsAligned > 0) {
            feedbackMessage += `\n- ${paragraphsAligned} parágrafo(s) alinhado(s) à margem.`;
        }
        if (quotesCreated > 0) {
            feedbackMessage += `\n- ${quotesCreated} citação(ões) criada(s).`;
        }
        alert(feedbackMessage);
    } else {
        alert('Nenhum parágrafo precisou de formatação.');
    }
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
