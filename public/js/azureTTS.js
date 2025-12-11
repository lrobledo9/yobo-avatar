let subscriptionKey = "";
let serviceRegion = "";
let speechConfig = null;
let audioConfig = null;
let synthesizer = null;
let recognizer = null;

/**
 * Obtiene las credenciales dinámicas para Azure Speech y configura SDKs de TTS/STT.
 * @returns {Promise<void>} Promesa que se resuelve cuando la configuración está completa.
 */
export const accessKeyAzure = async () => {
    const azure = await getAccessKeyAzure();

    subscriptionKey = azure.subscriptionKey;
    serviceRegion = azure.serviceRegion;

    speechConfig = SpeechSDK.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
    speechConfig.speechSynthesisVoiceName = "es-MX-DaliaNeural";
    speechConfig.setProperty("SpeechServiceResponse_VisemeAnimation", "true");
    speechConfig.setProperty("SpeechSynthesisVoiceStyle", "cheerful"); // o sad, angry, empathetic
    speechConfig.speechRecognitionLanguage = "es-ES";

    audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, null);
    recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
};

export {recognizer, synthesizer}


