// =========================
// TURNO DA NOITE
// by Dani ❤️
// =========================

const scene = document.getElementById("scene");
const start = document.getElementById("start");
const time = document.getElementById("time");

let hora = "23:48";

time.textContent = hora;

start.addEventListener("click", iniciarJogo);

function fadeOut(element) {
    element.style.transition = "opacity 1s";
    element.style.opacity = "0";
}

function fadeIn(element) {
    element.style.opacity = "0";
    element.style.transition = "opacity 1s";

    requestAnimationFrame(() => {
        element.style.opacity = "1";
    });
}

function trocarCena(html) {

    scene.style.opacity = 0;

    setTimeout(() => {

        scene.innerHTML = html;

        scene.style.opacity = 1;

    },700);

}

function iniciarJogo(){

    fadeOut(document.getElementById("intro"));

    setTimeout(()=>{

        mostrarTelaRec();

    },1200);

}

function mostrarTelaRec(){

    trocarCena(`

        <div class="story">

            <div class="small">

                RECOVERED FOOTAGE

            </div>

            <div class="big">

                Arquivo recuperado

            </div>

            <div class="text">

                Origem desconhecida

            </div>

        </div>

    `);

    setTimeout(mostrarAviso,3000);

}

function mostrarAviso(){

    trocarCena(`

        <div class="story">

            <div class="big">

                Use fones de ouvido

            </div>

            <div class="text">

                Toque na tela para continuar

            </div>

        </div>

    `);

    scene.onclick = ()=>{

        scene.onclick=null;

        mostrarLocal();

    }

}

function mostrarLocal(){

    trocarCena(`

        <div class="story">

            <div class="hour">

                23:48

            </div>

            <div class="big">

                ARKO EROS

            </div>

            <div class="text">

                Confeitaria Artesanal

            </div>

        </div>

    `);

    setTimeout(cenaUm,3500);

}

function cenaUm(){

    trocarCena(`

        <div class="story">

            <div class="textBox">

                A chuva cai sem parar.

                <br><br>

                Você acabou de fechar a ARKO EROS.

                <br><br>

                Falta apenas conferir se tudo está em ordem antes de ir embora.

            </div>

            <div class="continue">

                Toque para continuar

            </div>

        </div>

    `);

    scene.onclick=()=>{

        scene.onclick=null;

        cenaDois();

    }

}

function cenaDois(){

    trocarCena(`

        <div class="story">

            <div class="textBox">

                O cheiro de café ainda está no ar.

                <br><br>

                A chuva bate contra os vidros da fachada.

                <br><br>

                O silêncio parece estranho esta noite.

            </div>

            <div class="continue">

                Continuar

            </div>

        </div>

    `);

    scene.onclick=()=>{

        scene.onclick=null;

        primeiraExploracao();

    }

}

function primeiraExploracao(){

    trocarCena(`

    <div id="room">

        <h1>ARKO EROS</h1>

        <p>

        Escolha um lugar para observar.

        </p>

        <div class="buttons">

            <button onclick="verBalcao()">

                Balcão

            </button>

            <button onclick="verVitrine()">

                Vitrine

            </button>

            <button onclick="verPorta()">

                Porta

            </button>

        </div>

    </div>

    `);

}

function verBalcao(){

    trocarCena(`

        <div class="story">

            <div class="textBox">

                Tudo parece limpo.

                <br><br>

                Você lembra da correria do dia.

                <br><br>

                Ainda existe uma xícara esquecida sobre o balcão.

            </div>

            <div class="continue">

                Voltar

            </div>

        </div>

    `);

    scene.onclick=()=>{

        scene.onclick=null;

        primeiraExploracao();

    }

}

function verVitrine(){

    trocarCena(`

        <div class="story">

            <div class="textBox">

                Restam apenas alguns doces.

                <br><br>

                Amanhã será outro dia cheio.

            </div>

            <div class="continue">

                Voltar

            </div>

        </div>

    `);

    scene.onclick=()=>{

        scene.onclick=null;

        primeiraExploracao();

    }

}

function verPorta(){

    trocarCena(`

        <div class="story">

            <div class="textBox">

                A chuva continua forte.

                <br><br>

                Você verifica a fechadura.

                <br><br>

                Está trancada.

            </div>

            <div class="continue">

                Voltar

            </div>

        </div>

    `);

    scene.onclick=()=>{

        scene.onclick=null;

        primeiraExploracao();

    }

}
// ===========================
// EXPLORAÇÃO DA ARKO EROS
// ===========================

let locaisVisitados = [];

function registrarLocal(nome){

    if(!locaisVisitados.includes(nome))
        locaisVisitados.push(nome);

    if(locaisVisitados.length >= 3){

        setTimeout(celularToca,800);

    }

}

