// --- script.js ---

// Simulando outros imports que a aplicação possa ter (se existirem)
// import { handleMobileMenu } from './ui-helpers.js';
// import { setupFormValidation } from './form-validator.js';

// 1. IMPORTAÇÕES NECESSÁRIAS PARA O CKEDITOR
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Essentials } from '@ckeditor/ckeditor5-essentials';
import { Paragraph } from '@ckeditor/ckeditor5-paragraph';
import { Bold } from '@ckeditor/ckeditor5-basic-styles';
import { Italic } from '@ckeditor/ckeditor5-basic-styles';
import { FormatDocPlugin } from './ckeditor-formatdoc-command.js';

/**
 * Função para inicializar o editor de texto avançado (CKEditor).
 */
function initializeEditor() {
    const editorElement = document.querySelector('#editor');

    if (!editorElement) {
        console.warn('Elemento #editor não encontrado. O CKEditor não será inicializado.');
        return;
    }
    
    ClassicEditor
        .create(editorElement, {
            plugins: [
                Essentials,
                Paragraph,
                Bold,
                Italic,
                FormatDocPlugin
            ],
            toolbar: [
                'formatdoc',
                '|',
                'bold',
                'italic'
            ]
        })
        .then(editor => {
            console.log('Editor foi inicializado com sucesso!', editor);
            window.editor = editor; // Opcional: expõe o editor globalmente para debug
        })
        .catch(error => {
            console.error('Ocorreu um erro ao inicializar o CKEditor:', error);
        });
}

/**
 * Função principal que é executada quando o DOM está pronto.
 */
function main() {
    // Inicializa outras funcionalidades da página (exemplos)
    // handleMobileMenu();
    // setupFormValidation();
    
    // Inicializa o editor de texto
    initializeEditor();
}

// Garante que o script só rode após o carregamento completo da página.
document.addEventListener('DOMContentLoaded', main);
