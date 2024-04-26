let conteudo = document.getElementById('conteudo');
let titulo = document.getElementById('titulo')

let conteudoExtra = document.getElementById("content-extra")

let banner1 = document.getElementById('conteudo-1');
let tituloconteudo1 = document.getElementById('titulo-conteudo-1')
let subtitulo1 = document.getElementById('subtitulo-1');
let link1 = document.getElementById('link-1');

let banner2 = document.getElementById('conteudo-2');
let tituloconteudo2 = document.getElementById('titulo-conteudo-2')
let subtitulo2 = document.getElementById('subtitulo-2');
let link2 = document.getElementById('link-2');

let banner3 = document.getElementById('conteudo-3');
let tituloconteudo3 = document.getElementById('titulo-conteudo-3')
let subtitulo3 = document.getElementById('subtitulo-3');
let link3 = document.getElementById('link-3');



//funcao que carrega o conteudo correspondente ao dia da semana
function carregarSem(){
    let dataAtual = new Date();

    let diaSem = dataAtual.getDay();

    let diasDaSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];

    console.log(diaSem);

    console.log("Hoje è " + diasDaSemana[diaSem]  + " boa diverssão.");

    if(diasDaSemana[diaSem] == "Segunda"){
        document.addEventListener('DOMContentLoaded', butseg());

    }else if(diasDaSemana[diaSem] == "Terça"){
        document.addEventListener('DOMContentLoaded', butter());


    }else if(diasDaSemana[diaSem] == "Quarta"){
        document.addEventListener('DOMContentLoaded', butqua());

    }else if(diasDaSemana[diaSem] == "Quinta"){
        document.addEventListener('DOMContentLoaded', butqui());

    }else if(diasDaSemana[diaSem] == "Sexta"){
        document.addEventListener('DOMContentLoaded', butsex());

    }else if(diasDaSemana[diaSem] == "Sabado"){
        document.addEventListener('DOMContentLoaded', butsab());

    }else{
        document.addEventListener('DOMContentLoaded', butdom());
        
    }

}

let taAparecendo = 0
function menu(){
    let menu = document.getElementById('menu')
    if(menu.style.display == 'block'){
        menu.style.display = 'none'
        conteudo.style.display = 'none'
    }else{
        menu.style.display = 'block'
        conteudo.style.display = 'none'
    }
}

function butseg(){
    const titulosanimesSegunda = ["Kaii to Otome to Kamikakushi", "Kenka Dokugaku"]

    const subtitulosAnimesSegunda=["Estúdio: Zero-G\Gêneros: Mistério Sobrenatural", "Estúdio: Okuruto Noboru\nGêneros: Ação Comedia"];

    const imagensAnimesSegunda=["https://www.anitube.vip/media/categories/video/ec2000adeba93895d10e9a5fd96df67b.jpg","https://www.anitube.vip/media/categories/video/8ca507dac7aef4edbdc255020efddb2b.jpg"];

    const linkAnimesSegunda = ["https://www.anitube.vip/anime/kaii-to-otome-to-kamikakushi","https://www.anitube.vip/anime/kenka-dokugaku"];

    if(taAparecendo == 0){
        //Area de cabeçalho
        conteudo.style.display = 'inline'
        titulo.innerText = 'Animes de Segunda-Feira'
        titulo.style.color = '#feffb3'

        subtitulo1.style.display = 'block'
        subtitulo2.style.display = 'block'
        subtitulo3.style.display = 'none'
        tituloconteudo1.style.display = 'block'
        tituloconteudo2.style.display = 'block'
        tituloconteudo3.style.display = 'none'

        //Inserindo intens dentro da section conteudo

        banner1.style.backgroundImage ='url(' + imagensAnimesSegunda[0] + ')';
        banner1.style.display = 'block'
        tituloconteudo1.innerText = titulosanimesSegunda[0] 
        subtitulo1.innerText = subtitulosAnimesSegunda[0]
        link1.href = linkAnimesSegunda[0];
        

        banner2.style.backgroundImage = 'url(' + imagensAnimesSegunda[1] + ')';
        banner2.style.display = 'block'
        tituloconteudo2.innerText = titulosanimesSegunda[1] 
        subtitulo2.innerText = subtitulosAnimesSegunda[1]
        link2.href = linkAnimesSegunda[1];
        
        banner3.style.display = 'none'
        // banner3.style.backgroundImage = 'url('+ imagensAnimesSegunda[0] + ')';
        // banner3.style.display = 'block'
        // tituloconteudo3.innerText = titulosanimesSegunda[2] 
        // subtitulo3.innerText = subtitulosAnimesSegunda[2]
        // link3.href = linkAnimesSegunda[2];
        
        



        conteudo.style.display = 'block'
        conteudoExtra.style.display = 'none';
        if(window.innerWidth <= 800 && taAparecendo === 0){
            let menu = document.getElementById('menu')
            menu.style.display = 'none'
        }
        taAparecendo +=1
    }else{
        conteudo.style.display = 'none'
        taAparecendo = 0
    }
    
}

