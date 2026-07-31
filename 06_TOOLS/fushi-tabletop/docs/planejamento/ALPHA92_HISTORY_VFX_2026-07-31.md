# Alpha 0.1.0-alpha.92 - Historia e VFX

## Decisao fechada

Esta build separa duas coisas que nao podem ser misturadas:

1. **Cronicas da Ilha**: leitura publica. Mostra somente acontecimentos que os protagonistas presenciaram ou que o Mestre liberou.
2. **Livro da Historia**: leitura exclusiva do Mestre. Guarda continuidade, bastidores, segredos, lacunas e planejamento. O conteudo nunca entra no payload publico.

A Sessao 4 continua marcada como pendente porque ainda nao existe um log canonico consolidado. O app nao transforma treinamento preparado, simulacao ou ficha em acontecimento narrativo.

## Fontes de verdade

- Publico: `src/data/history/player-history.json`
- Mestre: `src/data/history/master-history.json`
- Modelo compartilhado: `src/data/history/index.ts`
- Rota no app: `#/fluxo/historia`
- PDF publico: `output/pdf/FUSHI_Cronicas_da_Ilha_Alpha92.pdf`
- PDF do Mestre: `output/pdf/FUSHI_Livro_da_Historia_Alpha92.pdf`

O texto publico passa por uma lista de termos proibidos no smoke. A lista nao e uma substituta para revisao de sigilo: qualquer novo segredo deve ser colocado somente no volume do Mestre e ganhar teste de privacidade.

## VFX de mesa

O catalogo declarativo fica em `src/data/vfx/catalog.json` e atualmente possui dez presets leves:

- Onda de FUSHI
- Aura Ciano
- Impacto Cortante
- Pulso de Cura
- Falha de Poder
- Mudanca de Fase
- Relampago
- Chuva de Brasas
- Sopro Congelante
- Veu Sombrio

Cada preset informa `id`, descricao, categoria, cor, duracao, escopo, status e variante visual. O catalogo e a unica fonte para a biblioteca da Mesa; nao criar efeitos soltos diretamente no JSX.

### Regra de ciclo de vida

- Preview e local: nao altera a sessao nem aparece para outros jogadores.
- Broadcast do Mestre e publico quando o escopo permitir.
- Todo evento publicado leva `vfxExpiresAt`.
- Um VFX vencido e descartado pelo normalizador da sessao.
- Ao publicar um novo pulso, o pulso anterior e removido da fila visual.
- Parar o efeito publica somente um clear curto.
- Reabrir a Mesa ou reconectar nao repete o ultimo pulso.
- VFX nunca altera ficha, build, mapa, iluminacao ou estado canonico.

Esse contrato evita que um efeito visual temporario vire estado persistente ou reapareca em cada troca de cena.

## Gatilhos de qualidade

Antes de promover uma mudanca de Historia/VFX:

```powershell
npm run lint -- --max-warnings=999
npm run build
npm run smoke:history-vfx
npm run smoke:history-vfx:release
npm run smoke:rulebooks
npm run smoke:multiplayer
npm run smoke:interludes
npm run smoke:lighting
```

Depois, fechar o executavel oficial e promover para `release\\win-unpacked`. O smoke empacotado precisa confirmar:

- jogador sem seletor ou texto do Mestre;
- Mestre com o volume completo;
- preview VFX somente local;
- broadcast visivel uma vez para os participantes;
- clear sem replay depois de reconnect;
- nenhuma regressao em troca de mapa, interludio, dia/noite ou multiplayer.

## Fora do escopo desta build

MSC/audio permanece deliberadamente fora desta entrega. A reorganizacao sera feita depois do teste fisico da alpha.92, com exemplos reais de uso durante a sessao. Nao criar taxonomia nova de MSC, nao mover audios e nao adicionar uma segunda fonte de verdade antes dessa etapa.

## Fechamento

Esta build e considerada tecnicamente pronta somente depois de lint, build, smokes de fonte, smokes empacotados, auditoria de conteudo e atualizacao da planilha de readiness. A aprovacao narrativa e o teste fisico continuam sendo do Mestre.

### Evidencia alpha.92 (31/07/2026)

- `npm run lint -- --max-warnings=999`: aprovado.
- `npm run build`: aprovado.
- `npm run books:build` + `npm run books:audit`: quatro volumes, sem paginas vazias, cortes, vazamento de sigilo ou rotulos quebrados.
- `npm run smoke:history-vfx` + `npm run smoke:history-vfx:release`: aprovados; seis secoes publicas, oito do Mestre e dez presets VFX.
- `npm run smoke:rulebooks:release`: aprovado; jogador sem segredos e Mestre com hub avancado.
- `npm run smoke:ui`: aprovado; launcher, mesa, ficha, builds, janelas, combate, dados e jogador.
- `npm run smoke:multiplayer`: aprovado; cinco jogadores, reconexao, ACK/fila, ficha nos dois sentidos e eventos privados/publicos.
- `npm run smoke:interludes` + `npm run smoke:lighting`: aprovados no executavel real.
- `npm run smoke:release` + `npm run smoke:release:deep`: aprovados; 12/12 cenarios deep e nenhuma tela branca acionavel.
- `npm run perf:release`: low, balanced e ultra estaveis; readiness medido em 374/352/350 ms, respectivamente.
- `npm run release:assets`, `npm run base:diagnose`, `npm run asset:audit` e `npm run content:audit`: aprovados.
- `npm audit`: tres alertas altos transitivos permanecem registrados; nenhuma atualizacao de dependencia foi feita nesta build.
- Executavel promovido: `release\\win-unpacked\\RPG FUSHI.exe`, `0.1.0-alpha.92`, carimbo `31/07/2026 17:30:00`.

O proximo portao e o teste fisico do Mestre com pelo menos um jogador. A reorganizacao do MSC/audio continua fora desta build e comeca somente depois desse teste.
