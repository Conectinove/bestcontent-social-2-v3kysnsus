migrate(
  (app) => {
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'ronaldoconectinove@gmail.com')
      if (!admin) return

      const postsCol = app.findCollectionByNameOrId('posts')

      // Resolve brand id for MudarCurso
      let brandMudarCursoId = ''
      try {
        const b = app.findFirstRecordByData('brands', 'name', 'MudarCurso')
        brandMudarCursoId = b.id
      } catch (_) {
        try {
          const bAny = app.findFirstRecordByData('brands', 'user', admin.id)
          brandMudarCursoId = bAny.id
        } catch (_) {}
      }

      // Check if Flyer "Mudar de Curso: O Começo de Algo Incrível" exists
      try {
        app.findFirstRecordByData('posts', 'content', 'Mudar de Curso: O Começo de Algo Incrível')
      } catch (_) {
        const postFlyer = new Record(postsCol)
        postFlyer.set('user', admin.id)
        if (brandMudarCursoId) postFlyer.set('brand', brandMudarCursoId)
        postFlyer.set('content', 'Mudar de Curso: O Começo de Algo Incrível')
        postFlyer.set(
          'caption',
          'SDFSD — A decodificação do seu sucesso começa aqui! Descubra novos caminhos e acelere seus resultados.',
        )
        postFlyer.set('platform', 'Instagram')
        postFlyer.set('status', 'published')
        postFlyer.set(
          'script_json',
          JSON.stringify({
            type: 'FLYER',
            ratio: '620:877',
            format: 'Flyer Retrato',
            badgeUser: 'R',
            presetImage:
              'https://img.usecurling.com/p/620/877?q=cyberpunk%20ai%20man%20futuristic%20violet&color=purple',
          }),
        )
        app.save(postFlyer)
      }

      // Check if Video "Vídeo facebook 30/07/2026" exists
      try {
        app.findFirstRecordByData('posts', 'content', 'Vídeo facebook 30/07/2026')
      } catch (_) {
        const postVideo = new Record(postsCol)
        postVideo.set('user', admin.id)
        if (brandMudarCursoId) postVideo.set('brand', brandMudarCursoId)
        postVideo.set('content', 'Vídeo facebook 30/07/2026')
        postVideo.set(
          'caption',
          'Transforme sua vida em 7 segundos com MudarCurso! Descubra o poder do método comprovado para virar o jogo em 2026.',
        )
        postVideo.set('platform', 'Facebook')
        postVideo.set('status', 'scheduled')
        postVideo.set('duration', 30)
        postVideo.set(
          'script_json',
          JSON.stringify({
            type: 'FACEBOOK',
            ratio: '9:16',
            format: 'Vídeo Reels/Shorts',
            isVideo: true,
            presetImage:
              'https://img.usecurling.com/p/600/1000?q=smiling%20man%20glasses%20laptop%20office&color=dark',
          }),
        )
        app.save(postVideo)
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const p1 = app.findFirstRecordByData(
        'posts',
        'content',
        'Mudar de Curso: O Começo de Algo Incrível',
      )
      if (p1) app.delete(p1)
    } catch (_) {}
    try {
      const p2 = app.findFirstRecordByData('posts', 'content', 'Vídeo facebook 30/07/2026')
      if (p2) app.delete(p2)
    } catch (_) {}
  },
)
