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

    let paragraphsAdjusted = 0;
    let quotesCreated = 0;

    // É crucial envolver todas as operações em um único bloco 'change'
    // para garantir que tudo seja tratado como uma única ação de "desfazer".
    model.change(writer => {
        for (const child of root.getChildren()) {
            if (child.is('element', 'paragraph') && !child.hasAttribute('listItemId')) {
                const currentIndent = child.getAttribute('indent') || 0;

                if (currentIndent > 1) {
                    // Seleciona o parágrafo inteiro antes de executar o comando
                    writer.setSelection(child, 'on');
                    editor.execute('blockQuote'); // Comando para criar citação
                    quotesCreated++;
                } else if (currentIndent === 0) {
                    // Seleciona o parágrafo inteiro para aplicar os comandos
                    writer.setSelection(child, 'on');
                    editor.execute('alignment', { value: 'justify' }); // Comando para justificar
                    editor.execute('indent'); // Comando para aumentar o recuo em 1 nível
                    paragraphsAdjusted++;
                }
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
