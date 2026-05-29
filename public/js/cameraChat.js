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
let recordingAudioContext = null;
let recordingAudioDestination = null;
let recordingMicSource = null;
let recordingCanvas = null;
let recordingCanvasAnimation = null;
let recordingLogoImage = null;

const RECORDING_WIDTH = 1280;
const RECORDING_HEIGHT = 720;

function getSupportedRecordingMimeType() {
    const types = [
        "video/mp4",
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm"
    ];
    return types.find(type => MediaRecorder.isTypeSupported(type)) || "";
}

async function createRecordingStream() {
    recordingAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    recordingAudioDestination = recordingAudioContext.createMediaStreamDestination();

    const micTracks = videoStream.getAudioTracks();
    if (micTracks.length > 0) {
        const micStream = new MediaStream(micTracks);
        recordingMicSource = recordingAudioContext.createMediaStreamSource(micStream);
        recordingMicSource.connect(recordingAudioDestination);
    }

    const canvasStream = await createRecordingCanvasStream();

    return new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...recordingAudioDestination.stream.getAudioTracks()
    ]);
}

async function closeRecordingAudioGraph() {
    if (recordingCanvasAnimation) {
        cancelAnimationFrame(recordingCanvasAnimation);
        recordingCanvasAnimation = null;
    }
    recordingCanvas = null;
    recordingMicSource = null;
    recordingAudioDestination = null;
    if (recordingAudioContext) {
        await recordingAudioContext.close();
        recordingAudioContext = null;
    }
}

async function createRecordingCanvasStream() {
    recordingCanvas = document.createElement("canvas");
    recordingCanvas.width = RECORDING_WIDTH;
    recordingCanvas.height = RECORDING_HEIGHT;

    if (!recordingLogoImage) {
        recordingLogoImage = new Image();
        recordingLogoImage.src = "/yobo-avatar-meet/assets/images/profile.svg";
    }

    const stream = recordingCanvas.captureStream(30);
    drawRecordingFrame();
    return stream;
}

function drawRecordingFrame() {
    if (!recordingCanvas) return;

    const ctx = recordingCanvas.getContext("2d");
    const cameraVideo = document.getElementById("cameraVideo");
    const counter = document.getElementById("counter")?.textContent || "00:00:00";

    ctx.clearRect(0, 0, RECORDING_WIDTH, RECORDING_HEIGHT);
    ctx.fillStyle = "#63B31B";
    ctx.fillRect(0, 0, RECORDING_WIDTH, RECORDING_HEIGHT);

    drawCameraPreview(ctx, cameraVideo);
    drawYoboBrand(ctx);
    drawBottomBar(ctx, counter);

    recordingCanvasAnimation = requestAnimationFrame(drawRecordingFrame);
}

function drawCameraPreview(ctx, cameraVideo) {
    const x = 10;
    const y = 12;
    const width = 230;
    const height = 170;
    const radius = 8;

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    roundedRect(ctx, x, y, width, height, radius);
    ctx.fillStyle = "#2f2f2f";
    ctx.fill();
    ctx.clip();

    if (cameraVideo?.readyState >= 2) {
        drawVideoCover(ctx, cameraVideo, x, y, width, height);
    }

    ctx.restore();
}

