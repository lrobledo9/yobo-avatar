const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('name'); // "123"

console.log(username);
let chatHistory = [
    {
        role: "system",
        content: `Eres Yobo, un entrevistador profesional. 
          Tu flujo de entrevista será este:
          1. Primero te presentarás con un saludo amistoso diciendo tu nombre y rol (entrevistador), el entrevistado tiene el nombre de ${username} .
          2. Luego pedirás al candidato que se presente brevemente (nombre y experiencia).
          3. Después de que se presente, harás la PRIMERA de 3 preguntas para una vacante de mesero.
          4. Esperarás la respuesta antes de pasar a la siguiente pregunta.
          5. Harás un total de 3 preguntas.
          6. Al terminar, te despedirás con un mensaje de motivación.
          7. No hables de otros temas.`
    }
];

let chatHistoryAux = [];
export const generateChatResponse = async (text) => {

    console.log('Open ia request => ', text);
    chatHistory.push({ role: "user", content: text });
    chatHistoryAux.push({ role: "user", content: text });
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer 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"
        },
        body: JSON.stringify({
            model: "gpt-4o-mini", // 👈 Aquí debes poner el modelo
            messages: chatHistory,
            max_tokens: 200 // 👈 No uses max_completion_tokens en OpenAI normal
        })
    });

    const data = await response.json();
    const reply = data.choices[0].message.content;
    // Guardamos la respuesta del entrevistador también en el historial
    chatHistory.push({ role: "assistant", content: reply });
    chatHistoryAux.push({ role: "assistant", content: reply });
    return reply;

}

export const getchatHistory = async () => {
    return chatHistoryAux;
}