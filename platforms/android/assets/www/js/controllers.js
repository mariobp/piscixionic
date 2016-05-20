angular.module('starter.controllers', [])

.controller('AppCtrl', function($http, $scope, $timeout, $ionicLoading, $ionicPopup, $location) {

    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //$scope.$on('$ionicView.enter', function(e) {
    //});
    // Form data for the login modal
    $scope.loginData = {};
    //$scope.server = "http://104.236.33.228:8040";
    //$scope.server = "http://192.168.1.51:8000";
    $scope.server = "http://192.168.1.60:8001";
    // Create the login modal that we will use later
    $scope.logout = function() {
        $http.get($scope.server + "/usuarios/logout/").success(function() {
            $location.path('/app/login/0');
        }).error(function(data) {
            /* Act on the event */
            console.log(data);
        });
    };

    $scope.showAlert = function(titulo, body) {
        var alertPopup = $ionicPopup.alert({
            title: titulo,
            template: body,
        });
    };

    //Loading...
    $scope.showLoading = function() {
        $ionicLoading.show({
            template: 'Cargando...'
        });
    };

    $scope.hideLoading = function() {
        $ionicLoading.hide();
    };

})

.controller('Login', function($scope, $http, $ionicHistory, $cordovaToast) {
        $ionicHistory.nextViewOptions({
            //  disableAnimate: true,
            disableBack: true
        });
        console.log("Log");
        console.log($ionicHistory.backView());
        console.log($ionicHistory.viewHistory());
        $scope.loginReady = true;
        $scope.doLogin = function() {
            $scope.loginReady = false;
            $http({
                method: 'POST',
                url: $scope.server + '/usuarios/login/piscinero/',
                data: $.param($scope.loginData),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
            }).then(function doneCallbacks(response) {
              console.log("Esta logeado");
                $scope.loginData = {};
                $scope.loginReady = true;
                $ionicHistory.goBack(-1);
            }, function failCallbacks(response) {
                $scope.loginData = {};
                $scope.loginReady = true;
                if (response.status == 400) {
                    var data = response.data;
                    if (data.error) {
                        $cordovaToast.show(data.error[0], 'short', 'center');
                    }
                    if (data.username) {
                        $cordovaToast.show("Usuario:" + data.username[0], 'short', 'center');
                    }
                    if (data.password) {
                        $cordovaToast.show("Contraseña:" + data.password[0], 'short', 'center');
                    }
                }
            });
            // Simulate a login delay. Remove this and replace with your login
            // code if using a login system

        };

    })
    //Controlador de lista de clientes
    .controller('Clientelists', function($http, $scope, $timeout, $ionicPopup, $location, $cordovaToast, $ionicHistory, $timeout) {
        /*$ionicHistory.nextViewOptions({
            //  disableAnimate: true,
            disableBack: true
        });*/
        $scope.search = "";
        $scope.clientelists = [];
        $scope.noMoreItemsAvailable = false;
        var num = 1,
            max = 0;
        $scope.loadMore = function() {
            $http.get($scope.server + '/usuarios/service/list/cliente/?page=' + num)
                .then(function successCallback(response) {
                    var clientes = response.data.object_list;
                    clientes.forEach(function(cliente) {
                        $scope.clientelists.push(cliente);
                    });
                    max = response.data.count;
                    if ($scope.clientelists.length === max) {
                        $scope.noMoreItemsAvailable = true;
                    }
                    num++;
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                }, function errorCallback(response) {
                    if (response.status === 403) {
                      $cordovaToast
                      .show(response.data.error, 'short', 'center')
                      .then(function(success) {
                          $location.path('/app/login');
                      }, function(error) {
                          $location.path('/app/login');
                      });

                    } else if (response.status === 0) {
                        $ionicPopup.alert({
                            title: "Error",
                            content: "No se puede acceder a este servicio en este momento.",
                        });
                    } else {
                      $timeout(function(){
                        $scope.loadMore();
                      },30000);
                    }
                });
        };
        $scope.reload = function() {
            num = 1;
            max = 0;
            $scope.noMoreItemsAvailable = false;
            $scope.clientelists = [];
            $scope.$broadcast('scroll.refreshComplete');
        };
    })

