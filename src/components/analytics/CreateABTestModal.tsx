import React, { useState } from 'react'
import {
  FlaskConical,
  Sparkles,
  Loader2,
  Calendar,
  Layers,
  FileText,
  CheckCircle2,
  Info,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createABTest } from '@/services/ab-tests'
import { createPost } from '@/services/posts'
import { useToast } from '@/hooks/use-toast'
import type { Post } from '@/types'

interface CreateABTestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  posts: Post[]
  userId?: string
  brandId?: string
  onSuccess?: () => void
}

export function CreateABTestModal({
  open,
  onOpenChange,
  posts,
  userId,
  brandId,
  onSuccess,
}: CreateABTestModalProps) {
  const { toast } = useToast()

  // Modo de criação: 'select_posts' (escolher posts existentes) ou 'draft_copies' (escrever variantes A e B)
  const [creationMode, setCreationMode] = useState<'select_posts' | 'draft_copies'>('select_posts')
  const [postA, setPostA] = useState('')
  const [postB, setPostB] = useState('')

  // Campos para modo rascunho de cópia rápida
  const [titleA, setTitleA] = useState('')
  const [captionA, setCaptionA] = useState('')
  const [titleB, setTitleB] = useState('')
  const [captionB, setCaptionB] = useState('')

  const [goal, setGoal] = useState<'clicks' | 'conversions'>('clicks')
  const [duration, setDuration] = useState('7')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!userId) {
      toast({
        title: 'Usuário não autenticado',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      let finalPostAId = postA
      let finalPostBId = postB

      // Se for modo de escrever copy A e B direto: cria os 2 posts de rascunho vinculados
      if (creationMode === 'draft_copies') {
        if (!captionA.trim() || !captionB.trim()) {
          toast({
            title: 'Preencha as duas variantes',
            description: 'Insira o texto da Variante A e da Variante B.',
            variant: 'destructive',
          })
          setLoading(false)
          return
        }

        const createdA = await createPost({
          user: userId,
          brand: brandId || posts[0]?.brandId || '',
          content: titleA.trim() || 'Variante A do Teste',
          caption: captionA.trim(),
          platform: 'Instagram',
          status: 'draft',
          tags: ['teste_ab', 'variante_a'],
        })

        const createdB = await createPost({
          user: userId,
          brand: brandId || posts[0]?.brandId || '',
          content: titleB.trim() || 'Variante B do Teste',
          caption: captionB.trim(),
          platform: 'Instagram',
          status: 'draft',
          tags: ['teste_ab', 'variante_b'],
        })

        finalPostAId = createdA.id
        finalPostBId = createdB.id
      } else {
        if (!finalPostAId || !finalPostBId) {
          toast({
            title: 'Selecione dois posts',
            description: 'Escolha a Variante A e a Variante B para iniciar o teste.',
            variant: 'destructive',
          })
          setLoading(false)
          return
        }
        if (finalPostAId === finalPostBId) {
          toast({
            title: 'Posts iguais selecionados',
            description: 'Escolha duas publicações distintas para o teste A/B.',
            variant: 'destructive',
          })
          setLoading(false)
          return
        }
      }

      const now = new Date()
      const end = new Date()
      end.setDate(end.getDate() + parseInt(duration))

      await createABTest({
        user: userId,
        brand: brandId,
        post_a: finalPostAId,
        post_b: finalPostBId,
        status: 'running',
        goal,
        start_date: now.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
      })

      toast({
        title: 'Experimento A/B Iniciado!',
        description: `Teste criado com sucesso para duração de ${duration} dias.`,
      })

      onOpenChange(false)
      onSuccess?.()
      // Limpar formulário
      setPostA('')
      setPostB('')
      setTitleA('')
      setCaptionA('')
      setTitleB('')
      setCaptionB('')
    } catch (err: any) {
      toast({
        title: 'Erro ao criar teste A/B',
        description: err?.message || 'Verifique os dados informados.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl border border-purple-500/20 bg-card shadow-2xl">
        <DialogHeader className="pb-3 border-b border-border/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shadow-xs">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
                Criar Novo Teste A/B de Posts
                <Badge className="bg-purple-600 text-white text-[10px] py-0">Otimização</Badge>
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Compare duas versões de criativo ou copy para descobrir qual gera mais engajamento e
                cliques.
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Escolha do Modo */}
        <div className="pt-2 space-y-4">
          <div className="flex items-center gap-2 p-1 bg-muted/60 rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setCreationMode('select_posts')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                creationMode === 'select_posts'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Selecionar Posts da Biblioteca
            </button>
            <button
              type="button"
              onClick={() => setCreationMode('draft_copies')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                creationMode === 'draft_copies'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Escrever Variantes A e B Agora
            </button>
          </div>

          {/* Modo 1: Selecionar Posts */}
          {creationMode === 'select_posts' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Variante A */}
              <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
                      A
                    </span>
                    Variante de Controle
                  </span>
                </div>
                <Select value={postA} onValueChange={setPostA}>
                  <SelectTrigger className="text-xs bg-card">
                    <SelectValue placeholder="Selecione o Post A..." />
                  </SelectTrigger>
                  <SelectContent>
                    {posts.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">
                        <span className="font-semibold">{p.platform}:</span>{' '}
                        {p.caption?.slice(0, 45) || p.content?.slice(0, 45) || 'Sem texto'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {postA && (
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {posts.find((p) => p.id === postA)?.caption || 'Sem legenda'}
                  </p>
                )}
              </div>

              {/* Variante B */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-muted-foreground text-card flex items-center justify-center text-[10px] font-bold">
                      B
                    </span>
                    Variante Desafiante
                  </span>
                </div>
                <Select value={postB} onValueChange={setPostB}>
                  <SelectTrigger className="text-xs bg-card">
                    <SelectValue placeholder="Selecione o Post B..." />
                  </SelectTrigger>
                  <SelectContent>
                    {posts.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">
                        <span className="font-semibold">{p.platform}:</span>{' '}
                        {p.caption?.slice(0, 45) || p.content?.slice(0, 45) || 'Sem texto'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {postB && (
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {posts.find((p) => p.id === postB)?.caption || 'Sem legenda'}
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Modo 2: Escrever direto */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-2.5">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
                    A
                  </span>
                  Versão A (Copy Curta / Direta)
                </span>
                <Input
                  placeholder="Título ou Gancho da Variante A"
                  value={titleA}
                  onChange={(e) => setTitleA(e.target.value)}
                  className="text-xs bg-card h-8"
                />
                <Textarea
                  placeholder="Legenda completa da Variante A..."
                  value={captionA}
                  onChange={(e) => setCaptionA(e.target.value)}
                  className="text-xs bg-card min-h-[90px]"
                />
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-2.5">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-muted-foreground text-card flex items-center justify-center text-[10px] font-bold">
                    B
                  </span>
                  Versão B (Storytelling / Longa)
                </span>
                <Input
                  placeholder="Título ou Gancho da Variante B"
                  value={titleB}
                  onChange={(e) => setTitleB(e.target.value)}
                  className="text-xs bg-card h-8"
                />
                <Textarea
                  placeholder="Legenda completa da Variante B..."
                  value={captionB}
                  onChange={(e) => setCaptionB(e.target.value)}
                  className="text-xs bg-card min-h-[90px]"
                />
              </div>
            </div>
          )}

          {/* Configurações do Experimento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Métrica Decisiva (Objetivo)
              </label>
              <Select value={goal} onValueChange={(v) => setGoal(v as 'clicks' | 'conversions')}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clicks" className="text-xs">
                    Taxa de Cliques (CTR) & Engajamento
                  </SelectItem>
                  <SelectItem value="conversions" className="text-xs">
                    Conversões & Vendas Estimadas
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Duração do Experimento</label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3" className="text-xs">
                    3 dias (Validação Expressa)
                  </SelectItem>
                  <SelectItem value="7" className="text-xs">
                    7 dias (Recomendado pelo Algoritmo)
                  </SelectItem>
                  <SelectItem value="14" className="text-xs">
                    14 dias (Ciclo Completo)
                  </SelectItem>
                  <SelectItem value="30" className="text-xs">
                    30 dias (Campanha Perene)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Aviso honesto de estimativa */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs text-muted-foreground">
            <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Os dados de engajamento e cliques exibidos em testes A/B utilizam métricas baseline
              projetadas pelo motor de inteligência até a conexão direta com as APIs analíticas das
              redes sociais.
            </p>
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-border/80 flex items-center justify-between sm:justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs gap-1.5 rounded-xl shadow-xs"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FlaskConical className="w-4 h-4" />
            )}
            Iniciar Experimento A/B
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
