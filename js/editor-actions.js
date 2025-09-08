// js/editor-actions.js
const EditorActions = (() => {

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
        clearDocument
    };
})();
