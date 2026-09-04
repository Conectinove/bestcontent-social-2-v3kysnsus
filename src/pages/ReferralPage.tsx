import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Gift,
  Copy,
  Check,
  ExternalLink,
  Users,
  Share2,
  Sparkles,
  MessageCircle,
  Instagram,
  Linkedin,
  Mail,
  HelpCircle,
  Lightbulb,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/hooks/use-toast'

export default function ReferralPage() {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)

  // Derive referral code
  const referralCode =
    user?.referral_code ||
    (user?.name
      ? user.name
          .replace(/[^a-zA-Z0-9]/g, '')
          .slice(0, 7)
          .toUpperCase() + '89L'
      : 'RONALDD89L')

  const referralUrl = `https://bestcontent-social-2-5614f.goskip.app/signup?ref=${referralCode}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      toast({
        title: 'Link copiado com sucesso! 📋',
        description: 'Compartilhe com seus amigos para ganhar 500 créditos para cada assinatura.',
      })
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast({
        title: 'Erro ao copiar',
        description: 'Selecione e copie o link manualmente.',
        variant: 'destructive',
      })
    }
  }

  const handleShare = async () => {
    const shareData = {
      title: 'Convite para BestContent AI',
      text: 'Crie conteúdos incríveis para redes sociais com a BestContent AI! Cadastre-se pelo meu link:',
      url: referralUrl,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        // User cancelled or aborted
      }
    } else {
      handleCopyLink()
    }
  }

  const handleShareSocial = (platform: 'whatsapp' | 'linkedin' | 'email') => {
    const text = encodeURIComponent(
      `Olá! Estou usando o BestContent AI para criar posts incríveis com IA. Cadastre-se pelo meu link e conheça: ${referralUrl}`,
    )

    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
    } else if (platform === 'linkedin') {
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`,
        '_blank',
      )
    } else if (platform === 'email') {
      window.open(`mailto:?subject=Convite%20para%20o%20BestContent%20AI&body=${text}`, '_blank')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Top back link */}
      <div>
        <Link
          to="/app/feed"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Voltar ao Dashboard</span>
        </Link>
      </div>

      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 shadow-xs mb-1">
          <Gift className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          Indique e Ganhe
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Convide amigos para a BestContent e ganhe{' '}
          <strong className="text-purple-600 font-bold">500 créditos extras</strong> para cada um
          que assinar um plano.
        </p>
      </div>

      {/* Main Gradient Referral Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-purple-500/10 border border-purple-200/80 dark:border-purple-800/50 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-bold text-foreground">Indique e Ganhe</h2>
          </div>
          <Badge className="bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 border-0 text-xs font-bold px-2.5 py-0.5 rounded-full">
            +500 créditos
          </Badge>
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Convide amigos para a BestContent! Quando eles assinarem um plano pago, você ganha{' '}
          <strong className="text-purple-600 font-bold">500 créditos extras</strong>.
        </p>

        {/* Inner White Box: Seu código */}
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-medium text-muted-foreground block mb-0.5">
              Seu código
            </span>
            <span className="font-mono text-xl sm:text-2xl font-black tracking-wider text-foreground select-all">
              {referralCode}
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleCopyLink}
            className="h-10 rounded-xl border-border hover:bg-muted font-bold text-xs gap-2 shrink-0 px-4 shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-600">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-muted-foreground" />
                <span>Copiar link</span>
              </>
            )}
          </Button>
        </div>

        {/* Wide Purple Button */}
        <Button
          type="button"
          onClick={handleShare}
          className="w-full h-12 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm gap-2 shadow-md shadow-purple-500/20 active:scale-[0.99] transition-transform"
        >
          <Gift className="w-4 h-4" />
          <span>Compartilhar meu link</span>
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>

      {/* Card Seus Indicados (Empty state faithful to mockup) */}
      <div className="p-6 sm:p-7 rounded-3xl bg-card border border-border shadow-xs space-y-6">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          <h2 className="text-base font-bold text-foreground">Seus Indicados</h2>
        </div>

        <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground/60">
            <Users className="w-8 h-8 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">Nenhum indicado ainda</p>
            <p className="text-xs text-muted-foreground">
              Compartilhe seu link e veja seus indicados aqui!
            </p>
          </div>
        </div>
      </div>

      {/* Como funciona - 3 passos numerados */}
      <div className="p-6 sm:p-7 rounded-3xl bg-card border border-border shadow-xs space-y-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h2 className="text-base font-bold text-foreground">Como funciona</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Passo 1 */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
            <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
              1
            </div>
            <h3 className="text-xs font-bold text-foreground">Compartilhe seu link</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Envie seu link exclusivo para amigos que podem se beneficiar da BestContent.
            </p>
          </div>

          {/* Passo 2 */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
            <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
              2
            </div>
            <h3 className="text-xs font-bold text-foreground">Amigo cria conta</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Quando seu amigo se cadastrar usando seu link, ele fica vinculado a você.
            </p>
          </div>

          {/* Passo 3 */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
            <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
              3
            </div>
            <h3 className="text-xs font-bold text-foreground">Ganhe créditos</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Quando seu amigo assinar um plano pago, você recebe 500 créditos extras
              automaticamente.
            </p>
          </div>
        </div>
      </div>

      {/* Como divulgar meu link? Dicas em cards */}
      <div className="p-6 sm:p-7 rounded-3xl bg-card border border-border shadow-xs space-y-5">
        <div className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-purple-600" />
          <h2 className="text-base font-bold text-foreground">Como divulgar meu link?</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* WhatsApp */}
          <button
            type="button"
            onClick={() => handleShareSocial('whatsapp')}
            className="p-3.5 rounded-2xl border border-border hover:border-emerald-500/50 hover:bg-emerald-500/5 text-left transition-all duration-200 cursor-pointer space-y-1 group"
          >
            <div className="flex items-center gap-2 text-emerald-600">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs font-bold">WhatsApp</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Envie diretamente em conversas com amigos e criadores parceiros.
            </p>
          </button>

          {/* Stories */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="p-3.5 rounded-2xl border border-border hover:border-pink-500/50 hover:bg-pink-500/5 text-left transition-all duration-200 cursor-pointer space-y-1 group"
          >
            <div className="flex items-center gap-2 text-pink-600">
              <Instagram className="w-4 h-4" />
              <span className="text-xs font-bold">Stories do Instagram</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Use a figurinha de link no Instagram para atrair seus seguidores.
            </p>
          </button>

          {/* Grupos */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="p-3.5 rounded-2xl border border-border hover:border-blue-500/50 hover:bg-blue-500/5 text-left transition-all duration-200 cursor-pointer space-y-1 group"
          >
            <div className="flex items-center gap-2 text-blue-600">
              <Users className="w-4 h-4" />
              <span className="text-xs font-bold">Grupos & Comunidades</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Compartilhe em grupos de marketing, agências e criadores de conteúdo.
            </p>
          </button>

          {/* LinkedIn */}
          <button
            type="button"
            onClick={() => handleShareSocial('linkedin')}
            className="p-3.5 rounded-2xl border border-border hover:border-indigo-500/50 hover:bg-indigo-500/5 text-left transition-all duration-200 cursor-pointer space-y-1 group"
          >
            <div className="flex items-center gap-2 text-indigo-600">
              <Linkedin className="w-4 h-4" />
              <span className="text-xs font-bold">LinkedIn</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Faça um post mostrando como a IA otimizou o seu fluxo de produção.
            </p>
          </button>

          {/* Email */}
          <button
            type="button"
            onClick={() => handleShareSocial('email')}
            className="p-3.5 rounded-2xl border border-border hover:border-purple-500/50 hover:bg-purple-500/5 text-left transition-all duration-200 cursor-pointer space-y-1 sm:col-span-2 group"
          >
            <div className="flex items-center gap-2 text-purple-600">
              <Mail className="w-4 h-4" />
              <span className="text-xs font-bold">E-mail</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Indique para colegas de equipe, clientes e parceiros por mensagem direta.
            </p>
          </button>
        </div>

        {/* Card Dica Extra */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-foreground">Dica Extra</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Mostre resultados! Compartilhe posts que você criou com a ferramenta junto com seu
              link. Pessoas confiam mais quando veem o que é possível produzir.
            </p>
          </div>
        </div>
      </div>

      {/* Seção Perguntas Frequentes (Accordion) */}
      <div className="p-6 sm:p-7 rounded-3xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-purple-600" />
          <h2 className="text-base font-bold text-foreground">Perguntas Frequentes</h2>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-border/60">
            <AccordionTrigger className="text-xs font-semibold hover:no-underline hover:text-purple-600 py-3">
              Quantas pessoas posso indicar?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
              Não há limite! Você pode convidar quantos amigos desejar e continuará recebendo 500
              créditos extras para cada uma que assinar qualquer plano pago.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2" className="border-border/60">
            <AccordionTrigger className="text-xs font-semibold hover:no-underline hover:text-purple-600 py-3">
              Quando recebo os créditos?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
              Os 500 créditos são creditados automaticamente no saldo da sua conta assim que o
              indicado realizar o primeiro pagamento da assinatura com sucesso.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3" className="border-border/60">
            <AccordionTrigger className="text-xs font-semibold hover:no-underline hover:text-purple-600 py-3">
              Os créditos expiram?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
              Não! Os créditos obtidos por indicação são somados aos seus créditos extras e não
              expiram enquanto sua conta estiver ativa na BestContent.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4" className="border-border/60">
            <AccordionTrigger className="text-xs font-semibold hover:no-underline hover:text-purple-600 py-3">
              Meu indicado também ganha algo?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
              Por enquanto, apenas quem indica recebe os créditos. Mas fique de olho em novidades,
              estamos preparando benefícios especiais também para novos usuários indicados!
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
