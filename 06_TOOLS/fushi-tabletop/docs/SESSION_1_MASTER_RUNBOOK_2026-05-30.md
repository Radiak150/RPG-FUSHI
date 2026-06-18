# Runbook mestre - Sessao 1 FUSHI

Data alvo: 2026-05-30

Objetivo: testar o app, multiplayer, fichas, rolagem, mapa e uma evolucao rapida ate perto do nivel 9 sem precisar grindar combate.

## Fluxo de 1 hora

1. 0-10 min: Caverna do Primeiro Corpo.
   - Os jogadores acordam sem contexto completo.
   - Mostrar que existe corpo, fragmentos e ruído interno.
   - Um bloqueio simples força acao coletiva.

2. 10-25 min: Clareira dos Lobos.
   - Combate tutorial com 2 a 4 lobos.
   - Pelo menos um jogador deve usar FUSHI de forma instintiva.
   - Se alguem cair, aplicar regra minima de renascimento abaixo.

3. 25-45 min: chegada na Vila.
   - Elara ou Orian percebe algo familiar neles.
   - Selian/Maira introduzem o tema de vozes/eco sem explicar tudo.
   - Elias ou Dalvo entrega pista pratica de que a vila esta deteriorando.

4. 45-60 min: escolha final.
   - Campo de Treino se quiser fechar com mecanica.
   - Riacho Claro/Nilo se quiser fechar com emocao.
   - Gancho final: a vila sabe algo sobre eles que eles nao lembram.

## Level por Marcos de Identidade

Use nivel como desbloqueio de identidade, nao como XP por matar.

1. Nivel 1: despertar.
2. Nivel 3: sair da caverna com uma decisao coletiva.
3. Nivel 5: sobreviver aos lobos ou morrer e voltar com custo.
4. Nivel 7: usar FUSHI conscientemente pela primeira vez.
5. Nivel 8: criar vinculo real com um NPC da Vila.
6. Nivel 9: escolher rota/proposito proprio no fim da sessao.

Regra curta: se um jogador ficou apagado em uma cena, ele ainda recebe o marco se o grupo inteiro entendeu a identidade daquele passo. A sessao teste precisa validar o sistema, nao punir spotlight.

## Renascimento minimo para teste

Use so se alguem morrer ou cair em estado narrativo grave.

1. Gatilho: vida chega a 0 ou cena pede ruptura de corpo.
2. Teste tutorial: Vontade ou Determinacao vs DT 20. A regra completa de reencarnacao fica em `docs/fushi-system/FUSHI_MECHANICS_BALANCE_AGENT.md`.
3. Sucesso: volta no mesmo corpo com cicatriz, perde 1 Determinacao maxima temporaria ate descanso longo.
4. Falha: volta instavel, escolhe uma consequencia:
   - perde memoria recente pequena;
   - ganha uma voz/ruido por 1 cena;
   - volta com -1 dado na primeira acao.
5. Corpo vivo de NPC: proibido na sessao 1 sem decisao sua na hora.
6. Animal/corpo fraco: permitido apenas como cena curta de horror, nao como novo estado permanente.

## Mobs minimos

### Lobo comum

- Vida: 12.
- Defesa: 12.
- Ataque: d20 + 4, dano 1d6.
- Comportamento: cerca, testa medo, foge se metade do bando cair.

### Lobo marcado por FUSHI

- Vida: 18.
- Defesa: 13.
- Ataque: d20 + 5, dano 1d8.
- Efeito: ao morder, o alvo ouve uma memoria curta da ilha.

Use 2 lobos comuns para grupo inseguro. Use 3 comuns + 1 marcado se tudo estiver fluindo.

## NPCs para usar sem embolar

1. Elara: autoridade emocional da Vila.
2. Orian: mapas, rotas, leitura do territorio.
3. Nilo: Liora, memoria e submapa do Riacho Claro.
4. Selian: espelho de Kairos, vozes, sensibilidade.
5. Maira: canto/ritual, protecao de Selian.
6. Dalvo: cura simples, ervas, reparos.
7. Elias: pistas de deterioracao.

Guarde Nayr/Renji/Kazuo para depois se a sessao de 1 hora apertar.

## Pistas seguras

Estas pistas nao quebram lore se aparecerem cedo:

1. A ilha transforma, nao cria do nada.
2. A Vila lembra pessoas que os jogadores nao sabem se viveram.
3. O corpo deles nao e uma pessoa unica comum.
4. O FUSHI responde a identidade e custo.
5. A saida da ilha nao e so andar para fora.

Evite revelar cedo:

1. Dragon FUSHI completo.
2. Ryoku como centro do Cataclisma.
3. Verdade inteira de Connor/Renji/Kazuo.
4. O papel final da Arvore.
5. A natureza exata de Liora.

## Checklist antes de abrir mesa

1. Abrir `release\win-unpacked\RPG FUSHI.exe`.
2. Confirmar que aparecem jogadores: Fragmentado, Kairos, Davi, Connor, Keal, Ruiz.
3. Confirmar que aparecem NPCs da Vila.
4. Testar rolagem d20, d2 e historico.
5. Host criar sala.
6. Cliente entrar por IP local.
7. Token mover nos dois lados.
8. Chat receber conversa, mas nao log de entrar/sair.
9. Trocar mapa e voltar sem resetar mesa.
10. Encerrar e reabrir para confirmar persistencia.
