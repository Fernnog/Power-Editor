// js/ckeditor-config.js

// As funções de Plugin (MicPlugin, AiCorrectionPlugin, ReplacePlugin) foram removidas
// para evitar o erro de inicialização. As funcionalidades serão movidas para a sidebar.

// CONFIGURAÇÃO PRINCIPAL DO CKEDITOR SIMPLIFICADA
const CKEDITOR_CONFIG = {
    toolbar: {
        items: [
            'undo', 'redo', '|',
            'heading', '|',
            'bold', 'italic', '|',
            'bulletedList', 'numberedList', 'blockQuote'
        ]
    },
    language: 'pt-br',
};
