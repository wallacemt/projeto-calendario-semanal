let conteudo = document.getElementById("conteudo");
let titulo = document.getElementById("titulo");

let conteudoExtra = document.getElementById("content-extra");

let banner1 = document.getElementById("conteudo-1");
let tituloconteudo1 = document.getElementById("titulo-conteudo-1");
let subtitulo1 = document.getElementById("subtitulo-1");
let link1 = document.getElementById("link-1");

let banner2 = document.getElementById("conteudo-2");
let tituloconteudo2 = document.getElementById("titulo-conteudo-2");
let subtitulo2 = document.getElementById("subtitulo-2");
let link2 = document.getElementById("link-2");

let banner3 = document.getElementById("conteudo-3");
let tituloconteudo3 = document.getElementById("titulo-conteudo-3");
let subtitulo3 = document.getElementById("subtitulo-3");
let link3 = document.getElementById("link-3");

const cardsConteudo = [
  { banner: banner1, titulo: tituloconteudo1, subtitulo: subtitulo1, link: link1 },
  { banner: banner2, titulo: tituloconteudo2, subtitulo: subtitulo2, link: link2 },
  { banner: banner3, titulo: tituloconteudo3, subtitulo: subtitulo3, link: link3 },
];

// Funcao que carrega o conteudo correspondente ao dia da semana
function carregarSem() {
  let diaSem = new Date().getDay();

  if (diaSem === 1) {
    butseg();
  } else if (diaSem === 2) {
    butter();
  } else if (diaSem === 3) {
    butqua();
  } else if (diaSem === 4) {
    butqui();
  } else if (diaSem === 5) {
    butsex();
  } else if (diaSem === 6) {
    butsab();
  } else {
    butdom();
  }
}

let taAparecendo = 0;

function menu() {
  let menu = document.getElementById("menu");
  if (menu.style.display == "block") {
    menu.style.display = "none";
    conteudo.style.display = "none";
  } else {
    menu.style.display = "block";
    conteudo.style.display = "none";
  }
}

function getConteudosDoDia(animesDia) {
  return Object.keys(animesDia)
    .filter((key) => key.startsWith("conteudo"))
    .sort((a, b) => Number(a.replace("conteudo", "")) - Number(b.replace("conteudo", "")))
    .map((key) => animesDia[key]);
}

function limparCardsPrincipais() {
  cardsConteudo.forEach((card) => {
    card.banner.style.display = "none";
    card.titulo.style.display = "none";
    card.subtitulo.style.display = "none";
    card.titulo.innerText = "";
    card.subtitulo.innerText = "";
    card.link.removeAttribute("href");
    card.banner.style.backgroundImage = "";
  });
}

function esconderMenuNoMobile() {
  if (window.innerWidth <= 800 && taAparecendo === 0) {
    let menu = document.getElementById("menu");
    menu.style.display = "none";
  }
}

function renderizarDia(animesDia, tituloDia) {
  conteudo.style.display = "block";
  conteudoExtra.style.display = "none";

  titulo.innerText = tituloDia + emojiTemp(num);
  titulo.style.color = "#feffb3";

  limparCardsPrincipais();

  let conteudosDia = getConteudosDoDia(animesDia);
  let limite = Math.min(conteudosDia.length, cardsConteudo.length);

  for (let i = 0; i < limite; i++) {
    let anime = conteudosDia[i];
    let card = cardsConteudo[i];

    card.banner.style.display = "block";
    card.titulo.style.display = "block";
    card.subtitulo.style.display = "block";

    card.banner.style.backgroundImage = "url(" + anime.imagemBanner + ")";
    card.titulo.innerText = anime.tituloBanner;
    card.subtitulo.innerText = anime.subtituloBanner;
    card.link.href = anime.linkBanner;
  }

  esconderMenuNoMobile();
}

function alternarConteudoDia(animesDia, tituloDia) {
  if (taAparecendo == 0) {
    renderizarDia(animesDia, tituloDia);
    taAparecendo += 1;
  } else {
    conteudo.style.display = "none";
    taAparecendo = 0;
  }
}

function butseg() {
  alternarConteudoDia(animesSegunda, "Animes de Segunda-Feira");
}

function butter() {
  alternarConteudoDia(animesTerca, "Animes de Terca-Feira");
}

function butqua() {
  alternarConteudoDia(animesQuarta, "Animes de Quarta-Feira");
}

function butqui() {
  alternarConteudoDia(animesQuinta, "Animes de Quinta-Feira");
}

function butsex() {
  alternarConteudoDia(animesSexta, "Animes de Sexta-Feira");
}

function butsab() {
  alternarConteudoDia(animesSabado, "Animes de Sabado");
}

function butdom() {
  alternarConteudoDia(animesDomingo, "Animes de Domingo");
}
function butextra() {
  let bannerExtra = document.querySelectorAll('[id^="conteudo-extra-"]');
  let tituloAExtra = document.querySelectorAll('[id^="titulo-anime-extra-"]');
  let subtituloExtra = document.querySelectorAll('[id^="subtitulo-extra-"]');
  let linkExtra = document.querySelectorAll('[id^="link-extra-"]');

  //Comando de repetição para mostra todos os conteudos extra sem precisar de muitas linhas.
  let contador = 0;
  for (let i = 0; i < 6; i++) {
    bannerExtra[i].style.display = "none";
    tituloAExtra[i].style.display = "none";
    subtituloExtra[i].style.display = "none";
  }

  if (taAparecendo == 0) {
    conteudo.style.display = "inline";
    conteudoExtra.style.display = "inline";

    let titulo = document.getElementById("titulo");
    titulo.innerText = "Animes de Extra";
    titulo.style.color = "#EB3215";

    banner1.style.display = "none";
    subtitulo1.style.display = "none";
    tituloconteudo1.style.display = "none";

    banner2.style.display = "none";
    subtitulo2.style.display = "none";
    tituloconteudo2.style.display = "none";

    banner3.style.display = "none";
    subtitulo3.style.display = "none";
    tituloconteudo3.style.display = "none";

    for (let i = 0; i < animesExtra.length; i++) {
      if (tituloAExtra.length >= 0) {
        bannerExtra[i].style.display = "block";
        tituloAExtra[i].style.display = "block";
        subtituloExtra[i].style.display = "block";

        const conteudoKey = `conteudo${i + 1}`;

        bannerExtra[i].style.backgroundImage = `url(${animesExtra[i][conteudoKey].imagemBanner})`;
        tituloAExtra[i].textContent = animesExtra[i][conteudoKey].tituloBanner;
        subtituloExtra[i].textContent = animesExtra[i][conteudoKey].subtituloBanner;
        linkExtra[i].href = animesExtra[i][conteudoKey].linkBanner;
      }
    }

    if (window.innerWidth <= 800 && taAparecendo === 0) {
      let menu = document.getElementById("menu");
      menu.style.display = "none";
    }

    taAparecendo += 1;
  } else {
    conteudo.style.display = "none";
    taAparecendo = 0;
  }
}
