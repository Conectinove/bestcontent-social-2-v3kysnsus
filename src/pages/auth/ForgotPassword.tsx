import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Mail, Loader2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSubmitting(true)
    try {
      await pb.collection('users').requestPasswordReset(email)
    } catch (_) {
      // Silently handle — always show success for security
    }
    setSubmitting(false)
    setSent(true)
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
              <p className="text-sm text-muted-foreground">
                Enviamos um link de recuperação para o seu email.
              </p>
              <Button asChild variant="outline" className="text-xs">
                <Link to="/login">Voltar ao Login</Link>
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
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-white text-sm"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Enviar link de recuperação'
                )}
              </Button>
            </form>
          )}

          {!sent && (
            <div className="mt-6 text-center text-xs text-muted-foreground">
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Voltar ao login
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
