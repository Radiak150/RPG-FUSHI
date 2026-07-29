# FUSHI Character Stages V1

Status: implementado em alpha.88, em validacao empacotada

## Objetivo

Estagios permitem que o Mestre prepare variacoes de uma mesma ficha para
transformacoes, bosses, skins e mudancas de identidade visual sem criar uma
segunda ficha canonica. A ficha raiz continua sendo a unica fonte usada por
combate, inventario, turno, MUN, Fluxo Principal e multiplayer.

## Modelo canonico

- `stageState` e opcional para manter compatibilidade com saves antigos.
- `stageState.catalog` pertence ao Mestre e contem snapshots privados.
- `stageState.activeStageId`, `activeStageLabel` e `revision` formam a
  projecao publica minima.
- O snapshot nao contem `stageState`; isso impede recursao e crescimento
  infinito do save.
- `Padrao` e criado automaticamente quando um personagem antigo ainda nao tem
  estagios.
- A fase ativa e sempre os campos normais da `CharacterSheet`. Nao existe uma
  ficha paralela em memoria para resolver ataque ou aplicar dano.

## Campos globais

Ao trocar de fase, estes campos permanecem globais e nao sao sobrescritos pelo
snapshot:

- id da ficha;
- jogador e tipo;
- faccao e local atual;
- corpo compartilhado;
- permissoes;
- vinculo do token.

Imagem, atributos, recursos, CA, bloqueio, esquiva, ataques, habilidades,
rituais, inventario e demais campos de jogo podem variar por fase. O Mestre
edita cada snapshot pelo fluxo normal da ficha.

## Operacoes do Mestre

1. **Criar fase**: salva a fase ativa, copia o estado atual, cria um id novo e
   ativa a copia.
2. **Editar fase**: usa o mesmo rascunho e o mesmo botao `Salvar` da ficha
   canonica.
3. **Ativar fase**: captura a fase atual, aplica o snapshot escolhido,
   preserva os campos globais, incrementa `revision` e publica uma unica
   atualizacao.
4. **Renomear fase**: muda apenas o rotulo, sem alterar regras ou conteudo.
5. **Excluir fase**: so permite excluir fase arquivada; `Padrao` e a fase ativa
   ficam protegidas.

Trocar de fase durante uma edicao aberta e bloqueado. O Mestre precisa salvar
ou cancelar o rascunho antes da troca, evitando perda silenciosa.

## Visibilidade e multiplayer

- O Mestre ve o catalogo completo, thumbnails, nomes, edicao e exclusao.
- Jogadores recebem somente a fase ativa e sua `revision`.
- Jogadores nao recebem ids, nomes, thumbnails ou snapshots das fases futuras.
- A troca Mestre -> Jogador usa o mesmo caminho de atualizacao da ficha
  canonica; nao abre uma rota nova, nao exige sair da sessao e nao cria aceite
  adicional.
- Um patch Jogador -> Mestre nunca pode substituir `stageState`, permissoes,
  corpo compartilhado, habilidades, rituais ou Build Absorvida.
- Reconexao pode repetir o estado ativo, mas nao deve repetir a animacao.

## Transicao visual

Quando a `revision` ativa muda:

1. cada cliente compara a revisao anterior com a nova;
2. a imagem anterior fica sobreposta por um instante;
3. o token executa giro/virada e tremor curto;
4. a imagem da fase ativa aparece;
5. a transicao expira sozinha e nao altera posicao, tamanho, selecao ou
   permissao do token.

A animacao e localmente idempotente: a mesma revisao nao pode disparar duas
vezes no mesmo cliente. O efeito visual nunca substitui a atualizacao
canonica.

## Regras para futuras fases de boss

Uma fase de boss pode mudar atributos, recursos, ataques, habilidades, rituais,
imagem, audio, mapa sugerido e VFX, mas cada mudanca deve ser explicitamente
preparada pelo Mestre. Nao inferir fase por texto de lore, nome de arquivo ou
palavra parecida.

Fases que exigirem mapa, ritual, cinematic, audio ou VFX devem registrar esses
itens no protocolo de Bosses/Rituais e passar pelo fallback low/balanced. O
primeiro escopo do sistema e a troca segura da ficha; automacoes de boss serao
adicionadas somente quando a regra da fase estiver aprovada.

## Gates obrigatorios

Antes de promover uma build que altere Estagios:

- `npm run smoke:stages`;
- `npx tsc --noEmit`;
- `npm run lint -- --max-warnings=999`;
- `npm run smoke:multiplayer`;
- `npm run smoke:ui`;
- `npm run smoke:release`;
- fechar o executavel oficial antes de sobrescrever
  `release\win-unpacked`;
- atualizar `docs/planejamento/FUSHI_App_Readiness_Alpha84.xlsx`.

O smoke de Estagios deve provar criação, troca, retorno ao Padrão, renome,
proteção contra exclusão indevida, snapshot não recursivo e remoção do
catalogo no payload público.
