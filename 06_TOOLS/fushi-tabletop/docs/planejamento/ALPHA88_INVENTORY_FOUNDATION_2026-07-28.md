# Alpha 88 - Fundacao de Inventario

Status: IMPLEMENTADO E VALIDADO EM `release/win-unpacked`.

Este checkpoint registra a regra de inventario solicitada pelo Mestre antes de
qualquer trabalho futuro de MSC. O objetivo e manter uma unica matematica para
ficha, Mesa, turno, Livro, multiplayer e futuras automacoes, sem criar uma
segunda regra paralela.

## Regra canonica

- Inventario comum, sem mochila: 3 espacos medios.
- 3 pequenos equivalem a 1 medio.
- 2 medios equivalem a 1 grande.
- Um Grande+ exige retirar todos os medios e grandes. No inventario comum ele
  pode carregar ate 3 pequenos junto.
- Item sem porte em ficha antiga conta provisoriamente como medio e recebe
  alerta de classificacao. O app nao apaga nem reescreve o item.

Exemplos validos no inventario comum:

- 9 pequenos;
- 3 medios;
- 1 grande + 1 medio;
- 1 grande + 3 pequenos;
- 1 Grande+ + 3 pequenos.

## Mochilas

### Mochila normal

- Adiciona 3 medios, totalizando 6 medios equivalentes.
- Cada medio equivalente acima dos 3 espacos comuns reduz 2 m de deslocamento.
- Com 6 medios ocupados, a penalidade total e -6 m.
- Pequenos sao agrupados de tres em tres; um grupo parcial ja conta para a
  penalidade.

### Mochila+

- Nao possui um teto fixo de itens.
- Cada medio equivalente acima dos 3 comuns reduz 1 m de deslocamento.
- O deslocamento nunca cai abaixo de 1 m.
- A referencia visual antes do piso e:
  `3 + (deslocamento base - 1)` medios equivalentes.
- Com 12 m de deslocamento base, a referencia e 14 medios, ou 42 pequenos.
- Depois de chegar a 1 m, a carga adicional continua permitida e nao reduz
  mais o deslocamento.
- Grande+ continua exclusivo: pode dividir espaco somente com pequenos.

Na interface, a referencia da Mochila+ aparece como "piso 1 m; sem teto de
carga" quando o personagem ja atingiu o piso. Isso evita interpretar a
referencia como um bloqueio artificial.

## Integracao estrutural

Fonte unica de calculo:

- `src/lib/inventoryCapacity.ts`

Campos canonicos:

- `inventarioDetalhado[].porte`
- `inventarioDetalhado[].quantidade`
- `inventarioPerfil.mochila`

Superficies que consomem o mesmo resultado:

- ficha editavel e ficha de leitura;
- deslocamento mostrado no turno;
- compendio do Livro;
- ficha compartilhada/corpo compartilhado;
- patch Mestre -> Jogador e Jogador -> Mestre;
- validacao do workspace e migracao de itens antigos.

O calculo deriva o deslocamento efetivo sem alterar o deslocamento base. Ao
remover item ou mochila, a ficha volta ao valor original sem penalidade
acumulada. Nenhuma regra nova de movimento de token foi criada nesta etapa.

## Contratos de seguranca

- Item Grande+ misturado com medio, grande ou item legado e marcado como
  invalido; os dados permanecem intactos para decisao do Mestre.
- Mais de um Grande+ gera alerta.
- A Mochila+ nao transforma carga em exclusao silenciosa; apenas aplica o
  piso de movimento.
- O perfil de mochila viaja no mesmo patch canonico da ficha.
- O MSC permanece deliberadamente fora desta entrega e sera desenhado com o
  Mestre antes de qualquer implementacao.

## Aceitacao automatica

Smoke dedicado:

`npm run smoke:inventory`

Casos cobertos:

- 9 pequenos, 3 medios;
- grande + medio;
- grande + 3 pequenos;
- Grande+ + 3 pequenos;
- Grande+ com medio ou pequeno excedente;
- Mochila normal com 6 medios e -6 m;
- Mochila+ com 42 pequenos em 12 m;
- Mochila+ com 60 pequenos, ainda valida em 1 m;
- item legado sem porte, com alerta e sem mutacao;
- entrada original preservada depois do calculo.

## Proximo trabalho seguro

1. Validar a edicao de porte, quantidade e mochila em uma ficha Mestre e uma
   ficha Jogador na mesma sessao.
2. Confirmar que o deslocamento efetivo exibido nao altera a movimentacao
   canonica nem permite que o Jogador mova token.
3. So depois transformar a regra em automacoes de itens, quando o catalogo de
   itens estiver aprovado.
4. MSC fica em uma etapa separada, com desenho aprovado pelo Mestre antes de
   qualquer codigo ou regra.
