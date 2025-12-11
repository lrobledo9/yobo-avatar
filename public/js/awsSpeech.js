let region;
let pollyCfg;
let pollyClient;

export async function initAwsSpeech() {
  const response = await getAccessAws();
  region = response.region;
  pollyCfg = response.polly;
}

export async function speakWithPolly(ssml) {
  if (!pollyClient) {
    pollyClient = new AWS.Polly({
      region,
      credentials: {
        accessKeyId: pollyCfg.credentials.AccessKeyId,
        secretAccessKey: pollyCfg.credentials.SecretAccessKey,
        sessionToken: pollyCfg.credentials.SessionToken
      }
    });
  }

  const audioParams = {
    OutputFormat: 'mp3',
    Text: ssml,
    TextType: 'ssml',
    VoiceId: pollyCfg.voiceId
  };

  const marksParams = {
    ...audioParams,
    OutputFormat: 'json',
    SpeechMarkTypes: ['viseme']
  };

  const [audioResp, marksResp] = await Promise.all([
    pollyClient.synthesizeSpeech(audioParams).promise(),
    pollyClient.synthesizeSpeech(marksParams).promise()
  ]);

  const audioBuffer = await streamToArrayBuffer(audioResp.AudioStream);
  const visemes = parseSpeechMarks(marksResp.AudioStream);
  return { audioBuffer, visemes };
}

async function streamToArrayBuffer(stream) {
  if (stream instanceof ArrayBuffer) return stream;
  if (stream instanceof Uint8Array) {
    return stream.buffer.slice(stream.byteOffset, stream.byteOffset + stream.byteLength);
  }
  if (stream instanceof Blob) return await stream.arrayBuffer();
  if (stream && typeof stream.arrayBuffer === 'function') return await stream.arrayBuffer();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return new Blob(chunks).arrayBuffer();
}

function parseSpeechMarks(stream) {
  let text;
  const decoder = new TextDecoder();

  if (stream instanceof ArrayBuffer) text = decoder.decode(stream);
  else if (stream instanceof Uint8Array) text = decoder.decode(stream);
  else if (stream instanceof Blob) text = decoder.decode(stream);
  else if (typeof stream === 'string') text = stream;
  else if (stream && typeof stream.toString === 'function') text = stream.toString();
  else text = '';

  return text.trim().split('\n').filter(Boolean).map(line => {
    const mark = JSON.parse(line);
    return { id: mark.value, offsetMs: mark.time };
  });
}