//Controlador de informacion de cliente
.controller('InfoC', function($http, $scope, $stateParams, $ionicPopup, $location, $timeout, $cordovaToast) {
    var id = $stateParams.clienteId;
    $scope.dataReady = false;
    $('.tooltipped').tooltip({
        delay: 50
    });
    $timeout(function() {
        $http.get($scope.server + '/usuarios/single/cliente/' + id + '/')
            .then(function successCallback(response) {
                $scope.info = response.data;
                $scope.dataReady = true;
            }, function errorCallback(response) {
                if (response.status === 403) {
                    $cordovaToast
                        .show(response.data.error, 'short', 'center')
                        .then(function(success) {
                          $location.path('/app/login');
                        }, function(error) {
                          console.log(error);
                        });
                }else if (response.status === 0) {
                    $ionicPopup.alert({
                        title: "Error",
                        content: "No se puede acceder a este servicio en este momento.",
                    });
                }
            });
    }, 500);
})

.factory('Camera', function($q) {

    return {
        getPicture: function(options) {
            var q = $q.defer();

            navigator.camera.getPicture(function(result) {
                // Do any magic you need
                q.resolve(result);
            }, function(err) {
                q.reject(err);
            }, options);

            return q.promise;
        }
    };
})

.factory('Galeria', function($rootScope, $ionicModal) {
    var scope = $rootScope;
    $ionicModal.fromTemplateUrl('templates/galeria.html', {
        scope: scope,
        animation: 'fade'
    }).then(function(modal) {
        scope.modal = modal;
    });

    scope.closeGaleria = function() {
        scope.modal.hide();
    };

    return {
        openGaleria: function(imagenes) {
            scope.imagenes = imagenes;
            scope.modal.show();
        }
    };
})

