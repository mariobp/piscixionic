// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'ionic.service.core', 'ngCordova', 'ionic-modal-select', 'starter.controllers', 'ionic-native-transitions', 'ngMessages', 'starter.directives'])

.run(function($ionicPlatform, $ionicPopup, $http, $window, $cordovaStatusbar, $cordovaToast, $cordovaPush, $rootScope, $state, $cordovaLocalNotification) {
    //Project Number: 725278590059
    //API Key: AIzaSyBeuBsMahCuzv7P09GZ69wWbtqDR_4nqGA

    $ionicPlatform.ready(function() {
        $cordovaStatusbar.overlaysWebView(true);
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            cordova.plugins.Keyboard.disableScroll(true);

        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleLightContent();
            StatusBar.backgroundColorByHexString('#455A64');
        }
        /*
        var push = new Ionic.Push({
          "onNotification": function(notification){
            alert("Received Notification!");
          },
          "pluginConfig": {
            "android":{
              "iconColor": "#ef473a"
            }
          }
        });

        Ionic.io();

        // this will give you a fresh user or the previously saved 'current user'
        var user = Ionic.User.current();

        // if the user doesn't have an id, you'll need to give it one.
        if (!user.id) {
          user.id = Ionic.User.anonymousId();
          // user.id = 'your-custom-user-id';
        }

        //persist the user

        user.set('name','Mario');
        user.set('bio','Desarrollaor');
        user.save();

        var callback = function() {
          push.addTokenToUser(user);
          user.save();
        };

        push.register(callback);

        // Codigo notificaciones push
        */
        var androidConfig = {
            "senderID": "AIzaSyBeuBsMahCuzv7P09GZ69wWbtqDR_4nqGA",
        };

        $cordovaPush.register(androidConfig).then(function(result) {
            console.log(result);
            // Success
        }, function(err) {
            // Error
        });

        $rootScope.$on('$cordovaPush:notificationReceived', function(event, notification) {
            switch (notification.event) {
                case 'registered':
                    if (notification.regid.length > 0) {
                        console.log('registration ID = ' + notification.regid);
                    }
                    break;

                case 'message':
                    // this is the actual push notification. its format depends on the data model from the push server
                    console.log('message = ' + notification.message + ' msgCount = ' + notification.msgcnt);
                    break;

                case 'error':
                    console.log('GCM error = ' + notification.msg);
                    break;

                default:
                    console.log('An unknown GCM event has occurred');
                    break;
            }

        });

        // WARNING: dangerous to unregister (results in loss of tokenID)
        /*$cordovaPush.unregister(options).then(function(result) {
            // Success!
        }, function(err) {
            // Error
        });
        */
    });

    $ionicPlatform.registerBackButtonAction(function() {
        if ($state.current.name == "app.clientelists" || $state.current.name == "app.acerca" || $state.current.name == "app.historial") {
            var confirmPopup = $ionicPopup.confirm({
                //title: 'Confirm',
                template: 'Seguro que desea salir?'
            });
            confirmPopup.then(function(res) {
                if (res) {
                    navigator.app.exitApp();
                }
            });
        } else {
            navigator.app.backHistory();
        }
    }, 100);

    var bandera = false;
    document.addEventListener("offline", onOffline, false);

    function onOffline() {
        // Handle the offline event
        $cordovaToast.show('No hay conexión a Internet!', 'long', 'center');
        $cordovaLocalNotification.cancel(2).then(function (result) {
            $cordovaLocalNotification.schedule({
                id: 1,
                title: 'Piscix',
                text: 'No hay conexión a Internet!',
                data: {
                    customProperty: 'custom value'
                }
            }).then(function(result) {
                // ...
                bandera = true;
            });
        });
    }

    document.addEventListener("online", onOnline, false);

    function onOnline() {
        // Handle the online event
        //var server = "http://104.236.33.228:8040";
        var server = "http://192.168.1.51:8000";
        //var server = "http://192.168.0.106:8000";
        var isLogin = function() {
            $http.get(server + "/usuarios/is/login/")
                .then(function doneCallbacks(response) {
                    if ($state.current.name == "app.login") {
                        $state.go('app.clientelists');
                    }
                }, function failCallbacks(response) {
                    $cordovaToast
                    .show(response.data.error, 'short', 'center')
                    .then(function(success) {
                        if($state.current.name != 'app.login'){
                          $state.go('app.login');
                        }
                    }, function(error) {
                        console.log(error);
                    });

                });
        };

        $http.get(server + "/usuarios/serve/on/").then(function doneCallbacks(response) {
            isLogin();
        }, function failCallbacks(response) {
            if (response.status === 0) {
                $cordovaToast.show('No hay conexión a Internet', 'long', 'center');
                $cordovaLocalNotification.schedule({
                    id: 3,
                    title: 'Piscix',
                    text: 'Servidor fuera de servicio',
                    data: {
                        customProperty: 'custom value'
                    }
                }).then(function(result) {
                    // ...
                });
            }
        });

        if (bandera) {
            $cordovaLocalNotification.cancel(1).then(function (result) {
              // ...
              $cordovaLocalNotification.schedule({
                  id: 2,
                  title: 'Piscix',
                  text: 'Conexión a internet recuperada!',
                  data: {
                      customProperty: 'custom value'
                  }
              }).then(function(result) {
                  // ...
                  bandera = false;
              });
            });
            /*
            $cordovaToast.show('Su equipo se conecto a internet', 'short', 'center')
                .then(function(success) {
                    // success
                    bandera = false;
            });
            */
        }
    }

    //Codigo Notifiaciones Push


})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider, $ionicNativeTransitionsProvider) {
    $ionicConfigProvider.views.maxCache(5);
    $ionicConfigProvider.views.transition('none');
    $ionicConfigProvider.spinner.icon('ripple');
    $ionicConfigProvider.scrolling.jsScrolling(false);
    $ionicNativeTransitionsProvider.setDefaultOptions({
        duration: 200, // in milliseconds (ms), default 400,
        slowdownfactor: 2, // overlap views (higher number is more) or no overlap (1), default 4
        iosdelay: -1, // ms to wait for the iOS webview to update before animation kicks in, default -1
        androiddelay: -1, // same as above but for Android, default -1
        winphonedelay: -1, // same as above but for Windows Phone, default -1,
        fixedPixelsTop: 0, // the number of pixels of your fixed header, default 0 (iOS and Android)
        fixedPixelsBottom: 0, // the number of pixels of your fixed footer (f.i. a tab bar), default 0 (iOS and Android)
        triggerTransitionEvent: '$ionicView.afterEnter', // internal ionic-native-transitions option
        backInOppositeDirection: false // Takes over default back transition and state back transition to use the opposite direction transition to go back
    });

    $ionicNativeTransitionsProvider.setDefaultTransition({
        type: "fade",
        direction: "up"
    });

    $ionicNativeTransitionsProvider.setDefaultBackTransition({
        type: 'fade',
        direction: 'down'
    });

    $stateProvider
        .state('app', {
            url: '/app',
            abstract: true,
            templateUrl: 'templates/menu.html',
            controller: 'AppCtrl'
        })

    .state('app.login', {
        url: '/login',
        cache: false,
        nativeTransitionsAndroid:{
          "type": "slide",
          "direction" : "up"
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
                controller: 'Mantenimiento'
            }
        }
    })

    .state('app.reparacion', {
        url: '/reparacion/:clienteId',
        views: {
            'menuContent': {
                templateUrl: 'templates/reparacion.html',
                controller: 'Reparacion'
            }
        }
    })

    .state('app.clientelists', {
        url: '/clientelists',
        cache: false,
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
        })
        .state('app.piscineros', {
            url: '/piscineros',
            views: {
                'menuContent': {
                    templateUrl: 'templates/piscineros.html',
                    controller: 'Piscineros'
                }
            }
        })
        .state('app.asigacionpiscina', {
            url: '/asignacionpiscina/:piscineroId',
            views: {
                'menuContent': {
                    templateUrl: 'templates/piscinasAsignacion.html',
                    controller: 'PiscinaAsignacion'
                }
            }
        })
        .state('app.asignargps', {
            url: '/asignargps/:casaId/:latitud/:longitud',
            views: {
                'menuContent': {
                    templateUrl: 'templates/asignar-gps.html',
                    controller: 'MapCtrl'
                }
            }
        })
        .state('app.ruta', {
            url: '/ruta/:piscineroId',
            views: {
                'menuContent': {
                    templateUrl: 'templates/ruta.html',
                    controller: 'Ruta'
                }
            }
        })
        .state('app.maparuta', {
            url: '/mapa/ruta/:piscineroId',
            views: {
                'menuContent': {
                    templateUrl: 'templates/maparuta.html',
                    controller: 'MapaRuta'
                }
            }
        });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/app/clientelists');
});
