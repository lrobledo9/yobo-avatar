const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('name'); // "123"
const vacantName = urlParams.get('vacant')
const interviewId = urlParams.get('interview')


$('#micOn').hide();
$('#micOff').hide();
let videoStream = null;

async function toggleCamera() {
    const btn = document.getElementById("cameraBtn");
    const cameraBox = document.getElementById("cameraBox");
    const cameraVideo = document.getElementById("cameraVideo");

    if (!videoStream) {
        try {
            // Pedir acceso a la cámara
            videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            cameraVideo.srcObject = videoStream;

            // Mostrar cuadro
            cameraBox.style.display = "block";

        } catch (err) {
            console.error("No se pudo acceder a la cámara:", err);
        }
    } else {
        // Apagar cámara
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;

        // Ocultar cuadro
        cameraBox.style.display = "none";
    }
}

let mediaRecorder;
let recordedChunks = [];
let isRecording = false;
let chatHistory = null;
const indicator = document.getElementById("recordingIndicator");
async function toggleRecording() {

    if (!isRecording) {
        // Verificar si hay cámara activa
        if (!videoStream) {
            alert("Primero enciende la cámara 📷");
            return;
        }

        // Crear grabador
        mediaRecorder = new MediaRecorder(videoStream, { mimeType: "video/mp4" });

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                recordedChunks.push(e.data);
            }
        };

        mediaRecorder.onstop = () => {
            indicator.style.display = "none";
            const blob = new Blob(recordedChunks, { type: "video/mp4" });
            let filename = `${username}-${vacantName}-${new Date().getTime()}.mp4`
            const file = new File([blob], filename, { type: "video/mp4" });
            const formData = new FormData();
            formData.append("file", file);

             Swal.fire({
                icon: "info",
                title: "Guardando los datos de la entrevista",
                showConfirmButton: false,
                timerProgressBar: true,
                didOpen: () => {
                    Swal.showLoading();
                }
            })


            fetch("https://yobo-services-cqeyeuc8chfffta0.canadacentral-01.azurewebsites.net/api/v1/azure/blob/storage", {
                method: "POST",
                body: formData,
            }).then(async (response) => {
                const data = await response.json();
                console.log("STORAGE =>", data);
                        
                await sendDataInterview(interviewId,data.data.url, chatHistory)
                Swal.close();
                window.location.href = `/`;
            }, (err) => {
                console.log(err);
            });

            recordedChunks = []; // reset
        };

        mediaRecorder.start();
        isRecording = true;
        indicator.style.display = "block";

    } else {
        // Detener grabación
        mediaRecorder.stop();
        isRecording = false;
    }
}


async function setChatHistory(chat) {
    chatHistory = chat;
}