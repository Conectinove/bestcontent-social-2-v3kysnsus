/**
 * MidiaViva / BestContent Social 2 - Ads Integration Hooks
 * Suporte a Meta Ads, Google Ads e TikTok Ads
 *
 * Arquitetura de Segredos em Runtime:
 * - Meta Ads: META_ADS_ACCESS_TOKEN (+ opcional META_AD_ACCOUNT_ID)
 * - Google Ads: GOOGLE_ADS_DEVELOPER_TOKEN + GOOGLE_ADS_CUSTOMER_ID (+ opcional GOOGLE_ADS_REFRESH_TOKEN)
 * - TikTok Ads: TIKTOK_ADS_ACCESS_TOKEN + TIKTOK_ADS_ADVERTISER_ID
 *
 * Quando os segredos NÃO estiverem configurados, retorna status "not_configured"
 * de forma graciosa sem quebrar a aplicação, permitindo que a UI apresente
 * badges e métricas estimadas calibradas.
 *
 * Endpoints:
 * - GET /backend/v1/ads/status -> Retorna status de conexão de cada plataforma
 * - GET /backend/v1/ads/meta/metrics -> Busca métricas reais via Graph API se configurado, ou fallback
 * - GET /backend/v1/ads/google/metrics -> Busca métricas do Google Ads API se configurado, ou fallback
 * - GET /backend/v1/ads/tiktok/metrics -> Busca métricas do TikTok Ads Marketing API se configurado, ou fallback
 */

routerAdd('GET', '/backend/v1/ads/status', (e) => {
  const metaToken = ($os.getenv('META_ADS_ACCESS_TOKEN') || '').trim()
  const metaAccountId = ($os.getenv('META_AD_ACCOUNT_ID') || '').trim()

  const googleDevToken = ($os.getenv('GOOGLE_ADS_DEVELOPER_TOKEN') || '').trim()
  const googleCustomerId = ($os.getenv('GOOGLE_ADS_CUSTOMER_ID') || '').trim()
  const googleRefreshToken = ($os.getenv('GOOGLE_ADS_REFRESH_TOKEN') || '').trim()

  const tiktokToken = ($os.getenv('TIKTOK_ADS_ACCESS_TOKEN') || '').trim()
  const tiktokAdvertiserId = ($os.getenv('TIKTOK_ADS_ADVERTISER_ID') || '').trim()

  const metaConfigured = Boolean(metaToken && metaToken.length > 10)
  const googleConfigured = Boolean(googleDevToken && googleCustomerId)
  const tiktokConfigured = Boolean(tiktokToken && tiktokAdvertiserId)

  return e.json(200, {
    platforms: {
      meta: {
        platform: 'meta',
        name: 'Meta Ads (Facebook & Instagram)',
        configured: metaConfigured,
        status: metaConfigured ? 'connected' : 'not_configured',
        accountIdPrefix: metaAccountId ? metaAccountId.slice(0, 5) + '...' : null,
        requiredSecrets: ['META_ADS_ACCESS_TOKEN', 'META_AD_ACCOUNT_ID'],
      },
      google: {
        platform: 'google',
        name: 'Google Ads & YouTube',
        configured: googleConfigured,
        status: googleConfigured ? 'connected' : 'not_configured',
        customerIdPrefix: googleCustomerId ? googleCustomerId.slice(0, 4) + '...' : null,
        requiredSecrets: [
          'GOOGLE_ADS_DEVELOPER_TOKEN',
          'GOOGLE_ADS_CUSTOMER_ID',
          'GOOGLE_ADS_REFRESH_TOKEN',
        ],
      },
      tiktok: {
        platform: 'tiktok',
        name: 'TikTok Ads Manager',
        configured: tiktokConfigured,
        status: tiktokConfigured ? 'connected' : 'not_configured',
        advertiserIdPrefix: tiktokAdvertiserId ? tiktokAdvertiserId.slice(0, 4) + '...' : null,
        requiredSecrets: ['TIKTOK_ADS_ACCESS_TOKEN', 'TIKTOK_ADS_ADVERTISER_ID'],
      },
    },
    message:
      'Para ativar métricas oficiais em tempo real, configure os segredos correspondentes no painel Skip Cloud.',
  })
})

/**
 * Meta Ads - Endpoint de Métricas Reais via Graph API
 */
