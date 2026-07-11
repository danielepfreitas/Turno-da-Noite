/* ============================================================
   TURNO DA NOITE — main.js
   Jogo de terror psicológico em 1ª pessoa dentro de uma doceria
   no turno da noite. Tudo em um arquivo só: som de chuva
   sintetizado (Web Audio API) + cena 3D (Three.js) + movimento
   + evento no balcão.
   ============================================================ */

/* ---------------------------------------------------------------
   1. CHUVA — som sintetizado, não depende de nenhum arquivo .mp3
   --------------------------------------------------------------- */
const Chuva = (() => {
  let ctx = null;
  let gainMestre = null;
  let fonteRuido = null;
  let lfo = null;
  let tocando = false;

  function criarBufferRuido(contexto, duracaoSegundos = 4) {
    const tamanho = contexto.sampleRate * duracaoSegundos;
    const buffer = contexto.createBuffer(1, tamanho, contexto.sampleRate);
    const dados = buffer.getChannelData(0);
    for (let i = 0; i < tamanho; i++) dados[i] = Math.random() * 2 - 1;
    return buffer;
  }

  function iniciar({ volume = 0.16 } = {}) {
    if (tocando) return;
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();

    fonteRuido = ctx.createBufferSource();
    fonteRuido.buffer = criarBufferRuido(ctx);
    fonteRuido.loop = true;

    const passaFaixa = ctx.createBiquadFilter();
    passaFaixa.type = "bandpass";
    passaFaixa.frequency.value = 2200;
    passaFaixa.Q.value = 0.6;

    const passaBaixa = ctx.createBiquadFilter();
    passaBaixa.type = "lowpass";
    passaBaixa.frequency.value = 3200;

    lfo = ctx.createOscillator();
    lfo.frequency.value = 0.1;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.05;
    lfo.connect(lfoGain);

    gainMestre = ctx.createGain();
    gainMestre.gain.value = 0;
    lfoGain.connect(gainMestre.gain);

    fonteRuido.connect(passaFaixa);
    passaFaixa.connect(passaBaixa);
    passaBaixa.connect(gainMestre);
    gainMestre.connect(ctx.destination);

    fonteRuido.start(0);
    lfo.start(0);

    const agora = ctx.currentTime;
    gainMestre.gain.setValueAtTime(0, agora);
    gainMestre.gain.linearRampToValueAtTime(volume, agora + 3);
    tocando = true;
  }

  function tocarTom({ freq = 90, duracao = 1.4, volume = 0.12 } = {}) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.15);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + duracao);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duracao + 0.1);
  }

  return { iniciar, tocarTom, estaTocando: () => tocando };
})();

/* ---------------------------------------------------------------
   2. ELEMENTOS DA PÁGINA
   --------------------------------------------------------------- */
const elIntro = document.getElementById("intro");
const elStart = document.getElementById("start");
const elScene3d = document.getElementById("scene3d");
const elFade = document.getElementById("fade");
const elMira = document.getElementById("mira");
const elPrompt = document.getElementById("prompt");
const elLegenda = document.getElementById("legenda");
const elTime = document.getElementById("time");

/* ---------------------------------------------------------------
   3. RELÓGIO DO HUD (avança devagar, clima de "tempo real")
   --------------------------------------------------------------- */
(function relogioHUD() {
  let minutos = 23 * 60 + 48;
  setInterval(() => {
    minutos++;
    const h = Math.floor(minutos / 60) % 24;
    const m = minutos % 60;
    elTime.textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }, 6000);
})();

/* ---------------------------------------------------------------
   4. LEGENDA (texto de narrativa que aparece e some)
   --------------------------------------------------------------- */
function mostrarLegenda(texto, duracao = 5000) {
  elLegenda.textContent = texto;
  elLegenda.classList.add("visivel");
  clearTimeout(mostrarLegenda._t);
  mostrarLegenda._t = setTimeout(() => {
    elLegenda.classList.remove("visivel");
  }, duracao);
}

/* ---------------------------------------------------------------
   5. CENA 3D — a doceria no turno da noite
   --------------------------------------------------------------- */
let camera, scene, renderer;
let chuvaPontos, chuvaVelocidades;
let lampada, luzLampada;
let grupoBalcao;
let travado = false;
let balcaoVisitado = false;
let pertoDoBalcao = false;

const teclas = { w: false, a: false, s: false, d: false };
const euler = new THREE.Euler(0, 0, 0, "YXZ");
const PI_2 = Math.PI / 2;
const VELOCIDADE = 2.6;
const LIMITES = { x: 3.2, zMin: -12, zMax: 6 };
const POSICAO_BALCAO = new THREE.Vector3(0, 0, -9);

function iniciarCena() {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05070a, 0.05);

  camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1.6, 4);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  elScene3d.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0x0c1016, 0.55));

  criarLoja();
  criarBalcao();
  criarChuvaVisual();

  window.addEventListener("resize", aoRedimensionar);
}

