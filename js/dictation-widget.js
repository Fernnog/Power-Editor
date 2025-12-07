// modules/dictation-widget.js
import { processTextWithAI } from './ai-service.js';

let recognition;
let activeTargetInput = null; // O input onde o texto final será inserido
let isListening = false;

// Elementos do Modal Flutuante
let widgetOverlay, widgetContent, liveTextDisplay, btnConfirm, btnCancel, statusIndicator;

function createWidgetUI() {
    if (document.getElementById('neuro-voice-widget')) return;

    const html = `
    <div id="neuro-voice-widget" class="voice-widget-overlay">
        <div class="voice-widget-content">
            <div class="voice-header">
                <span class="material-symbols-outlined voice-pulse">mic</span>
                <span id="voice-status">Ouvindo...</span>
            </div>
            <div id="voice-live-text" class="voice-preview-box" placeholder="Fale agora..."></div>
            <div class="voice-actions">
                <button id="voice-cancel-btn" class="btn-voice-cancel">Cancelar</button>
                <button id="voice-confirm-btn" class="btn-voice-confirm">
                    <span class="material-symbols-outlined">auto_fix</span> Processar & Inserir
                </button>
            </div>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', html);

    // Cache dos elementos
    widgetOverlay = document.getElementById('neuro-voice-widget');
    liveTextDisplay = document.getElementById('voice-live-text');
    statusIndicator = document.getElementById('voice-status');
    
    document.getElementById('voice-cancel-btn').onclick = closeWidget;
    document.getElementById('voice-confirm-btn').onclick = handleProcessAndInsert;
}

function initSpeech() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Seu navegador não suporta ditado de voz.");
        return false;
    }
    
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        // Atualiza visualização. Se tiver texto final, acumula.
        if (finalTranscript) {
            liveTextDisplay.innerText += (liveTextDisplay.innerText ? ' ' : '') + finalTranscript;
        }
        // O texto interino poderia ser mostrado de outra cor, mas para simplificar, apenas appended ou ignoramos aqui
    };

    recognition.onerror = (event) => {
        statusIndicator.textContent = "Erro: " + event.error;
        statusIndicator.style.color = "red";
    };
    
    return true;
}

export function attachDictationToInput(inputElement, triggerBtn) {
    if (!recognition) {
        createWidgetUI();
        if (!initSpeech()) return;
    }

    triggerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        activeTargetInput = inputElement;
        openWidget();
    });
}

function openWidget() {
    liveTextDisplay.innerText = "";
    statusIndicator.textContent = "Ouvindo...";
    statusIndicator.style.color = "#333";
    widgetOverlay.classList.add('visible');
    
    try {
        recognition.start();
        isListening = true;
    } catch(e) { console.warn(e); }
}

function closeWidget() {
    if (isListening) {
        recognition.stop();
        isListening = false;
    }
    widgetOverlay.classList.remove('visible');
    activeTargetInput = null;
}

async function handleProcessAndInsert() {
    const rawText = liveTextDisplay.innerText;
    if (!rawText) return;

    // Feedback Visual
    const btn = document.getElementById('voice-confirm-btn');
    const originalBtnContent = btn.innerHTML;
    btn.innerHTML = `<span class="material-symbols-outlined spin">sync</span> Melhorando...`;
    btn.disabled = true;

    // Para o microfone
    if (isListening) {
        recognition.stop();
        isListening = false;
    }

    try {
        // Mágica da IA
        const finalText = await processTextWithAI(rawText);
        
        // Inserção no input alvo
        if (activeTargetInput) {
            const currentVal = activeTargetInput.value;
            activeTargetInput.value = currentVal + (currentVal ? ' ' : '') + finalText;
            
            // Dispara evento para garantir que o state.js ou outros listeners percebam a mudança
            activeTargetInput.dispatchEvent(new Event('change', { bubbles: true }));
            activeTargetInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        closeWidget();
    } catch (error) {
        alert("Erro ao processar com IA. Inserindo texto cru.");
        if (activeTargetInput) activeTargetInput.value += " " + rawText;
        closeWidget();
    } finally {
        btn.innerHTML = originalBtnContent;
        btn.disabled = false;
    }
}
