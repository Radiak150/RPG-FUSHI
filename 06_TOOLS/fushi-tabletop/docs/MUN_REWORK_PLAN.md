# Rework MUN - Mapa Mundi Vivo

Objetivo: transformar o MUN de painel tecnico/editor em um mapa mundi visual, limpo e usavel durante mesa. O mestre deve olhar, clicar, arrastar grupos e entender o mundo sem ficar lendo formulario.

## Principios

- O modo Mestre mostra o minimo: mapa grande, dia/hora, grupos, hover/click contextual e logs essenciais.
- Criacao/edicao/manual tecnico fica no Editor, nao na tela principal.
- O MUN sempre aponta para mapas reais do MAP; nao deve criar uma interface paralela de mapas no modo Mestre.
- Rotas ajudam calculo, mas nao prendem o mestre. Movimento livre continua permitido.
- Tudo que o jogador remoto/local recebe precisa sair do mesmo estado publico validado.
- Nenhum placeholder deve virar dado permanente sem acao explicita do mestre.

## UX final do modo Mestre

Tela principal:

- Mapa grande, expansivel em tela cheia.
- Barra pequena dentro do mapa:
  - Dia / horario.
  - Modo rapido / planejamento.
  - Desfazer.
  - Confirmar/cancelar plano quando houver plano.
  - Ajuda `?`.
- Sem seletor de fase no modo Mestre. Fase vira metadado tecnico/editor.
- Sem painel lateral fixo cheio de campos.
- Sem `Criar mapa local`, `Gerar placeholder`, `Substituir asset` no modo Mestre.
- Hover em local/bioma mostra tooltip bonito com nome, risco e presencas.
- Click em local abre mini janela contextual discreta.
- Click em dungeon/subponto dentro da mini janela troca o conteudo da janela para aquele sublocal.
- Click na thumbnail/mapa vinculado abre o MAP no mapa real daquele local, em preparar/ativar.

## Mini janela de local

Conteudo essencial:

- Nome do local.
- Thumbnail/imagem do local.
- Bioma, risco, FUSHI/distorcao, DT se importante.
- Presentes no local:
  - grupos/player;
  - NPCs;
  - mobs.
- Rotas/saidas importantes, apenas se ajudam a narrar.
- Dungeons/subpontos conhecidos.
- Botao: `Abrir MAP` ou `Preparar/Ativar mapa`, usando `mapId` real.
- Ultimo log relevante curto.

Tudo abaixo fica em Editor/Detalhes:

- campos completos;
- tags;
- estabilidade numerica;
- rotas completas;
- criar/vincular mapa;
- status tecnico;
- simulacao detalhada.

## Visual do mapa

Camadas planejadas:

1. `baseMap`: imagem final da ilha, sem textos fixos.
2. `biomeMasks`: areas transparentes ou SVG paths por bioma.
3. `poiOutlines`: contornos/aneis brilhantes dos pontos de interesse.
4. `routesLayer`: rotas visiveis/secretas/planejadas.
5. `partyLayer`: grupos e NPCs relevantes.
6. `hoverLayer`: tooltip e destaque.
7. `popoverLayer`: mini janela do local.

Estilo:

- Dark fantasy limpo.
- Contorno colorido por bioma/local.
- Glow leve, sem poluir.
- Sem nomes sempre escritos no mapa.
- Nome aparece por hover ou quando selecionado.
- Marcadores deixam de ser bolinhas/debug e passam a ser POIs integrados ao desenho.

## Rework mecanico

### Movimento

- Modo rapido:
  - arrastar grupo;
  - aplica movimento;
  - calcula tempo;
  - roda simulacao;
  - gera log limpo;
  - permite desfazer.

- Modo planejamento:
  - arrastar grupos;
  - mostra posicao planejada;
  - confirma tudo junto;
  - relogio avanca pelo maior tempo.

### Movimento livre

- Se nao houver rota, calcular por distancia/bioma.
- Criar ponto temporario de exploracao quando destino nao for POI.
- Locais ocultos proximos geram sugestao de teste, nao revelacao automatica.

### MAP vinculado

- Cada local possui `mapId` opcional.
- O modo Mestre do MUN mostra somente `Abrir MAP`.
- Criar/vincular/substituir mapa fica no Editor.
- Ao abrir MAP, usar `mestreCurrentMapId`; nao alterar `playerCurrentMapId` ate o mestre ativar.

## Simulacao viva V1

Entrada necessaria:

- Tags fortes por local.
- Tags de interesse/ameaca por NPC.
- Intencao atual por NPC.
- Risco aceito, cautela, curiosidade, agressividade.
- Relacoes com players/grupos.
- Estado de simulacao: autonomo, em cena, acompanhando grupo, seguindo contexto, selado etc.

Loop V1:

1. Avaliar locais candidatos por pontuacao.
2. Considerar proximidade, tags, risco, bioma, relacoes e eventos.
3. Gerar proposta narrativa.
4. Mostrar previa limpa ao mestre.
5. Aplicar/cancelar/editar.

Log do mestre:

`Dia 2 | 14:00 - Aureon patrulhou a Trilha dos Cacadores apos detectar sinais de caca.`

Log tecnico:

- score;
- tags;
- decisao interna;
- estado bruto.

## Ordem segura de implementacao

1. Corrigir selects/dropdowns dark e legibilidade global.
2. Criar assets contract e pastas esperadas.
3. Refatorar modo Mestre do MUN para layout limpo sem remover Editor.
4. Implementar mapa grande/expansivel com camadas visuais.
5. Trocar bolinhas por POI integrado: hover, click, popover.
6. Remover acoes tecnicas do modo Mestre; mover para Editor/Detalhes.
7. Integrar thumbnails e mapa vinculado do MAP.
8. Implementar seed estruturado completo do MUN.
9. Implementar simulacao viva V1 com previa.
10. Testar local, desktop e player/remoto para garantir paridade.
11. Depois iniciar polimento visual do tabletop, som, interludios, FX e UI geral.

## Criterios de pronto

- Mestre consegue narrar olhando quase so para o mapa.
- Clicar em local responde rapido e mostra o essencial.
- Arrastar grupo atualiza tempo/log sem confusao.
- MAP abre no local correto.
- Jogador nunca recebe MUN completo.
- Desktop/web continuam iguais.
- Nenhum placeholder/template aparece por cima de campanha real.
