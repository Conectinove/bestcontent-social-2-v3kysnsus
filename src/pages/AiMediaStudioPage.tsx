import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Video,
  Image as ImageIcon,
  Mic,
  Box,
  Layers,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Film,
  Camera,
  Play,
  Volume2,
  FileCode,
  ShieldAlert,
  ShieldCheck,
  Star,
  Menu,
  SlidersHorizontal,
  Trash2,
  Loader2,
  Brain,
  Maximize2,
  Minimize2,
  Square,
  X,
  History,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useSocial } from '@/context/SocialContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  STUDIO_MODELS,
  StudioMediaType,
  StudioModelOption,
  StudioQualityTier,
  StudioCreationRecord,
  createStudioMedia,
  getStudioCreations,
  getUserStudioCredits,
  updateStudioCreation,
  deleteStudioCreation,
} from '@/services/ai-studio'
import {
  checkExternalMediaApiStatus,
  type ExternalMediaApiStatus,
} from '@/services/studio-external-media'
import {
  getStudioPromptTemplates,
  type StudioPromptTemplate,
} from '@/services/studio-prompt-templates'
import { calculateStudioMetrics, type StudioUsageMetrics } from '@/services/studio-metrics'
import { PromptTemplateManagerModal } from '@/components/studio/PromptTemplateManagerModal'
import { StudioMetricsBlock } from '@/components/studio/StudioMetricsBlock'
import { ExternalAssetModal } from '@/components/studio/ExternalAssetModal'
import { PromptHistoryModal } from '@/components/studio/PromptHistoryModal'
import { VideoTemplatesBar } from '@/components/studio/VideoTemplatesBar'
import { StudioCollaborationModal } from '@/components/studio/StudioCollaborationModal'
import { StudioVersionHistoryModal } from '@/components/studio/StudioVersionHistoryModal'
import { recordStudioPromptHistory } from '@/services/studio-prompt-history'
import { StudioAdvancedEditorDialog } from '@/components/studio/StudioAdvancedEditorDialog'
import { StudioSectionDialog, StudioSectionId } from '@/components/studio/StudioSectionDialog'
import { StudioTopControls } from '@/components/studio/StudioTopControls'
import { StudioPresenceBar } from '@/components/studio/StudioPresenceBar'
import { EditHistoryPanel } from '@/components/studio/EditHistoryPanel'
import { useAppTheme } from '@/hooks/use-app-theme'
import { useStudioWindowMode } from '@/hooks/use-studio-window'
import { useSecondBrainWindowMode } from '@/hooks/use-second-brain-window'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

// Componentes da Interface Estilo Genspark
import { StudioSidebar } from '@/components/studio/StudioSidebar'
import { StudioHeroCarousel } from '@/components/studio/StudioHeroCarousel'
import { StudioFeatureCards } from '@/components/studio/StudioFeatureCards'
import { AiTemplateRecommender } from '@/components/studio/AiTemplateRecommender'
import { Download } from 'lucide-react'
import { downloadAssetMedia } from '@/lib/download-utils'
import { StudioGenerationBar } from '@/components/studio/StudioGenerationBar'
import { StudioInspirationGallery } from '@/components/studio/StudioInspirationGallery'
import { SecondBrainCanvas } from '@/components/studio/SecondBrainCanvas'

export default function AiMediaStudioPage() {
