/* ARQUIVO: js/script.js */

// Espera o DOM carregar completamente antes de executar o script
document.addEventListener('DOMContentLoaded', () => {

    // 1. INICIALIZAÇÃO DO EDITOR TIPTAP
    // Criamos uma nova instância do editor, apontando para o nosso contêiner no HTML.
    // O 'StarterKit' é um pacote de extensões essenciais (parágrafos, negrito, listas, etc.)
    const editor = new Tiptap.Core.Editor({
        element: document.querySelector('#editor-container'),
        extensions: [
            Tiptap.StarterKit.default,
            Tiptap.Extensions.Underline, // Adicionando a extensão de sublinhado
        ],
        // Conteúdo inicial para exemplificar
        content: `
            <h2>Bem-vindo ao novo editor!</h2>
            <p>Este editor foi migrado para o <strong>TipTap</strong> para uma experiência mais moderna e robusta.</p>
            <p>Agora você pode criar listas formatadas corretamente:</p>
            <ol>
                <li>Primeiro item com texto longo para demonstrar o recuo suspenso que agora funciona perfeitamente, alinhando as linhas subsequentes.</li>
                <li>Segundo item da lista.</li>
            </ol>
            <p>Experimente usar os botões na barra de ferramentas acima.</p>
        `,
    });

    // 2. SELETORES DOS BOTÕES DA BARRA DE FERRAMENTAS
    const buttons = {
        bold: document.querySelector('#bold-button'),
        italic: document.querySelector('#italic-button'),
        underline: document.querySelector('#underline-button'),
        strike: document.querySelector('#strike-button'),
        orderedList: document.querySelector('#ordered-list-button'),
        bulletList: document.querySelector('#bullet-list-button'),
        h1: document.querySelector('#h1-button'),
        h2: document.querySelector('#h2-button'),
    };

    // 3. CONEXÃO DOS EVENTOS DOS BOTÕES COM A API DO TIPTAP
    // Para cada botão, adicionamos um evento de clique que executa um comando do editor.
    // A sintaxe 'editor.chain().focus()...run()' é o padrão do TipTap para aplicar formatações.
    
    buttons.bold.addEventListener('click', () => editor.chain().focus().toggleBold().run());
    buttons.italic.addEventListener('click', () => editor.chain().focus().toggleItalic().run());
    buttons.underline.addEventListener('click', () => editor.chain().focus().toggleUnderline().run());
    buttons.strike.addEventListener('click', () => editor.chain().focus().toggleStrike().run());
    buttons.orderedList.addEventListener('click', () => editor.chain().focus().toggleOrderedList().run());
    buttons.bulletList.addEventListener('click', () => editor.chain().focus().toggleBulletList().run());
    buttons.h1.addEventListener('click', () => editor.chain().focus().toggleHeading({ level: 1 }).run());
    buttons.h2.addEventListener('click', () => editor.chain().focus().toggleHeading({ level: 2 }).run());

    // 4. ATUALIZAÇÃO DA UI (FEEDBACK VISUAL DOS BOTÕES)
    // O evento 'transaction' é disparado a cada mudança no editor (digitar, formatar, etc.).
    // Usamos isso para verificar qual formatação está ativa e aplicar a classe '.is-active' aos botões.
    editor.on('transaction', () => {
        buttons.bold.classList.toggle('is-active', editor.isActive('bold'));
        buttons.italic.classList.toggle('is-active', 'italic');
        buttons.underline.classList.toggle('is-active', editor.isActive('underline'));
        buttons.strike.classList.toggle('is-active', editor.isActive('strike'));
        buttons.orderedList.classList.toggle('is-active', editor.isActive('orderedList'));
        buttons.bulletList.classList.toggle('is-active', editor.isActive('bulletList'));
        buttons.h1.classList.toggle('is-active', editor.isActive('heading', { level: 1 }));
        buttons.h2.classList.toggle('is-active', editor.isActive('heading', { level: 2 }));
    });
});
