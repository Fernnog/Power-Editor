// js/editor-actions.js
const EditorActions = (() => {

    // A função 'formatDocument' e sua função auxiliar 'getModelTextContent'
    // foram removidas deste arquivo. A lógica agora reside exclusivamente
    // dentro do novo plugin 'js/ckeditor-formatdoc-command.js',
    // tornando este módulo mais enxuto e de responsabilidade única.

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
