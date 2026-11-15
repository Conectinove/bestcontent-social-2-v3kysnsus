import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Loader2, Mail, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { getOrgInviteByToken, acceptOrgInvite } from '@/services/org-invites'
import { ORG_ROLES } from '@/services/org-members'

/** Página pública /convite/:token — o convidado vê os dados e aceita (pede login se necessário). */
export default function OrgInviteAcceptPage() {
  const { token = '' } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [invite, setInvite] = useState<Awaited<ReturnType<typeof getOrgInviteByToken>> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState<{ org_role: string; email: string } | null>(null)

  useEffect(() => {
    let alive = true
    setError(null)
    getOrgInviteByToken(token)
      .then((res) => {
        if (alive) setInvite(res)
      })
      .catch((err: unknown) => {
        if (alive) setError(err instanceof Error ? err.message : 'Convite inválido ou expirado.')
      })
    return () => {
      alive = false
    }
  }, [token])

  const handleAccept = async () => {
    setAccepting(true)
    try {
      const res = await acceptOrgInvite(token)
      setAccepted(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Não foi possível aceitar o convite.')
    } finally {
      setAccepting(false)
    }
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="text-center space-y-3 max-w-sm">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Link to="/" className="text-xs text-primary underline">
            Voltar ao início
          </Link>
        </div>
      </div>
    )
  }

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (accepted) {
    const roleLabel =
      ORG_ROLES.find((r) => r.value === accepted.org_role)?.label || accepted.org_role
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="text-center space-y-4 max-w-sm">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h1 className="text-xl font-black text-foreground">Convite aceito!</h1>
          <p className="text-sm text-muted-foreground">
            Você agora é <strong>{roleLabel}</strong> na organização
            {invite.org ? ` ${invite.org}` : ''}.
          </p>
          <Button onClick={() => navigate('/app')} className="text-xs font-bold">
            Ir para o app
          </Button>
        </div>
      </div>
    )
  }

  const roleLabel = ORG_ROLES.find((r) => r.value === invite.org_role)?.label || invite.org_role

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-white dark:bg-slate-900 p-6 space-y-5 shadow-sm">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Mail className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-black text-foreground">Convite de organização</h1>
          {invite.org && <p className="text-xs text-muted-foreground">{invite.org}</p>}
        </div>

        <div className="p-3 rounded-xl bg-muted/40 border border-border/50 space-y-1.5 text-center">
          <p className="text-xs text-muted-foreground">Convidado</p>
          <p className="text-sm font-bold text-foreground">{invite.email}</p>
          <div className="flex items-center justify-center gap-1.5 text-xs text-primary font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Cargo: {roleLabel}
          </div>
        </div>

        {!isAuthenticated ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center">
              Você precisa entrar na sua conta (ou criar uma com este email) para aceitar o convite.
            </p>
            <Button
              className="w-full text-xs font-bold"
              onClick={() => navigate(`/login?redirect=/convite/${encodeURIComponent(token)}`)}
            >
              Entrar para aceitar
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center">
              Conectado como <strong>{user?.email || user?.name}</strong>.
            </p>
            <Button
              className="w-full text-xs font-bold"
              disabled={accepting || authLoading}
              onClick={handleAccept}
            >
              {accepting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Aceitar convite
            </Button>
          </div>
        )}

        {error && invite && <p className="text-[11px] text-destructive text-center">{error}</p>}
      </div>
    </div>
  )
}
