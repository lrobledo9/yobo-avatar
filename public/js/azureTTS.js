const subscriptionKey = "";
const serviceRegion = "canadacentral"; 
//TTS
 const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
 speechConfig.speechSynthesisVoiceName = "es-ES-AlvaroNeural";
 speechConfig.setProperty("SpeechServiceResponse_VisemeAnimation", "true");
export const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, null);

//STT
speechConfig.speechRecognitionLanguage = "es-ES";
const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
export const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
