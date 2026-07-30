import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight, Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import pb from '@/lib/pocketbase/client'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    try {
      await pb.collection('users').requestPasswordReset(email)
      setSent(true)
      toast({ title: 'E-mail enviado!', description: 'Verifique sua caixa de entrada.' })
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-fade-in">
      <Card className="w-full max-w-md border-border shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Recuperar Senha</CardTitle>
          <CardDescription className="text-xs">
            Digite seu e-mail para receber um link de redefinição.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-sm text-muted-foreground">
                Se o e-mail existir, um link de redefinição foi enviado para{' '}
                <span className="font-semibold text-foreground">{email}</span>.
              </p>
              <Link to="/login">
                <Button variant="outline" className="w-full text-xs gap-1">
                  Voltar para login <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1">E-mail</label>
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
                className="w-full bg-primary text-white font-medium text-sm gap-1"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Enviar link <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          )}
          <div className="mt-6 text-center text-xs text-muted-foreground">
            Lembrou a senha?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Faça login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
