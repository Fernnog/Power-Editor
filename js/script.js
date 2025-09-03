// Aguarda o DOM estar completamente carregado para executar o script
document.addEventListener('DOMContentLoaded', function() {

    // Seleciona os elementos principais da página
    const editor = document.getElementById('rich-text-editor');
    const downloadBtn = document.getElementById('downloadBtn');

    if (!editor || !downloadBtn) {
        console.error("Elementos essenciais do editor (editor ou botão de download) não foram encontrados.");
        return;
    }

    /**
     * Intercepta o evento 'paste' no editor para tratar a formatação.
     */
    editor.addEventListener('paste', function(event) {
        // Impede a ação padrão de colar do navegador
        event.preventDefault();

        // Obtém o conteúdo da área de transferência
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
     * estilos de recuo (text-indent e margin-left).
     * @param {string} htmlString - O HTML bruto da área de transferência (ex: do Word).
     * @returns {string} - O HTML sanitizado e pronto para ser inserido.
     */
    function sanitizePastedHtml(htmlString) {
        // Usa um elemento temporário em memória para parsear o HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString;
      
        let finalHtml = '';
        // Itera sobre todos os elementos, focando principalmente em parágrafos
        const elements = tempDiv.querySelectorAll('p, li, div');

        if (elements.length > 0) {
            elements.forEach(el => {
                const style = el.style;
                const textIndent = style.textIndent;
                const marginLeft = style.marginLeft;
            
                let inlineStyle = '';
                if (textIndent) {
                    inlineStyle += `text-indent: ${textIndent}; `;
                }
                if (marginLeft) {
                    inlineStyle += `margin-left: ${marginLeft};`;
                }
            
                // Recria o elemento (usando a tag original) apenas com os estilos permitidos
                finalHtml += `<${el.tagName.toLowerCase()} style="${inlineStyle}">${el.innerHTML}</${el.tagName.toLowerCase()}>`;
            });
        }
        
        // Se nenhum elemento estrutural foi encontrado, trata como texto simples
        if (!finalHtml) {
            return tempDiv.innerText.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
        }

        return finalHtml;
    }

    /**
     * Adiciona o evento de clique ao botão de download para exportar o conteúdo.
     */
    downloadBtn.addEventListener('click', function() {
        const content = editor.innerHTML;
        const documentTitle = "Documento Exportado";

        // Cria um template HTML completo para que o arquivo seja auto-contido e visualizável
        const fileContent = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
              <meta charset="UTF-8">
              <title>${documentTitle}</title>
              <style>
                body { font-family: 'Times New Roman', Times, serif; line-height: 1.6; font-size: 16px; margin: 40px; }
                p, div { margin: 0 0 1em 0; }
              </style>
            </head>
            <body>
              ${content}
            </body>
            </html>
        `;

        // Usa a API Blob para criar o arquivo em memória
        const blob = new Blob([fileContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        // Cria um link temporário, simula o clique para iniciar o download e o remove
        const a = document.createElement('a');
        a.href = url;
        a.download = `${documentTitle}.html`;
        document.body.appendChild(a);
        a.click();

        // Limpa os recursos utilizados
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
});
