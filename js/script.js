/* ARQUIVO: js/script.js */

document.addEventListener('DOMContentLoaded', () => {

    // --- SEÇÃO 1: INICIALIZAÇÃO DO EDITOR E FUNÇÕES BÁSICAS ---

    const editor = new Tiptap.Core.Editor({
        element: document.querySelector('#editor-container'),
        extensions: [
            Tiptap.StarterKit.default,
            Tiptap.Extensions.Underline,
        ],
        content: `
            <h2>Funcionalidades Restauradas!</h2>
            <p>Este é o editor moderno com todas as suas ferramentas. A <strong>sidebar</strong> está visível e os botões de <strong>Microfone</strong>, <strong>Correção com IA</strong> e <strong>Exportação</strong> estão prontos para uso.</p>
            <p>Experimente as formatações básicas ou utilize as funcionalidades avançadas.</p>
        `,
    });

    const basicButtons = {
        bold: document.querySelector('#bold-button'),
        italic: document.querySelector('#italic-button'),
        underline: document.querySelector('#underline-button'),
        strike: document.querySelector('#strike-button'),
        orderedList: document.querySelector('#ordered-list-button'),
        bulletList: document.querySelector('#bullet-list-button'),
        h1: document.querySelector('#h1-button'),
        h2: document.querySelector('#h2-button'),
    };

    // Conexão dos botões básicos
    basicButtons.bold.addEventListener('click', () => editor.chain().focus().toggleBold().run());
    basicButtons.italic.addEventListener('click', () => editor.chain().focus().toggleItalic().run());
    basicButtons.underline.addEventListener('click', () => editor.chain().focus().toggleUnderline().run());
    basicButtons.strike.addEventListener('click', () => editor.chain().focus().toggleStrike().run());
    basicButtons.orderedList.addEventListener('click', () => editor.chain().focus().toggleOrderedList().run());
    basicButtons.bulletList.addEventListener('click', () => editor.chain().focus().toggleBulletList().run());
    basicButtons.h1.addEventListener('click', () => editor.chain().focus().toggleHeading({ level: 1 }).run());
    basicButtons.h2.addEventListener('click', () => editor.chain().focus().toggleHeading({ level: 2 }).run());

    // Atualização da UI para botões básicos
    editor.on('transaction', () => {
        basicButtons.bold.classList.toggle('is-active', editor.isActive('bold'));
        basicButtons.italic.classList.toggle('is-active', editor.isActive('italic'));
        basicButtons.underline.classList.toggle('is-active', editor.isActive('underline'));
        basicButtons.strike.classList.toggle('is-active', editor.isActive('strike'));
        basicButtons.orderedList.classList.toggle('is-active', editor.isActive('orderedList'));
        basicButtons.bulletList.classList.toggle('is-active', editor.isActive('bulletList'));
        basicButtons.h1.classList.toggle('is-active', editor.isActive('heading', { level: 1 }));
        basicButtons.h2.classList.toggle('is-active', editor.isActive('heading', { level: 2 }));
    });

    // --- SEÇÃO 2: RECONEXÃO DAS FUNCIONALIDADES CUSTOMIZADAS ---
    
    const customButtons = {
        mic: document.querySelector('#mic-button'),
        gemini: document.querySelector('#gemini-button'),
        savePdf: document.querySelector('#save-pdf-button'),
        saveDoc: document.querySelector('#save-doc-button'),
    };

    // Lógica para o Microfone (Ditado)
    customButtons.mic.addEventListener('click', () => {
        // SUBSTITUA ESTE ALERT PELA SUA LÓGICA DE CAPTURA DE VOZ
        alert("Função de microfone a ser implementada. Ao receber o texto, use 'editor.commands.insertContent(texto)'.");
        // Exemplo de como inserir o texto no editor:
        // const recognizedText = "este é um texto vindo do microfone.";
        // editor.chain().focus().insertContent(recognizedText).run();
    });

    // Lógica para a Correção com Gemini (IA)
    customButtons.gemini.addEventListener('click', async () => {
        const geminiButton = customButtons.gemini;
        
        geminiButton.disabled = true;
        geminiButton.classList.add('is-loading');

        try {
            const currentContent = editor.getHTML();

            // SUBSTITUA ESTE CÓDIGO PELA SUA CHAMADA DE API REAL PARA O GEMINI
            console.log("Enviando para o Gemini:", currentContent);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simula a espera da API
            const correctedContent = currentContent.replace(/<p>/g, '<p>✨(IA) '); // Simula uma correção
            console.log("Recebido do Gemini:", correctedContent);

            editor.chain().focus().setContent(correctedContent).run();
            alert('Texto corrigido pela IA!');

        } catch (error) {
            console.error("Erro ao corrigir com Gemini:", error);
            alert("Ocorreu um erro ao tentar corrigir o texto.");
        } finally {
            geminiButton.disabled = false;
            geminiButton.classList.remove('is-loading');
        }
    });

    // Lógica para Salvar como PDF
    customButtons.savePdf.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const editorContent = editor.getHTML();
        
        // jsPDF tem limitações com HTML complexo. Este é um método básico.
        // Para resultados melhores, pode ser necessário um processamento mais avançado do HTML.
        doc.html(editorContent, {
            callback: function(doc) {
                doc.save('documento.pdf');
            },
            margin: [15, 15, 15, 15],
            autoPaging: 'text',
            width: 180, // Largura do conteúdo dentro do PDF
            windowWidth: 675 // Largura da janela para renderizar o HTML
        });
    });

    // Lógica para Salvar como DOCX
    customButtons.saveDoc.addEventListener('click', () => {
        const editorContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Documento</title>
            </head>
            <body>
                ${editor.getHTML()}
            </body>
            </html>
        `;
        const blob = htmlDocx.asBlob(editorContent);
        saveAs(blob, 'documento.docx');
    });
});
