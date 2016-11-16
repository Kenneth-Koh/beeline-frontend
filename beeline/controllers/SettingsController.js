import faqModalTemplate from '../templates/faq-modal.html';
import contactUsModalTemplate from '../templates/contact-us-modal.html';
import shareReferralModalTemplate from '../templates/share-referral-modal.html';
import commonmark from 'commonmark';


var reader = new commonmark.Parser({safe: true});
var writer = new commonmark.HtmlRenderer({safe: true});

export default [
  '$scope', 'UserService', '$ionicModal', '$ionicPopup', '$cordovaSocialSharing', 'Legalese',
  function(
    $scope, UserService, $ionicModal, $ionicPopup, $cordovaSocialSharing, Legalese) {
    $scope.data = {};

    $scope.hasCordova = !!window.cordova || false

    // Track the login state of the user service
    $scope.$watch(function() {
      return UserService.getUser();
    }, function(newUser) {
      $scope.user = newUser;
    });

    // Function that allows user to share an invitation with a referral code to other apps on the phone
    $scope.cordovaShare = async function(){
      var url = $scope.referralSharing.invitation_msg_url + $scope.user.referralCode.code
      var msg = $scope.referralSharing.invitation_msg
      $cordovaSocialSharing.share(msg, $scope.referralSharing.title, null, url)
        .then(function(result){
          // console.log("Success")
        }, function(err){
          // console.log("Error")
        })

    } 

    // templates for sharing of referrals
    $scope.referralSharing = {
      title: "Try out Beeline!",
      instructions_msg: "Share your code so that your friend receives $10 off Beeline rides. Once they take their first ride, you'll automatically get $10 worth of ride credits.",
      invitation_msg: "Here is FREE $10 credits for you to try out Beeline rides, a marketplace for crowdsourced bus services. Visit "  ,        
      invitation_msg_url: "https://app.beeline.sg/#/welcome?refCode=",        
    }

    // Map in the login items
    $scope.logIn = UserService.promptLogIn;
    $scope.logOut = UserService.promptLogOut;

    // Generic event handler to allow user to update their
    // name, email
    // FIXME: Get Yixin to review the user info update flow.
    $scope.updateUserInfo = function(field){
      return UserService.promptUpdateUserInfo(field);
    }

    // Update telephone is distinct from the update user due to verification
    $scope.updateTelephone = UserService.promptUpdatePhone;

    // Configure modals

    // Load the pages only when requested.
    function assetScope(assetName) {
      var newScope = $scope.$new();
      newScope.error = newScope.html = null;
      newScope.$on('modal.shown', () => {
        UserService.beeline({
          method: 'GET',
          url: `/assets/${assetName}`
        })
        .then((response) => {
          newScope.html = writer.render(reader.parse(response.data.data));
          newScope.error = false;
        })
        .catch((error) => {
          console.log(error)
          newScope.html = "";
          newScope.error = error;
        })
      })
      return newScope;
    }

    $scope.shareReferralModal = $ionicModal.fromTemplate(
      shareReferralModalTemplate,
      {scope: $scope}

    );
    $scope.faqModal = $ionicModal.fromTemplate(
      faqModalTemplate,
      {scope: assetScope('FAQ')}
    );
    $scope.showPrivacyPolicy = () => Legalese.showPrivacyPolicy();
    $scope.showTermsOfUse = () => Legalese.showTermsOfUse();
    $scope.contactUsModal = $ionicModal.fromTemplate(
      contactUsModalTemplate,
      {scope: $scope}
    );
    $scope.$on('$destroy', function() {
      $scope.faqModal.destroy();
      $scope.contactUsModal.destroy();
      $scope.shareReferralModal.destroy();
    });

  }];
