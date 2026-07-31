# Combat V2 Simulation Report

Gerado em: 2026-07-31T20:16:01.381Z
Fonte: C:\Users\danie\AppData\Roaming\FUSHI\workspace.json
Iteracoes por cenario: 600
Seed: 20260711

## Escopo

- Simulador usa CA passiva, Bloqueio por Fortitude, Esquiva fixa em CA + AGI + Reflexos e critico que dobra apenas dados de dano.
- Usa ataques estruturados; onde nao existe ataque, usa golpe desarmado de referencia.
- Nao simula ainda terreno, FUSHI imbuido, Ritual, cura, manobra, IA narrativa ou objetivo de boss.
- Resultado e um termometro de matematica, nunca uma sentenca sobre lore canonica.

## Auditoria de fichas

| Ficha | Tipo | Poder | Vida | CA | Bloqueio | Esquiva fixa | Ataque base | Media | Aviso |
| --- | --- | --- | ---: | ---: | ---: | --- | --- | ---: | --- |
| Aeron | npc | Basico | 15 | 6 | 0 | 14 | 🔪 Lâmina Oculta (1d6) | 3.5 | - |
| Aeronyx | npc | Ascensao | 349 | 28 | 16 | 49 | Golpe desarmado (1d2) | 1.5 | Sem ataque estruturado; usa referencia. |
| Arven | npc | Basico | 20 | 12 | 0 | 14 | 🗡️ Espada Curta (1d6) | 3.5 | - |
| Astrael | npc | Ascensao | 394 | 18 | 5 | 34 | Golpe desarmado (1d2) | 1.5 | Sem ataque estruturado; usa referencia. |
| Aureon | npc | Basico | 52 | 19 | 14 | 20 | Golpe desarmado (1d2) | 1.5 | Sem ataque estruturado; usa referencia. |
| Bront | npc | Basico | 32 | 18 | 9 | 19 | 🛠️ Martelo Multifuncional (1d6) | 3.5 | - |
| Connor | player | Basico | 24 | 10 | 5 | 11 | Golpe desarmado (1d2) | 1.5 | Sem ataque estruturado; usa referencia. |
| Dalvo | npc | Basico | 20 | 12 | 0 | 14 | Golpe desarmado (1d2) | 1.5 | Sem ataque estruturado; usa referencia. |
| Davi | player | Basico | 10 | 10 | 0 | 17 | Adaga (1d6) | 3.5 | - |
| Eco de Connor | mob | Basico | 6 | 11 | 0 | 13 | Golpe desarmado (1d2) | 1.5 | - |
| Eco de Davi | mob | Basico | 6 | 11 | 0 | 13 | Golpe desarmado (1d2) | 1.5 | - |
| Eco de Grim | mob | Basico | 6 | 11 | 0 | 13 | Golpe desarmado (1d2) | 1.5 | - |
| Eco de Kael | mob | Basico | 5 | 11 | 0 | 13 | Golpe desarmado (1d2) | 1.5 | - |
| Eco de Kairos | mob | Basico | 6 | 11 | 0 | 13 | Golpe desarmado (1d2) | 1.5 | - |
| Eco de Liora | mob | Basico | 7 | 12 | 0 | 14 | Golpe desarmado (1d2) | 1.5 | - |
| Eiran | npc | Basico | 30 | 18 | 9 | 30 | 🧵 Faixas de Combate (1d6) | 3.5 | - |
| Elara | npc | Basico | 18 | 11 | 0 | 12 | 🔪 Faca Utilitária (1d6) | 3.5 | - |
| Elias | npc | Basico | 17 | 10 | 0 | 12 | Golpe desarmado (1d2) | 1.5 | Sem ataque estruturado; usa referencia. |
| Elion | npc | Basico | 18 | 9 | 0 | 16 | Golpe desarmado (1d2) | 1.5 | Sem ataque estruturado; usa referencia. |
| Euryaleth | npc | Ascensao | 336 | 29 | 16 | 48 | Golpe desarmado (1d2) | 1.5 | Sem ataque estruturado; usa referencia. |
| Fragmentado | player | Basico | 11 | 10 | 0 | 10 | Golpe desarmado (1d2) | 1.5 | - |
| Gorin | npc | Basico | 47 | 19 | 14 | 20 | 🔨 Massa de Pedra (1d10) | 5.5 | - |
| Grim | player | Basico | 5 | 10 | 0 | 10 | Golpe desarmado (1d2) | 1.5 | Sem ataque estruturado; usa referencia. |
| Jaxir | npc | Avancado | 142 | 10 | 5 | 24 | 🃏 Lâminas Ocultas (1d8) | 4.5 | - |
| Kael | npc | Avancado | 159 | 26 | 10 | 40 | Golpe desarmado (1d2) | 1.5 | Sem ataque estruturado; usa referencia. |
| Kael | player | Basico | 20 | 10 | 5 | 12 | Golpe desarmado (1d2) | 1.5 | Sem ataque estruturado; usa referencia. |
| Kairo | npc | Avancado | 144 | 15 | 0 | 23 | Golpe desarmado (1d2) | 1.5 | Sem ataque estruturado; usa referencia. |
| Kaíros | player | Basico | 4 | 10 | 0 | 16 | Golpe desarmado (1d2) | 1.5 | Sem ataque estruturado; usa referencia. |
| Kazuo | npc | Basico | 18 | 11 | 0 | 12 | Golpe desarmado (1d2) | 1.5 | Sem ataque estruturado; usa referencia. |
| Liryssa | npc | Avancado | 129 | 16 | 0 | 30 | Pistola de Sinalização Adaptada (1d8) | 4.5 | - |
| Lobo Cinzento | mob | Minion | 8 | 10 | 0 | 12 | Mordida (1d6) | 3.5 | - |
| Lobo Marcado por FUSHI | mob | Basico | 14 | 12 | 0 | 19 | Mordida Instavel (1d6 + 1) | 4.5 | - |
| Lux | npc | Avancado | 145 | 13 | 5 | 26 | Golpe desarmado (1d2) | 1.5 | Sem ataque estruturado; usa referencia. |
| Lyssara | npc | Basico | 18 | 9 | 0 | 11 | Golpe desarmado (1d2) | 1.5 | Sem ataque estruturado; usa referencia. |
| Maelra | npc | Avancado | 125 | 16 | 10 | 23 | 🪡 Agulhas de Sutra (1d6) | 3.5 | - |
| Maira Velan | npc | Basico | 18 | 11 | 0 | 12 | Bastao de Cerimonia (1d6) | 3.5 | - |
| Morghast | npc | Ascensao | 296 | 32 | 16 | 45 | Golpe desarmado (1d2) | 1.5 | Sem ataque estruturado; usa referencia. |
| Musashi | npc | Basico | 17 | 6 | 5 | 19 | ⚔️ Katana (1d8) | 4.5 | - |
| Nayr | npc | Basico | 17 | 6 | 0 | 19 | Golpe desarmado (1d2) | 1.5 | Sem ataque estruturado; usa referencia. |
| Nilo | npc | Basico | 17 | 12 | 0 | 26 | Golpe desarmado (1d2) | 1.5 | Sem ataque estruturado; usa referencia. |
| Nyx | npc | Avancado | 144 | 15 | 0 | 28 | Golpe desarmado (1d2) | 1.5 | Sem ataque estruturado; usa referencia. |
| Orian | npc | Basico | 17 | 10 | 0 | 12 | 🏹 Arco Curto Simples (1d8) | 4.5 | - |
| Renji | npc | Basico | 32 | 20 | 9 | 33 | Golpe desarmado (1d2) | 1.5 | Sem ataque estruturado; usa referencia. |
| Ryoku | npc | Ascensao | 444 | 18 | 10 | 38 | Golpe desarmado (1d2) | 1.5 | Sem ataque estruturado; usa referencia. |
| Sélian Velan | npc | Basico | 20 | 12 | 5 | 14 | Golpe desarmado (1d2) | 1.5 | Sem ataque estruturado; usa referencia. |
| Seraph | npc | Basico | 18 | 9 | 0 | 11 | Golpe desarmado (1d2) | 1.5 | Sem ataque estruturado; usa referencia. |
| Thal’Zhyr | npc | Ascensao | 424 | 35 | 22 | 49 | Golpe desarmado (1d2) | 1.5 | Sem ataque estruturado; usa referencia. |
| Varden | npc | Basico | 28 | 19 | 4 | 21 | 🔪 Estojo Cirúrgico de Campo (1d6) | 3.5 | - |
| Varek | npc | Avancado | 142 | 11 | 10 | 26 | Golpe desarmado (1d2) | 1.5 | Sem ataque estruturado; usa referencia. |
| Velkar | npc | Avancado | 145 | 13 | 5 | 21 | Golpe desarmado (1d2) | 1.5 | Sem ataque estruturado; usa referencia. |
| Veyra | npc | Avancado | 112 | 10 | 0 | 24 | 🔪 Lâmina de Mesa (1d6) | 3.5 | - |
| Vhazaryon | npc | Cataclisma | 1009 | 34 | 16 | 50 | Golpe desarmado (1d2) | 1.5 | Sem ataque estruturado; usa referencia. |
| Vorashk | npc | Avancado | 237 | 32 | 21 | 51 | Golpe desarmado (1d2) | 1.5 | Sem ataque estruturado; usa referencia. |
| Yanzik | npc | Basico | 50 | 20 | 14 | 27 | 🗡️ Espada Massiva (2d10) | 11 | - |
| Yor | npc | Avancado | 142 | 11 | 10 | 26 | 🗡️ Agulhas de Execução (1d8) | 4.5 | - |