function criarLoja() {
  const chao = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 20),
    new THREE.MeshStandardMaterial({ color: 0x171310, roughness: 0.95 })
  );
  chao.rotation.x = -Math.PI / 2;
  chao.position.set(0, 0, -6);
  scene.add(chao);

  const teto = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 20),
    new THREE.MeshStandardMaterial({ color: 0x0c0a08, roughness: 1 })
  );
  teto.rotation.x = Math.PI / 2;
  teto.position.set(0, 3.4, -6);
  scene.add(teto);

  const matParede = new THREE.MeshStandardMaterial({ color: 0x1e1a15, roughness: 0.9 });

  const paredeEsq = new THREE.Mesh(new THREE.PlaneGeometry(20, 3.4), matParede);
  paredeEsq.rotation.y = Math.PI / 2;
  paredeEsq.position.set(-4, 1.7, -6);
  scene.add(paredeEsq);

  const paredeDir = paredeEsq.clone();
  paredeDir.rotation.y = -Math.PI / 2;
  paredeDir.position.set(4, 1.7, -6);
  scene.add(paredeDir);

  const paredeFundo = new THREE.Mesh(new THREE.PlaneGeometry(8, 3.4), matParede);
  paredeFundo.position.set(0, 1.7, -16);
  scene.add(paredeFundo);

  const corDoces = [0xd67b8f, 0xe6c15c, 0x8fb3d6, 0xd6935c, 0xb98fd6];
  for (let lado = -1; lado <= 1; lado += 2) {
    for (let z = -2; z > -14; z -= 3) {
      const prateleira = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 1.6, 1.4),
        new THREE.MeshStandardMaterial({ color: 0x2a231b, roughness: 0.8 })
      );
      prateleira.position.set(lado * 3.6, 0.8, z);
      scene.add(prateleira);

      for (let i = 0; i < 5; i++) {
        const doce = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, 0.16, 0.16),
          new THREE.MeshStandardMaterial({
            color: corDoces[i % corDoces.length],
            roughness: 0.4,
            emissive: corDoces[i % corDoces.length],
            emissiveIntensity: 0.05,
          })
        );
        doce.position.set(lado * 3.6 - lado * 0.3, 1.35, z - 0.5 + i * 0.22);
        scene.add(doce);
      }
    }
  }

  const janela = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 1.6),
    new THREE.MeshStandardMaterial({
      color: 0x1a2a33,
      emissive: 0x0e2530,
      emissiveIntensity: 0.6,
      roughness: 1,
    })
  );
  janela.position.set(-2.4, 1.9, -15.9);
  scene.add(janela);

  const luzJanela = new THREE.PointLight(0x274a5c, 0.5, 6);
  luzJanela.position.set(-2.4, 1.9, -14.5);
  scene.add(luzJanela);
}

function criarBalcao() {
  grupoBalcao = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 1.0, 0.7),
    new THREE.MeshStandardMaterial({ color: 0x2b2118, roughness: 0.7 })
  );
  base.position.set(0, 0.5, 0);
  grupoBalcao.add(base);

  const vitrine = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.5, 0.6),
    new THREE.MeshStandardMaterial({
      color: 0x9fd6e0,
      transparent: true,
      opacity: 0.18,
      roughness: 0.1,
      metalness: 0.1,
    })
  );
  vitrine.position.set(0, 1.25, 0);
  grupoBalcao.add(vitrine);

  grupoBalcao.position.copy(POSICAO_BALCAO);
  scene.add(grupoBalcao);

  lampada = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xffdca8, emissive: 0xffdca8, emissiveIntensity: 1 })
  );
  lampada.position.set(0, 2.7, POSICAO_BALCAO.z);
  scene.add(lampada);

  luzLampada = new THREE.PointLight(0xffdca8, 1.1, 6, 2);
  luzLampada.position.copy(lampada.position);
  scene.add(luzLampada);
}

function criarChuvaVisual() {
  const qtd = 500;
  const geo = new THREE.BufferGeometry();
  const posicoes = new Float32Array(qtd * 3);
  chuvaVelocidades = new Float32Array(qtd);

  for (let i = 0; i < qtd; i++) {
    posicoes[i * 3] = -4 + Math.random() * 2.4;
    posicoes[i * 3 + 1] = Math.random() * 3.4;
    posicoes[i * 3 + 2] = -14 + Math.random() * -3;
    chuvaVelocidades[i] = 3 + Math.random() * 2;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(posicoes, 3));

  const mat = new THREE.PointsMaterial({
    color: 0x9fc2d6,
    size: 0.025,
    transparent: true,
    opacity: 0.55,
  });
  chuvaPontos = new THREE.Points(geo, mat);
  scene.add(chuvaPontos);
}

function animarChuva(delta) {
  const pos = chuvaPontos.geometry.attributes.position.array;
  for (let i = 0; i < chuvaVelocidades.length; i++) {
    pos[i * 3 + 1] -= chuvaVelocidades[i] * delta;
    if (pos[i * 3 + 1] < 0) {
      pos[i * 3 + 1] = 3.4;
      pos[i * 3] = -4 + Math.random() * 2.4;
    }
  }
  chuvaPontos.geometry.attributes.position.needsUpdate = true;
}

