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

//funcao que carrega o conteudo correspondente ao dia da semana
function carregarSem() {
  let dataAtual = new Date();

  let diaSem = dataAtual.getDay();

  let diasDaSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sabado"];

  console.log(diaSem);

  console.log("Hoje è " + diasDaSemana[diaSem] + " boa diverssão.");

  if (diasDaSemana[diaSem] == "Segunda") {
    document.addEventListener("DOMContentLoaded", butseg());
  } else if (diasDaSemana[diaSem] == "Terça") {
    document.addEventListener("DOMContentLoaded", butter());
  } else if (diasDaSemana[diaSem] == "Quarta") {
    document.addEventListener("DOMContentLoaded", butqua());
  } else if (diasDaSemana[diaSem] == "Quinta") {
    document.addEventListener("DOMContentLoaded", butqui());
  } else if (diasDaSemana[diaSem] == "Sexta") {
    document.addEventListener("DOMContentLoaded", butsex());
  } else if (diasDaSemana[diaSem] == "Sabado") {
    document.addEventListener("DOMContentLoaded", butsab());
  } else {
    document.addEventListener("DOMContentLoaded", butdom());
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

function butseg() {
  if (taAparecendo == 0) {
    //Area de cabeçalho
    conteudo.style.display = "block";
    titulo.innerText = "Animes de Segunda-Feira" + emojiTemp(num);
    titulo.style.color = "#feffb3";
    subtitulo1.style.display = "block";
    subtitulo2.style.display = "block";
    tituloconteudo1.style.display = "block";
    tituloconteudo2.style.display = "block";

    //Inserindo intens dentro da section conteudo

    banner1.style.display = "block";
    banner1.style.backgroundImage = "url(" + animesSegunda.conteudo1.imagemBanner + ")";
    tituloconteudo1.innerText = animesSegunda.conteudo1.tituloBanner;
    subtitulo1.innerText = animesSegunda.conteudo1.subtituloBanner;
    link1.href = animesSegunda.conteudo1.linkBanner;

    banner2.style.backgroundImage = "url(" + animesSegunda.conteudo2.imagemBanner + ")";
    banner2.style.display = "block";
    tituloconteudo2.innerText = animesSegunda.conteudo2.tituloBanner;
    subtitulo2.innerText = animesSegunda.conteudo2.subtituloBanner;
    link2.href = animesSegunda.conteudo2.linkBanner;

    banner3.style.display = "none";
    subtitulo3.innerText = "";
    tituloconteudo3.style.display = "none";

    conteudo.style.display = "block";
    conteudoExtra.style.display = "none";
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

function butter() {
  if (taAparecendo == 0) {
    //Area de cabeçalho
    conteudo.style.display = "block";
    titulo.innerText = "Animes de Terça-Feira" + emojiTemp(num);
    titulo.style.color = "#feffb3";
    subtitulo1.style.display = "block";
    subtitulo2.style.display = "block";
    tituloconteudo1.style.display = "block";
    tituloconteudo2.style.display = "block";

    //Inserindo intens dentro da section conteudo
    banner1.style.display = "block";
    banner1.style.backgroundImage = "url(" + animesTerca.conteudo1.imagemBanner + ")";
    tituloconteudo1.innerText = animesTerca.conteudo1.tituloBanner;
    subtitulo1.innerText = animesTerca.conteudo1.subtituloBanner;
    link1.href = animesTerca.conteudo1.linkBanner;

    banner2.style.backgroundImage = "url(" + animesTerca.conteudo2.imagemBanner + ")";
    banner2.style.display = "block";
    tituloconteudo2.innerText = animesTerca.conteudo2.tituloBanner;
    subtitulo2.innerText = animesTerca.conteudo2.subtituloBanner;
    link2.href = animesTerca.conteudo2.linkBanner;

    conteudo.style.display = "block";

    conteudoExtra.style.display = "none";

    if (window.innerWidth <= 800 && taAparecendo === 0) {
      let menu = document.getElementById("menu");
      menu.style.display = "none";
    }

    banner3.style.display = "none";
    subtitulo3.innerText = "";
    tituloconteudo3.style.display = "none";

    taAparecendo += 1;
  } else {
    conteudo.style.display = "none";
    taAparecendo = 0;
  }
}

function butqua() {
  if (taAparecendo == 0) {
    //Area de cabeçalho
    conteudo.style.display = "block";
    titulo.innerText = "Animes de Quarta-Feira" + emojiTemp(num);
    titulo.style.color = "#feffb3";
    subtitulo1.style.display = "block";
    subtitulo2.style.display = "block";

    subtitulo3.style.display = "none";

    tituloconteudo1.style.display = "block";
    tituloconteudo2.style.display = "block";

    tituloconteudo3.style.display = "none";

    //Inserindo intens dentro da section
    banner1.style.display = "block";
    banner1.style.backgroundImage = "url(" + animesQuarta.conteudo1.imagemBanner + ")";
    tituloconteudo1.innerText = animesQuarta.conteudo1.tituloBanner;
    subtitulo1.innerText = animesQuarta.conteudo1.subtituloBanner;
    link1.href = animesQuarta.conteudo1.linkBanner;

    banner2.style.backgroundImage = "url(" + animesQuarta.conteudo2.imagemBanner + ")";
    banner2.style.display = "block";
    tituloconteudo2.innerText = animesQuarta.conteudo2.tituloBanner;
    subtitulo2.innerText = animesQuarta.conteudo2.subtituloBanner;
    link2.href = animesQuarta.conteudo2.linkBanner;

    banner3.style.display = "none";
    // banner3.style.backgroundImage = 'url(' + imagensAnimesQuarta[0] + ')';
    // banner3.style.display = 'block'
    // tituloconteudo3.innerText = titulosanimesQuarta[2]
    // subtitulo3.innerText = subtitulosAnimesQuarta[2]
    // link3.href = linkAnimesQuarta[2];

    conteudo.style.display = "block";
    conteudoExtra.style.display = "none";

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

function butqui() {
  //butqui kkkkkkkk lembra Butiquim kkkkk
  if (taAparecendo == 0) {
    //Area de cabeçalho
    conteudo.style.display = "inline";

    titulo.innerHTML = "Animes de Quinta-Feira" + emojiTemp(num);
    titulo.style.color = "#feffb3";
    subtitulo1.style.display = "block";
    subtitulo2.style.display = "block";

    subtitulo3.style.display = "none";

    tituloconteudo1.style.display = "block";
    tituloconteudo2.style.display = "block";

    tituloconteudo3.style.display = "none";

    //Inserindo intens dentro da section conteudo
    banner1.style.display = "block";
    banner1.style.backgroundImage = "url(" + animesQuinta.conteudo1.imagemBanner + ")";
    tituloconteudo1.innerText = animesQuinta.conteudo1.tituloBanner;
    subtitulo1.innerText = animesQuinta.conteudo1.subtituloBanner;
    link1.href = animesQuinta.conteudo1.linkBanner;

    banner2.style.backgroundImage = "url(" + animesQuinta.conteudo2.imagemBanner + ")";
    banner2.style.display = "block";
    tituloconteudo2.innerText = animesQuinta.conteudo2.tituloBanner;
    subtitulo2.innerText = animesQuinta.conteudo2.subtituloBanner;
    link2.href = animesQuinta.conteudo2.linkBanner;

    banner3.style.display = "none";
    // banner3.style.backgroundImage = 'url('+ imagensAnimesQuinta[2] + ')';
    // banner3.style.display = 'block'
    // tituloconteudo3.innerText = titulosanimesQuinta[2]
    // subtitulo3.innerText = subtitulosAnimesQuinta[2]
    // link3.href = linkAnimesQuinta[2];

    conteudo.style.display = "block";
    conteudoExtra.style.display = "none";
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

function butsex() {
  if (taAparecendo == 0) {
    //Area de cabeçalho
    conteudo.style.display = "inline";
    titulo.innerText = "Animes de Sexta-Feira" + emojiTemp(num);
    titulo.style.color = "#feffb3";
    subtitulo1.style.display = "block";
    subtitulo2.style.display = "block";
    tituloconteudo1.style.display = "block";
    tituloconteudo2.style.display = "block";

    //Inserindo intens dentro da section conteudo

    banner1.style.display = "block";
    banner1.style.backgroundImage = "url(" + animesSexta.conteudo1.imagemBanner + ")";
    tituloconteudo1.innerText = animesSexta.conteudo1.tituloBanner;
    subtitulo1.innerText = animesSexta.conteudo1.subtituloBanner;
    link1.href = animesSexta.conteudo1.linkBanner;

    banner2.style.backgroundImage = "url(" + animesSexta.conteudo2.imagemBanner + ")";
    banner2.style.display = "block";
    tituloconteudo2.innerText = animesSexta.conteudo2.tituloBanner;
    subtitulo2.innerText = animesSexta.conteudo2.subtituloBanner;
    link2.href = animesSexta.conteudo2.linkBanner;

    conteudo.style.display = "block";

    banner3.style.display = "none";
    subtitulo3.innerText = "";
    tituloconteudo3.style.display = "none";

    conteudoExtra.style.display = "none";

    if (window.innerWidth <= 800 && taAparecendo === 0) {
      let menu = document.getElementById("menu");
      menu.style.display = "none";
    }
    taAparecendo += 1;
  } else {
    //Logica para esconder o conteudo quando clicar de novo
    conteudo.style.display = "none";
    taAparecendo = 0;
  }
}
function butsab() {
  if (taAparecendo == 0) {
    //Area de cabeçalho

    conteudo.style.display = "inline";
    titulo.innerText = "Animes de Sabado" + emojiTemp(num);
    titulo.style.color = "#feffb3";
    subtitulo1.style.display = "block";
    subtitulo2.style.display = "block";
    tituloconteudo1.style.display = "block";
    tituloconteudo2.style.display = "block";
    //Inserindo intens dentro da section conteudo

    banner1.style.display = "block";
    banner1.style.backgroundImage = "url(" + animesSabado.conteudo1.imagemBanner + ")";
    tituloconteudo1.innerText = animesSabado.conteudo1.tituloBanner;
    subtitulo1.innerText = animesSabado.conteudo1.subtituloBanner;
    link1.href = animesSabado.conteudo1.linkBanner;

    banner2.style.backgroundImage = "url(" + animesSabado.conteudo2.imagemBanner + ")";
    banner2.style.display = "block";
    tituloconteudo2.innerText = animesSabado.conteudo2.tituloBanner;
    subtitulo2.innerText = animesSabado.conteudo2.subtituloBanner;
    link2.href = animesSabado.conteudo2.linkBanner;

    banner3.style.display = "none";
    subtitulo3.innerText = "";
    tituloconteudo3.style.display = "none";

    conteudo.style.display = "block";
    conteudoExtra.style.display = "none";

    if (window.innerWidth <= 800 && taAparecendo === 0) {
      let menu = document.getElementById("menu");
      menu.style.display = "none";
    }
    taAparecendo += 1;
  } else {
    //Logica para esconder o conteudo quando clicar de novo
    conteudo.style.display = "none";
    taAparecendo = 0;
  }
}
function butdom() {
  if (taAparecendo == 0) {
    //Area de cabeçalho
    conteudo.style.display = "inline";
    titulo.innerText = "Animes de Domingo" + emojiTemp(num);
    titulo.style.color = "#feffb3";
    subtitulo1.style.display = "block";
    subtitulo2.style.display = "block";
    tituloconteudo1.style.display = "block";
    tituloconteudo2.style.display = "block";
    //Inserindo intens dentro da section conteudo
    banner1.style.display = "block";
    banner1.style.backgroundImage = "url(" + animesDomingo.conteudo1.imagemBanner + ")";
    tituloconteudo1.innerText = animesDomingo.conteudo1.tituloBanner;
    subtitulo1.innerText = animesDomingo.conteudo1.subtituloBanner;
    link1.href = animesDomingo.conteudo1.linkBanner;

    banner2.style.backgroundImage = "url(" + animesDomingo.conteudo2.imagemBanner + ")";
    banner2.style.display = "block";
    tituloconteudo2.innerText = animesDomingo.conteudo2.tituloBanner;
    subtitulo2.innerText = animesDomingo.conteudo2.subtituloBanner;
    link2.href = animesDomingo.conteudo2.linkBanner;

    banner3.style.display = "none";
    subtitulo3.innerText = "";
    tituloconteudo3.style.display = "none";

    // banner2.style.display = 'none'
    // subtitulo2.innerText = ''
    // tituloconteudo2.style.display = 'none'

    conteudo.style.display = "block";
    conteudoExtra.style.display = "none";

    if (window.innerWidth <= 800 && taAparecendo === 0) {
      let menu = document.getElementById("menu");
      menu.style.display = "none";
    }
    taAparecendo += 1;
  } else {
    //Logica para esconder o conteudo quando clicar de novo
    conteudo.style.display = "none";
    taAparecendo = 0;
  }
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
