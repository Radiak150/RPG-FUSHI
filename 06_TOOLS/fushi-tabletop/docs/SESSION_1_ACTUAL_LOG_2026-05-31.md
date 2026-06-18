# Sessao 1 - Log real

Data do registro: 2026-05-31

Observacao: a gravacao/log oficial do app nao foi iniciado durante a sessao. Este arquivo registra o relato do mestre para preservar continuidade narrativa, bugs observados e ajustes de balanceamento.

## Resumo tecnico da mesa

- O servidor multiplayer caiu muitas vezes, em media a cada meia hora, exigindo reconexao manual dos jogadores.
- Dados ficaram instaveis durante a sessao. O mestre precisou limpar historico de rolls para destravar a mesa em alguns momentos.
- A mesa teve estados visuais quebrados, incluindo momentos de tela branca.
- Alguns NPCs e mobs nao apareceram corretamente como token no topdown.
- O botao/fluxo de "Mostrar" funcionou melhor que o token em mesa.
- Mobs em token parecem usar placeholder/imagem errada por conflito entre imagem de perfil/mostrar e imagem de token.
- Falta controle de enquadramento/corte da imagem do token, estilo foco de avatar.
- Vinculo de jogador com personagem/token nao esta persistindo entre mapas.
- Um jogador deve ter no maximo 1 personagem vinculado. Ao spawnar esse personagem em qualquer mapa, o vinculo deve ser reaplicado automaticamente.
- Edicoes feitas pelo jogador no personagem vinculado parecem nao fixar na ficha real do mestre/fluxo principal.
- "Liberar Mapa" funcionou.
- "Liberar Base" nao funcionou.
- O grupo no MUN nao conseguiu ser movido.

## Resumo narrativo

Os jogadores comecaram confusos, como esperado. Houve testes iniciais e perda de Determinacao.

Na caverna do Primeiro Corpo, eles lamberam o ovo. Ainda nao descobriram a lore: o ovo era alimento produzido pelo organismo/entidade alienigena ou viral para se desenvolver. Ao lamberem, ganharam 1 de vida.

Depois tentaram sair da caverna. A saida estava bloqueada por muitas pedras. Removeram uma pedra com as maos e perceberam que seria dificil continuar assim. Encontraram um osso grande destrocado e usaram como alavanca para empurrar as pedras. Apos varias tentativas e mais perda de Determinacao, conseguiram abrir passagem.

Ao sair, chegaram na Clareira dos Lobos e iniciaram o sistema de waves.

Contra o primeiro lobo, o primeiro jogador a chegar a 0 de Determinacao foi Connor. Ele saiu do corpo do Fragmentado. Depois que perceberam que chegar a 0 de Determinacao nao causava morte direta, comecaram a se arriscar mais no combate.

Eles derrubaram 1 lobo. Outro lobo apareceu no caminho, impedindo a passagem. Durante esse conflito, mais 2 jogadores se separaram do Fragmentado: Kairos e Kael.

Kael assumiu a linha de frente, pois apareceu com 2 foices de 1d6 de dano. Connor se escondeu. Kairos ficou sentado. Kairos tentou se afastar, mas foi pedido um teste de Vontade com Presenca para ver se o corpo teria o impulso de sair de perto. Ele passou no teste, sentiu o corpo tremer, mas parou e continuou sentado.

O Fragmentado ficou sem armas e indefeso, pois o osso usado como arma ficou preso/associado ao primeiro lobo derrotado. O grupo recuou. Connor foi buscar o osso e tentou entregar ao Fragmentado. Como ainda havia 2 jogadores no corpo, eles nao quiseram pegar o osso de Connor.

Mais um jogador saiu do Fragmentado: Ruiz, que definiu o nome oficial "Grim". Davi continuou no corpo do Fragmentado. Nesse ponto, 4 jogadores ja tinham saido do corpo e 1 permaneceu nele.

Kael derrotou mais um lobo. A wave 3 comecou e apareceu mais um lobo no caminho. A batalha ja estava longa. Kairos decidiu fugir da batalha e correu para a trilha, ficando seguro. Ao ver Kairos sair, os outros comecaram a sair tambem.

Antes de todos sairem, Kael derrotou mais um lobo, levando o encontro para a wave 4. O mestre perguntou se eles queriam entender o sistema de wave. Eles disseram que nao, entao o mestre apenas informou brevemente em qual wave estavam.

Depois da wave 4, decidiram fugir. Conversaram sobre os corpos que tinham conseguido e seguiram pela trilha. Avistaram a vila. A sessao terminou nesse ponto.

## Estado final

- Grupo saiu da Caverna do Primeiro Corpo.
- Grupo passou pela Clareira dos Lobos.
- Wave chegou ate 4.
- Pelo menos 3 lobos foram derrotados.
- Connor, Kairos, Kael e Grim/Ruiz sairam do corpo do Fragmentado.
- Davi permaneceu no corpo do Fragmentado.
- Grupo avistou a vila ao fim da trilha.

## Observacoes de balanceamento

- A sessao planejada para cerca de 1 hora durou quase 4 horas.
- Uma luta contra lobos de 4 de vida ficou extensa e massante.
- Mesmo com dano baixo dos jogadores, 1d4/1d6, o combate demorou bastante.
- CA 10 para lobo pareceu alta demais para mob tutorial.
- Para mobs simples, usar a mesma CA de NPCs humanoides/personagens pode deixar o combate pesado demais.
- Reavaliar CA de mobs basicos e velocidade de waves antes da proxima sessao.
- As animacoes de saida do corpo funcionaram muito bem na empolgacao dos jogadores.
- O app quebrou o ritmo mais do que a narrativa/sistema.

## Prioridade pos-sessao

1. Estabilizar servidor multiplayer e reconexao automatica.
2. Corrigir dados/rolls para nao travarem e nao dependerem de limpar historico.
3. Corrigir imagem de token de mobs/NPCs no topdown.
4. Criar crop/foco de imagem para token.
5. Persistir vinculo jogador-personagem entre mapas.
6. Garantir que edicao do jogador altere a ficha real do personagem vinculado.
7. Corrigir Liberar Base.
8. Corrigir movimento do Grupo no MUN.
9. Ajustar balanceamento de mobs tutorial, especialmente CA dos lobos.
