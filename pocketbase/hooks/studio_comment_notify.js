/// <reference path="../pb_data/types.d.ts" />
/**
 * Hook — Notificação de novo comentário de material do Studio.
 *
 * Quando um comentário é criado em studio_edit_comments (migration 0108),
 * notifica o dono do material comentado via notifications (tipo 'studio_comment',
 * migration 0130). A coleção notifications tem createRule '@request.auth.id = user'
 * — criação cross-user pelo cliente é bloqueada, por isso o hook é server-side.
 *
 * ATENÇÃO (limitação do JSVM — erro 'Hook scoping error' na v0.0.188):
 * callbacks de hook NÃO enxergam funções de nível superior — toda a lógica
 * vive inline dentro do corpo do callback.
 *
 * O dono do material é derivado do target_key:
 *  - "creation:<id>" → coleção studio_creations (campo user)
 *  - "post:<id>"     → coleção posts (campo user)
 * Não notifica o próprio autor do comentário.
 */
onRecordAfterCreateSuccess((e) => {
  try {
    var targetKey = e.record.getString('target_key')
    var authorId = e.record.getString('user')
    var authorName = e.record.getString('author_name')
    var body = e.record.getString('body')

    if (!targetKey || !authorId) {
      return e.next()
    }

    var ownerUserId = ''
    var materialTitle = ''
    if (targetKey.indexOf('creation:') === 0) {
      var creationId = targetKey.slice('creation:'.length)
      try {
        var creation = $app.findRecordById('studio_creations', creationId)
        ownerUserId = creation.getString('user')
        materialTitle = creation.getString('title')
      } catch (_) {}
    } else if (targetKey.indexOf('post:') === 0) {
      var postId = targetKey.slice('post:'.length)
      try {
        var post = $app.findRecordById('posts', postId)
        ownerUserId = post.getString('user')
        materialTitle = (post.getString('caption') || post.getString('content')).slice(0, 80)
      } catch (_) {}
    }

    // Sem dono identificável, ou o comentário é do próprio dono: nada a fazer.
    if (!ownerUserId || ownerUserId === authorId) {
      return e.next()
    }

    var notifCol = $app.findCollectionByNameOrId('notifications')
    var notif = new Record(notifCol)
    notif.set('user', ownerUserId)
    notif.set('type', 'studio_comment')
    notif.set('actor_name', authorName || 'Um colaborador')
    notif.set(
      'message',
      'novo comentário em "' +
        (materialTitle || 'seu material') +
        '": ' +
        (body ? String(body).slice(0, 120) : '(sem texto)'),
    )
    notif.set('is_read', false)
    $app.save(notif)
  } catch (err) {
    $app.logger().error('studio_comment_notify falhou: ' + String(err))
  }

  return e.next()
}, 'studio_edit_comments')