.controller('Reporte', function($http, $scope, $stateParams, $ionicPopup, Camera, $cordovaToast, Galeria, $cordovaImagePicker, $location) {
    $scope.data = {};
    $scope.data.imagenes = [];
    $scope.total = 0;
    $scope.ready = true;
    //Angular Document Ready
    angular.element(document).ready(function() {
        $('#tipo').material_select();
    });

    $http.get($scope.server + '/list/tiporepor/')
        .then(function doneCallbacks(response) {
            $scope.tipolist = response.data.object_list;
        }, function failCallbacks(response) {
            console.log(response);
            if (response.status === 0) {
                $ionicPopup.alert({
                    title: "Error",
                    content: "No se puede acceder a este servicio en este momento.",
                });
            }
            if (response.status === 404) {
                console.log("error 404");
            } else {
                var data = response.data;
                //$scope.showAlert("Error", data.error[0]);
            }
        });


    $scope.takePicture = function() {
        if ($scope.total < 5) {
            var options = {
                quality: 75,
                targetWidth: 1280,
                targetHeight: 720,
                sourceType: 1
            };
            Camera.getPicture(options).then(function(imageData) {
                $scope.data.imagenes.push(imageData);
                $scope.total = $scope.data.imagenes.length;
            }, function(err) {
                console.log("Error", err);
            });
        } else {
            $cordovaToast
                .show('El maximo es 5 fotos', 'short', 'center')
                .then(function(success) {
                    // success
                }, function(error) {
                    // error
                });
        }
    };

    $scope.getPicture = function() {
        if ($scope.total < 5) {
            var options = {
                quality: 75,
                targetWidth: 1280,
                targetHeight: 720,
                sourceType: 0
            };
            Camera.getPicture(options).then(function(imageData) {
                $scope.data.imagenes.push(imageData);
                $scope.total = $scope.data.imagenes.length;
            }, function(err) {
                console.log("Error", err);
            });
        } else {
            $cordovaToast
                .show('El maximo es 5 fotos', 'short', 'center')
                .then(function(success) {
                    // success
                }, function(error) {
                    // error
                });
        }
    };

    $scope.verGaleria = function() {
        Galeria.openGaleria($scope.data.imagenes);
    };


    //$cordovaImagePicker
    $scope.getGallery = function() {
        var options2 = {
            maximumImagesCount: 5,
            targetWidth: 1280,
            targetHeight: 720,
            quality: 80
        };

        $cordovaImagePicker.getPictures(options2)
            .then(function(results) {
                for (var i = 0; i < results.length; i++) {
                    $scope.data.imagenes.push(results[i]);
                    $scope.total = $scope.data.imagenes.length;
                }
            }, function(error) {
                console.log('Error: ' + JSON.stringify(error)); // In case of error
            });
    };

    var enviar = function(data) {
        $scope.ready = false;
        $http({
            method: 'POST',
            url: $scope.server + '/reporte/',
            data: data,
            //transformRequest: formDataObject, // this sends your data to the formDataObject provider that we are defining below.
            headers: {
                'Content-Type': 'multipart/form-data'
            },
        }).then(function doneCallbacks(response) {
            $scope.data = {};
            $cordovaToast.show("Enviado exitoso", 'long', 'center');
            $scope.ready = true;
        }, function failCallbacks(response) {
            $scope.ready = true;
            if (response.status === 403) {
                $cordovaToast
                    .show(response.data.error, 'short', 'center')
                    .then(function(success) {
                        $location.path('/app/login');
                    }, function(error) {
                        console.log(error);
                    });
            }else if (response.status == 400) {
                var data = response.data;
                if (data.error) {
                    $cordovaToast.show(data.error[0], 'short', 'center');
                }else if (data.nombre) {
                    $cordovaToast.show("Nombre:" + data.nombre[0], 'short', 'center');
                }else if (data.descripcion) {
                    $cordovaToast.show("Descripcion:" + data.descripcion[0], 'short', 'center');
                }else if (data.cliente) {
                    $cordovaToast.show("Cliente:" + data.cliente[0], 'short', 'center');
                }else if (data.tipo) {
                    $cordovaToast.show("Tipo:" + data.tipo[0], 'short', 'center');
                }else if (data.reporta) {
                    $cordovaToast.show("Reporta:" + data.reporta[0], 'short', 'center');
                }
            }
        });
    };

    $scope.datosForm = function() {
        var dataSend = {};
        dataSend.nombre = $scope.data.nombre;
        dataSend.descripcion = $scope.data.descripcion;
        dataSend.tipo = $scope.data.tipo.id;
        dataSend.cliente = $stateParams.clienteId;
        dataSend["solicituddeproducto_set-TOTAL_FORMS"] = $scope.total;
        dataSend["solicituddeproducto_set-INITIAL_FORMS"] = 0;
        dataSend["solicituddeproducto_set-MIN_NUM_FORMS"] = 0;
        dataSend["solicituddeproducto_set-MAX_NUM_FORMS"] = 1000;
        if ($scope.data.imagenes.length > 0) {
            for (var i = 0; i < $scope.data.imagenes; i++) {
                dataSend["imagenr_set-" + i + "-imagen"] = $scope.data.imagenes[i];
            }
            enviar(dataSend); //Se formatea la informacion y se envia.
        } else {
            $ionicPopup.confirm({
                title: "Fotos",
                content: "Esta seguro que quiere enviar sin fotos?",
                cancelText: 'Tomar Foto',
                cancelType: 'button-calm',
                okText: 'Si, Enviar!'
            }).then(function(result) {
                if (result) {
                    enviar(dataSend); //Se envia sin fotos
                } else {
                    $scope.takePicture();
                }
            });
        }

    };
})

