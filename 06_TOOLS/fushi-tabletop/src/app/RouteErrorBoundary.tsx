import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface RouteErrorBoundaryProps {
  children: ReactNode
  resetKey: string
}

interface RouteErrorBoundaryState {
  error: Error | null
}

export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = {
    error: null,
  }

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { error }
  }

  componentDidUpdate(previousProps: RouteErrorBoundaryProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erro ao montar rota do FUSHI.', error, info.componentStack)
  }

  render() {
    if (!this.state.error) {
      return this.props.children
    }

    return (
      <main className="route-error" role="alert">
        <p className="eyebrow">FUSHI TABLETOP</p>
        <h1>Nao consegui montar esta tela.</h1>
        <p>
          A conexao pode estar ativa, mas algum dado da mesa veio incompleto.
          Recarregue a tela ou volte pelo launcher e tente entrar novamente.
        </p>
        <div className="route-error__actions">
          <button
            className="button button--primary"
            onClick={() => window.location.reload()}
            type="button"
          >
            Recarregar
          </button>
          <Link className="launcher-brand launcher-brand--gate" to="/launcher">
            <span className="launcher-brand__mark">F</span>
            <span>
              <strong>FUSHI</strong>
              <small>Voltar Launcher</small>
            </span>
          </Link>
        </div>
      </main>
    )
  }
}
