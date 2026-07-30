onRecordAfterCreateSuccess((e) => {
  const text = (e.record.getString('title') + '\n\n' + e.record.getString('content')).trim()
  if (!text) return e.next()
  try {
    const res = $ai.embed({ input: text })
    const record = $app.findRecordById('community_topics', e.record.id)
    record.set('vector', res.data[0].embedding)
    $app.save(record)
  } catch (err) {
    console.log('Community topic embedding failed ' + e.record.id, err.message)
  }
  return e.next()
}, 'community_topics')
