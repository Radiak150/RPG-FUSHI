# Simulacao de Builds por Cenario Real

Gerado em: 2026-07-15T21:58:08.513Z
Iteracoes por duelo: 1000

## O que foi testado

1. Sem item contra a mesma ficha sem item: confirma a linha de base.
2. Conjunto completo contra a mesma ficha sem build: isola o efeito dos itens.
3. Conjunto completo contra a mesma ficha com o mesmo conjunto: procura vantagem artificial.
4. Cada um dos 48 itens nas 5 raridades: confere ganho, custo e orcamento exato.
5. Conjunto Mitico completo: verifica Vida positiva e se uma ficha do mesmo Nivel ainda pode acertar a CA.
6. Todos os 41 NPCs entre si com suas builds: procura alvos matematicamente impossiveis e quebras entre Niveis.

O laboratorio usa Coreografia automaticamente quando ela aumenta a pressao. O resultado mostra quanto dos duelos terminou e depois a divisao de vitorias apenas entre os duelos concluidos. Impasse nao e aprovado como equilibrio.

## Portoes objetivos

- Itens com orcamento/gain/cost invalido: 0
- Conjuntos Miticos com Vida zero, CA inalcançavel ou imunes a 5 ataques do mesmo Nivel: 0
- NPCs espelhados avaliados: 41
- Pares reais com build: 820
- Item contra a mesma ficha sem item: 240
- Item contra item do mesmo arquetipo/raridade: 840

## Arquetipos - Basico e Avancado

| Nivel | Arquetipo | Sem x Sem (tatico) | Build x Sem (sem Reacao) | Build x Sem (tatico) | Build x Build (tatico) | Vida | CA | Bloqueio | Dano medio | Pressao 5x recebida | Cura | FUSHI | DET |
| --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Basico | tank | 99.7% concl.; 48.9% / 51.0% | 100.0% concl.; 0.0% / 100.0% | 0% concl.; impasse | 0% concl.; impasse | 44 (+24) | 15 (+3) | 9 (+4) | 0 (-3.5) | 20.16 -> 15.87 | 0 | 1 | 14 |
| Basico | assassino | 99.7% concl.; 50.2% / 49.8% | 100.0% concl.; 54.7% / 45.3% | 100.0% concl.; 60.6% / 39.4% | 100.0% concl.; 50.6% / 49.4% | 13 (-7) | 1 (-11) | 5 (0) | 12.5 (+9) | 20.1 -> 31.82 | -7 | 1 | 1 |
| Basico | suporte | 99.6% concl.; 49.7% / 50.3% | 100.0% concl.; 0.0% / 100.0% | 100.0% concl.; 0.0% / 100.0% | 0% concl.; impasse | 16 (-4) | 7 (-5) | 5 (0) | 0 (-3.5) | 19.81 -> 29.5 | 7 | 20 | 22 |
| Basico | lutador | 99.9% concl.; 51.0% / 48.9% | 100.0% concl.; 96.8% / 3.2% | 100.0% concl.; 100.0% / 0.0% | 99.8% concl.; 47.2% / 52.8% | 26 (+6) | 14 (+2) | 9 (+4) | 11.5 (+8) | 20.41 -> 17.18 | -6 | 1 | 5 |
| Basico | atirador | 99.4% concl.; 50.4% / 49.6% | 100.0% concl.; 87.5% / 12.5% | 100.0% concl.; 90.3% / 9.7% | 100.0% concl.; 46.8% / 53.2% | 15 (-5) | 5 (-7) | 5 (0) | 17.5 (+14) | 20.07 -> 31.32 | -7 | 1 | 1 |
| Basico | ocultista | 99.3% concl.; 49.5% / 50.4% | 100.0% concl.; 2.5% / 97.5% | 100.0% concl.; 0.0% / 100.0% | 5.9% concl.; 42.4% / 57.6% | 16 (-4) | 4 (-8) | 5 (0) | 0 (-3.5) | 19.89 -> 31.43 | 0 | 17 | 10 |
| Avancado | tank | 0% concl.; impasse | 100.0% concl.; 0.5% / 99.5% | 0% concl.; impasse | 0% concl.; impasse | 150 (+30) | 20 (+4) | 15 (+5) | 0 (-13) | 89.44 -> 75.48 | 0 | 55 | 36 |
| Avancado | assassino | 0% concl.; impasse | 100.0% concl.; 76.9% / 23.1% | 100.0% concl.; 0.0% / 100.0% | 100.0% concl.; 48.5% / 51.5% | 112 (-8) | 2 (-14) | 10 (0) | 25 (+12) | 90.78 -> 122.41 | -8 | 52 | 17 |
| Avancado | suporte | 0% concl.; impasse | 100.0% concl.; 0.2% / 99.8% | 100.0% concl.; 0.0% / 100.0% | 18.9% concl.; 52.4% / 47.6% | 115 (-5) | 10 (-6) | 10 (0) | 0 (-13) | 89.66 -> 118.57 | 8 | 78 | 46 |
| Avancado | lutador | 0% concl.; impasse | 100.0% concl.; 97.8% / 2.2% | 0% concl.; impasse | 0% concl.; impasse | 129 (+9) | 18 (+2) | 15 (+5) | 23 (+10) | 88.98 -> 83.39 | -7 | 53 | 27 |
| Avancado | atirador | 0% concl.; impasse | 100.0% concl.; 94.3% / 5.7% | 100.0% concl.; 0.0% / 100.0% | 100.0% concl.; 50.5% / 49.5% | 114 (-6) | 8 (-8) | 10 (0) | 31 (+18) | 88.97 -> 119.21 | -8 | 52 | 18 |
| Avancado | ocultista | 0% concl.; impasse | 100.0% concl.; 5.9% / 94.1% | 100.0% concl.; 0.0% / 100.0% | 100.0% concl.; 48.7% / 51.3% | 115 (-5) | 6 (-10) | 10 (0) | 8 (-5) | 90.89 -> 120.64 | 0 | 76 | 31 |

