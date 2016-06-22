angular.module('starter.controllers', [])

.controller('AppCtrl', function($http, $scope, $state, $cordovaDialogs, $cordovaToast, $timeout, notix, $cordovaLocalNotification) {
    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //$scope.$on('$ionicView.enter', function(e) {
    //});
    // Form data for the login modal
    //$scope.server = "http://104.236.33.228:8040";
    //$scope.server = "http://192.168.1.51:8000";
    $scope.server = "http://192.168.0.113:8000";
    $scope.posicion = function(path) {
        if (path) {
            $scope.anterior = path;
        } else {
            $scope.anterior = null;
        }
    };
    // Create the login modal that we will use later
    $scope.logout = function() {
        $http.get($scope.server + "/usuarios/logout/").success(function() {
            $state.go('app.login');
        }).error(function(data) {
            /* Act on the event */
            console.log(data);
        });
    };

    $scope.isLogin = function() {
        $http.get($scope.server + "/usuarios/is/login/")
            .then(function doneCallbacks(response) {
                notix.setup(response.data.session, response.data.username, response.data.type);
            }, function failCallbacks(response) {
                if (response.status === 400) {
                    $cordovaToast
                        .show("Debe iniciar sesión", 'short', 'center')
                        .then(function(success) {
                            if ($state.current.name != 'app.login') {
                                $state.go('app.login');
                            }
                        }, function(error) {
                            console.log(error);
                        });
                } else if (response.status == 500) {
                    $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
                } else if (notix.username == null) {
                    $timeout(function() {
                        $scope.isLogin();
                    }, 5000);
                } else {
                    $timeout(function() {
                        $cordovaToast.show('Verificando sesión.', 'short', 'bottom').then(function(success) {
                            $scope.isLogin();
                        });
                    }, 5000);
                }
            });
    };

    $scope.serverOn = function() {
        $http.get($scope.server + "/usuarios/serve/on/").then(function doneCallbacks(response) {
            $scope.isLogin();
        }, function failCallbacks(response) {
            if (response.status == 500) {
                $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
            } else {
                $timeout(function() {
                    $cordovaToast.show('No se puede conectar al servidor', 'short', 'center').then(function(success) {
                        $scope.serverOn();
                    });
                    $cordovaLocalNotification.schedule({
                        id: 3,
                        title: 'Piscix',
                        text: 'No se puede conectar al servidor',
                        //icon: 'img/icon.png'
                    });
                }, 5000);
            }
        });
    };

    $scope.serverOn();
    console.log(notix);
})

.controller('Login', function($scope, $http, $ionicHistory, $cordovaToast, $state, $ionicSideMenuDelegate, $location, $cordovaDialogs) {
        $ionicSideMenuDelegate.canDragContent(false);
        $ionicHistory.nextViewOptions({
            disableBack: true
        });
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
                $scope.isLogin();
                $scope.loginData = {};
                $scope.loginReady = true;
                if ($scope.anterior === null) {
                    $state.go('app.clientelists');
                } else {
                    $location.path($scope.anterior);
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
                } else if (response.status == 500) {
                    $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
                }
            });
            // Simulate a login delay. Remove this and replace with your login
            // code if using a login system

        };
    })
    //Controlador de lista de clientes
    .controller('Clientelists', function($http, $scope, $timeout, $cordovaDialogs, $state, $cordovaToast, $cordovaBarcodeScanner, $location) {
        $scope.posicion($location.path());
        $scope.search = "";
        $scope.clientelists = [];
        $scope.noMoreItemsAvailable = false;
        var num = 1,
            max = 0;
        $scope.$on("$ionicView.afterLeave", function(event, data) {
            // handle event
            console.log("Data: ", data);
        });

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

                    } else if (response.status == 500) {
                        $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
                    } else if (response.status === 0) {
                        $cordovaDialogs.alert('No se puede acceder a este servicio en este momento.', 'Error');
                    } else {
                        $timeout(function() {
                            $cordovaToast.show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center').then(function(success) {
                                $scope.loadMore();
                            });
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
                    console.log(barcodeData);
                    // Success! Barcode data is here
                    if (barcodeData.text !== "") {
                        $cordovaToast
                            .show('Operación exitosa', 'short', 'center')
                            .then(function(success) {
                                $state.go('app.info', {
                                    "clienteId": barcodeData.text
                                });
                            }, function(error) {
                                console.log(error);
                            });
                    }
                }, function(error) {
                    // An error occurred
                    $cordovaDialogs.alert("Ah ocurrido un error" + error, 'Error');
                });
        };
    })

