angular.module('starter.controllers', [])

.controller('AppCtrl', function($http, $scope, $timeout, $ionicLoading, $cordovaDialogs, $state, $rootScope) {
    console.log($rootScope.server);
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
    $scope.server = "http://192.168.0.108:8000";
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

.controller('Login', function($scope, $http, $ionicHistory, $cordovaToast, $state, $ionicSideMenuDelegate) {
        $ionicSideMenuDelegate.canDragContent(false);
        $scope.loginData = {};
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
                if ($ionicHistory.backView() === null) {
                    $state.go('app.clientelists');
                } else {
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
                    if (clientes.length === 0) {
                        $cordovaDialogs.alert('No se han encontrado resultados.', 'Información');
                    }
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
                        $timeout(function() {
                            $cordovaToast
                                .show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center');
                            $scope.loadMore();
                        }, 10000);
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
                    if (barcodeData.text !== "") {
                        $cordovaToast
                            .show('Operación exitosa', 'short', 'center')
                            .then(function(success) {
                                $location.path('/app/info/' + barcodeData.text);
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
    $scope.single = function() {
        $http.get($scope.server + '/usuarios/single/cliente/' + id + '/')
            .then(function successCallback(response) {
                $scope.info = response.data;
                if ($scope.info.length === 0) {
                    $cordovaDialogs.alert('No se han encontrado resultados.', 'Información');
                }
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
                } else if (response.status === 400) {
                    $cordovaDialogs.alert('No se exise un cliente con ese codigo.', 'Error', 'Regresar')
                        .then(function(res) {
                            $ionicHistory.goBack(-1);
                        });
                } else if (response.status === 0) {
                    $cordovaDialogs.alert('No se puede acceder a este servicio en este momento.', 'Error', 'Ok');
                } else {
                    $timeout(function() {
                        $cordovaToast
                            .show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center');
                        $scope.single();
                    }, 10000);
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
        animation: 'slide-in-up'
    }).then(function(modal) {
        scope.modal = modal;
    });

    scope.closeGaleria = function() {
        scope.modal.hide();
    };

    scope.$on('$destroy', function() {
       scope.modal.remove();
     });

    return {
        openGaleria: function(imagenes) {
            console.log("entro a modal");
            scope.imagenes = imagenes;
            scope.modal.show();
        }
    };
})

.controller('Reporte', function($http, $scope, $stateParams, $cordovaDialogs, $cordovaToast, Galeria, $cordovaImagePicker, $location, $timeout, $ionicHistory, $cordovaCamera, $ionicLoading) {
        $scope.data = {};
        $scope.data.imagenes = [];
        $scope.total = 0;
        $scope.ready1 = false;
        $scope.ready2 = false;
        $scope.piscinas = [];
        $scope.tipos = [];
        $scope.info = [];
        var id = $stateParams.clienteId;
        //Angular Document Ready
        $scope.back = function() {
            $ionicHistory.goBack(-1);
        };

        $scope.piscinas = function() {
            $http.get($scope.server + '/usuarios/service/list/piscina/?casa__cliente=' + id)
                .then(function successCallback(response) {
                    $scope.piscinas = response.data.object_list;
                    if (response.data.num_rows === 0) {
                        $cordovaDialogs.alert('Reporte no disponible, Este Usuario no tiene piscinas asociadas.', 'Información').
                        then(function() {
                            $ionicHistory.goBack(-1);
                        });
                    }
                    $scope.ready1 = true;
                }, function errorCallback(response) {
                    if (response.status === 403) {
                        $cordovaToast
                            .show(response.data.error, 'short', 'center')
                            .then(function(success) {
                                $location.path('/app/login');
                            }, function(error) {
                                console.log(error);
                            });
                    } else if (response.status === 400) {
                        $cordovaDialogs.alert('No se exise un cliente con ese codigo.', 'Error', 'Regresar')
                            .then(function(res) {
                                $ionicHistory.goBack(-1);
                            });
                    } else if (response.status === 0) {
                        $cordovaDialogs.alert('No se puede acceder a este servicio en este momento.', 'Error', 'Ok');
                    } else {
                        $timeout(function() {
                            $cordovaToast
                                .show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center');
                            $scope.piscinas();
                        }, 10000);
                    }
                });
        };

        $scope.tiposReporte = function() {
            $http.get($scope.server + '/reportes/tiporeporte/list/')
                .then(function successCallback(response) {
                    $scope.tipos = response.data.object_list;
                    if (response.data.num_rows === 0) {
                        $cordovaDialogs.alert('Reporte no disponible, No hay tipos de reportes registrados.', 'Información').
                        then(function() {
                            $ionicHistory.goBack(-1);
                        });
                    }

                    $scope.ready2 = true;
                }, function errorCallback(response) {
                    if (response.status === 403) {
                        $cordovaToast
                            .show(response.data.error, 'short', 'center')
                            .then(function(success) {
                                $location.path('/app/login');
                            }, function(error) {
                                console.log(error);
                            });
                    } else if (response.status === 0) {
                        $cordovaDialogs.alert('No se puede acceder a este servicio en este momento.', 'Error', 'Ok');
                    } else {
                        $timeout(function() {
                            $cordovaToast
                                .show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center');
                            $scope.piscinas();
                        }, 10000);
                    }
                });
        };

        $scope.piscinas();
        $scope.tiposReporte();

        $scope.takePicture = function() {
            if ($scope.total < 5) {

                var options = {
                    quality: 75,
                    destinationType: Camera.DestinationType.FILE_URI,
                    sourceType: Camera.PictureSourceType.CAMERA,
                    allowEdit: true,
                    encodingType: Camera.EncodingType.JPEG,
                    targetWidth: 1280,
                    targetHeight: 720,
                    //popoverOptions: CameraPopoverOptions,
                    saveToPhotoAlbum: false,
                    correctOrientation: true
                };
                $cordovaCamera.getPicture(options).then(function(imageData) {
                    console.log(imageData);
                    $scope.data.imagenes.push(imageData);
                    $scope.total = $scope.data.imagenes.length;
                }, function(err) {
                    // error
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
                    destinationType: Camera.DestinationType.FILE_URI,
                    sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
                    allowEdit: true,
                    encodingType: Camera.EncodingType.JPEG,
                    targetWidth: 1280,
                    targetHeight: 720,
                    //popoverOptions: CameraPopoverOptions,
                    saveToPhotoAlbum: false,
                    correctOrientation: true
                };
                $cordovaCamera.getPicture(options).then(function(imageData) {
                    console.log(imageData);
                    $scope.data.imagenes.push(imageData);
                    $scope.total = $scope.data.imagenes.length;
                }, function(err) {
                    // error
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
                    results.forEach(function(data){
                        $scope.data.imagenes.push(data);
                        $scope.total = $scope.data.imagenes.length;
                    });
                }, function(error) {
                    console.log('Error: ' + JSON.stringify(error)); // In case of error
                });
        };

        var enviar = function(data) {
            $scope.loading = $ionicLoading.show({
                template: '<ion-spinner class="spinner-light"></ion-spinner><br/>Guardando...',
                noBackdrop: true
            });
            $http({
                method: 'POST',
                url: $scope.server + '/reportes/reporte/form/',
                data:  $.param(data),
                //transformRequest: formDataObject, // this sends your data to the formDataObject provider that we are defining below.
                headers: {
                    //'Content-Type': 'multipart/form-data',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    //'Content-Type': undefined
                },
            }).then(function doneCallbacks(response) {
                $scope.data = {};
                $scope.total = 0;
                $ionicLoading.hide();
                $cordovaToast.show("Guardando exitoso", 'short', 'center');
                //$scope.ready = true;
            }, function failCallbacks(response) {
                console.log(response);
                $ionicLoading.hide();
                if (response.status === 403) {
                    var error;
                    if (response.data.error) {
                        error = response.data.error;
                    }
                    error = "Ups algo salio mal.";
                    $cordovaToast
                        .show(error, 'short', 'center')
                        .then(function(success) {
                            $location.path('/app/login');
                        }, function(error) {
                            console.log(error);
                        });
                } else if (response.status == 400) {
                    var data = response.data;
                    if (data.error) {
                        $cordovaToast.show(data.error[0], 'short', 'center');
                    } else if (data.nombre) {
                        $cordovaToast.show("Nombre:" + data.nombre[0], 'short', 'center');
                    } else if (data.descripcion) {
                        $cordovaToast.show("Descripcion:" + data.descripcion[0], 'short', 'center');
                    } else if (data.cliente) {
                        $cordovaToast.show("Piscina:" + data.piscina[0], 'short', 'center');
                    } else if (data.tipo) {
                        $cordovaToast.show("Tipo:" + data.tipo[0], 'short', 'center');
                    } else if (data.reporta) {
                        $cordovaToast.show("Reporta:" + data.reporta[0], 'short', 'center');
                    }
                }
            });
        };

        $scope.datosForm = function() {
            console.log($scope.data);
            var dataSend = {};
            dataSend.nombre = $scope.data.nombre;
            dataSend.descripcion = $scope.data.descripcion;
            dataSend.tipo_de_reporte = $scope.data.tipo;
            dataSend.piscina = $scope.data.piscina;
            dataSend["fotoreporte_set-TOTAL_FORMS"] = $scope.total;
            dataSend["fotoreporte_set-INITIAL_FORMS"] = 0;
            dataSend["fotoreporte_set-MIN_NUM_FORMS"] = 0;
            dataSend["fotoreporte_set-MAX_NUM_FORMS"] = 1000;
            if ($scope.data.imagenes.length > 0) {
                $scope.data.imagenes.forEach(function(imagen, index){
                    dataSend["fotoreporte_set-" + index + "-url"] = imagen;
                });
                $cordovaDialogs.confirm('Esta seguro que quiere enviar?', 'Enviar', ['Si, Enviar!', 'Cancelar'])
                    .then(function(result) {
                        if (result === 1) {
                            enviar(dataSend); //Se formatea la informacion y se envia.
                        }
                    });
            } else {
                $cordovaDialogs.confirm('Esta seguro que quiere enviar sin fotos?', 'Fotos', ['Si, Enviar!', 'Tomar Foto'])
                    .then(function(result) {
                        if (result === 1) {
                            enviar(dataSend); //Se envia sin fotos
                        } else if (result === 2) {
                            $scope.takePicture();
                        }
                    });
            }

        };
    })
    .controller('HistorialR', function($scope, $http, $location, $ionicHistory, $cordovaToast, $timeout, $cordovaDialogs) {
        $scope.search = "";
        $scope.noMoreItemsAvailable = false;
        var num = 1,
            max = 0;
        $scope.reportes = [];
        $scope.collap = function() {
            $('.collapsible').collapsible({
                accordion: false // A setting that changes the collapsible behavior to expandable instead of the default accordion style
            });
        };
        angular.element(document).ready(function () {
            console.log("entro");
            $('.collapsible').collapsible({
                accordion: false // A setting that changes the collapsible behavior to expandable instead of the default accordion style
            });
        });
        $scope.loadMore = function() {
            $http.get($scope.server + '/reportes/reporte/list/?page=' + num)
                .then(function successCallback(response) {
                    var data = response.data.object_list;
                    if (response.data.num_rows === 0) {
                        $cordovaDialogs.alert('No hay ningún reporte registrado.', 'Información');
                    }
                    data.forEach(function(data) {
                        $scope.reportes.push(data);
                    });
                    max = response.data.count;
                    if ($scope.reportes.length === max) {
                        $scope.noMoreItemsAvailable = true;
                    }
                    num++;
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                }, function errorCallback(response) {
                    console.log(response);
                    if (response.status == 403) {
                        $cordovaToast
                            .show(response.data.error, 'short', 'center')
                            .then(function(success) {
                                $location.path('/app/login');
                            }, function(error) {
                                console.log(error);
                            });
                    } else if (response.status === 0) {
                        $cordovaDialogs.confirm('No se puede acceder a este servicio en este momento.', 'Error');
                    } else {
                        $timeout(function() {
                            $cordovaToast
                                .show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center');
                            $scope.loadMore();
                        }, 10000);
                    }
                });
        };

        $scope.reload = function() {
            $scope.reportes = [];
            num = 1;
            max = 0;
            $scope.noMoreItemsAvailable = false;
            $scope.$broadcast('scroll.refreshComplete');
        };

    })
    .controller('Mantenimiento', function($http, $scope, $stateParams, Camera, Galeria, $cordovaImagePicker, $cordovaToast, $location, $cordovaDialogs, $ionicHistory, $timeout, $ionicLoading) {
        $scope.data = {};
        $scope.data.imagenes = [];
        $scope.piscinas = [];
        $scope.total = 0;
        $scope.ready = true;
        var id = $stateParams.clienteId;

        $scope.back = function() {
            $ionicHistory.goBack(-1);
        };

        $scope.piscinas = function() {
            $http.get($scope.server + '/usuarios/service/list/piscina/?casa__cliente=' + id)
                .then(function successCallback(response) {
                    $scope.piscinas = response.data.object_list;
                    if (response.data.num_rows === 0) {
                        $cordovaDialogs.alert('Reporte no disponible, Este Usuario no tiene piscinas asociadas.', 'Información').
                        then(function() {
                            $ionicHistory.goBack(-1);
                        });
                    }
                    $scope.ready = true;
                }, function errorCallback(response) {
                    if (response.status === 403) {
                        $cordovaToast
                            .show(response.data.error, 'short', 'center')
                            .then(function(success) {
                                $location.path('/app/login');
                            }, function(error) {
                                console.log(error);
                            });
                    } else if (response.status === 400) {
                        $cordovaDialogs.alert('No se exise un cliente con ese codigo.', 'Error', 'Regresar')
                            .then(function(res) {
                                $ionicHistory.goBack(-1);
                            });
                    } else if (response.status === 0) {
                        $cordovaDialogs.alert('No se puede acceder a este servicio en este momento.', 'Error', 'Ok');
                    } else {
                        $timeout(function() {
                            $cordovaToast
                                .show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center');
                            $scope.piscinas();
                        }, 10000);
                    }
                });
        };
        $scope.piscinas();
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
                    results.forEach(function(imagen){
                        $scope.data.imagenes.push(imagen);
                        $scope.total = $scope.data.imagenes.length;
                    });
                }, function(error) {
                    console.log('Error: ' + JSON.stringify(error)); // In case of error
                });
        };

        var enviar = function(data) {
            $scope.loading = $ionicLoading.show({
                template: '<ion-spinner class="spinner-light"></ion-spinner><br/>Guardando...',
                noBackdrop: true
            });
            $http({
                method: 'POST',
                url: $scope.server + '/mantenimiento/service/mantanimiento/form/',
                data: $.param(data),
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
            }).then(function doneCallbacks(response) {
                $scope.data = {};
                $scope.total = 0;
                $ionicLoading.hide();
                $cordovaToast.show("Enviado exitoso", 'long', 'center');
            }, function failCallbacks(response) {
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
                        $cordovaToast.show("Piscina:" + data.piscina[0], 'short', 'center');
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
            dataSend.piscina = $scope.piscina;
            dataSend["fotomantenimiento_set-TOTAL_FORMS"] = $scope.total;
            dataSend["fotomantenimiento_set-INITIAL_FORMS"] = 0;
            dataSend["fotomantenimiento_set-MIN_NUM_FORMS"] = 0;
            dataSend["fotomantenimiento_set-MAX_NUM_FORMS"] = 1000;
            if ($scope.data.imagenes.length > 0) {
                $scope.data.imagenes.forEach(function(imagen, index){
                    dataSend["fotomantenimiento_set-" + index + "-url"] = imagen;
                });
                $cordovaDialogs.confirm('Esta seguro que quiere enviar?', 'Enviar', ['Si, Enviar!', 'Cancelar'])
                    .then(function(result) {
                        if (result === 1) {
                            enviar(dataSend); //Se formatea la informacion y se envia.
                        }
                    });
            } else {
                $cordovaDialogs.confirm('Esta seguro que quiere enviar sin fotos?', 'Fotos', ['Si, Enviar!', 'Tomar Foto'])
                    .then(function(result) {
                        if (result === 1) {
                            enviar(dataSend); //Se envia sin fotos
                        } else if (result === 2) {
                            $scope.takePicture();
                        }
                    });
            }

        };
    })
.controller('HistorialM', function($scope, $http, $location, $ionicHistory, $cordovaToast, $timeout, $cordovaDialogs){
    $scope.search = "";
    $scope.noMoreItemsAvailable = false;
    var num = 1,
        max = 0;
    $scope.lista = [];
    $scope.collap = function() {
        $('.collapsible').collapsible({
            accordion: false // A setting that changes the collapsible behavior to expandable instead of the default accordion style
        });
    };
    $scope.loadMore = function() {
        $http.get($scope.server + '/mantenimiento/service/mantanimiento/list/?page=' + num)
            .then(function successCallback(response) {
                var data = response.data.object_list;
                if (response.data.num_rows === 0) {
                    $cordovaDialogs.alert('No hay ningún reporte registrado.', 'Información');
                }
                data.forEach(function(data) {
                    $scope.lista.push(data);
                });
                max = response.data.count;
                console.log(max);
                console.log($scope.lista.length);
                if ($scope.lista.length === max) {
                    $scope.noMoreItemsAvailable = true;
                }
                num++;
                $scope.$broadcast('scroll.infiniteScrollComplete');
            }, function errorCallback(response) {
                console.log(response);
                if (response.status == 403) {
                    $cordovaToast
                        .show(response.data.error, 'short', 'center')
                        .then(function(success) {
                            $location.path('/app/login');
                        }, function(error) {
                            console.log(error);
                        });
                } else if (response.status === 0) {
                    $cordovaDialogs.confirm('No se puede acceder a este servicio en este momento.', 'Error');
                } else {
                    $timeout(function() {
                        $cordovaToast
                            .show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center');
                        $scope.loadMore();
                    }, 10000);
                }
            });
    };

    $scope.reload = function() {
        $scope.lista = [];
        num = 1;
        max = 0;
        $scope.noMoreItemsAvailable = false;
        $scope.$broadcast('scroll.refreshComplete');
    };
})
.controller('Reparacion', function($http, $scope, $stateParams, Camera, Galeria, $cordovaImagePicker, $location, $cordovaToast, $cordovaDialogs, $ionicHistory, $timeout, $ionicLoading) {
    $scope.data = {};
    $scope.data.imagenes = [];
    $scope.total = 0;
    $scope.ready = true;
    $scope.piscinas = [];
    var id = $stateParams.clienteId;

    $scope.back = function() {
        $ionicHistory.goBack(-1);
    };

    $scope.piscinas = function() {
        $http.get($scope.server + '/usuarios/service/list/piscina/?casa__cliente=' + id)
            .then(function successCallback(response) {
                $scope.piscinas = response.data.object_list;
                if (response.data.num_rows === 0) {
                    $cordovaDialogs.alert('Reporte no disponible, Este Usuario no tiene piscinas asociadas.', 'Información').
                    then(function() {
                        $ionicHistory.goBack(-1);
                    });
                }
                $scope.ready = true;
            }, function errorCallback(response) {
                if (response.status === 403) {
                    $cordovaToast
                        .show(response.data.error, 'short', 'center')
                        .then(function(success) {
                            $location.path('/app/login');
                        }, function(error) {
                            console.log(error);
                        });
                } else if (response.status === 400) {
                    $cordovaDialogs.alert('No se exise un cliente con ese codigo.', 'Error', 'Regresar')
                        .then(function(res) {
                            $ionicHistory.goBack(-1);
                        });
                } else if (response.status === 0) {
                    $cordovaDialogs.alert('No se puede acceder a este servicio en este momento.', 'Error', 'Ok');
                } else {
                    $timeout(function() {
                        $cordovaToast
                            .show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center');
                        $scope.piscinas();
                    }, 10000);
                }
            });
    };
    $scope.piscinas();
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
                results.forEach(function(imagen){
                    $scope.data.imagenes.push(imagen);
                    $scope.total = $scope.data.imagenes.length;
                });
            }, function(error) {
                console.log('Error: ' + JSON.stringify(error)); // In case of error
            });
    };

    var enviar = function(data) {
        $scope.loading = $ionicLoading.show({
            template: '<ion-spinner class="spinner-light"></ion-spinner><br/>Guardando...',
            noBackdrop: true
        });
        $http({
            method: 'POST',
            url: $scope.server + '/mantenimiento/service/reparacion/form/',
            data: $.param(data),
            headers: {
                'Content-Type': 'multipart/form-data'
            },
        }).then(function doneCallbacks(response) {
            $scope.data = {};
            $scope.total = 0;
            $ionicLoading.hide();
            $cordovaToast.show("Enviado exitoso", 'long', 'center');
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
            } else if (response.status == 400) {
                var data = response.data;
                if (data.error) {
                    $cordovaToast.show(data.error[0], 'short', 'center');
                } else if (data.nombre) {
                    $cordovaToast.show("Nombre:" + data.nombre[0], 'short', 'center');
                } else if (data.descripcion) {
                    $cordovaToast.show("Descripción:" + data.descripcion[0], 'short', 'center');
                } else if (data.cliente) {
                    $cordovaToast.show("Piscina:" + data.piscina[0], 'short', 'center');
                } else if (data.reporta) {
                    $cordovaToast.show("Reporta:" + data.reporta[0], 'short', 'center');
                }
            }
        });
    };

    $scope.datosForm = function() {
        var dataSend = {};
        dataSend.nombre = $scope.data.nombre;
        dataSend.descripcion = $scope.data.descripcion;
        dataSend.piscina = $scope.piscina;
        dataSend["fotoreparacion_set-TOTAL_FORMS"] = $scope.total;
        dataSend["fotoreparacion_set-INITIAL_FORMS"] = 0;
        dataSend["fotoreparacion_set-MIN_NUM_FORMS"] = 0;
        dataSend["fotoreparacion_set-MAX_NUM_FORMS"] = 1000;
        if ($scope.data.imagenes.length > 0) {
            $scope.data.imagenes.forEach(function(imagen, index){
                dataSend["fotoreparacion_set-" + index + "-url"] = imagen;
            });
            $cordovaDialogs.confirm('Esta seguro que quiere enviar?', 'Enviar', ['Si, Enviar!', 'Cancelar'])
                .then(function(result) {
                    if (result === 1) {
                        enviar(dataSend); //Se formatea la informacion y se envia.
                    }
                });
        } else {
            $cordovaDialogs.confirm('Esta seguro que quiere enviar sin fotos?', 'Fotos', ['Si, Enviar!', 'Tomar Foto'])
                .then(function(result) {
                    if (result === 1) {
                        enviar(dataSend); //Se envia sin fotos
                    } else if (result === 2) {
                        $scope.takePicture();
                    }
                });
        }

    };
})
.controller('HistorialRe', function($scope, $http, $location, $ionicHistory, $cordovaToast, $timeout, $cordovaDialogs){
    $scope.search = "";
    $scope.noMoreItemsAvailable = false;
    var num = 1,
        max = 0;
    $scope.lista = [];
    $scope.collap = function() {
        $('.collapsible').collapsible({
            accordion: false // A setting that changes the collapsible behavior to expandable instead of the default accordion style
        });
    };
    angular.element(document).ready(function () {
        console.log("entro");
        $('.collapsible').collapsible({
            accordion: false // A setting that changes the collapsible behavior to expandable instead of the default accordion style
        });
    });
    $scope.loadMore = function() {
        $http.get($scope.server + '/mantenimiento/service/reparacion/list/?page=' + num)
            .then(function successCallback(response) {
                var data = response.data.object_list;
                if (response.data.num_rows === 0) {
                    $cordovaDialogs.alert('No hay ningún reporte registrado.', 'Información');
                }
                data.forEach(function(data) {
                    $scope.lista.push(data);
                });
                max = response.data.count;
                if ($scope.lista.length === max) {
                    $scope.noMoreItemsAvailable = true;
                }
                num++;
                $scope.$broadcast('scroll.infiniteScrollComplete');
            }, function errorCallback(response) {
                console.log(response);
                if (response.status == 403) {
                    $cordovaToast
                        .show(response.data.error, 'short', 'center')
                        .then(function(success) {
                            $location.path('/app/login');
                        }, function(error) {
                            console.log(error);
                        });
                } else if (response.status === 0) {
                    $cordovaDialogs.confirm('No se puede acceder a este servicio en este momento.', 'Error');
                } else {
                    $timeout(function() {
                        $cordovaToast
                            .show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center');
                        $scope.loadMore();
                    }, 10000);
                }
            });
    };

    $scope.reload = function() {
        $scope.lista = [];
        num = 1;
        max = 0;
        $scope.noMoreItemsAvailable = false;
        $scope.$broadcast('scroll.refreshComplete');
    };
})
.controller('MapCtrl', function($scope, $ionicLoading, $stateParams, $cordovaGeolocation, $cordovaDialogs, $timeout, $http, $cordovaToast, $location) {
    var latitud = $stateParams.latitud,
        longitud = $stateParams.longitud,
        id = $stateParams.casaId,
        marker = null;
    $scope.Ready = true;

    $scope.validateGps = function() {
        if (window.cordova) {
            cordova.plugins.diagnostic.isLocationEnabled(function(enabled) {
                if (!enabled) {
                    $cordovaDialogs.confirm('Su gps esta desactivado.', 'Gps', ['Activar', 'Cancelar'])
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
            $cordovaDialogs.alert('No hay ningún gps asignado.', 'Gps')
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
                } else if (response.status == 400) {
                    var data = response.data;
                    if (data.error) {
                        $cordovaToast.show(data.error[0], 'short', 'center');
                    } else if (data.username) {
                        $cordovaToast.show("longitud:" + data.longitud[0], 'short', 'center');
                    } else if (data.password) {
                        $cordovaToast.show("latitud:" + data.latitud[0], 'short', 'center');
                    }
                }
            });
        });
    };
})

.controller('Piscineros', function($scope, $http, $location, $ionicHistory, $cordovaToast, $timeout, $cordovaDialogs) {
    $scope.search = "";
    $scope.noMoreItemsAvailable = false;
    var num = 1,
        max = 0;
    $scope.piscineros = [];
    $scope.collap = function() {
        $('.collapsible').collapsible({
            accordion: false // A setting that changes the collapsible behavior to expandable instead of the default accordion style
        });
    };
    $scope.loadMore = function() {
        $http.get($scope.server + '/usuarios/service/list/piscinero/?page=' + num)
            .then(function successCallback(response) {
                var data = response.data.object_list;
                if (response.data.num_rows === 0) {
                    $cordovaDialogs.alert('No hay ningún piscinero registrado.', 'Información');
                }
                data.forEach(function(data) {
                    $scope.piscineros.push(data);
                });
                max = response.data.count;
                if ($scope.piscineros.length === max) {
                    $scope.noMoreItemsAvailable = true;
                }
                num++;
                $scope.$broadcast('scroll.infiniteScrollComplete');
            }, function errorCallback(response) {
                if (response.status == 403) {
                    $cordovaToast
                        .show(response.data.error, 'short', 'center')
                        .then(function(success) {
                            $location.path('/app/login');
                        }, function(error) {
                            console.log(error);
                        });
                } else if (response.status === 0) {
                    $cordovaDialogs.confirm('No se puede acceder a este servicio en este momento.', 'Error');
                } else {
                    $timeout(function() {
                        $cordovaToast
                            .show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center');
                        $scope.loadMore();
                    }, 10000);
                }
            });
            console.log($scope.collap());
            $scope.collap();
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
                    if (response.data.num_rows === 0) {
                        $cordovaDialogs.alert('No hay ninguna asignación.', 'Información');
                    }
                    data.forEach(function(data) {
                        if (data.asignacion) {
                            data.check = true;
                        } else {
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
                    } else if (response.status === 0) {
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
            } else {
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
                } else {
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
    .controller('Ruta', function($scope, $http, $stateParams, $cordovaToast, $cordovaDialogs, $timeout, $ionicLoading) {
        $scope.piscinero = $stateParams.piscineroId;
        $scope.noMoreItemsAvailable = false;
        $scope.items = [];
        var num = 1,
            max = 0;

        $scope.loadMore = function() {
            $http.get($scope.server + '/usuarios/service/list/asignaciones/?piscinero=' + $scope.piscinero + '&page=' + num + '&asigna=true')
                .then(function doneCallbacks(response) {
                    if (response.data.num_rows === 0) {
                        $cordovaDialogs.alert('Este piscinero no tiene ninguna ruta asignada.', 'Información');
                    }
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
                }, function failCallbacks(response) {
                    if (response.status == 403) {
                        $cordovaToast
                            .show(response.data.error, 'short', 'center')
                            .then(function(success) {
                                $location.path('/app/login');
                            }, function(error) {
                                console.log(error);
                            });
                    } else if (response.status === 0) {
                        $cordovaDialogs.alert('No se puede acceder a este servicio en este momento.', 'Error');
                    } else {
                        $timeout(function() {
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
            if (move > 0) {
                data.orden = $scope.items[toIndex - 1].orden;
            } else {
                data.orden = $scope.items[toIndex + 1].orden;
            }
            if (toIndex !== fromIndex) {
                $scope.loading = $ionicLoading.show({
                    template: '<ion-spinner class="spinner-light"></ion-spinner><br/>Guardando ruta...',
                    noBackdrop: true
                });
                $http({
                    method: 'PUT',
                    url: $scope.server + '/usuarios/service/asignacion/form/piscinero/' + item.pk + '/',
                    data: data,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }).then(function doneCallbacks(response) {
                    $ionicLoading.hide();
                    $cordovaToast.show("Guardado exitoso!", 'short', 'center');
                }, function errorCallback(response) {
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

        $scope.reload = function() {
            num = 1;
            max = 0;
            $scope.noMoreItemsAvailable = false;
            $scope.items = [];
            $scope.$broadcast('scroll.refreshComplete');
        };

    })

.controller('MapaRuta', function($scope, $http, $stateParams, $cordovaToast, $cordovaDialogs, $ionicLoading, $timeout) {
    $scope.cargado = false;
    var gpsnull = true,
        casanull = null,
        marker = null;
    $scope.items = [];
    $scope.mapCreated = function(map) {
        var directionsService = new google.maps.DirectionsService();
        var directionsDisplay = new google.maps.DirectionsRenderer();
        $scope.map = map;
        directionsDisplay.setMap(map);
        $scope.calculate(directionsService, directionsDisplay);
    };

    $scope.calculate = function calculateAndDisplayRoute(directionsService, directionsDisplay) {
        var waypts = [];
        $http.get($scope.server + '/usuarios/service/list/asignaciones/?piscinero=' + $stateParams.piscineroId + '&asigna=true')
            .then(function doneCallbacks(response) {
                    if (response.data.num_rows === 0) {
                        $cordovaDialogs.alert('No hay ninguna ruta que mostrar.', 'Información');
                    }
                    var data = response.data.object_list;
                    $scope.items = data;
                    $scope.cargado = true;
                    if (data.length === 0) {
                        $cordovaDialogs.alert('No tiene ningúna ruta asignada.', 'Ruta');
                    }else if(data.length === 1){

                        $scope.map.setCenter(new google.maps.LatLng(data[0].latitud, data[0].longitud));
                        var myLatLng = {
                            lat: parseFloat(data[0].latitud),
                            lng: parseFloat(data[0].longitud)
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
                    }else if (data.length > 1) {
                        data.forEach(function(data, index){
                            if (data.latitud !== null && data.longitud !== null) {
                                if (index > 0 && index < data.length - 1) {
                                    waypts.push({
                                        location: {
                                            lat: parseFloat(data.latitud),
                                            lng: parseFloat(data.longitud)
                                        },
                                        stopover: true
                                    });
                                }
                            }else {
                                gpsnull = false;
                                casanull = data;
                            }
                        });
                        if (gpsnull) {
                            directionsService.route({
                                origin: {
                                    lat: parseFloat(data[0].latitud),
                                    lng: parseFloat(data[0].longitud)
                                },
                                destination: {
                                    lat: parseFloat(data[data.length - 1].latitud),
                                    lng: parseFloat(data[data.length - 1].longitud)
                                },
                                waypoints: waypts,
                                optimizeWaypoints: true,
                                travelMode: google.maps.TravelMode.DRIVING
                            }, function(response, status) {
                                if (status === google.maps.DirectionsStatus.OK) {
                                    directionsDisplay.setDirections(response);
                                    //var route = response.routes[0];
                                } else {
                                    $cordovaDialogs.alert('Directions request failed due to ' + status);
                                }
                            });
                        }else{
                            $cordovaDialogs.alert('No se puede mostrar la ruta porque la piscina: ' + casanull.nombreP + ' en la casa con dirección ' + casanull.nombreCA + ' del cliente ' + casanull.nombreCF +' '+ casanull.nombreCL + ' no tiene asignado el gps. ');
                        }

                    }
                },
                function errorCallback(response) {
                    if (response.status == 403) {
                        $cordovaToast
                            .show(response.data.error, 'short', 'center')
                            .then(function(success) {
                                $location.path('/app/login');
                            }, function(error) {
                                console.log(error);
                            });
                    } else if (response.status === 0) {
                        $cordovaDialogs.alert('No se puede acceder a este servicio en este momento.', 'Error');
                    }
                });
    };
});
