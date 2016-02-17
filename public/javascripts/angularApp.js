
var app = angular.module("openApp",['satellizer','ui.router']);

app.config(["$stateProvider","$urlRouterProvider",'$authProvider', function($stateProvider, $urlRouterProvider, $authProvider){

	// GitHub
	$authProvider.oauth1({
	  name : "test",
	  url: '/auth/connect',
	  authorizationEndpoint: 'https://apisandbox.openbankproject.com/oauth/authorize',
	  redirectUri: window.location.origin+"/welcome",	 
	  type: '1.0',
	  popupOptions: { width: 1020, height: 618 }
	});

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


app.controller("MainCtrl",['$scope','$auth', '$state', function($scope, $auth, $state){
	$scope.authenticate = function () {
		$auth.authenticate('test').then(function(response) {
		    // Redirect user here after a successful log in.
		    $state.go('welcome');
		  }).catch(function(response) {
		    // Handle errors here, such as displaying a notification
		    // for invalid email and/or password.
		  });
	};

}]);
	


app.controller("WelcomeCtrl",['$scope','Service', function($scope, service){
	$scope.getAllBanks = function () {
		$scope.banks = service.getAllBanks();
	};

}]);

app.service('Service',['$http',function($http){

	var base_url = 'https://apisandbox.openbankproject.com',
	service = {};

	service.getAllBanks = $http.get(base_url+"/obp/v1.2.1/banks/rbs/accounts/private",function(data){
		return data;
	});

	return service;

}]);
	





		
	
