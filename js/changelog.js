// js/changelog.js

const ChangelogManager = (() => {
    // Dados centralizados das versões
    const DATA = {
        currentVersion: '1.1.5',
        history: [
            {
                version: '1.1.5',
                title: '🎧 Alta Fidelidade & Modo Foco: O Ditado Profissional',
                content: `
                    <ul>
                        <li><strong>Áudio de Alta Definição (HD):</strong> O motor de captura foi reescrito para solicitar qualidade de estúdio (48kHz). O sistema agora força o modo <strong>Mono</strong>, eliminando problemas de cancelamento de fase comuns em headsets USB e garantindo que a IA receba uma voz cristalina para transcrição.</li>
                        <li><strong>Modo Foco (Wake Lock):</strong> Implementamos a tecnologia <em>Screen Wake Lock API</em>. Agora, enquanto o microfone estiver aberto, o Power Editor impede que o sistema operacional desligue a tela ou entre em suspensão, permitindo sessões longas de ditado sem interrupções.</li>
                        <li><strong>Auto-Healing de Hardware:</strong> O sistema tornou-se resiliente. Se o seu microfone não suportar alta definição, o editor detecta o erro instantaneamente e reconfigura-se para o modo padrão (fallback) sem travar a aplicação.</li>
                    </ul>
                `
            },
            {
                version: '1.1.4',
                title: '🎙️ Engenharia de Áudio: Visualização Profissional e DSP',
                content: `
                    <ul>
                        <li><strong>Visualizador de Espectro Real:</strong> Substituímos a animação decorativa por um analisador de áudio profissional. Agora você vê barras coloridas que reagem instantaneamente à frequência e volume da sua voz. Se as barras não se moverem, seu microfone não está captando áudio.</li>
                        <li><strong>Tratamento de Sinal (DSP):</strong> Implementamos filtros invisíveis que melhoram a qualidade da captura:
                            <ul>
                                <li><strong>Filtro Passa-Alta:</strong> Remove ruídos graves de fundo (como ar-condicionado).</li>
                                <li><strong>Compressor Dinâmico:</strong> Nivela o volume da voz, garantindo que o visualizador funcione bem mesmo se você falar baixo.</li>
                            </ul>
                        </li>
                        <li><strong>Layout Robusto:</strong> O painel de ditado foi redesenhado com tecnologia Flexbox, garantindo que os controles nunca se sobreponham, independentemente do tamanho da tela.</li>
                    </ul>
                `
            },
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
                        <li><strong>Múltiplos Modos de Inserção:</strong> A ferramenta de voz agora possui três inteligências:
                            <ul>
                                <li><strong>Inserir:</strong> Texto cru, exatamente como ditado.</li>
                                <li><strong>Revisar:</strong> Correção gramatical e pontuação via IA.</li>
                                <li><strong>Jurídico:</strong> Transforma linguagem coloquial em norma culta jurídica (persona de assistente sênior).</li>
                            </ul>
                        </li>
                        <li><strong>Refatoração de Arquitetura:</strong> O histórico de versões (Changelog) foi desacoplado em um módulo próprio.</li>
                    </ul>
                `
            },
            {
                version: '1.1.1',
                title: '🤖 IA Ativa & Segurança Reforçada',
                content: `
                    <ul>
                        <li><strong>🔒 Cofre de Chaves:</strong> A API Key do Gemini agora é salva no LocalStorage do navegador, eliminando a necessidade do arquivo <code>config.js</code>.</li>
                        <li><strong>✨ Integração Estável:</strong> Correção de erros 404/429 na API do Google Gemini.</li>
                    </ul>
                `
            },
            {
                version: '1.1.0',
                title: '🎙️ A Revolução do Ditado',
                content: `
                    <ul>
                        <li><strong>Área de Rascunho (Buffer):</strong> O texto ditado aparece em uma área provisória para conferência antes da inserção.</li>
                        <li><strong>Cofre de Voz:</strong> Salvamento automático do rascunho em caso de fechamento acidental.</li>
                    </ul>
                `
            },
            {
                version: '1.0.9',
                title: '✨ Redesign do Criador de Ações Rápidas',
                content: `
                    <ul>
                        <li><strong>Layout de Cartões:</strong> Nova interface visual para seleção de tipos de variáveis.</li>
                        <li><strong>Ajuda Integrada:</strong> Botões de informação com exemplos práticos de código.</li>
                    </ul>
                `
            },
            {
                version: '1.0.8',
                title: '🚀 Assistente de Lógica Condicional',
                content: `
                    <ul>
                        <li><strong>Assistente Visual:</strong> Interface passo a passo para criar blocos complexos de <code>{{#if...}}</code> sem digitar código.</li>
                    </ul>
                `
            },
            {
                version: '1.0.7',
                title: '✨ Polimento de Interface',
                content: `
                    <ul>
                        <li><strong>Centralização de Modais:</strong> Janelas agora abrem sobre o editor.</li>
                        <li><strong>Ícone de Variável:</strong> Ajuste para cor fúcsia consistente.</li>
                    </ul>
                `
            },
            {
                version: '1.0.6',
                title: '🚀 Modelos Inteligentes',
                content: `
                    <ul>
                        <li><strong>Lógica Condicional:</strong> Introdução da sintaxe <code>{{#if:variavel=valor}}</code>.</li>
                        <li><strong>Feedback Visual:</strong> Realce de sintaxe dentro do editor de modelos.</li>
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
