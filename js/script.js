'use strict';

document.addEventListener('DOMContentLoaded', () => {

    // --- Lógica Existente do Editor ---
    const commands = document.querySelectorAll('[data-command]');

    commands.forEach(button => {
        button.addEventListener('click', () => {
            const command = button.getAttribute('data-command');
            document.execCommand(command, false, null);
        });
    });


    // --- IMPLEMENTAÇÃO DA PRIORIDADE 1 ---

    // 1. Seleciona os elementos principais da página
    const editor = document.getElementById('rich-text-editor');
    const downloadBtn = document.getElementById('downloadBtn');

    /**
     * Intercepta o evento 'paste' no editor para tratar a formatação.
     */
    editor.addEventListener('paste', function(event) {
        // Impede a ação padrão de colar do navegador
        event.preventDefault();

        // Obtém o conteúdo da área de transferência como HTML
        const clipboardData = event.clipboardData || window.clipboardData;
        const pastedHtml = clipboardData.getData('text/html');

        // Se não houver conteúdo HTML (ex: copiado do Bloco de Notas), cola como texto puro
        if (!pastedHtml) {
            const plainText = clipboardData.getData('text/plain');
            document.execCommand('insertText', false, plainText);
            return;
        }
        
        // Limpa o HTML colado, mantendo apenas os estilos de recuo
        const sanitizedHtml = sanitizePastedHtml(pastedHtml);

        // Insere o HTML limpo e formatado na posição atual do cursor
        document.execCommand('insertHTML', false, sanitizedHtml);
    });

    /**
     * Função que analisa o HTML colado e preserva apenas tags seguras e
     * estilos de recuo (text-indent e margin-left), removendo o lixo do Word.
     * @param {string} htmlString - O HTML bruto da área de transferência.
     * @returns {string} - O HTML sanitizado.
     */
    function sanitizePastedHtml(htmlString) {
        // Usa um elemento temporário para parsear o HTML sem adicioná-lo ao DOM principal
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString;
        
        let finalHtml = '';
        // Itera sobre todos os parágrafos <p> do conteúdo colado
        tempDiv.querySelectorAll('p').forEach(p => {
            const style = p.style;
            const textIndent = style.textIndent;
            const marginLeft = style.marginLeft;
            
            let inlineStyle = '';
            if (textIndent) {
                inlineStyle += `text-indent: ${textIndent}; `;
            }
            if (marginLeft) {
                inlineStyle += `margin-left: ${marginLeft};`;
            }
            
            // Recria o parágrafo apenas com os estilos permitidos e seu conteúdo interno
            finalHtml += `<p style="${inlineStyle.trim()}">${p.innerHTML}</p>`;
        });
        
        // Se a sanitização não encontrou parágrafos, retorna o texto puro com quebras de linha
        return finalHtml || tempDiv.innerText.replace(/\n/g, '<br>');
    }

    /**
     * Adiciona o evento de clique ao botão de download para exportar o conteúdo.
     */
    downloadBtn.addEventListener('click', function() {
        const content = editor.innerHTML;
        const documentTitle = "Documento Exportado";

        // Cria um template HTML completo para que o arquivo seja independente e preserve os estilos
        const fileContent = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <title>${documentTitle}</title>
                <style>
                    body { font-family: 'Times New Roman', serif; line-height: 1.6; font-size: 16px; margin: 40px; }
                    p { margin: 0 0 1em 0; }
                    ol, ul { margin-top: 0; }
                </style>
            </head>
            <body>
                ${content}
            </body>
            </html>
        `;

        // Cria um objeto Blob, que representa o arquivo
        const blob = new Blob([fileContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        // Cria um link temporário para iniciar o download
        const a = document.createElement('a');
        a.href = url;
        a.download = `${documentTitle}.html`;
        document.body.appendChild(a);
        a.click();

        // Limpa o link e o objeto URL da memória para evitar memory leaks
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
});
