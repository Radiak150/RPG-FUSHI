# Campaign Export and Import

## O que entra no export

O export de campanha gera um JSON puro com:

- metadados da campanha;
- estado da mesa/sessao (`tabletopSession`);
- estado do MUN (`worldMundiState`);
- estado do MAP/biblioteca (`libraryState`);
- acessos de jogadores (`playerAccess`);
- workspace do mestre quando disponivel, incluindo fichas/personagens/NPCs locais;
- manifest de assets embutidos quando o export encontra imagens/midias locais;
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

No navegador, o arquivo e baixado manualmente. No desktop, o snapshot interno tambem e salvo em `%APPDATA%/FUSHI/campaigns/[campaignId]/backups/`.

O backup manual tambem cria um snapshot interno da campanha atual para restauracao rapida.

## Backup automatico

Enquanto o app esta aberto, a campanha ativa cria snapshots internos periodicos.

Comportamento atual:

- intervalo padrao: 5 minutos;
- limite: ultimos 5 snapshots por campanha;
- snapshots repetidos nao sao duplicados quando o estado nao mudou;
- antes de substituir ou restaurar campanha, um snapshot do estado atual e preservado.

No navegador, esses snapshots ficam no storage local. No desktop, ficam como arquivos JSON fisicos em `%APPDATA%/FUSHI/campaigns/[campaignId]/backups/`.

## Restaurar backup

Em Configuracoes, a area "Restaurar backup" lista snapshots internos da campanha atual.

Cada item permite:

- exportar o snapshot como JSON;
- restaurar o snapshot com confirmacao.

Ao restaurar, o app preserva um snapshot do estado atual antes de aplicar o backup selecionado.

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

Quando o export contem workspace do mestre, as fichas/personagens/NPCs sao mesclados no workspace atual pelo `id`. Isso evita o desktop limpo cair nos placeholders/template depois de importar uma campanha real.

Quando o export contem assets embutidos, o desktop salva esses arquivos em `%APPDATA%/FUSHI/campaigns/[campaignId]/assets/` e atualiza referencias para `fushi-asset://...`.

## Limitacoes atuais

- `playerAccess` ainda e global no navegador local, entao importar uma campanha pode atualizar o estado de acessos local.
- Assets fisicos referenciados por URL/caminho precisam continuar disponiveis.
- O fluxo ainda nao envia arquivos para servidor, porque multiplayer/backend ainda nao existe.
- Snapshots automaticos no navegador dependem do storage local do proprio navegador/perfil.
- O desktop V1 gera app desempacotado; instalador e dialogos nativos de salvar ainda ficam para uma etapa futura.

## Preparacao para desktop e multiplayer

O formato separa metadados da campanha dos blocos de estado. Isso facilita:

- salvar campanhas como JSON no app desktop;
- sincronizar campanhas por `campaignId`;
- validar imports antes de aplicar;
- separar o que sera enviado ao servidor futuramente.