.controller('Mantenimiento', function($http, $scope, $stateParams, Camera, Galeria, $cordovaImagePicker, $cordovaToast, $location) {
    $scope.data = {};
    $scope.data.imagenes = [];
    $scope.total = 0;
    $scope.ready = true;
    $scope.takePicture = function() {
        if ($scope.total < 5) {
            var options = {
                quality: 75,
                targetWidth: 1280,
                targetHeight: 720,
                sourceType: 1
            };
            Camera.getPicture(options).then(function(imageData) {
                $scope.data.imagenes.push(imageData);
                $scope.total = $scope.data.imagenes.length;
            }, function(err) {
                console.log("Error", err);
            });
        } else {
            $cordovaToast
                .show('El maximo es 5 fotos', 'short', 'center')
                .then(function(success) {
                    // success
                }, function(error) {
                    // error
                });
        }
    };

    $scope.verGaleria = function() {
        Galeria.openGaleria($scope.data.imagenes);
    };


    $scope.getPicture = function() {
        if ($scope.total < 5) {
            var options = {
                quality: 75,
                targetWidth: 1280,
                targetHeight: 720,
                sourceType: 0
            };
            Camera.getPicture(options).then(function(imageData) {
                $scope.data.imagenes.push(imageData);
                $scope.total = $scope.data.imagenes.length;
            }, function(err) {
                console.log("Error", err);
            });
        } else {
            $cordovaToast
                .show('El maximo es 5 fotos', 'short', 'center')
                .then(function(success) {
                    // success
                }, function(error) {
                    // error
                });
        }
    };

    //$cordovaImagePicker
    $scope.getGallery = function() {
        var options2 = {
            maximumImagesCount: 5,
            targetWidth: 1280,
            targetHeight: 720,
            quality: 80
        };

        $cordovaImagePicker.getPictures(options2)
            .then(function(results) {
                for (var i = 0; i < results.length; i++) {
                    $scope.data.imagenes.push(results[i]);
                    $scope.total = $scope.data.imagenes.length;
                }
            }, function(error) {
                console.log('Error: ' + JSON.stringify(error)); // In case of error
            });
    };

    var enviar = function(data) {
        $scope.ready = false;
        $http({
            method: 'POST',
            url: $scope.server + '/reporte/',
            data: data,
            headers: {
                'Content-Type': 'multipart/form-data'
            },
        }).then(function doneCallbacks(response) {
            $scope.data = {};
            $cordovaToast.show("Enviado exitoso", 'long', 'center');
            $scope.ready = true;
        }, function failCallbacks(response) {
            $scope.ready = true;
            if (response.status === 403) {
                $cordovaToast
                    .show(response.data.error, 'short', 'center')
                    .then(function(success) {
                        $location.path('/app/login');
                    }, function(error) {
                        console.log(error);
                    });
            }
            if (response.status == 400) {
                var data = response.data;
                if (data.error) {
                    $cordovaToast.show(data.error[0], 'short', 'center');
                }
                if (data.nombre) {
                    $cordovaToast.show("Nombre:" + data.nombre[0], 'short', 'center');
                }
                if (data.descripcion) {
                    $cordovaToast.show("Descripción:" + data.descripcion[0], 'short', 'center');
                }
                if (data.cliente) {
                    $cordovaToast.show("Cliente:" + data.cliente[0], 'short', 'center');
                }

                if (data.reporta) {
                    $cordovaToast.show("Contraseña:" + data.reporta[0], 'short', 'center');
                }
            }
        });
    };

    $scope.datosForm = function() {
        var dataSend = {};
        dataSend.nombre = $scope.data.nombre;
        dataSend.descripcion = $scope.data.descripcion;
        dataSend.cliente = $stateParams.clienteId;
        dataSend["solicituddeproducto_set-TOTAL_FORMS"] = $scope.total;
        dataSend["solicituddeproducto_set-INITIAL_FORMS"] = 0;
        dataSend["solicituddeproducto_set-MIN_NUM_FORMS"] = 0;
        dataSend["solicituddeproducto_set-MAX_NUM_FORMS"] = 1000;
        if ($scope.data.imagenes.length > 0) {
            for (var i = 0; i < $scope.data.imagenes; i++) {
                dataSend["imagenr_set-" + i + "-imagen"] = $scope.data.imagenes[i];
            }
            enviar(dataSend); //Se formatea la informacion y se envia.
        } else {
            $ionicPopup.confirm({
                title: "Fotos",
                content: "Esta seguro que quiere enviar sin fotos?",
                cancelText: 'Tomar Foto',
                cancelType: 'button-calm',
                okText: 'Si, Enviar!'
            }).then(function(result) {
                if (result) {
                    enviar(dataSend); //Se envia sin fotos
                } else {
                    $scope.takePicture();
                }
            });
        }

    };
})

