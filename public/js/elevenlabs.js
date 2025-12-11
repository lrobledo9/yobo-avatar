export const ttsElevnlabs = async (text) => {
    if (!text || !text.trim()) {
        return { audioBuffer: null, alignments: [] };
    }

    const payload = {
        text
    };
    const accessToken = await getAccessToken();

    const response = await fetch(`${CONFIG.baseUrl}/v1/tts/stream`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok || !response.body) {

        Swal.fire({
                title: 'Ups',
                text: 'Algo salió mal al procesar eso. ¡Intentémoslo otra vez!',
                icon: 'error',
                confirmButtonText: 'OK'
            }).then((result) => {
                if (playInterview != 0) {
                    $('#micOn').show();
                    $('#micOff').hide();
                }
                $('#recordBtn').prop('disabled', false);
                $('#playBtn').prop('disabled', false);
            });
        throw new Error('ElevenLabs request failed');
    }

    const data = await response.json();

    const { audioChunks = [], alignments = [] } = data;

    const audioBuffer = base64ChunksToArrayBuffer(audioChunks);

    return { audioBuffer, alignments };
};

function base64ChunksToArrayBuffer(chunks) {
    if (!chunks?.length) return new ArrayBuffer(0);

    const buffers = [];
    let totalLength = 0;

    chunks.forEach((chunk, idx) => {
        if (!chunk) return;
        const clean = chunk.replace(/[^A-Za-z0-9+/=]/g, '');
        try {
            const binary = atob(clean);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            buffers.push(bytes);
            totalLength += bytes.length;
        } catch (error) {
            console.warn(`Failed to decode ElevenLabs chunk ${idx}`, error);
        }
    });

    const merged = new Uint8Array(totalLength);
    let offset = 0;
    buffers.forEach(bytes => {
        merged.set(bytes, offset);
        offset += bytes.length;
    });

    return merged.buffer;
}
