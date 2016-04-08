// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic','ngCordova','ionic-modal-select','ionic.service.core', 'starter.controllers'])

.run(function($ionicPlatform, $ionicPopup, $interval, $http, $location, $window) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

  });
  document.addEventListener("offline", onOffline, false);
  function onOffline() {
      // Handle the offline event
      $ionicPopup.confirm({
          title: "Internet desconectado",
          content: "Su equipo esta desconectado de Internet.",
          cancelText:'Cerrar',
          cancelType:'button-assertive'
      }).then(function(result) {
          if(!result) {
              ionic.Platform.exitApp();
          }
      });
  }

  document.addEventListener("online", onOnline, false);
  function onOnline() {
    // Handle the online event
    var server = "http://104.236.33.228:8040";

    var isLogin = function(){
      $http.get(server+"/is/login/")
      .then(function doneCallbacks(response){
        if($location.path()=="/app/login/0"){
          $location.path('/app/clientelists');
        }
      }, function failCallbacks(response){
        if($location.path()!=="/app/login/0"){
          $location.path("/app/login/0");
        }
      });
    };

    $http.get(server+"/serve/on/").then(function doneCallbacks(response){
        isLogin();
    },function failCallbacks(response){
      if (response.status===0) {
        $ionicPopup.confirm({
            title: "Server",
            content: "Servidor fuera de servicio",
            cancelText:'Cerrar',
            cancelType:'button-assertive'
        }).then(function(result) {
            if(!result) {
                ionic.Platform.exitApp();
            }
        });
      }
    });

  }
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

    .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })

  .state('app.login', {
      url: '/login/:next',
      views: {
        'menuContent': {
          templateUrl: 'templates/login2.html',
          controller: 'Login'
        }
      }
    })

  .state('app.reporte', {
      url: '/reporte/:clienteId',
      views: {
        'menuContent': {
          templateUrl: 'templates/reporte.html',
          controller: 'Reporte'
        }
      }
    })

    .state('app.mantenimiento', {
      url: '/mantenimiento/:clienteId',
      views: {
        'menuContent': {
          templateUrl: 'templates/mantenimiento.html',
          controller:'Mantenimiento'
        }
      }
    })

    .state('app.reparacion', {
      url: '/reparacion/:clienteId',
      views: {
        'menuContent': {
          templateUrl: 'templates/reparacion.html',
          controller:'Reparacion'
        }
      }
    })

    .state('app.clientelists', {
      url: '/clientelists',
      views: {
        'menuContent': {
          templateUrl: 'templates/Clientelists.html',
          controller: 'Clientelists'
        }
      }
    })

  .state('app.info', {
    url: '/info/:clienteId',
    views: {
      'menuContent': {
        templateUrl: 'templates/InfoC.html',
        controller: 'InfoC'
      }
    }
  })
  .state('app.acerca', {
    url: '/acerca',
    views: {
      'menuContent': {
        templateUrl: 'templates/acerca.html',
      }
    }
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/clientelists');
});
