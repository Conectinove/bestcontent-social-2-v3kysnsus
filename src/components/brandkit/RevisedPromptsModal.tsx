import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Copy, Check, Sparkles, BookOpen } from 'lucide-react'

interface RevisedPromptsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const COMMON_IDENTITY_BLOCK = `Identidade MudarCurso 2026: violeta elétrico como cor principal, rosa de destaque, fundo escuro, tipografia Archivo Black (títulos) e Plus Jakarta Sans (texto), logo oficial enviada com seta neon, círculo com pessoas e nome MUDARCURSO em violeta e rosa, sem distorções e com área de proteção. Não usar a antiga marca M com assinatura de domínio. Preserve o arquivo oficial, sem redesenhar a logo. Confira transparência, contraste, área de proteção e integridade do arquivo antes da publicação.`

export const REVISED_PIECES_PROMPTS = [
  {
    id: 'p1',
    title: 'Peça 1 · Logo MudarCurso Primária (Vetor & Aplicações)',
    kind: 'Logo Primária',
    prompt: `Crie a aplicação oficial da Logo MudarCurso · Primária em vetor SVG/PNG transparente 2048px. Seta neon com pessoas conectadas e wordmark MUDARCURSO em violeta elétrico (#5B21B6) e rosa de destaque (#FF2E93). Respeite a margem de segurança X igual à altura do símbolo em todos os 4 lados. Fundo limpo ou aplicação sobre fundo claro. ${COMMON_IDENTITY_BLOCK}`,
  },
  {
    id: 'p2',
    title: 'Peça 2 · Logo Neon para Fundo Escuro (#0F0B1F)',
    kind: 'Neon Escuro',
    prompt: `Aplicação da Logo MudarCurso · Neon · fundo escuro. Cores originais da logo oficial preservadas, com gradiente violeta luminoso (#C44BFF) para rosa (#FF7BC1), brilho sutil (glow) na seta neon e tipografia branca pura (#FFFFFF) para contraste máximo AAA sobre o fundo dark #0F0B1F. ${COMMON_IDENTITY_BLOCK}`,
  },
  {
    id: 'p3',
    title: 'Peça 3 · Versão Monocromática para Impressão e Carimbo',
    kind: 'Monocromática',
    prompt: `Aplicação da Logo MudarCurso · Monocromática em preto puro ou cor sólida única. Elimine degradês, glows ou sombras. Símbolo com seta e pessoas simplificado em linha contínua e wordmark MUDARCURSO com tracking equilibrado para impressão técnica, serigrafia, carimbo ou corte a laser. ${COMMON_IDENTITY_BLOCK}`,
  },
  {
    id: 'p4',
    title: 'Peça 4 · Símbolo Mark (Favicon & Avatar de Redes Sociais)',
    kind: 'Mark Isolado',
    prompt: `Aplicação do Símbolo Isolado (Mark) MudarCurso em proporção 1:1 circular/quadrada. Seta neon ascendente com círculo e silhuetas de pessoas conectadas em violeta e rosa elétrico. Otimizado para visualização perfeita em tamanhos compactos (16px, 32px, 64px, 128px, 512px). Sem wordmark de texto. ${COMMON_IDENTITY_BLOCK}`,
  },
  {
    id: 'p5',
    title: 'Peça 5 · Guia Rápido de Uso & Pacote Social 1080×1350',
    kind: 'Guia Social',
    prompt: `Direção de arte para o Guia Rápido de Uso MudarCurso em carrossel de 5 slides (1080×1350) e capa (1200×628). Apresentação da área de proteção, teste de contraste WCAG 2.1, regras de 'não faça' (não distorcer, não aplicar contornos) e exemplos da logo sobre fundos claro, escuro e violeta vibrante. ${COMMON_IDENTITY_BLOCK}`,
  },
]

export function RevisedPromptsModal({ open, onOpenChange }: RevisedPromptsModalProps) {
  const { toast } = useToast()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('all')

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast({
      title: 'Prompt copiado com sucesso!',
      description: 'O texto do prompt revisado foi copiado para a área de transferência.',
    })
    setTimeout(() => setCopiedId(null), 2500)
  }

  const handleCopyAll = () => {
    const fullText = REVISED_PIECES_PROMPTS.map(
      (p) => `=== ${p.title.toUpperCase()} ===\n${p.prompt}`,
    ).join('\n\n')
    navigator.clipboard.writeText(fullText)
    setCopiedId('all')
    toast({
      title: 'Todos os 5 prompts copiados!',
      description: 'O pacote completo dos prompts revisados da MudarCurso foi copiado.',
    })
    setTimeout(() => setCopiedId(null), 2500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl bg-background border border-purple-500/40 text-foreground shadow-2xl">
        <div className="bg-gradient-to-r from-[#1B0A4D] via-[#2B0A8A] to-[#5B1FE0] p-6 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white">
                <Sparkles className="w-5 h-5 text-pink-300" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-white">
                  Prompts Revisados dos Materiais Oficiais
                </DialogTitle>
                <DialogDescription className="text-xs text-purple-200 mt-0.5">
                  Prompts calibrados para geração consistente de cada peça oficial da MudarCurso.
                </DialogDescription>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleCopyAll}
              className="bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold gap-1.5 border border-white/30"
            >
              {copiedId === 'all' ? (
                <Check className="w-3.5 h-3.5 text-emerald-300" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>Copiar Todos (5)</span>
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Bloco Comum de Identidade */}
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <Badge className="bg-gradient-to-r from-[#5B21B6] to-[#FF2E93] text-white text-[10px] font-bold uppercase">
                Bloco Comum Obrigatório
              </Badge>
              <button
                type="button"
                onClick={() => handleCopy(COMMON_IDENTITY_BLOCK, 'common')}
                className="text-xs text-purple-600 dark:text-purple-300 hover:underline flex items-center gap-1 font-semibold"
              >
                {copiedId === 'common' ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>Copiar Bloco</span>
              </button>
            </div>
            <p className="text-xs text-foreground/90 font-mono leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">
              {COMMON_IDENTITY_BLOCK}
            </p>
          </div>

          {/* Lista das 5 Peças */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Prompts Específicos por Peça do Kit (5 Peças)
            </h3>

            {REVISED_PIECES_PROMPTS.map((item) => {
              const isCopied = copiedId === item.id
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-card border border-border/80 hover:border-purple-500/50 transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{item.title}</span>
                      <Badge variant="outline" className="text-[10px] font-mono text-purple-600">
                        {item.kind}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(item.prompt, item.id)}
                      className="h-7 text-xs rounded-lg gap-1 border-border/80"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed font-mono bg-muted/40 p-3 rounded-xl">
                    {item.prompt}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
