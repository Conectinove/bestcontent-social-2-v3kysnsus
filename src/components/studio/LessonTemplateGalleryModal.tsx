import React, { useState } from 'react'
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  FlaskConical,
  FileText,
  HelpCircle,
  Video,
  ListOrdered,
  Clock,
  CheckCircle2,
  ArrowRight,
  Search,
  NotebookPen,
  Terminal,
  CalendarRange,
  Clapperboard,
  ListChecks,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { LESSON_TEMPLATES_DATA, type LessonTemplate } from '@/services/lesson-templates'

interface LessonTemplateGalleryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTemplate: (template: LessonTemplate) => void
}

export const LessonTemplateGalleryModal: React.FC<LessonTemplateGalleryModalProps> = ({
  open,
  onOpenChange,
  onSelectTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos')
  const [searchQuery, setSearchQuery] = useState('')

  const categories = [
    { id: 'todos', label: 'Todos os Modelos', icon: BookOpen },
    { id: 'aula', label: 'Planos de Aula', icon: GraduationCap },
    { id: 'laboratorio', label: 'Laboratório & Prática', icon: FlaskConical },
    { id: 'resumo', label: 'Resumos & Microlearning', icon: FileText },
    { id: 'estudo', label: 'Notas de Estudo', icon: NotebookPen },
    { id: 'prompt', label: 'Prompts de IA', icon: Terminal },
    { id: 'plano_conteudo', label: 'Planos de Conteúdo', icon: CalendarRange },
    { id: 'roteiro_conteudo', label: 'Roteiros de Vídeo Curto', icon: Clapperboard },
    { id: 'checklist', label: 'Checklists', icon: ListChecks },
    { id: 'tutorial', label: 'Tutoriais Passo a Passo', icon: ListOrdered },
    { id: 'quiz', label: 'Quizzes de Fixação', icon: HelpCircle },
    { id: 'video', label: 'Roteiros de Vídeo', icon: Video },
  ]

  const filteredTemplates = LESSON_TEMPLATES_DATA.filter((tmpl) => {
    const matchesCat = selectedCategory === 'todos' || tmpl.category === selectedCategory
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      tmpl.title.toLowerCase().includes(q) ||
      tmpl.subtitle.toLowerCase().includes(q) ||
      tmpl.description.toLowerCase().includes(q)
    return matchesCat && matchesSearch
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 bg-slate-950 border-slate-800 text-slate-100 overflow-hidden rounded-3xl shadow-2xl">
        {/* Header do Modal */}
        <DialogHeader className="p-6 pb-4 border-b border-slate-800/80 bg-slate-900/90 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-inner">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
                  <span>Templates de Aulas Pedagógicas</span>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-[10px] font-bold">
                    PT-BR · 1 Clique
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 mt-0.5">
                  Selecione um modelo estruturado com módulos e blocos prontos para o Segundo
                  Cérebro e gere o conteúdo com IA.
                </DialogDescription>
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por plano, quiz, lab..."
                className="h-9 pl-9 text-xs bg-slate-900 border-slate-800 text-slate-200 rounded-xl"
              />
            </div>
          </div>

          {/* Categorias Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-3 no-scrollbar">
            {categories.map((cat) => {
              const Icon = cat.icon
              const isSelected = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              )
            })}
          </div>
        </DialogHeader>

        {/* Lista de Templates */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((template) => {
            const totalBlocks = template.modules.reduce((acc, m) => acc + m.blocks.length, 0)
            return (
              <div
                key={template.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/90 hover:border-purple-500/50 hover:bg-slate-900 transition-all flex flex-col justify-between group space-y-4 shadow-lg hover:shadow-purple-950/20"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <Badge className="bg-purple-900/40 text-purple-300 border-purple-700/40 text-[10px] font-bold">
                      {template.badge}
                    </Badge>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{template.suggestedDuration}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-base font-black text-white group-hover:text-purple-300 transition-colors leading-snug">
                      {template.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {template.subtitle}
                    </p>
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed italic">
                    "{template.description}"
                  </p>

                  {(() => {
                    const firstBlock = template.modules[0]?.blocks.find(
                      (b) => typeof b.content === 'string' && b.content.trim(),
                    )
                    if (!firstBlock) return null
                    return (
                      <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 mt-1">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-purple-400/90 mb-1">
                          Prévia do conteúdo
                        </p>
                        <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3 whitespace-pre-line">
                          {firstBlock.content as string}
                        </p>
                      </div>
                    )
                  })()}

                  <div className="pt-1 flex items-center gap-3 text-[11px] text-slate-400 font-semibold border-t border-slate-800/60">
                    <span className="flex items-center gap-1 text-purple-400">
                      <CheckCircle2 className="w-3 h-3" />
                      {template.modules.length} Módulos
                    </span>
                    <span>·</span>
                    <span>{totalBlocks} Blocos prontos</span>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    onSelectTemplate(template)
                    onOpenChange(false)
                  }}
                  className="w-full bg-slate-800 hover:bg-purple-600 text-slate-200 hover:text-white font-bold text-xs h-9 rounded-xl transition-all gap-1.5 shadow-sm group-hover:shadow-purple-600/30"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400 group-hover:text-white" />
                  <span>Aplicar Template na Nota</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            )
          })}
        </div>

        {/* Rodapé Informativo */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Templates criados seguindo a metodologia ativa MudarCurso / BestContent.</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs text-slate-400 hover:text-white h-7"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
