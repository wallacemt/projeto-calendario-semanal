//Pegando as estacoes do ano
function getSeason() {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();

    const seasons = [
        { name: "inverno", start: 0, end: 2 },  
        { name: "primavera", start: 2, end: 5 },   
        { name: "verao", start: 5, end: 8 },   
        { name: "outono", start: 8, end: 11 }   
    ];

    for (let season of seasons) {
        if (month >= season.start && month < season.end) {
            return season.name;
        }
    }
    return 'padrao';
}


let num
function emojiTemp(emoji){
    let emojiTemp = ["❄️","🌸", "☀️","🍁"]
    
    if (emoji >= 0 && emoji < emojiTemp.length) {
        return emojiTemp[emoji];
    } else {
        // Caso o índice seja inválido, retorna um valor padrão (ou vazio, dependendo do caso)
        return "";
    }
}


function runSeason(season){
    let conteudoBack = document.querySelector("#conteudo")
    let conteudoH1 = document.querySelector("section#conteudo  h1")
    let conteudoH2 = document.querySelectorAll("section#conteudo  h2")
    let conteudoP = document.querySelectorAll('section#conteudo  p');

    const seasons = {
        defaultSeason:{
            backgroundImage: 'src/img/backDef.png',
            backgroundConteudo: 'linear-gradient(to bottom, #6210afcb,#4b12f7,#4207f5, #16074a00)',
            backgroundh1: '#16074a7c',
            backgroundh2: 'linear-gradient(to top, #4000ff, #16074adc)',
            backgroundp: 'linear-gradient(to top, #4b12f7, #16074a0a )'
        },
        winterSeason:{
            backgroundImage: 'src/img/backEstacoes/winter.png',
            backgroundConteudo: 'linear-gradient(to bottom, #024873, #03658C, #88A5BF, rgba(22, 7, 74, 0))',
            backgroundh1: '#73482F',
            backgroundh2: 'linear-gradient(180deg, rgba(2,72,115,1) 0%, rgba(3,101,140,1) 57%, rgba(2,72,115,0.8911939775910365) 92%)',
            backgroundp: 'linear-gradient(180deg, rgba(2,72,115,0.7595413165266106) 0%, rgba(3,101,140,0.9500175070028011) 57%, rgba(2,72,115,1) 92%)'
        },
        springSeason:{
            backgroundImage:"src/img/backEstacoes/spring.jpg",
            backgroundConteudo: 'linear-gradient(rgb(191, 46, 33) 0%, rgb(242 174 199 / 38%) 75%, rgb(242 206 216 / 0%) 100%), rgb(74 7 7 / 0%)',
            backgroundh1: '#95261d',
            backgroundh2: 'linear-gradient(180deg, rgba(191,46,33,1) 37%, rgba(187,112,105,0.8407738095238095) 89%)',
            backgroundp: 'linear-gradient(180deg, rgba(242,109,120,0.9248074229691877) 23%, rgba(191,46,33,1) 67%)'
        },
        summerSeason:{
            backgroundImage:"src/img/backEstacoes/summer.jpg",
            backgroundConteudo: 'linear-gradient(#a64812 0%, #f28f16fc 56%, #f2a51600 100%)',
            backgroundh1: '#95261d',
            backgroundh2: 'linear-gradient(180deg, rgba(166,72,18,1) 0%, rgba(242,165,22,0.9023984593837535) 100%)',
            backgroundp: 'linear-gradient(180deg, rgba(242,165,22,0.9500175070028011) 0%, rgba(166,72,18,1) 100%)'
        },
        autumnSeason:{
            backgroundImage:"src/img/backEstacoes/autumn.jpg",
            backgroundConteudo: 'linear-gradient(180deg, rgba(166,72,18,1) 0%, rgba(242,165,22,0.9500175070028011) 71%, rgba(209,124,20,0.3841911764705882) 95%, rgba(209,124,20,0.3841911764705882) 100%)',
            backgroundh1: '#95261d',
            backgroundh2: 'linear-gradient(180deg, rgba(166,72,18,1) 0%, rgba(242,165,22,0.9500175070028011) 62%, rgba(209,124,20,0.17130602240896353) 100%)',
            backgroundp: 'linear-gradient(180deg, rgba(182,80,22,0.865983893557423) 0%, rgba(213,146,22,0.9500175070028011) 62%, rgba(209,124,20,0.227328431372549) 100%)'
        }
    }

    if(season == 'padrao'){
        document.body.style.background = "url(" + seasons.defaultSeason.backgroundImage + ") center bottom";
        conteudoBack.style.background = seasons.defaultSeason.backgroundConteudo;
        conteudoH1.style.background = seasons.defaultSeason.backgroundh1;
        conteudoH2.forEach(titulo => {
            titulo.style.background = seasons.defaultSeason.backgroundh2
        })
        conteudoP.forEach(paragrafo => {
            paragrafo.style.background = seasons.defaultSeason.backgroundp;
        });

    }else if(season == 'inverno'){
        document.body.style.background = "url(" + seasons.winterSeason.backgroundImage + ") center center";
        num = 0

        conteudoBack.style.background = "url(src/img/efects/neve.png) center center," + seasons.winterSeason.backgroundConteudo;

        conteudoH1.style.background = seasons.winterSeason.backgroundh1
        
        conteudoH2.forEach(titulo => {
            titulo.style.background = seasons.winterSeason.backgroundh2
        })
        conteudoP.forEach(paragrafo => {
            paragrafo.style.background = seasons.winterSeason.backgroundp;
        });
    }else if(season == 'primavera'){
        document.body.style.background = 'url(' + seasons.springSeason.backgroundImage + ') center center';
        
        num = 1
    
        conteudoBack.style.background = "url(src/img/efects/cherry.png) center center," + seasons.springSeason.backgroundConteudo;
        conteudoH1.style.background = seasons.springSeason.backgroundh1
        
        conteudoH2.forEach(titulo => {
            titulo.style.background = seasons.springSeason.backgroundh2
        })
        conteudoP.forEach(paragrafo => {
            paragrafo.style.background = seasons.springSeason.backgroundp;
        });
    }else if(season == 'verao'){
        document.body.style.background = 'url(' + seasons.summerSeason.backgroundImage + ') center top';
        num = 2
        conteudoH1.setHTMLUnsafe
        conteudoBack.style.background = "url(src/img/efects/gira.png) left center," + seasons.summerSeason.backgroundConteudo;
        
        conteudoH1.style.background = seasons.summerSeason.backgroundh1
        conteudoH2.forEach(titulo => {
            titulo.style.background = seasons.summerSeason.backgroundh2
        })
        conteudoP.forEach(paragrafo => {
            paragrafo.style.background = seasons.summerSeason.backgroundp;
        });
    }else if(season == 'outono'){
        document.body.style.background = 'url(' + seasons.autumnSeason.backgroundImage + ') center center';
        num = 3
        conteudoBack.style.background = "url(src/img/efects/autum.png) center center," + seasons.autumnSeason.backgroundConteudo;
        

        conteudoH1.style.background = seasons.autumnSeason.backgroundh1
        
        conteudoH2.forEach(titulo => {
            titulo.style.background = seasons.autumnSeason.backgroundh2
        })
        conteudoP.forEach(paragrafo => {
            paragrafo.style.background = seasons.autumnSeason.backgroundp;
        })
    }
}

document.addEventListener("DOMContentLoaded", runSeason(getSeason()))
console.log(getSeason())


//mudar o tema clicando no numero 1, 2, 3, 4 ou 5
document.addEventListener('keydown', function(event) {
    switch (event.key) {
        case '1':
            runSeason('padrao')
            break;
        case '2':
            runSeason('inverno')
            break;
        case '3':
            runSeason('primavera')
            break
        case '4':
            runSeason('verao')
            break
        case '5':
            runSeason("outono")
            break
        default:
            break;
    }
}); 


//Funcao que dar pause ou play na radio de fundo
function playRadio(event){
    if(event.code == 'Space'){
        event.preventDefault();
        let audio = document.getElementById('radio');
        if(audio.paused){
            audio.play();
        }else{
            audio.pause();
        }
    }
}

document.addEventListener('keydown', playRadio)
