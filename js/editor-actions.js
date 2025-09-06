// js/editor-actions.js
const EditorActions = (() => {

    /**
     * Aplica formatação customizada ao documento no editor CKEditor.
     * @param {object} editor - A instância ativa do CKEditor.
     */
   // Cole este código de diagnóstico no lugar da função formatDocument existente
function formatDocument(editor) {
    if (!editor) {
        alert('Editor não está pronto. Tente novamente.');
        return;
    }

    console.clear(); // Limpa o console para uma nova análise
    console.log("--- INICIANDO DIAGNÓSTICO 'Formatar Doc' ---");

    const model = editor.model;
    const root = model.document.getRoot();
    const children = Array.from(root.getChildren()); // Converte para array para facilitar a contagem

    console.log(`[INFO] Documento encontrado com ${children.length} elemento(s) raiz.`);

    if (children.length === 0) {
        console.warn("[AVISO] O documento está vazio. Nenhuma formatação será aplicada.");
        alert('O editor está vazio.');
        return;
    }

    let paragraphsFound = 0;
    let paragraphsModified = 0;

    model.change(writer => {
        children.forEach((child, index) => {
            console.log(`\n[Elemento #${index + 1}] Analisando...`, child);

            // VERIFICAÇÃO 1: É um parágrafo válido para formatação?
            if (child.is('element', 'paragraph') && !child.hasAttribute('listItemId')) {
                paragraphsFound++;
                const currentIndent = child.getAttribute('indent') || 0;
                
                console.log(`  -> É um parágrafo. Recuo (indent) atual: ${currentIndent}`);

                // VERIFICAÇÃO 2: A lógica de formatação se aplica?
                if (currentIndent > 1) {
                    paragraphsModified++;
                    console.log("    [AÇÃO] Recuo > 1. Convertendo para citação (blockQuote).");
                    writer.rename(child, 'blockQuote');
                    writer.removeAttribute('indent', child);
                } else if (currentIndent === 0) {
                    paragraphsModified++;
                    console.log("    [AÇÃO] Recuo == 0. Aplicando recuo 1 e justificação.");
                    writer.setAttribute('alignment', 'justify', child);
                    writer.setAttribute('indent', 1, child);
                } else {
                    console.log("    [IGNORADO] Parágrafo já possui recuo nível 1. Nenhuma ação necessária.");
                }
            } else {
                console.log("  -> Não é um parágrafo formatável (pode ser um título, lista, etc.).");
            }
        });
    });

    console.log(`\n--- DIAGNÓSTICO FINALIZADO ---`);
    console.log(`  - Parágrafos formatáveis encontrados: ${paragraphsFound}`);
    console.log(`  - Parágrafos que deveriam ter sido modificados: ${paragraphsModified}`);

    editor.editing.view.focus();
    alert(`Diagnóstico concluído! Verifique o console do navegador (F12) para os resultados.`);
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
