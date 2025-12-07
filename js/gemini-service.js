const GeminiService = (() => {
    // Configurações Iniciais
    // Tenta pegar o modelo do config, ou usa o padrão seguro
    const MODEL = (typeof CONFIG !== 'undefined' && CONFIG.model) ? CONFIG.model : 'gemini-flash-latest';
    const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';
    const STORAGE_KEY = 'minha_chave_gemini_secreta'; // O nome do nosso "cofre"

    /**
     * Função interna para gerenciar a chave de segurança
     */
    function _getApiKey() {
        // 1. Verifica se (por acaso) ainda está no arquivo de config
        if (typeof CONFIG !== 'undefined' && CONFIG.apiKey) {
            return CONFIG.apiKey;
        }

        // 2. Tenta pegar do "Cofre" do navegador (LocalStorage)
        let savedKey = localStorage.getItem(STORAGE_KEY);

        // 3. Se não tiver em lugar nenhum, pede ao usuário
        if (!savedKey) {
            savedKey = prompt("⚠️ Configuração Necessária\n\nPara usar a IA, cole sua Chave de API do Google Gemini abaixo.\nEla será salva apenas no seu navegador.");
            
            // Se o usuário digitou algo, salva no cofre
            if (savedKey && savedKey.trim().length > 10) {
                savedKey = savedKey.trim();
                localStorage.setItem(STORAGE_KEY, savedKey);
                alert("✅ Chave salva com sucesso! Você já pode usar o ditado.");
            }
        }

        return savedKey;
    }

    /**
     * Função auxiliar privada para realizar a chamada à API do Gemini.
     * Centraliza a lógica de fetch, tratamento de erro e limpeza de chave inválida.
     * @param {string} apiKey - A chave de API validada.
     * @param {string} promptText - O prompt completo a ser enviado.
     */
    async function _callGeminiAPI(apiKey, promptText) {
        try {
            const url = `${BASE_URL}${MODEL}:generateContent?key=${apiKey}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptText }] }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 2000
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                
                // Se o erro for de permissão (chave inválida), limpamos o cofre para pedir de novo na próxima
                if (response.status === 400 || response.status === 403) {
                    localStorage.removeItem(STORAGE_KEY);
                    console.error("Chave inválida removida. O usuário terá que inserir novamente.");
                }

                throw new Error(`Erro API (${response.status}): ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0]?.content?.parts[0]) {
                return data.candidates[0].content.parts[0].text.trim();
            } else {
                throw new Error("Formato de resposta inválido");
            }

        } catch (error) {
            console.error("Falha na comunicação com IA:", error);
            throw error; // Re-lança o erro para ser tratado pela UI
        }
    }

    /**
     * Envia o texto completo para correção gramatical padrão.
     * Usa o PromptManager para obter as instruções.
     */
    async function correctText(textToCorrect) {
        if (!textToCorrect || !textToCorrect.trim()) return textToCorrect;

        const apiKey = _getApiKey();
        if (!apiKey) {
            alert("Operação cancelada: Nenhuma chave de API fornecida.");
            return textToCorrect;
        }

        // MODIFICAÇÃO: Uso do PromptManager
        if (typeof PromptManager === 'undefined' || !PromptManager.correction) {
            console.error("PromptManager não foi carregado.");
            return textToCorrect;
        }

        const promptText = PromptManager.correction.replace('{{TEXT}}', textToCorrect);

        try {
            return await _callGeminiAPI(apiKey, promptText);
        } catch (error) {
            alert(`Erro na IA: ${error.message}\n\nInserindo texto original.`);
            return textToCorrect;
        }
    }

    /**
     * Refina o texto para o contexto jurídico trabalhista.
     * Usa o PromptManager para obter as instruções.
     */
    async function refineLegalText(textToCorrect) {
        if (!textToCorrect || !textToCorrect.trim()) return textToCorrect;
        
        const apiKey = _getApiKey();
        if (!apiKey) {
            alert("Operação cancelada: Nenhuma chave de API fornecida.");
            return textToCorrect;
        }

        // MODIFICAÇÃO: Uso do PromptManager
        if (typeof PromptManager === 'undefined' || !PromptManager.legal_senior) {
            console.error("PromptManager não foi carregado.");
            return textToCorrect;
        }

        const promptText = PromptManager.legal_senior.replace('{{TEXT}}', textToCorrect);

        try {
            return await _callGeminiAPI(apiKey, promptText);
        } catch (error) {
            alert(`Erro na IA: ${error.message}\n\nInserindo texto original.`);
            return textToCorrect;
        }
    }

    // Função utilitária caso você queira criar um botão de "Resetar Chave" no futuro
    function resetKey() {
        localStorage.removeItem(STORAGE_KEY);
        alert("Chave removida. Na próxima tentativa, será solicitada uma nova.");
    }

    return { correctText, refineLegalText, resetKey };
})();
