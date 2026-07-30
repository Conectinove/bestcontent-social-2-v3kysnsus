import { useState } from 'react'
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createWaitlistEntry } from '@/services/waitlist'
import { toast } from 'sonner'

interface WaitlistFormProps {
  selectedPlan?: string
  onPlanClear?: () => void
}

export function WaitlistForm({ selectedPlan, onPlanClear }: WaitlistFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [businessHandle, setBusinessHandle] = useState('')
  const [profileType, setProfileType] = useState('Empreendedor')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      toast.error('Por favor, preencha seu nome e e-mail.')
      return
    }

    setLoading(true)
    try {
      await createWaitlistEntry({
        name: name.trim(),
        email: email.trim(),
        business_handle: businessHandle.trim(),
        profile_type: profileType,
        plan_interest: selectedPlan || 'General',
      })
      setSubmitted(true)
      toast.success('Inscrição realizada com sucesso!')
    } catch (err) {
      toast.error('Não foi possível enviar sua inscrição. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-3xl border border-purple-100 bg-white p-8 shadow-xl shadow-purple-500/10 text-center animate-fade-in">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-600">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <span className="inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700 mb-2">
          Garantia VIP #{Math.floor(100 + Math.random() * 900)}
        </span>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Inscrição confirmada!</h3>
        <p className="text-slate-600 mb-6 text-sm">
          Você já está na lista prioritária. Enviaremos o convite com condições exclusivas
          diretamente no seu e-mail no dia do lançamento.
        </p>
        <Button
          variant="outline"
          className="border-purple-200 text-purple-700 hover:bg-purple-50"
          onClick={() => setSubmitted(false)}
        >
          Cadastrar outro e-mail
        </Button>
      </div>
    )
  }

  return (
    <div
      id="waitlist-form"
      className="rounded-3xl border border-purple-100 bg-white p-6 sm:p-8 shadow-xl shadow-purple-500/10"
    >
      <div className="mb-6">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">
          Garanta seu acesso VIP
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Entre para a lista de espera e receba condições exclusivas no dia do lançamento.
        </p>
        {selectedPlan && (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700">
            <span>
              Interesse no plano: <strong>{selectedPlan}</strong>
            </span>
            <button
              onClick={onPlanClear}
              className="text-purple-500 hover:text-purple-900 underline"
            >
              Remover
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm font-semibold text-slate-700">
            Como podemos te chamar?
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            required
            className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white focus:border-purple-500"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
            Melhor e-mail
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@empresa.com"
            required
            className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white focus:border-purple-500"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="business" className="text-sm font-semibold text-slate-700">
            Instagram ou Nome do Negócio
          </Label>
          <Input
            id="business"
            value={businessHandle}
            onChange={(e) => setBusinessHandle(e.target.value)}
            placeholder="@seunegocio"
            className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white focus:border-purple-500"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="profile" className="text-sm font-semibold text-slate-700">
            Qual o seu perfil principal?
          </Label>
          <Select value={profileType} onValueChange={setProfileType}>
            <SelectTrigger
              id="profile"
              className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white"
            >
              <SelectValue placeholder="Selecione seu perfil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Empreendedor">Empreendedor</SelectItem>
              <SelectItem value="Criador de Conteúdo">Criador de Conteúdo</SelectItem>
              <SelectItem value="Agência / Social Media">Agência / Social Media</SelectItem>
              <SelectItem value="Profissional Liberal">Profissional Liberal</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-lg shadow-purple-600/25 hover:from-purple-700 hover:to-indigo-700 transition-all text-base mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Cadastrando...
            </>
          ) : (
            <>
              Entrar para a Lista de Espera
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
