import { AlertCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NoticeBannerProps {
  onOpenAdvancedDemo: () => void
}

export function NoticeBanner({ onOpenAdvancedDemo }: NoticeBannerProps) {
  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-amber-900 dark:text-amber-200">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="space-y-1">
          <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-100">
            Métricas avançadas indisponíveis
          </h4>
          <p className="text-amber-800/90 dark:text-amber-200/80 leading-relaxed max-w-3xl">
            Por enquanto, apenas as <strong>métricas básicas</strong> (perfil, posts, likes e
            comentários) estão disponíveis. Estamos finalizando a integração com a Meta e{' '}
            <strong>nos próximos dias</strong> as métricas avançadas (alcance, impressões,
            demografia e melhores horários) serão liberadas automaticamente para você — sem precisar
            fazer nada.{' '}
            <button
              onClick={onOpenAdvancedDemo}
              className="underline font-semibold hover:text-amber-900 text-amber-700 dark:text-amber-300"
            >
              Clique em &quot;Ver demonstração&quot; ao lado para ver como ficará.
            </button>
          </p>
        </div>
      </div>

      <Button
        onClick={onOpenAdvancedDemo}
        size="sm"
        variant="outline"
        className="shrink-0 bg-white dark:bg-slate-900 border-amber-300 hover:bg-amber-50 text-amber-900 dark:text-amber-200 gap-2 text-xs font-semibold rounded-xl shadow-xs"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        Ver demonstração
      </Button>
    </div>
  )
}
