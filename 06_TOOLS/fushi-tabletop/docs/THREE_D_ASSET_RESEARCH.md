# Pesquisa de Assets e Repos 3D

Registro de fontes 3D avaliadas para o FUSHI Tabletop. Nada aqui foi importado ainda; a lista serve para escolher assets coerentes antes de baixar peso novo para o repo.

## Regras de entrada

- Nao baixar pacote grande direto para `public/` sem selecionar arquivo por arquivo.
- Salvar sempre `SOURCE.md` ou `LICENSE.txt` junto do asset final.
- Preferir `.glb`/`.gltf` com texturas otimizadas para runtime.
- Manter props de mesa abaixo de 5 MB quando possivel; assets maiores ficam para cinematicas, nao para dezenas de instancias no tabuleiro.
- Antes de usar em campanha publica/comercial, revisar a licenca do asset especifico, nao so do site.

## Fontes recomendadas

### Quaternius

Uso provavel:

- humanoides rigados e animacoes universais;
- props medievais/fantasia;
- vila, ruinas, natureza, piratas/costa e tabletop fantasy;
- prototipos bonitos antes de arte final propria.

Packs especialmente coerentes:

- `Universal Animation Library 2`
- `Universal Animation Library`
- `Modular Character Outfits - Fantasy`
- `Fantasy Props MegaKit`
- `Medieval Village MegaKit`
- `Ultimate Modular Ruins Pack`
- `Stylized Nature MegaKit`
- `3D Card Kit - Fantasy`
- `RPG Character Pack`
- `Pirate Kit`

Licenca/fonte:

- FAQ oficial diz que os modelos sao CC0, podem ser usados em projetos comerciais e nao exigem atribuicao.
- Assets: https://quaternius.com/
- FAQ/licenca: https://quaternius.com/faq.html

Nota FUSHI:

- Bom encaixe para objetos do tabuleiro e animacoes humanoides.
- O estilo e mais stylized/low-poly; usar com materiais/luz do app para nao destoar dos mapas painterly.

### Poly Haven

Uso provavel:

- HDRIs para iluminar cenas 3D;
- texturas PBR de pedra, metal, madeira, tecido, solo;
- props realistas pontuais quando o visual exigir mais qualidade.

Licenca/fonte:

- Licenca oficial informa que HDRIs, texturas e modelos 3D sao CC0.
- https://polyhaven.com/license

Nota FUSHI:

- Melhor fonte para aumentar qualidade visual sem parecer asset "cartoon".
- Precisa otimizar antes de colocar em cena repetida.

### ambientCG

Uso provavel:

- materiais PBR para pedra cinzenta, madeira, metal, areia, musgo, rocha, gelo;
- decals/superficies para melhorar modelos simples;
- terreno e props 3D com acabamento melhor.

Licenca/fonte:

- Docs oficiais dizem que assets baixaveis e previews sao CC0.
- https://docs.ambientcg.com/license/

Nota FUSHI:

- Excelente para transformar props simples em algo mais serio sem trocar a silhueta.

### Kenney

Uso provavel:

- props CC0 leves;
- placeholders limpos;
- objetos de mesa, moedas, caixas, itens simples, tiles;
- referencia rapida para inventario/itens.

Licenca/fonte:

- Suporte oficial diz que assets nas paginas sao CC0/public domain e podem ser usados comercialmente.
- https://kenney.nl/support

Nota FUSHI:

- Visual costuma ser mais simples e colorido; usar com cuidado para nao baixar o nivel visual da campanha.

### Khronos glTF Sample Assets

Uso provavel:

- testar loader `.glb`/`.gltf`;
- validar materiais, animacoes, extensoes PBR e performance;
- criar suite tecnica antes de importar assets da campanha.

Licenca/fonte:

- Repo oficial lista licenca/creditos por modelo; nao tratar tudo como uma licenca unica.
- https://github.com/KhronosGroup/glTF-Sample-Assets

Nota FUSHI:

- Usar como teste tecnico, nao como arte de campanha.

