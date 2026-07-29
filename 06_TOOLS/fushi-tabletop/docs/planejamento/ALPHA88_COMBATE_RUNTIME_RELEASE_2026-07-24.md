# Alpha.88 - Combate em tempo real

Data: 2026-07-25

## Escopo fechado

- Rolagem por atributo: 0 usa 2d20 e o menor; 1 usa 1d20; 2 ou mais usa o maior.
- Ataques podem oferecer formas diferentes de teste, como Luta corpo a corpo e Pontaria a distancia.
- Resolver ataque separa defesa, dano e resultado.
- A resolucao identifica atacante e alvo, mostra custos e recursos antes/depois,
  permite ao Mestre corrigir o dano final e so altera a ficha depois da confirmacao.
- Cancelar uma resolucao nao consome recurso nem altera a ficha.
- Testes contra CA, DT fixa e teste resistido possuem fluxos distintos.
- Build Absorvida participa dos bonus de pericia, iniciativa e dano conforme contexto.
- Analise Cirurgica fica ativa para um alvo, dobra o proximo dano e e consumida na tentativa.
- Multiplicadores de dano respeitam a ordem canonica: bonus positivo entra antes
  do multiplicador; penalidade negativa entra depois; o resultado nunca fica negativo.
- Vida Sugada abre a segunda etapa de cura, limita a transferencia ao dano
  efetivamente retirado da Vida do alvo e permite escolher o receptor valido.
- Distancia, categoria de alcance e posicoes usadas no calculo ficam congeladas
  no instante da rolagem para o movimento posterior do token nao reescrever o resultado.
- Impactos de dano, cura, queda e Habilidade possuem retorno visual publico na mesa.
- O seletor de personagem do painel de combate pode alternar entre fichas sem
  retornar ao participante preparado por uma requisicao antiga.
- Jogadores J1-J5 em zero de Vida recebem estado de queda com tres sucessos ou
  falhas dentro da ficha; tres sucessos restauram 1 de Vida e estabilizam, enquanto
  tres falhas encerram o estado em cinza. Com 2 ou mais de Vida, a queda e removida.
- O recibo multiplayer e privado: Mestre ve a transacao completa e cada jogador
  envolvido recebe somente sua propria alteracao de recurso.
- Acoes do participante no TURN ficam recolhidas e abrem a ficha no ponto correto sem ativar a acao.
- Itens absorvidos podem receber um nome de exibicao sem alterar catalogo, raridade, passiva ou modificadores.
- Janelas abertas antes de uma rolagem retornam; janelas ja minimizadas permanecem minimizadas.
- Acoes antigas de NPC recebem leitura de compatibilidade, sem reescrever lore ou efeitos.
- Novos Ataques, Habilidades e Rituais usam campos estruturados de teste, alcance,
  custo, dano, cura e efeito para alimentar o mesmo fluxo sem depender de texto livre.

## Validacoes aprovadas

- `npm run build`
- `npm run lint -- --max-warnings=999`
- `npm run smoke:combat-runtime`
- `npm run smoke:combat-v2`
- `npm run smoke:combat-flow:ui`
- `npm run smoke:builds`
- `npm run smoke:events`
- `npm run smoke:training:ui`
- `npm run smoke:ui`
- `npm run smoke:multiplayer`
- `npm run base:diagnose`
- `npm run asset:audit -- --top=12`
- `npm run content:audit`
- `npm run release:assets`
- `npm run smoke:rulebooks:release`
- `npm run smoke:release`
- `npm run smoke:release:deep` (11/11 cenarios)

Release validada:

- `release/win-unpacked/RPG FUSHI.exe`
  - 226666496 bytes
  - 2026-07-25 17:37:46
  - SHA-256 `7D6FCF2AA282AA1CFAF543AF0C607A6EE8903C49E0F63F5F448A31DA0DB7C971`
- `release/RPG-FUSHI-Setup-0.1.0-alpha.88-x64.exe`
  - 543554900 bytes
  - 2026-07-25 17:39:54
  - SHA-256 `409AF23134A815E34C8B712887ED1E56B1C77FB926E2A7787C8CB7C38016575A`
