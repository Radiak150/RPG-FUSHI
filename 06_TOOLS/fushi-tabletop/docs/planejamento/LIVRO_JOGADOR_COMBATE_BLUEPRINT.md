# Livro do Jogador - Blueprint de Combate Publico

Data: 2026-07-10

Objetivo: criar um livro publico, bonito e pratico para jogadores consultarem
durante a mesa, sem revelar lore secreta, XP oculto, reencarnacao, metaplot ou
regras que so o Mestre deve conhecer.

Este arquivo preserva o roteiro de perguntas e as decisoes aprovadas. O texto
operacional final vive em `src/data/rulebook`, aparece no app e gera os PDFs.

## Entrega Alpha.84

- Livro do Jogador no Fluxo Principal, com busca e 15 capitulos.
- Referencia rapida do Jogador dentro da Mesa, sem sair da sessao.
- Livro do Mestre com 18 capitulos, sigilo, formulas e compendio vivo.
- PDFs em `output/pdf/FUSHI_Livro_do_Jogador_Alpha84.pdf` e
  `output/pdf/FUSHI_Livro_do_Mestre_Alpha84.pdf`.
- Auditoria repetivel por `npm run books:build` e `npm run books:audit`.
- O volume publico falha a auditoria se receber termos do protocolo secreto.

## Respostas definitivas do Mestre - 2026-07-10

- Niveis de Poder aparecem publicamente como Basico, Avancado, Ascensao e
  Cataclisma, sem faixas numericas de Vida/CA/FUSHI.
- O livro inclui regras e exemplos taticos completos.
- Coreografia e regra central.
- Bloqueio continua `floor(CA_base / 2)` ate builds e itens serem testados.
- Vida 0 causa desmaio e tres falhas de estabilizacao levam a morte; o que vem
  depois fica secreto.
- FUSHI e palavra publica e recurso de Habilidades/Rituais, mas sua lore de
  identidade e desbloqueios fica oculta.
- Builds publicas sao arquetipos flexiveis por itens permanentes, sem classes
  rigidas. Catalogo e numeros ainda ficam marcados como em construcao.
- Dano fisico direto usa Luta ou Pontaria. Outras Pericias criam vantagem,
  posicao ou condicao, salvo efeito que declare dano.
- Ataque de oportunidade padrao so existe em manada de dois ou mais inimigos ou
  por Passiva/Habilidade explicita.

O texto final vive em `src/data/rulebook/player-rulebook.json`.

## Decisoes ja travadas

- Reencarnacao fica sempre oculta dos jogadores.
- O Livro do Jogador nao explica morte real, posse de corpo, dano de alma ou
  tabela de renascimento.
- XP por identidade, marcos secretos, natureza real dos protagonistas, Ryoku,
  Vhazaryon, Cataclismas e Ritual do Silencio ficam fora do livro publico.
- O livro deve ajudar o jogador a escolher acao sem depender de adivinhacao.
- O livro deve ser curto o bastante para consultar na sessao.
- O livro pode ter exemplos taticos, mas nao pode entregar spoiler de lore.

## Estrutura sugerida do livro final

1. Comece aqui
2. Como rolar testes
3. Seu turno
4. Movimento e posicionamento
5. Ataque e dano
6. Defesa e reacoes
7. Manobras de combate
8. Condicoes e queda
9. FUSHI publico e poderes liberados
10. Builds e estilo de jogo
11. Exemplos rapidos
12. Referencia de mesa

## Perguntas de design

### 1. Tom e acesso

1. O livro deve falar como manual direto ou como guia narrativo do mundo?
2. O jogador deve conseguir ler tudo em 5 minutos antes da sessao?
3. O livro fica disponivel fora da mesa ou so dentro da mesa?
4. Deve ter uma versao "resumo rapido" fixa na mesa?
5. O livro deve ter exemplos com nomes dos protagonistas ou exemplos genericos?

Sugestao inicial: manual direto, com pequenas frases de clima, e um resumo
rapido sempre acessivel dentro da mesa.

### 2. O que o jogador pode saber

1. O jogador pode saber que existem Niveis de Poder: Basico, Avancado,
   Ascensao e Cataclisma?
2. Se sim, deve saber como escala numericamente ou so como leitura de perigo?
3. O jogador pode saber que existem habilidades futuras de FUSHI, sem saber como
   desbloquear?
4. O jogador pode saber que progresso vem de marcos, sem saber a tabela de XP?
5. O jogador pode saber que morte tem consequencia, sem saber reencarnacao?

Sugestao inicial: mostrar Niveis de Poder como leitura de perigo, sem tabela
completa de progressao. Falar que morte tem consequencia real, sem explicar o
que acontece depois.

