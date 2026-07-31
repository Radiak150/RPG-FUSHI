# Alpha.90 - Estabilidade de mapas, Dia/Noite e iluminacao

Data: 2026-07-30

## Escopo fechado

Esta build tem dois portoes:

1. impedir que a Mesa fique sem uma imagem decodificada durante a troca de mapa;
2. introduzir Dia/Noite e pontos de luz como estado canonico da cena.

MSC, Livro e a futura biblioteca geral de VFX permanecem fora desta build.

## Contrato de troca de mapas

### Problema de raiz

A troca anterior desmontava a arte atual antes de a proxima imagem terminar de
carregar e decodificar. Em maquinas sob pressao, isso criava uma janela real sem
superficie valida. O Ctrl+A repetia a desmontagem e podia preservar a tela
branca em vez de recupera-la.

### Regra alpha.90

- a ultima imagem valida permanece visivel enquanto a proxima e preparada;
- uma candidata so substitui a imagem anterior depois de `load` e `decode`;
- falha em uma fonte tenta as fontes seguintes sem apagar a superficie valida;
- Ctrl+A incrementa a epoca visual sem desmontar o componente que guarda a
  ultima superficie boa;
- mapa, tokens, camera, sessao e estado multiplayer nao sao trocados durante a
  recuperacao;
- recuperacao total do renderer continua sendo o ultimo recurso depois de 18 s,
  nunca a primeira resposta.

O smoke `mun-interludes` mede a continuidade quadro a quadro durante Preparar
MAP. A aceitacao exige zero quadros sem uma imagem decodificada.

## Dia e Noite

O Relogio do MUN e a fonte de verdade publica:

- Dia: 06:00 ate 18:59;
- Noite: 19:00 ate 05:59;
- o atalho Dia define 08:00;
- o atalho Noite define 20:00.

Nao existe um segundo relogio visual separado. Mestre e Jogadores recebem a
mesma leitura de Dia/Noite pelo estado canonico do MUN.

## Iluminacao por cena

Cada cena possui:

- chave geral Liga/Desliga;
- lanterna do Mestre;
- ate 24 pontos de luz;
- posicao, raio, intensidade, cor e estado de cada ponto.

O estado fica em `TabletopSceneMetadata.lighting`, passa pelo normalizador da
sessao e segue no snapshot publico da cena. O Jogador recebe o resultado visual,
mas nao recebe controles de edicao.

### Controles

- icone de energia: liga ou desliga todas as fontes da cena;
- icone do mouse: liga ou desliga a lanterna do Mestre;
- `+`: cria um ponto de luz no centro e entra em edicao;
- icone de redimensionar ou `Ctrl+T`: edita os pontos;
- arrastar o centro move a luz;
- arrastar a alca altera o raio;
- inspetor altera raio, intensidade e cor, ou remove o ponto.

### Limites de desempenho

- no maximo 24 luzes por cena;
- a camada e SVG/CSS e nao cria uma segunda cena 3D;
- a lanterna ignora movimentos menores e limita a frequencia de escrita;
- alteracoes continuas sao agrupadas antes de persistir e sincronizar;
- durante o Dia, a camada escura e os brilhos nao sao renderizados.

## Privacidade e multiplayer

- somente Mestre local escreve iluminacao;
- Jogador nao recebe botoes, alcas ou inspetor;
- a posicao publica da lanterna e os pontos da cena chegam pelo snapshot
  canonico, sem protocolo paralelo;
- nenhuma regra de token, ficha, dado ou aceite multiplayer foi alterada.

## Portoes de validacao

Comandos obrigatorios:

```text
npm run build
npm run lint -- --max-warnings=999
npm run smoke:lighting
npm run smoke:interludes
npm run smoke:multiplayer
npm run smoke:release
npm run smoke:release:deep
npm run smoke:ui
npm run perf:release
npm run release:assets
npm run content:audit
npm run base:diagnose
npm run asset:audit -- --top=12
```

## Resultado alpha.90

- `npm run build`: aprovado;
- `npx tsc -b --pretty false`: aprovado;
- `npm run lint -- --max-warnings=999`: aprovado;
- `npm run smoke:lighting`: aprovado isolado e depois da bateria profunda;
- `npm run smoke:interludes`: aprovado no executavel real;
- `npm run smoke:multiplayer`: aprovado com cinco jogadores e reconexao;
- `npm run smoke:release`: aprovado no `release/win-unpacked`;
- `npm run smoke:release:deep`: 12/12 aprovados;
- `npm run smoke:ui`: aprovado;
- `npm run perf:release`: low/balanced/ultra estaveis no executavel real;
- `npm run release:assets`: aprovado, 349.2 MB de core e 48 audios decodificados;
- `npm run base:diagnose`: aprovado, 8 bases e 24 topdowns;
- `npm run content:audit`: 0 issues tecnicas no MUN e 0 gaps de empacotamento;
- `npm run asset:audit -- --top=12`: nenhum arquivo vazio, caminho duplicado ou original pesado sem derivado;
- `release/win-unpacked/RPG FUSHI.exe`: atualizado para `0.1.0-alpha.90`.

### Evidencia de continuidade visual

No smoke empacotado de troca de mapa:

- 79 amostras durante Preparar MAP e retorno;
- 0 quadros vazios;
- 11 quadros mantendo a superficie anterior enquanto a proxima era preparada;
- sequencia observada: cena atual -> mapa preparado -> cena atual;
- `Ctrl+A` recuperou uma superficie branca forçada sem trocar mapa, tokens ou sessao.

### Alertas mantidos sem mascaramento

- `npm audit --omit=dev --json` ainda reporta 2 alertas altos transitivos em
  `react-router-dom/react-router`, restritos ao modo RSC; este app usa rotas
  client-side em Electron e nao usa RSC. Nao foi feito downgrade automatico.
- `npm run bundle:audit` ainda reporta o drift historico de tamanho de
  `index`, `TablePage` e CSS global. O dist total continua abaixo do limite
  absoluto e a alteracao de alpha.90 nao introduziu uma copia de assets
  publicos; a reducao estrutural fica registrada como frente propria, sem
  arriscar a estabilidade desta promocao.

### Regra operacional para a proxima build

Antes de sobrescrever `release/win-unpacked`, fechar o executavel oficial.
Depois de qualquer alteracao de cena, sincronizacao ou transicao, repetir o
smoke especifico e o `smoke:release` no pacote real. Nenhum alerta de conteudo
ou lore pode ser convertido em `OK` por conveniencia.
