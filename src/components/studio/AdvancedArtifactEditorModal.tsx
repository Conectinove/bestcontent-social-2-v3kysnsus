import React, { useState } from 'react'
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  FlaskConical,
  BookOpen,
  Globe,
  FileText,
  Eye,
  Download,
  CheckCircle2,
  Sparkles,
  Layers,
  Copy,
  ExternalLink,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { SecondBrainDoc, SecondBrainDocType, SecondBrainModule } from '@/services/second-brain'

interface AdvancedArtifactEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  doc: SecondBrainDoc
  onApplyArtifact: (updated: SecondBrainDoc) => void
}

export const AdvancedArtifactEditorModal: React.FC<AdvancedArtifactEditorModalProps> = ({
  open,
  onOpenChange,
  doc,
  onApplyArtifact,
}) => {
  const { toast } = useToast()
  const [activeType, setActiveType] = useState<SecondBrainDocType>(doc.doc_type || 'aula_lab')
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor')

  // Estrutura guiada de Laboratório
  const [labObjective, setLabObjective] = useState(
    'Capacitar a equipe ou aluno na execução prática do conceito, com validação hands-on.',
  )
  const [labMaterials, setLabMaterials] = useState(
    '- Computador com navegador atualizado\n- Acesso à plataforma MidiaViva\n- Chaves de API e conta conectada',
  )
  const [labSteps, setLabSteps] = useState(
    '1. Preparação do ambiente e verificação dos pré-requisitos.\n2. Execução da etapa guiada com monitoramento dos parâmetros.\n3. Análise crítica dos dados obtidos e checkpoint de validação.\n4. Documentação das conclusões e próximos passos.',
  )
  const [labExpectedResult, setLabExpectedResult] = useState(
    'Relatório consolidado e artefato final publicado com sucesso, atingindo mais de 90% de conformidade.',
  )

  // Estrutura guiada de Blog / Artigo
  const [blogCover, setBlogCover] = useState(
    'https://img.usecurling.com/p/1200/630?q=creative,technology,studio&color=purple',
  )
  const [blogHook, setBlogHook] = useState(
    'Como transformar ideias dispersas em uma máquina de conteúdo pedagógico e de alto impacto.',
  )
  const [blogSubheadings, setBlogSubheadings] = useState(
    '1. O Dilema da Sobrecarga de Informações\n2. O Modelo de Segundo Cérebro Aplicado\n3. Três Passos para Implementar Hoje',
  )
  const [blogBody, setBlogBody] = useState(
    'A criação de conteúdo moderna exige mais do que inspiração momentânea: necessita de uma infraestrutura confiável de armazenamento, conexão e amplificação através da inteligência artificial.',
  )
  const [blogCta, setBlogCta] = useState(
    'Gostou do conteúdo? Inscreva-se em nossa newsletter e conecte seu Segundo Cérebro no MidiaViva.',
  )

  // Estrutura guiada de Site / Landing Page
  const [siteHeroTitle, setSiteHeroTitle] = useState(doc.title || 'Inovação e Performance Digital')
  const [siteHeroSubtitle, setSiteHeroSubtitle] = useState(
    'A plataforma definitiva para planejar, criar e publicar conteúdo de alta conversão.',
  )
  const [sitePrimaryCta, setSitePrimaryCta] = useState('Começar Gratuitamente')
  const [siteFeatures, setSiteFeatures] = useState(
    '- Conexão com Nuvem: Gmail, Drive, Outlook e OneDrive integrados\n- IA Pedagógica: Módulos com validação ultra calibrada\n- Exportação Completa: HTML moderno responsivo pronto para deploy',
  )
  const [siteSocialProof, setSiteSocialProof] = useState(
    'Mais de 10.000 criadores e educadores utilizam o MidiaViva diariamente.',
  )

  // Geração de HTML dedicado para exportação e preview
  const generateArtifactHtml = (): string => {
    if (activeType === 'aula_lab') {
      return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${doc.title} - Laboratório Prático</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f1f5f9; padding: 2.5rem 1.5rem; line-height: 1.6; max-width: 860px; margin: auto; }
    h1 { font-family: 'Archivo Black', sans-serif; font-size: 2.2rem; color: #c084fc; margin-bottom: 0.5rem; }
    .badge { display: inline-block; background: rgba(168, 85, 247, 0.2); color: #d8b4fe; padding: 4px 12px; border-radius: 9999px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; margin-bottom: 2rem; border: 1px solid rgba(168, 85, 247, 0.3); }
    .card { background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; }
    h2 { font-size: 1.25rem; color: #38bdf8; margin-top: 0; border-bottom: 1px solid #1e293b; padding-bottom: 0.5rem; }
    pre, ul, ol { white-space: pre-wrap; font-size: 0.95rem; color: #cbd5e1; }
    .footer { text-align: center; color: #64748b; font-size: 0.8rem; margin-top: 3rem; }
  </style>
</head>
<body>
  <div class="badge">Laboratório Interativo · MidiaViva MagicAuthor</div>
  <h1>${doc.title}</h1>
  <div class="card">
    <h2>🎯 Objetivo do Laboratório</h2>
    <p>${labObjective}</p>
  </div>
  <div class="card">
    <h2>📦 Materiais e Pré-requisitos</h2>
    <pre>${labMaterials}</pre>
  </div>
  <div class="card">
    <h2>🛠️ Passo a Passo Prático</h2>
    <pre>${labSteps}</pre>
  </div>
  <div class="card">
    <h2>🏆 Resultado Esperado e Avaliação</h2>
    <p>${labExpectedResult}</p>
  </div>
  <div class="footer">Gerado com o Segundo Cérebro · MidiaViva</div>
</body>
</html>`
    }

    if (activeType === 'blog_artigo') {
      return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${doc.title} - Blog</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #090d16; color: #f8fafc; padding: 2rem 1rem; line-height: 1.8; max-width: 780px; margin: auto; }
    .cover { width: 100%; height: 320px; object-fit: cover; border-radius: 20px; margin-bottom: 2rem; border: 1px solid #1e293b; }
    h1 { font-family: 'Archivo Black', sans-serif; font-size: 2.4rem; color: #f1f5f9; line-height: 1.2; margin-bottom: 1rem; }
    .hook { font-size: 1.25rem; color: #cbd5e1; font-weight: 500; border-left: 4px solid #a855f7; padding-left: 1rem; margin: 1.5rem 0 2rem; }
    .outline { background: #111827; padding: 1.5rem; border-radius: 14px; border: 1px solid #1f2937; margin: 2rem 0; font-size: 0.95rem; color: #94a3b8; white-space: pre-wrap; }
    p { font-size: 1.1rem; color: #e2e8f0; margin-bottom: 1.5rem; }
    .cta { background: linear-gradient(135deg, #7c3aed, #4f46e5); color: #fff; padding: 2rem; border-radius: 18px; text-align: center; margin-top: 3rem; }
    .cta h3 { margin: 0 0 0.5rem; font-size: 1.4rem; }
  </style>
</head>
<body>
  ${blogCover ? `<img src="${blogCover}" alt="Capa" class="cover" />` : ''}
  <h1>${doc.title}</h1>
  <div class="hook">${blogHook}</div>
  <div class="outline">
    <strong>Estrutura e Tópicos Centrais:</strong>\n${blogSubheadings}
  </div>
  <p>${blogBody}</p>
  <div class="cta">
    <h3>Próximo Passo</h3>
    <p style="margin: 0;">${blogCta}</p>
  </div>
</body>
</html>`
    }

    // Site / Landing Page
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${siteHeroTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #030712; color: #f9fafb; margin: 0; padding: 0; line-height: 1.6; }
    .hero { text-align: center; padding: 5rem 1.5rem 3rem; max-width: 920px; margin: auto; }
    h1 { font-family: 'Archivo Black', sans-serif; font-size: 3rem; background: linear-gradient(to right, #c084fc, #38bdf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0 0 1rem; }
    .subtitle { font-size: 1.25rem; color: #94a3b8; max-width: 680px; margin: auto auto 2rem; }
    .btn { display: inline-block; background: #a855f7; color: #fff; padding: 0.85rem 2rem; border-radius: 9999px; text-decoration: none; font-weight: bold; font-size: 1.1rem; box-shadow: 0 10px 25px rgba(168, 85, 247, 0.4); }
    .features { max-width: 860px; margin: 3rem auto; padding: 0 1.5rem; }
    .feature-card { background: #111827; border: 1px solid #1f2937; border-radius: 18px; padding: 2rem; white-space: pre-wrap; font-size: 1rem; color: #e2e8f0; }
    .social-proof { text-align: center; color: #64748b; font-size: 0.9rem; padding: 2rem; }
  </style>
</head>
<body>
  <div class="hero">
    <h1>${siteHeroTitle}</h1>
    <p class="subtitle">${siteHeroSubtitle}</p>
    <a href="#action" class="btn">${sitePrimaryCta}</a>
  </div>
  <div class="features">
    <div class="feature-card">
      <h3 style="color: #c084fc; margin-top: 0;">Recursos e Diferenciais</h3>
      ${siteFeatures}
    </div>
  </div>
  <div class="social-proof">${siteSocialProof}</div>
</body>
</html>`
  }

  const handleExportHtml = () => {
    const htmlContent = generateArtifactHtml()
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'artefato'}-${activeType}.html`
    a.click()
    URL.revokeObjectURL(url)
    toast({
      title: 'Artefato exportado!',
      description: `Arquivo HTML para "${activeType}" baixado com sucesso.`,
    })
  }

  const handleApplyToEditor = () => {
    let newModules: SecondBrainModule[] = []

    if (activeType === 'aula_lab') {
      newModules = [
        {
          id: `mod-${Date.now()}-obj`,
          title: '🎯 Módulo 1: Objetivo e Pré-requisitos',
          blocks: [
            {
              id: `blk-${Date.now()}-1`,
              type: 'title',
              level: 2,
              content: 'Objetivo da Atividade Prática',
              caption: labObjective,
              isActive: true,
            },
            {
              id: `blk-${Date.now()}-2`,
              type: 'paragraph',
              content: `Materiais Necessários:\n${labMaterials}`,
              caption: 'Pré-requisitos e infraestrutura',
              isActive: true,
            },
          ],
        },
        {
          id: `mod-${Date.now()}-exec`,
          title: '🛠️ Módulo 2: Roteiro e Execução Passo a Passo',
          blocks: [
            {
              id: `blk-${Date.now()}-3`,
              type: 'paragraph',
              content: labSteps,
              caption: 'Passos hands-on',
              isActive: true,
            },
            {
              id: `blk-${Date.now()}-4`,
              type: 'quiz',
              content: 'Checkpoint: Você concluiu a etapa sem erros de compilação?',
              caption: 'Critério de verificação rápida',
              isActive: true,
            },
          ],
        },
        {
          id: `mod-${Date.now()}-res`,
          title: '🏆 Módulo 3: Resultados e Entrega Final',
          blocks: [
            {
              id: `blk-${Date.now()}-5`,
              type: 'paragraph',
              content: labExpectedResult,
              caption: 'Padrão de qualidade esperado',
              isActive: true,
            },
          ],
        },
      ]
    } else if (activeType === 'blog_artigo') {
      newModules = [
        {
          id: `mod-${Date.now()}-capa`,
          title: '📰 Estrutura Editorial: Capa & Gancho',
          blocks: [
            {
              id: `blk-${Date.now()}-1`,
              type: 'title',
              level: 1,
              content: doc.title,
              caption: blogHook,
              isActive: true,
            },
            {
              id: `blk-${Date.now()}-2`,
              type: 'paragraph',
              content: `[Imagem de Capa]: ${blogCover}`,
              caption: 'Asset visual principal',
              isActive: true,
            },
          ],
        },
        {
          id: `mod-${Date.now()}-corpo`,
          title: '✍️ Desenvolvimento & Tópicos',
          blocks: [
            {
              id: `blk-${Date.now()}-3`,
              type: 'paragraph',
              content: `Tópicos Centrais:\n${blogSubheadings}`,
              caption: 'Outline e subtítulos',
              isActive: true,
            },
            {
              id: `blk-${Date.now()}-4`,
              type: 'paragraph',
              content: blogBody,
              caption: 'Corpo do artigo',
              isActive: true,
            },
          ],
        },
        {
          id: `mod-${Date.now()}-cta`,
          title: '🎯 Conclusão & CTA',
          blocks: [
            {
              id: `blk-${Date.now()}-5`,
              type: 'paragraph',
              content: blogCta,
              caption: 'Chamada para ação',
              isActive: true,
            },
          ],
        },
      ]
    } else {
      // Site / Landing
      newModules = [
        {
          id: `mod-${Date.now()}-hero`,
          title: '🚀 Seção Hero (Destaque)',
          blocks: [
            {
              id: `blk-${Date.now()}-1`,
              type: 'title',
              level: 1,
              content: siteHeroTitle,
              caption: siteHeroSubtitle,
              isActive: true,
            },
            {
              id: `blk-${Date.now()}-2`,
              type: 'paragraph',
              content: `Botão Principal: "${sitePrimaryCta}"`,
              caption: 'Call-to-Action Hero',
              isActive: true,
            },
          ],
        },
        {
          id: `mod-${Date.now()}-feat`,
          title: '⭐ Benefícios & Diferenciais',
          blocks: [
            {
              id: `blk-${Date.now()}-3`,
              type: 'paragraph',
              content: siteFeatures,
              caption: 'Grade de funcionalidades',
              isActive: true,
            },
            {
              id: `blk-${Date.now()}-4`,
              type: 'paragraph',
              content: `Prova Social: ${siteSocialProof}`,
              caption: 'Confiança e números',
              isActive: true,
            },
          ],
        },
      ]
    }

    const updatedDoc: SecondBrainDoc = {
      ...doc,
      doc_type: activeType,
      modules: newModules,
    }

    onApplyArtifact(updatedDoc)
    onOpenChange(false)
    toast({
      title: 'Estrutura Avançada Aplicada!',
      description: `O editor foi atualizado com a estrutura guiada de ${activeType}.`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800 text-slate-100 rounded-3xl p-6">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-black text-white flex items-center gap-2 font-heading">
              <Layers className="w-5 h-5 text-purple-400" />
              Modo Avançado do Editor: Artefatos Dedicados
            </DialogTitle>
            <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30">
              High Impact
            </Badge>
          </div>
          <DialogDescription className="text-xs text-slate-400">
            Estruturas guiadas com campos específicos para Laboratório, Blog e Landing Page.
            Pré-visualize e exporte HTML instantaneamente.
          </DialogDescription>
        </DialogHeader>

        {/* Seletor do Tipo de Artefato */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            type="button"
            onClick={() => setActiveType('aula_lab')}
            className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
              activeType === 'aula_lab'
                ? 'bg-purple-950/60 border-purple-500 text-white ring-1 ring-purple-500/30'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-white">Laboratório / Aula</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Objetivo, materiais, passos e resultado.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveType('blog_artigo')}
            className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
              activeType === 'blog_artigo'
                ? 'bg-purple-950/60 border-purple-500 text-white ring-1 ring-purple-500/30'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-white">Blog / Artigo</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Capa, gancho, subtítulos, corpo e CTA.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveType('site_landing')}
            className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
              activeType === 'site_landing'
                ? 'bg-purple-950/60 border-purple-500 text-white ring-1 ring-purple-500/30'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-white">Site / Landing Page</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Hero, proposta, recursos e conversão.
              </p>
            </div>
          </button>
        </div>

        {/* Abas: Campos Guiados vs Pré-visualização */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <TabsList className="bg-slate-950 border border-slate-800">
              <TabsTrigger value="editor" className="text-xs gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                Estrutura Guiada
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-xs gap-1.5">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                Pré-visualização do Artefato
              </TabsTrigger>
            </TabsList>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportHtml}
              className="border-slate-700 text-slate-200 hover:bg-slate-800 text-xs h-8 gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              Exportar HTML
            </Button>
          </div>

          {/* TAB 1: CAMPOS GUIADOS */}
          <TabsContent value="editor" className="space-y-4 pt-3">
            {activeType === 'aula_lab' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300">
                    🎯 Objetivo do Laboratório
                  </label>
                  <Textarea
                    value={labObjective}
                    onChange={(e) => setLabObjective(e.target.value)}
                    className="mt-1 bg-slate-950 border-slate-800 text-xs text-slate-200 rounded-xl"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300">
                    📦 Materiais e Pré-requisitos
                  </label>
                  <Textarea
                    value={labMaterials}
                    onChange={(e) => setLabMaterials(e.target.value)}
                    className="mt-1 bg-slate-950 border-slate-800 text-xs text-slate-200 rounded-xl font-mono"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300">
                    🛠️ Roteiro Passo a Passo
                  </label>
                  <Textarea
                    value={labSteps}
                    onChange={(e) => setLabSteps(e.target.value)}
                    className="mt-1 bg-slate-950 border-slate-800 text-xs text-slate-200 rounded-xl font-mono"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300">
                    🏆 Resultado Esperado e Validação
                  </label>
                  <Textarea
                    value={labExpectedResult}
                    onChange={(e) => setLabExpectedResult(e.target.value)}
                    className="mt-1 bg-slate-950 border-slate-800 text-xs text-slate-200 rounded-xl"
                    rows={2}
                  />
                </div>
              </div>
            )}

            {activeType === 'blog_artigo' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300">
                    🖼️ URL da Imagem de Capa
                  </label>
                  <Input
                    value={blogCover}
                    onChange={(e) => setBlogCover(e.target.value)}
                    className="mt-1 bg-slate-950 border-slate-800 text-xs text-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300">
                    🎣 Gancho / Linha de Abertura (Hook)
                  </label>
                  <Textarea
                    value={blogHook}
                    onChange={(e) => setBlogHook(e.target.value)}
                    className="mt-1 bg-slate-950 border-slate-800 text-xs text-slate-200 rounded-xl"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300">
                    📑 Subtítulos e Tópicos
                  </label>
                  <Textarea
                    value={blogSubheadings}
                    onChange={(e) => setBlogSubheadings(e.target.value)}
                    className="mt-1 bg-slate-950 border-slate-800 text-xs text-slate-200 rounded-xl font-mono"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300">✍️ Corpo do Artigo</label>
                  <Textarea
                    value={blogBody}
                    onChange={(e) => setBlogBody(e.target.value)}
                    className="mt-1 bg-slate-950 border-slate-800 text-xs text-slate-200 rounded-xl"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300">
                    🚀 Chamada para Ação (CTA)
                  </label>
                  <Input
                    value={blogCta}
                    onChange={(e) => setBlogCta(e.target.value)}
                    className="mt-1 bg-slate-950 border-slate-800 text-xs text-slate-200 rounded-xl"
                  />
                </div>
              </div>
            )}

            {activeType === 'site_landing' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300">🚀 Título da Hero</label>
                    <Input
                      value={siteHeroTitle}
                      onChange={(e) => setSiteHeroTitle(e.target.value)}
                      className="mt-1 bg-slate-950 border-slate-800 text-xs text-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300">
                      🔘 Botão Principal (CTA)
                    </label>
                    <Input
                      value={sitePrimaryCta}
                      onChange={(e) => setSitePrimaryCta(e.target.value)}
                      className="mt-1 bg-slate-950 border-slate-800 text-xs text-slate-200 rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300">
                    📝 Subtítulo / Proposta de Valor
                  </label>
                  <Textarea
                    value={siteHeroSubtitle}
                    onChange={(e) => setSiteHeroSubtitle(e.target.value)}
                    className="mt-1 bg-slate-950 border-slate-800 text-xs text-slate-200 rounded-xl"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300">
                    ⭐ Recursos e Diferenciais
                  </label>
                  <Textarea
                    value={siteFeatures}
                    onChange={(e) => setSiteFeatures(e.target.value)}
                    className="mt-1 bg-slate-950 border-slate-800 text-xs text-slate-200 rounded-xl font-mono"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300">
                    🤝 Prova Social / Depoimento
                  </label>
                  <Input
                    value={siteSocialProof}
                    onChange={(e) => setSiteSocialProof(e.target.value)}
                    className="mt-1 bg-slate-950 border-slate-800 text-xs text-slate-200 rounded-xl"
                  />
                </div>
              </div>
            )}
          </TabsContent>

          {/* TAB 2: PRÉ-VISUALIZAÇÃO */}
          <TabsContent value="preview" className="pt-3">
            <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
              <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono">Preview ao vivo ({activeType})</span>
                <Badge variant="outline" className="text-[10px] border-slate-700">
                  Responsivo 360px+
                </Badge>
              </div>
              <iframe
                title="Pré-visualização do Artefato"
                srcDoc={generateArtifactHtml()}
                className="w-full h-[360px] bg-slate-950 border-0"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Rodapé com Ações */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <p className="text-[11px] text-slate-400">
            Aplicar transfere os campos guiados diretamente para os módulos do MagicAuthor.
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-800 text-slate-400 hover:text-slate-200 text-xs h-9 rounded-xl flex-1 sm:flex-initial"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleApplyToEditor}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs h-9 rounded-xl gap-1.5 flex-1 sm:flex-initial shadow-lg shadow-purple-900/30"
            >
              <CheckCircle2 className="w-4 h-4" />
              Aplicar Estrutura no Editor
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
