import React, { Suspense } from 'react'
import { logger } from '../utils/logger'

const ProfessorView = React.lazy(() => import('../ProfessorView'))
const AlunoView = React.lazy(() => import('../AlunoView'))

const views = {
  professor: ProfessorView,
  aluno: AlunoView
}

const ViewRouter = ({ mode, prefilledCode }) => {
  if (!mode) {
    return null // Não renderiza nada se não houver modo
  }

  const ViewComponent = views[mode]

  if (!ViewComponent) {
    logger.warn(`View para o modo "${mode}" não encontrada.`)
    return <div>Modo inválido selecionado.</div>
  }

  // Prepara os props que serão passados para o componente de view.
  // Isso garante que apenas os props relevantes sejam repassados.
  const viewProps = {}
  if (mode === 'aluno') {
    viewProps.prefilledCode = prefilledCode
  }

  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan"></div>
      </div>
    }>
      <ViewComponent {...viewProps} />
    </Suspense>
  )
}

export default ViewRouter
