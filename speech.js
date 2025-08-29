const SpeechDictation = (() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    let isListening = false;

    // Elementos da UI
    let ui = {
        micIcon: null,
        langSelect: null,
        statusDisplay: null,
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
        onResultCallback = config.onResult;

        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;

        setupListeners();
    };
    
    function processVoiceCommands(transcript) {
        return transcript
            .replace(/\bvírgula\b/gi, ',')
            .replace(/\bponto\b/gi, '.')
            .replace(/\bnova linha\b/gi, '<br>');
    }

    const setupListeners = () => {
        ui.micIcon.addEventListener('click', toggle);

        recognition.onresult = (event) => {
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
        };

        recognition.onend = () => {
            isListening = false;
            ui.micIcon.classList.remove('listening', 'processing');
            updateStatus('Clique no microfone para recomeçar');
        };

        recognition.onspeechend = () => {
            stop();
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
            ui.micIcon.classList.remove('processing');
            ui.micIcon.classList.add('listening');
            updateStatus('Ouvindo... Fale agora.');
        } catch (error) {
            console.error("Erro ao iniciar a gravação:", error);
            updateStatus('Não foi possível iniciar.');
        }
    };

    const stop = () => {
        if (!isListening || !recognition) return;
        recognition.stop();
        isListening = false;
        ui.micIcon.classList.remove('listening');
    };

    const toggle = () => {
        if (isListening) {
            stop();
        } else {
            start();
        }
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
        toggle,
        isSupported
    };

})();