- `release/nsis-web/RPG-FUSHI-Web-Setup-0.1.0-alpha.88-x64.exe`
  - 850888 bytes
  - 2026-07-25 17:38:58
  - SHA-256 `981436DB17A694A3029F795434A69EB6D8892FD983A67B6614524B9ACCF422F9`

O painel `docs/planejamento/FUSHI_App_Readiness_Alpha84.xlsx` foi regenerado
com a auditoria final de conteudo e atualizado para Alpha.88. As lacunas de
conteudo legado continuam registradas como FOCO, sem falso positivo.

## Patch de estabilidade - 2026-07-26

- `Ctrl+A` na Mesa remonta somente a arte visual do mapa. Mapa ativo, tokens,
  camera, janelas e estado da sessao permanecem preservados.
- Interludios automaticos do MUN priorizam a imagem semantica do local. Estatuas
  do Litoral usa a imagem frontal cadastrada no MUN, enquanto o topdown fica
  reservado para a mesa.
- Marcas e efeitos agora possuem origem, alvo, tipo, icone e descricao
  estruturados. A ficha separa `Seus efeitos` de `Efeitos aplicados em voce`.
- A origem autorizada pode cancelar o proprio efeito pelo fluxo remoto; o Mestre
  continua com autoridade total. IDs internos nao entram no estado publico.
- O envio de rolagem deixou de disparar duas ordens concorrentes de minimizar,
  removendo flick e restauracao incoerente das janelas.

Validacoes deste patch:

- `npm run build`
- `npm run lint -- --max-warnings=999`
- `npm run smoke:ui`
- `npm run smoke:multiplayer`
- `npm run smoke:release`
- `npm run smoke:interludes`
- `npm run smoke:release:deep` (11/11 cenarios)
- `npm run base:diagnose`
- `npm run asset:audit -- --top=12`
- `npm run content:audit`

Release `win-unpacked` atual:

- `release/win-unpacked/RPG FUSHI.exe`
  - 226666496 bytes
  - 2026-07-26 08:05:38
  - SHA-256 `6E4D9417196376047FEC3C59C899FAB7F4342308E91F62E1BB941D3565BE45E7`

Os instaladores listados acima continuam sendo os artefatos de 2026-07-25 e nao
foram substituidos neste patch. A planilha oficial recebeu os tres novos gates
na aba `Checklist_Teste`, sem apagar as pendencias de teste fisico.

`npm audit --json` terminou com 0 vulnerabilidades criticas, 0 moderadas e
21 altas residuais. Dezenove entradas pertencem a cadeia de build/lint; duas
sao o mesmo alerta de modo RSC propagado por `react-router` e
`react-router-dom`, recurso que o app Electron atual nao usa. A correcao
automatica proposta troca versoes principais ou rebaixa dependencias; nenhuma
alteracao forcada foi aplicada nesta release estabilizada.

## Pendencias preservadas

A auditoria `npm run combat:audit` encontrou 259 lacunas reais entre as 347 acoes
das 56 fichas. A maioria e ausencia explicita de Falha, Reacao ou Teste
estruturado em conteudo legado. O runtime consegue ler os formatos antigos quando
ha informacao suficiente, mas a auditoria nao converte ausencia em dado inventado.

Fonte do relatorio:

- `docs/fushi-system/NPC_COMBAT_ACTION_AUDIT.md`
- `docs/fushi-system/NPC_COMBAT_ACTION_AUDIT.json`

## Regras preservadas

- Jogador nao move token.
- Ficha e canonica entre Fluxo Principal, Mesa e multiplayer.
- Mestre para Jogador e Jogador para Mestre continuam cobertos por smoke.
- Nenhuma lore, efeito canonico ou protocolo de admissao multiplayer foi reescrito.
- Os seis alertas de divergencia de conteudo continuam abertos para revisao do
  Mestre; a build nao converteu nenhum deles em falso `OK`.
