migrate(
  (app) => {
    var user
    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', 'ronaldoconectinove@gmail.com')
    } catch (_) {
      return
    }

    var accountsCol = app.findCollectionByNameOrId('social_accounts')
    var metricsCol = app.findCollectionByNameOrId('social_metrics')

    // Seed Instagram Account
    try {
      app.findFirstRecordByData('social_accounts', 'external_handle', 'ronaldo.barreto1')
    } catch (_) {
      var acc1 = new Record(accountsCol)
      acc1.set('user', user.id)
      acc1.set('platform', 'Instagram')
      acc1.set('external_handle', 'ronaldo.barreto1')
      acc1.set('status', 'connected')
      app.save(acc1)
    }

    // Seed Facebook Account
    try {
      app.findFirstRecordByData('social_accounts', 'external_handle', 'conectinove.oficial')
    } catch (_) {
      var acc2 = new Record(accountsCol)
      acc2.set('user', user.id)
      acc2.set('platform', 'Facebook')
      acc2.set('external_handle', 'conectinove.oficial')
      acc2.set('status', 'connected')
      app.save(acc2)
    }

    // Seed metrics if not present
    try {
      app.findFirstRecordByData('social_metrics', 'user', user.id)
    } catch (_) {
      var igData = [
        { day: '2026-06-30', followers: 14931 },
        { day: '2026-07-01', followers: 14931 },
        { day: '2026-07-02', followers: 14931 },
        { day: '2026-07-03', followers: 14931 },
        { day: '2026-07-04', followers: 14910 },
        { day: '2026-07-05', followers: 14902 },
        { day: '2026-07-06', followers: 14902 },
        { day: '2026-07-07', followers: 14890 },
        { day: '2026-07-08', followers: 14881 },
        { day: '2026-07-09', followers: 14881 },
        { day: '2026-07-10', followers: 14881 },
        { day: '2026-07-11', followers: 14881 },
        { day: '2026-07-12', followers: 14881 },
        { day: '2026-07-13', followers: 14881 },
        { day: '2026-07-14', followers: 14881 },
        { day: '2026-07-15', followers: 14881 },
        { day: '2026-07-16', followers: 14881 },
        { day: '2026-07-17', followers: 14881 },
        { day: '2026-07-18', followers: 14881 },
        { day: '2026-07-19', followers: 14870 },
        { day: '2026-07-20', followers: 14859 },
        { day: '2026-07-21', followers: 14859 },
        { day: '2026-07-22', followers: 14859 },
        { day: '2026-07-23', followers: 14859 },
        { day: '2026-07-24', followers: 14859 },
        { day: '2026-07-25', followers: 14858 },
        { day: '2026-07-26', followers: 14858 },
        { day: '2026-07-27', followers: 14860 },
        { day: '2026-07-28', followers: 14862 },
        { day: '2026-07-29', followers: 14865 },
        { day: '2026-07-30', followers: 14867 },
      ]

      for (var i = 0; i < igData.length; i++) {
        var item = igData[i]
        var mIg = new Record(metricsCol)
        mIg.set('user', user.id)
        mIg.set('platform', 'Instagram')
        mIg.set('date', item.day + ' 00:00:00.000Z')
        mIg.set('followers_count', item.followers)
        mIg.set('engagement_rate', 3.8)
        mIg.set('posts_count', 12)
        app.save(mIg)

        var mFb = new Record(metricsCol)
        mFb.set('user', user.id)
        mFb.set('platform', 'Facebook')
        mFb.set('date', item.day + ' 00:00:00.000Z')
        mFb.set('followers_count', 14933)
        mFb.set('engagement_rate', 2.4)
        mFb.set('posts_count', 8)
        app.save(mFb)
      }
    }
  },
  (app) => {
    try {
      var records = app.findRecordsByFilter('social_accounts', '1=1', '', 100, 0)
      for (var i = 0; i < records.length; i++) {
        app.delete(records[i])
      }
    } catch (_) {}
    try {
      var mRecords = app.findRecordsByFilter('social_metrics', '1=1', '', 500, 0)
      for (var j = 0; j < mRecords.length; j++) {
        app.delete(mRecords[j])
      }
    } catch (_) {}
  },
)
