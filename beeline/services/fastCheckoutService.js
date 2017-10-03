import moment from 'moment';
import {retriveNextTrip} from '../shared/util'

angular.module('beeline')
.factory('FastCheckoutService', function fastCheckoutService(RoutesService, UserService,
    purchaseRoutePassModalService, TicketService, $stateParams, BookingSummaryModalService) {

    var user;
    var hasSavedPaymentInfo;
    var paymentInfo;
    var ridesRemaining;
    var route;
    var routeId;

    UserService.userEvents.on('userChanged', () => {
      instance.verify(routeId)
    })

    // login
    function userLoginPromise() {
      return new Promise((resolve,reject) => {
        if (UserService.getUser()) {
          return resolve(UserService.getUser())
        } else {
          UserService.promptLogIn().then((user) => {
            if (user) return resolve(user)
            else return reject('Not Logged In')
          })
        }
      })
    }

    // ridesRemaining promise
    function ridesRemainingPromise(routeId) {
      return new Promise((resolve,reject) => {
        if (RoutesService.getRoutePassCount()) {
          return resolve(RoutesService.getRoutePassCount()[routeId])
        } else {
          RoutesService.fetchRoutesWithRoutePass().then(() => {
            return resolve(RoutesService.getRoutePassCount()[routeId])
          }).catch((err) =>{
            return reject(err)
          })
        }
      })
    }

    //  modal for purchase route pass
    function purchaseRoutePass(route, routeId, hasSavedPaymentInfo, savedPaymentInfo) {
      return purchaseRoutePassModalService.show(route, routeId, hasSavedPaymentInfo, savedPaymentInfo)
    }


    function routeQualifiedForRoutePass(route) {
      if (route && route.tags) {
        var rpList = route.tags.filter((tag) => tag.includes('rp-'))
        return rpList && rpList.length === 1 && route.notes && route.notes.passSizes
      }
    }

    function confirmTermAndCondition() {

    }

    async function purchaseTicketUsingRoutePass() {
      return await BookingSummaryModalService.show({
        routeId: routeId,
        price: route.trips[0].price,
        route: route,
        applyRoutePass: true,
        selectedDates: selectedDates,
        boardStopId: boardStopId,
        alightStopId: alightStopId,
        hasSavedPaymentInfo: hasSavedPaymentInfo
      })
    }

    var instance = {

      // called once user is logged in
      // TODO: where to get the route Object?

      // return Promise
      // tell whether user is eligible to buy next trip ticket
      // if YES, return nextTrip Object
      // if NO, return error Object
      verify: async function(routeId) {
        route = await RoutesService.getRoute(routeId)
        var nextTrip = retriveNextTrip(route)
        // move the availability check here

        var hasNextTripTicket = null, previouslyBookedDays = null
        // user has the next trip ticket
        if (UserService.getUser()) {
          var allTickets = TicketService.getTickets();
          if (allTickets != null) {
            var ticketsByRouteId = _.groupBy(allTickets, ticket => ticket.boardStop.trip.routeId);
            if (ticketsByRouteId && ticketsByRouteId[route.id]) {
              previouslyBookedDays =  _.keyBy(ticketsByRouteId[route.id], t => new Date(t.boardStop.trip.date).getTime());
            }
          }
          if (previouslyBookedDays) {
            var bookedDays = Object.keys(previouslyBookedDays).map(x=>{return parseInt(x)});
            //compare current date with next trip
            if (nextTrip && _.includes(bookedDays,nextTrip.date.getTime())) {
              hasNextTripTicket = true;
            } else {
              hasNextTripTicket = false;
            }
          } else {
            hasNextTripTicket = false;
          }
        }

        return hasNextTripTicket
      },

      fastCheckout: function (routeId, boardStopId, alightStopId, selectedDates) {
        return new Promise(async (resolve, reject) => {
          try {
            user = await userLoginPromise()
            hasSavedPaymentInfo = _.get(user, 'savedPaymentInfo.sources.data.length', 0) > 0
            paymentInfo = hasSavedPaymentInfo ? _.get(user, 'savedPaymentInfo') : null
            route = await RoutesService.getRoute(routeId)
            ridesRemaining = await ridesRemainingPromise(routeId)
            if (!ridesRemaining) {
              // if route has rp- tag
              if (route && routeQualifiedForRoutePass(route)) {
                // show the modal to purchase route pass
                await purchaseRoutePass(route, routeId, hasSavedPaymentInfo, paymentInfo)
                purchaseTicketUsingRoutePass()
              } else {
                // no route pass option , ask to confirm T&Cs

                // ask for stripe payment for single ticket


              }

            } else {
              // ask to confirm T&Cs
              // show in modal to confirm next trip date & deduct 1 pass from user
              // NOTES: no promotion code filed needed
              // switch to 'Ticket' view
              // booking Object
              purchaseTicketUsingRoutePass()

            }
            return resolve('success')
          }
          catch (err) {
            console.log(err)
            return reject('failed')
          }
        })
      },

      grabNextTrip: (route) => retriveNextTrip(route)

    }
    return instance;

})