//Controlador de informacion de cliente
.controller('InfoC', function($http, $scope, $stateParams, $state, $timeout, $cordovaToast, $ionicHistory, $cordovaDialogs, $location) {
    var id = $stateParams.clienteId;
    $scope.posicion($location.path());
    $scope.dataReady = false;
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
                            $state.go('app.login');
                        }, function(error) {
                            $state.go('app.login');
                        });
                } else if (response.status === 400) {
                    $cordovaDialogs.alert('No se exise un cliente con ese codigo.', 'Error', 'Regresar')
                        .then(function(res) {
                            $ionicHistory.goBack(-1);
                        });
                } else if (response.status == 500) {
                    $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
                } else if (response.status === 0) {
                    $cordovaDialogs.alert('No se puede acceder a este servicio en este momento.', 'Error', 'Ok');
                } else {
                    $timeout(function() {
                        $cordovaToast.show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center').then(function(success) {
                            $scope.single();
                        });
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
    scope.imagenes = [];
    $ionicModal.fromTemplateUrl('templates/galeria.html', {
        scope: scope,
        animation: 'fade-g'
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
            scope.imagenes = imagenes;
            scope.modal.show();
        }
    };
})

.controller('Reporte', function($http, $scope, $stateParams, $cordovaDialogs, $cordovaToast, Galeria, $cordovaImagePicker, $state, $timeout, $ionicHistory, Camera, $ionicLoading, $location, $cordovaGeolocation, $cordovaProgress) {
        $scope.posicion($location.path());
        $scope.data = {};
        $scope.imagenes = [];
        $scope.total = 0;
        $scope.ready1 = false;
        $scope.ready2 = false;
        $scope.piscinas = [];
        $scope.tipos = [];
        $scope.info = [];
        $scope.carga = 0;
        $scope.cargando = false;
        $scope.file = "";
        $scope.numImage = 0;
        $scope.max = 0;
        var id = $stateParams.clienteId;
        //Angular Document Ready
        $scope.back = function() {
            $ionicHistory.goBack(-1);
        };
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
                    $cordovaDialogs.alert("Ah ocurrido un error" + error, 'Error');
                });
            }
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
                                $state.go('app.login');
                            }, function(error) {
                                $state.go('app.login');
                            });
                    } else if (response.status === 400) {
                        $cordovaDialogs.alert('No se exise un cliente con ese codigo.', 'Error', 'Regresar')
                            .then(function(res) {
                                $ionicHistory.goBack(-1);
                            });
                    } else if (response.status == 500) {
                        $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
                    } else if (response.status === 0) {
                        $cordovaDialogs.alert('No se puede acceder a este servicio en este momento.', 'Error', 'Ok');
                    } else {
                        $timeout(function() {
                            $cordovaToast.show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center').then(function(success) {
                                $scope.piscinas();
                            });
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
                                $state.go('app.login');
                            }, function(error) {
                                $state.go('app.login');
                            });
                    } else if (response.status == 500) {
                        $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
                    } else if (response.status === 0) {
                        $cordovaDialogs.alert('No se puede acceder a este servicio en este momento.', 'Error', 'Ok');
                    } else {
                        $timeout(function() {
                            $cordovaToast.show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center').then(function(success) {
                                $scope.tiposReporte();
                            });
                        }, 10000);
                    }
                });
        };

        $scope.piscinas();
        $scope.tiposReporte();
        /*
            Obteniendo el gps.
        */
        var posOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

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
                    $cordovaDialogs.alert("Ah ocurrido un error" + error, 'Error');
                });
            }
        };

        $scope.validateGps();
        $cordovaGeolocation.getCurrentPosition(posOptions).then(function(pos) {
            $scope.data.latitud = pos.coords.latitude;
            $scope.data.longitud = pos.coords.longitude;
        }, function(error) {
            $cordovaDialogs.alert('No se puede obtener la ubicación, posiblemente el gps este desactivado: ' + error.message, 'Gps')
                .then(function(res) {
                    $scope.validateGps();
                });
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
                    $scope.imagenes.push(imageData);
                    $scope.total = $scope.imagenes.length;
                }, function(err) {
                    console.log("Error", err);
                });
            } else {
                $cordovaToast.show('El maximo es 5 fotos', 'short', 'center');
            }
        };

        $scope.verGaleria = function() {
            Galeria.openGaleria($scope.imagenes);
        };

        $scope.count = function() {
            $scope.max += 1;
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
                    $scope.imagenes.push(imageData);
                    $scope.total = $scope.imagenes.length;
                }, function(err) {
                    console.log("Error", err);
                });
            } else {
                $cordovaToast.show('El maximo es 5 fotos', 'short', 'center');
            }
        };

        $scope.enviar = function() {
            if ($scope.imagenes.length > 0) {
                $cordovaDialogs.confirm('Esta seguro que quiere enviar?', 'Enviar', ['Si, Enviar!', 'Cancelar'])
                    .then(function(result) {
                        if (result === 1) {
                            send(); //Se formatea la informacion y se envia.
                        }
                    });
            } else {
                $cordovaDialogs.confirm('Esta seguro que quiere enviar sin fotos?', 'Fotos', ['Si, Enviar!', 'Tomar Foto'])
                    .then(function(result) {
                        if (result === 1) {
                            send(); //Se envia sin fotos
                        } else if (result === 2) {
                            $scope.takePicture();
                        }
                    });
            }

            function win(r) {
                console.log("Code = " + r.responseCode);
                console.log("Response = " + r.response);
                console.log("Sent = " + r.bytesSent);
            }

            function fail(error) {
                $cordovaDialogs.alert("Se ha producido un error: Code = " + error.code, 'Error');
                console.log(console.error);
                console.log("upload error source " + error.source);
                console.log("upload error target " + error.target);
            }

            function enviarFotos(reporteId) {
                $ionicLoading.hide();
                $scope.cargando = true;
                var serve = encodeURI($scope.server + "/reportes/foto/form/");
                var options = new FileUploadOptions();
                options.fileKey = "url";
                options.httpMethod = "POST";
                options.params = {
                    "reporte": reporteId
                };
                var ft = new FileTransfer();
                ft.onprogress = function(progressEvent) {
                    console.log(progressEvent);
                    if (progressEvent.lengthComputable) {
                        var num = (progressEvent.loaded / progressEvent.total) * 100;
                        $scope.carga = num.toFixed();
                        console.log();
                    }
                };
                $timeout(function() {
                    $scope.imagenes.forEach(function(imagen, index) {
                        $scope.numImage = index + 1;
                        options.fileName = imagen.substr(imagen.lastIndexOf('/') + 1);
                        ft.upload(imagen, serve, win, fail, options);
                    });
                    $scope.cargando = false;
                }, 5000);

            }

            function send() {
                $scope.loading = $ionicLoading.show({
                    template: '<ion-spinner class="spinner-light"></ion-spinner><br/>Guardando...',
                });
                $http({
                    method: 'POST',
                    url: $scope.server + '/reportes/reporte/form/',
                    data: $.param($scope.data),
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }).then(function doneCallbacks(response) {
                        enviarFotos(response.data[0].pk);
                        $cordovaToast.show("Guardando exitoso", 'long', 'center')
                            .then(function(success) {
                                $state.go('app.historialR', {
                                    clienteId: id,
                                    actual: response.data[0].pk
                                });
                            });
                    },
                    function failCallbacks(response) {
                        if (response.status === 403) {
                            $ionicLoading.hide();
                            var error;
                            if (response.data.error) {
                                error = response.data.error;
                            } else {
                                error = "Debes logearte nuevamente.";
                            }
                            $cordovaToast
                                .show(error, 'short', 'center')
                                .then(function(success) {
                                    $state.go('app.login');
                                }, function(error) {
                                    $state.go('app.login');
                                });
                        } else if (response.status == 400) {
                            $ionicLoading.hide();
                            var data = response.data;
                            if (data.error) {
                                $cordovaToast.show(data.error[0], 'short', 'center');
                            } else if (data.nombre) {
                                $cordovaToast.show("Nombre:" + data.nombre[0], 'short', 'center');
                            } else if (data.descripcion) {
                                $cordovaToast.show("Descripcion:" + data.descripcion[0], 'short', 'center');
                            } else if (data.cliente) {
                                $cordovaToast.show("Piscina:" + data.piscina[0], 'short', 'center');
                            } else if (data.tipo_de_reporte) {
                                $cordovaToast.show("Tipo:" + data.tipo_de_reporte[0], 'short', 'center');
                            } else if (data.reporta) {
                                $cordovaToast.show("Reporta:" + data.reporta[0], 'short', 'center');
                            }
                        } else if (response.status == 500) {
                            $ionicLoading.hide();
                            $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
                        } else {
                            $timeout(function() {
                                $cordovaToast.show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center').then(function(success) {
                                    $ionicLoading.hide();
                                    send();
                                });
                            }, 5000);
                        }
                    });
            }
        };
    })
    .controller('HistorialR', function($scope, $rootScope, $http, $state, $location, $cordovaToast, $timeout, $cordovaDialogs, $stateParams, $ionicHistory) {
        $scope.posicion($location.path());
        $scope.search = "";
        $scope.noMoreItemsAvailable = false;
        $scope.actual = $stateParams.actual;
        var num = 1,
            max = 0,
            id = $stateParams.clienteId,
            url = '';
        $scope.reportes = [];
        if (id === '0') {
            url = '/reportes/reporte/list/?';
        } else {
            url = '/reportes/reporte/list/?piscina__casa__cliente=' + id + '&';
        }
        if ($scope.actual > 0) {
            $rootScope.$ionicGoBack = function() {
                $ionicHistory.goBack(-2);
            };
        }
        $scope.loadMore = function() {
            $http.get($scope.server + url + 'page=' + num)
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
                    if (response.status == 403) {
                        $cordovaToast
                            .show(response.data.error, 'short', 'center')
                            .then(function(success) {
                                $state.go('app.login');
                            }, function(error) {
                                console.log(error);
                            });
                    } else if (response.status == 500) {
                        $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
                    } else if (response.status === 0) {
                        $cordovaDialogs.confirm('No se puede acceder a este servicio en este momento.', 'Error');
                    } else {
                        $timeout(function() {
                            $cordovaToast.show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center').then(function(success) {
                                $scope.loadMore();
                            });
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
    .controller('GaleriaR', function($http, $scope, $stateParams, $cordovaToast, $state, $cordovaDialogs, $timeout, $ionicLoading, $location) {
        $scope.posicion($location.path());
        var id = $stateParams.reporteId;
        $scope.imagenes = [];
        $scope.ready = false;
        $scope.count = 0;
        $scope.actual = "";
        $scope.swiper = {};

        $scope.galeria = function() {
            $http.get($scope.server + '/reportes/fotoreporte/list/?reporte=' + id)
                .then(function successCallback(response) {
                    $scope.imagenes = response.data.object_list;
                    $scope.count = $scope.imagenes.length;
                    if ($scope.count > 0) {
                        $scope.actual = $scope.imagenes[0].url;
                    }
                    $scope.ready = true;
                }, function errorCallback(response) {
                    if (response.status === 403) {
                        $cordovaToast
                            .show(response.data.error, 'short', 'center')
                            .then(function(success) {
                                $state.go('app.login');
                            }, function(error) {
                                console.log(error);
                            });
                    } else if (response.status == 500) {
                        $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
                    } else if (response.status === 0) {
                        $cordovaDialogs.alert('No se puede acceder a este servicio en este momento.', 'Error', 'Ok');
                    } else {
                        $timeout(function() {
                            $cordovaToast.show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center').then(function(success) {
                                $scope.galeria();
                            });
                        }, 10000);
                    }
                });
        };

        $scope.galeria();

        $scope.selecion = function(imagen) {
            if ($scope.actual !== imagen.url) {
                $scope.actual = imagen.url;
            }
        };
    })
    .controller('Repuesta', function($scope, $http, $stateParams, $state, $cordovaToast, $timeout, $cordovaDialogs, $ionicLoading, $location) {
        var id = $stateParams.reporteId;
        $scope.respuestas = [];
        $scope.ready = false;
        $scope.data = {};
        $scope.posicion($location.path());

        $scope.respuestas = function() {
            $http.get($scope.server + '/reportes/respuesta/list/?reporte=' + id)
                .then(function successCallback(response) {
                    $scope.respuestas = response.data.object_list;
                    $scope.ready = true;
                }, function errorCallback(response) {
                    if (response.status === 403) {
                        $cordovaToast
                            .show(response.data.error, 'short', 'center')
                            .then(function(success) {
                                $state.go('app.login');
                            }, function(error) {
                                console.log(error);
                            });
                    } else if (response.status === 400) {
                        $cordovaDialogs.alert('No se exise un cliente con ese codigo.', 'Error', 'Regresar')
                            .then(function(res) {
                                $ionicHistory.goBack(-1);
                            });
                    } else if (response.status == 500) {
                        $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
                    } else if (response.status === 0) {
                        $cordovaDialogs.alert('No se puede acceder a este servicio en este momento.', 'Error', 'Ok');
                    } else {
                        $timeout(function() {
                            $cordovaToast.show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center').then(function(success) {
                                $scope.respuestas();
                            });
                        }, 10000);
                    }
                });
        };
        $scope.respuestas();

        $scope.enviar = function() {
            $scope.loading = $ionicLoading.show({
                template: '<ion-spinner class="spinner-light"></ion-spinner><br/>Enviando...',
                noBackdrop: true
            });
            $scope.data.reporte = id;
            $http({
                method: 'POST',
                url: $scope.server + '/reportes/respuesta/form/',
                data: $.param($scope.data),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
            }).then(function successCallback(response) {
                var mensaje = {};
                $scope.data = {};
                mensaje = response.data[0].fields;
                mensaje.tu = 1;
                $scope.respuestas.push(mensaje);
                $ionicLoading.hide();
            }, function errorCallback(response) {
                $ionicLoading.hide();
                if (response.status === 403) {
                    $cordovaToast
                        .show(response.data.error, 'short', 'center')
                        .then(function(success) {
                            $state.go('app.login');
                        }, function(error) {
                            $state.go('app.login');
                        });
                } else if (response.status === 400) {
                    $ionicLoading.hide();
                    var data = response.data;
                    if (data.error) {
                        $cordovaToast.show(data.error[0], 'short', 'center');
                    }
                    if (data.nombre) {
                        $cordovaToast.show("Mensaje:" + data.mensaje[0], 'short', 'center');
                    }
                    if (data.reporte) {
                        $cordovaToast.show("Reporte:" + data.reporte[0], 'short', 'center');
                    }
                } else if (response.status == 500) {
                    $ionicLoading.hide();
                    $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
                } else {
                    $timeout(function() {
                        $cordovaToast.show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center').then(function(success) {
                            $scope.enviar();
                        });
                    }, 5000);
                }
            });
        };

    })
    .controller('Mantenimiento', function($http, $scope, $stateParams, Camera, Galeria, $cordovaImagePicker, $cordovaToast, $state, $cordovaDialogs, $ionicHistory, $timeout, $ionicLoading, $location) {
        $scope.posicion($location.path());
        $scope.data = {};
        $scope.imagenes = [];
        $scope.tipos = [];
        $scope.total = 0;
        $scope.ready = false;
        var id = $stateParams.clienteId;

        $scope.back = function() {
            $ionicHistory.goBack(-1);
        };

        $scope.tipos = function() {
            $http.get($scope.server + '/mantenimiento/service/tiposolucion/list/')
                .then(function successCallback(response) {
                    $scope.tipos = response.data.object_list;
                    if (response.data.num_rows === 0) {
                        $cordovaDialogs.alert('No se puede registrar la solución, porque no hay tipos registrados.', 'Información').
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
                                $state.go('app.login');
                            }, function(error) {
                                console.log(error);
                            });
                    } else if (response.status == 500) {
                        $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
                    } else if (response.status === 400) {
                        $cordovaDialogs.alert('No se exise un cliente con ese codigo.', 'Error', 'Regresar')
                            .then(function(res) {
                                $ionicHistory.goBack(-1);
                            });
                    } else if (response.status === 0) {
                        $cordovaDialogs.alert('No se puede acceder a este servicio en este momento.', 'Error', 'Ok');
                    } else {
                        $timeout(function() {
                            $cordovaToast.show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center').then(function(success) {
                                $scope.tipos();
                            });
                        }, 10000);
                    }
                });
        };
        $scope.tipos();

        $scope.takePicture = function() {
            if ($scope.total < 5) {
                var options = {
                    quality: 75,
                    targetWidth: 1280,
                    targetHeight: 720,
                    sourceType: 1
                };
                Camera.getPicture(options).then(function(imageData) {
                    $scope.imagenes.push(imageData);
                    $scope.total = $scope.imagenes.length;
                }, function(err) {
                    console.log("Error", err);
                });
            } else {
                $cordovaToast.show('El maximo es 5 fotos', 'short', 'center');
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
                    $scope.imagenes.push(imageData);
                    $scope.total = $scope.imagenes.length;
                }, function(err) {
                    console.log("Error", err);
                });
            } else {
                $cordovaToast.show('El maximo es 5 fotos', 'short', 'center');
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
                    results.forEach(function(imagen) {
                        $scope.imagenes.push(imagen);
                        $scope.total = $scope.imagenes.length;
                    });
                }, function(error) {
                    console.log('Error: ' + JSON.stringify(error)); // In case of error
                });
        };

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
                    $cordovaDialogs.alert("Ah ocurrido un error" + error, 'Error');
                });
            }
        };

        $scope.validateGps();
        $cordovaGeolocation.getCurrentPosition(posOptions).then(function(pos) {
            $scope.data.latitud = pos.coords.latitude;
            $scope.data.longitud = pos.coords.longitude;
        }, function(error) {
            $cordovaDialogs.alert('No se puede obtener la ubicación, posiblemente el gps este desactivado: ' + error.message, 'Gps')
                .then(function(res) {
                    $scope.validateGps();
                });
        });

        $scope.enviar = function(data) {
            $scope.loading = $ionicLoading.show({
                template: '<ion-spinner class="spinner-light"></ion-spinner><br/>Guardando...',
                noBackdrop: true
            });

            function enviando() {
                $http({
                    method: 'POST',
                    url: $scope.server + '/mantenimiento/service/mantanimiento/form/',
                    data: $.param(data),
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                }).then(function doneCallbacks(response) {
                    $scope.data = {};
                    $scope.total = 0;
                    $ionicLoading.hide();
                    $cordovaToast.show("Enviado exitoso", 'long', 'center');
                }, function failCallbacks(response) {
                    if (response.status === 403) {
                        $ionicLoading.hide();
                        $cordovaToast
                            .show(response.data.error, 'short', 'center')
                            .then(function(success) {
                                $state.go('app.login');
                            }, function(error) {
                                $state.go('app.login');
                            });
                    }
                    if (response.status === 400) {
                        $ionicLoading.hide();
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
                    } else if (response.status == 500) {
                        $ionicLoading.hide();
                        $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
                    } else {
                        $timeout(function() {
                            $cordovaToast.show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center').then(function(success) {
                                $ionicLoading.hide();
                                enviando();
                            });
                        }, 5000);
                    }
                });
            }
            enviando();
        };

        $scope.datosForm = function() {
            var dataSend = {};
            dataSend.nombre = $scope.data.nombre;
            dataSend.descripcion = $scope.data.descripcion;
            dataSend.reporte = id;
            dataSend.tipo = $scope.data.tipo;
            dataSend["fotomantenimiento_set-TOTAL_FORMS"] = $scope.total;
            dataSend["fotomantenimiento_set-INITIAL_FORMS"] = 0;
            dataSend["fotomantenimiento_set-MIN_NUM_FORMS"] = 0;
            dataSend["fotomantenimiento_set-MAX_NUM_FORMS"] = 1000;
            if ($scope.data.imagenes.length > 0) {
                $scope.data.imagenes.forEach(function(imagen, index) {
                    dataSend["fotomantenimiento_set-" + index + "-url"] = imagen;
                });
                $cordovaDialogs.confirm('Esta seguro que quiere enviar?', 'Enviar', ['Si, Enviar!', 'Cancelar'])
                    .then(function(result) {
                        if (result === 1) {
                            $scope.enviar(dataSend); //Se formatea la informacion y se envia.
                        }
                    });
            } else {
                $cordovaDialogs.confirm('Esta seguro que quiere enviar sin fotos?', 'Fotos', ['Si, Enviar!', 'Tomar Foto'])
                    .then(function(result) {
                        if (result === 1) {
                            $scope.enviar(dataSend); //Se envia sin fotos
                        } else if (result === 2) {
                            $scope.takePicture();
                        }
                    });
            }

        };
    })
    .controller('HistorialM', function($scope, $http, $state, $cordovaToast, $timeout, $cordovaDialogs, $location) {
        $scope.posicion($location.path());
        $scope.search = "";
        $scope.noMoreItemsAvailable = false;
        var num = 1,
            max = 0;
        $scope.lista = [];
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
                                $state.go('app.login');
                            }, function(error) {
                                $state.go('app.login');
                            });
                    } else if (response.status == 500) {
                        $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
                    } else if (response.status === 0) {
                        $cordovaDialogs.confirm('No se puede acceder a este servicio en este momento.', 'Error');
                    } else {
                        $timeout(function() {
                            $cordovaToast.show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center').then(function(success) {
                                $scope.loadMore();
                            });
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
    .controller('GaleriaM', function($http, $scope, $stateParams, $cordovaToast, $state, $cordovaDialogs, $location, $timeout, $ionicLoading) {
        var id = $stateParams.mantenimientoId;
        $scope.imagenes = [];
        $scope.ready = false;
        $scope.count = 0;
        $scope.actual = "";
        $scope.swiper = {};
        $scope.posicion($location.path());

        $scope.galeria = function() {
            $http.get($scope.server + '/mantenimiento/service/fotomantenimiento/list/?mantenimiento=' + id)
                .then(function successCallback(response) {
                    $scope.imagenes = response.data.object_list;
                    $scope.count = $scope.imagenes.length;
                    if ($scope.count > 0) {
                        $scope.actual = $scope.imagenes[0].url;
                    }
                    $scope.ready = true;
                }, function errorCallback(response) {
                    if (response.status === 403) {
                        $cordovaToast
                            .show(response.data.error, 'short', 'center')
                            .then(function(success) {
                                $state.go('app.login');
                            }, function(error) {
                                $state.go('app.login');
                            });
                    } else if (response.status == 500) {
                        $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
                    } else if (response.status === 0) {
                        $cordovaDialogs.alert('No se puede acceder a este servicio en este momento.', 'Error', 'Ok');
                    } else {
                        $timeout(function() {
                            $cordovaToast.show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center').then(function(success) {
                                $scope.galeria();
                            });
                        }, 10000);
                    }
                });
        };

        $scope.galeria();

        $scope.selecion = function(imagen) {
            if ($scope.actual !== imagen.url) {
                $scope.actual = imagen.url;
            }
        };
    })
    .controller('MapCtrl', function($scope, $ionicLoading, $stateParams, $cordovaGeolocation, $cordovaDialogs, $timeout, $http, $cordovaToast, $state, $location) {
        var latitud = $stateParams.latitud,
            longitud = $stateParams.longitud,
            id = $stateParams.casaId,
            marker = null;
        $scope.Ready = true;
        $scope.posicion($location.path());

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
                    $cordovaDialogs.alert("Ah ocurrido un error" + error, 'Error');
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

                $cordovaDialogs.alert('No se puede obtener la ubicación, posiblemente el gps este desactivado: ' + error.message, 'Gps')
                    .then(function(res) {
                        $scope.validateGps();
                    });
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
                                $state.go('app.login');
                            }, function(error) {
                                console.log(error);
                            });
                    } else if (response.status == 500) {
                        $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
                    } else if (response.status == 400) {
                        var data = response.data;
                        if (data.error) {
                            $cordovaToast.show(data.error[0], 'short', 'center');
                        } else if (data.username) {
                            $cordovaToast.show("longitud:" + data.longitud[0], 'short', 'center');
                        } else if (data.password) {
                            $cordovaToast.show("latitud:" + data.latitud[0], 'short', 'center');
                        }
                    } else {
                        $timeout(function() {
                            $cordovaToast.show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center').then(function(success) {
                                $scope.guardar();
                            });
                        }, 5000);
                    }
                });
            });
        };
    })

