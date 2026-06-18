# Orcamento de performance - GTX 1050 Ti 4 GB

Este documento define o alvo de projeto. Ele nao substitui teste fisico nesse
hardware.

## Metas de runtime

- Ultra: 60 FPS preferido e 30 FPS minimo durante cenas pesadas.
- Um unico topdown animado visivel por vez.
- Topdown animado: ate 1920x1080, 30 FPS, H.264 ou VP9, sem audio.
- Pausar video quando a janela, mapa ou camada nao estiver visivel.
- Manter imagem estatica como poster e fallback obrigatorio.
- Evitar texturas 4K simultaneas; usar derivados WebP fora do Ultra.
- Limitar pixel ratio do 3D, sombras, particulas e luzes pelo preset de qualidade.
- Nao carregar GLB pesado em low/balanced.
- Efeitos sonoros: no maximo 12 vozes curtas simultaneas.

## Contrato de mapa animado

O mapa continua exigindo `image`. `animatedSurface` e opcional e nunca deve
impedir a entrada na mesa. Em falha de carregamento, autoplay bloqueado ou
qualidade insuficiente, a imagem permanece visivel.

## Portao antes de adicionar conteudo

1. Medir readiness, FPS, memoria de processo e tempo de troca de mapa.
2. Validar low, balanced e ultra no app empacotado.
3. Testar Mestre e Jogador com o mesmo mapa animado.
4. Confirmar que minimizar, trocar mapa e fechar a mesa interrompem o decoder.
5. So entao promover o asset para o pack da campanha.