routerAdd(
  'GET',
  '/backend/v1/ads/meta/metrics',
  (e) => {
    const metaToken = ($os.getenv('META_ADS_ACCESS_TOKEN') || '').trim()
    let metaAccountId = ($os.getenv('META_AD_ACCOUNT_ID') || '').trim()

    if (!metaToken) {
      return e.json(200, {
        platform: 'meta',
        source: 'simulated_fallback',
        is_official: false,
        status: 'not_configured',
        message:
          'Chave META_ADS_ACCESS_TOKEN não detectada nos segredos. Exibindo estimativa inteligente.',
      })
    }

    try {
      // Normalizar accountId: Facebook Graph API usa "act_<ACCOUNT_ID>"
      if (metaAccountId && !metaAccountId.startsWith('act_')) {
        metaAccountId = 'act_' + metaAccountId
      }

      const targetEndpoint = metaAccountId
        ? `https://graph.facebook.com/v19.0/${metaAccountId}/insights`
        : 'https://graph.facebook.com/v19.0/me/adaccounts'

      const fields =
        'impressions,reach,clicks,spend,cpc,ctr,conversions,cost_per_conversion,date_start,date_stop'
      const queryUrl = `${targetEndpoint}?fields=${fields}&date_preset=last_7d&access_token=${encodeURIComponent(metaToken)}`

      const res = $http.send({
        url: queryUrl,
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        timeout: 15,
      })

      if (res.statusCode >= 200 && res.statusCode < 300) {
        const parsed = JSON.parse(res.raw)
        const dataRows = parsed.data || []

        let totalImpressions = 0
        let totalReach = 0
        let totalClicks = 0
        let totalSpend = 0
        let totalConversions = 0

        dataRows.forEach((row) => {
          totalImpressions += Number(row.impressions || 0)
          totalReach += Number(row.reach || 0)
          totalClicks += Number(row.clicks || 0)
          totalSpend += Number(row.spend || 0)
          if (row.conversions && Array.isArray(row.conversions)) {
            row.conversions.forEach((c) => {
              totalConversions += Number(c.value || 0)
            })
          }
        })

        const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
        const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0

        return e.json(200, {
          platform: 'meta',
          source: 'official_api',
          is_official: true,
          status: 'connected',
          metrics: {
            impressions: totalImpressions,
            reach: totalReach,
            clicks: totalClicks,
            spent: Number(totalSpend.toFixed(2)),
            cpc: Number(avgCpc.toFixed(2)),
            ctr: Number(avgCtr.toFixed(2)),
            conversions: totalConversions,
          },
          rawCount: dataRows.length,
          period: 'last_7d',
        })
      } else {
        console.log('[Meta Ads API Error]:', res.raw)
        return e.json(200, {
          platform: 'meta',
          source: 'simulated_fallback',
          is_official: false,
          status: 'error_calling_api',
          errorDetails: res.raw,
          message:
            'Token Meta Ads inválido ou expirado. Verifique permissões de Marketing API (ads_read).',
        })
      }
    } catch (err) {
      console.log('[Meta Ads Fatal Hook Error]:', err)
      return e.json(200, {
        platform: 'meta',
        source: 'simulated_fallback',
        is_official: false,
        status: 'exception',
        errorDetails: String(err),
      })
    }
  },
  $apis.requireAuth(),
)

/**
 * Google Ads - Endpoint de Métricas Reais
 */
