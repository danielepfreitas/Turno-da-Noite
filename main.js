/* ============================================================
   TURNO DA NOITE — main.js
   Jogo narrativo em 1ª pessoa. Roteiro completo em um arquivo:
   som de chuva sintetizado, cena 3D (Three.js), tarefas de
   fechamento, objetos, ligação, TV, depósito com lanterna,
   o vulto, a revelação, o projetor de fotos, a carta e os
   créditos finais.
   ============================================================ */

/* ---------------------------------------------------------------
   1. ÁUDIO — chuva, tons e "piano" finais, tudo sintetizado
   --------------------------------------------------------------- */
const Chuva = (() => {
  let ctx = null;
  let gainMestre = null;
  let fonteRuido = null;
  let lfo = null;
  let tocando = false;
  let pianoTimer = null;

  function criarBufferRuido(contexto, duracaoSegundos = 4) {
    const tamanho = contexto.sampleRate * duracaoSegundos;
    const buffer = contexto.createBuffer(1, tamanho, contexto.sampleRate);
    const dados = buffer.getChannelData(0);
    for (let i = 0; i < tamanho; i++) dados[i] = Math.random() * 2 - 1;
    return buffer;
  }

  function iniciar({ volume = 0.16 } = {}) {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    if (tocando) return;

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

  function mudarVolume(alvo, tempo = 1.2) {
    if (!ctx || !gainMestre) return;
    gainMestre.gain.cancelScheduledValues(ctx.currentTime);
    gainMestre.gain.setValueAtTime(gainMestre.gain.value, ctx.currentTime);
    gainMestre.gain.linearRampToValueAtTime(alvo, ctx.currentTime + tempo);
  }

  function tocarTom({ freq = 90, duracao = 1.4, volume = 0.12, tipo = "sine" } = {}) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = tipo;
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

  function tocarVibracao() {
    if (!ctx) return;
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.value = 165;
      const g = ctx.createGain();
      const inicio = ctx.currentTime + i * 0.32;
      g.gain.setValueAtTime(0, inicio);
      g.gain.linearRampToValueAtTime(0.06, inicio + 0.02);
      g.gain.linearRampToValueAtTime(0, inicio + 0.22);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(inicio);
      osc.stop(inicio + 0.24);
    }
  }

  function tocarRing() {
    if (!ctx) return;
    tocarTom({ freq: 480, duracao: 0.35, volume: 0.06, tipo: "sine" });
    setTimeout(() => tocarTom({ freq: 480, duracao: 0.35, volume: 0.06, tipo: "sine" }), 420);
  }

  function tocarRespiracao() {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 55;
    const filtro = ctx.createBiquadFilter();
    filtro.type = "lowpass";
    filtro.frequency.value = 220;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.6);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 3.6);
    osc.connect(filtro);
    filtro.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 3.8);
  }

  function iniciarPiano() {
    if (!ctx) return;
    const notas = [261.6, 329.6, 392.0, 466.2, 392.0, 329.6];
    let i = 0;
    pianoTimer = setInterval(() => {
      tocarTom({ freq: notas[i % notas.length], duracao: 2.4, volume: 0.045, tipo: "sine" });
      i++;
    }, 1500);
  }

  function pararPiano() {
    if (pianoTimer) clearInterval(pianoTimer);
    pianoTimer = null;
  }

  return {
    iniciar, mudarVolume, tocarTom, tocarVibracao,
    tocarRing, tocarRespiracao, iniciarPiano, pararPiano,
  };
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
const elCartaoPreto = document.getElementById("cartao-preto");
const elCartaoPretoTexto = document.getElementById("cartao-preto-texto");
const elCelular = document.getElementById("celular");
const elCelularTexto = document.getElementById("celular-texto");
const elObjeto = document.getElementById("objeto");
const elObjetoIcone = document.getElementById("objeto-icone");
const elObjetoTitulo = document.getElementById("objeto-titulo");
const elTelefone = document.getElementById("telefone");
const elTelefoneEstado = document.getElementById("telefone-estado");
const elTelefoneDica = document.getElementById("telefone-dica");
const elTv = document.getElementById("tv");
const elTvMensagem = document.getElementById("tv-mensagem");
const elProjetor = document.getElementById("projetor");
const elProjetorImg = document.getElementById("projetor-img");
const elProjetorCoracao = document.getElementById("projetor-coracao");
const elProjetorLegenda = document.getElementById("projetor-legenda");
const elCarta = document.getElementById("carta");
const elCartaTexto = document.getElementById("carta-texto");
const elCreditos = document.getElementById("creditos");
const elVhsScan = document.getElementById("vhs-scan");

