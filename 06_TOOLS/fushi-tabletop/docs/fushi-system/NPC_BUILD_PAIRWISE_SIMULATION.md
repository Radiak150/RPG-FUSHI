# Simulacao Pareada dos NPCs com Builds

Gerado em: 2026-07-15T06:24:17.696Z
NPCs: 41
Pares unicos: 820
Iteracoes por par/modo: 1000
Limite de rodadas: 60

## Como ler

- Duelo usa um ataque por personagem/rodada. Uma Esquiva fixa alta pode travar o 1x1.
- Pressao simula o ataque com a Reacao ja gasta por outro perigo da rodada; o golpe enfrenta apenas a CA.
- Habilidades gastam FUSHI/Determinacao, curas reais sao usadas quando ferido e a Coreografia troca d20 por dados de dano.
- Acoes de fase, Dominio, Lendaria, Berserk ou ataque futuro ficam fora do duelo comum.
- Suporte e controle nao sao julgados apenas por vitoria solo; cura e quantidade de controles ficam publicadas no JSON.
- Nenhum efeito de Habilidade foi reescrito para a simulacao; sem dano direto sustentavel, usa 1d2.

## Resumo

- Pares do mesmo Nivel: 298
- Pares do mesmo Nivel com resultado majoritariamente decisivo sob pressao: 289
- Viradas brutas entre Niveis acima de 25%: 5
- Alertas numericos duros: 0
- Resultados contextuais de suporte, controle ou fase: 5

## Empates por faixa

| Faixa | Pares | Empate 1x1 | Empate sob pressao |
| --- | ---: | ---: | ---: |
| Basico x Basico | 231 | 1.6% | 1.0% |
| Basico x Avancado | 88 | 5.2% | 0.1% |
| Basico x Cataclisma | 54 | 0.0% | 0.0% |
| Basico x Ascensao | 52 | 0.0% | 0.0% |
| Avancado x Avancado | 55 | 63.0% | 7.7% |
| Avancado x Basico | 154 | 3.6% | 0.2% |
| Avancado x Cataclisma | 36 | 10.4% | 0.0% |
| Avancado x Ascensao | 44 | 50.5% | 12.1% |
| Cataclisma x Avancado | 8 | 50.3% | 0.0% |
| Cataclisma x Basico | 34 | 0.0% | 0.0% |
| Cataclisma x Ascensao | 4 | 100.0% | 0.0% |
| Cataclisma x Cataclisma | 6 | 99.2% | 9.6% |
| Ascensao x Ascensao | 6 | 73.0% | 0.0% |
| Ascensao x Cataclisma | 12 | 81.4% | 8.4% |
| Ascensao x Basico | 36 | 0.0% | 0.0% |

## Alertas numericos duros

- Nenhuma virada sem explicacao de papel/fase acima do limite de 25% sob pressao.

## Resultados contextuais, nao nerfar automaticamente

- Musashi (Basico) x Maelra (Avancado): 32.8% / 66.6% (papel de suporte/controle; mecanica de fase fora do duelo).
- Jaxir (Avancado) x Euryaleth (Ascensao): 95.5% / 0.7% (papel de suporte/controle; mecanica de fase fora do duelo).
- Varek (Avancado) x Euryaleth (Ascensao): 79.8% / 2.1% (papel de suporte/controle; mecanica de fase fora do duelo).
- Yor (Avancado) x Euryaleth (Ascensao): 99.1% / 0.0% (papel de suporte/controle; mecanica de fase fora do duelo).
- Vorashk (Ascensao) x Thal’Zhyr (Cataclisma): 76.3% / 0.0% (mecanica de fase fora do duelo).

## Acao primaria usada

