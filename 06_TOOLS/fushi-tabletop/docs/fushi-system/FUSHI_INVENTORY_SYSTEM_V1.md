# FUSHI - Inventario, porte e mochila V1

Status: CANON e implementado na ficha.

Escopo: capacidade, porte, penalidade de deslocamento, persistencia e
sincronizacao multiplayer. O sistema MSC nao faz parte desta etapa e deve ser
desenhado com o Mestre antes de qualquer implementacao.

## Fonte unica de calculo

O app usa `src/lib/inventoryCapacity.ts` como unica fonte para:

- capacidade exibida na ficha;
- alerta de combinacao invalida;
- deslocamento efetivo;
- compatibilidade com itens antigos;
- testes automatizados.

O calculo nao altera `deslocamento` nem remove itens. Ele deriva um resultado
efetivo a partir da ficha canonica. Assim, retirar uma mochila ou um item
restaura o valor correto sem acumular penalidade.

## Conversoes

| Porte | Ocupacao |
| --- | ---: |
| Pequeno | 1/3 de medio |
| Medio | 1 medio |
| Grande | 2 medios |
| Grande+ | Regra exclusiva |

Referencias visuais:

- Pequeno: cabe na mao ou junto ao corpo.
- Medio: aproximadamente o tamanho de um braco.
- Grande: aproximadamente metade do corpo.
- Grande+: tamanho do corpo ou maior; exige foco para carregar.

## Inventario comum

Capacidade: 3 medios.

Combinacoes validas de referencia:

- 9 pequenos;
- 3 medios;
- 1 grande + 1 medio;
- 1 grande + 3 pequenos;
- 1 Grande+ + 3 pequenos.

Grande+ remove a possibilidade de carregar medio ou grande ao mesmo tempo.
Mais de um Grande+ exige decisao manual do Mestre.

## Mochila normal

- Adiciona 3 medios, total de 6.
- Cada medio equivalente acima dos 3 comuns aplica -2 m.
- Carga de 6 medios aplica -6 m.
- Grupos parciais de pequenos acima da base arredondam a penalidade para cima.
- Capacidade excedida gera alerta e nunca apaga o item.

## Mochila+

- A referencia de carga e `3 + (deslocamento base - 1)` medios equivalentes:
  ela mostra quanto a pessoa consegue carregar antes de chegar a 1 m.
- Mochila+ nao cria um teto de itens. Depois que o deslocamento chega a 1 m,
  a pessoa pode continuar carregando; a carga adicional nao reduz mais o
  deslocamento.
- Cada medio equivalente acima dos 3 comuns aplica -1 m.
- Deslocamento efetivo nunca fica abaixo de 1 m.
- Com 12 m: 14 medios, 42 pequenos ou 7 grandes.
- Com Grande+, medio e grande continuam proibidos; pequenos usam a cota
  calculada. No exemplo de 12 m: Grande+ + ate 42 pequenos.

## Compatibilidade

Campos adicionados:

- `inventarioDetalhado[].porte`
- `inventarioDetalhado[].quantidade`
- `inventarioPerfil.mochila`

Fichas antigas continuam validas. Item antigo sem porte:

1. nao e reescrito;
2. aparece como `Porte pendente`;
3. conta como medio por seguranca;
4. gera aviso ate ser classificado.

O perfil de mochila faz parte da ficha canonica e e permitido no protocolo de
edicao remota do jogador. Corpos compartilhados compartilham o mesmo inventario
e o mesmo perfil de mochila.

## Matriz de aceitacao

| Caso | Esperado |
| --- | --- |
| 9 pequenos, sem mochila | 3/3, sem penalidade |
| 3 medios, sem mochila | 3/3, sem penalidade |
| 1 grande + 1 medio | 3/3, sem penalidade |
| 1 Grande+ + 3 pequenos | valido |
| 1 Grande+ + 1 medio | invalido, sem apagar dados |
| 6 medios, mochila normal, base 9 m | 6/6, efetivo 3 m |
| 42 pequenos, Mochila+, base 12 m | 14/14, efetivo 1 m |
| 60 pequenos, Mochila+, base 12 m | valido, efetivo 1 m |
| item antigo sem porte | medio provisoriamente + aviso |

Smoke oficial: `npm run smoke:inventory`.