function butter(){
    const titulosanimesTerca = ["One Room", "Seiyuu Radio"]

    const subtitulosAnimesTerca = ["Estúdio: Okuruto Noboru\nGêneros: Comédia Romance Sobrenatural", "Estúdio: Connect\nGêneros: Comédia"];

    const imagensAnimesTerca = ["https://www.anitube.vip/media/categories/video/a654cd650ff64de9b1510aa78d7b01d0.jpg", "https://www.anitube.vip/media/categories/video/6fb95642a66a0eefdab8fe6eb01abb6f.jpg"];
    const linkAnimesTerca = ["https://www.anitube.vip/anime/one-room-hiatari-futsuu-tenshi-tsuki", "https://www.anitube.vip/anime/seiyuu-radio-no-uraomote"]
    if(taAparecendo == 0){
        //Area de cabeçalho
        conteudo.style.display = 'inline'
        titulo.innerText = 'Animes de Terça-Feira'
        titulo.style.color = '#feffb3'
        subtitulo1.style.display = 'block'
        subtitulo2.style.display = 'block'
        tituloconteudo1.style.display='block'
        tituloconteudo2.style.display = 'block' 
    
        //Inserindo intens dentro da section conteudo
        banner1.style.backgroundImage ='url(' + imagensAnimesTerca[0] + ')';
        banner1.style.display = 'block'
        tituloconteudo1.innerText = titulosanimesTerca[0] 
        subtitulo1.innerText = subtitulosAnimesTerca[0]
        link1.href = linkAnimesTerca[0];
    
        banner2.style.backgroundImage = 'url(' + imagensAnimesTerca[1] + ')';
        banner2.style.display = 'block'
        tituloconteudo2.innerText = titulosanimesTerca[1] 
        subtitulo2.innerText = subtitulosAnimesTerca[1]
        link2.href = linkAnimesTerca[1];

        conteudo.style.display = 'block'

        conteudoExtra.style.display = 'none';

        if(window.innerWidth <= 800 && taAparecendo === 0){
            let menu = document.getElementById('menu')
            menu.style.display = 'none'
        }

        banner3.style.display = 'none'
        subtitulo3.innerText = ''
        tituloconteudo3.style.display = 'none'

        taAparecendo +=1
    }else{
        conteudo.style.display = 'none'
        taAparecendo = 0
        
    }
}

