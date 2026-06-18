# Desktop Testing

Checklist final para validar paridade Web -> Desktop no FUSHI Desktop V1.

## Preparacao

1. Na web, abrir a campanha real.
2. Confirmar que ela tem capa/imagem de campanha.
3. Confirmar que ela tem mapas com imagens.
4. Confirmar que personagens/NPCs possuem imagens.
5. Exportar a campanha pela tela de Configuracoes.
6. Abrir `release/win-unpacked/RPG FUSHI.exe`.
7. Importar a campanha no desktop.
8. Clicar em "Abrir agora".

## Assets Importados

1. Verificar imagem/capa da campanha.
2. Verificar imagens dos mapas na Biblioteca MAP.
3. Verificar imagens de NPCs/personagens na biblioteca/fichas.
4. Verificar previews do MUN quando existirem.
5. Abrir Configuracoes > Diagnostico Desktop.
6. Rodar "Verificar assets da campanha".
7. Confirmar que exports novos nao apontam para `/api/fushi/assets/...`.
8. Confirmar que assets desktop usam `fushi-asset://...` ou URL publica valida.

## Biblioteca MAP

1. Criar mapa novo no desktop com nome `TESTE_PERSISTE_MAPA`.
2. Confirmar que ele aparece na Biblioteca MAP.
3. Clicar em "Plataforma".
4. Entrar novamente na mesa/campanha.
5. Confirmar que `TESTE_PERSISTE_MAPA` ainda aparece.
6. Fechar o app.
7. Abrir o app novamente.
8. Confirmar que `TESTE_PERSISTE_MAPA` persistiu.

## Tokens

1. Abrir um MAP.
2. Spawnar personagem/NPC que tem imagem na ficha.
3. Confirmar que o token mostra imagem correta.
4. Mover o token.
5. Fechar o app.
6. Abrir o app novamente.
7. Confirmar que token, posicao e imagem persistiram.
8. Confirmar que fallback visual aparece apenas quando nenhuma imagem real existe.

## Vinculo Corpo/Jogador

1. Selecionar um token/personagem.
2. Vincular corpo ao Jogador 1.
3. Confirmar que o token passa a representar o corpo atual do Jogador 1.
4. Fechar o app.
5. Abrir o app novamente.
6. Confirmar que o vinculo persistiu.

## Multi-Janela Local

1. Rodar `npm run electron:dev:multi`.
2. Confirmar janelas Mestre, Jogador 1 e Jogador 2.
3. Mestre ve MUN/MAP completo.
4. Jogador ve apenas a visao permitida/publica.
5. Ativar um MAP pelo mestre.
6. Confirmar que a janela jogador acompanha o mapa ativo quando o sync local disparar.
7. Mover/ocultar token e confirmar atualizacao local.
8. Registrar qualquer divergencia.

Nota: multi-janela local ainda e teste de runtime Electron. Nao e multiplayer real, nao tem servidor e nao substitui validacao futura de permissao no backend.

## Diagnostico Desktop

1. Abrir Configuracoes > Diagnostico Desktop.
2. Confirmar runtime Electron/Browser.
3. Confirmar campaignId ativo.
4. Confirmar caminho de dados.
5. Confirmar ultimo save/load.
6. Confirmar contagem de mapas customizados.
7. Confirmar contagem de tokens.
8. Confirmar contagem de fichas e NPCs.
9. Clicar "Forcar salvar agora".
10. Clicar "Abrir pasta de dados".

## Build Windows

1. Rodar `npm.cmd run lint`.
2. Rodar `npm.cmd run build`.
3. Rodar `npm.cmd run electron:build`.
4. Abrir `release/win-unpacked/RPG FUSHI.exe`.
5. Repetir os testes MAP, tokens e vinculo.
