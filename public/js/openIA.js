const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('name'); // "123"
const vacant = urlParams.get('vacant');
const application = urlParams.get('application');

let chatHistory = [];

let questionsData = null;
const getQuestionsprompt = async () => {
    const data = await getQuestions(application);
    questionsData = data;
}
getQuestionsprompt()

export const generateChatResponse = async (text) => {

    console.log('Open ia request => ', text);
    chatHistory.push({ role: "user", content: text });
    const response = await fetch("https://yobo-services-cqeyeuc8chfffta0.canadacentral-01.azurewebsites.net/api/v1/openia/chat/response", {
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