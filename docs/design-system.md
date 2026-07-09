# Design System

## Conceito

> **AnimeWeek deve transmitir organização, tranquilidade e imersão.**

A interface não deve competir com as capas dos animes.

Os animes são o elemento visual principal.

A UI deve funcionar como uma moldura elegante.

---

# Estilo Visual

**Personalidade**

* Moderna
* Limpa
* Elegante
* Colorida apenas onde necessário
* Muito contraste
* Bastante blur
* Bordas arredondadas
* Transparências leves

Inspirado em:

* AniList
* Arc Browser
* Discord
* Linear
* Apple Music
* Crunchyroll

---

# Tipografia

## Fonte Principal

### Geist

Excelente para SaaS modernos.

* limpa
* ótima leitura
* perfeita para Vue + Tailwind

```css
font-family: "Geist", sans-serif;
```

---

## Fonte Secundária

### Outfit

Usada em títulos.

Possui personalidade mais forte.

Excelente para páginas de detalhes.

---

## Alternativa

Se quiser algo ainda mais premium:

* Plus Jakarta Sans

ou

* Manrope

---

# Escala tipográfica

| Uso     | Tamanho |
| ------- | ------- |
| Hero    | 52px    |
| H1      | 40px    |
| H2      | 32px    |
| H3      | 24px    |
| H4      | 20px    |
| Body    | 16px    |
| Small   | 14px    |
| Caption | 12px    |

---

# Border Radius

```text
xs 4px

sm 8px

md 12px

lg 18px

xl 24px

2xl 32px
```

Tudo deve ser arredondado.

---

# Shadows

Poucas sombras.

Preferir:

```css
box-shadow:
0 8px 40px rgba(0,0,0,.25);
```

---

# Espaçamento

Base 8.

```
4

8

12

16

24

32

40

48

64
```

---

# Paleta Principal

## Primary

Indigo moderno

```
#6C63FF
```

---

## Primary Hover

```
#5B54E8
```

---

## Secondary

```
#8B5CF6
```

---

## Accent

Azul Neon

```
#2DD4FF
```

---

## Success

```
#22C55E
```

---

## Warning

```
#F59E0B
```

---

## Error

```
#EF4444
```

---

# Dark Theme

Background principal

```
#09090B
```

Cards

```
#111113
```

Elevado

```
#18181B
```

Borders

```
#27272A
```

Texto Principal

```
#FAFAFA
```

Texto Secundário

```
#A1A1AA
```

Texto Fraco

```
#71717A
```

---

# Light Theme

Background

```
#F8FAFC
```

Cards

```
#FFFFFF
```

Border

```
#E4E4E7
```

Texto

```
#18181B
```

---

# Cores por Estação

Como o projeto gira em torno das temporadas de anime, faria cada estação possuir sua própria identidade.

## Winter

```text
Primary

#60A5FA

Accent

#BAE6FD

Background

#0F172A
```

---

## Spring

```text
Primary

#34D399

Accent

#A7F3D0

Background

#052E16
```

---

## Summer

```text
Primary

#FB923C

Accent

#FDBA74

Background

#431407
```

---

## Autumn

```text
Primary

#F97316

Accent

#FED7AA

Background

#3F1D12
```

Quando o usuário muda de temporada, pequenos detalhes da interface (gradientes, destaques e botões) mudam automaticamente, enquanto a estrutura permanece consistente. Isso reforça o conceito do projeto sem prejudicar a usabilidade.

---

# Componentes

## Botões

Primary

```
Background Primary

Texto Branco

Radius 14px

Padding

14x20
```

---

Secondary

```
Background Card

Border

Primary
```

---

Ghost

Sem background

Hover com blur.

---

# Inputs

Radius

```
14px
```

Background

```
#18181B
```

Border

```
1px solid #2A2A2E
```

Focus

```
2px

Primary
```

---

# Cards

Radius

```
20px
```

Padding

```
20
```

Background

```
#111113
```

Hover

```
translateY(-3px)

transition 250ms

shadow
```

---

# Glass Effect

Somente em:

Navbar

Sidebar

Modal

Player

Utilizar

```css
backdrop-filter: blur(18px);
```

Nunca usar em toda a aplicação.

---

# Gradientes

Principal

```
#6C63FF

↓

#8B5CF6
```

---

Destaque

```
#2DD4FF

↓

#6C63FF
```

---

# Ícones

Lucide

Todos em

```
20px
```

ou

```
24px
```

---

# Ilustrações

Preferencialmente:

Flat

Anime-inspired

Pouco detalhadas

---

# Animações

Curtas.

150~250ms

Preferência por

Opacity

Scale

Translate

Evitar animações longas.

---

# Layout

Desktop

```
Sidebar

↓

Header

↓

Board
```

---

Mobile

```
Bottom Navigation

↓

Board

↓

Drawer
```

---

# Princípios de UX

* O anime sempre deve ser o foco visual.
* A interação principal deve exigir poucos cliques para adicionar, mover e atualizar episódios.
* Informações secundárias (nota, comentários, sinopse) devem aparecer sob demanda em drawers ou modais.
* O sistema deve manter consistência entre todas as estações, alterando apenas a identidade cromática e elementos decorativos.
