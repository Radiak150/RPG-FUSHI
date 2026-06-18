# Arquitetura de app, campanha e biblioteca

O RPG FUSHI agora deve ser tratado em tres camadas.

## App Core

Contem codigo, UI, multiplayer, hub, regras, editores e assets pequenos de funcionamento.

O updater automatico deve atualizar esta camada.

## Biblioteca de Conteudo

Contem mapas, MUNDI, objetos 3D, videos, musicas, biomas, tokens e interludios pesados.

No desktop, a biblioteca local fica em:

- `%APPDATA%\FUSHI\library\assets`

Para instalar ou atualizar a biblioteca local a partir dos assets do projeto:

- `npm run content:install-local`

O resolvedor do app procura assets nesta ordem:

1. `%APPDATA%\FUSHI\library\assets`
2. assets leves ainda empacotados no app
3. `public/assets` durante desenvolvimento

## Campanha

Contem dados de jogo, cenas, NPCs, estado da mesa, permissoes e referencias para assets.

O mestre deve ter a campanha e a biblioteca usada por ela. Jogadores conectados nao precisam baixar tudo antes: o multiplayer reescreve referencias de `/assets/...` para URLs servidas pelo PC do mestre.

## Jogadores

Jogador baixa o App Core, entra na mesa e recebe estado publico + assets sob demanda do mestre.

Se a internet do mestre ficar lenta ou instavel, pode ser melhor os jogadores tambem importarem o pack da campanha/biblioteca para cache local em uma etapa futura.

## Regra de publicacao

- Update de app: codigo/UI/sistemas.
- Update de campanha: arquivo ou pack separado.
- Update de biblioteca pesada: pack externo, Discord/Drive/tunnel/etc.

Nao colocar mapas, videos e modelos 3D grandes no instalador core.
