const application = localStorage.getItem('application');
const username =  localStorage.getItem('username');
const vacant =  localStorage.getItem('vacant');

let chatHistory = [];

let questionsData = null;
const getQuestionsprompt = async () => {
    const data = await getQuestions(application);
    questionsData = data;
}
getQuestionsprompt()
let controlador;

export const generateChatResponse = async (text) => {
    controlador?.abort();

    controlador = new AbortController();
    const signal = controlador.signal;

    chatHistory.push({ role: "user", content: text });
    const response = await fetch("https://yobo-services-cqeyeuc8chfffta0.canadacentral-01.azurewebsites.net/api/v1/openia/chat/response", {
        signal,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "name": username,
            "vacant":vacant,
            "questions":questionsData,
            "chat": chatHistory
        })
    });

    const data = await response.json();
    const reply = data.data.reply;
    // Guardamos la respuesta del entrevistador también en el historial
    
    chatHistory.push({ role: "assistant", content: reply });
    return reply;

}

export const getchatHistory = async () => {
    return chatHistory;
}