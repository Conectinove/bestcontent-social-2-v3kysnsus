import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FlaskConical, Plus, Trophy, Info, Loader2, CheckCircle2, BarChart3 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useSocial } from '@/context/SocialContext'
import { getABTests, createABTest, updateABTest, type ABTest } from '@/services/ab-tests'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [postA, setPostA] = useState('')
  const [postB, setPostB] = useState('')
  const [goal, setGoal] = useState('clicks')
  const [duration, setDuration] = useState('7')
  const [creating, setCreating] = useState(false)

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
      setPostA(preselected)
    }
  }, [user?.id])

  useRealtime('ab_tests', () => loadTests())

  const handleCreate = async () => {
    if (!user?.id || !postA || !postB) return
    setCreating(true)
    try {
      const now = new Date()
      const end = new Date()
      end.setDate(end.getDate() + parseInt(duration))
      await createABTest({
        user: user.id,
        post_a: postA,
        post_b: postB,
        status: 'running',
        goal,
        start_date: now.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
      })
      toast({ title: 'Experimento criado!', description: 'Teste A/B iniciado com sucesso.' })
      setShowCreate(false)
      setPostA('')
      setPostB('')
      loadTests()
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao criar experimento.', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

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

  const postOptions = posts as Post[]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-border pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Dashboard <BarChart3 className="w-6 h-6 text-primary" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão geral e comparador de performance
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-primary text-white gap-2">
          <Plus className="w-4 h-4" /> Novo Teste A/B
        </Button>
      </div>

      <Card className="p-4 bg-blue-500/5 border-blue-500/20">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            O rastreamento completo de cliques e conversões requer a conexão de ferramentas de
            analytics (ex: link shorteners com tracking). As métricas de engajamento exibidas são
            extraídas das plataformas sociais conectadas.
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
                        <TableHead className="text-xs text-center">Views</TableHead>
                        <TableHead className="text-xs text-center">Cliques</TableHead>
                        <TableHead className="text-xs text-center">Engaj.</TableHead>
                        <TableHead className="text-xs text-center">Conv.</TableHead>
                        <TableHead className="text-xs text-center">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-xs font-medium">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                              A
                            </span>
                            <span className="truncate max-w-[120px]">
                              {getPostTitle(postAData)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-center text-muted-foreground">
                          —
                        </TableCell>
                        <TableCell className="text-xs text-center text-muted-foreground">
                          —
                        </TableCell>
                        <TableCell className="text-xs text-center text-muted-foreground">
                          —
                        </TableCell>
                        <TableCell className="text-xs text-center text-muted-foreground">
                          —
                        </TableCell>
                        <TableCell className="text-center">
                          {test.status === 'running' && !test.winner && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-[10px] h-6 gap-1"
                              onClick={() => handleDeclareWinner(test, test.post_a)}
                            >
                              <Trophy className="w-3 h-3" /> Vencedor
                            </Button>
                          )}
                          {test.winner === test.post_a && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs font-medium">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-[10px] font-bold">
                              B
                            </span>
                            <span className="truncate max-w-[120px]">
                              {getPostTitle(postBData)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-center text-muted-foreground">
                          —
                        </TableCell>
                        <TableCell className="text-xs text-center text-muted-foreground">
                          —
                        </TableCell>
                        <TableCell className="text-xs text-center text-muted-foreground">
                          —
                        </TableCell>
                        <TableCell className="text-xs text-center text-muted-foreground">
                          —
                        </TableCell>
                        <TableCell className="text-center">
                          {test.status === 'running' && !test.winner && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-[10px] h-6 gap-1"
                              onClick={() => handleDeclareWinner(test, test.post_b)}
                            >
                              <Trophy className="w-3 h-3" /> Vencedor
                            </Button>
                          )}
                          {test.winner === test.post_b && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Teste A/B</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold block mb-1">Variação A</label>
              <Select value={postA} onValueChange={setPostA}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Selecione um post" />
                </SelectTrigger>
                <SelectContent>
                  {postOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.caption || p.content || 'Sem título'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Variação B</label>
              <Select value={postB} onValueChange={setPostB}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Selecione um post" />
                </SelectTrigger>
                <SelectContent>
                  {postOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.caption || p.content || 'Sem título'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">Objetivo</label>
                <Select value={goal} onValueChange={setGoal}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clicks" className="text-xs">
                      Cliques
                    </SelectItem>
                    <SelectItem value="conversions" className="text-xs">
                      Conversões
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Duração (dias)</label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7" className="text-xs">
                      7 dias
                    </SelectItem>
                    <SelectItem value="14" className="text-xs">
                      14 dias
                    </SelectItem>
                    <SelectItem value="30" className="text-xs">
                      30 dias
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !postA || !postB}
              className="bg-primary text-white gap-1"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FlaskConical className="w-4 h-4" />
              )}
              Criar Experimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
