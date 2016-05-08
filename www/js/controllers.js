angular.module('starter.controllers', [])

.controller('AppCtrl', function($http, $scope, $ionicModal, $timeout, $ionicLoading, $ionicPopup, $location) {

    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //$scope.$on('$ionicView.enter', function(e) {
    //});
    // Form data for the login modal
    $scope.loginData = {};
    $scope.server = "http://104.236.33.228:8040";
    //$scope.server = "http://192.168.1.51:8000";
    // Create the login modal that we will use later
    $ionicModal.fromTemplateUrl('templates/login.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.modal = modal;
    });

    // Triggered in the login modal to close it
    $scope.closeLogin = function() {
        $scope.modal.hide();
    };

    // Open the login modal
    $scope.login = function() {
        $scope.modal.show();
    };

    $scope.logout = function() {
        $http.get($scope.server + "/logout/").success(function() {
            $location.path('/app/login/0');
        }).error(function(data) {
            /* Act on the event */
            console.log(data);
        });
    };

    $scope.doLogin = function() {
        $http({
            method: 'POST',
            url: $scope.server + '/login/piscinero/',
            data: $.param($scope.loginData),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
        }).then(function doneCallbacks(response) {
            $timeout(function() {
                $scope.closeLogin();
                $scope.logeado = true;
            }, 500);

        }, function failCallbacks(response) {
            if (response.status == 400) {
                var data = response.data;
                if (data.error) {
                    $scope.showAlert("Error", data.error[0]);
                }
                if (data.username) {
                    $scope.showAlert("Usuario", data.username[0]);
                }
                if (data.password) {
                    $scope.showAlert("Contraseña", data.password[0]);
                }
            }
        });
    };
    $scope.showAlert = function(titulo, body) {
        var alertPopup = $ionicPopup.alert({
            title: titulo,
            template: body,
        });
    };

    $scope.validLogin = function() {
        if (!$scope.loginData.username) {
            $scope.showAlert('Usuario', 'Campo requerido');
        }
        if (!$scope.loginData.password) {
            $scope.showAlert('Contraseña', 'Campo requerido');
        } else {
            return true;
        }
    };
    // Perform the login action when the user submits the login form

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

.controller('Login', function($scope, $http, $location, $stateParams, $ionicHistory, $cordovaToast) {
        $ionicHistory.nextViewOptions({
            //  disableAnimate: true,
            disableBack: true
        });
        var next = function(id) {
            if (id === '0') {
                $location.path('/app/clientelists');
            } else {
                $location.path('/app/info/' + id);
            }
        };

        $scope.loginReady = true;
        $scope.doLogin = function() {
            $scope.loginReady = false;
            $http({
                method: 'POST',
                url: $scope.server + '/login/piscinero/',
                data: $.param($scope.loginData),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
            }).then(function doneCallbacks(response) {
                $scope.loginData = {};
                $scope.loginReady = true;
                next($stateParams.next);

            }, function failCallbacks(response) {
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
    .controller('Clientelists', function($http, $scope, $timeout, $ionicPopup, $location, $cordovaToast, $ionicHistory) {
        $scope.search = "";
        $scope.clientelists = [];
        $scope.noMoreItemsAvailable = false;
        var num = 1,
            max = 0;
        $scope.loadMore = function() {
            $http.get($scope.server + '/list/cliente/?page=' + num)
                .then(function successCallback(response) {
                    clientes = response.data.object_list;
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
                                $location.path('/app/login/0');
                            }, function(error) {
                                console.log(error);
                            });
                    }
                    if (response.status === 0) {
                        $ionicPopup.alert({
                            title: "Error",
                            content: "No se puede acceder a este servicio en este momento.",
                        });
                    }
                });
        };
        $scope.reload = function() {
            num = 1;
            max = 0;
            $scope.noMoreItemsAvailable = false;
            $scope.clientelists = [];
        };
    })

//Controlador de informacion de cliente
.controller('InfoC', function($http, $scope, $stateParams, $ionicPopup, $location, $timeout, $cordovaToast) {
    var id = $stateParams.clienteId;
    $scope.dataReady = false;
    $timeout(function() {
        $http.get($scope.server + '/single/cliente/' + id + '/')
            .then(function successCallback(response) {
                $scope.info = response.data;
                $scope.dataReady = true;
            }, function errorCallback(response) {
                if (response.status === 403) {
                    $cordovaToast
                        .show(response.data.error, 'short', 'center')
                        .then(function(success) {
                            $location.path('/app/login/' + id);
                        }, function(error) {
                            console.log(error);
                        });
                }
                if (response.status === 0) {
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

.controller('Reporte', function($http, $scope, $stateParams, $ionicPopup, Camera, $cordovaToast, Galeria, $cordovaImagePicker) {
    $scope.data = {};
    $scope.data.imagenes = [];
    $scope.total = 0;
    $scope.ready = true;
    $http.get($scope.server + '/list/tiporepor/')
        .then(function doneCallbacks(response) {
            $scope.tipolist = response.data.object_list;
        }, function failCallbacks(response) {
            if (response.status === 0) {
                $ionicPopup.alert({
                    title: "Error",
                    content: "No se puede acceder a este servicio en este momento.",
                });
            } else {
                var data = response.data;
                $scope.showAlert("Error", data.error[0]);
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
            if (response.status == 400) {
                var data = response.data;
                if (data.error) {
                    $cordovaToast.show(data.error[0], 'short', 'center');
                }
                if (data.nombre) {
                    $cordovaToast.show("Usuario:" + data.nombre[0], 'short', 'center');
                }
                if (data.descripcion) {
                    $cordovaToast.show("Contraseña:" + data.descripcion[0], 'short', 'center');
                }
                if (data.cliente) {
                    $cordovaToast.show("Contraseña:" + data.cliente[0], 'short', 'center');
                }
                if (data.tipo) {
                    $cordovaToast.show("Contraseña:" + data.tipo[0], 'short', 'center');
                }
                if (data.reporta) {
                    $cordovaToast.show("Contraseña:" + data.reporta[0], 'short', 'center');
                }
            } else {
                $cordovaToast.show("Ups algo anda mal!", 'short', 'center');
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

.controller('Mantenimiento', function($http, $scope, $stateParams, Camera, Galeria, $cordovaImagePicker) {
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
            if (response.status == 400) {
                var data = response.data;
                if (data.error) {
                    $cordovaToast.show(data.error[0], 'short', 'center');
                }
                if (data.nombre) {
                    $cordovaToast.show("Usuario:" + data.nombre[0], 'short', 'center');
                }
                if (data.descripcion) {
                    $cordovaToast.show("Contraseña:" + data.descripcion[0], 'short', 'center');
                }
                if (data.cliente) {
                    $cordovaToast.show("Contraseña:" + data.cliente[0], 'short', 'center');
                }
                if (data.tipo) {
                    $cordovaToast.show("Contraseña:" + data.tipo[0], 'short', 'center');
                }
                if (data.reporta) {
                    $cordovaToast.show("Contraseña:" + data.reporta[0], 'short', 'center');
                }
            } else {
                $cordovaToast.show("Ups algo anda mal!", 'short', 'center');
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

.controller('Reparacion', function($http, $scope, $stateParams, Camera, Galeria, $cordovaImagePicker) {
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
            if (response.status == 400) {
                var data = response.data;
                if (data.error) {
                    $cordovaToast.show(data.error[0], 'short', 'center');
                }
                if (data.nombre) {
                    $cordovaToast.show("Usuario:" + data.nombre[0], 'short', 'center');
                }
                if (data.descripcion) {
                    $cordovaToast.show("Contraseña:" + data.descripcion[0], 'short', 'center');
                }
                if (data.cliente) {
                    $cordovaToast.show("Contraseña:" + data.cliente[0], 'short', 'center');
                }
                if (data.tipo) {
                    $cordovaToast.show("Contraseña:" + data.tipo[0], 'short', 'center');
                }
                if (data.reporta) {
                    $cordovaToast.show("Contraseña:" + data.reporta[0], 'short', 'center');
                }
            } else {
                $cordovaToast.show("Ups algo anda mal!", 'short', 'center');
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

.controller('Historial', function($scope) {

  $scope.noMoreItemsAvailable = false;

    $scope.loadMore = function() {
      $scope.items.push({ id: $scope.items.length});

      if ( $scope.items.length == 99 ) {
        $scope.noMoreItemsAvailable = true;
      }
      $scope.$broadcast('scroll.infiniteScrollComplete');
    };

    $scope.items = [];

   $scope.reload = function(){
     $scope.noMoreItemsAvailable = false;
     $scope.items = [];
   };
})

.controller('MapCtrl', function($scope, $ionicLoading, $stateParams, $cordovaGeolocation) {
  var marker = null;

  $scope.mapCreated = function(map) {
    $scope.map = map;
  };

  $scope.centerOnMe = function () {
    if (!$scope.map) {
      return;
    }

    $scope.loading = $ionicLoading.show({
      template: '<ion-spinner class="spinner-light"></ion-spinner><br/>Obteniendo la ubicación actual...',
      noBackdrop: false
    });
    var posOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    };
    $cordovaGeolocation.getCurrentPosition(posOptions).then(function (pos) {
      console.log('Got pos', pos);
      $scope.map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
      var myLatLng = {lat: pos.coords.latitude, lng: pos.coords.longitude};
      if(marker !== null){
        marker.setMap(null);
      }
      marker = new google.maps.Marker({
        map: $scope.map,
        position: myLatLng,
        animation: google.maps.Animation.DROP,
        title: 'Estas aquí!'
      });

        var infowindow = new google.maps.InfoWindow({
        content: "Ested esta aquí"
      });

      marker.addListener('click', function() {
        infowindow.open($scope.map, marker);
      });
      $scope.loading.hide();
    }, function (error) {
      $scope.loading.hide();
      alert('No se puede obtener la ubicación: ' + error.message);
    });
  };
});
