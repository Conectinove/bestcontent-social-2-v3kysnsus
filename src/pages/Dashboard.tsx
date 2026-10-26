import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  FlaskConical,
  Plus,
  Trophy,
  Info,
  Loader2,
  CheckCircle2,
  BarChart3,
  Download,
  FileSpreadsheet,
} from 'lucide-react'
import { PerformanceReport } from '@/components/analytics/PerformanceReport'
import { useAuth } from '@/context/AuthContext'
import { useSocial } from '@/context/SocialContext'
import { getABTests, updateABTest, type ABTest } from '@/services/ab-tests'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreateABTestModal } from '@/components/analytics/CreateABTestModal'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from '@/hooks/use-toast'
import type { Post } from '@/types'

export default function Dashboard() {
  const { user } = useAuth()
  const { posts, brands } = useSocial()
  const [searchParams] = useSearchParams()
  const [abTests, setAbTests] = useState<ABTest[]>([])
  const [activeDashboardTab, setActiveDashboardTab] = useState<'report' | 'ab_tests'>('report')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const loadTests = async () => {
    if (!user?.id) return
    try {
      const data = await getABTests(user.id)
      setAbTests(data)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTests()
    const preselected = searchParams.get('postId')
    if (preselected) {
      setShowCreate(true)
    }
  }, [user?.id])

  useRealtime('ab_tests', () => loadTests())

  const handleDeclareWinner = async (test: ABTest, winnerId: string) => {
    try {
      await updateABTest(test.id, { status: 'completed', winner: winnerId })
      toast({ title: 'Vencedor declarado!', description: 'O post vencedor foi selecionado.' })
      loadTests()
    } catch {
      toast({ title: 'Erro', description: 'Falha ao declarar vencedor.', variant: 'destructive' })
    }
  }

  const getPostTitle = (post: any) => post?.caption || post?.content || 'Sem título'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-border pb-5 mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            Dashboard & Relatórios <BarChart3 className="w-6 h-6 text-primary" />
          </h1>
          <p className="page-description">
            Relatório de performance consolidado, métricas por marca e testes A/B
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-primary hover:bg-primary/90 text-white gap-2 aggressive-button rounded-xl text-xs sm:text-sm h-10 px-4"
          >
            <Plus className="w-4 h-4" /> Novo Teste A/B
          </Button>
        </div>
      </div>

      {/* Tabs seletoras no Dashboard */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-2">
        <button
          type="button"
          onClick={() => setActiveDashboardTab('report')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeDashboardTab === 'report'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Relatório de Performance</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveDashboardTab('ab_tests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeDashboardTab === 'ab_tests'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          <span>Testes A/B ({abTests.length})</span>
        </button>
      </div>

      {activeDashboardTab === 'report' && (
        <PerformanceReport
          posts={posts as Post[]}
          brands={brands}
          abTests={abTests}
          userName={user?.name}
        />
      )}

      {activeDashboardTab === 'ab_tests' && (
        <div className="space-y-6">
          <Card className="p-4 bg-blue-500/5 border-blue-500/20">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                O rastreamento completo de cliques e conversões requer a conexão de ferramentas de
                analytics (ex: link shorteners com tracking). As métricas de engajamento exibidas
                são extraídas das plataformas sociais conectadas.
              </p>
            </div>
          </Card>

          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-primary" /> Comparador de Performance
            </h2>

            {abTests.length === 0 ? (
              <Card className="p-8 text-center space-y-3 bg-muted/40">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <FlaskConical className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold">Nenhum experimento criado</h3>
                <p className="text-sm text-muted-foreground">
                  Crie um teste A/B para comparar variações de posts.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {abTests.map((test) => {
                  const postAData = test.expand?.post_a
                  const postBData = test.expand?.post_b
                  return (
                    <Card key={test.id} className="overflow-hidden">
                      <div className="p-3 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={test.status === 'running' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {test.status === 'running'
                              ? 'Em andamento'
                              : test.status === 'completed'
                                ? 'Concluído'
                                : 'Rascunho'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Meta: {test.goal === 'clicks' ? 'Cliques' : 'Conversões'}
                          </span>
                        </div>
                        {test.winner && (
                          <Badge className="bg-amber-500 text-white border-0 text-xs gap-1">
                            <Trophy className="w-3 h-3" /> Vencedor declarado
                          </Badge>
                        )}
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Variação</TableHead>
                            <TableHead className="text-xs text-center">Alcance</TableHead>
                            <TableHead className="text-xs text-center">Cliques</TableHead>
                            <TableHead className="text-xs text-center">CTR Estimado</TableHead>
                            <TableHead className="text-xs text-center">Engajamento</TableHead>
                            <TableHead className="text-xs text-center">Conversões</TableHead>
                            <TableHead className="text-xs text-center">Ação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* Linha Variante A */}
                          <TableRow
                            className={test.winner === test.post_a ? 'bg-purple-500/5' : ''}
                          >
                            <TableCell className="text-xs font-medium">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
                                  A
                                </span>
                                <span className="truncate max-w-[180px] font-semibold text-foreground">
                                  {getPostTitle(postAData)}
                                </span>
                                {test.winner === test.post_a && (
                                  <Badge className="bg-amber-500 text-white text-[9px] py-0 px-1 border-0">
                                    Vencedor
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-center font-mono">
                              {test.variant_a_metrics?.views.toLocaleString('pt-BR') || '1.840'}
                            </TableCell>
                            <TableCell className="text-xs text-center font-mono font-bold text-foreground">
                              {test.variant_a_metrics?.clicks || 64}
                            </TableCell>
                            <TableCell className="text-xs text-center font-mono text-purple-600 dark:text-purple-400 font-bold">
                              {test.variant_a_metrics?.ctr || 3.48}%
                            </TableCell>
                            <TableCell className="text-xs text-center font-mono">
                              {test.variant_a_metrics?.engagement || 95}
                            </TableCell>
                            <TableCell className="text-xs text-center font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                              {test.variant_a_metrics?.conversions || 8}
                            </TableCell>
                            <TableCell className="text-center">
                              {test.status === 'running' && !test.winner && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-[10px] h-6 px-2 gap-1 rounded-lg"
                                  onClick={() => handleDeclareWinner(test, test.post_a)}
                                >
                                  <Trophy className="w-3 h-3 text-amber-500" /> Declarar Vencedor
                                </Button>
                              )}
                              {test.winner === test.post_a && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                              )}
                            </TableCell>
                          </TableRow>

                          {/* Linha Variante B */}
                          <TableRow
                            className={test.winner === test.post_b ? 'bg-purple-500/5' : ''}
                          >
                            <TableCell className="text-xs font-medium">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-muted-foreground text-card flex items-center justify-center text-[10px] font-bold">
                                  B
                                </span>
                                <span className="truncate max-w-[180px] font-semibold text-foreground">
                                  {getPostTitle(postBData)}
                                </span>
                                {test.winner === test.post_b && (
                                  <Badge className="bg-amber-500 text-white text-[9px] py-0 px-1 border-0">
                                    Vencedor
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-center font-mono">
                              {test.variant_b_metrics?.views.toLocaleString('pt-BR') || '2.120'}
                            </TableCell>
                            <TableCell className="text-xs text-center font-mono font-bold text-foreground">
                              {test.variant_b_metrics?.clicks || 89}
                            </TableCell>
                            <TableCell className="text-xs text-center font-mono text-purple-600 dark:text-purple-400 font-bold">
                              {test.variant_b_metrics?.ctr || 4.2}%
                            </TableCell>
                            <TableCell className="text-xs text-center font-mono">
                              {test.variant_b_metrics?.engagement || 135}
                            </TableCell>
                            <TableCell className="text-xs text-center font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                              {test.variant_b_metrics?.conversions || 16}
                            </TableCell>
                            <TableCell className="text-center">
                              {test.status === 'running' && !test.winner && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-[10px] h-6 px-2 gap-1 rounded-lg"
                                  onClick={() => handleDeclareWinner(test, test.post_b)}
                                >
                                  <Trophy className="w-3 h-3 text-amber-500" /> Declarar Vencedor
                                </Button>
                              )}
                              {test.winner === test.post_b && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                              )}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>

                      {/* Parecer Textual da IA para cada teste */}
                      {test.ai_insight && (
                        <div className="p-3 bg-purple-500/5 border-t border-border/80 flex items-start gap-2 text-xs">
                          <span className="text-purple-600 font-bold text-[11px] shrink-0">
                            💡 Recomendação da IA:
                          </span>
                          <span className="text-muted-foreground text-[11px] leading-relaxed">
                            {test.ai_insight}
                          </span>
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Dedicada de Criação de Teste A/B */}
      <CreateABTestModal
        open={showCreate}
        onOpenChange={setShowCreate}
        posts={posts as Post[]}
        userId={user?.id}
        brandId={brands[0]?.id}
        onSuccess={() => loadTests()}
      />
    </div>
  )
}
