// js/ckeditor-config.js

// NÃO HÁ MAIS PLUGINS CUSTOMIZADOS AQUI.

// --- CONFIGURAÇÃO PRINCIPAL DO CKEDITOR ---
const CKEDITOR_CONFIG = {
    // A propriedade 'extraPlugins' foi removida pois não estamos mais criando plugins.

    toolbar: {
        items: [
            'undo', 'redo', '|',
            'bold', 'italic', 'underline', '|',
            'bulletedList', 'numberedList', '|',
            'outdent', 'indent'
        ]
    },

    language: 'pt-br'

    // A configuração de 'style' foi removida pois o plugin não está disponível no build padrão.
};
