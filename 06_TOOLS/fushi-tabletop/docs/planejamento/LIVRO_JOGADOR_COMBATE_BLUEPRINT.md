# Livros FUSHI - controle editorial e combate publico

Atualizado em: 2026-07-30

Este arquivo nao e uma segunda fonte de regras. Ele registra o estado editorial,
os limites de sigilo e os gates que protegem os dois volumes. O texto exibido no
app e usado nos PDFs vive somente em `src/data/rulebook`.

## Fontes ativas

- Regras publicas e secretas: `src/data/rulebook/*.json`.
- Combat V2: `docs/fushi-system/FUSHI_COMBAT_V2.md`.
- Inventario: `docs/fushi-system/FUSHI_INVENTORY_SYSTEM_V1.md`.
- Buffs, debuffs e condicoes: `src/data/statusCatalog.ts`.
- Builds: `docs/fushi-system/FUSHI_BUILD_SYSTEM_V1.md` e catalogos associados.
- Lore e campanha: fontes primarias em `01_LORE` e documentos Canon aprovados.

Nenhum texto deste controle pode substituir uma dessas fontes.

## Estado verificado da Alpha.91

- Livro do Jogador: 16 capitulos publicos e 8 atalhos.
- Livro do Mestre: 19 capitulos confidenciais e 8 atalhos.
- Compendio do Mestre: 41 NPCs com build e 55 fichas reais no workspace atual.
- PDFs gerados a partir dos mesmos JSONs usados pelo app.
- Smoke da release compara a contagem empacotada com a fonte real; nao usa
  quantidade fixa.
- Auditoria publica bloqueia termos de reencarnacao, posse, progressao oculta e
  distribuicao secreta de itens.

## Regras publicas travadas

- Atributo 0: role 2d20 e use o menor.
- Atributo 1 ou maior: role essa quantidade de d20 e use o maior.
- Pericias usam bonus fixos `+0`, `+5`, `+10` ou `+15`.
- Ataque fisico direto usa Luta no corpo a corpo ou Pontaria a distancia.
- Critico dobra somente os dados de dano. Bonus fixos nao dobram.
- Bloqueio reduz dano pelo bonus de Fortitude, com teto normal 15.
- Esquiva e uma Reacao fixa: `CA atual + AGI + Reflexos`; nao rola dados.
- Contra-ataque exige que o ataque inimigo falhe contra a CA.
- Coreografia e regra central.
- Ataque de oportunidade padrao existe em manada ou por regra explicita.
- Vida 0 causa Desmaiado e inicia tres tentativas de estabilizacao.
- FUSHI e publico como recurso de Habilidades e Rituais liberados.
- Builds sao integracoes permanentes por itens e nao classes rigidas.
- Basico, Avancado, Ascensao e Cataclisma sao leituras publicas de perigo, sem
  revelar as faixas numericas secretas do Mestre.

Alteracao numerica ou mecanica exige aprovacao do Mestre e atualizacao da fonte
canonica antes de regenerar os livros.

## Sigilo obrigatorio do Jogador

O volume publico nao pode revelar:

- reencarnacao, posse, corpos receptores ou protocolo depois da morte;
- XP oculto, marcos secretos ou natureza real dos protagonistas;
- quantidade, posicao e distribuicao dos itens pelo MUN;
- estatisticas secretas de NPCs, bosses, Cataclismas ou fases futuras;
- metaplot, informacao ainda nao descoberta ou conducoes do Escudo do Mestre.

O Jogador pode saber que morte tem consequencias e que existem descobertas
futuras, sem receber o procedimento oculto.

## Estado editorial

- `canon`: regra aprovada e aplicada.
- `playtest`: regra utilizavel, ainda observada em mesa real.
- `development`: estrutura planejada ou incompleta; aparece como
  `EM CONSTRUCAO` no app e no PDF.

Um alerta nunca vira `canon` apenas para deixar a auditoria verde.

## Decisoes antigas superadas

- Bloqueio por `floor(CA_base / 2)` pertence ao Combat V1 e nao deve reaparecer.
- Esquiva com rolagem de dados foi superada pela formula fixa do Combat V2.
- As contagens `15/18` pertencem a uma edicao anterior; a fonte atual e
  `16/19`.
- O nome Alpha84 dos arquivos PDF e um caminho legado de exportacao. O conteudo
  e a edicao interna devem sempre nascer dos JSONs atuais.

## Fechamento obrigatorio

```powershell
npm run books:build
npm run books:audit
npm run smoke:rulebooks
npm run smoke:rulebooks:release
```

Depois de alteracao no app, fechar o executavel oficial, empacotar em
`release/win-unpacked` e repetir o smoke da release real.