/* ---------------------------------------------------------------
   3. RELÓGIO DO HUD
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
   4. LEGENDA
   --------------------------------------------------------------- */
function mostrarLegenda(texto, duracao = 4500) {
  elLegenda.textContent = texto;
  elLegenda.classList.add("visivel");
  clearTimeout(mostrarLegenda._t);
  mostrarLegenda._t = setTimeout(() => {
    elLegenda.classList.remove("visivel");
  }, duracao);
}

/* ---------------------------------------------------------------
   5. CARTÃO PRETO (avisos no início)
   --------------------------------------------------------------- */
function sequenciaCartaoPreto(linhas, aoTerminar) {
  elCartaoPreto.style.display = "flex";
  let i = 0;
  function proxima() {
    if (i >= linhas.length) {
      elCartaoPreto.style.display = "none";
      aoTerminar();
      return;
    }
    elCartaoPretoTexto.textContent = linhas[i];
    elCartaoPretoTexto.classList.remove("visivel");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      elCartaoPretoTexto.classList.add("visivel");
    }));
    i++;
    setTimeout(() => {
      elCartaoPretoTexto.classList.remove("visivel");
      setTimeout(proxima, 700);
    }, 2100);
  }
  proxima();
}

/* ---------------------------------------------------------------
   6. CELULAR (notificações de texto)
   --------------------------------------------------------------- */
function mostrarCelular(texto, duracao = 3600) {
  elCelularTexto.textContent = texto;
  elCelular.classList.remove("visivel");
  void elCelular.offsetWidth; // reinicia a animação de vibrar
  elCelular.classList.add("visivel");
  Chuva.tocarVibracao();
  setTimeout(() => elCelular.classList.remove("visivel"), duracao);
}

/* ---------------------------------------------------------------
   7. OBJETO ENCONTRADO (item card)
   --------------------------------------------------------------- */
function mostrarObjeto({ icone, titulo, revelacao, duracaoTitulo = 1900, duracaoRevelacao = 2400 }, aoTerminar) {
  elObjetoIcone.textContent = icone;
  elObjetoTitulo.textContent = titulo;
  elObjeto.style.display = "flex";
  setTimeout(() => {
    if (revelacao) {
      elObjetoTitulo.textContent = revelacao;
      setTimeout(() => {
        elObjeto.style.display = "none";
        aoTerminar && aoTerminar();
      }, duracaoRevelacao);
    } else {
      elObjeto.style.display = "none";
      aoTerminar && aoTerminar();
    }
  }, duracaoTitulo);
}

/* ---------------------------------------------------------------
   8. CENA 3D
   --------------------------------------------------------------- */
let camera, scene, renderer;
let chuvaPontos, chuvaVelocidades;
let luzAmbiente;
let luzesTeto = [];
let lampada, luzLampada;
let lanterna;
let grupoBalcao;
let vulto;
let travado = false;
let controleAtivo = false;

const teclas = { w: false, a: false, s: false, d: false };
const euler = new THREE.Euler(0, 0, 0, "YXZ");
const PI_2 = Math.PI / 2;
const VELOCIDADE = 2.4;
const LIMITES = { x: 3.2, zMin: -15.2, zMax: 6 };
const POSICAO_BALCAO = new THREE.Vector3(0, 0, -9);
const ESCALA_RENDER = 0.5;
const ALTURA_JOGADOR = 1.6;
let tempoBob = 0;

let pontoAtual = null; // { pos, texto, aoAcionar }

function iniciarCena() {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0e0d0a, 0.028);

  camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1.6, 4);

  renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setPixelRatio(1);
  renderer.setSize(window.innerWidth * ESCALA_RENDER, window.innerHeight * ESCALA_RENDER, false);
  elScene3d.appendChild(renderer.domElement);

  luzAmbiente = new THREE.AmbientLight(0x2a2620, 1.0);
  scene.add(luzAmbiente);

  // lanterna presa à câmera — usada só no depósito
  lanterna = new THREE.SpotLight(0xdcefff, 0, 10, Math.PI / 6, 0.5, 1.4);
  lanterna.position.set(0, 0, 0);
  camera.add(lanterna);
  camera.add(lanterna.target);
  lanterna.target.position.set(0, 0, -1);
  scene.add(camera);

  criarLoja();
  criarBalcao();
  criarChuvaVisual();
  criarVulto();

  window.addEventListener("resize", aoRedimensionar);
}

