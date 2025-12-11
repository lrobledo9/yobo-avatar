let mediaStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let stopPromise = null;

/**
 * Solicita acceso al micrófono (si no existe) y comienza a grabar audio.
 * @returns {Promise<void>}
 */
export async function startAudioRecording() {
  if (!mediaStream) {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  }

  recordedChunks = [];
  mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'audio/webm' });

  stopPromise = new Promise(resolve => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
      resolve(blob);
    };
  });

  mediaRecorder.ondataavailable = event => {
    if (event.data && event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.start();
}

/**
 * Detiene la grabación y devuelve un Blob con el audio capturado.
 * @param {{ releaseStream?: boolean }} options
 * @returns {Promise<Blob|null>}
 */
export async function stopAudioRecording(options = {}) {
  if (!mediaRecorder || mediaRecorder.state === 'inactive') {
    return null;
  }

  const { releaseStream = false } = options;
  const promise = stopPromise;

  try {
    mediaRecorder.stop();
    const audioBlob = await promise;
    mediaRecorder = null;
    recordedChunks = [];

    if (releaseStream && mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      mediaStream = null;
    }

    return audioBlob;
  } catch (error) {
    console.error('Error al detener la grabación de audio', error);
    return null;
  }
}

/**
 * Libera el stream almacenado (por ejemplo al salir de la entrevista).
 */
export function releaseAudioStream() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  mediaRecorder = null;
  recordedChunks = [];
  stopPromise = null;
}
