/* ==========================================================
   CHUVA.JS — som de chuva fraca gerado por código
   Não precisa de nenhum arquivo .mp3/.wav: o som é sintetizado
   em tempo real com a Web Audio API (ruído branco filtrado).
   ========================================================== */

const Chuva = (() => {
  let ctx = null;
  let gainMestre = null;
  let fonteRuido = null;
  let filtroChuva = null;
  let filtroGotas = null;
  let lfo = null;
  let tocando = false;

  // Cria um buffer de ruído branco de alguns segundos, em loop
  function criarBufferRuido(contexto, duracaoSegundos = 4) {
    const tamanho = contexto.sampleRate * duracaoSegundos;
    const buffer = contexto.createBuffer(1, tamanho, contexto.sampleRate);
    const dados = buffer.getChannelData(0);
    for (let i = 0; i < tamanho; i++) {
      dados[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  function iniciar({ volume = 0.18 } = {}) {
    if (tocando) return;
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();

    // Camada 1: "chiado" contínuo de fundo (chuva fraca / fluida)
    fonteRuido = ctx.createBufferSource();
    fonteRuido.buffer = criarBufferRuido(ctx);
    fonteRuido.loop = true;

    filtroChuva = ctx.createBiquadFilter();
    filtroChuva.type = "bandpass";
    filtroChuva.frequency.value = 2200;
    filtroChuva.Q.value = 0.6;

    const filtroGrave = ctx.createBiquadFilter();
    filtroGrave.type = "lowpass";
    filtroGrave.frequency.value = 3200;

    // Camada 2: leve modulação para simular gotas / variação de intensidade
    lfo = ctx.createOscillator();
    lfo.frequency.value = 0.12; // bem lento, tipo "rajada de vento"
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.05;
    lfo.connect(lfoGain);

    gainMestre = ctx.createGain();
    gainMestre.gain.value = 0; // começa em silêncio pra fazer fade-in
    lfoGain.connect(gainMestre.gain);

    fonteRuido.connect(filtroChuva);
    filtroChuva.connect(filtroGrave);
    filtroGrave.connect(gainMestre);
    gainMestre.connect(ctx.destination);

    fonteRuido.start(0);
    lfo.start(0);

    // fade-in suave (3s) até o volume alvo
    const agora = ctx.currentTime;
    gainMestre.gain.cancelScheduledValues(agora);
    gainMestre.gain.setValueAtTime(0, agora);
    gainMestre.gain.linearRampToValueAtTime(volume, agora + 3);

    tocando = true;
  }

  function parar({ fadeOut = 2 } = {}) {
    if (!tocando || !ctx) return;
    const agora = ctx.currentTime;
    gainMestre.gain.cancelScheduledValues(agora);
    gainMestre.gain.setValueAtTime(gainMestre.gain.value, agora);
    gainMestre.gain.linearRampToValueAtTime(0, agora + fadeOut);

    setTimeout(() => {
      try {
        fonteRuido.stop();
        lfo.stop();
      } catch (e) {}
      tocando = false;
    }, fadeOut * 1000 + 100);
  }

  function definirVolume(v) {
    if (!tocando || !gainMestre) return;
    gainMestre.gain.linearRampToValueAtTime(v, ctx.currentTime + 0.5);
  }

  return { iniciar, parar, definirVolume, estaTocando: () => tocando };
})();

window.Chuva = Chuva;