- Eiran: 🧵 Faixas de Combate (1d6; media 2.5 antes de defesa; controles 1).
- Aureon: Julgamento Natural (1d8; media 4.5 antes de defesa; controles 1).
- Kael: 🌊 Fluxo dos Quatro (2d10; media 11.0 antes de defesa; cura 13.0; controles 2).
- Lux: ⚪ Colapso (3d10; media 16.5 antes de defesa; controles 2).
- Gorin: 💥 Golpe Devastador (2d10; media 11.0 antes de defesa; controles 2).
- Musashi: ⚡ Corte Preciso (2d8; media 9.0 antes de defesa; controles 0).
- Yanzik: 🗡️ Espada Massiva (2d10; media 11.0 antes de defesa; controles 1).
- Seraph: 🪽 Julgamento Celestial (4d12; media 25.0 antes de defesa; controles 4).
- Velkar: Transfiguração Forçada (2d12; media 11.0 antes de defesa; controles 3).
- Ryoku: Corte da Existência (3d12 + 10; media 26.5 antes de defesa; controles 1).
- Jaxir: 💥 Estouro de Prazer (3d10; media 19.5 antes de defesa; controles 0).
- Lyssara: Drenar Essência (1d8; media 3.5 antes de defesa; controles 0).
- Kairo: Execução Precisa (2d8; media 12.0 antes de defesa; controles 0).
- Elion: Ataque desarmado (1d2; media 1.5 antes de defesa; controles 1).
- Arven: 🗡️ Espada Curta (1d6; media 2.5 antes de defesa; controles 0).
- Varek: ⚡ Execução Rápida (2d8; media 12.0 antes de defesa; controles 0).
- Aeron: Golpe Preciso (1d8; media 6.5 antes de defesa; controles 0).
- Sélian Velan: 🧣 Nó de Pano (1d6; media 2.5 antes de defesa; controles 4).
- Yor: 🩸 Impacto Cruel (2d10; media 13.0 antes de defesa; controles 2).
- Maelra: 🪡 Agulhas de Sutra (1d6; media 1.5 antes de defesa; cura 13.5; controles 1).
- Veyra: 🔪 Lâmina de Mesa (1d6; media 5.5 antes de defesa; controles 1).
- Liryssa: Pistola de Sinalização Adaptada (1d8; media 4.5 antes de defesa; controles 0).
- Varden: Corte Clínico (1d8; media 5.5 antes de defesa; controles 0).
- Nyx: 👾 Invocação Digital (2d10; media 11.0 antes de defesa; controles 1).
- Bront: 🛠️ Martelo Multifuncional (1d6; media 4.5 antes de defesa; controles 0).
- Morghast: 🌑 Toque do Vazio (2d12; media 13.0 antes de defesa; controles 2).
- Euryaleth: Ataque desarmado (1d2; media 1.5 antes de defesa; controles 4).
- Vorashk: 🐍 Mordida Colossal (3d12; media 19.5 antes de defesa; controles 0).
- Aeronyx: ☄ Mergulho do Meteoro (4d12; media 28.0 antes de defesa; controles 3).
- Thal’Zhyr: 🌊 Dilúvio Absoluto (4d10; media 22.0 antes de defesa; controles 1).
- Astrael: 🌠 Corte Orbital (3d12 + 10; media 35.5 antes de defesa; controles 3).
- Elara: 🔪 Faca Utilitária (1d6; media 2.5 antes de defesa; controles 0).
- Orian: 🏹 Arco Curto Simples (1d8; media 5.5 antes de defesa; controles 0).
- Nilo: Ataque desarmado (1d2; media 3.5 antes de defesa; controles 0).
- Maira Velan: Bastao de Cerimonia (1d6; media 2.5 antes de defesa; controles 1).
- Dalvo: Ataque desarmado (1d2; media 0.5 antes de defesa; cura 7.5; controles 0).
- Elias: 🧪 Reagente Irritante (1d6; media 4.5 antes de defesa; controles 1).
- Nayr: Corte de Esquina (2d6; media 10.0 antes de defesa; controles 2).
- Renji: Ataque desarmado (1d2; media 2.5 antes de defesa; controles 2).
- Kazuo: Ataque desarmado (1d2; media 0.5 antes de defesa; controles 0).
- Vhazaryon: Sopro Dracônico Celestial (5d12; media 34.5 antes de defesa; controles 2).
