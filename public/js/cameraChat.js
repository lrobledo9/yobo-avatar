const urlParams = new URLSearchParams(window.location.search);
const username =  localStorage.getItem('username');
const vacantName = localStorage.getItem('vacant');
const interviewId = localStorage.getItem('interviewid');

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

        mediaRecorder.onstop = async () => {
            indicator.style.display = "none";
            const blob = new Blob(recordedChunks, { type: "video/mp4" });
            let filename = `${username}-${vacantName}-${new Date().getTime()}.mp4`
            const file = new File([blob], filename, { type: "video/mp4" });
            const formData = new FormData();
            formData.append("file", file);

            Swal.fire({
                icon: "info",
                title: "📤 Subiendo tu video, por favor espera...",
                showConfirmButton: false,
                timerProgressBar: true,
                text:'⏳ Procesando tu entrevista, esto puede tardar unos segundos.',
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const accessToken = await getAccessToken();
            fetch(`${CONFIG.baseUrl}/v1/azure/blob/storage`, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                body: formData,
            }).then(async (response) => {
                const data = await response.json();
                console.log("STORAGE =>", data);
                        
                await sendDataInterview(interviewId,data.data.url, chatHistory)
                localStorage.clear();
                Swal.close();

                Swal.fire({
                    title: 'Guardado con éxito',
                    text: `Los datos de la entrevista  se han guardado correctamente.`,
                    icon: 'info',
                    confirmButtonText: 'ok',
                    confirmButtonColor: '#63B31B',
                    allowOutsideClick: false,
                    allowEscapeKey: false,   
                }).then((result) => {
                    if (result.isConfirmed) {
                        localStorage.clear();
                        window.location.href = `https://yobo.app/`;
                    }
                });
            }, (err) => {
                console.log(err);
                Swal.close();
                Swal.fire({
                    icon: 'error',
                    title: '❌ Error al subir el video',
                    text: 'Intenta nuevamente más tarde.',
                    confirmButtonColor: '#63B31B',
                });
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