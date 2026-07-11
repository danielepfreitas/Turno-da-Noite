const start = document.querySelector("#start");
const intro = document.querySelector("#intro");
const scene = document.querySelector("#scene");

start.addEventListener("click", iniciar);

function iniciar(){

intro.style.opacity="0";

setTimeout(()=>{

scene.innerHTML=`

<div id="opening">

<div class="text">

Esta história foi inspirada em acontecimentos reais.

</div>

</div>

`;

},1200);

}
