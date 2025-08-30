// js/gemini-service.js (COMPLETO E CORRIGIDO)

const AICorrector = (() => {
    // --- ALTERAÇÃO REALIZADA AQUI ---
    // O nome do modelo foi atualizado de "gemini-pro" para "gemini-1.5-pro-latest",
    // que é a versão mais recente e recomendada para esta tarefa.
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=';

    /**
     * Envia um texto para a API do Gemini e retorna a correção.
     * @param {string} textToCorrect O texto selecionado pelo usuário.
     * @param {string} apiKey A chave de API do Google AI Studio.
     * @returns {Promise<string>} O texto corrigido.
     */
    async function correctText(textToCorrect, apiKey) {
        // Instrução clara para a IA
        const prompt = `Corrija o seguinte texto, focando em erros de gramática, ortografia e pontuação. Mantenha o sentido original e a formatação básica. Retorne APENAS o texto corrigido, sem nenhuma introdução ou comentário seu.\n\nTEXTO:\n"${textToCorrect}"`;

        try {
            const response = await fetch(API_URL + apiKey, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                // Tenta extrair uma mensagem de erro mais detalhada do corpo da resposta
                const errorData = await response.json();
                const errorMessage = errorData?.error?.message || response.statusText;
                throw new Error(`Erro na API: ${errorMessage}`);
            }

            const data = await response.json();
            // Adiciona uma verificação para garantir que a resposta tem o formato esperado
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
                const correctedText = data.candidates[0].content.parts[0].text;
                return correctedText.trim();
            } else {
                throw new Error("A resposta da API não contém o texto corrigido no formato esperado.");
            }

        } catch (error) {
            console.error("Falha ao corrigir o texto:", error);
            alert(`Não foi possível conectar ao serviço de correção.\n\nDetalhes: ${error.message}`);
            return textToCorrect; // Retorna o texto original em caso de erro
        }
    }

    return {
        correctText
    };
})();
