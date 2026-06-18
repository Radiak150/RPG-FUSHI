# FUSHI Damage Balance Audit V1

Objetivo: segurar a matematica de dano, vida e CA antes de alterar qualquer NPC canonico.

Regra de seguranca: este documento nao muda fichas. Ele define alvo de balanceamento para aprovacao do mestre.

## 1. Fonte de escala

Usar como base `C:\RPG FUSHI\RPG-FUSHI\01_LORE\npcs\Regras importante Powerscaling NPCs (para Simulacao).md.txt`.

Termo oficial: **Niveis de Poder**.

Resumo operacional:

| Nivel de Poder | Vida esperada | FUSHI esperado | CA esperada | Papel |
| --- | ---: | ---: | ---: | --- |
| Basico | 20 a 30 | 10 a 25 | 16+ | humano treinado / inicio real |
| Avancado | 130 a 150 | 75 | 20+ | dobro pratico de Basico |
| Ascensao | 250 a 400 | 100 a 150 | 25+ | boss/elite de arco |
| Cataclisma | 450+ ou fases | 150+ | 30+ | escala de grupo, evento ou boss final |

Alvo do mestre:

- Avancado deve parecer cerca de 2x mais forte que Basico.
- Cataclisma sozinho deve ser quase impossivel contra 5 Fichas Avancadas sem preparo.
- 8 Fichas Avancadas devem dar trabalho a um Cataclisma.
- 10 Fichas Avancadas devem ficar pareo a pareo contra Cataclisma.

## 2. Matematica rapida de dado

Media de dano:

| Dado | Media |
| --- | ---: |
| 1d4 | 2.5 |
| 1d6 | 3.5 |
| 1d8 | 4.5 |
| 1d10 | 5.5 |
| 1d12 | 6.5 |

Media de pools de d20 pegando maior:

| Pool | Media aproximada |
| --- | ---: |
| 1d20 | 10.5 |
| 2d20 maior | 13.8 |
| 3d20 maior | 15.5 |
| 4d20 maior | 16.5 |
| 5d20 maior | 17.2 |

Chance de sucesso critico pegando maior:

```text
crit = 1 - (19/20)^pool
```

Chance de falha critica em pool normal:

```text
falha_critica = (1/20)^pool
```

Chance de falha critica quando pega o pior:

```text
falha_critica_pior = 1 - (19/20)^pool
```

Isso faz coreografia extrema ser forte, mas perigosa.

## 3. Checagem de turnos para cair

Formula simples:

```text
turnos_para_cair = vida_do_alvo / dano_medio_do_grupo_por_turno
```

Para boss:

```text
dano_medio_do_grupo = soma(dano_medio_esperado_de_cada_atacante_que_realmente_acerta)
```

Nao usar apenas dano maximo. O maximo serve para ver se existe combo quebrado.

## 4. Diagnostico atual do Ryoku

Exemplo encontrado na lore: `Corte da Existencia` aparece como `3d12 + 10`.

Matematica:

- Media: `3 * 6.5 + 10 = 29.5`.
- Maximo: `3 * 12 + 10 = 46`.
- Critico dobrando dano maximo: `92`.

Contra Ficha Avancada com 150 de Vida:

- Um acerto perfeito de `92` nao derruba sozinho.
- Isso esta fraco para Cataclisma se a regra desejada e "critico/perfeito Cataclisma mata ou quase mata Avancado".

Conclusao:

- Nao alterar Ryoku ainda.
- Criar ficha mecanica de fase aprovada depois.
- Cataclisma precisa de pelo menos uma regra de fase, execucao, ferida cataclismica ou dano percentual quando acerta perfeito.

## 5. Proposta de regra Cataclisma

Sem mexer em ficha canonica, a regra de fase recomendada e:

Acerto comum Cataclisma:

- causa dano da ficha.
- aplica 1 condicao grave se passar 10+ acima da CA.

Acerto critico/perfeito Cataclisma contra Basico/Avancado:

- dano critico normal.
- se o alvo nao usou reacao defensiva valida, cai a 0 Vida.
- se usou Bloqueio, Esquiva ou Contra-ataque e sobreviveu, recebe Ferida Cataclismica.

Ferida Cataclismica:

- -5 em testes fisicos e de Vontade.
- cura comum nao remove.
- exige ritual, descanso seguro especial ou item raro.

Isso deixa Cataclisma assustador sem obrigar todo ataque comum a ser delete.

## 6. FUSHI imbuido e risco de quebra

Problema detectado:

- 5 Fichas Avancadas com 75 FUSHI poderiam tentar descarregar 375 de dano se nao houver trava.

Trava oficial recomendada:

- limite por Nivel de Poder conforme documento central;
- 1 descarga por turno;
- gasto acima de 10 precisa carga visivel;
- gasto acima de 25 precisa 2 turnos de carga;
- 51+ e ritual/fase/evento, nao ataque comum;
- se errar/esquivar, queima tudo;
- se interrompido, perde metade arredondada para cima.

Resultado esperado:

- FUSHI imbuido vira finalizador dramatico.
- Nao vira botao de matar boss sem preparo.

## 7. Proxima auditoria necessaria

Antes de aprovar rework de NPCs:

1. Extrair todas as habilidades com dano dos NPCs canonicos.
2. Classificar por Nivel de Poder.
3. Calcular media, maximo, critico e custo.
4. Comparar contra Vida/CA esperada.
5. Marcar cada habilidade como: ok, fraca, forte, quebrada ou precisa fase.
6. So depois propor alteracao de ficha ao mestre.

Nenhum NPC real deve ser modificado automaticamente nesta etapa.
