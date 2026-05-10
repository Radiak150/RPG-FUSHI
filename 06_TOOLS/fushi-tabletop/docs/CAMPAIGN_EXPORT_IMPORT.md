# Campaign Export and Import

## O que entra no export

O export de campanha gera um JSON puro com:

- metadados da campanha;
- estado da mesa/sessao (`tabletopSession`);
- estado do MUN (`worldMundiState`);
- estado do MAP/biblioteca (`libraryState`);
- acessos de jogadores (`playerAccess`);
- metadados de persistencia fisica, se existirem;
- logs que ja estejam persistidos dentro desses estados;
- versao do formato de export.

Nome padrao:

```text
fushi-campaign-[nome-ou-id]-[data].json
```

## O que nao entra

O export nao inclui:

- codigo executavel;
- `node_modules`;
- `dist`/builds;
- logs tecnicos locais fora do estado da campanha;
- pastas ignoradas pelo Git;
- banco local externo;
- arquivos privados que nao estejam referenciados nos dados da campanha.

## Backup manual

O botao "Criar backup da campanha atual" usa o mesmo formato do export, mas nomeia como:

```text
fushi-backup-[campaignId]-[data].json
```

No navegador, o arquivo e baixado manualmente. No futuro desktop, esse mesmo fluxo pode salvar em uma pasta `/backups`.

## Importacao

O fluxo valida o JSON antes de aplicar:

1. Mestre escolhe um `.json`.
2. Sistema valida app, tipo, versao, campanha e bloco de storage.
3. Sistema mostra resumo: nome, data, versao, mapas, locais e grupos.
4. Mestre escolhe:
   - importar como nova campanha;
   - substituir campanha atual.

Importar como nova campanha gera um novo `campaignId` e troca referencias internas de campaignId quando possivel.

Substituir campanha atual baixa um backup automatico antes de aplicar.

## Limitacoes atuais

- `playerAccess` ainda e global no navegador local, entao importar uma campanha pode atualizar o estado de acessos local.
- Assets fisicos referenciados por URL/caminho precisam continuar disponiveis.
- O fluxo ainda nao envia arquivos para servidor, porque multiplayer/backend ainda nao existe.

## Preparacao para desktop e multiplayer

O formato separa metadados da campanha dos blocos de estado. Isso facilita:

- salvar campanhas como JSON no app desktop;
- sincronizar campanhas por `campaignId`;
- validar imports antes de aplicar;
- separar o que sera enviado ao servidor futuramente.
