import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Instagram,
  Facebook,
  Linkedin,
  Printer,
  FileText,
  Smartphone,
  Crown,
  Share2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// Custom WhatsApp SVG icon
export function WhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.586-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.299.144.347.491 1.2.534 1.287.043.087.072.188.014.303-.058.116-.087.188-.173.289l-.26.303c-.087.087-.179.182-.077.357.101.174.45 1.053 1.107 1.638.846.753 1.558.986 1.777 1.095.219.109.347.094.477-.055.13-.149.558-.65.707-.874.149-.224.298-.187.5-.112.203.075 1.288.607 1.51.718.222.111.37.166.425.26.055.094.055.549-.089.954z" />
    </svg>
  )
}

// Custom TikTok SVG icon
export function TikTokIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.99-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  )
}

// Custom YouTube SVG icon
export function YouTubeIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

export function ImagesCardIllustration() {
  return (
    <div className="w-full h-44 rounded-2xl bg-gradient-to-b from-[#f5f3ff] via-[#ede9fe] to-[#f3f0ff] p-4 flex items-center justify-center relative overflow-hidden select-none">
      {/* Decorative stacked cards */}
      <div className="relative w-48 h-32 flex items-center justify-center">
        {/* Back card */}
        <div className="absolute w-36 h-28 bg-[#ddd6fe]/60 rounded-xl transform -rotate-12 translate-x-[-18px] translate-y-[-2px] border border-white/60 shadow-xs" />
        {/* Middle card */}
        <div className="absolute w-38 h-28 bg-[#ede9fe] rounded-xl transform -rotate-6 translate-x-[-6px] border border-white/80 shadow-sm" />
        {/* Front card (framed image) */}
        <div className="absolute w-44 h-28 bg-white rounded-xl shadow-md border border-purple-100 p-2 flex flex-col justify-between overflow-hidden">
          <div className="w-full h-full bg-[#f8fafc] rounded-lg relative overflow-hidden flex items-end justify-center">
            {/* Sun / Moon circle */}
            <div className="absolute top-2.5 right-3 w-3.5 h-3.5 rounded-full bg-[#cbd5e1]" />
            {/* Mountain shapes */}
            <svg
              viewBox="0 0 160 80"
              className="w-full h-16 text-[#94a3b8] fill-current opacity-85"
              preserveAspectRatio="none"
            >
              <polygon points="0,80 30,35 65,80" fill="#94a3b8" />
              <polygon points="40,80 85,20 135,80" fill="#64748b" />
              <polygon points="105,80 140,40 160,80" fill="#475569" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

export function VideoCardIllustration() {
  return (
    <div className="w-full h-44 rounded-2xl bg-gradient-to-b from-[#f5f3ff] via-[#ede9fe] to-[#f3f0ff] p-4 flex items-center justify-center relative overflow-hidden select-none">
      {/* Video player card */}
      <div className="w-56 h-30 bg-white/95 backdrop-blur rounded-2xl shadow-md border border-purple-100 p-3.5 flex flex-col justify-between relative">
        {/* Equalizer bars top left */}
        <div className="flex items-end gap-1 h-4">
          <div className="w-1 h-2 bg-[#94a3b8] rounded-full" />
          <div className="w-1 h-3.5 bg-[#94a3b8] rounded-full" />
          <div className="w-1 h-1.5 bg-[#94a3b8] rounded-full" />
          <div className="w-1 h-4 bg-[#94a3b8] rounded-full" />
          <div className="w-1 h-2.5 bg-[#94a3b8] rounded-full" />
        </div>

        {/* Center play button */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-white shadow-md border border-purple-100/80 flex items-center justify-center text-slate-700">
            <svg className="w-4 h-4 ml-0.5 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Bottom progress bar */}
        <div className="w-full pt-2">
          <div className="w-full h-1.5 bg-[#e2e8f0] rounded-full relative flex items-center">
            <div className="w-1/3 h-full bg-[#7c3aed] rounded-full" />
            <div className="w-3 h-3 rounded-full bg-[#7c3aed] shadow-xs -ml-1 border-2 border-white" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function FlyerCardIllustration() {
  return (
    <div className="w-full h-44 rounded-2xl bg-gradient-to-b from-[#f5f3ff] via-[#ede9fe] to-[#f3f0ff] p-4 flex items-center justify-center relative overflow-hidden select-none">
      {/* Flyer document representation */}
      <div className="w-36 h-36 bg-white rounded-2xl shadow-md border border-purple-100 p-2.5 flex flex-col justify-between relative">
        {/* Header bar purple */}
        <div className="w-full h-4 bg-gradient-to-r from-[#7c3aed] to-[#a855f7] rounded-md" />

        {/* Mock text lines */}
        <div className="space-y-1.5 px-1">
          <div className="w-4/5 h-1.5 bg-[#94a3b8] rounded-full" />
          <div className="w-full h-1 bg-[#cbd5e1] rounded-full" />
          <div className="w-3/5 h-1 bg-[#cbd5e1] rounded-full" />
        </div>

        {/* Mock promo banner with discount tag */}
        <div className="w-full h-14 bg-[#f8fafc] rounded-lg border border-slate-100 p-1.5 relative overflow-hidden flex items-end justify-between">
          <div className="w-12 h-8 bg-[#94a3b8]/40 rounded-sm" />
          <div className="absolute top-1 right-2 px-1.5 py-0.5 bg-[#7c3aed] text-white rounded text-[8px] font-bold">
            50%
          </div>
          <div className="w-10 h-3 bg-[#475569] rounded-xs" />
        </div>

        {/* Bottom indicator lines */}
        <div className="flex gap-1 justify-center pt-0.5">
          <div className="w-8 h-1 bg-[#94a3b8] rounded-full" />
          <div className="w-2 h-1 bg-[#cbd5e1] rounded-full" />
        </div>
      </div>
    </div>
  )
}

export default function CreateHub() {
  const navigate = useNavigate()

  return (
    <div className="min-h-full flex flex-col justify-between max-w-6xl mx-auto px-4 py-4 md:py-8 animate-fade-in">
      {/* Top Header */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground">
          O que você quer criar?
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground font-normal">
          Escolha o tipo de conteúdo que deseja gerar com IA.
        </p>
      </div>

      {/* 3 Main Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* CARD 1: Posts de Imagens */}
        <div className="flex flex-col">
          <div
            onClick={() => navigate('/app/criar/imagens')}
            className="group relative bg-white dark:bg-card border border-border/80 hover:border-primary/60 rounded-3xl p-5 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col flex-1"
          >
            {/* Visual illustration */}
            <div className="group-hover:scale-[1.02] transition-transform duration-300">
              <ImagesCardIllustration />
            </div>

            {/* Title & Cost Badge */}
            <div className="flex items-center justify-between gap-2 mt-5">
              <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                Posts de Imagens
              </h3>
              <span className="text-xs font-semibold text-muted-foreground">10 cr.</span>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-[13px] text-muted-foreground mt-2 leading-relaxed">
              Crie posts únicos, carrosséis e stories prontos para publicar nas redes sociais.
            </p>

            {/* Social Network Icons */}
            <div className="flex items-center gap-2.5 mt-4 text-muted-foreground/80">
              <Instagram className="w-4 h-4 hover:text-foreground transition-colors" />
              <Facebook className="w-4 h-4 hover:text-foreground transition-colors" />
              <Linkedin className="w-4 h-4 hover:text-foreground transition-colors" />
              <WhatsAppIcon className="w-4 h-4 hover:text-foreground transition-colors" />
            </div>
          </div>

          {/* Sub-link */}
          <Link
            to="/app/content/new"
            className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary font-medium mt-3 transition-colors py-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary/70" />
            <span>ou comece do zero no editor</span>
          </Link>
        </div>

        {/* CARD 2: Posts de Vídeo */}
        <div className="flex flex-col">
          <div
            onClick={() => navigate('/app/criar/videos')}
            className="group relative bg-white dark:bg-card border border-border/80 hover:border-primary/60 rounded-3xl p-5 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col flex-1"
          >
            {/* BETA badge in corner */}
            <div className="absolute top-7 right-7 z-10">
              <Badge className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> BETA
              </Badge>
            </div>

            {/* Visual illustration */}
            <div className="group-hover:scale-[1.02] transition-transform duration-300">
              <VideoCardIllustration />
            </div>

            {/* Title & Cost Badge */}
            <div className="flex items-center justify-between gap-2 mt-5">
              <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                Posts de Vídeo
              </h3>
              <span className="text-xs font-semibold text-muted-foreground">15–1.765 cr.</span>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-[13px] text-muted-foreground mt-2 leading-relaxed">
              Gere Reels, Shorts e vídeos animados com IA, com cortes, legendas e trilha.
            </p>

            {/* Social Network Icons */}
            <div className="flex items-center gap-2.5 mt-4 text-muted-foreground/80">
              <Instagram className="w-4 h-4 hover:text-foreground transition-colors" />
              <TikTokIcon className="w-4 h-4 hover:text-foreground transition-colors" />
              <YouTubeIcon className="w-4 h-4 hover:text-foreground transition-colors" />
              <Facebook className="w-4 h-4 hover:text-foreground transition-colors" />
            </div>
          </div>

          {/* Sub-link */}
          <Link
            to="/app/content/new"
            className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary font-medium mt-3 transition-colors py-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary/70" />
            <span>ou comece do zero no editor</span>
          </Link>
        </div>

        {/* CARD 3: Flyers / Panfletos */}
        <div className="flex flex-col">
          <div
            onClick={() => navigate('/app/criar/flyers')}
            className="group relative bg-white dark:bg-card border border-border/80 hover:border-primary/60 rounded-3xl p-5 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col flex-1"
          >
            {/* Visual illustration */}
            <div className="group-hover:scale-[1.02] transition-transform duration-300">
              <FlyerCardIllustration />
            </div>

            {/* Title & Cost Badge */}
            <div className="flex items-center justify-between gap-2 mt-5">
              <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                Flyers / Panfletos
              </h3>
              <span className="text-xs font-semibold text-muted-foreground">10 cr.</span>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-[13px] text-muted-foreground mt-2 leading-relaxed">
              Monte panfletos de promoções, eventos, cardápios e imóveis prontos para imprimir.
            </p>

            {/* Format Icons (printer, document, landscape/card, mobile) */}
            <div className="flex items-center gap-2.5 mt-4 text-muted-foreground/80">
              <Printer className="w-4 h-4 hover:text-foreground transition-colors" />
              <FileText className="w-4 h-4 hover:text-foreground transition-colors" />
              <div className="w-3.5 h-3.5 border border-current rounded-xs" />
              <Smartphone className="w-4 h-4 hover:text-foreground transition-colors" />
            </div>
          </div>

          {/* Sub-link */}
          <Link
            to="/app/content/new"
            className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary font-medium mt-3 transition-colors py-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary/70" />
            <span>ou comece do zero no editor</span>
          </Link>
        </div>
      </div>

      {/* Banner Inferior: Criar campanha (EM BREVE) */}
      <div className="mt-8 mb-6">
        <div className="w-full bg-[#f5f3ff] dark:bg-primary/10 border border-purple-200/70 dark:border-primary/20 rounded-2xl p-4 sm:p-5 flex items-center gap-4 transition-all hover:border-primary/40">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-primary/20 flex items-center justify-center text-primary shrink-0">
            <Crown className="w-5 h-5 text-[#7c3aed]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm sm:text-base font-bold text-foreground">Criar campanha</h4>
              <Badge
                variant="outline"
                className="bg-amber-100/80 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 text-[10px] font-bold px-2 py-0 uppercase"
              >
                EM BREVE
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Gere reels, story, feed, carrossel e flyer de uma vez só, a partir do mesmo briefing.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Footer inside Hub */}
      <div className="border-t border-border/60 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 font-medium">
          <span className="font-bold text-foreground">bestcontent</span>
          <span className="text-[10px] font-semibold text-primary uppercase bg-primary/10 px-1 py-0.5 rounded">
            AI
          </span>
          <span>·</span>
          <span>Social 2 Powered by BestContent AI</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              alert('Novidades v2.6.0: Novo hub de criação com fluxos refinados de imagem e vídeo!')
            }
            className="hover:text-foreground transition-colors"
          >
            Novidades
          </button>
          <span>·</span>
          <a href="#" className="hover:text-foreground transition-colors">
            Termos
          </a>
          <span>·</span>
          <a href="#" className="hover:text-foreground transition-colors">
            Privacidade
          </a>
          <span>·</span>
          <span className="font-mono text-[11px]">v2.6.0</span>
        </div>
      </div>
    </div>
  )
}