.controller('Piscineros', function($scope, $http, $state, $location, $cordovaToast, $timeout, $cordovaDialogs) {
    $scope.posicion($location.path());
    $scope.search = "";
    $scope.noMoreItemsAvailable = false;
    var num = 1,
        max = 0;
    $scope.piscineros = [];
    $scope.toggleGroup = function(group) {
        if ($scope.isGroupShown(group)) {
            $scope.shownGroup = null;
        } else {
            $scope.shownGroup = group;
        }
    };

    $scope.isGroupShown = function(group) {
        return $scope.shownGroup === group;
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
                            $state.go('app.login');
                        }, function(error) {
                            console.log(error);
                        });
                } else if (response.status == 500) {
                    $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
                } else if (response.status === 0) {
                    $cordovaDialogs.confirm('No se puede acceder a este servicio en este momento.', 'Error');
                } else {
                    $timeout(function() {
                        $cordovaToast.show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center').then(function(success) {
                            $scope.loadMore();
                        });
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

.controller('PiscinaAsignacion', function($scope, $stateParams, $http, $cordovaToast, $ionicLoading, $state, $cordovaDialogs, $timeout, $location) {
        var id = $stateParams.piscineroId;
        $scope.piscinas = [];
        $scope.checkes = [];
        $scope.noMoreItemsAvailable = false;
        $scope.posicion($location.path());
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
                                $state.go('app.login');
                            }, function(error) {
                                console.log(error);
                            });
                    } else if (response.status == 500) {
                        $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
                    } else if (response.status === 0) {
                        $cordovaDialogs.alert("No se puede acceder a este servicio en este momento.", "Error");
                    } else {
                        $timeout(function() {
                            $cordovaToast.show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center').then(function(success) {
                                $scope.loadMore();
                            });
                        }, 10000);
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

            function asignando() {
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
                                $state.go('app.login');
                            }, function(error) {
                                $state.go('app.login');
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
                    } else if (response.status == 500) {
                        $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
                    } else {
                        $timeout(function() {
                            $cordovaToast.show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center').then(function(success) {
                                asignando();
                            });
                        }, 10000);
                    }
                });
            }
            asignando();
        };
    })
    .controller('Ruta', function($scope, $http, $stateParams, $cordovaToast, $cordovaDialogs, $timeout, $ionicLoading, $state, $location) {
        $scope.piscinero = $stateParams.piscineroId;
        $scope.noMoreItemsAvailable = false;
        $scope.items = [];
        var num = 1,
            max = 0;
        $scope.posicion($location.path());
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
                                $state.go('app.login');
                            }, function(error) {
                                $state.go('app.login');
                            });
                    } else if (response.status == 500) {
                        $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
                    } else if (response.status === 0) {
                        $cordovaDialogs.alert('No se puede acceder a este servicio en este momento.', 'Error');
                    } else {
                        $timeout(function() {
                            $cordovaToast.show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center').then(function(success) {
                                $scope.loadMore();
                            });
                        }, 10000);
                    }
                });
        };

        $scope.moveItem = function(item, fromIndex, toIndex) {
            $scope.items.splice(fromIndex, 1);
            $scope.items.splice(toIndex, 0, item);
            var move = toIndex - fromIndex;
            var data = {};
            if (move > 0) {
                data.orden = $scope.items[toIndex - 1].orden;
            } else if (move < 0) {
                data.orden = $scope.items[toIndex + 1].orden;
            }
            if (toIndex !== fromIndex) {
                cambio();
            }

            function cambio() {
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
                                $state.go('app.login');
                            }, function(error) {
                                $state.go('app.login');
                            });
                    } else if (response.status == 400) {
                        console.log(response);
                    } else if (response.status == 500) {
                        $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
                    } else {
                        $timeout(function() {
                            $cordovaToast.show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center').then(function(success) {
                                cambio();
                            });
                        }, 10000);
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

