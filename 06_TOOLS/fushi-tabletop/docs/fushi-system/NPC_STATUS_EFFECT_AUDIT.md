# Auditoria de estados das fichas NPC

Gerado em 2026-07-27T06:16:48.522Z.

Fonte real: `C:\Users\danie\AppData\Roaming\FUSHI\workspace.json`.

Catalogo canonico: `C:\RPG FUSHI\RPG-FUSHI\06_TOOLS\fushi-tabletop\src\data\statusCatalog.ts`.

## Regra desta auditoria

Este relatorio nao altera lore, habilidade, ritual, dano, custo ou efeito. Uma palavra parecida com um estado canonico e apenas um candidato de revisao: ela nao e convertida automaticamente em regra. A classificacao **SEM_ESTADO_EXPLICITO** tambem nao e erro; muitas acoes causam dano, cura ou movimento sem aplicar estado.

## Resumo

| Medida | Total |
| --- | ---: |
| NPCs auditados | 41 |
| Acoes auditadas | 318 |
| Estados estruturados e automaticos | 0 |
| Candidatos que exigem revisao do Mestre | 61 |
| Acoes sem estado explicito | 257 |
| Custos ativos que exigem revisao | 124 |

## Ja automatico

| NPC | Acao | Estado estruturado |
| --- | --- | --- |
| - | - | Nenhum estado automatico encontrado |

## Destino mecanico dos candidatos

- **EFEITO_DIRETO_ESTRUTURAVEL**: 3
- **ESCOLHA_OU_MODO**: 8
- **PASSIVA_FASE_OU_EVENTO**: 6
- **REFERENCIA_NAO_APLICA**: 22
- **REGRA_ESPECIAL_MANUAL**: 8
- **RESOLUCAO_IMEDIATA**: 3
- **TESTE_SECUNDARIO**: 11

## Exige revisao antes de virar regra