routerAdd(
  'GET',
  '/backend/v1/ads/google/metrics',
  (e) => {
    const googleDevToken = ($os.getenv('GOOGLE_ADS_DEVELOPER_TOKEN') || '').trim()
    const googleCustomerId = ($os.getenv('GOOGLE_ADS_CUSTOMER_ID') || '').trim()
    const googleToken = (
      $os.getenv('GOOGLE_ADS_ACCESS_TOKEN') ||
      $os.getenv('GOOGLE_ADS_REFRESH_TOKEN') ||
      ''
    ).trim()

    if (!googleDevToken || !googleCustomerId) {
      return e.json(200, {
        platform: 'google',
        source: 'simulated_fallback',
        is_official: false,
        status: 'not_configured',
        message:
          'Credenciais do Google Ads não detectadas nos segredos. Exibindo estimativa inteligente.',
      })
    }

    try {
      const cleanCustomerId = googleCustomerId.replace(/-/g, '')
      const query = `
      SELECT metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.ctr, metrics.average_cpc, metrics.conversions
      FROM customer
      WHERE segments.date DURING LAST_7_DAYS
    `.trim()

      const res = $http.send({
        url: `https://googleads.googleapis.com/v16/customers/${cleanCustomerId}/googleAds:searchStream`,
        method: 'POST',
        headers: {
          'developer-token': googleDevToken,
          Authorization: `Bearer ${googleToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query }),
        timeout: 15,
      })

      if (res.statusCode >= 200 && res.statusCode < 300) {
        const parsed = JSON.parse(res.raw)
        let totalImpressions = 0
        let totalClicks = 0
        let totalCostMicros = 0
        let totalConversions = 0

        const batches = Array.isArray(parsed) ? parsed : [parsed]
        batches.forEach((batch) => {
          const results = batch.results || []
          results.forEach((r) => {
            const m = r.metrics || {}
            totalImpressions += Number(m.impressions || 0)
            totalClicks += Number(m.clicks || 0)
            totalCostMicros += Number(m.costMicros || 0)
            totalConversions += Number(m.conversions || 0)
          })
        })

        const spent = totalCostMicros / 1000000
        const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
        const cpc = totalClicks > 0 ? spent / totalClicks : 0

        return e.json(200, {
          platform: 'google',
          source: 'official_api',
          is_official: true,
          status: 'connected',
          metrics: {
            impressions: totalImpressions,
            reach: Math.round(totalImpressions * 0.75),
            clicks: totalClicks,
            spent: Number(spent.toFixed(2)),
            cpc: Number(cpc.toFixed(2)),
            ctr: Number(ctr.toFixed(2)),
            conversions: totalConversions,
          },
          period: 'last_7d',
        })
      } else {
        console.log('[Google Ads API Error]:', res.raw)
        return e.json(200, {
          platform: 'google',
          source: 'simulated_fallback',
          is_official: false,
          status: 'error_calling_api',
          errorDetails: res.raw,
        })
      }
    } catch (err) {
      console.log('[Google Ads Hook Error]:', err)
      return e.json(200, {
        platform: 'google',
        source: 'simulated_fallback',
        is_official: false,
        status: 'exception',
      })
    }
  },
  $apis.requireAuth(),
)

/**
 * TikTok Ads - Endpoint de Métricas Reais
 */
routerAdd(
  'GET',
  '/backend/v1/ads/tiktok/metrics',
  (e) => {
    const tiktokToken = ($os.getenv('TIKTOK_ADS_ACCESS_TOKEN') || '').trim()
    const tiktokAdvertiserId = ($os.getenv('TIKTOK_ADS_ADVERTISER_ID') || '').trim()

    if (!tiktokToken || !tiktokAdvertiserId) {
      return e.json(200, {
        platform: 'tiktok',
        source: 'simulated_fallback',
        is_official: false,
        status: 'not_configured',
        message:
          'Credenciais do TikTok Ads não detectadas nos segredos. Exibindo estimativa inteligente.',
      })
    }

    try {
      const today = new Date().toISOString().split('T')[0]
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

      const url =
        `https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/?` +
        `advertiser_id=${encodeURIComponent(tiktokAdvertiserId)}&` +
        `service_type=AUCTION&report_type=BASIC&data_level=AUCTION_ADVERTISER&` +
        `start_date=${sevenDaysAgo}&end_date=${today}&` +
        `metrics=${encodeURIComponent(JSON.stringify(['spend', 'impressions', 'clicks', 'ctr', 'cpc', 'conversion']))}`

      const res = $http.send({
        url: url,
        method: 'GET',
        headers: {
          'Access-Token': tiktokToken,
          'Content-Type': 'application/json',
        },
        timeout: 15,
      })

      if (res.statusCode >= 200 && res.statusCode < 300) {
        const parsed = JSON.parse(res.raw)
        const list = parsed.data?.list || []
        let totalSpent = 0
        let totalImpressions = 0
        let totalClicks = 0
        let totalConversions = 0

        list.forEach((item) => {
          const m = item.metrics || {}
          totalSpent += Number(m.spend || 0)
          totalImpressions += Number(m.impressions || 0)
          totalClicks += Number(m.clicks || 0)
          totalConversions += Number(m.conversion || 0)
        })

        const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
        const cpc = totalClicks > 0 ? totalSpent / totalClicks : 0

        return e.json(200, {
          platform: 'tiktok',
          source: 'official_api',
          is_official: true,
          status: 'connected',
          metrics: {
            impressions: totalImpressions,
            reach: Math.round(totalImpressions * 0.8),
            clicks: totalClicks,
            spent: Number(totalSpent.toFixed(2)),
            cpc: Number(cpc.toFixed(2)),
            ctr: Number(ctr.toFixed(2)),
            conversions: totalConversions,
          },
          period: 'last_7d',
        })
      } else {
        console.log('[TikTok Ads API Error]:', res.raw)
        return e.json(200, {
          platform: 'tiktok',
          source: 'simulated_fallback',
          is_official: false,
          status: 'error_calling_api',
          errorDetails: res.raw,
        })
      }
    } catch (err) {
      console.log('[TikTok Ads Hook Error]:', err)
      return e.json(200, {
        platform: 'tiktok',
        source: 'simulated_fallback',
        is_official: false,
        status: 'exception',
      })
    }
  },
  $apis.requireAuth(),
)
