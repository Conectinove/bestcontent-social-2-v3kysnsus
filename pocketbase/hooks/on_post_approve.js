onRecordAfterUpdateSuccess((e) => {
  var oldStatus = e.record.original().getString('status')
  var newStatus = e.record.getString('status')

  if (oldStatus === 'approved' || newStatus !== 'approved') {
    return e.next()
  }

  var userId = e.record.getString('user')
  var postId = e.record.id

  if (!userId) {
    return e.next()
  }

  try {
    var existing = $app.findRecordsByFilter(
      'scheduled_posts',
      "post = '" + postId + "'",
      '-created',
      1,
      0,
    )
    if (existing.length > 0) {
      return e.next()
    }
  } catch (_) {}

  try {
    var tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setUTCHours(10, 0, 0, 0)
    var scheduledAt = tomorrow.toISOString()

    var spCol = $app.findCollectionByNameOrId('scheduled_posts')
    var sp = new Record(spCol)
    sp.set('user', userId)
    sp.set('post', postId)
    sp.set('scheduled_at', scheduledAt)
    sp.set('status', 'pending')
    $app.save(sp)
  } catch (err) {
    $app
      .logger()
      .error('Failed to auto-schedule approved post', 'postId', postId, 'error', String(err))
  }

  return e.next()
}, 'posts')
