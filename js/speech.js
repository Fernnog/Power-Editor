const SpeechDictation = (() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    let isListening = false;
    const STORAGE_KEY = 'dictation_buffer_backup';

    // Elementos da UI Mapeados
    let ui = {
        // Elementos básicos
        micIcon: null,
        langSelect: null,
        statusDisplay: null,
        dictationModal: null,
        toolbarMicButton: null,
        
        // Novos Elementos (Avançado)
        waveAnimation: null, // Referência para a div .sound-wave
        textArea: null,      // O buffer principal
        interimDisplay: null,// Div para texto provisório
        saveStatus: null,    // Feedback de salvamento
        btnInsert: null,     // Botão Inserir
        btnClear: null       // Botão Limpar
    };

    // Callback para quando o usuário confirma a inserção
    let onInsertCallback = () => {};

    const isSupported = () => !!SpeechRecognition;

    const init = (config) => {
        if (!isSupported()) {
            console.warn('API de Reconhecimento de Voz não suportada neste navegador.');
            return;
        }
        
        // Mescla a configuração recebida com o objeto ui
        ui = { ...ui, ...config };
        onInsertCallback = config.onInsert;

        recognition = new SpeechRecognition();
        recognition.continuous = true;     // Continua ouvindo mesmo após pausas
        recognition.interimResults = true; // Permite capturar texto enquanto ainda é falado

        setupListeners();
        restoreBackup(); // Tenta recuperar texto salvo anteriormente
    };

    // --- LÓGICA DE PERSISTÊNCIA (LOCALSTORAGE) ---
    function saveBackup(text) {
        localStorage.setItem(STORAGE_KEY, text);
        if (ui.saveStatus) {
            ui.saveStatus.classList.add('visible');
            // Remove a classe após 1.5s para efeito de "flash"
            setTimeout(() => {
                if (ui.saveStatus) ui.saveStatus.classList.remove('visible');
            }, 1500);
        }
    }

    function restoreBackup() {
        const backup = localStorage.getItem(STORAGE_KEY);
        if (backup && ui.textArea) {
            ui.textArea.value = backup;
        }
    }

    function clearBackup() {
        localStorage.removeItem(STORAGE_KEY);
        if (ui.textArea) {
            ui.textArea.value = '';
        }
    }

    // --- FORMATAÇÃO DE TEXTO ---
    function formatText(text) {
        const commands = {
            "ponto de interrogação": "?", 
            "interrogação": "?",
            "ponto de exclamação": "!", 
            "exclamação": "!",
            "nova linha": "\n", 
            "parágrafo": "\n\n",
            "vírgula": ",", 
            "virgula": ",",
            "ponto final": ".", 
            "ponto": "."
        };
        
        let formatted = text;
        
        // Substitui comandos de voz por pontuação
        Object.keys(commands).forEach(cmd => {
            const regex = new RegExp(`\\b${cmd}\\b`, 'gi');
            formatted = formatted.replace(regex, commands[cmd]);
        });
        
        // Remove espaços desnecessários antes de pontuações (ex: "palavra ." -> "palavra.")
        formatted = formatted.replace(/\s+([.,?!])/g, '$1');
        
        // Capitaliza a primeira letra se for o início absoluto da frase processada
        if (formatted.length > 0) {
             formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
        }

        return formatted;
    }

    // --- CONTROLE VISUAL CENTRALIZADO ---
    function toggleVisuals(active) {
        // Controle do ícone do microfone
        if (ui.micIcon) ui.micIcon.classList.toggle('listening', active);
        if (ui.toolbarMicButton) ui.toolbarMicButton.classList.toggle('listening', active);
        
        // Controle da Onda Sonora (Sound Wave)
        if (ui.waveAnimation) {
            if (active) {
                ui.waveAnimation.classList.add('active');
            } else {
                ui.waveAnimation.classList.remove('active');
            }
        }
    }

    const setupListeners = () => {
        recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += formatText(transcript);
                } else {
                    interimTranscript += transcript;
                }
            }

            // 1. Atualiza o Buffer Principal (TextArea) com o texto finalizado
            if (finalTranscript && ui.textArea) {
                const currentText = ui.textArea.value;
                
                // Lógica inteligente de espaçamento:
                // Se o buffer não estiver vazio e não terminar com espaço ou quebra de linha, adiciona um espaço.
                const separator = (currentText && !/[\s\n]$/.test(currentText)) ? ' ' : '';
                
                ui.textArea.value += separator + finalTranscript;
                
                // Auto-scroll para o final
                ui.textArea.scrollTop = ui.textArea.scrollHeight;
                
                // Persiste no LocalStorage
                saveBackup(ui.textArea.value);
            }

            // 2. Atualiza o Buffer Provisório (Div) com o texto que está sendo falado
            if (ui.interimDisplay) {
                ui.interimDisplay.textContent = interimTranscript;
            }
        };

        recognition.onend = () => {
            isListening = false;
            toggleVisuals(false);
            
            // Limpa o display provisório ao parar
            if (ui.interimDisplay) ui.interimDisplay.textContent = '';
            
            updateStatus('Pausado. Clique no microfone para continuar.');
        };

        recognition.onerror = (event) => {
            console.error('Erro no reconhecimento de voz:', event.error);
            updateStatus('Erro: ' + event.error);
            toggleVisuals(false);
        };

        // Listeners dos Botões de Ação
        if (ui.btnInsert) {
            ui.btnInsert.onclick = () => {
                if (ui.textArea && ui.textArea.value.trim()) {
                    // Envia o texto acumulado para o editor
                    onInsertCallback(ui.textArea.value);
                    
                    // Limpa o backup e o buffer após inserção bem-sucedida
                    clearBackup();
                    stop();
                    
                    // Fecha o modal
                    if (ui.dictationModal) ui.dictationModal.classList.remove('visible');
                }
            };
        }

        if (ui.btnClear) {
            ui.btnClear.onclick = () => {
                if (confirm('Tem certeza que deseja limpar todo o rascunho?')) {
                    clearBackup();
                }
            };
        }
    };

    const start = () => {
        if (isListening || !recognition) return;
        try {
            recognition.lang = ui.langSelect ? ui.langSelect.value : 'pt-BR';
            recognition.start();
            isListening = true;
            
            toggleVisuals(true); // Ativa animações
            updateStatus('Ouvindo... Fale naturalmente.');
            
            if (ui.dictationModal) ui.dictationModal.classList.add('visible');
            if (ui.textArea) ui.textArea.focus(); // Foca no buffer para edição imediata
            
        } catch (error) {
            console.error("Erro ao iniciar:", error);
            updateStatus('Não foi possível iniciar.');
        }
    };

    const stop = () => {
        if (!recognition) return;
        recognition.stop();
        // A limpeza visual ocorre em 'onend'
    };

    const updateStatus = (text) => {
        if (ui.statusDisplay) {
            ui.statusDisplay.textContent = text;
        }
    };

    return {
        init,
        start,
        stop,
        isSupported
    };

})();