.controller('Reparacion', function($http, $scope, $stateParams, Camera, Galeria, $cordovaImagePicker, $location, $cordovaToast) {
    $scope.data = {};
    $scope.data.imagenes = [];
    $scope.total = 0;
    $scope.ready = true;
    $scope.takePicture = function() {
        if ($scope.total < 5) {
            var options = {
                quality: 75,
                targetWidth: 1280,
                targetHeight: 720,
                sourceType: 1
            };
            Camera.getPicture(options).then(function(imageData) {
                $scope.data.imagenes.push(imageData);
                $scope.total = $scope.data.imagenes.length;
            }, function(err) {
                console.log("Error", err);
            });
        } else {
            $cordovaToast
                .show('El maximo es 5 fotos', 'short', 'center')
                .then(function(success) {
                    // success
                }, function(error) {
                    // error
                });
        }
    };

    $scope.verGaleria = function() {
        Galeria.openGaleria($scope.data.imagenes);
    };

    $scope.getPicture = function() {
        if ($scope.total < 5) {
            var options = {
                quality: 75,
                targetWidth: 1280,
                targetHeight: 720,
                sourceType: 0
            };
            Camera.getPicture(options).then(function(imageData) {
                $scope.data.imagenes.push(imageData);
                $scope.total = $scope.data.imagenes.length;
            }, function(err) {
                console.log("Error", err);
            });
        } else {
            $cordovaToast
                .show('El maximo es 5 fotos', 'short', 'center')
                .then(function(success) {
                    // success
                }, function(error) {
                    // error
                });
        }
    };
    //$cordovaImagePicker
    $scope.getGallery = function() {
        var options2 = {
            maximumImagesCount: 5,
            targetWidth: 1280,
            targetHeight: 720,
            quality: 80
        };

        $cordovaImagePicker.getPictures(options2)
            .then(function(results) {
                for (var i = 0; i < results.length; i++) {
                    $scope.data.imagenes.push(results[i]);
                    $scope.total = $scope.data.imagenes.length;
                }
            }, function(error) {
                console.log('Error: ' + JSON.stringify(error)); // In case of error
            });
    };

    var enviar = function(data) {
        $scope.ready = false;
        $http({
            method: 'POST',
            url: $scope.server + '/reporte/',
            data: data,
            headers: {
                'Content-Type': 'multipart/form-data'
            },
        }).then(function doneCallbacks(response) {
            $scope.data = {};
            $cordovaToast.show("Enviado exitoso", 'long', 'center');
            $scope.ready = true;
        }, function failCallbacks(response) {
            $scope.ready = true;
            if (response.status === 403) {
                $cordovaToast
                    .show(response.data.error, 'short', 'center')
                    .then(function(success) {
                        $location.path('/app/login');
                    }, function(error) {
                        console.log(error);
                    });
            }else if (response.status == 400) {
                var data = response.data;
                if (data.error) {
                    $cordovaToast.show(data.error[0], 'short', 'center');
                }else if (data.nombre) {
                    $cordovaToast.show("Nombre:" + data.nombre[0], 'short', 'center');
                }else if (data.descripcion) {
                    $cordovaToast.show("Descripción:" + data.descripcion[0], 'short', 'center');
                }else if (data.cliente) {
                    $cordovaToast.show("Cliente:" + data.cliente[0], 'short', 'center');
                }else if (data.tipo) {
                    $cordovaToast.show("Tipo:" + data.tipo[0], 'short', 'center');
                }else if (data.reporta) {
                    $cordovaToast.show("Reporta:" + data.reporta[0], 'short', 'center');
                }
            }
        });
    };

    $scope.datosForm = function() {
        var dataSend = {};
        dataSend.nombre = $scope.data.nombre;
        dataSend.descripcion = $scope.data.descripcion;
        dataSend.cliente = $stateParams.clienteId;
        dataSend["solicituddeproducto_set-TOTAL_FORMS"] = $scope.total;
        dataSend["solicituddeproducto_set-INITIAL_FORMS"] = 0;
        dataSend["solicituddeproducto_set-MIN_NUM_FORMS"] = 0;
        dataSend["solicituddeproducto_set-MAX_NUM_FORMS"] = 1000;
        if ($scope.data.imagenes.length > 0) {
            for (var i = 0; i < $scope.data.imagenes; i++) {
                dataSend["imagenr_set-" + i + "-imagen"] = $scope.data.imagenes[i];
            }
            enviar(dataSend); //Se formatea la informacion y se envia.
        } else {
            $ionicPopup.confirm({
                title: "Fotos",
                content: "Esta seguro que quiere enviar sin fotos?",
                cancelText: 'Tomar Foto',
                cancelType: 'button-calm',
                okText: 'Si, Enviar!'
            }).then(function(result) {
                if (result) {
                    enviar(dataSend); //Se envia sin fotos
                } else {
                    $scope.takePicture();
                }
            });
        }

    };
})