function drawYoboBrand(ctx) {
    const centerX = RECORDING_WIDTH / 2;
    const centerY = RECORDING_HEIGHT / 2 - 40;
    const logoSize = 92;

    if (recordingLogoImage?.complete && recordingLogoImage.naturalWidth > 0) {
        ctx.drawImage(recordingLogoImage, centerX - logoSize / 2, centerY - logoSize / 2, logoSize, logoSize);
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 28px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("YOBO", centerX, centerY + 65);
}

function drawBottomBar(ctx, counter) {
    const barHeight = 86;
    const y = RECORDING_HEIGHT - barHeight;

    ctx.fillStyle = "rgba(0, 0, 0, 0.82)";
    ctx.fillRect(0, y, RECORDING_WIDTH, barHeight);

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 22px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(counter, 142, y + barHeight / 2);

    drawPlayButton(ctx, RECORDING_WIDTH / 2, y + barHeight / 2);
    drawChatIcon(ctx, RECORDING_WIDTH - 235, y + barHeight / 2);
    drawExitButton(ctx, RECORDING_WIDTH - 170, y + barHeight / 2);
}

function drawPlayButton(ctx, x, y) {
    const radius = 38;

    ctx.save();
    ctx.shadowColor = "rgba(0, 90, 145, 0.45)";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#0f6ea8";
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(x - 9, y - 13);
    ctx.lineTo(x - 9, y + 13);
    ctx.lineTo(x + 13, y);
    ctx.closePath();
    ctx.fillStyle = "#d4e6b9";
    ctx.fill();
}

function drawChatIcon(ctx, x, y) {
    ctx.fillStyle = "#ffffff";
    roundedRect(ctx, x - 13, y - 14, 26, 23, 3);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x - 4, y + 9);
    ctx.lineTo(x - 13, y + 18);
    ctx.lineTo(x - 9, y + 8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#0c2204";
    ctx.fillRect(x - 8, y - 8, 15, 3);
    ctx.fillRect(x - 8, y - 2, 18, 3);
    ctx.fillRect(x - 8, y + 4, 10, 3);
}

function drawExitButton(ctx, x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.fillStyle = "#dc3545";
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(x, y + 9, 14, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x - 15, y + 4);
    ctx.lineTo(x - 8, y + 9);
    ctx.moveTo(x + 15, y + 4);
    ctx.lineTo(x + 8, y + 9);
    ctx.stroke();
}

function drawVideoCover(ctx, video, x, y, width, height) {
    const videoRatio = video.videoWidth / video.videoHeight;
    const targetRatio = width / height;
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = video.videoWidth;
    let sourceHeight = video.videoHeight;

    if (videoRatio > targetRatio) {
        sourceWidth = video.videoHeight * targetRatio;
        sourceX = (video.videoWidth - sourceWidth) / 2;
    } else {
        sourceHeight = video.videoWidth / targetRatio;
        sourceY = (video.videoHeight - sourceHeight) / 2;
    }

    ctx.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

window.getRecordingAudioContext = async function () {
    if (!recordingAudioContext) return null;
    if (recordingAudioContext.state === "suspended") {
        await recordingAudioContext.resume();
    }
    return recordingAudioContext;
};

window.connectBotAudioSourceToRecording = function (source) {
    if (!recordingAudioContext || !recordingAudioDestination || source.context !== recordingAudioContext) {
        return false;
    }
    source.connect(recordingAudioContext.destination);
    source.connect(recordingAudioDestination);
    return true;
};

async function toggleRecording() {


    if (!isRecording) {
        // Verificar si hay cámara activa
        if (!videoStream) {
            alert("Primero enciende la cámara 📷");
            return;
        }

        const recordingStream = await createRecordingStream();
        const mimeType = getSupportedRecordingMimeType();
        const recorderOptions = mimeType ? { mimeType } : undefined;

        // Crear grabador
        mediaRecorder = new MediaRecorder(recordingStream, recorderOptions);

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                recordedChunks.push(e.data);
            }
        };

        mediaRecorder.onstop = async () => {
            indicator.style.display = "none";
            const type = mediaRecorder.mimeType || mimeType || "video/webm";
            const extension = type.includes("mp4") ? "mp4" : "webm";
            const blob = new Blob(recordedChunks, { type });
            let filename = `${username}-${vacantName}-${new Date().getTime()}.${extension}`
            const file = new File([blob], filename, { type });
            const formData = new FormData();
            formData.append("filename", filename);
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
            fetch(`${CONFIG.baseUrlN8n}/api/v1/blob/storage`, {
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
            await closeRecordingAudioGraph();
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
