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

    console.clear(); // Limpa o console para o novo teste
    console.log("--- INICIANDO DIAGNÓSTICO AVANÇADO 'Formatar Doc' ---");

    const model = editor.model;
    const root = model.document.getRoot();

    if (root.childCount === 0) {
        alert('O editor está vazio.');
        return;
    }

    let modifiedCount = 0;

    model.change(writer => {
        console.log("[DEBUG] Bloco 'model.change' iniciado. O 'writer' está ativo.");

        for (const child of root.getChildren()) {
            if (child.is('element', 'paragraph') && !child.hasAttribute('listItemId')) {
                const currentIndent = child.getAttribute('indent') || 0;
                
                console.log(`\n-> Analisando parágrafo. Indent atual: ${currentIndent}`);
                
                // A lógica agora foca apenas em parágrafos sem recuo para o teste
                if (currentIndent === 0) {
                    modifiedCount++;
                    
                    // Log do estado ANTES da modificação
                    console.log("  [ANTES] Atributos do modelo:", Object.fromEntries(child.getAttributes()));

                    // APLICAÇÃO DAS AÇÕES
                    writer.setAttribute('alignment', 'justify', child);
                    writer.setAttribute('indent', 1, child);
                    
                    // AÇÃO DE DIAGNÓSTICO VISUAL: Aplicar um marcador de fundo amarelo
                    writer.setAttribute('highlight', 'yellowMarker', child);

                    // Log do estado DEPOIS da modificação
                    console.log("  [DEPOIS] Atributos do modelo:", Object.fromEntries(child.getAttributes()));
                    console.log("  [AÇÃO EXECUTADA] Tentativa de justificar, indentar e aplicar highlight amarelo.");
                } else {
                     console.log("  -> Parágrafo ignorado (já possui indent > 0).");
                }
            }
        }
    });
    
    console.log("\n--- DIAGNÓSTICO AVANÇADO FINALIZADO ---");
    console.log(`- Total de parágrafos que foram processados: ${modifiedCount}`);

    editor.editing.view.focus();

    if (modifiedCount > 0) {
         alert(`Diagnóstico avançado concluído! ${modifiedCount} parágrafo(s) foram processados. Verifique o console (F12) e se o texto ficou com o fundo amarelo.`);
    } else {
         alert('Diagnóstico avançado concluído! Nenhum parágrafo sem recuo foi encontrado para o teste.');
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