function butqua(){
    const titulosanimesQuarta = ["Kami wa Game ni Ueteiru", "The Fable"];

    const subtitulosAnimesQuarta = ["Estúdio: LIDENFILMS\nGêneros: Ecchi Fantasia Suspense", "Estúdio: Tezuka Productions\nGêneros: Comédia"];

    const imagensAnimesQuarta = ["https://www.anitube.vip/media/categories/video/9a3774c23cb2256c78f82cfa0d5f5df3.jpg", "https://www.anitube.vip/media/categories/video/c4f29ac83ccaa1e652e070995366ae5a.jpg"];

    const linkAnimesQuarta = ["https://anitube.vip/anime/kami-wa-game-ni-ueteiru","https://www.anitube.vip/anime/the-fable"];
    if(taAparecendo == 0){
        //Area de cabeçalho
        conteudo.style.display = 'inline'
        titulo.innerText = 'Animes de Quarta-Feira'
        titulo.style.color = '#feffb3'
        subtitulo1.style.display = 'block'
        subtitulo2.style.display = 'block'

        subtitulo3.style.display = 'none'

        tituloconteudo1.style.display = 'block'
        tituloconteudo2.style.display = 'block'

        tituloconteudo3.style.display = 'none'

        //Inserindo intens dentro da section
        banner1.style.backgroundImage ='url(' + imagensAnimesQuarta[0] + ')';
        banner1.style.display = 'block'
        tituloconteudo1.innerText = titulosanimesQuarta[0] 
        subtitulo1.innerText = subtitulosAnimesQuarta[0]
        link1.href = linkAnimesQuarta[0];
    
        banner2.style.backgroundImage = 'url(' + imagensAnimesQuarta[1] + ')';
        banner2.style.display = 'block'
        tituloconteudo2.innerText = titulosanimesQuarta[1] 
        subtitulo2.innerText = subtitulosAnimesQuarta[1]
        link2.href = linkAnimesQuarta[1];

        banner3.style.display = 'none'
        // banner3.style.backgroundImage = 'url(' + imagensAnimesQuarta[0] + ')';
        // banner3.style.display = 'block'
        // tituloconteudo3.innerText = titulosanimesQuarta[2] 
        // subtitulo3.innerText = subtitulosAnimesQuarta[2]
        // link3.href = linkAnimesQuarta[2];

        conteudo.style.display = 'block'
        conteudoExtra.style.display = 'none';

        if(window.innerWidth <= 800 && taAparecendo === 0){
            let menu = document.getElementById('menu')
            menu.style.display = 'none'
        }
        taAparecendo +=1
    }else{
        conteudo.style.display = 'none'
        taAparecendo = 0
    }
}

function butqui(){
    //butqui kkkkkkkk lembra Butiquim kkkkk

    const titulosanimesQuinta = ["Sasayaku you ni Koi wo Utau", "Wind Breaker"];

    const subtitulosAnimesQuinta = ['Estúdio: Cloud Hearts\nGenero: Romance Musical',"Estúdio: CloverWorks\nGêneros: Ação"];

    const imagensAnimesQuinta = ['https://www.intoxianime.com/wp-content/uploads/2023/08/F3sR38mbsAAOeLh.jpg', "https://www.anitube.vip/media/categories/video/ec6ed9842f843b70681e0939032ea443.jpg"];

    const linkAnimesQuinta = ["https://animesonline.nz/animes/sasayaku-you-ni-koi-wo-utau/", "https://www.anitube.vip/anime/wind-breaker"];
    if(taAparecendo == 0){
        //Area de cabeçalho
        conteudo.style.display = 'inline'
        titulo.innerText = 'Animes de Quinta-Feira'
        titulo.style.color = '#feffb3'
        subtitulo1.style.display = 'block'
        subtitulo2.style.display = 'block'

        subtitulo3.style.display = 'none'

        tituloconteudo1.style.display='block'
        tituloconteudo2.style.display = 'block'

        tituloconteudo3.style.display = 'none'


        //Inserindo intens dentro da section conteudo
        banner1.style.backgroundImage ='url(' + imagensAnimesQuinta[0] + ')';
        banner1.style.display = 'block'
        tituloconteudo1.innerText = titulosanimesQuinta[0] 
        subtitulo1.innerText = subtitulosAnimesQuinta[0]
        link1.href = linkAnimesQuinta[0];
    
        banner2.style.backgroundImage = 'url(' + imagensAnimesQuinta[1] + ')';
        banner2.style.display = 'block'
        tituloconteudo2.innerText = titulosanimesQuinta[1]
        subtitulo2.innerText = subtitulosAnimesQuinta[1]
        link2.href = linkAnimesQuinta[1];

        banner3.style.display = 'none'
        // banner3.style.backgroundImage = 'url('+ imagensAnimesQuinta[2] + ')';
        // banner3.style.display = 'block'
        // tituloconteudo3.innerText = titulosanimesQuinta[2] 
        // subtitulo3.innerText = subtitulosAnimesQuinta[2]
        // link3.href = linkAnimesQuinta[2];

        conteudo.style.display = 'block'
        conteudoExtra.style.display = 'none';
        if(window.innerWidth <= 800 && taAparecendo === 0){
            let menu = document.getElementById('menu')
            menu.style.display = 'none'
        }
        taAparecendo +=1
    }else{
        conteudo.style.display = 'none'
        taAparecendo = 0
    }
}

