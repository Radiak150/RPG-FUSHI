# Alpha.84 - Core vs Campaign Pack

Data: 2026-06-16

Este documento trava a alpha.83 como baseline estavel e define o plano conservador
para alpha.84: reduzir peso sem quebrar Mesa, MUN, Base, interludios,
multiplayer ou `fushi-library://assets`.

## Baseline alpha.83

Build estavel congelada em:

- `release-codex/baselines/alpha83-stable-20260616/win-unpacked/RPG FUSHI.exe`
- `release-codex/baselines/alpha83-stable-20260616/installers/RPG-FUSHI-Setup-0.1.0-alpha.83-x64.exe`
- Manifesto de hashes: `release-codex/baselines/alpha83-stable-20260616/baseline-manifest.json`

Essa build e a referencia para regressao. Se alpha.84 quebrar algo, comparar
com ela antes de mexer em logica da mesa.

## Estado confirmado antes do alpha.84

| Area | Estado | Evidencia |
| --- | --- | --- |
| Mesa/multiplayer | Estavel | Teste fisico com 2 jogadores respondeu bem; smokes cobrem os dois sentidos principais. |
| Regua | Estavel | Sync Mestre/Jogador e Jogador/Mestre reforcado no smoke multiplayer. |
| MUN interludios | OK tecnico | 119 interludios automaticos, 119 thumbs validas, 0 issues, 0 thumbs vazias. |
| Base | OK tecnico | 8 bases, 24 topdowns, 8 chegadas vazias, 16 chegadas de fase. |
| Release core | OK tecnico | `release:assets` validou 328.8 MB core e 48 audios decodificados. |
| Bundle | OK tecnico | `bundle:audit` validou dist 4327.9 KiB e Mesa abaixo de 400 KiB. |
| Pack campanha | Precisa otimizar | 4.3 GB; 101 originais pesados cobertos por WebP. |

## Como separar com cuidado

1. Manter no core somente o que o app precisa para abrir, diagnosticar,
   reparar, entrar na mesa e evitar tela quebrada.
2. Manter Base no core por enquanto, porque Base e MUN ainda sao parte do
   fluxo principal de mesa. A Base so sai do core quando existir garantia de
   pack obrigatorio instalado antes da mesa abrir.
3. Mover topdowns PNG 4000 originais para `source/ultra pack`, nao para o
   runtime padrao. O runtime deve usar WebP/thumbs.
4. Manter `fushi-library://assets` como API canonica de asset. O split deve
   mudar onde o arquivo mora, nao mudar como a UI referencia o arquivo.
5. Todo pack novo precisa ter manifest, thumbs, derivados leves, licencas e
   smoke de release isolado por `FUSHI_APPDATA_ROOT`.
6. Nao remover assets do core sem um smoke que prove que a release isolada
   encontra o fallback ou o pack correspondente.

## Classificacao alvo

| Bloco | Destino | Motivo |
| --- | --- | --- |
| Electron, React, dados minimos, UI, launcher | Core | Necessario para abrir e reparar o app. |
| Dados de sistema, fichas, multiplayer, storage | Core | Estado vivo precisa existir sem pack extra. |
| Base manifest, thumbs, arrivals e WebP | Core temporario | Evita quebrar Liberar Base ate o pack obrigatorio estar robusto. |
| MUN thumbs e mapas WebP | Campaign runtime pack | Conteudo de campanha, jogavel e leve. |
| PNG 4000 originais | Source/Ultra pack | Pesado; serve para ultra, reprocessamento ou arquivo fonte. |
| Audio UI/SFX minimo | Core | Feedback basico do app. |
| Musicas por personagem/cena | Campaign audio pack | Conteudo emocional, expansivel por campanha. |
| GLB pesado | Ultra/object pack | Low/balanced usam proxy 3D. |
| Topdown animado/VFX video | VFX pack com fallback | Precisa budget GPU/VRAM e fallback estatico. |
| Docs, planilhas, reports | Fora do installer | Suporte de producao, nao runtime. |

## Gates do alpha.84

Antes de promover alpha.84:

```powershell
npm run content:audit
npm run mun:interludes:audit
npm run base:diagnose
npm run asset:audit -- --top=30
npm run audio:audit:deep
npm run bundle:audit
npm run lint -- --max-warnings=999
npm run build
npm run smoke:ui
npm run smoke:multiplayer
npm run release:installer
npm run release:assets
npm run smoke:release
npm run smoke:release:deep
```

## O que falta decidir

| Prioridade | Item | Decisao pendente |
| --- | --- | --- |
| P1 | Pack runtime leve | Gerar um manifest que inclua WebP/thumbs e exclua PNG 4000 originais. |
| P1 | Pack source/ultra | Definir se fica separado localmente ou como download opcional. |
| P1 | Base fora do core | So depois que o launcher garantir pack obrigatorio antes de abrir mesa. |
| P2 | Audio por personagem | Preencher os 5 slots de tema quando o pipeline de audio estiver fechado. |
| P2 | Topdown animado | Criar formato declarativo com video + fallback estatico. |
| P2 | VFX de dominio | Criar preset com particulas, audio e sincronizacao multiplayer. |
| P3 | Protocolo multiplayer unificado | Consolidar WS/HTTP/polling em patch/eventSeq depois do split de assets. |