/* ---------------- evento do balcão ---------------- */
function verificarProximidadeBalcao() {
  const dist = camera.position.distanceTo(
    new THREE.Vector3(POSICAO_BALCAO.x, camera.position.y, POSICAO_BALCAO.z)
  );
  const perto = dist < 2.6;

  if (perto && !pertoDoBalcao && !balcaoVisitado) {
    elPrompt.textContent = "PRESSIONE  E  PARA VERIFICAR O BALCÃO";
    elPrompt.classList.add("visivel");
  }
  if (!perto && pertoDoBalcao) {
    elPrompt.classList.remove("visivel");
  }
  pertoDoBalcao = perto;
}

function ativarEventoBalcao() {
  if (balcaoVisitado || !pertoDoBalcao) return;
  balcaoVisitado = true;
  elPrompt.classList.remove("visivel");

  Chuva.tocarTom({ freq: 70, duracao: 2.2, volume: 0.1 });

  let piscadas = 0;
  const intervaloFlick = setInterval(() => {
    luzLampada.intensity = luzLampada.intensity > 0.3 ? 0.05 : 1.3;
    piscadas++;
    if (piscadas > 7) {
      clearInterval(intervaloFlick);
      luzLampada.intensity = 0.5;
    }
  }, 110);

  setTimeout(() => {
    mostrarLegenda("O balcão está frio. Alguém esteve aqui antes de você.", 6000);
  }, 900);
}

/* ---------------- controles ---------------- */
function aoMoverMouse(e) {
  if (!travado) return;
  euler.setFromQuaternion(camera.quaternion);
  euler.y -= (e.movementX || 0) * 0.0022;
  euler.x -= (e.movementY || 0) * 0.0022;
  euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));
  camera.quaternion.setFromEuler(euler);
}

function aoTravarMudar() {
  travado = document.pointerLockElement === renderer.domElement;
  elMira.style.display = travado ? "block" : "none";
}

function aoTeclaBaixo(e) {
  if (e.code === "KeyW") teclas.w = true;
  if (e.code === "KeyA") teclas.a = true;
  if (e.code === "KeyS") teclas.s = true;
  if (e.code === "KeyD") teclas.d = true;
  if (e.code === "KeyE") ativarEventoBalcao();
}
function aoTeclaCima(e) {
  if (e.code === "KeyW") teclas.w = false;
  if (e.code === "KeyA") teclas.a = false;
  if (e.code === "KeyS") teclas.s = false;
  if (e.code === "KeyD") teclas.d = false;
}

function moverJogador(delta) {
  const direcao = new THREE.Vector3();
  camera.getWorldDirection(direcao);
  direcao.y = 0;
  direcao.normalize();

  const lateral = new THREE.Vector3();
  lateral.crossVectors(camera.up, direcao).normalize();

  const passo = VELOCIDADE * delta;
  if (teclas.w) camera.position.addScaledVector(direcao, passo);
  if (teclas.s) camera.position.addScaledVector(direcao, -passo);
  if (teclas.a) camera.position.addScaledVector(lateral, passo);
  if (teclas.d) camera.position.addScaledVector(lateral, -passo);

  camera.position.x = Math.max(-LIMITES.x, Math.min(LIMITES.x, camera.position.x));
  camera.position.z = Math.max(LIMITES.zMin, Math.min(LIMITES.zMax, camera.position.z));
  camera.position.y = 1.6;
}

function aoRedimensionar() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

let ultimoTempo = performance.now();
function loop() {
  requestAnimationFrame(loop);
  const agora = performance.now();
  const delta = Math.min((agora - ultimoTempo) / 1000, 0.1);
  ultimoTempo = agora;

  moverJogador(delta);
  animarChuva(delta);
  verificarProximidadeBalcao();
  renderer.render(scene, camera);
}

/* ---------------------------------------------------------------
   6. INÍCIO DO JOGO
   --------------------------------------------------------------- */
function entrarNaDoceria() {
  elFade.classList.add("ativo");

  setTimeout(() => {
    elIntro.style.display = "none";
    elScene3d.style.display = "block";

    if (!scene) {
      iniciarCena();
      loop();
    }

    Chuva.iniciar({ volume: 0.16 });

    setTimeout(() => {
      mostrarLegenda("Mais um turno sozinha na loja. Só a chuva lá fora.", 6000);
    }, 600);

    renderer.domElement.addEventListener("click", () => {
      if (!travado) renderer.domElement.requestPointerLock();
    });
    renderer.domElement.requestPointerLock();

    elFade.classList.remove("ativo");
  }, 900);
}

document.addEventListener("pointerlockchange", () => {
  if (renderer) aoTravarMudar();
});
document.addEventListener("mousemove", aoMoverMouse);
document.addEventListener("keydown", aoTeclaBaixo);
document.addEventListener("keyup", aoTeclaCima);

elStart.addEventListener("click", entrarNaDoceria);
