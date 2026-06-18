# FUSHI Mechanics Gap Audit - 2026-05-27

Este documento lista o que ja existe como teoria, o que ja esta parcialmente no app e o que ainda precisa virar regra/funcionalidade.

## Ja existe como base

- Corpo compartilhado.
- Fragmentado em corpo compartilhado.
- Recursos so ficam compartilhados quando ritual/estado aprovado disser isso.
- Determinacao individual.
- Atributo define quantidade de d20.
- Pericia soma bonus fixo.
- Defesa base = 10 + Agilidade + equipamento + habilidades.
- Esquiva, bloqueio, contra-ataque como reacao.
- MUN como mapa vivo.
- Grupos no MUN.
- NPCs com local, intencao, memoria e Canon.
- Ollama/API local em modo seguro de previa.
- Pasta virtual MOBS no app.

## Fechado neste pacote

- Documento `Agent.md` para agentes futuros nao quebrarem a logica.
- Documento de matematica central e balanceamento.
- Documento de auditoria de dano antes de alterar NPC canonico.
- Documento de mobs/waves.
- Documento de itens/builds/BASE.
- Documento de auditoria de DT e migracao para DT 20/25/30/32+.
- Protocolo V1 de reencarnacao com pulsos, posse, dano critico de alma e resgate.
- Novos mobs fisicos tipo `mob` sem alterar NPCs existentes.
- Estado de BASE dentro do MUN.
- Aba `Base` no MUN com 8 bases de bioma, 11 upgrades cada, liberar/ocultar para jogadores.
- Regras corrigidas de Bloqueio, Esquiva, Contra-ataque e Coreografia.
- Mobs fisicos iniciais tipo `mob` adicionados sem alterar NPC canonico.

## Falta transformar em regra de livro

### Reencarnacao

Estado: protocolo jogavel V1 criado.

Falta:

- UI de tentativa de reencarnacao com DT calculada e 3 pulsos.
- Botao para registrar posse/empate/inativo.
- Consequencias automaticas por sucesso/falha.
- Como o corpo muda ficha, token e permissao no app.
- Como registrar conflito com consciencia original no Canon.

### Rituais

Estado: precisa catalogo.

Falta:

- Lista de rituais Basico/Avancado/Ascensao/Cataclisma.
- Campo de custo, tempo e risco na ficha.
- Log do MUN quando ritual altera local, NPC ou relogio.
- Integracao com BASE: Biblioteca, Sala de Musica, Nucleo FUSHI.
- Migrar todos os rituais para DT Basico 20, Avancado 25, Ascensao 30 e Cataclisma 32+.

### Itens

Estado: direcao e ideias iniciais.

Falta:

- Tabela oficial por Nivel de Poder.
- Limite de slots no app.
- Item fisico como objeto arrastavel no mapa.
- Catalogo de itens no MUN igual catalogo de Personagens.
- Recompensa por ponto do MUN.
- Export/import de inventario de campanha.

### Builds

Estado: seis arquetipos definidos.

Falta:

- Tela/aba de build compacta por ficha.
- Validacao para evitar item que aumenta tudo.
- Progressao por Nivel de Poder.
- Pacotes iniciais opcionais.
- Garantir custo por eixo: Tank perde mobilidade, Assassino perde vida, Suporte perde dano, Lutador perde alcance, Atirador perde defesa corpo a corpo, Ocultista perde estabilidade/recurso.

### Mobs

Estado: primeiros mobs criados.

Falta:

- Mais mobs por bioma.
- Spawn por ponto do MUN.
- Preset de wave.
- Botao "criar encontro" a partir do MUN.
- Dificuldade estimada por pontos de ameaca.

### Bosses e Cataclismas

Estado: NPCs/bosses existem narrativamente.

Falta:

- Nunca mexer em NPC real sem aprovacao.
- Criar ficha mecanica separada para fase de boss.
- Cada boss precisa de:
  - arena,
  - gatilho,
  - fases,
  - falha,
  - recompensa,
  - impacto no MUN.

### Relogio e rotas

Estado: MUN ja tem relogio, rotas e tempo.

Falta:

- Refinar tempos subrota por subrota.
- Exibir tempo antes de arrastar grupo.
- Garantir que tempo de NPC solto use metade do tempo de mundo.
- Botao de desfazer em toda alteracao de rota/tempo.
- Relogio como fonte unica para IA.

### IA assistente

Estado: Ollama local conectado em modo seguro.

Falta:

- Prompt canonico do assistente do MUN.
- Prompt separado para NPC IA.
- Memoria por NPC exportavel.
- Validacao anti-invencao.
- Botao aplicar sugestao por NPC/por grupo.
- Botao iniciar/parar sessao para registrar logs de mesa e checkpoint.
- Travas de aprovacao para morte canonica, Cataclisma, conflito entre NPCs e Velkar achando fragmento de Ryoku.

### Poder Unido e Esporos de FUSHI

Estado: definido pelo mestre, ainda precisa virar UI/regra de livro.

Regra:

- Quando os protagonistas desbloquearem Esporos de FUSHI, o Fragmentado ganha o ritual `Poder Unido`.
- `Poder Unido` pode ser ativado 1 vez por cena.
- Enquanto ativo, soma Vida, FUSHI e Determinacao das consciencias no mesmo corpo.
- Nao soma atributos principais.
- Qualquer consciencia dentro do corpo pode usar uma habilidade de outra enquanto o estado durar.
- Se so 2 consciencias estiverem juntas, so essas 2 somam.
- Consciencias separadas nao compartilham nada ate uma fusao/ritual aprovado.
- Futuro ritual de fusao permite reunir corpos separados novamente.

## Regras que nao podem quebrar

- NPC nao sabe plot que ainda nao viveu.
- Faccao organiza, mas nao define vontade.
- O mestre aprova tudo que vira Canon.
- Player nao precisa baixar campanha inteira se assets forem servidos pelo mestre.
- O jogador so deve ver o que foi liberado.
- Toda acao relevante precisa aparecer em log tecnico.

## Prioridade para primeira sessao

1. Dados e rolagens criticas sem erro.
2. Tokens/corpo/fichas dos jogadores estaveis.
3. MOBS funcionando na biblioteca.
4. Wave dos lobos pronta.
5. MUN com grupo principal, rotas iniciais e tempo suficiente.
6. BASE pode ficar visual/planejada, sem exigir economia fechada.
7. IA pode ficar apenas como diagnostico local/Ollama ate o sistema estar estavel.

## Decisoes do mestre registradas

1. Vida, FUSHI e Determinacao nao ficam compartilhados depois da separacao; so `Poder Unido` soma recursos temporariamente.
2. Reencarnacao e permanente naquele corpo.
3. Ritual de transferencia de corpo exige 2 tributos, um vivo e um morto, transfere consciencia e nao revive NPC.
4. Item consumido aplica efeito uma vez naquele personagem; item fora da build tambem aplica downside e depois vira decorativo para ele.
5. Outro personagem pode consumir o mesmo item uma vez se ele ainda existir como item fisico.
6. BASE agora e conjunto de 8 pontos proprios de bioma, nao apenas a Caverna do Primeiro Corpo.
7. Nenhuma morte canonica acontece sem aprovacao do mestre.
8. Cataclisma nunca mata NPC canonico sem permissao manual.
