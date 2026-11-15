import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, Loader2, Sparkles, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { importSharedPreset } from '@/services/preset-share'

/**
 * Página pública de importação de preset por LINK EXTERNO (pedido 2):
 * a URL vem do botão "Copiar link" do painel de presets. Aberta em outra
 * conta, salva o preset (mesma validação do import por arquivo JSON) e
 * confirma — sem login não dá para gravar na coleção (regra da casa).
 */
export default function ImportPresetPage() {
  const { search } = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = new URLSearchParams(search).get('t') || ''
    if (!token) {
      setState('error')
      setMessage('O link não trouxe o código do preset (parâmetro "t" ausente).')
      return
    }
    let alive = true
    importSharedPreset(token)
      .then((res) => {
        if (!alive) return
        setState('ok')
        setMessage(`Preset "${res.name}" importado com sucesso!`)
        toast({ title: 'Preset importado', description: `Agora ele está nos seus presets.` })
      })
      .catch((err: unknown) => {
        if (!alive) return
        const msg = err instanceof Error ? err.message : 'Falha ao importar o preset.'
        // Sem sessão, o backend bloqueia a gravação: pede login e mantém o token.
        if (String(msg).includes('autentic')) {
          setState('error')
          setMessage('Entre na sua conta e abra o link de novo para importar o preset.')
        } else {
          setState('error')
          setMessage(msg)
        }
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-2">
          <div className="mx-auto rounded-full bg-primary/10 p-3 w-fit">
            {state === 'loading' && (
              <Loader2 className="w-6 h-6 text-primary animate-spin" aria-hidden />
            )}
            {state === 'ok' && <CheckCircle2 className="w-6 h-6 text-emerald-600" aria-hidden />}
            {state === 'error' && <XCircle className="w-6 h-6 text-destructive" aria-hidden />}
          </div>
          <CardTitle className="font-black text-lg flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary" /> Importar preset compartilhado
          </CardTitle>
          <CardDescription className="text-xs">
            O preset chega pelo link e cai direto nos seus presets de Edição Avançada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-foreground/90 break-words">
            {state === 'loading' ? 'Importando preset…' : message}
          </p>
          {state !== 'loading' && (
            <Button onClick={() => navigate('/app/brand-kit')} className="w-full font-bold">
              Abrir Brand Kit
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
