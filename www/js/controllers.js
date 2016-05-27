angular.module('starter.controllers', [])

.controller('AppCtrl', function($http, $scope, $timeout, $ionicLoading, $cordovaDialogs, $state) {

    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //$scope.$on('$ionicView.enter', function(e) {
    //});
    // Form data for the login modal
    $scope.loginData = {};
    //$scope.server = "http://104.236.33.228:8040";
    $scope.server = "http://192.168.1.51:8000";
    //$scope.server = "http://192.168.0.106:8000";
    // Create the login modal that we will use later
    $scope.logout = function() {
        $http.get($scope.server + "/usuarios/logout/").success(function() {
            $state.go('app.login');
        }).error(function(data) {
            /* Act on the event */
            console.log(data);
        });
    };

    $scope.showAlert = function(titulo, body) {
        $cordovaDialogs.alert(body, titulo);
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

.controller('Login', function($scope, $http, $ionicHistory, $cordovaToast, $state) {
        console.log($ionicHistory.backView());
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
                $scope.loginData = {};
                $scope.loginReady = true;
                if ($ionicHistory.backView()===null) {
                  $state.go('app.clientelists');
                }else {
                  $ionicHistory.goBack(-1);
                }
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
    .controller('Clientelists', function($http, $scope, $timeout, $cordovaDialogs, $state, $cordovaToast, $ionicHistory, $cordovaBarcodeScanner) {
        $ionicHistory.nextViewOptions({
            //  disableAnimate: true,
          //  disableBack: true
        });
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
                          $state.go('app.login');
                      }, function(error) {
                          $state.go('app.login');
                      });

                    } else if (response.status === 0) {
                        $cordovaDialogs.alert('No se puede acceder a este servicio en este momento.', 'Error');
                    } else {
                      $timeout(function(){
                        $cordovaToast
                        .show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center');
                        $scope.loadMore();
                      },10000);
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

        $scope.scanearCodigo = function() {
          $cordovaBarcodeScanner
           .scan()
           .then(function(barcodeData) {
             // Success! Barcode data is here
              if(barcodeData.text !== ""){
                $cordovaToast
                .show('Operación exitosa', 'short', 'center')
                .then(function(success) {
                    $location.path('/app/info/'+ barcodeData.text);
                }, function(error) {
                    console.log(error);
                });
              }
           }, function(error) {
             // An error occurred
              alert("Ah ocurrido un error" + error);
           });
        };
    })

//Controlador de informacion de cliente
.controller('InfoC', function($http, $scope, $stateParams, $location, $timeout, $cordovaToast, $ionicHistory, $cordovaDialogs) {
var id = $stateParams.clienteId;
$scope.dataReady = false;
$('.tooltipped').tooltip({
    delay: 50
});
$scope.single = function () {
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
          }else if (response.status === 400) {
              $cordovaDialogs.alert('No se exise un cliente con ese codigo.', 'Error', 'Regresar')
              .then(function(res){
                  $ionicHistory.goBack(-1);
              });
          }else if (response.status === 0) {
              $cordovaDialogs.alert('No se puede acceder a este servicio en este momento.', 'Error', 'Ok');
          }else{
            $timeout(function(){
              $cordovaToast
              .show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center');
              $scope.single();
            },10000);
          }
      });
    };
    $scope.single();
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

.controller('Reporte', function($http, $scope, $stateParams, $cordovaDialogs, Camera, $cordovaToast, Galeria, $cordovaImagePicker, $location) {
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
            if (response.status === 0) {
                $cordovaDialogs.alert('No se puede acceder a este servicio en este momento.', 'Error');
            }
            if (response.status === 404) {
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
          $cordovaDialogs.confirm('Esta seguro que quiere enviar sin fotos?', 'Fotos', ['Si, Enviar!','Tomar Foto'])
          .then(function(result) {
              if (result === 1) {
                  enviar(dataSend); //Se envia sin fotos
              }else if(result === 2){
                  $scope.takePicture();
              }
          });
        }

    };
})

.controller('Mantenimiento', function($http, $scope, $stateParams, Camera, Galeria, $cordovaImagePicker, $cordovaToast, $location, $cordovaDialogs) {
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
          $cordovaDialogs.confirm('Esta seguro que quiere enviar sin fotos?', 'Fotos', ['Si, Enviar!','Tomar Foto'])
          .then(function(result) {
              if (result === 1) {
                  enviar(dataSend); //Se envia sin fotos
              }else if(result === 2){
                  $scope.takePicture();
              }
          });
        }

    };
})

