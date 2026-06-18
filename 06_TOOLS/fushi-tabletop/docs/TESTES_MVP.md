# Testes MVP

## Export/Import

1. Criar campanha teste.
2. Mover grupo no MUN.
3. Abrir MAP vinculado.
4. Vincular NPC como corpo de jogador.
5. Exportar campanha.
6. Importar como nova campanha.
7. Confirmar que campanha importada abre.
8. Confirmar MUN, MAP, grupos e vinculos.
9. Confirmar que `campaignId` nao conflita.
10. Confirmar que importar arquivo invalido mostra erro amigavel.

## Backup manual

1. Abrir Configuracoes.
2. Clicar em "Criar backup da campanha atual".
3. Confirmar download de `fushi-backup-[campaignId]-[data].json`.
4. Validar que o arquivo e JSON puro.
5. Confirmar que o snapshot aparece em "Restaurar backup".

## Backup automatico

1. Abrir uma campanha.
2. Aguardar o primeiro snapshot automatico.
3. Confirmar que a lista mantem no maximo 5 snapshots por campanha.
4. Alterar algo relevante na campanha/mesa.
5. Confirmar que um novo snapshot aparece depois do intervalo.

## Substituir campanha

1. Selecionar uma campanha ativa.
2. Importar um export valido.
3. Escolher "Substituir campanha atual".
4. Confirmar alerta explicito.
5. Confirmar que backup automatico foi baixado.
6. Confirmar que dados da campanha ativa foram substituidos.

## Restaurar backup

1. Criar ou aguardar snapshot interno.
2. Clicar em "Restaurar".
3. Confirmar o alerta.
4. Confirmar que o estado anterior foi preservado antes da restauracao.
5. Confirmar que a campanha volta para o estado do snapshot escolhido.

## Estado publico/privado

1. Verificar que `buildPublicPlayerState` nao inclui MUN completo.
2. Verificar que mapas em preparacao nao aparecem para jogador.
3. Verificar que tokens ocultos nao aparecem.
4. Verificar que player ve apenas mapa ativo.
5. Verificar que perfil do player nao inclui senha.
6. Verificar que `buildMasterState` preserva estado completo.

## Regressao basica

1. Rodar `npm.cmd run lint`.
2. Rodar `npm.cmd run build`.
3. Abrir mesa como mestre.
4. Abrir mesa como jogador.
5. Confirmar que export/import nao mudou fluxo visual principal.