.controller('MapCtrl', function($scope, $ionicLoading, $stateParams, $cordovaGeolocation, $ionicPopup, $timeout, $http, $cordovaToast, $location) {
    var latitud = $stateParams.latitud,
        longitud = $stateParams.longitud,
        id = $stateParams.casaId,
        marker = null;
    $scope.Ready = true;

    function validar(metodo) {
        if (longitud === "" && latitud === "") {
            var alertPopup = $ionicPopup.alert({
                title: 'GPS',
                template: 'No hay ningun gps asignado, precionar la opción <i class="icon ion-location icon"></i> para asignar GPS.'
            });
            alertPopup.then(function(res) {
                console.log('Thank you for not eating my delicious ice cream cone');
            });
        } else {
            if (metodo) {
                metodo();
            }
        }
    }


    $scope.mapCreated = function(map) {
        $scope.map = map;
        validar(function() {
            google.maps.event.addListenerOnce(map, 'tilesloaded', function() {
                //this part runs when the mapobject is created and rendered
                $scope.colocarMarker(latitud, longitud);
            });
        });
    };

    $scope.colocarMarker = function(latitude, longitude) {
        $scope.map.setCenter(new google.maps.LatLng(latitude, longitude));
        var myLatLng = {
            lat: parseFloat(latitude),
            lng: parseFloat(longitude)
        };
        if (marker !== null) {
            marker.setMap(null);
        }
        console.log(myLatLng);

        marker = new google.maps.Marker({
            map: $scope.map,
            position: myLatLng,
            animation: google.maps.Animation.DROP,
            title: 'Estas aquí!'
        });

        var infowindow = new google.maps.InfoWindow({
            content: "Usted esta aquí"
        });

        $timeout(function() {
            infowindow.open($scope.map, marker);
        }, 2000);
    };

    $scope.centerOnMe = function() {
        if (!$scope.map) {
            return;
        }

        $scope.loading = $ionicLoading.show({
            template: '<ion-spinner class="spinner-light"></ion-spinner><br/>Obteniendo la ubicación actual...',
            noBackdrop: true
        });

        var posOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        $cordovaGeolocation.getCurrentPosition(posOptions).then(function(pos) {
            latitud = pos.coords.latitude;
            longitud = pos.coords.longitude;
            $scope.colocarMarker(latitud, longitud);
            $scope.loading.hide();
        }, function(error) {
            $scope.loading.hide();
            alert('No se puede obtener la ubicación: ' + error.message);
        });
    };

    $scope.guardar = function() {
        validar(function() {
            $scope.enviando = $ionicLoading.show({
                template: '<ion-spinner class="spinner-light"></ion-spinner><br/>Enviando...',
                noBackdrop: true
            });
            var data = {};
            data.latitud = latitud;
            data.longitud = longitud;
            //$scope.Ready = false;
            $http({
                method: 'POST',
                url: $scope.server + '/usuarios/service/asignacion/gps/' + id + '/',
                data: $.param(data),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
            }).then(function doneCallbacks(response) {
                var data = {};
                $scope.enviando.hide();
                $cordovaToast.show("Guardado exitoso!", 'short', 'center');
            }, function failCallbacks(response) {
                $scope.enviando.hide();
                if (response.status === 403) {
                    $cordovaToast
                        .show(response.data.error, 'short', 'center')
                        .then(function(success) {
                            $location.path('/app/login');
                        }, function(error) {
                            console.log(error);
                        });
                }else if (response.status == 400) {
                    var data = response.data;
                    if (data.error) {
                        $cordovaToast.show(data.error[0], 'short', 'center');
                    }else if (data.username) {
                        $cordovaToast.show("longitud:" + data.longitud[0], 'short', 'center');
                    }else if (data.password) {
                        $cordovaToast.show("latitud:" + data.latitud[0], 'short', 'center');
                    }
                }
            });
        });
    };
})

