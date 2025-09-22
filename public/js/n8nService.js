async function getQuestions(id) {

    const data = await n8nService(id);

    if (data == 'error') {
        return null;
    }

    let questionTxt = '';
    data.forEach(question => {
        questionAux = JSON.parse(question.question)
        questionTxt += `- ${questionAux.pregunta}\n`
    });
    console.log(questionTxt);

    return { 'txt': questionTxt, 'length': data.length }
}
async function getVacant(id) {
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

    const response = await fetch(`https://appyobo.app.n8n.cloud/webhook/api/interview`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Basic WW9ib1NlcnZlcjphKDJGb3dYMDYtdzA="
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

    const response = await fetch(`https://appyobo.app.n8n.cloud/webhook/api/interview?application_id=${id}`,
        {
            method: "GET",
            headers: {
                "Authorization": "Basic WW9ib1NlcnZlcjphKDJGb3dYMDYtdzA="
            }
        }
    );

    try {
        return await response.json();
    } catch (error) {
        return "error";
    }

}