function verBalcao(){

    registrarLocal("balcao");

    trocarCena(`

    <div class="story">

        <div class="big">

            Balcão

        </div>

        <div class="textBox">

            Você passa a mão lentamente sobre o balcão.

            <br><br>

            Ainda existe cheiro de café fresco.

            <br><br>

            Uma pequena xícara esquecida parece esperar alguém voltar.

        </div>

        <div class="continue">

            Toque para voltar

        </div>

    </div>

    `);

    scene.onclick=()=>{

        scene.onclick=null;

        primeiraExploracao();

    }

}

function verVitrine(){

    registrarLocal("vitrine");

    trocarCena(`

    <div class="story">

        <div class="big">

            Vitrine

        </div>

        <div class="textBox">

            Restaram poucos doces.

            <br><br>

            Você sorri lembrando de todos que passaram por aqui hoje.

            <br><br>

            Amanhã haverá mais histórias.

        </div>

        <div class="continue">

            Toque para voltar

        </div>

    </div>

    `);

    scene.onclick=()=>{

        scene.onclick=null;

        primeiraExploracao();

    }

}

function verPorta(){

    registrarLocal("porta");

    trocarCena(`

    <div class="story">

        <div class="big">

            Porta

        </div>

        <div class="textBox">

            A chuva continua caindo.

            <br><br>

            A rua está completamente vazia.

            <br><br>

            Você confere a fechadura.

            Está tudo certo.

        </div>

        <div class="continue">

            Toque para voltar

        </div>

    </div>

    `);

    scene.onclick=()=>{

        scene.onclick=null;

        primeiraExploracao();

    }

}

function celularToca(){

    scene.onclick=null;

    if(navigator.vibrate){

        navigator.vibrate([300,150,300]);

    }

    trocarCena(`

    <div class="story">

        <div class="big">

            📱

        </div>

        <div class="textBox">

            Seu celular vibra.

            <br><br>

            Existe apenas uma mensagem.

        </div>

        <button class="phoneButton" onclick="abrirMensagem()">

            Abrir mensagem

        </button>

    </div>

    `);

}

function abrirMensagem(){

    trocarCena(`

    <div class="story">

        <div class="big">

            Mensagem

        </div>

        <div class="textBox">

            "Você esqueceu uma coisa."

            <br><br>

            Nenhum número.

            <br><br>

            Nenhum nome.

        </div>

        <div class="continue">

            Toque para continuar

        </div>

    </div>

    `);

    scene.onclick=()=>{

        scene.onclick=null;

        deposito();

    }

}

function deposito(){

    trocarCena(`

    <div class="story">

        <div class="big">

            Depósito

        </div>

        <div class="textBox">

            Você caminha até o depósito.

            <br><br>

            As luzes piscam.

            <br><br>

            Pela primeira vez...

            Você sente que não está sozinha.

        </div>

        <div class="continue">

            Continuar

        </div>

    </div>

    `);

}
function deposito(){

    trocarCena(`

    <div class="story">

        <div class="big">
            Depósito
        </div>

        <div class="textBox">

            Você empurra lentamente a porta.

            <br><br>

            O cheiro de madeira antiga invade o ambiente.

            <br><br>

            A única lâmpada começa a piscar.

        </div>

        <div class="continue">
            Entrar
        </div>

    </div>

    `);

    scene.onclick=()=>{

        scene.onclick=null;

        depositoEscuro();

    }

}

function depositoEscuro(){

    trocarCena(`

    <div class="story">

        <div class="big">
            ...
        </div>

        <div class="textBox">

            Você procura o interruptor.

            <br><br>

            Nada.

            <br><br>

            Só existe o som da chuva.

        </div>

        <div class="continue">
            Continuar
        </div>

    </div>

    `);

    scene.onclick=()=>{

        scene.onclick=null;

        brilho();

    }

}

function brilho(){

    document.body.style.background="#050505";

    trocarCena(`

    <div class="story">

        <div class="big">
            Um brilho.
        </div>

        <div class="textBox">

            Algo iluminado aparece no fundo do depósito.

            <br><br>

            Parece uma caixa.

        </div>

        <button class="phoneButton" onclick="abrirCaixa()">

            Aproximar

        </button>

    </div>

    `);

}

function abrirCaixa(){

    trocarCena(`

    <div class="story">

        <div class="big">

            Caixa

        </div>

        <div class="textBox">

            Dentro dela existem algumas lembranças.

            <br><br>

            Uma coleira.

            <br>

            Uma fotografia.

            <br>

            Um ingresso antigo.

        </div>

        <button class="phoneButton" onclick="verIngresso()">

            Ver ingresso

        </button>

    </div>

    `);

}

function verIngresso(){

    trocarCena(`

    <div class="story">

        <div class="big">

            Ingresso

        </div>

        <div class="textBox">

            Banda Calypso.

            <br><br>

            Você sorri.

            <br><br>

            Tudo começou naquele dia.

        </div>

        <div class="continue">

            Continuar

        </div>

    </div>

    `);

    scene.onclick=()=>{

        scene.onclick=null;

        revelacao();

    }

}
