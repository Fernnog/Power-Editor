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

    // Ferramenta para extrair o texto puro de um nó do modelo
    const dataProcessor = editor.data.processor;
    
    model.change(writer => {
        // É importante iterar sobre uma cópia estática, pois vamos modificar a árvore
        const childrenToProcess = Array.from(root.getChildren());

        for (const child of childrenToProcess) {
            if (child.is('element', 'paragraph') && !child.hasAttribute('listItemId')) {
                
                // Converte o parágrafo do modelo para uma string de texto puro para análise
                const viewFragment = dataProcessor.toView(child);
                const textContent = dataProcessor.toData(viewFragment);
                
                // REGRA 1: Parágrafo com recuo grande (6+ espaços) -> Transformar em citação
                const largeIndentRegex = /^\s{6,}/;
                if (largeIndentRegex.test(textContent)) {
                    const cleanedText = textContent.trimStart(); // Remove todos os espaços iniciais
                    
                    // Cria uma nova citação com um parágrafo dentro
                    const newParagraph = writer.createElement('paragraph');
                    writer.insertText(cleanedText, newParagraph, 0);
                    const newBlockQuote = writer.createElement('blockQuote', {}, newParagraph);
                    
                    // Substitui o parágrafo antigo pela nova citação
                    writer.replace(child, newBlockQuote);
                    quotesCreated++;
                
                // REGRA 2: Parágrafo com recuo pequeno (1-5 espaços) -> Alinhar à margem
                } else if (/^\s{1,5}/.test(textContent)) {
                    const cleanedText = textContent.trimStart();
                    
                    // Limpa o conteúdo atual do parágrafo
                    writer.remove(writer.createRangeIn(child));
                    // Insere o texto limpo de volta
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
