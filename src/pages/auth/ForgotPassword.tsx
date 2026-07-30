import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
    toast({ title: 'E-mail enviado', description: 'Verifique sua caixa de entrada.' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-fade-in">
      <Card className="w-full max-w-md border-border shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl font-bold">Recuperar Senha</CardTitle>
          <CardDescription className="text-xs">
            Enviaremos as instruções de redefinição para o seu e-mail.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {sent ? (
            <div className="text-center space-y-3 py-4">
              <Mail className="w-10 h-10 text-primary mx-auto animate-bounce" />
              <p className="text-xs text-muted-foreground">
                Instruções enviadas para <strong className="text-foreground">{email}</strong>.
              </p>
              <Button asChild variant="outline" className="text-xs">
                <Link to="/auth/login">Voltar ao Login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1">Seu E-mail</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-primary text-white text-xs">
                Enviar Link de Recuperação
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
