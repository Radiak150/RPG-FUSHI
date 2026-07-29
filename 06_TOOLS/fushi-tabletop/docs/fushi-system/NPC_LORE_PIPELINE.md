# Pipeline Seguro de NPCs da Lore

Este fluxo existe para impedir importacao torta de ficha. O TXT em
`01_LORE/npcs` continua sendo a verdade narrativa e mecanica original; o app
so deve receber uma ficha depois de comparacao e revisao.

## Comando

```powershell
npm run lore:npc:audit
npm run lore:npc:plan
npm run lore:npc:apply
npm run math:npc:plan
npm run math:npc:apply
```

Os comandos geram seis arquivos:

- `docs/fushi-system/NPC_LORE_AUDIT.md`: relatorio legivel com divergencias entre lore e workspace/autosave.
- `docs/fushi-system/NPC_LORE_IMPORT_CANDIDATES.json`: candidatos estruturados para futura importacao revisada.
- `docs/fushi-system/NPC_LORE_APPLY_PLAN.json`: plano exato do que sera alterado.
- `docs/fushi-system/NPC_LORE_APPLY_REPORT.md`: relatorio legivel do dry-run ou aplicacao real.
- `docs/fushi-system/NPC_MATH_BALANCE_PLAN.json`: plano exato da camada matematica aprovada.
- `docs/fushi-system/NPC_MATH_BALANCE_REPORT.md`: relatorio legivel do balanceamento numerico.

## Regras do Fluxo

1. O auditor nao altera lore, workspace ou app sozinho.
2. O parser ignora arquivos gerais de regra/powerscaling e procura apenas fichas reais.
3. A comparacao usa nome do personagem como chave inicial e mostra o id atual do app quando encontrar.
4. O relatorio compara atributos, vida, FUSHI, determinacao, CA, bloqueio, esquiva, pericias, inventario e habilidades.
5. Habilidades sao lidas como blocos de ficha, nao como frases soltas de efeito.
6. O aplicador cria backup fisico antes de escrever em `workspace.json`.
7. O aplicador preserva IDs, imagens, permissoes, vinculos, descricao e ataques existentes.
8. Se a lore nao trouxer inventario ou rituais estruturados, o aplicador preserva o que ja existe no app.
9. Recursos atuais so voltam ao maximo quando a ficha estava cheia; ficha ferida/gasta nao e curada por migracao.
10. Balanceamento automatico de lore fica limitado a sincronizar a ficha com a lore e classificar Nivel de Poder.
11. Balanceamento matematico aprovado roda separado e mexe somente em CA minima por escala, Bloqueio derivado, Esquiva derivada, DT minima por escala, rolagem atributo/pericia e dano direto Cataclisma abaixo da base.
12. Poder, nome, conceito, imagem, permissao, vinculo e identidade narrativa nao sao alterados pela camada matematica.

## Como Usar

1. Rode a auditoria.
2. Abra `NPC_LORE_AUDIT.md` e resolva primeiro personagens de sessao atual.
3. Confira o candidato respectivo no JSON antes de aplicar.
4. Se uma ficha tiver varias fases, dominio ou sub-ataques, revise manualmente o agrupamento antes de importar.
5. Rode `npm run lore:npc:plan` e confira o relatorio antes de aplicar.
6. Rode `npm run lore:npc:apply` apenas quando o plano nao mostrar apagamento suspeito.
7. Depois de aplicar lore em massa, rode `npm run math:npc:apply` para recolocar a matematica aprovada.

## Proxima Etapa

O aplicador ja atualiza a ficha canonica do Fluxo Principal em
`%APPDATA%/FUSHI/workspace.json`. A Mesa e o multiplayer herdam essa verdade
por `characterId`, sem criar ficha paralela.

O balanceador matematico tambem escreve no mesmo workspace real e cria backup
`workspace.backup-before-npc-math-balance-*.json`.
