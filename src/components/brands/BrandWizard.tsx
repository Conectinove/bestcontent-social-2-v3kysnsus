import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  X,
  Check,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Target,
  Users,
  MessageSquare,
  Share2,
  Sparkles,
  AtSign,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { useSocial } from '@/context/SocialContext'
import { createBrand, updateBrand, getBrand } from '@/services/brands'
import {
  BRAND_NETWORKS,
  VOICE_TONES,
  STYLE_OPTIONS,
  fromRecordToWizardData,
  buildBrandPayload,
} from '@/lib/brand-wizard'
import type { BrandWizardData } from '@/lib/brand-wizard'

const STEPS = [
  { id: 1, label: 'Sua marca' },
  { id: 2, label: 'Redes' },
  { id: 3, label: 'Identidade' },
  { id: 4, label: 'Brand kit' },
  { id: 5, label: 'Estilos' },
]

export default function BrandWizard() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { user, refreshAll, brands, selectedBrandId, setSelectedBrandId } = useSocial()

  const [step, setStep] = useState(1)
  const [data, setData] = useState<BrandWizardData>(emptyData())
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  useEffect(() => {
    if (!isEdit) return
    let alive = true
    getBrand(id as string)
      .then((record: any) => {
        if (!alive) return
        setData(fromRecordToWizardData(record))
        setLoading(false)
      })
      .catch(() => {
        toast({ title: 'Marca não encontrada', description: 'Comece uma nova marca.' })
        navigate('/app/pages?tab=brands', { replace: true })
      })
    return () => {
      alive = false
    }
  }, [id])

  const planCount = brands.length

  function emptyData(): BrandWizardData {
    return {
      name: '',
      description: '',
      essence: '',
      target_audience: '',
      voice_tone: '',
      online_presence: '',
      sector: '',
      tags: '',
      networks: [],
      instagram: '',
      tiktok: '',
      youtube: '',
      facebook: '',
      website: '',
      color_primary: '#7c3aed',
      color_secondary: '#c4b5fd',
      color_accent: '#8b5cf6',
      style_preferences: [],
    }
  }

  const canAdvance = useMemo(() => (step === 1 ? data.name.trim() !== '' : true), [step, data.name])

  function update<K extends keyof BrandWizardData>(key: K, value: BrandWizardData[K]) {
    setData((d) => ({ ...d, [key]: value }))
  }

  async function persist(): Promise<string | null> {
    if (!user?.id) {
      toast({ title: 'Sessão expirada', description: 'Entre novamente para salvar a marca.' })
      return null
    }
    if (!data.name.trim()) {
      toast({ title: 'Nome obrigatório', description: 'Dê um nome à marca antes de salvar.' })
      setStep(1)
      return null
    }
    setSaving(true)
    try {
      const payload = buildBrandPayload(data, user.id, logoFile)
      if (isEdit) {
        await updateBrand(id as string, payload)
        return id as string
      }
      const created = await createBrand(payload)
      return created?.id || null
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar marca',
        description: err?.message || 'Tente novamente em instantes.',
      })
      return null
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveAndClose() {
    const savedId = await persist()
    if (!savedId) return
    toast({
      title: isEdit ? 'Marca atualizada!' : 'Marca criada!',
      description: `${data.name} salva com sucesso.`,
    })
    await refreshAll()
    if (!isEdit && savedId) setSelectedBrandId(savedId)
    navigate('/app/pages?tab=brands')
  }

  function goTo(next: number) {
    if (next > 1 && !data.name.trim()) {
      toast({
        title: 'Preencha o nome da marca',
        description: 'O nome é obrigatório para avançar.',
      })
      return
    }
    setStep(Math.min(5, Math.max(1, next)))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <span className="font-black text-xs leading-none">b</span>
            </div>
            <span className="font-bold text-lg tracking-tight">
              bestcontent{' '}
              <span className="text-[10px] font-extrabold text-purple-600 uppercase">AI</span>
            </span>
          </div>

          {/* Stepper clicável (desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            {STEPS.map((s, i) => {
              const done = s.id < step && stepComplete(s.id, data)
              const current = s.id === step
              return (
                <div key={s.id} className="flex items-center">
                  {i > 0 && <span className="w-6 h-px bg-border mx-1" />}
                  <button
                    type="button"
                    onClick={() => goTo(s.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors',
                      current
                        ? 'text-purple-700 dark:text-purple-300'
                        : done
                          ? 'text-purple-600 dark:text-purple-400 hover:bg-purple-500/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                    )}
                  >
                    <span
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                        current
                          ? 'bg-purple-600 text-white shadow-sm'
                          : done
                            ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                            : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.id}
                    </span>
                    {s.label}
                  </button>
                </div>
              )
            })}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            {isEdit ? (
              <span className="text-xs text-muted-foreground max-w-[160px] truncate">
                Editando <span className="font-bold text-foreground">{data.name}</span>
              </span>
            ) : (
              data.name.trim() && (
                <span className="hidden lg:block text-xs text-muted-foreground max-w-[160px] truncate">
                  {data.name}
                </span>
              )
            )}
            <Button
              variant="outline"
              onClick={handleSaveAndClose}
              disabled={saving}
              className="rounded-full h-9 px-4 text-xs font-bold border-purple-500/40 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10 gap-1.5"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <X className="w-3.5 h-3.5" />
              )}
              Salvar e fechar
            </Button>
          </div>
        </div>

        {/* Stepper mobile */}
        <div className="md:hidden px-4 pb-3 flex items-center gap-2 overflow-x-auto">
          {STEPS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(s.id)}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors',
                s.id === step
                  ? 'bg-purple-600 text-white border-purple-600'
                  : stepComplete(s.id, data)
                    ? 'border-purple-500/40 text-purple-600 dark:text-purple-400'
                    : 'border-border text-muted-foreground',
              )}
            >
              {s.id} · {s.label}
            </button>
          ))}
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-10">
        {step === 1 && <StepYourBrand data={data} update={update} />}
        {step === 2 && <StepNetworks data={data} update={update} />}
        {step === 3 && <StepIdentity data={data} update={update} />}
        {step === 4 && (
          <StepBrandKit data={data} update={update} logoFile={logoFile} setLogoFile={setLogoFile} />
        )}
        {step === 5 && <StepStyles data={data} update={update} />}

        {/* Rodapé de navegação */}
        <div className="mt-10 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => goTo(step - 1)}
            disabled={step === 1}
            className="rounded-full text-sm font-semibold gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleSaveAndClose}
              disabled={saving}
              className="rounded-full text-sm font-semibold"
            >
              Salvar
            </Button>
            {step < 5 && (
              <Button
                onClick={() => goTo(step + 1)}
                disabled={!canAdvance}
                className="rounded-full text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
              >
                Avançar <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          {planCount} marca{planCount === 1 ? '' : 's'} no seu plano
        </p>
      </main>
    </div>
  )
}

