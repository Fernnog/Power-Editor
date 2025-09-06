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

    // Variáveis para contar as alterações e melhorar o feedback
    let paragraphsAdjusted = 0;
    let quotesCreated = 0;

    model.change(writer => {
        for (const child of root.getChildren()) {
            // Aplica a regra apenas a parágrafos que não fazem parte de uma lista.
            if (child.is('element', 'paragraph') && !child.hasAttribute('listItemId')) {
                const currentIndent = child.getAttribute('indent') || 0;

                // LÓGICA FINAL E CORRIGIDA
                // Se o recuo for maior que 1, converte para citação.
                if (currentIndent > 1) {
                    writer.rename(child, 'blockQuote');
                    writer.removeAttribute('indent', child);
                    quotesCreated++; // Incrementa o contador de citações
                
                // Se não houver recuo, aplica o recuo padrão e justifica.
                } else if (currentIndent === 0) {
                    writer.setAttribute('alignment', 'justify', child);
                    writer.setAttribute('indent', 1, child);
                    paragraphsAdjusted++; // Incrementa o contador de parágrafos
                }
                // Parágrafos com recuo nível 1 são ignorados e permanecem como estão.
            }
        }
    });

    editor.editing.view.focus();

    // Feedback aprimorado para o usuário
    if (paragraphsAdjusted > 0 || quotesCreated > 0) {
        let feedbackMessage = "Formatação concluída!\n";
        if (paragraphsAdjusted > 0) {
            feedbackMessage += `\n- ${paragraphsAdjusted} parágrafo(s) ajustado(s).`;
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