.controller('Reparacion', function($http, $scope, $stateParams, Camera, Galeria, $cordovaImagePicker, $location, $cordovaToast, $cordovaDialogs) {
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
          $cordovaDialogs.confirm('Esta seguro que quiere enviar sin fotos?', 'Fotos', ['Si, Enviar!','Tomar Foto'])
          .then(function(result) {
              if (result === 1) {
                  enviar(dataSend); //Se envia sin fotos
              }else if(result === 2){
                  $scope.takePicture();
              }
          });
        }

    };
})

.controller('MapCtrl', function($scope, $ionicLoading, $stateParams, $cordovaGeolocation, $cordovaDialogs, $timeout, $http, $cordovaToast, $location) {
    var latitud = $stateParams.latitud,
        longitud = $stateParams.longitud,
        id = $stateParams.casaId,
        marker = null;
    $scope.Ready = true;

    $scope.validateGps = function (){
        if (window.cordova) {
          cordova.plugins.diagnostic.isLocationEnabled(function(enabled) {
              if(!enabled){
                $cordovaDialogs.confirm('Su gps esta desactivado.', 'Gps', ['Activar','Cancelar'])
                .then(function(result) {
                    if (result === 1) {
                      cordova.plugins.diagnostic.switchToLocationSettings();
                    }
                });
              }
          }, function(error) {
              alert("The following error occurred: " + error);
          });
        }
    };


    function validar(metodo) {
        if (longitud === "" && latitud === "") {
            $cordovaDialogs.alert('No hay ningun gps asignado, precionar la opción <i class="icon ion-location icon"></i> para asignar GPS.', 'Gps')
            .then(function(res) {
              $scope.validateGps();
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
        $scope.validateGps();
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
            $ionicLoading.hide();
        }, function(error) {
            $ionicLoading.hide();
            alert('No se puede obtener la ubicación, posiblemente el gps este desactivado: ' + error.message);
            $scope.validateGps();
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
                $ionicLoading.hide();
                $cordovaToast.show("Guardado exitoso!", 'short', 'center');
            }, function failCallbacks(response) {
                $ionicLoading.hide();
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
                    $cordovaToast
                        .show(response.data.error, 'short', 'center')
                        .then(function(success) {
                            $location.path('/app/login');
                        }, function(error) {
                            console.log(error);
                        });
                }else if (response.status === 0) {
                    $cordovaDialogs.confirm('No se puede acceder a este servicio en este momento.', 'Error');
                }else {
                  $timeout(function(){
                    $cordovaToast
                    .show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center');
                      $scope.loadMore();
                  }, 10000);
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

.controller('PiscinaAsignacion', function($scope, $stateParams, $http, $cordovaToast, $ionicLoading, $location, $cordovaDialogs, $timeout) {
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
                    if(data.asignacion){
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
                    $cordovaDialogs.alert("No se puede acceder a este servicio en este momento.", "Error");
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

    $scope.asignar = function(piscinaID, obj) {
        var data = {};
        data.piscina = piscinaID;
        data.piscinero = id;
        if (obj.check) {
          data.asigna = 'True';
        }else{
          data.asigna = '';
        }
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
            $ionicLoading.hide();
            $cordovaToast.show("Guardado exitoso!", 'short', 'botton');
        }, function failCallbacks(response) {
            if (obj.check) {
              obj.check = false;
            }else{
              obj.check = true;
            }
            $ionicLoading.hide();
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
                    $cordovaToast.show("Piscinero: " + data.piscinero, 'short', 'botton');
                }
                if (data.piscina) {
                    $cordovaToast.show("Piscina: " + data.piscina, 'short', 'botton');
                }
                if (data.asigna) {
                    $cordovaToast.show("Asigna: " + data.asigna, 'short', 'botton');
                }
                if (data.__all__) {
                    $cordovaToast.show(data.__all__, 'short', 'botton');
                }
            }
        });
    };
})
.controller('Ruta', function($scope, $http, $stateParams, $cordovaToast, $cordovaDialogs, $timeout, $ionicLoading){
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
          $cordovaDialogs('No se puede acceder a este servicio en este momento.', 'Error');
      } else {
        $timeout(function () {
          $scope.loadMore();
        }, 10000);

      }
    });
  };

  $scope.moveItem = function(item, fromIndex, toIndex) {
    var move = toIndex - fromIndex;
    $scope.items.splice(fromIndex, 1);
    $scope.items.splice(toIndex, 0, item);
    var data = {};
    if (move>0) {
      data.orden = $scope.items[toIndex-1].orden;
    }else {
      data.orden = $scope.items[toIndex+1].orden;
    }
    if (toIndex !== fromIndex) {
        $scope.loading = $ionicLoading.show({
            template: '<ion-spinner class="spinner-light"></ion-spinner><br/>Guardando ruta...',
            noBackdrop: true
        });
        $http({
          method: 'PUT',
          url: $scope.server + '/usuarios/service/asignacion/form/piscinero/' +item.pk + '/',
          data: data,
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
          }
        }).then(function doneCallbacks(response){
          $ionicLoading.hide();
          $cordovaToast.show("Guardado exitoso!", 'short', 'center');
        },function errorCallback(response){
          $ionicLoading.hide();
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
            console.log(response);
          }
      });
    }
  };

  $scope.reload = function(){
    num = 1;
    max = 0;
    $scope.noMoreItemsAvailable = false;
    $scope.items = [];
    $scope.$broadcast('scroll.refreshComplete');
  };

})

