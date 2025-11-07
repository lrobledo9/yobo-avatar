async function getQuestions(id) {

    const data = await n8nService(id);

    if (data == 'error') {
        return null;
    }

    try {
        let questionTxt = '';
        data.forEach(question => {
            let questionAux = JSON.parse(question.question)
            questionTxt += `- ${questionAux.pregunta}\n`
        });
        return { 'txt': questionTxt, 'length': data.length }

    } catch (error) {
        return null;
    }
}
async function getVacant(id) {
    console.log(id);
    if (id === null) {
        return null;
    }

    const data = await n8nService(id);
    if (data == 'error') {
        return null;
    }
    return {
        vacant: data[0].title,
        interviewid: data[0].interview_id,
        application: data[0].application_id
    };
}

async function sendDataInterview(id, url, chat) {
    let body = {
        "interviewId": id,
        "videoLink": url,
        "transcription": chat
    }
    const tokenn8n =  getAccessTokenN8n();
    const response = await fetch(`${CONFIG.baseUrlN8n}/api/interview`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Basic ${tokenn8n}`
            },
            body: JSON.stringify(body)
        }
    );

    const data = await response;

    if (data.status == 204) {
        return 'OK';
    }
    return 'error';
}


async function n8nService(id) {
    try {
        const tokenn8n =  getAccessTokenN8n();
        const response = await fetch(`${CONFIG.baseUrlN8n}/api/interview?application_id=${id}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Basic ${tokenn8n}`
                }
            }
        );

        if (!response.ok) {
            return "error";
        }
        return await response.json();

    } catch (error) {
        return "error";
    }

}