## Conjuntos completos - arquetipo contra arquetipo

| Nivel | Build A | Build B | Resultado tatico: conclusao; A / B entre concluidos |
| --- | --- | --- | --- |
| Basico | tank | assassino | 69.0% concl.; 0.0% / 100.0% |
| Basico | tank | suporte | 0% concl.; impasse |
| Basico | tank | lutador | 58.6% concl.; 0.0% / 100.0% |
| Basico | tank | atirador | 99.6% concl.; 0.0% / 100.0% |
| Basico | tank | ocultista | 0% concl.; impasse |
| Basico | assassino | suporte | 100.0% concl.; 100.0% / 0.0% |
| Basico | assassino | lutador | 100.0% concl.; 0.8% / 99.2% |
| Basico | assassino | atirador | 100.0% concl.; 9.8% / 90.2% |
| Basico | assassino | ocultista | 100.0% concl.; 100.0% / 0.0% |
| Basico | suporte | lutador | 100.0% concl.; 0.0% / 100.0% |
| Basico | suporte | atirador | 100.0% concl.; 0.0% / 100.0% |
| Basico | suporte | ocultista | 2.5% concl.; 0.0% / 100.0% |
| Basico | lutador | atirador | 100.0% concl.; 92.0% / 8.0% |
| Basico | lutador | ocultista | 100.0% concl.; 100.0% / 0.0% |
| Basico | atirador | ocultista | 100.0% concl.; 100.0% / 0.0% |
| Avancado | tank | assassino | 0% concl.; impasse |
| Avancado | tank | suporte | 0% concl.; impasse |
| Avancado | tank | lutador | 0% concl.; impasse |
| Avancado | tank | atirador | 0% concl.; impasse |
| Avancado | tank | ocultista | 0% concl.; impasse |
| Avancado | assassino | suporte | 100.0% concl.; 100.0% / 0.0% |
| Avancado | assassino | lutador | 100.0% concl.; 0.0% / 100.0% |
| Avancado | assassino | atirador | 100.0% concl.; 9.2% / 90.8% |
| Avancado | assassino | ocultista | 100.0% concl.; 94.9% / 5.1% |
| Avancado | suporte | lutador | 100.0% concl.; 0.0% / 100.0% |
| Avancado | suporte | atirador | 100.0% concl.; 0.0% / 100.0% |
| Avancado | suporte | ocultista | 99.2% concl.; 2.5% / 97.5% |
| Avancado | lutador | atirador | 100.0% concl.; 100.0% / 0.0% |
| Avancado | lutador | ocultista | 100.0% concl.; 100.0% / 0.0% |
| Avancado | atirador | ocultista | 100.0% concl.; 99.8% / 0.2% |

## NPCs - antes e depois do conjunto completo

