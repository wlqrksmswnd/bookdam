import { Component } from 'react'
import ErrorPage from './ErrorPage.jsx'

export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error(error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorPage status={500} description="화면을 그리는 중 오류가 발생했어요. 다시 시도해 주세요." />
    }
    return this.props.children
  }
}