### 3. Ficha publica

1. Quais campos da ficha o jogador precisa entender: Vida, FUSHI, Determinacao,
   CA, Bloqueio, Esquiva, atributos, pericias, inventario?
2. A ficha deve explicar diferenca entre atributo e pericia?
3. O jogador deve ver exemplos de rolagem com atributo 0?
4. Determinacao deve ser explicada como recurso mental publico desde ja?
5. FUSHI deve aparecer como recurso bloqueado/limitado ate ser descoberto?

Sugestao inicial: explicar tudo que aparece na ficha, mas marcar FUSHI como
recurso que so pode ser usado quando o Mestre liberar.

### 4. Rolagem central

1. Manter regra atual: atributo define quantidade de d20 e pega o maior?
2. Manter atributo 0 como 2d20 pega o pior?
3. Pericia continua como bonus fixo: +0, +5, +10, +15?
4. O livro deve mostrar DTs publicas: 10, 15, 20, 25, 30, 32+?
5. O jogador pode saber o que e critico/falha critica?

Sugestao inicial: sim para todos. Isso deixa a mesa justa e reduz discussao.

### 5. Turno e economia de acoes

1. Um turno deve ter acao principal, movimento, acao curta e reacao?
2. Falar e narrar intencao deve ser livre?
3. Trocar item, sacar arma e abrir porta simples entram como acao curta?
4. Ajudar aliado e preparar acao entram como acao principal?
5. Reacao deve ser limitada a 1 por rodada?

Sugestao inicial: manter 1 acao principal, 1 movimento, 1 acao curta e 1 reacao.

### 6. Movimento e posicionamento

1. O app usa grid; o livro deve falar em metros, quadrados ou ambos?
2. Movimento diagonal conta normal ou diferente?
3. Sair de corpo a corpo provoca reacao?
4. Cobertura leve/forte deve dar bonus fixo?
5. Terreno dificil reduz movimento pela metade?
6. Jogador pode atravessar quadrado de aliado?
7. Jogador pode atravessar quadrado de inimigo com teste?

Sugestao inicial: usar metros e equivalencia simples com grid; terreno dificil
metade do movimento; cobertura como bonus simples.

### 7. Ataque e dano

1. Ataque sempre usa atributo + pericia + bonus?
2. Dano base de punho 1d4, arma leve 1d6, arma maior 1d8 continua?
3. Coreografia entra no Livro do Jogador?
4. Coreografia deve ser opcional avancada ou regra central?
5. O jogador pode declarar FUSHI imbuido antes de ter dominio consciente?
6. Errou o ataque, perde dano coreografado inteiro?
7. Critico dobra dano, adiciona dado ou ativa efeito narrativo?

Sugestao inicial: coreografia entra como regra central, mas com exemplo simples.
FUSHI imbuido so aparece quando liberado pelo Mestre.

### 8. Defesa e reacoes

1. Bloqueio atual deve continuar reduzindo `floor(CA_base / 2)` do dano?
2. Bloqueio usa reacao e nao evita efeitos narrativos sem habilidade especifica?
3. Esquiva continua CA base + Agilidade + Reflexos?
4. Contra-ataque usa CA base e bate de volta se o ataque inimigo nao alcancar?
5. Cada personagem escolhe so uma reacao: Bloqueio, Esquiva ou Contra-ataque?
6. Deve existir "Proteger aliado" como reacao separada?
7. Deve existir limite para bloquear muitos ataques em cenas longas?

Sugestao inicial: manter as tres reacoes, mas auditar Bloqueio. Possiveis
variantes para testar:

- A: regra atual, reduz `floor(CA_base / 2)`.
- B: reduz valor fixo de Bloqueio da ficha.
- C: reduz `floor(CA_base / 3)` e habilidades de Tank melhoram isso.

### 9. Manobras de combate

1. Agarrar deve usar Forca + Luta vs Forca/Vigor ou Agilidade/Reflexos?
2. Empurrar deve mover 1 a 3m conforme margem de sucesso?
3. Puxar deve exigir item, gancho, corda, corpo a corpo ou vantagem?
4. Derrubar deixa o alvo caido e custa movimento para levantar?
5. Desarmar deve ser permitido para qualquer um ou so com arma adequada?
6. Ajudar aliado da +1 dado ou +2 no teste?
7. Flanquear existe? Se sim, da +1 dado, +2 fixo ou so vantagem narrativa?
8. Preparar acao permite agir com gatilho claro?
9. Fugir deve ser acao de movimento normal ou teste se estiver ameaçado?
10. Usar terreno deve ter regra simples para cobertura, altura e obstaculo?

