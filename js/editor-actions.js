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
        const childrenToProcess = Array.from(root.getChildren());

        for (const child of childrenToProcess) {
            if (child.is('element', 'paragraph') && !child.hasAttribute('listItemId')) {
                
                // --- INÍCIO DA CORREÇÃO ---
                // Substituímos o método dataProcessor pelo método stringify, que é mais seguro
                // e garante que sempre teremos uma string para analisar.
                const textContent = editor.data.stringify(child);
                // --- FIM DA CORREÇÃO ---

                // REGRA 1: Parágrafo com recuo grande (6+ espaços) -> Transformar em citação
                const largeIndentRegex = /^\s{6,}/;
                if (largeIndentRegex.test(textContent)) {
                    const cleanedText = textContent.trimStart();
                    
                    // O método para substituir e criar a citação já estava correto
                    const newParagraph = writer.createElement('paragraph');
                    writer.insertText(cleanedText, newParagraph, 0);
                    const newBlockQuote = writer.createElement('blockQuote', {}, newParagraph);
                    
                    writer.replace(child, newBlockQuote);
                    quotesCreated++;
                
                // REGRA 2: Parágrafo com recuo pequeno (1-5 espaços) -> Alinhar à margem
                } else if (/^\s{1,5}/.test(textContent)) {
                    const cleanedText = textContent.trimStart();
                    
                    // O método para limpar o parágrafo também estava correto
                    writer.remove(writer.createRangeIn(child));
                    writer.insertText(cleanedText, child, 0);
                    paragraphsAligned++;
                }
            }
        }
    });

    editor.editing.view.focus();

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
