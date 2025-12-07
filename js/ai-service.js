// modules/ai-service.js

const GEMINI_MODEL = 'gemini-1.5-flash'; // Modelo rápido e eficiente
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const STORAGE_KEY = 'neuro_gemini_api_key';

// Prompt otimizado para anotações de estudo/teologia
const CORRECTION_PROMPT = `
Atue como um editor de textos acadêmicos e teológicos. 
Sua tarefa é corrigir a gramática, pontuação e clareza do texto ditado abaixo.
Regras:
1. Mantenha o tom pessoal, mas culto.
2. Corrija erros de concordância e capitalize frases.
3. NÃO adicione introduções (ex: "Aqui está o texto"). Retorne APENAS o conteúdo tratado.
4. Se o texto parecer confuso, tente inferir o sentido lógico no contexto de um estudo de livro.

Texto cru: "{{TEXT}}"
`;

function getApiKey() {
    let key = localStorage.getItem(STORAGE_KEY);
    if (!key) {
        key = prompt("🧠 Neuro-Voice: Para ativar a IA, insira sua Google Gemini API Key:");
        if (key && key.trim().length > 10) {
            localStorage.setItem(STORAGE_KEY, key.trim());
        }
    }
    return key;
}

export async function processTextWithAI(rawText) {
    if (!rawText || !rawText.trim()) return rawText;

    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key não fornecida.");

    const fullPrompt = CORRECTION_PROMPT.replace('{{TEXT}}', rawText);

    try {
        const response = await fetch(`${BASE_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: fullPrompt }] }]
            })
        });

        if (!response.ok) {
            if (response.status === 400 || response.status === 403) {
                localStorage.removeItem(STORAGE_KEY); // Remove chave inválida
            }
            throw new Error(`Erro IA (${response.status})`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text.trim();

    } catch (error) {
        console.error("Falha na IA:", error);
        throw error; // Repassa erro para a UI tratar
    }
}
