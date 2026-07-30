onRecordAfterUpdateSuccess((e) => {
  const titleChanged = e.record.getString('title') !== e.record.original().getString('title')
  const contentChanged = e.record.getString('content') !== e.record.original().getString('content')
  if (!titleChanged && !contentChanged) return e.next()

  const text = (e.record.getString('title') + '\n\n' + e.record.getString('content')).trim()
  if (!text) return e.next()
  try {
    const res = $ai.embed({ input: text })
    const record = $app.findRecordById('community_topics', e.record.id)
    record.set('vector', res.data[0].embedding)
    $app.save(record)
  } catch (err) {
    console.log('Community topic embedding update failed ' + e.record.id, err.message)
  }
  return e.next()
}, 'community_topics')
