import { useState } from 'react'
import { Link, useNavigate } from 'react'
import { Sparkles, ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('juliana@bestcontent.app')
  const [password, setPassword] = useState('123456')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast({ title: 'Erro', description: 'Preencha todos os campos.' })
      return
    }

    await login(email, password)
    toast({ title: 'Bem-vindo de volta!', description: 'Sessão iniciada com sucesso.' })
    navigate('/app/feed')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-fade-in">
      <Card className="w-full max-w-md border-border shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
            BestContent Social 2
          </CardTitle>
          <CardDescription className="text-xs">
            Entre na sua conta para gerenciar conteúdo e tendências.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold block mb-1">E-mail</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold">Senha</label>
                <Link
                  to="/auth/forgot-password"
                  className="text-[11px] text-primary hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-white font-medium text-xs gap-1"
            >
              Entrar na Conta
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            Ainda não possui conta?{' '}
            <Link to="/auth/register" className="text-primary font-semibold hover:underline">
              Criar conta grátis
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
