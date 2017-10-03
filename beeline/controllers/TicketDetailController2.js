import _ from 'lodash';

export default [
  '$scope',
  '$rootScope',
  '$stateParams',
  'TicketService',
  'CompanyService',
  'TripService',
  'UserService',
  'RoutesService',
  function(
    $scope,
    $rootScope,
    $stateParams,
    TicketService,
    CompanyService,
    TripService,
    UserService,
    RoutesService
  ) {

    // Initialize the necessary basic data data
    $scope.user = UserService.getUser();

    $scope.showTerms = (companyId) => {
      CompanyService.showTerms(companyId);
    };

    var ticketPromise = TicketService.getTicketById(+$stateParams.ticketId);
    var tripPromise = ticketPromise.then((ticket) => {
      return TripService.getTripData(+ticket.alightStop.tripId);
    });
    var routePromise = tripPromise.then((trip) => {
      return RoutesService.getRoute(+trip.routeId);
    });
    var companyPromise = routePromise.then((route) => {
      return CompanyService.getCompany(+route.transportCompanyId);
    });
    ticketPromise.then((ticket) => { $scope.ticket = ticket; });
    tripPromise.then((trip) => { $scope.trip = trip; });
    routePromise.then((route) => { $scope.route = route; });
    companyPromise.then((company) => { $scope.company = company; });

  }
];
