import * as THREE from "three";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/loaders/GLTFLoader.js";
// -------------------- THREE.js Setup --------------------

window.addEventListener('resize', () => {
    if (window.renderer && window.camera) {
        window.camera.aspect = window.innerWidth / window.innerHeight;
        window.camera.updateProjectionMatrix();
        window.renderer.setSize(window.innerWidth, window.innerHeight);
    }
});

const scene = new THREE.Scene();

const TextureLoader = new THREE.TextureLoader();
TextureLoader.load('/assets/texture/fondo1.jpg', function (texture) {
    scene.background = texture;
});

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.6, 3);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 3);
light.position.set(0, 3, 3);
scene.add(light);

let avatarMesh;
const loader = new GLTFLoader();
//https://models.readyplayer.me/68a89d1c19e322fda4dd47c5.glb
loader.load("https://models.readyplayer.me/68afa583e195aa99fc4b418a.glb", gltf => {
    avatarMesh = gltf.scene;
    avatarMesh.scale.set(3, 3, 3);
    avatarMesh.position.y = -3.8;
    scene.add(avatarMesh);
});



// -------------------- Parpadeo y Cabeza --------------------
let blinkTimer = 0, isBlinking = false, blinkProgress = 0;

function setEyeBlink(value) {
    if (!avatarMesh) return;
    avatarMesh.traverse(obj => {
        if (obj.isMesh && obj.morphTargetDictionary) {
            const left = obj.morphTargetDictionary["eyeBlinkLeft"];
            const right = obj.morphTargetDictionary["eyeBlinkRight"];
            if (left !== undefined) obj.morphTargetInfluences[left] = value;
            if (right !== undefined) obj.morphTargetInfluences[right] = value;
        }
    });
}
// -------------------- Mouth Smooth --------------------
let currentMorph = null;

export function currentMorphSil(){
    currentMorph = "viseme_sil";
}

export function applyViseme(id) {
    if (!avatarMesh) return;
    const mapping = {
        0: "viseme_aa", 1: "viseme_I", 2: "viseme_PP", 3: "viseme_FF",
        4: "viseme_TH", 5: "viseme_DD", 6: "viseme_kk", 7: "viseme_CH",
        8: "viseme_SS", 9: "viseme_nn", 10: "viseme_RR", 11: "viseme_aa",
        12: "viseme_E", 13: "viseme_I", 14: "viseme_O", 15: "viseme_U",
        16: "viseme_CH", 17: "viseme_kk", 18: "viseme_RR", 19: "viseme_SS",
        20: "viseme_U", 21: "viseme_sil"
    };
    currentMorph = mapping[id] || "viseme_sil";
}

function updateMouthSmooth() {
    if (!avatarMesh || !currentMorph) return;
    avatarMesh.traverse(obj => {
        if (obj.isMesh && obj.morphTargetDictionary) {
            for (const name in obj.morphTargetDictionary) {
                const idx = obj.morphTargetDictionary[name];
                if (name === currentMorph) {
                    obj.morphTargetInfluences[idx] += (1 - obj.morphTargetInfluences[idx]) * 0.3;
                } else {
                    obj.morphTargetInfluences[idx] += (0 - obj.morphTargetInfluences[idx]) * 0.3;
                }
            }
        }
    });
}

export function resetMouthSmoothFast() {
    if (!avatarMesh) return;
    avatarMesh.traverse(obj => {
        if (obj.isMesh && obj.morphTargetInfluences) {
            for (let i = 0; i < obj.morphTargetInfluences.length; i++) {
                obj.morphTargetInfluences[i] += (0 - obj.morphTargetInfluences[i]) * 0.5;
            }
        }
    });
}

// -------------------- Expresiones faciales --------------------
export function setExpression(emotion) {
    if (!avatarMesh) return;

    const morphs = {
        neutral: {},
        happy: { mouthSmile: 1, mouthSmileLeft: 1, mouthSmileRight: 1 },
        sad: { mouthFrownLeft: 1, mouthFrownRight: 1 },
        surprised: { browInnerUp: 1, eyeWideLeft: 1, eyeWideRight: 1, mouthFunnel: 1 },
        angry: { browDownLeft: 1, browDownRight: 1, mouthPressLeft: 1, mouthPressRight: 1 }
    };

    const target = morphs[emotion] || morphs.neutral;

    avatarMesh.traverse(obj => {
        if (obj.isMesh && obj.morphTargetDictionary) {
            for (const name in obj.morphTargetDictionary) {
                const idx = obj.morphTargetDictionary[name];
                const value = target[name] || 0;
                obj.morphTargetInfluences[idx] += (value - obj.morphTargetInfluences[idx]) * 0.2;
            }
        }
    });
}

export function detectEmotion(texto) {
    texto = texto.toLowerCase();
    if (texto.includes("feliz") || texto.includes("bienvenido")) return "happy";
    if (texto.includes("triste") || texto.includes("lamentablemente")) return "sad";
    if (texto.includes("sorpresa") || texto.includes("wow")) return "surprised";
    if (texto.includes("enojado") || texto.includes("molesto")) return "angry";
    return "neutral";
}

// -------------------- Animación --------------------
export function animate() {
    requestAnimationFrame(animate);

    // Parpadeo
    blinkTimer += 0.016;
    if (!isBlinking && blinkTimer > 3 + Math.random() * 3) { isBlinking = true; blinkTimer = 0; blinkProgress = 0; }
    if (isBlinking) {
        blinkProgress += 0.2;
        if (blinkProgress < 1) setEyeBlink(blinkProgress);
        else if (blinkProgress < 2) setEyeBlink(2 - blinkProgress);
        else { isBlinking = false; setEyeBlink(0); }
    }

    // Cabeza
    if (avatarMesh) {
        const t = Date.now() * 0.001;
        avatarMesh.rotation.y = Math.sin(t * 0.5) * 0.05;
        avatarMesh.rotation.x = Math.sin(t * 0.8) * 0.02;
    }

    // Labios suavizados
    updateMouthSmooth();

    renderer.render(scene, camera);
}