// js/ckeditor-config.js

// --- CONFIGURAÇÃO PRINCIPAL DO CKEDITOR ---
const CKEDITOR_CONFIG = {
    toolbar: {
        items: [
            'undo', 'redo', '|',
            'style', // ADICIONADO: O novo dropdown de estilos.
            '|',
            'bold', 'italic', 'underline', '|',
            'bulletedList', 'numberedList', '|',
            'outdent', 'indent'
        ]
    },

    language: 'pt-br',

    // ADICIONADO: Definição dos nossos estilos personalizados.
    style: {
        definitions: [
            {
                name: 'Recuo de Parágrafo (3cm)',
                element: 'p', // Este estilo se aplica a elementos de parágrafo (<p>)
                styles: {
                    'text-indent': '3cm' // Aplica o recuo apenas na primeira linha.
                }
            },
            {
                name: 'Recuo de Citação (6cm)',
                element: 'p', // Este estilo também se aplica a parágrafos
                styles: {
                    'margin-left': '6cm',    // Aplica uma margem em todo o bloco.
                    'font-style': 'italic'   // Deixa o texto em itálico para diferenciar.
                }
            }
        ]
    }
};