function stepComplete(stepId: number, data: BrandWizardData): boolean {
  switch (stepId) {
    case 1:
      return data.name.trim() !== '' && data.essence.trim() !== ''
    case 2:
      return data.networks.length > 0
    case 3:
      return data.sector.trim() !== '' || data.tags.trim() !== ''
    case 4:
      return data.color_primary.trim() !== ''
    case 5:
      return data.style_preferences.length > 0
    default:
      return false
  }
}

type StepProps = {
  data: BrandWizardData
  update: <K extends keyof BrandWizardData>(k: K, v: BrandWizardData[K]) => void
}

/* ---------------- Etapa 1: Sua marca ---------------- */

function StepYourBrand({ data, update }: StepProps) {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tight">Sua marca</h1>
      <p className="text-muted-foreground mt-3 max-w-lg">
        O que a marca é e para quem ela fala. É daqui que saem as ideias e os textos dos posts.
      </p>
      <p className="text-xs text-muted-foreground mt-6 mb-3">
        <span className="text-red-500 font-bold">*</span> Obrigatório
      </p>

      <div className="space-y-3">
        {/* Nome da marca — obrigatório */}
        <div className="rounded-2xl border border-purple-500/40 bg-purple-500/5 p-5">
          <label className="text-sm font-bold flex items-center gap-2">
            Nome da marca <span className="text-red-500">*</span>
          </label>
          <Input
            value={data.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Ex.: MidiaViva"
            className="mt-2 h-11 rounded-xl border-border bg-background"
          />
          <p className="text-xs text-muted-foreground mt-2">Obrigatório para avançar e salvar.</p>
        </div>

        <ExpandableCard
          icon={<Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
          title="Essência"
          filled={data.essence.trim() !== ''}
          summary={
            data.essence || 'Ex.: Plataforma de gestão de redes sociais e marketing digital...'
          }
        >
          <textarea
            value={data.essence}
            onChange={(e) => update('essence', e.target.value)}
            rows={4}
            placeholder="Ex.: Plataforma de gestão de redes sociais e marketing digital impulsionada por inteligência artificial. Centraliza a criação multiformato de criativos, gestão de anúncios de alta performance e rotinas de aprovação com clientes."
            className="w-full rounded-xl border border-border bg-background p-3 text-sm min-h-[110px] resize-y focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          />
        </ExpandableCard>

        <ExpandableCard
          icon={<Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
          title="Público"
          filled={data.target_audience.trim() !== ''}
          summary={
            data.target_audience ||
            'Ex.: Gestores de tráfego, agências de marketing e equipes de social media...'
          }
        >
          <textarea
            value={data.target_audience}
            onChange={(e) => update('target_audience', e.target.value)}
            rows={4}
            placeholder="Ex.: Gestores de tráfego, agências de marketing e equipes de social media que precisam escalar a produção de campanhas e publicações."
            className="w-full rounded-xl border border-border bg-background p-3 text-sm min-h-[110px] resize-y focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          />
        </ExpandableCard>

        <ExpandableCard
          icon={<MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
          title="Tom de voz"
          filled={data.voice_tone.trim() !== ''}
          summary={data.voice_tone || 'Ex.: Profissional · Direto · Inspirador'}
        >
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {VOICE_TONES.map((tone) => {
                const selected = data.voice_tone
                  .split('·')
                  .map((p) => p.trim())
                  .includes(tone)
                return (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => {
                      const parts = data.voice_tone
                        .split('·')
                        .map((p) => p.trim())
                        .filter((p) => p && p !== tone)
                      if (!selected) parts.push(tone)
                      update('voice_tone', parts.join(' · '))
                    }}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                      selected
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'border-border text-muted-foreground hover:border-purple-500/50 hover:text-purple-600',
                    )}
                  >
                    {tone}
                  </button>
                )
              })}
            </div>
            <Input
              value={data.voice_tone}
              onChange={(e) => update('voice_tone', e.target.value)}
              placeholder="Ex.: Profissional · Direto · Inspirador"
              className="h-10 rounded-xl"
            />
          </div>
        </ExpandableCard>

        <ExpandableCard
          icon={<Share2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
          title="Presença online"
          filled={data.online_presence.trim() !== ''}
          summary={data.online_presence || 'Ex.: midiaviva.goskip.app · @ronaldo.barreto1'}
        >
          <textarea
            value={data.online_presence}
            onChange={(e) => update('online_presence', e.target.value)}
            rows={3}
            placeholder="Ex.: midiaviva.goskip.app · @ronaldo.barreto1"
            className="w-full rounded-xl border border-border bg-background p-3 text-sm min-h-[90px] resize-y focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          />
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
            <AtSign className="w-3.5 h-3.5" /> Site, @ nas redes e onde a marca pode ser encontrada.
          </p>
        </ExpandableCard>
      </div>
    </div>
  )
}

function ExpandableCard({
  icon,
  title,
  filled,
  summary,
  children,
}: {
  icon: React.ReactNode
  title: string
  filled: boolean
  summary: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className={cn(
        'rounded-2xl border transition-colors',
        open ? 'border-purple-500/50 bg-purple-500/[0.03]' : 'border-border bg-muted/40',
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 p-5 text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold">{title}</span>
            {filled && (
              <span className="w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white stroke-[4]" />
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate mt-0.5">{summary}</p>
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

/* ---------------- Etapa 2: Redes ---------------- */

function StepNetworks({ data, update }: StepProps) {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tight">Redes</h1>
      <p className="text-muted-foreground mt-3 max-w-lg">
        Onde a marca publica. Selecione as redes e preencha os @ de cada uma.
      </p>
      <div className="mt-8 space-y-3">
        {BRAND_NETWORKS.map((n) => {
          const selected = data.networks.includes(n.key)
          return (
            <div
              key={n.key}
              className={cn(
                'rounded-2xl border p-4 transition-colors',
                selected ? 'border-purple-500/50 bg-purple-500/5' : 'border-border bg-card',
              )}
            >
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() =>
                    update(
                      'networks',
                      selected
                        ? data.networks.filter((k) => k !== n.key)
                        : [...data.networks, n.key],
                    )
                  }
                  className="w-4 h-4 accent-purple-600"
                />
                <span className="text-sm font-bold">{n.label}</span>
              </label>
              {selected && n.key !== 'website' && (
                <Input
                  value={(data as any)[n.key] || ''}
                  onChange={(e) => update(n.key as any, e.target.value)}
                  placeholder={n.placeholder}
                  className="mt-3 h-10 rounded-xl"
                />
              )}
              {selected && n.key === 'website' && (
                <Input
                  value={data.website}
                  onChange={(e) => update('website', e.target.value)}
                  placeholder={n.placeholder}
                  className="mt-3 h-10 rounded-xl"
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ---------------- Etapa 3: Identidade ---------------- */

function StepIdentity({ data, update }: StepProps) {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tight">Identidade</h1>
      <p className="text-muted-foreground mt-3 max-w-lg">
        Setor, tags e o resumo que aparece nos cards de marca.
      </p>
      <div className="mt-8 space-y-4">
        <div>
          <label className="text-sm font-bold">Setor</label>
          <Input
            value={data.sector}
            onChange={(e) => update('sector', e.target.value)}
            placeholder="Ex.: Escola de formação profissional, Tecnologia, Varejo..."
            className="mt-2 h-11 rounded-xl"
          />
        </div>
        <div>
          <label className="text-sm font-bold">Tags</label>
          <Input
            value={data.tags}
            onChange={(e) => update('tags', e.target.value)}
            placeholder="Ex.: Vender mais, Engajamento"
            className="mt-2 h-11 rounded-xl"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Separe por vírgula — aparecem como chips nos cards de marca.
          </p>
        </div>
        <div>
          <label className="text-sm font-bold">
            Resumo <span className="text-red-500">*</span>
          </label>
          <textarea
            value={data.description}
            onChange={(e) => update('description', e.target.value)}
            rows={4}
            placeholder="Ex.: Plataforma de gestão de redes sociais e marketing digital impulsionada por inteligência artificial."
            className="mt-2 w-full rounded-xl border border-border bg-background p-3 text-sm min-h-[110px] resize-y focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          />
        </div>
      </div>
    </div>
  )
}

/* ---------------- Etapa 4: Brand kit ---------------- */

function StepBrandKit({
  data,
  update,
  logoFile,
  setLogoFile,
}: StepProps & {
  logoFile: File | null
  setLogoFile: (f: File | null) => void
}) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null)
      return
    }
    const url = URL.createObjectURL(logoFile)
    setLogoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [logoFile])

  return (
    <div>
      <h1 className="text-4xl font-black tracking-tight">Brand kit</h1>
      <p className="text-muted-foreground mt-3 max-w-lg">
        Cores e logo que aparecem nos criativos e nos cards da marca.
      </p>
      <div className="mt-8 space-y-5">
        <div className="grid sm:grid-cols-3 gap-4">
          <ColorField
            label="Primária"
            value={data.color_primary}
            onChange={(v) => update('color_primary', v)}
          />
          <ColorField
            label="Secundária"
            value={data.color_secondary}
            onChange={(v) => update('color_secondary', v)}
          />
          <ColorField
            label="Destaque"
            value={data.color_accent}
            onChange={(v) => update('color_accent', v)}
          />
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <label className="text-sm font-bold flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-purple-600" /> Logo da marca
          </label>
          <div className="mt-3 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-border bg-muted flex items-center justify-center">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-black text-muted-foreground">
                  {(data.name || 'M')[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                />
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-border hover:bg-muted transition-colors">
                  Enviar logo
                </span>
              </label>
              {logoFile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLogoFile(null)}
                  className="h-8 text-xs text-red-500 hover:text-red-600 gap-1 px-2"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remover
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="color"
          value={value || '#7c3aed'}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#7c3aed"
          className="h-9 rounded-lg text-xs font-mono"
        />
      </div>
    </div>
  )
}

/* ---------------- Etapa 5: Estilos ---------------- */

function StepStyles({ data, update }: StepProps) {
  return (
    <div>
      <h1 className="text-4xl font-black tracking-tight">Estilos</h1>
      <p className="text-muted-foreground mt-3 max-w-lg">
        Preferências visuais que guiam a IA na criação dos posts da marca.
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        {STYLE_OPTIONS.map((style) => {
          const selected = data.style_preferences.includes(style)
          return (
            <button
              key={style}
              type="button"
              onClick={() =>
                update(
                  'style_preferences',
                  selected
                    ? data.style_preferences.filter((s) => s !== style)
                    : [...data.style_preferences, style],
                )
              }
              className={cn(
                'px-4 py-2 rounded-full text-sm font-semibold border transition-colors flex items-center gap-1.5',
                selected
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'border-border text-muted-foreground hover:border-purple-500/50 hover:text-purple-600',
              )}
            >
              {selected && <Sparkles className="w-3.5 h-3.5" />}
              {style}
            </button>
          )
        })}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        A IA usa essas preferências ao gerar criativos e legendas para esta marca.
      </p>
    </div>
  )
}
