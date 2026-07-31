# Alpha.91 - Fechamento dos Livros

Data: 2026-07-30

## Escopo

Esta build fecha a revisão editorial e operacional dos dois livros do FUSHI
Tabletop. A fonte única continua sendo `src/data/rulebook/*.json`; o app e os
PDFs são derivados dela.

- Livro do Jogador: 16 capítulos, 28 páginas.
- Livro do Mestre: 19 capítulos, 392 páginas.
- Bibliografia: 17 entradas.
- Auditoria: sem páginas vazias, sem cortes de borda, sem vazamento de sigilo
  e sem rótulos editoriais internos (`DEVELOPMENT`/`CONSTRUCTION`).
- Smoke de release: 41 builds reais de NPC reconhecidas no pacote.

## O que foi consolidado

- Combat V2 permanece como base técnica ativa para CA, Bloqueio, Esquiva,
  crítico, manobras e escala de encontros.
- O Livro do Jogador publica somente regras de mesa e mantém segredos de
  campanha fora do volume público.
- Estados editoriais aparecem como `EM CONSTRUÇÃO` quando ainda exigem
  aprovação ou conteúdo do Mestre.
- O readiness não usa contagens fixas: o atualizador lê os capítulos dos JSONs
  e as páginas da auditoria disponível.
- A auditoria de PDF falha se um rótulo interno de implementação voltar a ser
  impresso no material final.

## O que não foi alterado

- Lore, Canon, premissa ou cronologia da campanha.
- Vida, dano, builds ou poderes de NPC sem aprovação explícita do Mestre.
- Movimento de tokens e permissões Mestre/Jogador.
- Protocolo multiplayer.
- Alertas de conteúdo ainda pendentes.

## Arquivos de saída

Os caminhos abaixo são mantidos por compatibilidade com o app e com o
workflow existente. O conteúdo interno é o da alpha.91; não foram criadas
cópias paralelas:

- `output/pdf/FUSHI_Livro_do_Jogador_Alpha84.pdf`
- `output/pdf/FUSHI_Livro_do_Mestre_Alpha84.pdf`
- `output/pdf/FUSHI_Rulebook_QA_Alpha84.json`

## Portões antes de promover

```powershell
npm run books:build
npm run books:audit
npm run smoke:rulebooks
npm run smoke:rulebooks:release
npm run lint -- --max-warnings=999
npm run build
npm run release:close
npm run release:dir
npm run release:stamp
npm run smoke:release
npm run smoke:release:deep
npm run smoke:multiplayer
```

Depois da execução, atualizar a planilha única
`docs/planejamento/FUSHI_App_Readiness_Alpha84.xlsx` sem criar outra
planilha.