.controller('MapaRuta', function($scope, $http, $stateParams, $cordovaToast, $cordovaDialogs, $ionicLoading, $timeout, $state, $location, $ionicHistory) {
        $scope.cargado = false;
        var gpsnull = true,
            casanull = null,
            marker = null;
        $scope.items = [];
        $scope.posicion($location.path());
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
                        } else if (data.length === 1) {

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
                        } else if (data.length > 1) {
                            data.forEach(function(data, index) {
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
                                } else {
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
                            } else {
                                $cordovaDialogs.alert('No se puede mostrar la ruta porque la piscina: ' + casanull.nombreP + ' en la casa con dirección ' + casanull.nombreCA + ' del cliente ' + casanull.nombreCF + ' ' + casanull.nombreCL + ' no tiene asignado el gps. ', 'gps')
                                    .then(function(success) {
                                        $ionicHistory.goBack();
                                    });
                            }

                        }
                    },

                    function errorCallback(response) {
                        if (response.status == 403) {
                            $cordovaToast
                                .show(response.data.error, 'short', 'center')
                                .then(function(success) {
                                    $state.go('app.login');
                                }, function(error) {
                                    $state.go('app.login');
                                });
                        } else if (response.status === 0) {
                            $cordovaDialogs.alert('No se puede acceder a este servicio en este momento.', 'Error');
                        } else if (response.status === 500) {
                            $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
                        }
                    });
        };
    })
    .controller('Planilla', function($http, $scope, $ionicHistory, $cordovaDialogs, $timeout, $cordovaToast, $state, $location, $ionicLoading, $stateParams) {
        $scope.posicion($location.path());
        $scope.data = {};
        $scope.ready = false;
        $scope.piscinas = [];

        var id = $stateParams.clienteId;
        //Angular Document Ready
        $scope.back = function() {
            $ionicHistory.goBack(-1);
        };
        $scope.piscinas = function() {
            $http.get($scope.server + '/usuarios/service/list/piscina/?casa__cliente=' + id)
                .then(function successCallback(response) {
                    $scope.piscinas = response.data.object_list;
                    console.log("Cliente");
                    if (response.data.num_rows === 0) {
                        $cordovaDialogs.alert('Planilla no disponible, Este Usuario no tiene piscinas asociadas.', 'Información').
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
                                $state.go('app.login');
                            }, function(error) {
                                $state.go('app.login');
                            });
                    } else if (response.status === 400) {
                        $cordovaDialogs.alert('No se exise un cliente con ese codigo.', 'Error', 'Regresar')
                            .then(function(res) {
                                $ionicHistory.goBack(-1);
                            });
                    } else if (response.status == 500) {
                        $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
                    } else if (response.status === 0) {
                        $cordovaDialogs.alert('No se puede acceder a este servicio en este momento.', 'Error', 'Ok');
                    } else {
                        $timeout(function() {
                            $cordovaToast.show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center').then(function(success) {
                                $scope.piscinas();
                            });
                        }, 10000);
                    }
                });
        };

        $scope.piscinas();

        $scope.enviar = function() {
            $scope.loading = $ionicLoading.show({
                template: '<ion-spinner class="spinner-light"></ion-spinner><br/>Guardando...',
                noBackdrop: true
            });

            function enviando() {
                $http({
                    method: 'POST',
                    url: $scope.server + '/actividades/planilladiaria/form/',
                    data: $.param($scope.data),
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                }).then(function doneCallbacks(response) {
                    $scope.data = {};
                    $scope.total = 0;
                    $ionicLoading.hide();
                    $cordovaToast.show("Enviado exitoso", 'long', 'center');
                }, function failCallbacks(response) {
                    if (response.status === 403) {
                        $ionicLoading.hide();
                        $cordovaToast
                            .show(response.data.error, 'short', 'center')
                            .then(function(success) {
                                $state.go('app.login');
                            }, function(error) {
                                $state.go('app.login');
                            });
                    }
                    if (response.status === 400) {
                        $ionicLoading.hide();
                        var data = response.data;
                        if (data.__all__) {
                            $cordovaToast.show(data.__all__[0], 'short', 'center');
                        }
                        if (data.nombre) {
                            $cordovaToast.show("Nivel de cloro:" + data.nivel_cloro[0], 'short', 'center');
                        }
                        if (data.descripcion) {
                            $cordovaToast.show("Observaciones:" + data.observaciones[0], 'short', 'center');
                        }
                        if (data.cliente) {
                            $cordovaToast.show("Piscina:" + data.piscina[0], 'short', 'center');
                        }
                        if (data.reporta) {
                            $cordovaToast.show("Nivel PH:" + data.nivel_ph[0], 'short', 'center');
                        }
                        if (data.piscinero) {
                            $cordovaToast.show("Piscinero:" + data.piscinero[0], 'short', 'center');
                        }
                    } else if (response.status == 500) {
                        $ionicLoading.hide();
                        $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
                    } else {
                        $timeout(function() {
                            $cordovaToast.show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center').then(function(success) {
                                $ionicLoading.hide();
                                enviando();
                            });
                        }, 5000);
                    }
                });
            }
            enviando();
        };
    });