## Cenários

### Referência Básica vs Lobo Cinzento

- Lado A vence: 100% | Lado B vence: 0%
- Empates tecnicos no limite de rodadas: 0%
- Rodadas medias: 2.96 | HP final A/B: 24.81/0
- Esquivas medias: 1.04 | Bloqueios medios: 0.19 | Criticos medios: 0.36

### Tank Comum vs Lobo Cinzento

- Lado A vence: 100% | Lado B vence: 0%
- Empates tecnicos no limite de rodadas: 0%
- Rodadas medias: 8.03 | HP final A/B: 31.07/0
- Esquivas medias: 3.37 | Bloqueios medios: 0.74 | Criticos medios: 1.1

### Assassino Comum vs Lobo Cinzento

- Lado A vence: 100% | Lado B vence: 0%
- Empates tecnicos no limite de rodadas: 0%
- Rodadas medias: 1.8 | HP final A/B: 17.93/0
- Esquivas medias: 0.47 | Bloqueios medios: 0.08 | Criticos medios: 0.22

### Grupo de 5 Básicos vs 2 Lobos + 1 Marcado

- Lado A vence: 100% | Lado B vence: 0%
- Empates tecnicos no limite de rodadas: 0%
- Rodadas medias: 2.74 | HP final A/B: 124.16/0
- Esquivas medias: 2.86 | Bloqueios medios: 0.06 | Criticos medios: 1.35

### Veyra vs Liryssa

- Lado A vence: 0% | Lado B vence: 0%
- Empates tecnicos no limite de rodadas: 100%
- Rodadas medias: 24 | HP final A/B: 112/129
- Esquivas medias: 34.89 | Bloqueios medios: 0 | Criticos medios: 5.47
- Alerta de ficha: Impasse tatico: pelo menos 95% das iteracoes chegaram ao limite de rodadas sem vencedor.

