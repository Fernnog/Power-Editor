// js/ckeditor-config.js

const CKEDITOR_CONFIG = {
    // A propriedade 'extraPlugins' foi adicionada para registrar nosso novo comando customizado.
    // O CKEditor agora carregará o FormatDocPlugin que definimos no novo arquivo.
    extraPlugins: [FormatDocPlugin],

    toolbar: {
        items: [
            'undo', 'redo', '|',
            'bold', 'italic', 'underline', '|',
            'bulletedList', 'numberedList', '|',
            'outdent', 'indent', '|',
            'blockQuote' // ADICIONADO: Botão para aplicar o estilo de citação
        ]
    },

    language: 'pt-br'
};