function criarLoja() {
  const chao = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 22),
    new THREE.MeshStandardMaterial({ color: 0x171310, roughness: 0.95 })
  );
  chao.rotation.x = -Math.PI / 2;
  chao.position.set(0, 0, -7);
  scene.add(chao);

  const teto = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 22),
    new THREE.MeshStandardMaterial({ color: 0x0c0a08, roughness: 1 })
  );
  teto.rotation.x = Math.PI / 2;
  teto.position.set(0, 3.4, -7);
  scene.add(teto);

  const matParede = new THREE.MeshStandardMaterial({ color: 0x1e1a15, roughness: 0.9 });

  const paredeEsq = new THREE.Mesh(new THREE.PlaneGeometry(22, 3.4), matParede);
  paredeEsq.rotation.y = Math.PI / 2;
  paredeEsq.position.set(-4, 1.7, -7);
  scene.add(paredeEsq);

  const paredeDir = paredeEsq.clone();
  paredeDir.rotation.y = -Math.PI / 2;
  paredeDir.position.set(4, 1.7, -7);
  scene.add(paredeDir);

  const paredeFundo = new THREE.Mesh(new THREE.PlaneGeometry(8, 3.4), matParede);
  paredeFundo.position.set(0, 1.7, -18);
  scene.add(paredeFundo);

  const corDoces = [0xd67b8f, 0xe6c15c, 0x8fb3d6, 0xd6935c, 0xb98fd6];
  for (let lado = -1; lado <= 1; lado += 2) {
    for (let z = -2; z > -16; z -= 3) {
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
  janela.position.set(-2.4, 1.9, -17.9);
  scene.add(janela);

  const luzJanela = new THREE.PointLight(0x274a5c, 0.5, 6);
  luzJanela.position.set(-2.4, 1.9, -16.5);
  scene.add(luzJanela);

  for (let z = -1; z > -16; z -= 4) {
    const luzTeto = new THREE.PointLight(0xfff0d6, 0.65, 7, 2);
    luzTeto.position.set(0, 3.1, z);
    scene.add(luzTeto);
    luzesTeto.push(luzTeto);
  }
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
    posicoes[i * 3 + 2] = -16 + Math.random() * -3;
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

function criarVulto() {
  const g = new THREE.Group();
  const corpo = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 1.5, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x040404, roughness: 1, transparent: true, opacity: 0 })
  );
  corpo.position.y = 0.95;
  const cabeca = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x040404, roughness: 1, transparent: true, opacity: 0 })
  );
  cabeca.position.y = 1.85;
  g.add(corpo, cabeca);
  g.position.set(0, 0, -17);
  g.visible = false;
  scene.add(g);
  vulto = g;
}

/* ---------------- ponto de interação genérico ---------------- */
function definirPonto(pos, texto, aoAcionar) {
  pontoAtual = { pos, texto, aoAcionar, perto: false };
}

function limparPonto() {
  pontoAtual = null;
  elPrompt.classList.remove("visivel");
}

function verificarPonto() {
  if (!pontoAtual) return;
  const dist = camera.position.distanceTo(
    new THREE.Vector3(pontoAtual.pos.x, camera.position.y, pontoAtual.pos.z)
  );
  const perto = dist < 2.2;
  if (perto && !pontoAtual.perto) {
    elPrompt.textContent = pontoAtual.texto;
    elPrompt.classList.add("visivel");
  }
  if (!perto && pontoAtual.perto) {
    elPrompt.classList.remove("visivel");
  }
  pontoAtual.perto = perto;
}

function aoAcionarPonto() {
  if (pontoAtual && pontoAtual.perto) {
    const acao = pontoAtual.aoAcionar;
    limparPonto();
    acao();
  }
}

/* ---------------- controles ---------------- */
function aoMoverMouse(e) {
  if (!travado || !controleAtivo) return;
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
  if (e.code === "KeyE") aoAcionarPonto();
}
function aoTeclaCima(e) {
  if (e.code === "KeyW") teclas.w = false;
  if (e.code === "KeyA") teclas.a = false;
  if (e.code === "KeyS") teclas.s = false;
  if (e.code === "KeyD") teclas.d = false;
}

