import React from 'react'
import ProfessorView from '../ProfessorView'
import AlunoView from '../AlunoView'

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
    console.warn(`View para o modo "${mode}" não encontrada.`)
    return <div>Modo inválido selecionado.</div>
  }

  // Prepara os props que serão passados para o componente de view.
  // Isso garante que apenas os props relevantes sejam repassados.
  const viewProps = {}
  if (mode === 'aluno') {
    viewProps.prefilledCode = prefilledCode
  }

  return <ViewComponent {...viewProps} />
}

export default ViewRouter
