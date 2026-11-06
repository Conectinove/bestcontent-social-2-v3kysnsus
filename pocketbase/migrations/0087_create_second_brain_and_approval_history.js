migrate(
  (app) => {
    // 1. Coleção second_brain_docs
    let docCol
    try {
      docCol = app.findCollectionByNameOrId('second_brain_docs')
    } catch (_) {
      docCol = null
    }

    if (!docCol) {
      const col = new Collection({
        name: 'second_brain_docs',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'title', type: 'text', required: true },
          {
            name: 'doc_type',
            type: 'select',
            required: true,
            values: ['documento', 'aula_lab', 'blog_artigo', 'site_landing', 'nota_privada'],
            maxSelect: 1,
          },
          { name: 'subtitle', type: 'text', required: false },
          { name: 'location', type: 'text', required: false },
          { name: 'modules', type: 'json', required: false },
          { name: 'author_id', type: 'text', required: false },
          { name: 'author_name', type: 'text', required: false },
          { name: 'tags', type: 'json', required: false },
          { name: 'is_pinned', type: 'bool', required: false },
          {
            name: 'created',
            type: 'autodate',
            onCreate: true,
            onUpdate: false,
          },
          {
            name: 'updated',
            type: 'autodate',
            onCreate: true,
            onUpdate: true,
          },
        ],
        indexes: [
          'CREATE INDEX idx_sbd_author ON second_brain_docs (author_id)',
          'CREATE INDEX idx_sbd_type ON second_brain_docs (doc_type)',
        ],
      })
      app.save(col)
    }

    // 2. Coleção post_approval_history
    let approvalCol
    try {
      approvalCol = app.findCollectionByNameOrId('post_approval_history')
    } catch (_) {
      approvalCol = null
    }

    if (!approvalCol) {
      const col = new Collection({
        name: 'post_approval_history',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'post_id', type: 'text', required: true },
          {
            name: 'action',
            type: 'select',
            required: true,
            values: ['approved', 'rejected', 'requested_changes', 'submitted', 'restored'],
            maxSelect: 1,
          },
          { name: 'actor_name', type: 'text', required: true },
          { name: 'actor_role', type: 'text', required: false },
          { name: 'actor_id', type: 'text', required: false },
          { name: 'comment', type: 'text', required: false },
          { name: 'version_label', type: 'text', required: false },
          {
            name: 'created',
            type: 'autodate',
            onCreate: true,
            onUpdate: false,
          },
          {
            name: 'updated',
            type: 'autodate',
            onCreate: true,
            onUpdate: true,
          },
        ],
        indexes: ['CREATE INDEX idx_pah_post ON post_approval_history (post_id, created DESC)'],
      })
      app.save(col)
    }
  },
  (app) => {
    try {
      const c1 = app.findCollectionByNameOrId('second_brain_docs')
      if (c1) app.delete(c1)
    } catch (_) {}
    try {
      const c2 = app.findCollectionByNameOrId('post_approval_history')
      if (c2) app.delete(c2)
    } catch (_) {}
  },
)
