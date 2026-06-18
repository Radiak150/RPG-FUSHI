# FUSHI API Simulation Readiness - 2026-05-27

Objetivo: listar o que falta para colocar API/Ollama como motor real do MUN sem gerar falso positivo.

## Estado atual

- Ollama local ja tem canal seguro no app.
- Aba IA do MUN gera diagnostico e pode pedir resposta local.
- NPC IA existe como secao tecnica do Editor.
- Historia/Canon ja separam rascunho, aprovacao e memoria curta.
- BASE agora existe como 8 bases de bioma no MUN e pode ser liberada aos jogadores.

## Separacao obrigatoria

### IA Assistente do Mestre

Funcao:

- Responder perguntas como "o que Elara esta fazendo?"
- Comprimir MUN, grupos, tempo, Canon e logs.
- Apontar incompatibilidade.
- Sugerir plots sem aplicar.

Nao pode:

- Mover NPC.
- Alterar Canon.
- Inventar mapa, relacao ou item.

### NPC IA

Funcao:

- Gerar previa de acao individual de NPC.
- Respeitar conhecimento real do NPC.
- Usar memoria propria, local atual, objetivo e tempo.
- Propor movimento, descanso, investigacao ou mudanca de intencao.

Nao pode:

- Saber plot oculto.
- Roubar recompensa principal dos jogadores.
- Aplicar acao sem botao do mestre.

## Relogio da simulacao

- O relogio do MUN e a fonte unica de tempo.
- NPC autonomo gera novo estado de 6 em 6 horas de mundo.
- NPC fora da influencia direta dos jogadores age em metade do ritmo dos jogadores:
  6h de mundo contam como 3h de acao propria.
- NPC em contato com jogadores fica travado em `Historia` ate o mestre soltar com contexto.
- Movimento de grupo, divisao de grupo, rota, descanso e tempo parado entram no log de sessao.
- Botao `Iniciar sessao` deve comecar a registrar rolagens, chat, movimentos, divisao de grupo,
  contatos com NPC, aplicacoes de Canon, mudancas de mapa e alteracoes relevantes.
- Botao `Encerrar sessao` deve gerar checkpoint exportavel com resumo, Canon pendente/aprovado e estado do MUN.

## Travas de aprovacao obrigatorias

A NPC IA pode sugerir, mas precisa de aprovacao do mestre quando envolver:

- Morte de qualquer NPC canonico.
- Conflito/briga entre NPCs.
- Evento Cataclisma eminente.
- Velkar encontrar qualquer fragmento de Ryoku.
- Mudanca irreversivel de corpo, memoria, faccao, base ou mapa.

Se o mestre rejeitar, a simulacao nao deve simplesmente apagar o evento. Ela deve propor uma
saida coerente: fuga, interrupcao, falha parcial, recurso gasto, alguem chegando, sinal perdido
ou outro desvio que preserve a vida canonica sem parecer artificial.

## Afinidade entre NPCs

- Cada NPC precisa poder ter afinidade, confianca, rivalidade e ameaca percebida em relacao a outro NPC.
- Esses valores mudam quando eles se encontram, ajudam, traem, competem, fogem ou veem a acao do outro.
- Afinidade baixa faz NPC evitar, desconfiar ou antecipar conflito.
- Afinidade alta permite viagem conjunta, troca de informacao, ajuda e grupo temporario.
- O mestre pode editar manualmente relacao quando um log de Historia justificar.

## Dados minimos para cada NPC antes de simular

1. Local atual no MUN.
2. O que ele sabe da ilha.
3. Quanto tempo esta na ilha.
4. Objetivo macro.
5. Objetivo atual.
6. Medo atual.
7. Aliados reais.
8. Inimigos reais.
9. O que ele nao sabe.
10. Limites de Canon.
11. Itens ou recursos proprios.
12. Ultimo evento vivido.
13. Relacoes conhecidas com outros NPCs.
14. Afinidade/rivalidade com NPCs ja encontrados.
15. Se esta travado por contato com players ou livre para simular.

## Prompt base anti-invencao

```text
Voce e motor de leitura do MUN. Use apenas dados fornecidos:
- MUN atual
- ficha/personagem
- memoria aprovada
- Canon aprovado
- logs tecnicos
- pergunta do mestre

Se faltar dado, diga que falta. Nao invente mapa, NPC, item, relacao ou evento.
Se for NPC, responda pelo conhecimento daquele NPC, nao pelo conhecimento do mestre.
Plot oculto nao entra na mente do NPC antes de acontecer.
Toda sugestao deve voltar como previa aguardando aprovacao.
```

## O que falta implementar antes da primeira sessao com IA real

1. Esquema JSON fixo para resposta da IA Assistente.
2. Esquema JSON fixo para resposta da NPC IA.
3. Validador que rejeita localId, npcId, itemId ou mapId inexistente.
4. Botao "Aplicar sugestao" por linha, nunca automatico.
5. Memoria por NPC exportavel/importavel.
6. Campo "conhecimento da ilha" por NPC.
7. Campo "nao sabe ainda" por NPC.
8. Log tecnico de prompt/resposta resumidos.
9. Limite de custo/tokens por chamada.
10. Modo offline seguro quando Ollama/API falhar.
11. Prompt canonico de motor/agente para regras, travas e formato.
12. Gravador de sessao ligado/desligado com checkpoint.
13. Painel de aprovacao para conflitos, mortes e eventos criticos.

## Documento de prompts necessario

Criar `FUSHI_AI_PROMPTS_AND_GUARDS_V1.md` com:

- Prompt da IA Assistente do Mestre.
- Prompt da NPC IA.
- Prompt de resumo de sessao.
- Prompt de checkpoint de Canon.
- Regras anti-invencao.
- Lista de travas de aprovacao.
- Esquema JSON de resposta.
- Validacao de IDs existentes no MUN.

## API recomendada

Curto prazo:

- Ollama local com modelo leve para diagnostico e sugestao.
- Bom para custo zero e teste entre amigos.
- Limite: qualidade depende do PC/modelo.

Medio prazo:

- OpenAI API para Assistente do Mestre quando precisar raciocinio melhor.
- Usar com botao manual e contexto compactado para nao gastar demais.

Regra:

- Nunca colocar chave API dentro do codigo ou build.
- Chave fica em configuracao local do usuario/mestre.
- Jogador nao precisa chave para jogar.

## Primeiro uso seguro

1. Rodar sessao sem IA automatica.
2. Registrar logs e Canon.
3. No fim, usar IA Assistente para diagnosticar coerencia.
4. Gerar previa de 6h para NPCs.
5. Mestre aprova/rejeita.
6. Exportar checkpoint de Historia.
