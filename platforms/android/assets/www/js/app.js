// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'ionic.service.core', 'ngCordova', 'starter.controllers', 'ionic-native-transitions', 'ngMessages', 'starter.directives', 'ksSwiper', 'starter.socket'])

.run(function($ionicPlatform, $cordovaStatusbar, $cordovaToast, $state, $cordovaLocalNotification) {
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
    });

    var bandera = false;

    document.addEventListener("offline", onOffline, false);

    function onOffline() {
        // Handle the offline event
        $cordovaLocalNotification.cancel(2).then(function(result) {
            $cordovaLocalNotification.schedule({
                id: 1,
                title: 'Piscix',
                text: 'No hay conexión a Internet!',
                //icon: 'img/icon.png'
            });
        });
        $cordovaToast.show('No hay conexión a Internet!', 'short', 'bottom')
            .then(function(success){
                bandera = true;
            });
    }

    document.addEventListener("online", onOnline, false);

    function onOnline() {
        // Handle the online event
        if (bandera) {
            $cordovaLocalNotification.cancel(1).then(function(result) {
                // ...
                $cordovaLocalNotification.schedule({
                    id: 2,
                    title: 'Piscix',
                    text: 'Conexión a internet recuperada!',
                    //icon: 'img/icon.png'
                });
            });
            $cordovaToast.show('Su equipo se conecto a internet', 'short', 'bottom')
                .then(function(success) {
                    // success
                    bandera = false;
            });
        }
    }

})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider, $ionicNativeTransitionsProvider) {
    $ionicConfigProvider.views.maxCache(1);
    $ionicConfigProvider.views.transition('none');
    //$ionicConfigProvider.spinner.icon('ripple');
    $ionicConfigProvider.scrolling.jsScrolling(false);
    $ionicNativeTransitionsProvider.setDefaultOptions({
        duration: 375, // in milliseconds (ms), default 400,
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
        type: "slide",
        direction: "left"
    });

    $ionicNativeTransitionsProvider.setDefaultBackTransition({
        type: 'slide',
        direction: 'right'
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
        nativeTransitionsAndroid: {
            "type": "slide",
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
    })

    .state('app.historialR', {
        url: '/historial/reportes/:clienteId/:actual',
        views: {
            'menuContent': {
                templateUrl: 'templates/historialR.html',
                controller: 'HistorialR'
            }
        }
    })

    .state('app.historialM', {
        url: '/historial/mantenimientos/:clienteId/:actual',
        views: {
            'menuContent': {
                templateUrl: 'templates/historialM.html',
                controller: 'HistorialM'
            }
        }
    })

    .state('app.galeriaR', {
        url: '/galeria/reportes/:reporteId',
        views: {
            'menuContent': {
                templateUrl: 'templates/galeriaR.html',
                controller: 'GaleriaR'
            }
        }
    })

    .state('app.galeriaM', {
        url: '/galeria/mantenimientos/:mantenimientoId',
        views: {
            'menuContent': {
                templateUrl: 'templates/galeriaM.html',
                controller: 'GaleriaM'
            }
        }
    })

    .state('app.respuestas', {
        url: '/respuestas/:reporteId',
        views: {
            'menuContent': {
                templateUrl: 'templates/respuestas.html',
                controller: 'Repuesta'
            }
        }
    })
    .state('app.planilla', {
        url: '/planilla/:clienteId',
        views: {
            'menuContent': {
                templateUrl: 'templates/planilla.html',
                controller: 'Planilla'
            }
        }
    });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/app/clientelists');
});
