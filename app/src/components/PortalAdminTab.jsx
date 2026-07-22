import { useState } from 'react'
import RepresentantesAdmin from './RepresentantesAdmin'
import MateriaisAdmin from './MateriaisAdmin'

export default function PortalAdminTab() {
  const [section, setSection] = useState('representantes') // 'representantes' | 'materiais'

  return (
    <div>
      <div className="flex justify-between items-end flex-wrap gap-4 mb-6 border-b border-border pb-5">
        <div>
          <h1 className="font-display text-3xl font-semibold m-0">Portal do Representante</h1>
          <div className="text-xs text-muted mt-1.5">
            Gerencie quem tem acesso e o material disponível — os representantes acessam pelo app separado, com PIN.
          </div>
        </div>
      </div>

      <div className="flex border border-border rounded-lg overflow-hidden w-fit mb-6">
        <button
          onClick={() => setSection('representantes')}
          className={`px-4 py-2 text-sm font-medium ${
            section === 'representantes' ? 'bg-accent text-[#0B1524]' : 'text-muted hover:bg-white/5'
          }`}
        >
          Representantes
        </button>
        <button
          onClick={() => setSection('materiais')}
          className={`px-4 py-2 text-sm font-medium ${
            section === 'materiais' ? 'bg-accent text-[#0B1524]' : 'text-muted hover:bg-white/5'
          }`}
        >
          Materiais
        </button>
      </div>

      {section === 'representantes' && <RepresentantesAdmin />}
      {section === 'materiais' && <MateriaisAdmin />}
    </div>
  )
}
