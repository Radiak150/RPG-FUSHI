export function TabletopHelpPanel() {
  return (
    <div className="tabletop-help-panel">
      <article className="list-card">
        <h3>Controles basicos</h3>
        <ul className="bullet-list">
          <li>Clique esquerdo no token: selecionar.</li>
          <li>Clique no mapa com token selecionado: mover para a celula clicada.</li>
          <li>Arrastar token continua disponivel como atalho de movimento.</li>
          <li>Objetos 3D reais sao editados pela Camera 3D GM ou pelo painel Objetos.</li>
          <li>Clique em area vazia do mapa: limpar selecao.</li>
          <li>Clique fora da mesa: limpar selecao e evitar movimento acidental.</li>
          <li>Duplo clique em token: abrir a ficha.</li>
          <li>Scroll do mouse: zoom in e zoom out.</li>
          <li>Botao direito segurado: pan do mapa.</li>
          <li>Shift + clique: multisselecao de tokens.</li>
          <li>Segure clique esquerdo no mapa ou use Alt + clique para ping.</li>
        </ul>
      </article>

      <article className="list-card">
        <h3>Janelas</h3>
        <ul className="bullet-list">
          <li>Interagir com HUDs e janelas nao move token selecionado ao fundo.</li>
          <li>- ou duplo clique na barra: minimiza e restaura a janela.</li>
          <li>&gt; ou &lt;: alterna entre expandida e normal.</li>
          <li>~: ativa o modo compacto semi-transparente.</li>
          <li>Arraste a lateral, a base ou o canto para redimensionar.</li>
        </ul>
      </article>

      <article className="list-card">
        <h3>Camera 3D GM</h3>
        <ul className="bullet-list">
          <li>3D GM: ativa a camera livre do mestre.</li>
          <li>CAM GM: jogadores acompanham a camera do mestre.</li>
          <li>W/A/S/D ou setas: move o alvo da camera pelo tabuleiro.</li>
          <li>Botao direito segurado: orbita em volta do ponto focado.</li>
          <li>Clique esquerdo em area vazia e arraste: desloca a camera pelo plano.</li>
          <li>Scroll: aproxima e afasta.</li>
          <li>Q/E: gira a camera em volta do tabuleiro.</li>
          <li>R/F: sobe e desce o angulo da camera.</li>
          <li>Clique esquerdo em objeto 3D: seleciona.</li>
          <li>Arrastar objeto 3D com botao esquerdo: reposiciona livremente no plano.</li>
          <li>Com objeto 3D selecionado: 1 move, 2 gira, 3 escala.</li>
          <li>Del remove, Ctrl+D duplica, [ e ] giram no eixo Y.</li>
          <li>Ctrl+scroll no 3D escala o objeto selecionado proporcionalmente.</li>
          <li>Ctrl+Z desfaz a ultima alteracao de objetos da cena.</li>
          <li>+ e - ajustam escala uniforme; PageUp/PageDown ajustam altura.</li>
          <li>Com OBJ escolhido no painel, clique no chao da Camera 3D GM para colocar direto na maquete.</li>
          <li>Reset: recentra a camera 3D.</li>
        </ul>
      </article>
    </div>
  )
}
