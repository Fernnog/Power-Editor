// js/changelog.js

const ChangelogManager = (() => {
    // Dados centralizados das versões
    const DATA = {
        currentVersion: '1.1.3',
        history: [
            {
                version: '1.1.3',
                title: '🎨 Polimento Visual: Uniformidade no Ditado',
                content: `
                    <ul>
                        <li><strong>Botões de Ação Padronizados:</strong> A interface do modal "Ditar" recebeu um ajuste fino de design. Os botões "Limpar", "Inserir", "Revisar" e "Jurídico" agora possuem exatamente a mesma altura, espaçamento e formato arredondado. Isso elimina a inconsistência visual anterior e melhora a área de clique, proporcionando uma experiência de uso mais fluida e profissional.</li>
                    </ul>
                `
            },
            {
                version: '1.1.2',
                title: '⚖️ Power Dictation & Organização',
                content: `
                    <ul>
                        <li><strong>Múltiplos Modos de Inserção:</strong> A ferramenta de ditado agora é uma central de inteligência com três opções distintas:
                            <ul>
                                <li><strong>Inserir:</strong> Adiciona o texto cru, exatamente como foi ditado.</li>
                                <li><strong>Revisar:</strong> Realiza a correção gramatical e de pontuação padrão.</li>
                                <li><strong>Jurídico:</strong> Transforma o ditado em um texto formal e técnico, ideal para peças processuais, utilizando uma persona de assistente jurídico sênior.</li>
                            </ul>
                        </li>
                        <li><strong>Refatoração de Arquitetura:</strong> O histórico de versões (Changelog) foi desacoplado das configurações do editor. Agora ele reside em um arquivo próprio, facilitando a manutenção e futuras atualizações sem risco de quebrar a configuração do TinyMCE.</li>
                    </ul>
                `
            },
            {
                version: '1.1.1',
                title: '🤖 IA Ativa & Segurança Reforçada: O Fim do Config.js',
                content: `
                    <ul>
                        <li><strong>🔒 Cofre de Chaves (LocalStorage):</strong> A segurança foi elevada ao nível máximo. Removemos a necessidade de salvar sua Chave de API em arquivos de código (<code>config.js</code>). Agora, o sistema solicita a chave <strong>uma única vez</strong> via interface e a guarda seguramente no "cofre" do seu navegador.</li>
                        <li><strong>✨ Integração Gemini Estável:</strong> O fluxo de correção gramatical foi destravado. O botão "Inserir" agora se conecta de forma inteligente à API do Google Gemini, gerenciando automaticamente a autenticação e o processamento do texto.</li>
                        <li><strong>🛠️ Correção de Infraestrutura:</strong> Ajustes profundos na seleção de modelos de IA resolveram os erros de "Modelo não encontrado" (404) e "Cota Excedida" (429), garantindo o acesso ao nível gratuito (Free Tier).</li>
                    </ul>
                `
            },
            {
                version: '1.1.0',
                title: '🎙️ A Revolução do Ditado: Rascunho Seguro e Feedback Visual',
                content: `
                    <ul>
                        <li><strong>NOVO - Área de Rascunho Inteligente (Buffer):</strong> O ditado não insere mais o texto "às cegas" no documento. Agora, suas palavras aparecem instantaneamente em uma área de edição dedicada. Você vê o texto se formando em tempo real (com feedback provisório) e pode revisar tudo antes de clicar em "Inserir".</li>
                        <li><strong>NOVO - Cofre de Voz (Auto-Save):</strong> Nunca mais perca uma ideia por falha na internet ou fechamento acidental. O sistema agora salva cada palavra ditada automaticamente na memória do navegador. Ao reabrir a ferramenta de voz, seu texto estará lá, intacto, esperando por você.</li>
                        <li><strong>NOVO - Visualizador de Onda Sonora:</strong> Chega da dúvida "será que o microfone está ligado?". Uma nova animação de ondas sonoras (Sound Wave) aparece ao lado do ícone, oferecendo feedback visual claro e moderno de que o sistema está ouvindo ativamente.</li>
                    </ul>
                `
            },
            {
                version: '1.0.9',
                title: '✨ Clareza Total: Redesign do Criador de Ações Rápidas com Ajuda Integrada',
                content: `
                    <ul>
                        <li><strong>NOVO - Layout de Cartões e Organização Visual:</strong> A janela "Criador de Ações Rápidas" foi completamente redesenhada. Cada opção agora é apresentada em um "cartão" individual com separadores visuais, tornando a interface mais limpa, organizada e fácil de navegar.</li>
                        <li><strong>NOVO - Ajuda Contextual e Detalhada:</strong> Chega de dúvidas! Cada cartão agora possui um <strong>ícone de ajuda (i)</strong>. Ao clicar, uma janela se abre com uma explicação detalhada sobre o que a funcionalidade faz, como usá-la e um <strong>exemplo prático de código</strong>, eliminando a confusão entre "Menu de Opções" e "Lógica Condicional".</li>
                        <li><strong>Experiência Aprimorada:</strong> Com o novo design e a ajuda integrada, criar modelos inteligentes tornou-se um processo muito mais intuitivo e guiado, reduzindo a curva de aprendizado e permitindo que você aproveite ao máximo as funcionalidades avançadas.</li>
                    </ul>
                `
            },
            {
                version: '1.0.8',
                title: '🚀 Assistente de Lógica Condicional e Simplificação da Interface',
                content: `
                    <ul>
                        <li><strong>NOVO - Assistente de Lógica Condicional (Se...Então...):</strong> Cansado de decorar a sintaxe <code>{{#if...}}</code>? A nova opção "Lógica Condicional" abre um assistente passo a passo. Basta criar sua pergunta (ex: "Singular ou Plural?"), definir as opções e preencher o texto para cada uma. O sistema monta o código complexo para você, tornando a criação de documentos inteligentes mais rápida e visual do que nunca.</li>
                        <li><strong>Interface Simplificada e Intuitiva:</strong> As opções "Número do Processo", "Nome da Parte" e "Status da Decisão" foram removidas da lista de Ações Rápidas. Elas eram redundantes, pois as mesmas funcionalidades podem ser alcançadas de forma mais flexível com as ferramentas "Caixa de Pergunta" e "Menu de Opções". O resultado é uma interface mais limpa e focada no que é essencial.</li>
                    </ul>
                `
            },
            {
                version: '1.0.7',
                title: '✨ Polimento de Interface e Qualidade de Vida',
                content: `
                    <ul>
                        <li><strong>Ícone de Variável Refinado:</strong> O ícone de raio (⚡️) na barra lateral foi ajustado em tamanho e cor (agora fúcsia), garantindo maior consistência visual com os outros elementos da interface.</li>
                        <li><strong>Centralização Inteligente de Modais:</strong> As janelas de diálogo (como "Salvar Modelo") agora aparecem centralizadas sobre a área de edição de texto, e não mais no centro da tela inteira. Isso mantém o foco do usuário onde a ação está ocorrendo.</li>
                        <li><strong>Guia de Funcionalidades Aprimorado:</strong> A janela de ajuda foi otimizada para melhor usabilidade:
                            <ul>
                                <li>Adicionada uma <strong>barra de rolagem</strong> para garantir que todo o conteúdo seja acessível, mesmo em telas menores.</li>
                                <li>Implementado um botão <strong>"Copiar Exemplo"</strong> em cada seção, permitindo que você utilize os códigos de sintaxe avançada de forma rápida e sem erros.</li>
                            </ul>
                        </li>
                    </ul>
                `
            },
            {
                version: '1.0.6',
                title: '🚀 Modelos Inteligentes: Lógica Condicional e Agilidade na Criação',
                content: `
                    <ul>
                        <li><strong>Lógica Condicional ("Se...Então..."):</strong> Crie modelos que se adaptam a diferentes cenários. Use a nova sintaxe <code>{{#if:variavel=valor}}...{{/if}}</code> para lidar com variações como singular/plural ou masculino/feminino em um único modelo, eliminando redundância.</li>
                        <li><strong>Criação de Modelos Acelerada:</strong> Ao clicar em "Adicionar", o conteúdo do editor principal é automaticamente transferido para a janela de criação de modelo, economizando tempo e cliques.</li>
                        <li><strong>Feedback Visual Aprimorado:</strong>
                            <ul>
                                <li><strong>Ícone de Raio (⚡️):</strong> Modelos com variáveis agora são facilmente identificáveis na barra lateral por um novo ícone, substituindo a antiga engrenagem.</li>
                                <li><strong>Realce de Sintaxe:</strong> Dentro do editor de modelos, a sintaxe <code>{{...}}</code> é destacada com um fundo fúcsia pulsante, confirmando seu reconhecimento pelo sistema.</li>
                            </ul>
                        </li>
                        <li><strong>Documentação Atualizada:</strong> O guia de ajuda (ícone 'i') foi atualizado com instruções detalhadas e exemplos da nova e poderosa funcionalidade de lógica condicional.</li>
                    </ul>
                `
            },
            {
                version: '1.0.5',
                title: '🚀 Aprimoramento de Variáveis de Sistema',
                content: `
                    <ul>
                        <li><strong>Clique para Copiar:</strong> Clicar em uma variável de sistema (ex: "Data Atual") na aba Power ⚡️ agora copia seu código (<code>{{data_atual}}</code>) para a área de transferência.</li>
                        <li><strong>Arrastar e Soltar Inteligente:</strong> Arrastar uma variável de sistema para o editor agora insere seu valor final processado (ex: "10/10/2025") em vez do código, agilizando a criação de documentos.</li>
                    </ul>
                `
            },
            {
                version: '1.0.4',
                title: '⚡️ Power Tab Overhaul & UX Polish',
                content: `
                    <ul>
                        <li><strong>Arrastar e Soltar Inteligente:</strong> Corrigido o comportamento crítico de arrastar e soltar. Agora, ao arrastar uma variável de sistema (como "Data Atual") para o editor, o valor final (ex: "05/09/2024") é inserido, em vez do código <code>{{data_atual}}</code>.</li>
                        <li><strong>Fluxo de Criação Simplificado:</strong> O botão "Adicionar" na aba Power agora funciona de forma intuitiva. Ele abre a janela padrão para criar um <strong>novo modelo rápido</strong>, em vez do antigo pop-up confuso.</li>
                        <li><strong>Clique para Copiar:</strong> Clicar em uma variável de sistema (as tags fúcsia) agora copia seu código (ex: <code>{{hora_atual}}</code>) diretamente para a área de transferência, facilitando a construção de modelos complexos.</li>
                        <li><strong>Consistência Visual:</strong> As variáveis de sistema são apresentadas como "tags" sem botões de ação, reforçando que são elementos nativos e não editáveis, distinguindo-as claramente dos seus modelos personalizados.</li>
                    </ul>
                `
            }
        ]
    };

    /**
     * Injeta o link da versão na barra de status do TinyMCE.
     * Deve ser chamado dentro do hook 'init' do TinyMCE.
     */
    function init(editor) {
        try {
            const statusBar = editor.getContainer().querySelector('.tox-statusbar');
            // Busca o elemento de branding para usar como âncora
            const brandingLink = statusBar.querySelector('.tox-statusbar__branding');
            
            if (brandingLink) {
                // Verifica se já existe para evitar duplicidade em re-renderizações
                if (statusBar.querySelector('.version-changelog-link')) return;

                const versionEl = document.createElement('a');
                versionEl.className = 'version-changelog-link';
                versionEl.textContent = `| Versão ${DATA.currentVersion}`;
                versionEl.title = 'Clique para ver o histórico de mudanças';
                versionEl.href = "javascript:void(0)"; // Garante comportamento de link

                versionEl.onclick = (e) => {
                    e.preventDefault();
                    if (typeof ModalManager !== 'undefined') {
                        ModalManager.show({
                            type: 'info',
                            title: 'Histórico de Versões',
                            initialData: {
                                title: `Novidades da Versão ${DATA.currentVersion}`,
                                cards: DATA.history.map(item => ({
                                    title: `Versão ${item.version} - ${item.title}`,
                                    content: item.content
                                }))
                            }
                        });
                    } else {
                        console.error('ModalManager não está definido.');
                    }
                };
                
                // Insere o novo elemento logo após o link de branding do TinyMCE
                brandingLink.parentNode.insertBefore(versionEl, brandingLink.nextSibling);
            }
        } catch (error) {
            console.error("Não foi possível adicionar o link de changelog:", error);
        }
    }

    // Expõe a função pública
    return { init };
})();
