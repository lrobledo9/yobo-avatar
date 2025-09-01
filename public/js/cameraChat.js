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

async function toggleRecording() {
    const btn = document.getElementById("startBtn");
    const link = document.getElementById("downloadLink");

    if (!isRecording) {
        // Verificar si hay cámara activa
        if (!videoStream) {
            alert("Primero enciende la cámara 📷");
            return;
        }

        // Crear grabador
        mediaRecorder = new MediaRecorder(videoStream, { mimeType: "video/webm" });

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                recordedChunks.push(e.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: "video/webm" });
            const url = URL.createObjectURL(blob);

            // Crear link de descarga
            link.href = url;
            link.style.display = "inline-block";
            link.textContent = "⬇️ Descargar Entrevista";

            recordedChunks = []; // reset
        };

        mediaRecorder.start();
        isRecording = true;
        btn.textContent = "⏹️ Detener Grabación";

    } else {
        // Detener grabación
        mediaRecorder.stop();
        isRecording = false;
        btn.textContent = "🔴 Iniciar Grabación";
    }
}