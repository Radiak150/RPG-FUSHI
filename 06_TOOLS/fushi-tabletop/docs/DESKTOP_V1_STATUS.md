# Desktop V1 Status

Estado de referencia do FUSHI Desktop V1.

## O Que Ja Funciona

- App desktop Windows via Electron usando o React/Vite atual.
- Build web continua funcionando com `npm run dev`.
- Build desktop gera pasta executavel em `release/win-unpacked`.
- Storage desktop salva dados fisicos em `%APPDATA%/FUSHI`.
- Import/export/backup de campanha em JSON.
- Assets importados podem ser materializados como `fushi-asset://...`.
- Biblioteca MAP persiste mapas customizados ao sair para Plataforma e voltar.
- Tokens podem resolver imagem por `tokenImageUrl`, `avatarUrl`, `topdownImageUrl`, ficha/personagem, NPC/corpo ou jogador vinculado.
- Diagnostico Desktop mostra runtime, campanha ativa, storage fisico, ultimo save/load e resumo de dados.

## Limitacoes Atuais

- Nao existe multiplayer real.
- Multi-janela local e apenas teste dentro do Electron.
- Nao existe backend WebSocket.
- Nao existe login/conta online.
- Permissoes ainda precisam ser validadas futuramente no servidor.
- Desktop ainda usa a mesma UI do web; nao ha UX especifica de instalador final.
- O build atual e pasta executavel, nao instalador comercial.

## Dados Desktop

Pasta raiz:

```txt
%APPDATA%/FUSHI/
```

Estrutura principal:

```txt
%APPDATA%/FUSHI/
  workspace.json
  campaigns/
    [campaignId]/
      session.json
      library.json
      mundi.json
      access.json
      physicalPersistence.json
      transitionOverrides.json
      backups/
      assets/
        maps/
        images/
        audio/
        misc/
```

## Executavel

Build desktop local:

```txt
06_TOOLS/fushi-tabletop/release/win-unpacked/RPG FUSHI.exe
```

Comando:

```txt
npm run electron:build
```

## Reset De Dados

Para resetar manualmente dados desktop de teste:

1. Fechar todas as janelas `RPG FUSHI.exe`.
2. Fazer backup de `%APPDATA%/FUSHI`, se houver dados importantes.
3. Remover ou renomear `%APPDATA%/FUSHI`.
4. Abrir o app novamente.

Nao apagar essa pasta se houver campanhas reais sem backup.

## Diferenca Entre Web E Desktop

- Web usa storage do navegador e downloads manuais para export/backup.
- Desktop usa APIs seguras do Electron via preload e salva JSON/assets em `%APPDATA%/FUSHI`.
- Desktop nao deve acessar filesystem diretamente pelo frontend.
- Desktop pode abrir pasta de dados e persistir assets fisicos locais.
- Ambos devem compartilhar o mesmo comportamento visual e fluxo de mesa.

## Proximos Passos Para Multiplayer

1. Congelar paridade Web/Desktop com testes manuais.
2. Separar estado publico/privado no backend, nao apenas na UI.
3. Criar servidor Node/WebSocket com `campaignId` e `sessionId`.
4. Mestre cria sala e jogadores entram por codigo/convite.
5. Servidor valida permissoes de token e mapa ativo.
6. MUN completo fica apenas com o mestre.
7. Jogador recebe apenas `playerCurrentMapId`, mapa ativo, tokens visiveis e permissoes.
8. Depois integrar desktop como host local ou cliente do servidor.
