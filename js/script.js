// --- script.js ---

// Simulando outros imports que a aplicação possa ter
import { handleMobileMenu } from './ui-helpers.js';
import { setupFormValidation } from './form-validator.js';

// --- INÍCIO DA CORREÇÃO (PRIORIDADE 1) ---

// 1. IMPORTAÇÕES NECESSÁRIAS PARA O CKEDITOR
// Importa o editor principal
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

// Importa os plugins essenciais que fornecem a arquitetura base (incluindo a classe 'Command')
import { Essentials } from '@ckeditor/ckeditor5-essentials';
import { Paragraph } from '@ckeditor/ckeditor5-paragraph';

// Importa os plugins de formatação que já estavam em uso
import { Bold } from '@ckeditor/ckeditor5-basic-styles';
import { Italic } from '@ckeditor/ckeditor5-basic-styles';

// Importa o plugin customizado que estava causando o erro
import { FormatDocPlugin } from './ckeditor-formatdoc-command.js';

// --- FIM DA CORREÇÃO (PRIORIDADE 1) ---


/**
 * Função para inicializar o editor de texto avançado (CKEditor).
 */
function initializeEditor() {
    const editorElement = document.querySelector('#editor');

    if (!editorElement) {
        console.warn('Elemento #editor não encontrado. O CKEditor não será inicializado.');
        return;
    }
    
    // --- INÍCIO DA MODIFICAÇÃO NO CÓDIGO (PRIORIDADE 1) ---

    // O bloco de configuração foi ajustado para incluir os plugins base 'Essentials' e 'Paragraph'.
    // Esta é a correção que resolve o erro 'Cannot read properties of undefined (reading 'Command')'.
    ClassicEditor
        .create(editorElement, {
            plugins: [
                // Plugins base OBRIGATÓRIOS para o funcionamento do core
                Essentials,
                Paragraph,

                // Plugins de formatação que já estavam sendo usados
                Bold,
                Italic,
                
                // Plugin customizado que agora pode ser carregado com segurança
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
            // Este bloco .catch() continuará a capturar erros, mas o erro de inicialização foi resolvido.
            console.error('Ocorreu um erro ao inicializar o CKEditor:', error);
        });

    // --- FIM DA MODIFICAÇÃO NO CÓDIGO (PRIORIDADE 1) ---
}

/**
 * Função principal que é executada quando o DOM está pronto.
 */
function main() {
    // Inicializa outras funcionalidades da página
    handleMobileMenu();
    setupFormValidation();
    
    // Inicializa o editor de texto
    initializeEditor();
}

// Garante que o script só rode após o carregamento completo da página.
document.addEventListener('DOMContentLoaded', main);