.controller('MapaRuta', function($scope, $http, $stateParams,  $cordovaToast, $cordovaDialogs,  $ionicLoading, $timeout){
  $scope.cargado = false;
  $scope.items = [];
  $scope.mapCreated = function(map) {
    var directionsService = new google.maps.DirectionsService;
    var directionsDisplay = new google.maps.DirectionsRenderer;
    $scope.map = map;
    directionsDisplay.setMap(map);
    $scope.calculate(directionsService, directionsDisplay);
  };

  $scope.calculate = function calculateAndDisplayRoute(directionsService, directionsDisplay) {
    var waypts = [];
    $http.get($scope.server + '/usuarios/service/list/asignaciones/?piscinero='+ $stateParams.piscineroId + '&asigna=true')
    .then(function doneCallbacks(response){
      var data = response.data.object_list;
      $scope.items = data;
      $scope.cargado = true;
      if (data.length===0) {
        $cordovaDialogs.alert('No tiene ninguna ruta asignada.', 'Ruta');
      }else if (data.length>1) {
        for (var i = 0; i < data.length; i++) {
          if (i>0 && i<data.length - 1) {
            waypts.push({
              location: {lat: parseFloat(data[i].latitud), lng: parseFloat(data[i].longitud)},
              stopover: true
            });
          }
        }
        directionsService.route({
          origin:  {lat: parseFloat(data[0].latitud), lng: parseFloat(data[0].longitud)},
          destination:  {lat: parseFloat(data[data.length-1].latitud), lng: parseFloat(data[data.length-1].longitud)},
          waypoints: waypts,
          optimizeWaypoints: true,
          travelMode: google.maps.TravelMode.DRIVING
        }, function(response, status) {
          if (status === google.maps.DirectionsStatus.OK) {
              directionsDisplay.setDirections(response);
            //var route = response.routes[0];
          } else {
            alert('Directions request failed due to ' + status);
          }
        });
      }
    },
    function errorCallback(response){
      if (response.status == 403) {
          $cordovaToast
              .show(response.data.error, 'short', 'center')
              .then(function(success) {
                  $location.path('/app/login');
              }, function(error) {
                  console.log(error);
              });
      }else if (response.status === 0) {
        $cordovaDialogs.alert('No se puede acceder a este servicio en este momento.', 'Error');
      }
    });
  };
});