### Mixamo

Uso provavel:

- animacoes humanoides para idle, run, hit, death, spellcast, guard, combat;
- prototipo de animacao para personagens antes de packs finais.

Licenca/fonte:

- FAQ oficial da Adobe diz que personagens e animacoes podem ser usados royalty free em projetos pessoais, comerciais e sem fins lucrativos, incluindo jogos.
- https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html

Nota FUSHI:

- Bom para animacao, mas exige pipeline de rig/retarget e conta Adobe.
- Nao resolve criaturas nao humanoides.

### Sketchfab

Uso provavel:

- asset especifico que nao existe em CC0: telescopio, mecanismo de observatorio, reliquia, ruina escaneada.

Licenca/fonte:

- API/guia oficial informa muitos modelos Creative Commons, com obrigacao de mostrar licenca, autor e link quando aplicavel.
- https://sketchfab.com/developers/download-api/guidelines

Nota FUSHI:

- Usar caso a caso, com metadata de atribuicao obrigatoria. Evitar assets de IP reconhecivel.

## Repos/bibliotecas para efeitos 3D

### three.quarks

Uso provavel:

- sucesso critico com raio, explosao e rachadura visual;
- falha critica com wash vermelho, particulas e impacto;
- portais, dominios, aura 3D e trilhas de particulas;
- efeitos exportados por JSON.

Licenca/fonte:

- Repo oficial: MIT.
- https://github.com/Alchemist0823/three.quarks

Nota FUSHI:

- Melhor candidato se a mesa ganhar VFX 3D mais ambicioso.
- Cuidado com peso: carregar sob demanda como o `dice-box`.

### three-nebula

Uso provavel:

- sistema de particulas Three mais simples;
- efeitos exportaveis por JSON;
- editor visual para desenhar efeitos sem codar cada emissor.

Licenca/fonte:

- Site oficial informa MIT.
- https://three-nebula.org/

Nota FUSHI:

- Alternativa mais direta se `three.quarks` ficar pesado demais.

## Encaixe por regiao/bioma

### Veu Cinzento

- observatorio/telescopio: procurar asset especifico em Sketchfab ou modelar simples;
- base da Ordem: Quaternius `Fantasy Props MegaKit`, `Medieval Village MegaKit`;
- pedra/metal cinzento: Poly Haven + ambientCG;
- papel, mapas, caixas, mesa de estudo: Quaternius/Kenney como props de tabuleiro.

### Planicie / Vila

- casas, mercado, barris, caixotes, ferramentas: Quaternius `Medieval Village MegaKit` e `Fantasy Props MegaKit`.
- texturas de madeira/terra/pedra: ambientCG/Poly Haven.

### Floresta Mistica

- arvores, rochas, cogumelos, plantas: Quaternius `Stylized Nature MegaKit`.
- materiais de musgo/rocha/folhas: ambientCG.

### Praia / Litoral

- docas, barco, canhao, caixas nauticas: Quaternius `Pirate Kit`.
- areia, madeira molhada, corda, pedra costeira: Poly Haven/ambientCG.

### Montanhas / Vazio Sereno

- rochas, escadas, templos simples, pilares: Quaternius `Ultimate Modular Ruins Pack`.
- material de pedra fria: ambientCG/Poly Haven.

### Ruinas / Antigo

- colunas, portas, fragmentos, estatua, altar: Quaternius `Ultimate Modular Ruins Pack`.
- props heroicos especificos: procurar em Sketchfab com licenca rastreada.

## Proximo passo tecnico sugerido

1. Criar manifesto `public/assets/objects/3d/SOURCE.md` por lote.
2. Integrar loader `.glb` em `src/rendering/three/` sem substituir os sprites existentes.
3. Adicionar preview 2D leve para cada objeto 3D no painel de objetos.
4. Carregar modelos 3D apenas quando o objeto estiver no tabuleiro ou no inspetor.
5. Criar preset de VFX critico com biblioteca carregada sob demanda.

