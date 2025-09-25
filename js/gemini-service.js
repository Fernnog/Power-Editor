const GeminiService = (() => {
    // CORREÇÃO FINAL: O nome do modelo foi ajustado para "gemini-pro", que é a versão
    // estável e universalmente compatível com as chaves de API do Google AI Studio.
    // Isso corrige o erro 404 (Not Found).
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=';

    /**
     * Envia um texto para a API do Gemini e retorna a correção.
     * @param {string} textToCorrect O texto selecionado pelo usuário.
     * @param {string} apiKey A chave de API do Google AI Studio.
     * @returns {Promise<string>} O texto corrigido.
     */
    async function correctText(textToCorrect, apiKey) {
        // Instrução clara para a IA
        const prompt = `Atue como um revisor e editor de texto profissional, especialista na norma culta do Português do Brasil, e corrija o seguinte texto. Sua tarefa é eliminar todos os erros de gramática, ortografia, pontuação, acentuação e concordância, melhorando a clareza e a fluidez quando necessário, mas sem alterar o significado, o tom ou a intenção originais do autor. É fundamental que a formatação básica seja mantida e que nenhuma informação, opinião ou comentário novo seja adicionado. Retorne APENAS e EXCLUSIVAMENTE o texto corrigido, sem qualquer tipo de introdução, saudação ou explicação.\n\nTEXTO:\n"${textToCorrect}"`;

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