const SpeechDictation = (() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    let isListening = false;

    // Elementos da UI
    let ui = {
        micIcon: null,          // O ícone do microfone DENTRO do modal
        langSelect: null,
        statusDisplay: null,
        dictationModal: null,   // O modal completo
        toolbarMicButton: null  // O botão do microfone na toolbar principal
    };

    // Callback
    let onResultCallback = () => {};

    const isSupported = () => !!SpeechRecognition;

    const init = (config) => {
        if (!isSupported()) {
            console.warn('API de Reconhecimento de Voz não suportada neste navegador.');
            return;
        }
        
        ui.micIcon = config.micIcon;
        ui.langSelect = config.langSelect;
        ui.statusDisplay = config.statusDisplay;
        ui.dictationModal = config.dictationModal;
        ui.toolbarMicButton = config.toolbarMicButton;
        onResultCallback = config.onResult;

        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;

        setupListeners();
    };
    
    function processVoiceCommands(transcript) {
        // Dicionário de comandos para uma arquitetura mais limpa e escalável.
        const commands = {
            "ponto de interrogação": "?",
            "ponto de exclamação": "!",
            "nova linha": "<br>",
            "abrir parênteses": "(",
            "fechar parênteses": ")",
            "vírgula": ",",
            "ponto": "."
        };

        // Ordena os comandos do mais longo para o mais curto para evitar substituições parciais.
        // Isso garante que "ponto de interrogação" seja processado antes de "ponto".
        const sortedCommands = Object.keys(commands).sort((a, b) => b.length - a.length);

        let processedTranscript = transcript;
        
        sortedCommands.forEach(command => {
            const replacement = commands[command];
            const flags = 'gi'; // Global e Insensitive (não diferencia maiúsculas/minúsculas)
            
            // Regex para substituir o comando precedido por um espaço.
            const regexWithSpace = new RegExp(`\\s+\\b${command}\\b`, flags);
            processedTranscript = processedTranscript.replace(regexWithSpace, replacement);
            
            // Regex para substituir o comando no início da frase (sem espaço antes).
            const regexAtStart = new RegExp(`^\\b${command}\\b`, flags);
            processedTranscript = processedTranscript.replace(regexAtStart, replacement);
        });
        
        return processedTranscript;
    }

    const setupListeners = () => {
        recognition.onresult = (event) => {
            ui.toolbarMicButton.classList.remove('processing');
            ui.micIcon.classList.remove('processing');
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    transcript += event.results[i][0].transcript;
                }
            }
            if (transcript && typeof onResultCallback === 'function') {
                const processedTranscript = processVoiceCommands(transcript.trim());
                onResultCallback(processedTranscript + ' ');
            }
        };

        recognition.onerror = (event) => {
            console.error('Erro no reconhecimento de voz:', event.error);
            updateStatus('Erro: ' + event.error);
            stop(); // Garante que o modal feche e o estado seja limpo em caso de erro.
        };

        recognition.onend = () => {
            isListening = false;
            ui.toolbarMicButton.classList.remove('listening', 'processing');
            ui.micIcon.classList.remove('listening', 'processing');
            updateStatus('Clique no microfone para recomeçar');
            ui.dictationModal.classList.remove('visible'); // Esconde o modal ao final da sessão.
        };

        recognition.onspeechend = () => {
            ui.toolbarMicButton.classList.remove('listening');
            ui.toolbarMicButton.classList.add('processing');
            ui.micIcon.classList.remove('listening');
            ui.micIcon.classList.add('processing');
            updateStatus('Processando...');
        };
    };

    const start = () => {
        if (isListening || !recognition) return;
        try {
            recognition.lang = ui.langSelect.value;
            recognition.start();
            isListening = true;
            ui.toolbarMicButton.classList.remove('processing');
            ui.toolbarMicButton.classList.add('listening');
            ui.micIcon.classList.remove('processing');
            ui.micIcon.classList.add('listening');
            updateStatus('Ouvindo... Fale agora.');
            ui.dictationModal.classList.add('visible'); // Exibe o modal ao iniciar.
        } catch (error) {
            console.error("Erro ao iniciar a gravação:", error);
            updateStatus('Não foi possível iniciar.');
        }
    };

    const stop = () => {
        if (!isListening || !recognition) return;
        recognition.stop(); // A limpeza da UI agora é centralizada no evento 'onend'.
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
