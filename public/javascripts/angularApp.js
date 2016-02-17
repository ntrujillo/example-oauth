
var app = angular.module("openApp",['satellizer','ui.router']);

app.config(["$stateProvider","$urlRouterProvider",'$authProvider', function($stateProvider, $urlRouterProvider, $authProvider){

	// GitHub
	$authProvider.oauth1({
	  name : "test",
	  url: '/auth/connect',
	  authorizationEndpoint: 'https://apisandbox.openbankproject.com/oauth/authorize?oauth_token=',
	  redirectUri: window.location.origin,	 
	  type: '1.0',
	  popupOptions: { width: 1020, height: 618 }
	});

	$stateProvider.state('home',{
		url:"/home",
		templateUrl:"/home.html",
		controller:"MainCtrl"
	});
	
	$urlRouterProvider.otherwise('home');

}]);


app.controller("MainCtrl",['$scope','$auth', function($scope, $auth){
	$scope.authenticate = function () {
		$auth.authenticate('test');
	};

}]);
	





		
	
