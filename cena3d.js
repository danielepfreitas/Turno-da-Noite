/* ==========================================================
   CENA3D.JS — ambiente 3D navegável em primeira pessoa
   Usa Three.js (r128, via CDN — ver index.html).
   Anexa sozinho um listener de clique em #start, então não
   precisa mexer no main.js existente.
   ========================================================== */

(function () {
  const container = document.getElementById("scene3d");
  const intro = document.getElementById("intro");
  const btnStart = document.getElementById("start");

  let camera, scene, renderer, chao, teto, luzLanterna;
  let chuvaPontos, chuvaVelocidades;
  let travado = false;

  const velocidade = 3.2; // unidades por segundo
  const teclas = { w: false, a: false, s: false, d: false };
  let euler = new THREE.Euler(0, 0, 0, "YXZ");
  const PI_2 = Math.PI / 2;

  const LIMITES = { x: 3.4, zMin: -20, zMax: 20 };

  function iniciarCena() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.075);

    camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 1.6, 8);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // luz ambiente bem fraca — corredor deve ficar quase escuro
    scene.add(new THREE.AmbientLight(0x0a0d14, 0.6));

    // lanterna presa à câmera (primeira pessoa)
    luzLanterna = new THREE.SpotLight(0xfff2d1, 1.4, 14, Math.PI / 6, 0.5, 1.6);
    luzLanterna.position.set(0, 0, 0);
    camera.add(luzLanterna);
    camera.add(luzLanterna.target);
    luzLanterna.target.position.set(0, 0, -1);
    scene.add(camera);

    // corredor: chão, teto e paredes laterais
    const matChao = new THREE.MeshStandardMaterial({ color: 0x14120f, roughness: 0.95 });
    chao = new THREE.Mesh(new THREE.PlaneGeometry(8, 60), matChao);
    chao.rotation.x = -Math.PI / 2;
    chao.position.set(0, 0, -10);
    scene.add(chao);

    const matParede = new THREE.MeshStandardMaterial({ color: 0x1c1a17, roughness: 0.9 });
    teto = new THREE.Mesh(new THREE.PlaneGeometry(8, 60), matParede);
    teto.rotation.x = Math.PI / 2;
    teto.position.set(0, 4, -10);
    scene.add(teto);

    const paredeEsq = new THREE.Mesh(new THREE.PlaneGeometry(60, 4), matParede);
    paredeEsq.rotation.y = Math.PI / 2;
    paredeEsq.position.set(-4, 2, -10);
    scene.add(paredeEsq);

    const paredeDir = paredeEsq.clone();
    paredeDir.rotation.y = -Math.PI / 2;
    paredeDir.position.set(4, 2, -10);
    scene.add(paredeDir);

    criarChuvaVisual();
    window.addEventListener("resize", aoRedimensionar);
  }

  function criarChuvaVisual() {
    const qtd = 700;
    const geo = new THREE.BufferGeometry();
    const posicoes = new Float32Array(qtd * 3);
    chuvaVelocidades = new Float32Array(qtd);

    for (let i = 0; i < qtd; i++) {
      posicoes[i * 3] = (Math.random() - 0.5) * 10;
      posicoes[i * 3 + 1] = Math.random() * 6;
      posicoes[i * 3 + 2] = camera.position.z - Math.random() * 30;
      chuvaVelocidades[i] = 4 + Math.random() * 3;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(posicoes, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x8fa3b3,
      size: 0.03,
      transparent: true,
      opacity: 0.5,
    });
    chuvaPontos = new THREE.Points(geo, mat);
    scene.add(chuvaPontos);
  }

  function animarChuva(delta) {
    const posicoes = chuvaPontos.geometry.attributes.position.array;
    for (let i = 0; i < chuvaVelocidades.length; i++) {
      posicoes[i * 3 + 1] -= chuvaVelocidades[i] * delta;
      if (posicoes[i * 3 + 1] < 0) {
        posicoes[i * 3 + 1] = 6;
        posicoes[i * 3] = (Math.random() - 0.5) * 10;
        posicoes[i * 3 + 2] = camera.position.z - Math.random() * 30;
      }
    }
    chuvaPontos.geometry.attributes.position.needsUpdate = true;
  }

  // ---------- controles: olhar com o mouse (pointer lock) ----------
  function aoMoverMouse(e) {
    if (!travado) return;
    const movX = e.movementX || 0;
    const movY = e.movementY || 0;

    euler.setFromQuaternion(camera.quaternion);
    euler.y -= movX * 0.0022;
    euler.x -= movY * 0.0022;
    euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));
    camera.quaternion.setFromEuler(euler);
  }

  function aoTravarMudar() {
    travado = document.pointerLockElement === renderer.domElement;
  }

  function aoTeclaBaixo(e) {
    if (e.code === "KeyW") teclas.w = true;
    if (e.code === "KeyA") teclas.a = true;
    if (e.code === "KeyS") teclas.s = true;
    if (e.code === "KeyD") teclas.d = true;
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

    const passo = velocidade * delta;
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
    renderer.render(scene, camera);
  }

  function entrarModoPrimeiraPessoa() {
    if (intro) intro.style.display = "none";
    container.style.display = "block";

    if (!scene) {
      iniciarCena();
      loop();
    }

    if (window.Chuva) window.Chuva.iniciar({ volume: 0.18 });

    renderer.domElement.requestPointerLock =
      renderer.domElement.requestPointerLock || renderer.domElement.mozRequestPointerLock;
    renderer.domElement.addEventListener("click", () => {
      renderer.domElement.requestPointerLock();
    });
    renderer.domElement.requestPointerLock();
  }

  document.addEventListener("pointerlockchange", aoTravarMudar);
  document.addEventListener("mousemove", aoMoverMouse);
  document.addEventListener("keydown", aoTeclaBaixo);
  document.addEventListener("keyup", aoTeclaCima);

  if (btnStart) {
    btnStart.addEventListener("click", entrarModoPrimeiraPessoa);
  }
})();
