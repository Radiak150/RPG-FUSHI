export function TabletopHelpPanel() {
  return (
    <div className="tabletop-help-panel">
      <article className="list-card">
        <h3>Controles basicos</h3>
        <ul className="bullet-list">
          <li>Clique esquerdo no token: selecionar.</li>
          <li>Clique no mapa com token selecionado: mover para a celula clicada.</li>
          <li>Arrastar token continua disponivel como atalho de movimento.</li>
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
    </div>
  )
}