| NPC | Acao | Estado candidato | Destino | Custo |
| --- | --- | --- | --- | --- |
| Eiran | Instinto de Sobrevivência | agro | REFERENCIA_NAO_APLICA | 2 determinacao |
| Kael | 🌪 Passo do Vento | agro | REFERENCIA_NAO_APLICA | 3 fushi |
| Kael | 🌊 Fluxo dos Quatro | cura | ESCOLHA_OU_MODO | 5 fushi |
| Kael | Ataque Elemental Absoluto | desnorteado | TESTE_SECUNDARIO | custo pendente |
| Lux | 🌌 EXPANSÃO DE DOMÍNIO VAZIO INFINITO | lento | PASSIVA_FASE_OU_EVENTO | 15 fushi, 10 determinacao |
| Gorin | 🔨 Massa de Pedra | desnorteado | TESTE_SECUNDARIO | custo pendente |
| Seraph | 🪽 Julgamento Celestial | paralisado | TESTE_SECUNDARIO | 10 determinacao |
| Ryoku | Consumo de Essência | cura | RESOLUCAO_IMEDIATA | 10 determinacao |
| Ryoku | Domínio do Medo | amedrontado | TESTE_SECUNDARIO |  |
| Ryoku | Regeneração Anômala | cura | PASSIVA_FASE_OU_EVENTO |  |
| Lyssara | Drenar Essência | cura | RESOLUCAO_IMEDIATA | 3 fushi |
| Lyssara | 🌫 Retirada Elegante | agro | REFERENCIA_NAO_APLICA | 2 determinacao |
| Elion | Quebra de Lógica | confuso | EFEITO_DIRETO_ESTRUTURAVEL | 3 fushi |
| Varek | Movimento Relâmpago | agro | REFERENCIA_NAO_APLICA | 3 fushi |
| Sélian Velan | ⚠ Colapso Sensorial | amedrontado, confuso | ESCOLHA_OU_MODO | 3 determinacao |
| Yor | ⚡ Passo Kunoichi | agro, rapidez | REFERENCIA_NAO_APLICA | custo pendente |
| Yor | 🛡️ Guarda da Promessa | protecao | ESCOLHA_OU_MODO | custo pendente |
| Yor | ⚫ JARDIM DE ESPINHOS | protecao | PASSIVA_FASE_OU_EVENTO | custo pendente |
| Yor | 🔥 EFEITO PRINCIPAL | protecao | ESCOLHA_OU_MODO | custo pendente |
| Maelra | 🪡 Agulhas de Sutra | cura | REFERENCIA_NAO_APLICA | custo pendente |
| Maelra | Costura Vital | cura | TESTE_SECUNDARIO | 5 fushi |
| Maelra | Não Vá Ainda | agro | PASSIVA_FASE_OU_EVENTO | 6 fushi, 3 determinacao |
| Maelra | 🌊 Pulso da Maré Viva | sangrando, aura, cura | ESCOLHA_OU_MODO | 6 fushi |
| Maelra | 👵 Repreensão da Avó | protecao | TESTE_SECUNDARIO | 4 fushi |
| Maelra | 🩺 Mãos que Aprenderam Demais | envenenado | REFERENCIA_NAO_APLICA |  |
| Maelra | ⚫ HABILIDADE LENDÁRIA LEITO DA ÚLTIMA MARÉ | sangrando, aura, cura | ESCOLHA_OU_MODO | 20 fushi, 15 determinacao |
| Liryssa | 🧭 Rota Impossível | agro | REFERENCIA_NAO_APLICA | 5 fushi |
| Nyx | 🟦 Construção Holográfica | protecao | ESCOLHA_OU_MODO | 3 fushi |
| Bront | Reparo Improvisado | quebrado, aura | REFERENCIA_NAO_APLICA | 2 fushi |
| Bront | 🍖 Refeição Energizante | amedrontado, vacina | ESCOLHA_OU_MODO | 6 fushi |
| Euryaleth | ♻ Regeneração Anormal | aura, cura | REFERENCIA_NAO_APLICA |  |
| Euryaleth | 🪨 ESTAGNAÇÃO | lento | REGRA_ESPECIAL_MANUAL | custo pendente |
| Euryaleth | 👁️ FASE 2 — OLHAR DA ESTAGNAÇÃO | vulneravel, cura | TESTE_SECUNDARIO | custo pendente |
| Euryaleth | ♻️ REGENERAÇÃO ABSOLUTA | vulneravel, cura | REGRA_ESPECIAL_MANUAL | custo pendente |
| Vorashk | 🐍 Mordida Colossal | sangrando | TESTE_SECUNDARIO | 5 fushi |
| Vorashk | 🌪 Corpo Serpentino | agro | REGRA_ESPECIAL_MANUAL | 4 fushi |
| Vorashk | 🌪 HABILIDADE TRANSFERÊNCIA VIVA | protecao | EFEITO_DIRETO_ESTRUTURAVEL | 4 fushi |
| Vorashk | 🌀 FASE 1 — O LABIRINTO VIVO | envenenado, confuso, vacina, cura | REFERENCIA_NAO_APLICA | custo pendente |
| Vorashk | ⚔️ FASE 2 — A SERPENTE EXPOSTA | vacina, cura | REFERENCIA_NAO_APLICA | custo pendente |
| Aeronyx | 🌋 FASE 1 — A ASCENSÃO | protecao | REFERENCIA_NAO_APLICA | custo pendente |
| Thal’Zhyr | ☠ Grito Abissal | sangrando | TESTE_SECUNDARIO | 6 fushi |
| Thal’Zhyr | ♻ Regeneração Hidra | cura | PASSIVA_FASE_OU_EVENTO |  |
| Thal’Zhyr | 🌊 PRESSÃO OCEÂNICA | lento | REGRA_ESPECIAL_MANUAL | custo pendente |
| Thal’Zhyr | ⚔️ FASE 2 — THAL’ZHYR DESPERTA | cura | TESTE_SECUNDARIO | custo pendente |
| Astrael | 🌌 Senhor das Coordenadas | agro | REFERENCIA_NAO_APLICA |  |
| Elara | ✋ Segurar o Pânico | amedrontado, cura | REGRA_ESPECIAL_MANUAL | 3 fushi |
| Maira Velan | Ritmo Compartilhado | amedrontado | PASSIVA_FASE_OU_EVENTO |  |
| Maira Velan | Rito de Abrigo | amedrontado | REGRA_ESPECIAL_MANUAL | 3 fushi |
| Maira Velan | Defesa Improvisada | protecao | REGRA_ESPECIAL_MANUAL | 1 determinacao |
| Dalvo | Tratamento de Emergência | cura | RESOLUCAO_IMEDIATA | 2 fushi |
| Dalvo | Ler Sinais do Corpo | amedrontado, envenenado | REFERENCIA_NAO_APLICA |  |
| Elias | Leitura Orgânica | enfraquecido, amedrontado, envenenado | REFERENCIA_NAO_APLICA |  |
| Nayr | Corte de Esquina | agro | REFERENCIA_NAO_APLICA | 2 fushi |
| Nayr | 😏 Sorriso de Mentira | amedrontado | REFERENCIA_NAO_APLICA |  |
| Nayr | Dor Como Alívio | amedrontado, agro | TESTE_SECUNDARIO | 2 vida, 2 determinacao |
| Nayr | Ira Autopunitiva | exausto, protecao | REGRA_ESPECIAL_MANUAL | 4 fushi, 3 determinacao |
| Renji | 🦶 Sair da Linha | agro | REFERENCIA_NAO_APLICA | 2 fushi |
| Renji | Guarda de Rua | protecao | EFEITO_DIRETO_ESTRUTURAVEL | 2 determinacao |
| Kazuo | 👂 Ouvir o Fluxo | amedrontado | REFERENCIA_NAO_APLICA |  |
| Vhazaryon | FASE FINAL A FORMA HUMANA DO DRAGÃO | amedrontado, vacina | REFERENCIA_NAO_APLICA | custo pendente |
| Vhazaryon | 🎁 RECOMPENSA DESEJO DO DRAGÃO FUSHI | aura, cura | REFERENCIA_NAO_APLICA | custo pendente |

Os detalhes completos, inclusive acoes sem estado, permanecem em `NPC_STATUS_EFFECT_AUDIT.json`.
