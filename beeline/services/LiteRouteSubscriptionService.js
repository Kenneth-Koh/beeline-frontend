import _ from 'lodash'
import assert from 'assert'


export default ['$http', 'UserService', '$q',
  function LiteRouteSubscriptionService ($http, UserService, $q) {
    let LiteRouteSubscriptionCache = null
    let liteRouteSubscriptionsSummary = []


    UserService.userEvents.on('userChanged', () => {
      instance.getSubscriptions(true)
    })

    var instance = {

      getSubscriptionSummary: function () {
        return liteRouteSubscriptionsSummary
      },

      getSubscriptions: function (ignoreCache) {
        if (UserService.getUser()) {
          if (LiteRouteSubscriptionCache && !ignoreCache) return liteRouteSubscriptionsSummary
          return LiteRouteSubscriptionCache = UserService.beeline({
            method: 'GET',
            url: '/liteRoutes/subscriptions',
          }).then((response) => {
            liteRouteSubscriptionsSummary = response.data.map((subs)=>subs.routeLabel)
            return liteRouteSubscriptionsSummary
    			})
        } else {
          liteRouteSubscriptionsSummary = []
          return $q.resolve([])
        }
      },

      isSubscribed: async function (label, ignoreCache) {
        let subscriptions = await this.getSubscriptions(ignoreCache)
        assert(subscriptions)

        let subscription = subscriptions.includes(label)
        if (subscription) {
          return true
        } else {
          return false
        }
      },
    }

    return instance
}]
