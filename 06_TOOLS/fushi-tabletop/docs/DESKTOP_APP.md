# FUSHI Desktop App

## Estado atual

O app web continua rodando normalmente com Vite/React:

```bash
npm run dev
```

A versão desktop V1 usa Electron como shell local/offline:

```bash
npm run electron:dev
```

Para gerar build Windows:

```bash
npm run electron:build
```

Para teste local com multiplas janelas:

```bash
npm run electron:dev:multi
```

Esse modo abre:

- Mestre
- Jogador 1
- Jogador 2

As janelas usam o mesmo storage fisico, mas cada uma recebe um perfil visual proprio. Isso ainda nao e multiplayer real nem limite de seguranca de servidor.

O alvo atual gera uma pasta `release/win-unpacked/` com `RPG FUSHI.exe`. Ainda não é um instalador polido.

## Segurança do Electron

A janela desktop usa a base segura mínima:

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- `webSecurity: true`
- preload com API mínima via `contextBridge`
- produção carrega apenas arquivos locais do build
- renderer não recebe acesso direto ao `fs`
- leitura/escrita limitada à pasta local do FUSHI

O frontend nunca envia caminho absoluto livre. Ele envia `campaignId` e tipos conhecidos de estado; o processo principal resolve o caminho interno.

Assets importados de campanhas sao salvos por campanha e expostos para a UI por URL segura `fushi-asset://...`.

## Onde os dados ficam

No Windows, a persistência física usa:

```text
%APPDATA%/FUSHI/
  workspace.json
  access.json
  physicalPersistence.json
  transitionPlayback.json
  viewPreferences.json
  campaigns/
    [campaignId]/
      session.json
      mundi.json
      library.json
      access.json
      physicalPersistence.json
      transitionOverrides.json
      backups/
        backup-[timestamp]-[id].json
      assets/
        images/
        maps/
        audio/
        interludes/
```

## Browser Storage vs Desktop Storage

No navegador:

- `storageAdapter` usa `localStorage/sessionStorage`.
- export/import/backup continuam funcionando como antes.

No Electron:

- `storageAdapter` usa `window.fushiDesktop`, exposto pelo preload.
- o preload chama IPC seguro.
- o processo principal lê/escreve JSON dentro de `%APPDATA%/FUSHI`.
- ao primeiro carregamento, se não existir arquivo físico, o adapter tenta migrar dados existentes do storage do perfil Electron.

## Limitações atuais

- Não existe multiplayer real ainda.
- Não existe backend WebSocket ainda.
- O modo multi-janela e apenas teste local de view/fluxo, sem servidor autoritativo.
- O alvo desktop atual gera app desempacotado, não instalador final.
- Assets físicos dedicados ainda são uma etapa futura; a base de pastas já está preparada.
- O botão legado "Exportar tudo" ainda é compatível com storage de navegador, enquanto o export/backup de campanha usa o `storageAdapter`.

## Próximos passos futuros

1. Validar persistência física em uso real.
2. Adicionar import/export via diálogo nativo do Electron.
3. Adicionar assets físicos por campanha.
4. Embutir servidor local Node/WebSocket.
5. Evoluir para multiplayer com autoridade no servidor.
