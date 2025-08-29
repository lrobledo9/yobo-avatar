let videoStream = null;
cameraInt();
async function cameraInt() {
    const cameraVideo = document.getElementById("cameraVideo");
    if (!videoStream) {

        try {
            videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            cameraVideo.srcObject = videoStream;

        } catch (err) {
            console.log("No se pudo acceder a la cámara:", err);
            $('#btn-init-chat').prop('disabled', true)
            const toastLiveExample = document.getElementById('liveToast')
            const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample)
            toastBootstrap.show()
        }

    }else{
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
    
}