.controller('Piscineros', function($scope, $http, $location, $ionicHistory, $cordovaToast, $timeout) {
    $scope.ready = false;
    $scope.search = "";
    $scope.noMoreItemsAvailable = false;
    var num = 1,
        max = 0;
    $scope.piscineros = [];
    $scope.loadMore = function() {
        $http.get($scope.server + '/usuarios/service/list/piscinero/?page=' + num)
            .then(function successCallback(response) {
                var data = response.data.object_list;
                data.forEach(function(data) {
                    $scope.piscineros.push(data);
                });
                max = response.data.count;
                if ($scope.piscineros.length === max) {
                    $scope.noMoreItemsAvailable = true;
                }
                num++;
                $scope.$broadcast('scroll.infiniteScrollComplete');
                angular.element(document).ready(function() {
                    $('.collapsible').collapsible({
                        accordion: false // A setting that changes the collapsible behavior to expandable instead of the default accordion style
                    });
                });
                $scope.ready = true;
            }, function errorCallback(response) {
                if (response.status == 403) {
                  console.log("Entro a 403");
                    $cordovaToast
                        .show(response.data.error, 'short', 'center')
                        .then(function(success) {
                            $location.path('/app/login');
                        }, function(error) {
                            console.log(error);
                        });
                }else if (response.status === 0) {
                    $ionicPopup.alert({
                        title: "Error",
                        content: "No se puede acceder a este servicio en este momento.",
                    });
                }else {
                  console.log("Entro");
                  $timeout(function(){
                      $scope.loadMore();
                  }, 30000);
                }
            });
    };

    $scope.reload = function() {
        $scope.piscineros = [];
        num = 1;
        max = 0;
        $scope.noMoreItemsAvailable = false;
        $scope.$broadcast('scroll.refreshComplete');
    };
})