function moverJogador(delta) {
  if (!controleAtivo) return;
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

  const movendo = teclas.w || teclas.a || teclas.s || teclas.d;
  tempoBob += delta * (movendo ? 7 : 1.3);
  const bob = movendo ? Math.sin(tempoBob) * 0.035 : Math.sin(tempoBob) * 0.006;
  camera.position.y = ALTURA_JOGADOR + bob;
}

function aoRedimensionar() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth * ESCALA_RENDER, window.innerHeight * ESCALA_RENDER, false);
}

let ultimoTempo = performance.now();
function loop() {
  requestAnimationFrame(loop);
  const agora = performance.now();
  const delta = Math.min((agora - ultimoTempo) / 1000, 0.1);
  ultimoTempo = agora;

  moverJogador(delta);
  animarChuva(delta);
  verificarPonto();
  renderer.render(scene, camera);
}

/* ---------------------------------------------------------------
   9. ROTEIRO — a sequência inteira da história
   --------------------------------------------------------------- */

// --- 9.0 início ---
function entrarNaDoceria() {
  elFade.classList.add("ativo");
  setTimeout(() => {
    elIntro.style.display = "none";
    elFade.classList.remove("ativo");

    sequenciaCartaoPreto(
      [
        "Esta história foi baseada em acontecimentos reais.",
        "Alguns nomes foram alterados.",
        "Use fones de ouvido.",
        "23:48",
        "Confeitaria Flor de Cacau — São Paulo",
        "Começa a chover.",
        "Você está fechando a loja.",
      ],
      iniciarJogo
    );
  }, 900);
}

function iniciarJogo() {
  elFade.classList.add("ativo");
  setTimeout(() => {
    elScene3d.style.display = "block";
    if (!scene) {
      iniciarCena();
      loop();
    }
    controleAtivo = true;
    Chuva.iniciar({ volume: 0.16 });

    renderer.domElement.addEventListener("click", () => {
      if (!travado) renderer.domElement.requestPointerLock();
    });
    renderer.domElement.requestPointerLock();

    elFade.classList.remove("ativo");
    iniciarTarefas();
  }, 900);
}

// --- 9.1 tarefas de fechamento ---
const TAREFAS = [
  { pos: new THREE.Vector3(-3.6, 0, -2), texto: "PRESSIONE  E  PARA APAGAR AS LUZES", fala: "Apagando as luzes de vitrine..." },
  { pos: new THREE.Vector3(3.6, 0, -2), texto: "PRESSIONE  E  PARA FECHAR O CAIXA", fala: "Fechando o caixa do dia." },
  { pos: new THREE.Vector3(-3.6, 0, -8), texto: "PRESSIONE  E  PARA GUARDAR OS DOCES", fala: "Guardando os doces que sobraram." },
  { pos: new THREE.Vector3(3.6, 0, -8), texto: "PRESSIONE  E  PARA CONFERIR A PORTA", fala: "Conferindo se a porta está trancada." },
];

function iniciarTarefas(indice = 0) {
  if (indice >= TAREFAS.length) {
    setTimeout(iniciarEventoCelular1, 1500);
    return;
  }
  const t = TAREFAS[indice];
  definirPonto(t.pos, t.texto, () => {
    mostrarLegenda(t.fala, 3200);
    setTimeout(() => iniciarTarefas(indice + 1), 1800);
  });
}

// --- 9.2 celular: "você esqueceu uma coisa" ---
function iniciarEventoCelular1() {
  mostrarCelular("Você esqueceu uma coisa.", 3800);
  setTimeout(() => {
    mostrarCelular("Tem certeza?", 3800);
    setTimeout(iniciarObjetos, 4200);
  }, 4400);
}

// --- 9.3 os três objetos ---
const OBJETOS = [
  {
    pos: new THREE.Vector3(-3.6, 0, -5),
    texto: "PRESSIONE  E  PARA VER O QUE É",
    icone: "📄",
    titulo: "Um ingresso velho.",
    revelacao: "Banda Calypso",
  },
  {
    pos: new THREE.Vector3(3.6, 0, -5),
    texto: "PRESSIONE  E  PARA VER O QUE É",
    icone: "📱",
    titulo: "Um print de uma conversa antiga.",
    revelacao: "Oi. A Ana me passou seu contato kkkkk",
  },
  {
    pos: new THREE.Vector3(0, 0, -13),
    texto: "PRESSIONE  E  PARA VER O QUE É",
    icone: "🐶",
    titulo: "Uma coleira.",
    revelacao: "Orion",
  },
];

