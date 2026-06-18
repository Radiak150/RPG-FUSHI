# Distribuicao Alpha

Fluxo recomendado enquanto o RPG FUSHI ainda muda bastante:

1. Rodar `npm run release:zip`.
2. Enviar o ZIP gerado em `release/`.
3. No outro PC, extrair a pasta inteira.
4. Abrir `RPG FUSHI.exe`.

## Teste local

Nao abrir varios `RPG FUSHI.exe` manualmente para simular multiplayer. Isso pode fazer processos diferentes disputarem a mesma pasta de dados do Windows.

Usar:

`RPG FUSHI - Teste Local Multi.cmd`

Esse atalho abre Mestre, Jogador 1 e Jogador 2 como janelas do mesmo processo.

## Multiplayer real

- O Mestre hospeda no PC dele.
- O jogador conecta pelo proprio PC.
- Cada PC tem seu proprio `AppData`.
- Todos devem usar a mesma versao do ZIP.

## Dados locais

Os dados ficam em:

`%APPDATA%\FUSHI`

Atualizar a pasta do app nao apaga automaticamente esses dados.