.controller('PiscinaAsignacion', function($scope, $stateParams, $http, $cordovaToast, $ionicLoading, $location, $ionicPopup, $timeout) {
    var id = $stateParams.piscineroId;
    $scope.piscinas = [];
    $scope.checkes = [];
    $scope.noMoreItemsAvailable = false;
    var num = 1,
        max = 0;
    $scope.loadMore = function() {
        $http.get($scope.server + '/usuarios/service/asignacion/piscinero/' + id + '/?page=' + num)
            .then(function doneCallbacks(response) {
                var data = response.data.object_list;
                data.forEach(function(data) {
                    if(data.asignado==1){
                     data.check = true;
                   }else {
                     data.check = false;
                   }
                    $scope.piscinas.push(data);
                });
                max = response.data.count;
                if ($scope.piscinas.length === max) {
                    $scope.noMoreItemsAvailable = true;
                }
                num++;
                $scope.$broadcast('scroll.infiniteScrollComplete');
            }, function failCallbacks(response) {
                if (response.status == 403) {
                    $cordovaToast
                        .show(response.data.error, 'short', 'center')
                        .then(function(success) {
                            $location.path('/app/login');
                        }, function(error) {
                            console.log(error);
                        });
                }else if (response.status === 0) {
                    $ionicPopup.alert({
                        title: "Error",
                        content: "No se puede acceder a este servicio en este momento.",
                    });
                } else {
                  $scope.loadMore();
                }
            });
    };

    $scope.reload = function() {
        num = 1;
        max = 0;
        $scope.noMoreItemsAvailable = false;
        $scope.piscinas = [];
        $scope.$broadcast('scroll.refreshComplete');
    };

    $scope.asignar = function(piscinaID, check) {
        var data = {};
        data.piscina = piscinaID;
        data.piscinero = id;
        if (check) {
          data.asigna = 'True';
        }else{
          data.asigna = '';
        }
        console.log("Check");
        console.log(check);
        $scope.loading = $ionicLoading.show({
            template: '<ion-spinner class="spinner-light"></ion-spinner><br/>Guardando cambios...',
            noBackdrop: true
        });
        $http({
            method: 'POST',
            url: $scope.server + '/usuarios/service/asignacion/form/piscinero/',
            data: $.param(data),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
        }).then(function doneCallbacks(response) {
            $scope.loading.hide();
            $cordovaToast.show("Guardado exitoso!", 'short', 'center');
        }, function failCallbacks(response) {
            if (check) {
              $scope.checkes.check[index] = true;
            }
            $scope.checkes.check[index] = false;
            $scope.loading.hide();
            if (response.status === 403) {
                $cordovaToast
                .show(response.data.error, 'short', 'center')
                .then(function(success) {
                    $location.path('/app/login');
                }, function(error) {
                    console.log(error);
                });
            }
            if (response.status == 400) {
                var data = response.data;
                if (data.piscinero) {
                    $cordovaToast.show("Piscinero: " + data.piscinero, 'short', 'center');
                }
                if (data.piscina) {
                    $cordovaToast.show("Piscina: " + data.piscina, 'short', 'center');
                }
                if (data.asigna) {
                    $cordovaToast.show("Asigna: " + data.asigna, 'short', 'center');
                }
                if (data.__all__) {
                    $cordovaToast.show(data.__all__, 'short', 'center');
                }
            }
        });
    };
})
.controller('Ruta', function($scope, $http, $stateParams, $cordovaToast, $ionicPopup, $timeout){
  $scope.piscinero = $stateParams.piscineroId;
  $scope.noMoreItemsAvailable = false;
  $scope.items = [];
  var num = 1,
      max = 0;

  $scope.loadMore = function() {
    $http.get($scope.server + '/usuarios/service/list/asignaciones/?piscinero='+ $scope.piscinero +'&page='+ num + '&asigna=true')
    .then(function doneCallbacks(response){
      var data = response.data.object_list;
      data.forEach(function(data) {
          $scope.items.push(data);
      });
      max = response.data.count;
      if ($scope.items.length === max) {
          $scope.noMoreItemsAvailable = true;
      }
      num++;
      $scope.$broadcast('scroll.infiniteScrollComplete');
    },function failCallbacks(response){
      if (response.status == 403) {
          $cordovaToast
              .show(response.data.error, 'short', 'center')
              .then(function(success) {
                  $location.path('/app/login');
              }, function(error) {
                  console.log(error);
              });
      }else if (response.status === 0) {
          $ionicPopup.alert({
              title: "Error",
              content: "No se puede acceder a este servicio en este momento.",
          });
      } else {
        $timeout(function () {
          $scope.loadMore();
        }, 30000);

      }
    });
  };

  $scope.moveItem = function(item, fromIndex, toIndex) {
    console.log(item);
    console.log(fromIndex);
    console.log(toIndex);
    $scope.items.splice(fromIndex, 1);
    $scope.items.splice(toIndex, 0, item);
  };

})
.controller('MapaRuta', function($scope, $http, $stateParams,  $cordovaToast, $ionicPopup,  $ionicLoading){
  $scope.mapCreated = function(map) {
    $scope.map = map;
  };
});
