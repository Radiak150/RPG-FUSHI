# FUSHI Tabletop

V1 local do painel do mestre para o projeto `RPG FUSHI`.

## Escopo da V1

- React + TypeScript + Vite
- navegacao entre `Dashboard`, `Mundo`, `Faccoes`, `Campanha` e `Sistema`
- dados mockados locais, somente leitura
- sem backend
- sem multiplayer
- sem escrita nos arquivos centrais do projeto

## Estrutura principal

- `src/app`: bootstrap, provider de dados e roteamento
- `src/components`: layout, UI base e componentes de dominio
- `src/data`: tipos, mocks locais e repositorio de leitura
- `src/pages`: paginas do painel
- `src/styles`: tema visual e estilos globais

## Como rodar

```bash
npm install
npm run dev
```

Abra o endereco exibido pelo Vite no navegador local.

## Build de producao local

```bash
npm run build
npm run preview
```

## Dados

Nesta V1, o app usa apenas dados mockados locais em `src/data/mock`.

A camada `src/data/repositories/mockMasterRepository.ts` foi separada para permitir troca futura por uma fonte que leia `03_DATA` sem reestruturar a interface.