Sugestao inicial: criar manobras publicas simples com DT/oposicao clara. Nao
automatizar tudo no app ainda; primeiro fechar o livro.

### 10. Condicoes e queda

1. Em 0 Vida, o personagem fica caido, inconsciente ou ainda pode falar?
2. Existe sangramento ou "morrendo" publico?
3. Aliado pode estabilizar com Medicina?
4. Bandagem ou item simples pode levantar para 1 Vida?
5. O jogador deve saber que morte real existe, mas sem regra de retorno?
6. Quais condicoes publicas entram: sangrando, abalado, cansado, lento,
   assustado, quebrado, exausto?
7. Condicoes cataclismicas ficam fora do Livro do Jogador ate aparecerem?

Sugestao inicial: mostrar queda, estabilizacao e condicoes visiveis. Morte real
fica como "o Mestre conduz uma cena especial"; nao explicar renascimento.

### 11. FUSHI publico

1. FUSHI deve aparecer como energia que transforma o existente?
2. O livro pode dizer que usar FUSHI tem custo e consequencia?
3. O livro deve esconder esporos, poder unido e desbloqueios?
4. Quando uma habilidade de FUSHI for liberada, ela entra como pagina nova?
5. O livro deve ter selo "Liberado pelo Mestre" para secoes futuras?

Sugestao inicial: ter pagina curta "FUSHI publico" e secoes bloqueadas que so
aparecem quando o Mestre liberar.

### 12. Builds

1. Builds devem ser arquetipos livres ou classes mais definidas?
2. Quais builds iniciais entram: Tank, Assassino, Suporte, Lutador, Atirador,
   Ocultista?
3. Cada build deve ter ganho e perda obrigatoria?
4. Build deve ser escolhida no app ou apenas guiar itens/habilidades?
5. Jogador pode trocar build com treino/mentor?
6. Itens fortes devem sempre ter downside visivel?
7. Build pode travar alguma acao ou so influencia numeros?

Sugestao inicial: builds sao arquetipos flexiveis. Elas guiam escolhas, mas nao
viram classe rigida.

### 13. Niveis de Poder

1. O livro deve explicar Basico, Avancado, Ascensao e Cataclisma?
2. Jogador deve saber que Cataclisma nao e para enfrentar sem preparo?
3. O livro deve mostrar faixas de Vida/CA/FUSHI ou so perigo narrativo?
4. NPCs devem ter etiqueta publica de perigo?
5. Boss com fase deve ser descrito publicamente ou so quando visto?

Sugestao inicial: mostrar a escala como linguagem de perigo, sem planilha
numericamente completa.

### 14. Exemplos de mesa

1. Ter exemplo de ataque simples?
2. Ter exemplo de coreografia?
3. Ter exemplo de bloquear vs esquivar vs contra-atacar?
4. Ter exemplo de agarrar/empurrar?
5. Ter exemplo de salvar aliado caido?
6. Ter exemplo de fugir/recuar sem parecer covardia?

Sugestao inicial: sim. Exemplo vale mais que paragrafo longo.

### 15. Integracao no app

1. O Livro do Jogador deve abrir como janela pequena dentro da mesa?
2. Deve existir botao "Referencia rapida" no combate?
3. Deve existir busca por regra?
4. Cada regra deve ter botao/copiar resumo para chat?
5. O Mestre pode marcar secoes como liberadas ou ocultas?
6. O Jogador ve a mesma versao que o Mestre marcou como publica?

Sugestao inicial: primeiro livro estatico publico; depois liberar controle de
secoes por Mestre.

## Primeira rodada de decisoes para o mestre

Responder estas antes de escrever o livro final:

1. Jogadores podem ver Niveis de Poder como escala de perigo?
2. Livro deve ter exemplos taticos ou ser so regra seca?
3. Coreografia entra como regra central ou "opcional avancada"?
4. Bloqueio deve ser testado como regra atual, nerfado agora ou virar valor
   proprio da ficha?
5. Em 0 Vida, o jogador fica inconsciente automaticamente ou ainda pode falar se
   a cena permitir?
6. FUSHI publico entra como pagina curta bloqueada por "Mestre libera"?
7. Builds entram como arquetipos publicos ja nesta versao?

## Ordem de producao recomendada

1. Responder a primeira rodada de decisoes.
2. Fechar regras publicas de combate.
3. Escrever Livro do Jogador em formato final.
4. Criar resumo rapido de mesa.
5. Revisar balanceamento do Bloqueio com 3 exemplos.
6. Implementar/ajustar no app apenas depois do texto aprovado.
7. Rodar build/smokes/release se o app for alterado.
