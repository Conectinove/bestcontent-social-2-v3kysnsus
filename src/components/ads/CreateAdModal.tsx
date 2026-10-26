import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Megaphone,
  Sparkles,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  MousePointer,
} from 'lucide-react'
import {
  calculateAdProjections,
  generateSmartAdCopy,
  createAdCampaign,
  type AdNetwork,
  type AdObjective,
  type AdCampaignRecord,
} from '@/services/ads'
import type { Brand } from '@/types'
import { toast } from '@/hooks/use-toast'

interface CreateAdModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  brands: Brand[]
  onSuccess: (campaign: AdCampaignRecord) => void
}

export function CreateAdModal({ open, onOpenChange, brands, onSuccess }: CreateAdModalProps) {
  const [name, setName] = useState('')
  const [selectedBrandId, setSelectedBrandId] = useState(brands[0]?.id || '')
  const [network, setNetwork] = useState<AdNetwork>('instagram')
  const [objective, setObjective] = useState<AdObjective>('trafego')
  const [dailyBudget, setDailyBudget] = useState(30)
  const [durationDays, setDurationDays] = useState(7)
  const [destinationUrl, setDestinationUrl] = useState('https://seusite.com.br')

  // Audiência
  const [ageMin, setAgeMin] = useState(22)
  const [ageMax, setAgeMax] = useState(55)
  const [regions, setRegions] = useState('Brasil (Principais capitais)')
  const [interests, setInterests] = useState('Empreendedorismo, Redes Sociais, Negócios')

  // Copy
  const [headline, setHeadline] = useState('')
  const [primaryText, setPrimaryText] = useState('')
  const [cta, setCta] = useState('Saiba Mais')
  const [generatingCopy, setGeneratingCopy] = useState(false)
  const [saving, setSaving] = useState(false)

  const selectedBrand = brands.find((b) => b.id === selectedBrandId) || brands[0]
  const projections = calculateAdProjections(dailyBudget, durationDays, objective)
  const totalBudget = dailyBudget * durationDays

  const handleGenerateAiCopy = () => {
    setGeneratingCopy(true)
    setTimeout(() => {
      const generated = generateSmartAdCopy(
        selectedBrand?.name || 'Sua Marca',
        objective,
        network,
        (selectedBrand as any)?.segment || (selectedBrand as any)?.niche,
      )
      setHeadline(generated.headline)
      setPrimaryText(generated.primaryText)
      setCta(generated.cta)
      setGeneratingCopy(false)
      toast({
        title: 'Copy gerada pela IA!',
        description: 'Texto primário, headline e CTA calibrados no tom da marca.',
      })
    }, 400)
  }

  const handleSave = async (status: 'rascunho' | 'ativa') => {
    if (!name.trim()) {
      toast({ title: 'Dê um nome à campanha', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const campaign = await createAdCampaign({
        name,
        brand: selectedBrandId || undefined,
        network,
        objective,
        status,
        daily_budget: dailyBudget,
        total_budget: totalBudget,
        destination_url: destinationUrl,
        target_audience: {
          ageMin,
          ageMax,
          genders: 'todos',
          regions: [regions],
          interests: interests.split(',').map((s) => s.trim()),
        },
        ad_copy: {
          headline: headline || `${selectedBrand?.name || 'Marca'} Oficial`,
          primaryText: primaryText || 'Conheça nossos produtos e serviços exclusivos.',
          description: destinationUrl,
          cta,
        },
        projections,
      })
      toast({
        title: status === 'ativa' ? 'Campanha ativada no gestor!' : 'Rascunho de campanha salvo!',
        description: 'Dados de planejamento e projeções gravados com sucesso.',
      })
      onSuccess(campaign)
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar campanha',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-6 rounded-3xl bg-card border border-border shadow-2xl space-y-5">
        <DialogHeader className="pb-3 border-b border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Megaphone className="w-3.5 h-3.5 text-purple-600" /> Planejador de Anúncios
            </span>
            <Badge
              variant="outline"
              className="text-[10px] border-purple-500/30 text-purple-600 font-bold"
            >
              Projeções Calibradas
            </Badge>
          </div>
          <DialogTitle className="text-xl font-black text-foreground">
            Criar Nova Campanha de Anúncio
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Defina objetivos, orçamento, público-alvo e gere o criativo com inteligência artificial
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Linha 1: Nome + Marca */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Nome da Campanha:
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Lançamento Coleção Outono"
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Marca Ativa:</label>
              <select
                value={selectedBrandId}
                onChange={(e) => setSelectedBrandId(e.target.value)}
                className="w-full h-9 rounded-xl border border-border bg-background text-xs px-3 font-semibold focus:outline-none"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Linha 2: Rede + Objetivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">Rede Alvo:</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['instagram', 'facebook', 'tiktok', 'youtube', 'linkedin'] as AdNetwork[]).map(
                  (net) => (
                    <button
                      key={net}
                      type="button"
                      onClick={() => setNetwork(net)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                        network === net
                          ? 'border-purple-600 bg-purple-500/10 text-purple-700 dark:text-purple-300 shadow-2xs'
                          : 'border-border/70 hover:border-border text-muted-foreground'
                      }`}
                    >
                      {net}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">
                Objetivo do Anúncio:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  ['trafego', 'vendas', 'reconhecimento', 'leads', 'engajamento'] as AdObjective[]
                ).map((obj) => (
                  <button
                    key={obj}
                    type="button"
                    onClick={() => setObjective(obj)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                      objective === obj
                        ? 'border-purple-600 bg-purple-500/10 text-purple-700 dark:text-purple-300 shadow-2xs'
                        : 'border-border/70 hover:border-border text-muted-foreground'
                    }`}
                  >
                    {obj}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Orçamento & Projeção */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-purple-600" /> Investimento & Período
              </span>
              <span className="text-xs font-extrabold text-foreground">
                Total: R$ {totalBudget.toFixed(2)} ({durationDays} dias)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">
                  Orçamento Diário (R$):
                </label>
                <Input
                  type="number"
                  min={10}
                  step={5}
                  value={dailyBudget}
                  onChange={(e) => setDailyBudget(Number(e.target.value) || 10)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">
                  Duração Estimada (dias):
                </label>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value) || 1)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            {/* Projeção de Resultados */}
            <div className="pt-2 border-t border-border/60 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-card border border-border/60">
                <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                  <Users className="w-3 h-3 text-purple-500" /> Alcance Est.
                </span>
                <span className="text-sm font-black text-foreground">
                  ~{projections.reach.toLocaleString('pt-BR')}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-card border border-border/60">
                <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                  <MousePointer className="w-3 h-3 text-emerald-500" /> Cliques Est.
                </span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  ~{projections.clicks.toLocaleString('pt-BR')}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-card border border-border/60">
                <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                  <TrendingUp className="w-3 h-3 text-purple-500" /> CPC Médio
                </span>
                <span className="text-sm font-black text-foreground">
                  R$ {projections.cpc.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Copy com IA */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Copy do Anúncio (Criativo)
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateAiCopy}
                disabled={generatingCopy}
                className="h-7 text-xs rounded-lg border-purple-500/40 text-purple-600 hover:bg-purple-500/10 gap-1 font-bold"
              >
                {generatingCopy ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                <span>Gerar Copy com IA</span>
              </Button>
            </div>

            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">
                Título do Anúncio (Headline):
              </label>
              <Input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Ex: Conheça as soluções da marca..."
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">
                Texto Principal (Legenda do Anúncio):
              </label>
              <Textarea
                rows={3}
                value={primaryText}
                onChange={(e) => setPrimaryText(e.target.value)}
                placeholder="Escreva ou gere com IA a copy do anúncio..."
                className="text-xs rounded-xl resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">
                  Texto do Botão (CTA):
                </label>
                <Input
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  placeholder="Saiba Mais, Comprar Agora..."
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">
                  URL de Destino:
                </label>
                <Input
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  placeholder="https://..."
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-[11px]">
              <strong>Aviso de Veiculação:</strong> Este módulo gerencia o planejamento e criativos
              de anúncios dentro da plataforma. A veiculação patrocinada real exige conexão das
              contas de anúncios oficiais (Meta Ads / TikTok Ads).
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="pt-2 border-t border-border/80 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSave('rascunho')}
              disabled={saving}
              className="rounded-xl text-xs h-10 px-4"
            >
              Salvar como Rascunho
            </Button>
            <Button
              type="button"
              onClick={() => handleSave('ativa')}
              disabled={saving}
              className="rounded-xl text-xs h-10 px-5 bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs gap-1.5"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Megaphone className="w-4 h-4" />
              )}
              <span>Ativar Campanha</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
