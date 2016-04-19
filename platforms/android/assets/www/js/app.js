// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'ngCordova', 'ionic-modal-select', 'ionic.service.core', 'starter.controllers', 'ionic-native-transitions','ngMessages'])

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
            cancelText: 'Cerrar',
            cancelType: 'button-assertive'
        }).then(function(result) {
            if (!result) {
                ionic.Platform.exitApp();
            }
        });
    }

    document.addEventListener("online", onOnline, false);

    function onOnline() {
        // Handle the online event
        var server = "http://104.236.33.228:8040";

        var isLogin = function() {
            $http.get(server + "/is/login/")
                .then(function doneCallbacks(response) {
                    if ($location.path() == "/app/login/0") {
                        $location.path('/app/clientelists');
                    }
                }, function failCallbacks(response) {
                    if ($location.path() !== "/app/login/0") {
                        $location.path("/app/login/0");
                    }
                });
        };

        $http.get(server + "/serve/on/").then(function doneCallbacks(response) {
            isLogin();
        }, function failCallbacks(response) {
            if (response.status === 0) {
                $ionicPopup.confirm({
                    title: "Server",
                    content: "Servidor fuera de servicio",
                    cancelText: 'Cerrar',
                    cancelType: 'button-assertive'
                }).then(function(result) {
                    if (!result) {
                        ionic.Platform.exitApp();
                    }
                });
            }
        });

    }
})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider, $ionicNativeTransitionsProvider) {
    $ionicConfigProvider.views.transition('none');
    $ionicConfigProvider.scrolling.jsScrolling(false);
    $ionicNativeTransitionsProvider.setDefaultOptions({
        duration: 300, // in milliseconds (ms), default 400,
        slowdownfactor: 4, // overlap views (higher number is more) or no overlap (1), default 4
        iosdelay: -1, // ms to wait for the iOS webview to update before animation kicks in, default -1
        androiddelay: -1, // same as above but for Android, default -1
        winphonedelay: -1, // same as above but for Windows Phone, default -1,
        fixedPixelsTop: 0, // the number of pixels of your fixed header, default 0 (iOS and Android)
        fixedPixelsBottom: 0, // the number of pixels of your fixed footer (f.i. a tab bar), default 0 (iOS and Android)
        triggerTransitionEvent: '$ionicView.afterEnter', // internal ionic-native-transitions option
        backInOppositeDirection: false // Takes over default back transition and state back transition to use the opposite direction transition to go back
    });
    $ionicNativeTransitionsProvider.setDefaultTransition({
        type: 'slide',
        direction: 'left'
    });
    $stateProvider

    .state('app', {
        url: '/app',
        abstract: true,
        templateUrl: 'templates/menu.html',
        controller: 'AppCtrl'
    })

    .state('app.login', {
        url: '/login/:next',
        nativeTransitionsAndroid: {
            "type": "slider",
            "direction": "up"
        },
        nativeTransitionsBackAndroid: {
            "type": "slider",
            "direction": "down"
        },
        views: {
            'menuContent': {
                templateUrl: 'templates/login2.html',
                controller: 'Login'
            }
        }
    })

    .state('app.reporte', {
        url: '/reporte/:clienteId',
        nativeTransitionsAndroid: {
            "type": "fade",
            "duration": 500
        },
        views: {
            'menuContent': {
                templateUrl: 'templates/reporte.html',
                controller: 'Reporte'
            }
        }
    })

    .state('app.mantenimiento', {
        url: '/mantenimiento/:clienteId',
        nativeTransitionsAndroid: {
            "type": "fade",
            "duration": 500
        },
        views: {
            'menuContent': {
                templateUrl: 'templates/mantenimiento.html',
                controller: 'Mantenimiento'
            }
        }
    })

    .state('app.reparacion', {
        url: '/reparacion/:clienteId',
        nativeTransitionsAndroid: {
            "type": "fade",
            "duration": 500
        },
        views: {
            'menuContent': {
                templateUrl: 'templates/reparacion.html',
                controller: 'Reparacion'
            }
        }
    })

    .state('app.clientelists', {
        url: '/clientelists',
        nativeTransitionsBackAndroid: {
            "type": "slider",
            "direction": "right"
        },
        views: {
            'menuContent': {
                templateUrl: 'templates/Clientelists.html',
                controller: 'Clientelists'
            }
        }
    })

    .state('app.info', {
        url: '/info/:clienteId',
        nativeTransitionsBackAndroid: {
            "type": "fade",
            "duration": 500
        },
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
    })
    .state('app.historial', {
        url: '/historial',
        views: {
            'menuContent': {
                templateUrl: 'templates/historial.html',
            }
        }
    });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/app/clientelists');
});