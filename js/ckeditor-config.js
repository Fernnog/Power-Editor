// js/ckeditor-config.js

// NÃO HÁ MAIS PLUGINS CUSTOMIZADOS AQUI.

// --- CONFIGURAÇÃO PRINCIPAL DO CKEDITOR ---
const CKEDITOR_CONFIG = {
    // A propriedade 'extraPlugins' foi removida pois não estamos mais criando plugins.

    toolbar: {
        items: [
            'undo', 'redo', '|',
            'heading', '|',
            'style', // NOSSO NOVO DROPDOWN DE ESTILOS!
            '|',
            'bold', 'italic', '|',
            'bulletedList', 'numberedList'
        ]
    },

    language: 'pt-br',

    // AQUI ACONTECE A MÁGICA: Ensinamos o editor sobre nossos novos estilos.
    style: {
        definitions: [
            {
                name: 'Recuo de Parágrafo (3cm)',
                element: 'p', // Aplica-se a parágrafos
                styles: {
                    'text-indent': '3cm'
                }
            },
            {
                name: 'Recuo de Citação (6cm)',
                element: 'p', // Aplica-se a parágrafos
                styles: {
                    'margin-left': '6cm',
                    'font-style': 'italic'
                }
            }
        ]
    }
};
