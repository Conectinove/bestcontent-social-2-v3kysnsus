/// <reference path="../pb_data/types.d.ts" />
// 0111: image_url (text, opcional) em community_replies — mídia anexada/edição avançada
// no composer de resposta. Idempotente, no padrão da 0109: só adiciona quando não existe.
migrate(
  (app) => {
    const replies = app.findCollectionByNameOrId('community_replies')
    if (!replies.fields.getByName('image_url')) {
      replies.fields.add(new TextField({ name: 'image_url', type: 'text' }))
      app.save(replies)
    }
  },
  (app) => {
    const replies = app.findCollectionByNameOrId('community_replies')
    if (replies.fields.getByName('image_url')) {
      replies.fields.removeByName('image_url')
      app.save(replies)
    }
  },
)