function iniciarObjetos(indice = 0) {
  if (indice >= OBJETOS.length) {
    setTimeout(iniciarTelefonema, 1800);
    return;
  }
  const o = OBJETOS[indice];
  definirPonto(o.pos, o.texto, () => {
    mostrarObjeto(o, () => iniciarObjetos(indice + 1));
  });
}

// --- 9.4 o telefone toca de verdade ---
function iniciarTelefonema() {
  controleAtivo = false;
  elTelefone.style.display = "flex";
  elTelefoneEstado.textContent = "TELEFONE TOCANDO...";
  elTelefoneDica.textContent = "clique para atender";

  const ring = setInterval(() => Chuva.tocarRing(), 1600);
  Chuva.tocarRing();

  elTelefone.onclick = () => {
    clearInterval(ring);
    elTelefoneEstado.textContent = "...";
    elTelefoneDica.textContent = "";
    Chuva.tocarRespiracao();
    setTimeout(() => {
      mostrarLegenda("Desliga.", 2000);
      elTelefone.style.display = "none";
      controleAtivo = true;
      setTimeout(iniciarTV, 1600);
    }, 3800);
  };
}

// --- 9.5 a TV liga ---
function iniciarTV() {
  controleAtivo = false;
  elTv.style.display = "flex";
  elTvMensagem.classList.remove("visivel");

  setTimeout(() => {
    elTvMensagem.textContent = "Você já sabe quem sou.";
    elTvMensagem.classList.add("visivel");
    Chuva.tocarTom({ freq: 58, duracao: 2, volume: 0.08 });
  }, 2400);

  setTimeout(() => {
    elTv.style.display = "none";
    controleAtivo = true;
    setTimeout(iniciarDeposito, 1000);
  }, 5600);
}

// --- 9.6 depósito, só com lanterna ---
function iniciarDeposito() {
  mostrarLegenda("Tudo apagado. Só a lanterna.", 3600);

  luzesTeto.forEach((l) => animarValor(l, "intensity", 0, 1800));
  animarValor(luzAmbiente, "intensity", 0.18, 1800);
  animarValor(lanterna, "intensity", 1.5, 1800);

  setTimeout(() => {
    definirPonto(new THREE.Vector3(0, 0, -16.5), "PRESSIONE  E  PARA ILUMINAR A PAREDE", () => {
      mostrarLegenda("Você ainda não lembrou.", 4200);
      setTimeout(iniciarPortaFinal, 4600);
    });
  }, 1900);
}

// --- 9.7 a porta final e o vulto ---
function iniciarPortaFinal() {
  controleAtivo = false;
  mostrarLegenda("Ela abre a última porta.", 2600);
  Chuva.mudarVolume(0, 2.5);

  setTimeout(() => {
    elFade.classList.add("ativo");
    setTimeout(() => {
      animarValor(lanterna, "intensity", 0.35, 200);
      vulto.visible = true;
      vulto.children.forEach((m) => (m.material.opacity = 0.85));
      elFade.classList.remove("ativo");
      mostrarLegenda("Silêncio total.", 2400);

      setTimeout(() => {
        elVhsScan.style.opacity = "1";
        setTimeout(() => (elVhsScan.style.opacity = "0.6"), 90);
        setTimeout(() => (elVhsScan.style.opacity = "1"), 260);
        setTimeout(() => (elVhsScan.style.opacity = "0.6"), 350);
      }, 1800);

      setTimeout(() => {
        vulto.children.forEach((m) => animarValor(m.material, "opacity", 0, 1500));
        mostrarLegenda("Não acontece.", 3000);
        setTimeout(() => {
          vulto.visible = false;
          iniciarRevelacao();
        }, 2600);
      }, 3600);
    }, 1300);
  }, 2800);
}

// --- 9.8 revelação: a loja fica quente e aconchegante ---
function iniciarRevelacao() {
  mostrarLegenda("As luzes acendem.", 2600);
  Chuva.mudarVolume(0.12, 3);

  luzesTeto.forEach((l) => {
    l.color.set(0xffd9a0);
    animarValor(l, "intensity", 1.1, 2600);
  });
  animarValor(luzAmbiente, "intensity", 1.3, 2600);
  animarValor(lanterna, "intensity", 0, 1200);
  luzAmbiente.color.set(0x3a2f22);

  setTimeout(() => {
    mostrarLegenda("Agora está aconchegante.", 3200);
  }, 2800);

  setTimeout(() => {
    controleAtivo = false;
    iniciarProjetor();
  }, 6400);
}