| NPC | Nivel | Build | Vida | CA | Bloqueio | Dano medio | Cura | FUSHI | DET | Build x Sem |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Eiran | Basico | lutador | 30 (+6) | 18 (+2) | 9 (+4) | 0 (-3.5) | -6 | 4 | 10 | 0% concl.; impasse |
| Aureon | Basico | tank | 52 (+24) | 19 (+3) | 14 (+4) | 0 (-1.5) | 0 | 6 | 19 | 0% concl.; impasse |
| Kael | Avancado | lutador | 159 (+9) | 26 (+2) | 10 (+5) | 11.5 (+10) | -7 | 68 | 30 | 0% concl.; impasse |
| Lux | Avancado | ocultista | 145 (-5) | 13 (-10) | 5 (0) | 0 (-1.5) | 0 | 91 | 36 | 0% concl.; impasse |
| Gorin | Basico | tank | 47 (+23) | 19 (+3) | 14 (+4) | 0 (-5.5) | 0 | 6 | 19 | 0% concl.; impasse |
| Musashi | Basico | assassino | 17 (-7) | 6 (-12) | 5 (0) | 13.5 (+9) | -7 | 3 | 3 | 100.0% concl.; 0.0% / 100.0% |
| Yanzik | Basico | tank | 50 (+24) | 20 (+3) | 14 (+4) | 0 (-11) | 0 | 4 | 21 | 0% concl.; impasse |
| Seraph | Basico | ocultista | 18 (-4) | 9 (-8) | 0 (0) | 0 (-1.5) | 0 | 25 | 19 | 98.0% concl.; 0.0% / 100.0% |
| Velkar | Avancado | ocultista | 145 (-5) | 13 (-10) | 5 (0) | 0 (-1.5) | 0 | 92 | 36 | 0% concl.; impasse |
| Ryoku | Cataclisma | ocultista | 444 (-6) | 18 (-12) | 10 (0) | 0 (-1.5) | 0 | 22 | 129 | 0% concl.; impasse |
| Jaxir | Avancado | assassino | 142 (-8) | 10 (-14) | 5 (0) | 16.5 (+12) | -8 | 67 | 22 | 0.3% concl.; 0.0% / 100.0% |
| Lyssara | Basico | ocultista | 18 (-4) | 9 (-8) | 0 (0) | 0 (-1.5) | 0 | 24 | 15 | 13.0% concl.; 0.0% / 100.0% |
| Kairo | Avancado | atirador | 144 (-6) | 15 (-8) | 0 (0) | 0 (-1.5) | -8 | 67 | 23 | 0% concl.; impasse |
| Elion | Basico | ocultista | 18 (-4) | 9 (-8) | 0 (0) | 0 (-1.5) | 0 | 24 | 15 | 0% concl.; impasse |
| Arven | Basico | suporte | 20 (-4) | 12 (-5) | 0 (0) | 0 (-3.5) | 7 | 25 | 29 | 100.0% concl.; 0.0% / 100.0% |
| Varek | Avancado | assassino | 142 (-8) | 11 (-14) | 10 (0) | 13.5 (+12) | -8 | 67 | 22 | 0% concl.; impasse |
| Aeron | Basico | assassino | 15 (-7) | 6 (-12) | 0 (0) | 12.5 (+9) | -7 | 5 | 5 | 100.0% concl.; 0.0% / 100.0% |
| Sélian Velan | Basico | suporte | 20 (-4) | 12 (-5) | 5 (0) | 0 (-1.5) | 7 | 23 | 29 | 0% concl.; impasse |
| Yor | Avancado | assassino | 142 (-8) | 11 (-14) | 10 (0) | 16.5 (+12) | -8 | 67 | 22 | 15.1% concl.; 0.0% / 100.0% |
| Maelra | Avancado | suporte | 125 (-5) | 16 (-6) | 10 (0) | 0 (-3.5) | 8 | 103 | 56 | 0% concl.; impasse |
| Veyra | Avancado | assassino | 112 (-8) | 10 (-14) | 0 (0) | 15.5 (+12) | -8 | 72 | 27 | 0% concl.; impasse |
| Liryssa | Avancado | atirador | 129 (-6) | 16 (-8) | 0 (0) | 22.5 (+18) | -8 | 67 | 28 | 0% concl.; impasse |
| Varden | Basico | lutador | 28 (+6) | 19 (+2) | 4 (+4) | 11.5 (+8) | -6 | 6 | 9 | 100.0% concl.; 100.0% / 0.0% |
| Nyx | Avancado | atirador | 144 (-6) | 15 (-8) | 0 (0) | 0 (-1.5) | -8 | 67 | 23 | 0% concl.; impasse |
| Bront | Basico | lutador | 32 (+6) | 18 (+2) | 9 (+4) | 11.5 (+8) | -6 | 4 | 11 | 100.0% concl.; 99.4% / 0.6% |
| Morghast | Ascensao | tank | 296 (+36) | 32 (+4) | 16 (+6) | 0 (-1.5) | 0 | 114 | 57 | 0% concl.; impasse |
| Euryaleth | Ascensao | tank | 336 (+36) | 29 (+4) | 16 (+6) | 0 (-1.5) | 0 | 124 | 62 | 0% concl.; impasse |
| Vorashk | Ascensao | tank | 237 (+37) | 32 (+4) | 21 (+6) | 0 (-1.5) | 0 | 104 | 62 | 0% concl.; impasse |
| Aeronyx | Ascensao | lutador | 349 (+9) | 28 (+3) | 16 (+6) | 13.5 (+12) | -8 | 132 | 64 | 0% concl.; impasse |
| Thal’Zhyr | Cataclisma | tank | 424 (+44) | 35 (+5) | 22 (+7) | 0 (-1.5) | 0 | 144 | 85 | 0% concl.; impasse |
| Astrael | Cataclisma | ocultista | 394 (-6) | 18 (-12) | 5 (0) | 0 (-1.5) | 0 | 175 | 79 | 0% concl.; impasse |
| Elara | Basico | suporte | 18 (-4) | 11 (-5) | 0 (0) | 0 (-3.5) | 7 | 23 | 31 | 100.0% concl.; 0.0% / 100.0% |
| Orian | Basico | atirador | 17 (-5) | 10 (-7) | 0 (0) | 18.5 (+14) | -7 | 1 | 6 | 100.0% concl.; 57.2% / 42.8% |
| Nilo | Basico | atirador | 17 (-5) | 12 (-7) | 0 (0) | 0 (-1.5) | -7 | 3 | 6 | 0% concl.; impasse |
| Maira Velan | Basico | suporte | 18 (-4) | 11 (-5) | 0 (0) | 0 (-3.5) | 8 | 25 | 31 | 100.0% concl.; 0.0% / 100.0% |
| Dalvo | Basico | suporte | 20 (-4) | 12 (-5) | 0 (0) | 0 (-1.5) | 6 | 23 | 27 | 99.9% concl.; 0.0% / 100.0% |
| Elias | Basico | atirador | 17 (-5) | 10 (-7) | 0 (0) | 0 (-1.5) | -7 | 3 | 6 | 100.0% concl.; 0.0% / 100.0% |
| Nayr | Basico | assassino | 17 (-7) | 6 (-12) | 0 (0) | 10.5 (+9) | -7 | 3 | 5 | 100.0% concl.; 0.0% / 100.0% |
| Renji | Basico | lutador | 32 (+6) | 20 (+2) | 9 (+4) | 9.5 (+8) | -6 | 2 | 12 | 0% concl.; impasse |
| Kazuo | Basico | suporte | 18 (-4) | 11 (-5) | 0 (0) | 0 (-1.5) | 7 | 25 | 31 | 100.0% concl.; 0.0% / 100.0% |
| Vhazaryon | Cataclisma | lutador | 1009 (+9) | 34 (+3) | 16 (+6) | 13.5 (+12) | -10 | 290 | 153 | 0% concl.; impasse |

## Leitura correta

- `Build x Sem` compara a mesma ficha consigo mesma. Primeiro aparece quanto terminou; depois Build / Sem somente entre os duelos concluidos.
- `Sem Reacao` isola Vida, CA e dano. `Tatico` inclui Esquiva, Bloqueio e a melhor Coreografia calculada para o alvo.
- `Pressao 5x recebida` usa cinco ataques do mesmo Nivel contra um alvo com uma unica Reacao; isso representa a mesa real melhor que um duelo 1x1.
- Tank e Suporte podem melhorar muito sua funcao e ainda empatar ou perder 1x1; o delta de defesa/cura e o dado relevante.
- Assassino e Atirador devem mostrar ganho ofensivo acompanhado de perda defensiva clara.
- O JSON guarda todas as 240 linhas item/raridade e os 820 pares reais, sem resumir alertas como OK.
- O teste nao altera lore, Habilidades, Rituais, tokens ou multiplayer.
