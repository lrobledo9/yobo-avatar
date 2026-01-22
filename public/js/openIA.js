const application = localStorage.getItem('application');
const username = localStorage.getItem('username');
const vacant = localStorage.getItem('vacant');

let chatHistory = [];

let questionsData = null;
let controlador;


export const getQuestionsPrompt = async () => {
    const data = await getQuestions(application);
    questionsData = data;
}

export const generateChatResponse = async (text) => {
    controlador?.abort();
    const accessToken = await getAccessToken();
    const msg = ['Parece que me distraje un momento. ¡Intentemos de nuevo!'
        , '¡Parece que perdí conexión!. Intentemos otra vez en unos segundos.'
        , 'Ups, algo salió mal al procesar eso. ¡Intentémoslo otra vez!'
        , 'Parece que hubo un problema con la conexión. Inténtalo de nuevo'
        , 'Hmm… no obtuve respuesta esta vez. Podemos volver a intentarlo enseguida.'
        , 'La solicitud tardó más de lo esperado. Por favor, vuelve a intentarlo.'
    ]


    controlador = new AbortController();
    const signal = controlador.signal;

    try {
        chatHistory.push({ role: "user", content: text });

        if (text == ' ') {

            chatHistory.push({ role: "assistant", content: 'Hmm… no obtuve respuesta esta vez. Podemos volver a intentarlo enseguida.' });
            return 'Hmm… no obtuve respuesta esta vez. Podemos volver a intentarlo enseguida.';
        }


        const response = await fetch(`${CONFIG.baseUrl}/v1/openia/chat/response`, {
            signal,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                "name": username,
                "vacant": vacant,
                "questions": questionsData,
                "chat": chatHistory
            })
        });


        if (!response.ok) {
            chatHistory.pop();
            const i = Math.floor(Math.random() * msg.length);
            return msg[i];
        }

        const data = await response.json();
        const reply = data.data.reply;
        // Guardamos la respuesta del entrevistador también en el historial

        chatHistory.push({ role: "assistant", content: reply });
        return reply;

    } catch (error) {
        chatHistory.pop();
        const r = Math.floor(Math.random() * msg.length);
        return msg[r];
    }
}

export const getchatHistory = async () => {
    return chatHistory;
}

export const transcribeAudio = async (blob) => {
    const accessToken = await getAccessToken();
    const formData = new FormData();
    formData.append('file', blob, 'audio.webm');
    const response = await fetch(`${CONFIG.baseUrlN8n}/api/v1/openia/chat/transcriptions`, {
        method: "POST",
        body: formData
    });

    if (!response.ok) {
        return ' ';
    }

    const data = await response.json();

    console.log('transcripcion', data);
    if (data.error) {
        return ' ';
    }
    if (data.text === '') {
         return ' ';
    }
    
    return data.text;


}