// --- 9.9 projetor de fotos ---
const FOTOS = [
  { src: "fotos/foto1.jpg", legenda: "O show mais aleatório possível.\nQuem imaginaria que a Banda Calypso mudaria minha vida?" },
  { src: "fotos/foto2.jpg", legenda: "Você pediu meu contato.\nEu nem imaginava onde isso ia dar." },
  { src: "fotos/foto3.jpg", legenda: "Meses depois...\nVocê aceitou sair comigo." },
  { src: "fotos/foto4.jpg", legenda: "Nosso primeiro beijo." },
  { src: "fotos/foto5.jpg", legenda: "Depois veio você.\nDepois veio eu.\nDepois veio nós." },
  { src: "fotos/foto6.jpg", legenda: "Até que um dia...\nencontramos alguém.\nOrion." },
];

function iniciarProjetor(indice = 0) {
  if (indice >= FOTOS.length) {
    elProjetor.style.display = "none";
    elProjetor.onclick = null;
    setTimeout(iniciarCarta, 800);
    return;
  }
  const f = FOTOS[indice];
  elProjetor.style.display = "flex";
  elProjetorImg.style.display = "none";
  elProjetorCoracao.style.display = "flex";
  elProjetorImg.src = f.src;
  elProjetorImg.onload = () => {
    elProjetorImg.style.display = "block";
    elProjetorCoracao.style.display = "none";
  };
  elProjetorImg.onerror = () => {
    elProjetorImg.style.display = "none";
    elProjetorCoracao.style.display = "flex";
  };
  elProjetorLegenda.textContent = f.legenda;

  let avancou = false;
  const avancar = () => {
    if (avancou) return;
    avancou = true;
    elProjetor.onclick = null;
    iniciarProjetor(indice + 1);
  };
  elProjetor.onclick = avancar;
  setTimeout(avancar, 5200);
}

// --- 9.10 a carta final ---
function iniciarCarta() {
  Chuva.iniciarPiano();
  elCarta.style.display = "flex";
  const texto = [
    "Você provavelmente passou os últimos minutos esperando um susto.",
    "Mas a verdade é que nunca existiu um monstro.",
    "Porque todos os lugares escuros que eu entrei... você estava comigo.",
    "Obrigado por transformar minhas noites em casa.",
    "Obrigado pelas gameplays. Obrigado pelas conversas. Obrigado pelo nosso Orion.",
    "Se um dia existir um último episódio... espero que seja nós dois, bem velhinhos, ainda assistindo um jogo de terror no sofá, brigando pra decidir qual gameplay colocar.",
    "Eu te amo. Para sempre.\n\n— Dani",
  ];
  let i = 0;
  function mostrarParagrafo() {
    if (i >= texto.length) {
      setTimeout(() => {
        Chuva.pararPiano();
        elCarta.style.display = "none";
        iniciarCreditos();
      }, 3600);
      return;
    }
    elCartaTexto.classList.remove("visivel");
    elCartaTexto.textContent = texto[i];
    requestAnimationFrame(() => requestAnimationFrame(() => {
      elCartaTexto.classList.add("visivel");
    }));
    i++;
    setTimeout(() => {
      elCartaTexto.classList.remove("visivel");
      setTimeout(mostrarParagrafo, 900);
    }, 4600);
  }
  mostrarParagrafo();
}

// --- 9.11 créditos finais ---
function iniciarCreditos() {
  elScene3d.style.display = "none";
  elCreditos.style.display = "flex";
}

/* ---------------- utilitário: anima um número ao longo do tempo ---------------- */
function animarValor(obj, prop, alvo, duracaoMs) {
  const inicio = obj[prop];
  const t0 = performance.now();
  function passo(agora) {
    const p = Math.min((agora - t0) / duracaoMs, 1);
    obj[prop] = inicio + (alvo - inicio) * p;
    if (p < 1) requestAnimationFrame(passo);
  }
  requestAnimationFrame(passo);
}

/* ---------------------------------------------------------------
   10. LIGAÇÕES DE EVENTOS
   --------------------------------------------------------------- */
document.addEventListener("pointerlockchange", () => {
  if (renderer) aoTravarMudar();
});
document.addEventListener("mousemove", aoMoverMouse);
document.addEventListener("keydown", aoTeclaBaixo);
document.addEventListener("keyup", aoTeclaCima);

elStart.addEventListener("click", entrarNaDoceria);
