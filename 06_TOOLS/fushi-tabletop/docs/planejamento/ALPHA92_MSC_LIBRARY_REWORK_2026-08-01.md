# Alpha.92 - Biblioteca MSC Visual

Data: 2026-08-01

## Objetivo

Deixar a Biblioteca de Musicas operavel durante a narracao sem substituir o
motor de audio, o mixer da sessao ou o protocolo multiplayer ja estabilizados.

## Contrato visual

- A coluna esquerda permanece visivel e rolavel ao trocar de pasta.
- `Todos os sons`, `Favoritos` e `Tocando agora` sao atalhos fixos.
- Pastas locais podem ser criadas, renomeadas, reordenadas e excluidas quando
  vazias; faixas podem ser arrastadas para elas.
- A area principal usa grade visual com capa circular, titulo, categoria,
  progresso, volume individual e comandos por icone com tooltip.
- Faixas sem capa usam um visual gerado por categoria. A ausencia de imagem nao
  pode produzir asset quebrado.
- Criar e editar faixa aceita audio e capa opcional PNG/JPG/WebP. Remover capa
  restaura o visual gerado sem remover o audio.

## Estado e compatibilidade

- `customAudio` continua sendo a fonte das faixas criadas pelo Mestre.
- `trackOverrides` guarda somente alteracoes das faixas nativas, evitando copiar
  ou bifurcar o catalogo original.
- `previewImage` e opcional e retrocompativel; bibliotecas antigas continuam
  validas sem migracao manual.
- O mixer, favoritos, presets, volume, play, pause e stop mantem a logica anterior.
- O servidor sanitiza `trackOverrides` e `previewImage` antes de enviar a
  biblioteca ao Jogador. Nenhum controle reservado do Mestre e publicado.

## Portoes de qualidade

- `npm run build`
- `npm run lint -- --max-warnings=999`
- `npm run smoke:ui`
- `npm run smoke:multiplayer`
- `npm run smoke:release`
- `npm run audio:audit`
- `npm run release:assets`
- `npm run content:audit`

O smoke da release precisa provar o fluxo real: abrir a biblioteca, manter a
lateral ao navegar, editar nome, carregar capa, fechar, reabrir e encontrar a
mesma faixa. O smoke multiplayer precisa provar custom track, capa e override
na visao sanitizada do Jogador.

## Teste fisico ainda necessario

1. Mestre e um Jogador entram na mesma sessao.
2. Mestre toca, pausa, retoma, altera volume e para uma faixa.
3. Jogador ouve cada mudanca sem receber botoes de edicao.
4. Mestre troca de pasta durante a reproducao e confirma que o som nao reinicia.
5. Mestre edita nome/capa, fecha e reabre o MSC e depois reconecta o Jogador.

Esse teste fisico fecha a ergonomia e a audicao real. Ele nao autoriza declarar
completos os temas por personagem, boss, evento ou bioma; essa curadoria continua
como backlog de conteudo.