function butsex(){
    const titulosanimesSexta = ["Ookami to Koushinryou", "Kono Subarashii Sekai ni Shukufuku wo! 3"]

    const subtitulosAnimesSexta = ["Estúdio: Passione\nGêneros: Aventura Drama Fantasia Romance", "Estúdio: Drive\nGêneros: Aventura Comédia Fantasia"];

    const imagensAnimesSexta = ["https://www.anitube.vip/media/categories/video/5a79d3daf80921be196351208b0a3f76.jpg", "https://www.anitube.vip/media/categories/video/f2e7b9c8431351fcd494ae13c0b2e148.jpg"];

    const linkAnimesSexta = ["https://www.anitube.vip/anime/ookami-to-koushinryou-merchant-meets-the-wise-wolf", "https://www.anitube.vip/anime/kono-subarashii-sekai-ni-shukufuku-wo-3"];

    if(taAparecendo == 0){
        //Area de cabeçalho
        conteudo.style.display = 'inline'
        titulo.innerText = 'Animes de Sexta-Feira'
        titulo.style.color = '#feffb3'
        subtitulo1.style.display = 'block'
        subtitulo2.style.display = 'block'
        tituloconteudo1.style.display='block'
        tituloconteudo2.style.display = 'block' 

        //Inserindo intens dentro da section conteudo

        banner1.style.backgroundImage ='url(' + imagensAnimesSexta[1] + ')';
        banner1.style.display = 'block'
        tituloconteudo1.innerText = titulosanimesSexta[1] 
        subtitulo1.innerText = subtitulosAnimesSexta[1]
        link1.href = linkAnimesSexta[1];
    
        banner2.style.backgroundImage = 'url(' + imagensAnimesSexta[0] + ')';
        banner2.style.display = 'block'
        tituloconteudo2.innerText = titulosanimesSexta[0]
        subtitulo2.innerText = subtitulosAnimesSexta[0]
        link2.href = linkAnimesSexta[0];

        conteudo.style.display = 'block'

        banner3.style.display = 'none'
        subtitulo3.innerText = ''
        tituloconteudo3.style.display= 'none'

        conteudoExtra.style.display = 'none';

        if(window.innerWidth <= 800 && taAparecendo === 0){
            let menu = document.getElementById('menu')
            menu.style.display = 'none'
        }
        taAparecendo +=1
    }else{//Logica para esconder o conteudo quando clicar de novo 
        conteudo.style.display = 'none'
        taAparecendo = 0
    }
}
function butsab(){
    const titulosanimesSabado = ["Kaiju No. 8","Kimetsu no Yaiba Hashira Training Arc", "My Hero Academia Season 7"]

    const subtitulosAnimesSabado = ["Estúdio: Production I.G\nGêneros: Ação Sci-Fi","Estúdio: Ufotable\nGêneros: Ação Fantasia","Estúdio: Bones\nGêneros: Ação Shonen" ];

    const imagensAnimesSabado = ["https://m.media-amazon.com/images/I/81IgJ1cGaWS._AC_UF1000,1000_QL80_.jpg","https://www.anitube.vip/media/categories/video/c627366905207421de9d84f3d524cca4.jpg","https://www.anitube.vip/media/categories/video/9115c0b3bac60336151b483fc4594afb.jpg"];

    const linkAnimesSabado = ["https://www.anitube.vip/anime/kaijuu-8-gou", "https://www.anitube.vip/anime/kimetsu-no-yaiba-hashira-geiko-hen", "https://www.anitube.vip/anime/boku-no-hero-academia-7th-season"];

    if(taAparecendo == 0){
        //Area de cabeçalho

        conteudo.style.display = 'inline'
        titulo.innerText = 'Animes de Sabado'
        titulo.style.color = '#feffb3'
        subtitulo1.style.display = 'block'
        subtitulo2.style.display = 'block'
        subtitulo3.style.display = "block"
        tituloconteudo1.style.display='block'
        tituloconteudo2.style.display = 'block'
        tituloconteudo3.style.display = 'block'
        //Inserindo intens dentro da section conteudo

        banner1.style.backgroundImage ='url(' + imagensAnimesSabado[0] + ')';
        banner1.style.display = 'block'
        tituloconteudo1.innerText = titulosanimesSabado[0] 
        subtitulo1.innerText = subtitulosAnimesSabado[0]
        link1.href = linkAnimesSabado[0];
    
        banner2.style.backgroundImage = 'url(' + imagensAnimesSabado[1] + ')';
        banner2.style.display = 'block'
        tituloconteudo2.innerText = titulosanimesSabado[1] 
        subtitulo2.innerText = subtitulosAnimesSabado[1]
        link2.href = linkAnimesSabado[1];

        conteudo.style.display = 'block'

        banner3.style.display = 'none'
        banner3.style.backgroundImage = 'url('+ imagensAnimesSabado[2] + ')';
        banner3.style.display = 'block'
        tituloconteudo3.innerText = titulosanimesSabado[2] 
        subtitulo3.innerText = subtitulosAnimesSabado[2]
        link3.href = linkAnimesSabado[2];

        
        conteudoExtra.style.display = 'none';

        if(window.innerWidth <= 800 && taAparecendo === 0){
            let menu = document.getElementById('menu')
            menu.style.display = 'none'
        }
        taAparecendo +=1
    }else{//Logica para esconder o conteudo quando clicar de novo 
        conteudo.style.display = 'none'
        taAparecendo = 0
    }

}
function butdom(){
    const titulosanimesDomingo = ["One Piece🏴‍☠️"]
    const subtitulosAnimesDomingo = ["Autor: Eiichiro Oda\nDireção: Konosuke Uda\nEstúdio: Toei Animation\nStatus: Infinito\nGêneros: Ação Aventura Comédia Drama Fantasia Shounen Superpoder"];
    const imagensAnimesDomingo = ["https://pbs.twimg.com/media/F_0mcEtWEAAVPCm?format=jpg&name=900x900"];
    const linkAnimesDomingo = ["https://www.anitube.vip/anime/398a5cebfadb2606fbf802b42aad57755b4eae55"];
    if(taAparecendo == 0){
        //Area de cabeçalho
        conteudo.style.display = 'inline'
        titulo.innerText = 'Animes de Domingo'
        titulo.style.color = '#feffb3'
        subtitulo1.style.display = 'block'
        tituloconteudo1.style.display='block'
        
        //Inserindo intens dentro da section conteudo
        banner1.style.backgroundImage ='url(' + imagensAnimesDomingo[0] + ')';
        banner1.style.display = 'block'
        tituloconteudo1.innerText = titulosanimesDomingo[0] 
        subtitulo1.innerText = subtitulosAnimesDomingo[0]
        link1.href = linkAnimesDomingo[0];
        
        banner2.style.display = 'none'
        subtitulo2.innerText = ''
        tituloconteudo2.style.display = 'none' 
        
        banner3.style.display = 'none'
        subtitulo3.innerText = ''
        tituloconteudo3.style.display = 'none' 
        
        conteudo.style.display = 'block'
        conteudoExtra.style.display = 'none';
        
        if(window.innerWidth <= 800 && taAparecendo === 0){
            let menu = document.getElementById('menu')
            menu.style.display = 'none'
        }
        taAparecendo +=1
    }else{//Logica para esconder o conteudo quando clicar de novo 
        conteudo.style.display = 'none'
        taAparecendo = 0
    }

}
function butextra(){

    let bannerExtra = document.querySelectorAll('[id^="conteudo-extra-"]');
    let tituloAExtra = document.querySelectorAll('[id^="titulo-anime-extra-"]');
    let subtituloExtra = document.querySelectorAll('[id^="subtitulo-extra-"]');
    let linkExtra = document.querySelectorAll('[id^="link-extra-"]');
    
    
    const imagensAnimesExtra=["https://image.tmdb.org/t/p/w342/yWLGhF6Rvv7oWC9ozzO0rvfQwYt.jpg", "https://i.ytimg.com/vi/evwOpOFXNcI/maxresdefault.jpg"];
    
    const tituloanimesExtra = ["(Des)encanto", "Hanma Baki vs. Kengan Ashura"]

    const subtitulosAnimesExtra=["Gênero: Animação Aventura Comédia", "FILME"];
    
    const linkAnimesExtra = ["https://comandotorrents.to/desencanto-1a-temporada-completa-torrent-2018-dual-audio-web-dl-720p-download", "#"];
    //Comando de repetição para mostra todos os conteudos extra sem precisar de muitas linhas.
    let contador = 0
    for(let i = 0; i < 6; i++){
        bannerExtra[i].style.display = 'none';
        tituloAExtra[i].style.display = 'none'
        subtituloExtra[i].style.display = "none"; 
    }

    if(taAparecendo == 0){

        conteudo.style.display = 'inline'
        conteudoExtra.style.display = 'inline';
        
        let titulo = document.getElementById('titulo')
        titulo.innerText = 'Animes de Extra'
        titulo.style.color = "#EB3215"

        banner1.style.display = 'none'
        subtitulo1.style.display = "none"
        tituloconteudo1.style.display='none'
        
        banner2.style.display = 'none'
        subtitulo2.style.display = "none"
        tituloconteudo2.style.display = 'none' 
        
        banner3.style.display = 'none'
        subtitulo3.style.display = 'none'
        tituloconteudo3.style.display = 'none'

        
        for (let i = 0; i < imagensAnimesExtra.length; i++){
            if(tituloAExtra.length >= 0){
                bannerExtra[i].style.display = 'block';
                tituloAExtra[i].style.display = 'block'
                subtituloExtra[i].style.display = "block"; 

                bannerExtra[i].style.backgroundImage ='url(' + imagensAnimesExtra[i] + ')';
                tituloAExtra[i].textContent = tituloanimesExtra[i];
                
                subtituloExtra[i].textContent = subtitulosAnimesExtra[i]; 
                linkExtra[i].href = linkAnimesExtra[i];
                console.log(linkAnimesExtra[i]);
            }
        }

        if(window.innerWidth <= 800 && taAparecendo === 0){
            let menu = document.getElementById('menu')
            menu.style.display = 'none'
        }

        taAparecendo +=1
    }else{
        conteudo.style.display = 'none'
        taAparecendo = 0;
    }
}