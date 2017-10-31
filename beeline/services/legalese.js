export default ['$rootScope', '$ionicModal',
  function ($rootScope, $ionicModal) {
    let privacyPolicyModalTemplate =  require('../templates/'+$rootScope.o.APP.PREFIX+'privacy-policy-modal.html');
    let termsOfUseModalTemplate =  require('../templates/'+$rootScope.o.APP.PREFIX+'terms-of-use-modal.html');

    function showModal(template) {
      var scope = $rootScope.$new();
      var modal = $ionicModal.fromTemplate(
        template,
        {scope: scope}
      );
      modal.show();

      scope.modal = modal;
      scope.$on('modal.hidden', () => modal.remove())
    }

    this.showPrivacyPolicy = () => showModal(privacyPolicyModalTemplate)
    this.showTermsOfUse = () => showModal(termsOfUseModalTemplate)
}]
