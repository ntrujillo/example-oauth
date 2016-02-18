
var app = angular.module("openApp",['satellizer','ui.router']);

app.config(["$stateProvider","$urlRouterProvider",'$authProvider', function($stateProvider, $urlRouterProvider, $authProvider){

	$authProvider.oauth1({
	  name : "test",
	  url: '/auth/connect',
	  authorizationEndpoint: 'https://apisandbox.openbankproject.com/oauth/authorize',
	  redirectUri: window.location.origin+"/auth/callback",	 
	  type: '1.0',
	  popupOptions: { width: 1020, height: 618 }
	});
  
   /*$authProvider.authHeader ({
     Authorization : "OAuth"
   });*/

	$stateProvider.state('home',{
		url:"/home",
		templateUrl:"/home.html",
		controller:"MainCtrl"
	}).state('welcome',{
		url:"/welcome",
		templateUrl:"/welcome.html",
		controller:"WelcomeCtrl"
	});
	
	$urlRouterProvider.otherwise('home');

}]);


app.service('Service',['$q','$http',function($q, $http){

  var service = {};

  service.myAccounts = function(){
			var d = $q.defer();
            $http({
                url: "/private",
                method: "GET",
                data: ""
            }).success(function (data, status, headers, config) {
                d.resolve(data);
            }).error(function (data, status, headers, config) {
                d.reject(null);
            });
            return d.promise;
        };
	
	service.publicAccounts = function(){
			var d = $q.defer();
            $http({
                url: "/public",
                method: "GET",
                data: ""
            }).success(function (data, status, headers, config) {
                d.resolve(data);
            }).error(function (data, status, headers, config) {
                d.reject(null);
            });
            return d.promise;
        };

	return service;

}]);


app.controller("MainCtrl",['$scope','$auth', '$state', 'Service', function($scope, $auth, $state,service){
	$scope.authenticate = function () {
		$auth.authenticate('test').then(function(response) {
		    // Redirect user here after a successful log in.
		    $state.go('welcome');
		  }).catch(function(response) {
		    // Handle errors here, such as displaying a notification
		    // for invalid email and/or password.
		  });
	};

	$scope.publicAccounts = function(){
		service.publicAccounts().then(function(data){
			console.log(data);
			$scope.public_accounts = data.accounts;
		});
	}

}]);



app.controller("WelcomeCtrl",['$scope','$auth','$state', 'Service', function($scope, $auth, $state, service){

    $scope.myAccounts = function(){
		service.myAccounts().then(function(data){
			console.log(data);
			$scope.my_accounts = data.accounts;
		});
	}
}]);


	





		
	
