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
    const titulosanimesSegunda = ["Kekkon Yubiwa", "Bucchigiri?", "Undead Unluck"]
    const subtitulosAnimesSegunda=[
    "Temporada: Inverno 2024\n Estúdio: Staple Entertainment\n Status: Em Progresso\n Gêneros: Ação Ecchi Fantasia Romance", "Temporada: Inverno 2024\nEstúdio: MAPPA\nGêneros: Ação", " Temporada: Outono 2023\nAutor: Yoshifumi Tozuka\nDireção: Yuuki Yase\n Estúdio: David Production\n Gêneros: Ação, Comédia, Shounen, Sobrenatural, Superpoder"];

    const imagensAnimesSegunda=["https://www.anitube.vip/media/categories/video/32cc64407f53842cdef8a3f482a22410.jpg", "https://cdn.anicdn.net/media/categories/video/8693722045353926369c8e7ab8a5ff3e.jpg", "https://cdn.anicdn.net/media/categories/video/95769d5e5d2d94eb3d1f1381915f876d731.jpg"];

    const linkAnimesSegunda = ["https://www.anitube.vip/anime/kekkon-yubiwa-monogatari","https://www.anitube.vip/download/anime/bucchigiri", "https://www.anitube.vip/download/anime/undead-unluck"];

    if(taAparecendo == 0){
        //Area de cabeçalho
        conteudo.style.display = 'inline'
        titulo.innerText = 'Animes de Segunda-Feira'
        titulo.style.color = '#feffb3'

        subtitulo1.style.display = 'block'
        subtitulo2.style.display = 'block'
        subtitulo3.style.display = 'block'
        tituloconteudo1.style.display = 'block'
        tituloconteudo2.style.display = 'block'
        tituloconteudo3.style.display = 'block'

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
        
        banner3.style.backgroundImage = 'url('+ imagensAnimesSegunda[2] + ')';
        banner3.style.display = 'block'
        tituloconteudo3.innerText = titulosanimesSegunda[2] 
        subtitulo3.innerText = subtitulosAnimesSegunda[2]
        link3.href = linkAnimesSegunda[2];

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
    const titulosanimesTerca = ["Boku no Kokoro no Yabai Yatsu S2", "Urusei Yatsura S2"]
    const subtitulosAnimesTerca = ["Temporada: Inverno 2024\nEstúdio: Shin-Ei Animation\nGêneros: Comédia Romance", "Estúdio: David Production\nStatus: Em Progresso\nGêneros: Comédia Romance Sci-Fi"];
    const imagensAnimesTerca = ["https://www.anitube.vip/media/categories/video/ffdf04427cfea3528928482d8c9ee6d4.jpg", "https://www.anitube.vip/media/categories/video/afd0deef11d5a3a4890d1f0cb6902092.jpg"];
    const linkAnimesTerca = ["https://www.anitube.vip/anime/boku-no-kokoro-no-yabai-yatsu-season-2", "https://www.anitube.vip/anime/urusei-yatsura-2022-2nd-season"]
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
    const titulosanimesQuarta = ["Mato Seihei no Slave", "Shangri-La Frontier", "Shaman King: Flowers"];

    const subtitulosAnimesQuarta = ["Estúdio: Seven Arcs\nStatus: Em Progresso\nGêneros: Ação Ecchi Fantasia", "Autor: Ryousuke Fuji e Katarina\nDireção: Toshiyuki Kubooka\nEstúdio: C2C\nGêneros: Ação Aventura Fantasia Jogos Shounen", "Estúdio: Bridge\nGêneros: Ação, Aventura, Sobrenatural"];

    const imagensAnimesQuarta = ["https://www.anitube.vip/media/categories/video/5d9539763ee2a79091013e3792bbf267.jpg", "https://www.anitube.vip/media/categories/video/e5bb61f161dadfca4ebe6d6016a94462940.jpg", "https://cdn.anicdn.net/media/categories/video/afa0c448ffaca160a7d4ee03b04f1997.jpg"];

    const linkAnimesQuarta = ['https://www.anitube.vip/anime/mato-seihei-no-slave', 'https://www.anitube.vip/anime/shangri-la-frontier-kusoge-hunter-kamige-ni-idoman-to-su',"https://www.anitube.vip/anime/shaman-king-flowers"];
    if(taAparecendo == 0){
        //Area de cabeçalho
        conteudo.style.display = 'inline'
        titulo.innerText = 'Animes de Quarta-Feira'
        titulo.style.color = '#feffb3'
        subtitulo1.style.display = 'block'
        subtitulo2.style.display = 'block'
        subtitulo3.style.display = 'block'
        tituloconteudo1.style.display = 'block'
        tituloconteudo2.style.display = 'block'
        tituloconteudo3.style.display = 'block'

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

        banner3.style.backgroundImage = 'url(' + imagensAnimesQuarta[2] + ')';
        banner3.style.display = 'block'
        tituloconteudo3.innerText = titulosanimesQuarta[2] 
        subtitulo3.innerText = subtitulosAnimesQuarta[2]
        link3.href = linkAnimesQuarta[2];

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

    const titulosanimesQuinta = ["Akuyaku Reijou Level 99", "Majo to Yajuu", "Metallic Rouge"]
    const subtitulosAnimesQuinta = ['Estúdio: Jumondo\nGêneros: Fantasia', 'Estúdio: Yokohama Animation Lab\nGêneros: Ação Fantasia', 'Estúdio: Bones\nGêneros: Ação Sci-Fi'];
    const imagensAnimesQuinta = ['https://www.anitube.vip/media/categories/video/984d09774965045ada1662baec5abba4.jpg', 'https://www.anitube.vip/media/categories/video/dcc0d0b608ff9782e5495b222be50e00.jpg', 'https://www.anitube.vip/media/categories/video/97d5400491dfd0cdbbbc843db3e7e53b.jpg'];
    const linkAnimesQuinta = ['https://www.anitube.vip/anime/akuyaku-reijou-level-99-watashi-wa-ura-boss-desu-ga-maou-dewa-arimasen', 'https://www.anitube.vip/anime/majo-to-yajuu', 'https://www.anitube.vip/anime/metallic-rouge'];
    if(taAparecendo == 0){
        //Area de cabeçalho
        conteudo.style.display = 'inline'
        titulo.innerText = 'Animes de Quinta-Feira'
        titulo.style.color = '#feffb3'
        subtitulo1.style.display = 'block'
        subtitulo2.style.display = 'block'
        subtitulo3.style.display = 'block'
        tituloconteudo1.style.display='block'
        tituloconteudo2.style.display = 'block' 
        tituloconteudo3.style.display = 'block'


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

        banner3.style.backgroundImage = 'url('+ imagensAnimesQuinta[2] + ')';
        banner3.style.display = 'block'
        tituloconteudo3.innerText = titulosanimesQuinta[2] 
        subtitulo3.innerText = subtitulosAnimesQuinta[2]
        link3.href = linkAnimesQuinta[2];

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
    const titulosanimesSexta = ["Ishura", "Chiyu Mahou no Machigatta Tsukaikata"]

    const subtitulosAnimesSexta = ["Estúdio: Passione\nGêneros: Ação Aventura Fantasia", "Estúdio:Shin-Ei Animation, Studio Add\nGêneros: Ação, Fantasia"];

    const imagensAnimesSexta = ["https://www.anitube.vip/media/categories/video/f6d51a1d32d50d00c1c18c4a10177b7a.jpg", "https://cdn.anicdn.net/media/categories/video/41c33878b38abbe1feadde0677581e06.jpg"];

    const linkAnimesSexta = ["https://www.anitube.vip/anime/ishura", "https://www.anitube.vip/anime/chiyu-mahou-no-machigatta-tsukaikata"];

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

        banner1.style.backgroundImage ='url(' + imagensAnimesSexta[0] + ')';
        banner1.style.display = 'block'
        tituloconteudo1.innerText = titulosanimesSexta[0] 
        subtitulo1.innerText = subtitulosAnimesSexta[0]
        link1.href = linkAnimesSexta[0];
    
        banner2.style.backgroundImage = 'url(' + imagensAnimesSexta[1] + ')';
        banner2.style.display = 'block'
        tituloconteudo2.innerText = titulosanimesSexta[1]
        subtitulo2.innerText = subtitulosAnimesSexta[1]
        link2.href = linkAnimesSexta[1];

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
    const titulosanimesSabado = ["Solo Leveling", "Mashle S2"]

    const subtitulosAnimesSabado = ["Estúdio: A-1 Pictures\nGêneros: Ação, Aventura, Fantasia"," Estúdio: A-1 Pictures\nGêneros: Ação, Comédia, Fantasia" ];

    const imagensAnimesSabado = ["https://cdn.anicdn.net/media/categories/video/36dc63c846890690feb95783f34ab877.jpg", "https://cdn.anicdn.net/media/categories/video/84b580801c99a45fddeca9f3d89aa743.jpg"];

    const linkAnimesSabado = ["https://www.anitube.vip/download/anime/ore-dake-level-up-na-ken", "https://www.anitube.vip/download/anime/mashle-2nd-season"];

    if(taAparecendo == 0){
        //Area de cabeçalho

        conteudo.style.display = 'inline'
        titulo.innerText = 'Animes de Sabado'
        titulo.style.color = '#feffb3'
        subtitulo1.style.display = 'block'
        subtitulo2.style.display = 'block'
        tituloconteudo1.style.display='block'
        tituloconteudo2.style.display = 'block' 
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
        subtitulo3.innerText = ''
        tituloconteudo3.style.display = 'none'

        
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
    
    
    const imagensAnimesExtra=["https://www.anitube.vip/media/categories/video/3bd5574cdf7eaa90415f09d4aab9aa9b22.jpg", "https://encurtador.com.br/dnDGP", "https://image.tmdb.org/t/p/w342/yWLGhF6Rvv7oWC9ozzO0rvfQwYt.jpg", "https://www.anitube.vip/media/categories/video/6191ef71619248a9be7992300a3aef9c583.jpg", "https://www.anitube.vip/media/categories/video/24ff43761bcc71c3bfe5e8d4168da636.jpg", "https://www.anitube.vip/media/categories/video/8654b7e38946e9d533caf185a8fef8b7276.jpg"];
    
    const tituloanimesExtra = ["Bastard","Ao no Exorcist","(Des)encanto","Keijo","Dungeon Meshi", "Hajimete no Gal"  ]

    const subtitulosAnimesExtra=["Autor: Kazushi Hagiwara\n Direção: Takaharu Ozaki\n Estúdio: LIDENFILMS\n Gêneros: Ação Aventura Comédia Ecchi Fantasia Seinen", "Gêneros: Ação Fantasia","Gênero: Animação Aventura Comédia", "Autor: Daichi Sorayomi\n Direção: Hideya Takahashi\n Estúdio: Xebec\n Gêneros: Ação Ecchi Esporte Shounen", "Estúdio: Trigger\n Gêneros: Comédia Fantasia", "Autor: Meguru Ueno\n Direção: Hiroyuki Furukawa\n Estúdio: NAZ\n Gêneros: Comédia Ecchi Romance Shounen Escolar"];
    
    const linkAnimesExtra = ["https://www.anitube.vip/anime/bastard-ankoku-no-hakaishin-ona", "https://darkmahou.org/ao-no-exorcist/", "https://www.anitube.vip/anime/keijo", "https://www.anitube.vip/anime/dungeon-meshi", "https://www.anitube.vip/anime/39f08a00833ef97fdbdb4a5ca62d76231d4b72be"];
    //Tentar fazer um comando de repetição para mostra todos os conteudos extra sem precisar de muitas linhas.
    let contador = 0

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

        
        for (let i = 0; i < bannerExtra.length; i++){
            
            bannerExtra[i].style.backgroundImage ='url(' + imagensAnimesExtra[i] + ')';
            tituloAExtra[i].textContent = tituloanimesExtra[i];
            
            subtituloExtra[i].textContent = subtitulosAnimesExtra[i]; 

            linkExtra[i].href = linkAnimesExtra[i];
            
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