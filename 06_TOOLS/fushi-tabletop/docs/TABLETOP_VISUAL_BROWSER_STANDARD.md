# Padrao Visual Dos Hubs Da Mesa

Este documento e a referencia canonica para novos hubs e para reworks visuais dentro da Mesa.

## Estrutura obrigatoria

- Barra superior compacta com codigo, titulo, busca e comandos por icone.
- Navegacao na coluna esquerda e conteudo na coluna direita.
- Coluna esquerda e conteudo possuem rolagem independente.
- Pastas iniciam recolhidas. Clicar abre ou fecha a hierarquia; fechar a janela recolhe tudo, minimizar preserva o estado.
- O icone de pasta com `+` abre o campo de criacao no contexto atual.
- Renomear, criar subpasta e excluir ficam no menu de contexto do botao direito.
- Pastas irmas podem ser reordenadas segurando e arrastando. Nao duplicar essa acao com setas visiveis.
- A pasta aberta exibe suas subpastas tambem como itens visuais na area de conteudo.
- Acoes conhecidas usam icones Lucide com `aria-label`, `title` e tooltip; texto fica para comandos que precisam de leitura.
- Seletores de ficha, personagem, alvo ou origem iniciam neutros com `Escolha...`. Nunca selecionar a primeira entidade silenciosamente.
- Imagens usam carregamento preguicoso. Videos de biblioteca nao iniciam preload pesado antes de serem pedidos.
- Abrir, filtrar, renomear ou organizar uma biblioteca nao pode reconstruir o tabuleiro nem trocar o mapa ativo.

## Hubs cobertos

O padrao se aplica a MAP, MSC, NPC, OBJ, BUI, EVE, VFX, BUF, TURN e NET. O MUN preserva seu motor e seus dados proprios, mas usa icones, hierarquia e menor poluicao visual quando isso nao muda comportamento.

## Limites de seguranca

- Rework visual nao altera multiplayer, ficha canonica, permissao de token, regras de combate ou lore.
- O Editor continua usando os motores existentes. Nao criar um segundo editor por cima dele.
- Um console CMD real e uma nova arquitetura. Ele so entra depois de protocolo de comandos, permissoes, auditoria e aprovacao explicita do Mestre.
- Qualquer novo hub deve reutilizar `TabletopVisualLibrary` ou justificar por que possui superficie propria.

## Portao de qualidade

Uma mudanca so fecha quando compila, passa os smokes de interface e multiplayer, funciona no aplicativo Windows empacotado e nao deixa a regiao do mapa branca durante ciclos de mapa e interludio.
