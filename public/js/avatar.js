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
camera.position.set(0, 1.5, 3);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 3);
light.position.set(0, 3, 3);
scene.add(light);

let avatarMesh;
const loader = new GLTFLoader();
let headBone = null;
let baseHeadQuat = null;
let spineBone = null;
//male
//https://models.readyplayer.me/68a89d1c19e322fda4dd47c5.glb
//https://models.readyplayer.me/68b73bdb0727401620ad282a.glb
//https://models.readyplayer.me/68daf025b56587edda9cb3ce.glb
//Female
// https://models.readyplayer.me/6938861a347390125d7f7007.glb
loader.load("https://models.readyplayer.me/68daf025b56587edda9cb3ce.glb", gltf => {
    avatarMesh = gltf.scene;
    avatarMesh.scale.set(3, 3, 3);
    avatarMesh.position.y = -3.8;
    scene.add(avatarMesh);

    avatarMesh.traverse(obj => {
        if (obj.isBone && obj.name.toLowerCase().includes("head")) {
            if (obj.name === "Head") {
                headBone = obj; // ✅ usar solo "Head"
                baseHeadQuat = headBone.quaternion.clone();
            }

        }
    });
});



// -------------------- Parpadeo , Cabeza , Respiro --------------------
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

function moveHead() {
    if (!headBone || !baseHeadQuat) return;

    const time = Date.now() * 0.001;

    // movimiento leve
    const offsetQuat = new THREE.Quaternion()
        .setFromEuler(new THREE.Euler(
            Math.cos(time * 0.5) * 0.05, // arriba/abajo (muy leve)
            Math.sin(time * 0.5) * 0.1,  // izquierda/derecha
            0
        ));

    // aplicar interpolación suave sobre la rotación base
    const finalQuat = baseHeadQuat.clone().multiply(offsetQuat);
    headBone.quaternion.slerp(finalQuat, 0.05);
}

let breatheTimer = 0;


function breathe() {
  if (!avatarMesh) return;
  breatheTimer += 0.003; // velocidad de respiración

  avatarMesh.traverse(obj => {
    if (obj.isBone) {
      // movimientos muy sutiles para respiración
      if (obj.name === "Spine") obj.rotation.x = Math.sin(breatheTimer) * 0.01;
      if (obj.name === "Spine1") obj.rotation.x = Math.sin(breatheTimer + 0.5) * 0.008;
      if (obj.name === "Spine2") obj.rotation.x = Math.sin(breatheTimer + 1) * 0.006;
    }
  });
}





// -------------------- Mouth Smooth --------------------
let currentMorph = null;
let isTalking = false;

const PHONEME_TO_VISEME = {
    'a': "viseme_aa",
    '@': 'viseme_aa',
    'i': "viseme_I",
    'p': "viseme_PP",
    'b': 'viseme_PP',
    'B': 'viseme_PP',
    'f': "viseme_FF",
    'T': "viseme_TH",
    't': "viseme_DD",
    'd': "viseme_DD",
    'k': "viseme_kk",
    'C': "viseme_CH",
    'c': "viseme_CH",
    'z': "viseme_SS",
    'n': "viseme_nn",
    'N': "viseme_nn",
    'r': "viseme_RR",
    'A': "viseme_aa",
    'e': "viseme_E",
    'E': "viseme_E",
    'j': "viseme_I",
    'J': "viseme_I",
    'o': "viseme_O",
    'O': "viseme_O",
    'u': "viseme_U",
    'S': "viseme_CH",
    'K': "viseme_kk",
    'R': "viseme_RR",
    's': "viseme_SS",
    'U': "viseme_U",
    'sil': "viseme_sil"
};

export function phonemeToViseme(phoneme) {
    if (!phoneme) return "viseme_sil";
    const trimmed = phoneme.trim();
    return PHONEME_TO_VISEME[trimmed] || PHONEME_TO_VISEME[trimmed.toLowerCase()] || "viseme_sil";
}

export function currentMorphSil() {
    currentMorph = "viseme_sil";
}

export function applyViseme(id) {
    if (!avatarMesh) return;
    currentMorph = id;
    //currentMorph = phonemeToViseme(id);
    isTalking = currentMorph !== "viseme_sil";
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
export async function animate() {
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
    breathe()
    moveHead();
    // Labios suavizados
    updateMouthSmooth();


    renderer.render(scene, camera);
}
