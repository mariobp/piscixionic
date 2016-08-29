angular.module('starter.controllers', [])

.controller('AppCtrl', function($http, $scope, $state, $cordovaDialogs, $cordovaToast, $timeout, notix, $cordovaLocalNotification) {
    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //$scope.$on('$ionicView.enter', function(e) {
    //});
    // Form data for the login modal
    $scope.server = "http://104.236.33.228:8050";
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

    $scope.user = function(username) {
        $scope.username = username;
    };

    $scope.noti = function(obj) {
        $scope.notify = obj;
    };

    $scope.isLogin = function() {
        $http.get($scope.server + "/usuarios/is/login/")
            .then(function doneCallbacks(response) {
                $scope.user(response.data.username);
                notix.setup(response.data.session, response.data.username, response.data.type);
                $scope.noti(notix);
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
                } else if (notix.username === null) {
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
                        id: 57,
                        title: 'Piscix',
                        text: 'No se puede conectar al servidor',
                        //icon: 'img/icon.png'
                    });
                }, 10000);
            }
        });
    };
    console.log(notix);
    $scope.serverOn();
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
                } else if (response.status == 404) {
                    $cordovaToast.show("Usuario y/o contraseña incorrectos", 'short', 'center');
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

        $scope.loadMore = function() {
            $http.get($scope.server + '/usuarios/service/list/cliente/?page=' + num + "&search=" + $scope.search)
                .then(function successCallback(response) {
                    var clientes = response.data.object_list;
                    if (clientes.length === 0) {
                        $cordovaToast.show('No se han encontrado resultados.', 'short', 'center');
                    }
                    clientes.forEach(function(cliente) {
                        if (cliente.imagen === "") {
                            cliente.imagen = "";
                        }
                        if (cliente.imagen === null) {
                            cliente.imagen = "";
                        }
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
.controller('InfoC', function($http, $scope, $stateParams, $state, $timeout, $cordovaToast, $ionicModal, $ionicHistory, $cordovaDialogs, $location) {
    var id = $stateParams.clienteId;
    $scope.posicion($location.path());
    $scope.dataReady = false;
    $scope.change = false;
    $scope.noFoto = "img/broken_image.svg";
    $scope.single = function() {
        $http.get($scope.server + '/usuarios/single/cliente/' + id + '/')
            .then(function successCallback(response) {
                $scope.info = response.data;
                if ($scope.info.cliente.imagen === "") {
                    $scope.info.cliente.imagen = "";
                }
                if ($scope.info.cliente.imagen === null) {
                    $scope.info.cliente.imagen = "";
                }
                if ($scope.info.length === 0) {
                    $cordovaToast.show('No se han encontrado resultados.', 'short', 'center');
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

    $ionicModal.fromTemplateUrl('templates/piscinaInfo.html', {
        scope: $scope,
        animation: 'fade-g'
    }).then(function(modal) {
        $scope.modal = modal;
    });

    $scope.cerrarModal = function() {
        $scope.modal.hide();
    };

    $scope.$on('$destroy', function() {
        $scope.modal.remove();
    });

    $scope.abrirModal = function(piscina) {
        $scope.modal.show();
        $scope.infoPiscina = piscina;
        if ($scope.infoPiscina.imagen === null) {
            $scope.change = true;
        }
    };

    $scope.contacto = $ionicModal.fromTemplateUrl('templates/contactos.html', {
        scope: $scope,
        animation: 'fade-g'
    }).then(function(modal) {
        $scope.modal2 = modal;
    });

    $scope.cerrarModal2 = function() {
        $scope.modal2.hide();
    };

    $scope.abrirModal2 = function() {
        $scope.modal2.show();
    };
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

.factory('Galeria', function($rootScope, $ionicModal, $cordovaDialogs) {
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

    scope.delete = function(imagen) {
        $cordovaDialogs.confirm('Esta seguro de que quieres eliminar esta foto?.', 'Foto', ['Eliminar', 'Cancelar'])
            .then(function(result) {
                if (result === 1) {
                    scope.imagenes.splice(scope.imagenes.indexOf(imagen), 1);
                }
            });
    };

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
        $scope.disableEnviar = false;
        var id = $stateParams.clienteId;
        //Angular Document Ready
        Materialize.updateTextFields();
        $ionicHistory.nextViewOptions({
            disableBack: true
        });
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

        $scope.takePicture = function() {
            if ($scope.imagenes.length < 5) {
                var options = {
                    quality: 75,
                    targetWidth: 1280,
                    targetHeight: 720,
                    sourceType: 1
                };
                Camera.getPicture(options).then(function(imageData) {
                    $scope.imagenes.push(imageData);
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

        $scope.getPicture = function() {
            if ($scope.imagenes.length < 5) {
                var options = {
                    quality: 75,
                    targetWidth: 1280,
                    targetHeight: 720,
                    sourceType: 0
                };
                Camera.getPicture(options).then(function(imageData) {
                    $scope.imagenes.push(imageData);
                }, function(err) {
                    console.log("Error", err);
                });
            } else {
                $cordovaToast.show('El maximo es 5 fotos', 'short', 'center');
            }
        };

        var posOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        $scope.confirmar = function() {
            $cordovaDialogs.confirm('Para realizar el reporte debe activar su gps en Alta presición.', 'Gps', ['Activar GPS', 'Salir'])
                .then(function(result) {
                    if (result === 1) {
                        cordova.plugins.diagnostic.switchToLocationSettings();
                    } else {
                        $ionicHistory.goBack();
                    }
                });
        };

        $scope.tomarUbicacion = function() {
            cordova.plugins.diagnostic.getLocationMode(function(state) {
                if (state == "high_accuracy") {
                    $cordovaGeolocation.getCurrentPosition(posOptions).then(function(pos) {
                        $scope.data.latitud = pos.coords.latitude;
                        $scope.data.longitud = pos.coords.longitude;
                        $cordovaToast.show("Ubicación tomada", 'short', 'center');
                    }, function(error) {
                        $ionicLoading.hide();
                        $cordovaToast.show('No se puede obtener la ubicación, posiblemente el gps este desactivado: ' + error.message, 'Gps', 'short', 'center')
                            .then(function(res) {
                                $scope.confirmar();
                            });
                    });
                } else if (state == "battery_saving") {
                    $scope.confirmar();
                } else if (state == "device_only") {
                    $scope.confirmar();
                } else {
                    $scope.confirmar();
                }
            });
        };
        //Se calcula la ubicación actual
        $scope.tomarUbicacion();

        //Si la aplicacion regresa de un background y verifica si ya se tiene gps, si no se recalcula
        document.addEventListener("resume", function() {
            if ($scope.data.latitud === undefined && $scope.data.longitud === undefined) {
                $scope.tomarUbicacion();
            }
        }, false);

        $scope.enviar = function() {
            $scope.disableEnviar = true;
            if ($scope.data.latitud && $scope.data.longitud) {
                if ($scope.imagenes.length > 0) {
                    $cordovaDialogs.confirm('Esta seguro que quiere enviar?', 'Enviar', ['Si, Enviar!', 'Cancelar'])
                        .then(function(result) {
                            if (result === 1) {
                                $scope.sendData(); //Se formatea la informacion y se envia.
                            } else {
                                $scope.disableEnviar = false;
                            }
                        });
                } else {
                    $cordovaDialogs.confirm('Esta seguro que quiere enviar sin fotos?', 'Fotos', ['Si, Enviar!', 'Tomar Foto'])
                        .then(function(result) {
                            if (result === 1) {
                                $scope.sendData(); //Se envia sin fotos
                            } else {
                                $scope.disableEnviar = false;
                                $scope.takePicture();
                            }
                        });
                }
            } else {
                $cordovaToast.show("No se ha tomado aun la ubicación, por favor espere e intente de nuevo", 'short', 'center').then(function() {
                    $scope.disableEnviar = false;
                });
            }
        };

        $scope.enviarFotos = function(reporteId) {
            function win(r) {
                $scope.cargando = false;
            }

            function fail(error) {
                $cordovaDialogs.alert("Se ha producido un error: Code = " + error.code, 'Error');
            }

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
                if (progressEvent.lengthComputable) {
                    var num = (progressEvent.loaded / progressEvent.total) * 100;
                    $scope.carga = num.toFixed();
                    if (num === 100) {
                        $scope.cargando = false;
                    }
                }
            };
            $scope.imagenes.forEach(function(imagen, index) {
                $scope.numImage = index + 1;
                options.fileName = imagen.substr(imagen.lastIndexOf('/') + 1);
                ft.upload(imagen, serve, win, fail, options);
            });
        };

        $scope.sendData = function() {
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
                    $ionicLoading.hide();
                    $scope.disableEnviar = false;
                    $scope.enviarFotos(response.data.id);
                    $cordovaToast.show("Guardando exitoso", 'long', 'center')
                        .then(function(success) {
                            $state.go('app.historialR', {
                                clienteId: id,
                                actual: response.data.id
                            });
                        });
                },
                function failCallbacks(response) {
                    $ionicLoading.hide();
                    if (response.status === 403) {
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
                        var data = response.data;
                        if (data.error) {
                            $cordovaToast.show(data.error[0], 'short', 'center');
                        } else if (data.nombre) {
                            $cordovaToast.show("Nombre:" + data.nombre[0], 'short', 'center');
                        } else if (data.descripcion) {
                            $cordovaToast.show("Descripcion:" + data.descripcion[0], 'short', 'center');
                        } else if (data.piscina) {
                            $cordovaToast.show("Piscina:" + data.piscina[0], 'short', 'center');
                        } else if (data.tipo_de_reporte) {
                            $cordovaToast.show("Tipo:" + data.tipo_de_reporte[0], 'short', 'center');
                        } else if (data.reporta) {
                            $cordovaToast.show("Reporta:" + data.reporta[0], 'short', 'center');
                        }
                    } else if (response.status == 500) {
                        $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
                    } else {
                        $timeout(function() {
                            $cordovaToast.show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center').then(function(success) {
                                $scope.sendData();
                            });
                        }, 5000);
                    }
                    $scope.disableEnviar = false;
                });
        };
    })
    .controller('HistorialR', function($scope, $rootScope, $http, $state, $location, $cordovaToast, $timeout, $cordovaDialogs, $stateParams, $ionicHistory) {
        $scope.posicion($location.path());
        $scope.search = "";
        $scope.noMoreItemsAvailable = false;
        $scope.actual = $stateParams.actual;
        $scope.notify.leido();
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

        $scope.loadMore = function() {
            $http.get($scope.server + url + 'page=' + num + "&search=" + $scope.search)
                .then(function successCallback(response) {
                    var data = response.data.object_list;
                    if (response.data.num_rows === 0) {
                        $cordovaToast.show('No se han encontrado resultados.', 'short', 'center');
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

        $scope.reload2 = function() {
            $scope.reportes = [];
            num = 1;
            max = 0;
            $scope.noMoreItemsAvailable = false;
            $scope.loadMore();
        };

    })
    .controller('GaleriaR', function($http, $scope, $stateParams, $cordovaToast, $state, $cordovaDialogs, $timeout, $ionicLoading, $location) {
        $scope.posicion($location.path());
        var id = $stateParams.reporteId;
        $scope.imagenes = [];
        $scope.ready = false;
        $scope.actual = "";
        $scope.swiper = {};

        $scope.galeria = function() {
            $http.get($scope.server + '/reportes/fotoreporte/list/?reporte=' + id)
                .then(function successCallback(response) {
                    $scope.imagenes = response.data.object_list;
                    if ($scope.imagenes.length > 0) {
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
    .controller('Respuesta', function($scope, $http, $stateParams, $state, $cordovaToast, $timeout, $cordovaDialogs, $ionicLoading, $location, $cordovaVibration) {
        var id = $stateParams.reporteId;
        $scope.respuestas = [];
        $scope.ready = false;
        $scope.ready2 = false;
        $scope.reporte = [];
        $scope.data = {};
        $scope.posicion($location.path());
        $scope.notify.leido();
        $scope.reporteInfo = true;

        $scope.reporte = function() {
            $http.get($scope.server + '/reportes/reporte/list/?id=' + id)
                .then(function doneCallbacks(response) {
                    $scope.reporte = response.data.object_list;
                    $scope.ready2 = true;
                }, function failCallbacks(response) {
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
                                $scope.reporte();
                            });
                        }, 10000);
                    }
                });
        };
        $scope.reporte();

        window.addEventListener('native.keyboardshow', keyboardShowHandler);

        function keyboardShowHandler(e) {
            $(".scrollR").animate({
                'scrollTop': $("#content").height()
            }, 10);
        }

        $scope.onfocus = function() {
            $(".scrollR").animate({
                'scrollTop': $("#content").height()
            }, 10);
        };

        $scope.respuestas = function() {
            $http.get($scope.server + '/reportes/respuesta/list/?reporte=' + id)
                .then(function successCallback(response) {
                    $scope.respuestas = response.data.object_list;
                    $scope.ready = true;
                    $timeout(function() {
                        $scope.onfocus();
                    }, 1000);
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

        $scope.$on('leer', function(event, data) {
            var nuevo = {};
            nuevo.user = data.usuario;
            nuevo.tu = 0;
            nuevo.mensaje = data.mensaje;
            nuevo.fecha = data.fecha;
            $scope.chat(nuevo);
            $scope.onfocus();
            $cordovaVibration.vibrate(500);
            $scope.notify.leido();
        });

        $scope.chat = function(mensaje) {
            $scope.respuestas.push(mensaje);
            $scope.$apply();
        };

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
                mensaje = response.data;
                mensaje.user = $scope.username;
                mensaje.tu = 1;
                $scope.respuestas.push(mensaje);
                $ionicLoading.hide();
                $scope.onfocus();
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
    .controller('Mantenimiento', function($http, $scope, $stateParams, Camera, Galeria, $cordovaImagePicker, $cordovaToast, $state, $cordovaDialogs, $ionicHistory, $timeout, $ionicLoading, $location, $cordovaGeolocation) {
        $scope.posicion($location.path());
        $scope.data = {};
        $scope.imagenes = [];
        $scope.cargando = false;
        $scope.carga = 0;
        $scope.disableEnviar = false;
        Materialize.updateTextFields();

        var id = $stateParams.clienteId;
        $ionicHistory.nextViewOptions({
            disableBack: true
        });
        $scope.back = function() {
            $ionicHistory.goBack(-1);
        };

        $scope.takePicture = function() {
            if ($scope.imagenes.length < 5) {
                var options = {
                    quality: 75,
                    targetWidth: 1280,
                    targetHeight: 720,
                    sourceType: 1
                };
                Camera.getPicture(options).then(function(imageData) {
                    $scope.imagenes.push(imageData);
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


        $scope.getPicture = function() {
            if ($scope.imagenes.length < 5) {
                var options = {
                    quality: 75,
                    targetWidth: 1280,
                    targetHeight: 720,
                    sourceType: 0
                };
                Camera.getPicture(options).then(function(imageData) {
                    $scope.imagenes.push(imageData);
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
                    });
                }, function(error) {
                    console.log('Error: ' + JSON.stringify(error)); // In case of error
                });
        };

        var posOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        $scope.confirmar = function() {
            $cordovaDialogs.confirm('Para realizar el reporte debe activar su gps en Alta presición.', 'Gps', ['Activar GPS', 'Salir'])
                .then(function(result) {
                    if (result === 1) {
                        cordova.plugins.diagnostic.switchToLocationSettings();
                    } else {
                        $ionicHistory.goBack();
                    }
                });
        };

        $scope.tomarUbicacion = function() {
            cordova.plugins.diagnostic.getLocationMode(function(state) {
                if (state == "high_accuracy") {
                    $cordovaGeolocation.getCurrentPosition(posOptions).then(function(pos) {
                        $scope.data.latitud = pos.coords.latitude;
                        $scope.data.longitud = pos.coords.longitude;
                        $cordovaToast.show("Ubicación tomada", 'short', 'center');
                    }, function(error) {
                        $ionicLoading.hide();
                        $cordovaToast.show('No se puede obtener la ubicación, posiblemente el gps este desactivado: ' + error.message, 'Gps', 'short', 'center')
                            .then(function(res) {
                                $scope.confirmar();
                            });
                    });
                } else if (state == "battery_saving") {
                    $scope.confirmar();
                } else if (state == "device_only") {
                    $scope.confirmar();
                } else {
                    $scope.confirmar();
                }
            });
        };
        //Se calcula la ubicación actual
        $scope.tomarUbicacion();

        //Si la aplicacion regresa de un background y verifica si ya se tiene gps, si no se recalcula
        document.addEventListener("resume", function() {
            if ($scope.data.latitud === undefined && $scope.data.longitud === undefined) {
                $scope.tomarUbicacion();
            }
        }, false);

        $scope.enviar = function() {
            $scope.disableEnviar = true;
            if ($scope.data.latitud && $scope.data.longitud) {
                if ($scope.imagenes.length > 0) {
                    $cordovaDialogs.confirm('Esta seguro que quiere enviar?', 'Enviar', ['Si, Enviar!', 'Cancelar'])
                        .then(function(result) {
                            if (result === 1) {
                                $scope.sendData(); //Se formatea la informacion y se envia.
                            } else {
                                $scope.disableEnviar = false;
                            }
                        });
                } else {
                    $cordovaDialogs.confirm('Esta seguro que quiere enviar sin fotos?', 'Fotos', ['Si, Enviar!', 'Tomar Foto'])
                        .then(function(result) {
                            if (result === 1) {
                                $scope.sendData(); //Se envia sin fotos
                            } else {
                                $scope.disableEnviar = false;
                                $scope.takePicture();
                            }
                        });
                }
            } else {
                $cordovaToast.show("No se ha tomado aun la ubicación, por favor espere e intente de nuevo", 'short', 'center').then(function() {
                    $scope.disableEnviar = false;
                });
            }
        };

        $scope.enviarFotos = function(mantenimientoId) {
            function win(r) {
                $scope.cargando = false;
            }

            function fail(error) {
                $cordovaDialogs.alert("Se ha producido un error: Code = " + error.code, 'Error');
            }

            $scope.cargando = true;
            var serve = encodeURI($scope.server + "/mantenimiento/service/foto/form/");
            var options = new FileUploadOptions();
            options.fileKey = "url";
            options.httpMethod = "POST";
            options.params = {
                "mantenimiento": mantenimientoId
            };
            var ft = new FileTransfer();
            ft.onprogress = function(progressEvent) {
                if (progressEvent.lengthComputable) {
                    var num = (progressEvent.loaded / progressEvent.total) * 100;
                    $scope.carga = num.toFixed();
                    if (num === 100) {
                        $scope.cargando = false;
                    }
                }
            };
            $scope.imagenes.forEach(function(imagen, index) {
                $scope.numImage = index + 1;
                options.fileName = imagen.substr(imagen.lastIndexOf('/') + 1);
                ft.upload(imagen, serve, win, fail, options);
            });
        };

        $scope.sendData = function() {
            $scope.loading = $ionicLoading.show({
                template: '<ion-spinner class="spinner-light"></ion-spinner><br/>Guardando...',
            });
            $scope.data.reporte = id;
            $http({
                method: 'POST',
                url: $scope.server + '/mantenimiento/service/mantanimiento/form/',
                data: $.param($scope.data),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
            }).then(function doneCallbacks(response) {
                $ionicLoading.hide();
                $scope.disableEnviar = false;
                $scope.enviarFotos(response.data.id);
                $cordovaToast.show("Guardando exitoso", 'long', 'center')
                    .then(function(success) {
                        $state.go('app.historialM', {
                            clienteId: id,
                            actual: response.data.id
                        });
                    });
            }, function failCallbacks(response) {
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
                if (response.status === 400) {
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
                    if (data.tipo) {
                        $cordovaToast.show("Tipo:" + data.tipo[0], 'short', 'center');
                    }
                    if (data.reporte) {
                        $cordovaToast.show("Reporte:" + data.reporte[0], 'short', 'center');
                    }
                } else if (response.status == 500) {
                    $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
                } else {
                    $timeout(function() {
                        $cordovaToast.show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center').then(function(success) {
                            $scope.sendData();
                        });
                    }, 5000);
                }
                $scope.disableEnviar = false;
            });
        };
    })
    .controller('HistorialM', function($scope, $http, $state, $cordovaToast, $timeout, $cordovaDialogs, $location, $stateParams, $rootScope, $ionicHistory) {
        $scope.posicion($location.path());
        $scope.search = "";
        $scope.noMoreItemsAvailable = false;
        $scope.lista = [];
        $scope.actual = $stateParams.actual;
        $scope.notify.leido();

        var num = 1,
            max = 0,
            id = $stateParams.clienteId,
            url = '';
        if (id === '0') {
            url = '/mantenimiento/service/mantanimiento/list/?';
        } else {
            url = '/mantenimiento/service/mantanimiento/list/?reporte=' + id + '&';
        }

        $scope.loadMore = function() {
            $http.get($scope.server + url + 'page=' + num + "&search=" + $scope.search)
                .then(function successCallback(response) {
                    var data = response.data.object_list;
                    if (response.data.num_rows === 0) {
                        $cordovaToast.show('No se han encontrado resultados.', 'short', 'center')
                            .then(function() {
                                $ionicHistory.goBack(-1);
                            });
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

        $scope.reload2 = function() {
            $scope.lista = [];
            num = 1;
            max = 0;
            $scope.noMoreItemsAvailable = false;
            $scope.loadMore();
        };
    })
    .controller('GaleriaM', function($http, $scope, $stateParams, $cordovaToast, $state, $cordovaDialogs, $location, $timeout, $ionicLoading) {
        var id = $stateParams.mantenimientoId;
        $scope.imagenes = [];
        $scope.ready = false;
        $scope.actual = "";
        $scope.swiper = {};
        $scope.posicion($location.path());

        $scope.galeria = function() {
            $http.get($scope.server + '/mantenimiento/service/fotomantenimiento/list/?mantenimiento=' + id)
                .then(function successCallback(response) {
                    $scope.imagenes = response.data.object_list;
                    if ($scope.imagenes.length > 0) {
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
    .controller('PiscinaAsignacion', function($scope, $stateParams, $http, $cordovaToast, $ionicLoading, $state, $cordovaDialogs, $timeout, $location) {
        var id = $stateParams.piscineroId;
        $scope.piscinas = [];
        $scope.checkes = [];
        $scope.data = {};
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
            $scope.data.piscina = piscinaID;
            $scope.data.piscinero = id;
            if (obj.check) {
                $scope.data.asigna = 'True';
            } else {
                $scope.data.asigna = '';
            }

            $scope.asignando = function() {
                $scope.loading = $ionicLoading.show({
                    template: '<ion-spinner class="spinner-light"></ion-spinner><br/>Guardando cambios...',
                    noBackdrop: true
                });
                $http({
                    method: 'POST',
                    url: $scope.server + '/usuarios/service/asignacion/form/piscinero/',
                    data: $.param($scope.data),
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                }).then(function doneCallbacks(response) {
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
                                $state.go('app.login');
                            });
                    }
                    if (response.status == 400) {
                        if (obj.check) {
                            obj.check = false;
                        } else {
                            obj.check = true;
                        }
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
                            $scope.reload();
                        }
                    } else if (response.status == 500) {
                        $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
                    } else {
                        $timeout(function() {
                            $cordovaToast.show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center').then(function(success) {
                                $scope.asignando(obj);
                            });
                        }, 10000);
                    }
                });
            };
            $scope.asignando();
        };

    })
    .controller('Ruta', function($scope, $http, $cordovaToast, $cordovaDialogs, $timeout, $ionicLoading, $state, $location, $stateParams, $ionicModal, $cordovaGeolocation) {
        $scope.noMoreItemsAvailable = false;
        $scope.items = [];
        $scope.asignacion = {};
        $scope.planilla = {};
        $scope.piscina = null;
        $scope.pkPlanilla = null;
        $scope.data = {};
        $scope.dataRespuesta = {};
        $scope.disableEnviar = false;
        var num = 1,
            max = 0,
            bandera = false,
            bandera2 = false,
            url = null;
        $scope.posicion($location.path());
        $scope.actual = $stateParams.actual;
        $scope.loadMore = function() {
            $http.get($scope.server + '/usuarios/service/list/asignaciones/?page=' + num + '&asigna=true')
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

        $scope.traerPlanilla = function() {
            $scope.loading = $ionicLoading.show({
                template: '<ion-spinner class="spinner-light"></ion-spinner><br/>Cargando...',
                noBackdrop: true
            });
            $http.get($scope.server + '/actividades/planilladiaria/list/?pk=' + $scope.pkPlanilla)
                .then(function doneCallbacks(response) {
                    $ionicLoading.hide();
                    $scope.data = response.data.object_list[0];
                    if ($scope.data.aumento_ph) {
                        $scope.data.ph = true;
                    } else {
                        $scope.data.ph = false;
                    }
                    $scope.modal.show();
                    angular.element(document).ready(function() {
                        Materialize.updateTextFields();
                    });
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
                                $scope.traerPlanilla();
                            });
                        }, 10000);
                    }
                });
        };
        $scope.reload = function() {
            num = 1;
            max = 0;
            $scope.noMoreItemsAvailable = false;
            $scope.items = [];
            $scope.$broadcast('scroll.refreshComplete');
        };

        $ionicModal.fromTemplateUrl('templates/planillaModal.html', {
            scope: $scope,
            animation: 'fade-g'
        }).then(function(modal) {
            $scope.modal = modal;
        });

        $scope.cerrarModal = function() {
            $scope.modal.hide();
            bandera = false;
            bandera2 = false;
            $scope.data = {};
        };

        $scope.$on('$destroy', function() {
            $scope.modal.remove();
        });

        $scope.confirmar = function() {
            $cordovaDialogs.confirm('Para realizar el reporte debe activar su gps en Alta presición.', 'Gps', ['Activar GPS', 'Salir'])
                .then(function(result) {
                    if (result === 1) {
                        cordova.plugins.diagnostic.switchToLocationSettings();
                    } else {
                        $ionicHistory.goBack();
                    }
                });
        };

        var posOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        $scope.tomarUbicacion = function() {
            cordova.plugins.diagnostic.getLocationMode(function(state) {
                if (state == "high_accuracy") {
                    $cordovaGeolocation.getCurrentPosition(posOptions).then(function(pos) {
                        $scope.data.latitud = pos.coords.latitude;
                        $scope.data.longitud = pos.coords.longitude;
                        $cordovaToast.show("Ubicación tomada", 'short', 'center');
                    }, function(error) {
                        $ionicLoading.hide();
                        $cordovaToast.show('No se puede obtener la ubicación, posiblemente el gps este desactivado: ' + error.message, 'Gps', 'short', 'center')
                            .then(function(res) {
                                $scope.confirmar();
                            });
                    });
                } else if (state == "battery_saving") {
                    $scope.confirmar();
                } else if (state == "device_only") {
                    $scope.confirmar();
                } else {
                    $scope.confirmar();
                }
            });
        };

        //Si la aplicacion regresa de un background y verifica si ya se tiene gps, si no se recalcula
        document.addEventListener("resume", function() {
            if ($scope.data.latitud === undefined && $scope.data.longitud === undefined && bandera) {
                $scope.tomarUbicacion();
            }
        }, false);

        $scope.abrirModal = function(item) {
            //Se calcula la ubicación actual
            $scope.tomarUbicacion();
            bandera = true;
            $scope.modal.show();
            $scope.data.piscina = item.piscina;
            $scope.piscina = item.nombreP;
            $scope.asignacion = item;
            Materialize.updateTextFields();
        };

        $scope.editarPlanilla = function(item) {
            bandera2 = true;
            $scope.asignacion = item;
            $scope.pkPlanilla = item.planilla;
            $scope.piscina = item.nombreP;
            $scope.traerPlanilla();
        };

        $scope.enviar = function() {
            $scope.disableEnviar = true;
            if ($scope.data.latitud && $scope.data.longitud) {
                $cordovaDialogs.confirm('Esta seguro que quiere enviar?', 'Enviar', ['Si, Enviar!', 'Cancelar'])
                    .then(function(result) {
                        if (result === 1) {
                            if ($scope.data.ph) {
                                $scope.data.aumento_ph = true;
                                $scope.data.disminucion_ph = "";
                            } else {
                                $scope.data.disminucion_ph = true;
                                $scope.data.aumento_ph = "";
                            }
                            $scope.enviando(); //Se formatea la informacion y se envia.
                        }
                    });
            } else {
                $cordovaToast.show("No se ha tomado aun la ubicación, por favor espere e intente de nuevo", 'short', 'center').then(function() {
                    $scope.disableEnviar = false;
                });
            }
        };

        $scope.enviando = function() {
            $scope.loading = $ionicLoading.show({
                template: '<ion-spinner class="spinner-light"></ion-spinner><br/>Enviando...',
                noBackdrop: true
            });
            if (bandera2) {
                url = "/actividades/planilladiaria/edit/form/" + $scope.pkPlanilla + '/';
            } else {
                url = "/actividades/planilladiaria/form/";
            }
            $http({
                method: 'POST',
                url: $scope.server + url,
                data: $.param($scope.data),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
            }).then(function doneCallbacks(response) {
                $scope.cerrarModal();
                $scope.disableEnviar = false;
                $ionicLoading.hide();
                bandera2 = false;
                $scope.asignacion.planilla = response.data.id;
                if (response.data.espera === true) {
                    $scope.asignacion.espera = 1;
                } else {
                    $scope.asignacion.espera = null;
                }
                $cordovaToast.show("Enviado exitoso", 'long', 'center');
            }, function failCallbacks(response) {
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
                if (response.status === 400) {
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
                    $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
                } else {
                    $timeout(function() {
                        $cordovaToast.show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center').then(function(success) {
                            $scope.enviando();
                        });
                    }, 5000);
                }
                $scope.disableEnviar = false;
            });
        };

        $scope.tomarUbicacion2 = function() {
            $scope.loading = $ionicLoading.show({
                template: '<ion-spinner class="spinner-light"></ion-spinner><br/>Tomando Ubicación...',
                noBackdrop: true
            });
            cordova.plugins.diagnostic.getLocationMode(function(state) {
                if (state == "high_accuracy") {
                    $cordovaGeolocation.getCurrentPosition(posOptions).then(function(pos) {
                        $scope.dataRespuesta.latitud = pos.coords.latitude;
                        $scope.dataRespuesta.longitud = pos.coords.longitude;
                        $scope.dataRespuesta.nombre = "Salida de piscina " + $scope.planilla.nombreP;
                        $scope.dataRespuesta.descripcion = "Actividad de mantenimiento finalizada en la piscina " + $scope.planilla.nombreP + " del cliente " + $scope.planilla.nombreCF + " " + $scope.planilla.nombreCL;
                        $ionicLoading.hide();
                        $cordovaToast.show("Ubicación tomada", 'short', 'center').then(function(success) {
                            $cordovaDialogs.confirm('Esta seguro que quiere indicar que ya salio?', 'Enviar', ['Si, Enviar!', 'Cancelar'])
                                .then(function(result) {
                                    if (result === 1) {
                                        $scope.enviandoEdit(); //Se formatea la informacion y se envia.
                                    }
                                });
                        });
                    }, function(error) {
                        $cordovaToast.show('No se puede obtener la ubicación, posiblemente el gps este desactivado: ' + error.message, 'Gps', 'short', 'bottom')
                            .then(function(res) {
                                $scope.confirmar();
                            });
                    });
                } else if (state == "battery_saving") {
                    $scope.confirmar();
                } else if (state == "device_only") {
                    $scope.confirmar();
                } else {
                    $scope.confirmar();
                }
            });
        };


        $scope.enviarEdit = function(item) {
            $scope.planilla = item;
            $scope.tomarUbicacion2();
            document.addEventListener("resume", function() {
                if ($scope.dataRespuesta.latitud === undefined && $scope.dataRespuesta.longitud === undefined) {
                    $scope.tomarUbicacion2();
                }
            }, false);
        };

        $scope.enviandoEdit = function() {
            var planilla = {};
            planilla.salida = true;
            $scope.loading = $ionicLoading.show({
                template: '<ion-spinner class="spinner-light"></ion-spinner><br/>Registrando Salida...',
                noBackdrop: true
            });
            $http({
                method: 'POST',
                url: $scope.server + '/actividades/planilladiaria/form/' + $scope.planilla.planilla + '/',
                data: $.param(planilla),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
            }).then(function doneCallbacks(response) {
                $ionicLoading.hide();
                $scope.planilla.salida = true;
                $scope.enviarInforme();
            }, function failCallbacks(response) {
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
                if (response.status === 400) {
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
                    $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
                } else {
                    $timeout(function() {
                        $cordovaToast.show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center').then(function(success) {
                            $scope.enviando();
                        });
                    }, 5000);
                }
            });
        };

        $scope.enviarInforme = function() {
            $scope.loading = $ionicLoading.show({
                template: '<ion-spinner class="spinner-light"></ion-spinner><br/>Enviando informe...',
                noBackdrop: true
            });
            $http({
                method: 'POST',
                url: $scope.server + '/reportes/reporte/informativo/form/',
                data: $.param($scope.dataRespuesta),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
            }).then(function doneCallbacks(response) {
                $ionicLoading.hide();
                $cordovaToast.show("Operación finalizada", 'long', 'center');
            }, function failCallbacks(response) {
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
                if (response.status === 400) {
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
                } else if (response.status == 500) {
                    $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
                } else {
                    $timeout(function() {
                        $cordovaToast.show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center').then(function(success) {
                            $scope.sendData();
                        });
                    }, 5000);
                }
            });
        };
    })

.controller('HistorialIn', function($scope, $rootScope, $http, $state, $location, $cordovaToast, $timeout, $cordovaDialogs, $cordovaGeolocation, $ionicModal, $ionicLoading) {
        $scope.posicion($location.path());
        $scope.search = "";
        $scope.noMoreItemsAvailable = false;
        $scope.actual = 0;
        var num = 1,
            max = 0,
            url = '';
        $scope.reportes = [];
        $scope.disableEnviar = false;
        $scope.data = {};

        $scope.loadMore = function() {
            $http.get($scope.server + "/reportes/reporte/informativo/list/?" + 'page=' + num + "&search=" + $scope.search)
                .then(function successCallback(response) {
                    var data = response.data.object_list;
                    if (response.data.num_rows === 0) {
                        $cordovaToast.show('No se han encontrado resultados.', 'short', 'center');
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

        $scope.reload2 = function() {
            $scope.reportes = [];
            num = 1;
            max = 0;
            $scope.noMoreItemsAvailable = false;
            $scope.loadMore();
        };

        //Modal para enviar reporte informativo
        $ionicModal.fromTemplateUrl('templates/reporteI.html', {
            scope: $scope,
            animation: 'fade-g'
        }).then(function(modal) {
            $scope.modal = modal;
        });

        $scope.cerrarModal = function() {
            $scope.modal.hide();
        };

        $scope.$on('$destroy', function() {
            $scope.modal.remove();
        });

        $scope.abrirModal = function() {
            $scope.modal.show();
            $scope.tomarUbicacion();
            Materialize.updateTextFields();
            document.addEventListener("resume", function() {
                if ($scope.data.latitud === undefined && $scope.data.longitud === undefined) {
                    $scope.tomarUbicacion();
                }
            }, false);
        };

        function arraymove(arr, fromIndex, toIndex) {
            var element = arr[fromIndex];
            arr.splice(fromIndex, 1);
            arr.splice(toIndex, 0, element);
        }

        var posOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        $scope.confirmar = function() {
            $cordovaDialogs.confirm('Para realizar el reporte debe activar su gps en Alta presición.', 'Gps', ['Activar GPS', 'Salir'])
                .then(function(result) {
                    if (result === 1) {
                        cordova.plugins.diagnostic.switchToLocationSettings();
                    } else {
                        $scope.cerrarModal();
                    }
                });
        };

        $scope.tomarUbicacion = function() {
            cordova.plugins.diagnostic.getLocationMode(function(state) {
                if (state == "high_accuracy") {
                    $cordovaGeolocation.getCurrentPosition(posOptions).then(function(pos) {
                        $scope.data.latitud = pos.coords.latitude;
                        $scope.data.longitud = pos.coords.longitude;
                        $cordovaToast.show("Ubicación tomada", 'short', 'center');
                    }, function(error) {
                        $cordovaToast.show('No se puede obtener la ubicación, posiblemente el gps este desactivado: ' + error.message, 'Gps', 'short', 'center')
                            .then(function(res) {
                                $scope.confirmar();
                            });
                    });
                } else if (state == "battery_saving") {
                    $scope.confirmar();
                } else if (state == "device_only") {
                    $scope.confirmar();
                } else {
                    $scope.confirmar();
                }
            });
        };

        $scope.enviar = function() {
            $scope.disableEnviar = true;
            if ($scope.data.latitud && $scope.data.longitud) {
                $cordovaDialogs.confirm('Esta seguro que quiere enviar?', 'Enviar', ['Si, Enviar!', 'Cancelar'])
                    .then(function(result) {
                        if (result === 1) {
                            $scope.sendData(); //Se formatea la informacion y se envia.
                        } else {
                            $scope.disableEnviar = false;
                        }
                    });
            } else {
                $cordovaToast.show("No se ha tomado aun la ubicación, por favor espere e intente de nuevo", 'short', 'center');
            }
        };

        $scope.sendData = function() {
            $scope.loading = $ionicLoading.show({
                template: '<ion-spinner class="spinner-light"></ion-spinner><br/>Enviando...',
                noBackdrop: true
            });
            $http({
                method: 'POST',
                url: $scope.server + '/reportes/reporte/informativo/form/',
                data: $.param($scope.data),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
            }).then(function doneCallbacks(response) {
                $ionicLoading.hide();
                $cordovaToast.show("Guardando exitoso", 'long', 'center')
                    .then(function(success) {
                        $scope.actual = response.data.id;
                        $scope.reportes.push(response.data);
                        arraymove($scope.reportes, $scope.reportes.indexOf(response.data), 0);
                        $scope.cerrarModal();
                    });
            }, function failCallbacks(response) {
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
                if (response.status === 400) {
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
                } else if (response.status == 500) {
                    $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
                } else {
                    $timeout(function() {
                        $cordovaToast.show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center').then(function(success) {
                            $scope.sendData();
                        });
                    }, 5000);
                }
                $scope.disableEnviar = false;
            });
        };
    })
    .controller('Planilla', function($http, $scope, $ionicHistory, $cordovaDialogs, $timeout, $cordovaToast, $state, $location, $ionicLoading, $stateParams, $cordovaGeolocation) {
        $scope.posicion($location.path());
        $scope.data = {};
        $scope.ready = false;
        $scope.piscinas = [];
        $scope.disableEnviar = false;

        var id = $stateParams.clienteId;
        //Angular Document Ready
        Materialize.updateTextFields();
        $scope.back = function() {
            $ionicHistory.goBack(-1);
        };

        $scope.piscinas = function() {
            $http.get($scope.server + '/usuarios/service/list/piscina/planilla/?casa__cliente=' + id)
                .then(function successCallback(response) {
                    $scope.piscinas = response.data.object_list;
                    if (response.data.num_rows === 0) {
                        $cordovaDialogs.alert('La planilla diaria de la(s) piscina(s) de este cliente ya ha sido deligenciada(s).', 'Planilla no disponible').
                        then(function() {
                            $ionicHistory.goBack(-1);
                        });
                    } else {
                        $scope.tomarUbicacion();
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

        var posOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        $scope.confirmar = function() {
            $cordovaDialogs.confirm('Para realizar el reporte debe activar su gps en Alta presición.', 'Gps', ['Activar GPS', 'Salir'])
                .then(function(result) {
                    if (result === 1) {
                        cordova.plugins.diagnostic.switchToLocationSettings();
                    } else {
                        $ionicHistory.goBack();
                    }
                });
        };

        $scope.tomarUbicacion = function() {
            cordova.plugins.diagnostic.getLocationMode(function(state) {
                if (state == "high_accuracy") {
                    $cordovaGeolocation.getCurrentPosition(posOptions).then(function(pos) {
                        $scope.data.latitud = pos.coords.latitude;
                        $scope.data.longitud = pos.coords.longitude;
                        $cordovaToast.show("Ubicación tomada", 'short', 'center');
                    }, function(error) {
                        $ionicLoading.hide();
                        $cordovaToast.show('No se puede obtener la ubicación, posiblemente el gps este desactivado: ' + error.message, 'Gps', 'short', 'center')
                            .then(function(res) {
                                $scope.confirmar();
                            });
                    });
                } else if (state == "battery_saving") {
                    $scope.confirmar();
                } else if (state == "device_only") {
                    $scope.confirmar();
                } else {
                    $scope.confirmar();
                }
            });
        };

        //Si la aplicacion regresa de un background y verifica si ya se tiene gps, si no se recalcula
        document.addEventListener("resume", function() {
            if ($scope.data.latitud === undefined && $scope.data.longitud === undefined) {
                $scope.tomarUbicacion();
            }
        }, false);

        $scope.enviar = function() {
            $scope.disableEnviar = true;
            if ($scope.data.latitud && $scope.data.longitud) {
                $cordovaDialogs.confirm('Esta seguro que quiere enviar?', 'Enviar', ['Si, Enviar!', 'Cancelar'])
                    .then(function(result) {
                        if (result === 1) {
                            if ($scope.data.ph) {
                                $scope.data.aumento_ph = true;
                                $scope.data.disminucion_ph = "";
                            } else {
                                $scope.data.disminucion_ph = true;
                                $scope.data.aumento_ph = "";
                            }
                            $scope.enviando(); //Se formatea la informacion y se envia.
                        } else {
                            $scope.disableEnviar = false;
                        }
                    });
            } else {
                $cordovaToast.show("No se ha tomado aun la ubicación, por favor espere e intente de nuevo", 'short', 'center').then(function() {
                    $scope.disableEnviar = false;
                });
            }
        };

        $scope.enviando = function() {
            $scope.loading = $ionicLoading.show({
                template: '<ion-spinner class="spinner-light"></ion-spinner><br/>Enviando...',
                noBackdrop: true
            });
            $http({
                method: 'POST',
                url: $scope.server + '/actividades/planilladiaria/form/',
                data: $.param($scope.data),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
            }).then(function doneCallbacks(response) {
                $scope.data = {};
                $ionicLoading.hide();
                $scope.disableEnviar = false;
                $cordovaToast.show("Enviado exitoso", 'long', 'center');
                $scope.back();
            }, function failCallbacks(response) {
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
                if (response.status === 400) {
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
                    $cordovaDialogs.alert("Hay un problema en el servidor, por favor contáctese con el administrador.", 'Error');
                } else {
                    $timeout(function() {
                        $cordovaToast.show('El servicio esta tardando en responder. Estamos Reconectando.', 'short', 'center').then(function(success) {
                            $scope.enviando();
                        });
                    }, 5000);
                }
                $scope.disableEnviar = false;
            });
        };
    })
    .controller('Notificaciones', function($scope, $state) {

        $scope.notificar = function(mensaje) {
            var data = mensaje.data.data;
            $scope.notify.visit([mensaje._id], function() {
                if (data.tipo == "Reporte") {
                    $state.go('app.historialR', {
                        clienteId: data.cliente_id,
                        actual: data.reporte_id
                    }, {
                        reload: true
                    });
                } else if (data.tipo == "Respuesta") {
                    $state.go('app.respuestas', {
                        reporteId: data.reporte_id
                    }, {
                        reload: true
                    });
                } else if (data.tipo === "Recordatorio") {
                    $state.go('app.historialR', {
                        clienteId: 0,
                        actual: data.reporte_id
                    }, {
                        reload: true
                    });
                } else if (data.tipo === "Solucion") {
                    $state.go('app.historialM', {
                        clienteId: data.reporte_id,
                        actual: data.solucion_id
                    }, {
                        reload: true
                    });
                } else if (data.tipo === "Asignacion") {
                    $state.go('app.ruta', {
                        actual: data.asignacion_id
                    }, {
                        reload: true
                    });
                }
            });
        };
    })
    .controller('Calendario', function($scope, $http, $cordovaDialogs, $cordovaToast, $cordovaDatePicker) {
        $scope.eventos = [];
        $scope.starts = new Date();
        $scope.ends = $scope.starts;
        $scope.ready = false;
        var mes1 = $scope.starts.getMonth() + 1;
        var mes2 = null;
        var starts = $scope.starts.getFullYear() + "-" + mes1 + "-" + $scope.starts.getDate();
        var ends = starts;

        $scope.eventosDelDia = function() {
            $http.get($scope.server + '/notificaciones/calendar/?start=' + starts + "&end=" + ends)
                .then(function doneCallbacks(response) {
                    $scope.eventos = response.data;
                    $scope.ready = true;
                }, function failCallbacks(response) {
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
                                $scope.eventosDelDia();
                            });
                        }, 10000);
                    }
                });
        };

        $scope.eventosDelDia();

        $scope.reload = function() {
            if ($scope.starts !== null && $scope.ends !== null) {
                $scope.ready = false;
                mes1 = $scope.starts.getMonth() + 1;
                mes2 = $scope.ends.getMonth() + 1;
                starts = $scope.starts.getFullYear() + "-" + mes1 + "-" + $scope.starts.getDate();
                ends = $scope.ends.getFullYear() + "-" + mes2 + "-" + $scope.ends.getDate();
                $scope.eventos = [];
                $scope.eventosDelDia();
            } else {
                $cordovaDialogs.alert("Debe llenar los dos campos de fechas", "Campos requeridos");
            }
        };
    })
    .controller('Alarma', function($scope, $ionicModal, $cordovaDialogs, $ionicLoading, $cordovaToast) {
        $scope.data = {};
        $scope.alarmas = [];
        $scope.disabled = false;
        $scope.loading = $ionicLoading.show({
            template: '<ion-spinner class="spinner-light"></ion-spinner><br/>Cargando...',
            noBackdrop: true
        });
        $scope.notify.showAlarm("piscinero", $scope.username);
        $ionicLoading.hide();

        $scope.$on('lista-alarmas', function(event, data){
          $scope.alarmas = data;
          $scope.$apply();
        });

        $ionicModal.fromTemplateUrl('templates/newAlarm.html', {
            scope: $scope,
            animation: 'fade-g'
        }).then(function(modal) {
            $scope.modal = modal;
        });

        $scope.cerrarModal = function() {
            $scope.modal.hide();
        };

        $scope.$on('$destroy', function() {
            $scope.modal.remove();
        });


        $scope.abrirModa = function() {
            $scope.modal.show();
            Materialize.updateTextFields();
        };

        function calcDiferencia(date1, date2) {
            if (date2 < date1) {
                date2.setDate(date2.getDate() + 1);
            }
            var diff = date2 - date1;
            console.log(diff/60000);
            return diff;
        }

        function completar(num){
            if(num>=0 && num<=9){
              return "0"+num;
            }else{
              return num;
            }
        }

        $scope.enviar = function() {
            $scope.disabled = true;
            var now = new Date();
            var time = new Date();
            time.setHours($scope.data.time.getHours());
            time.setMinutes($scope.data.time.getMinutes());
            var hora = completar($scope.data.time.getHours())+":"+completar($scope.data.time.getMinutes());
            if (time > now) {
                $scope.modal.hide();
                $scope.loading = $ionicLoading.show({
                    template: '<ion-spinner class="spinner-light"></ion-spinner><br/>Guardando...',
                    noBackdrop: true
                });

                $scope.notify.alarma(calcDiferencia(now, time), "piscinero", $scope.username, $scope.data.mensaje, hora);
                $scope.notify.showAlarm("piscinero", $scope.username);
                $ionicLoading.hide();
                $cordovaToast.show("Recordatorio programado", 'short', 'center');
                $scope.data = {};
            } else {
                $scope.data.time = "";
                $scope.disabled = false;
                $cordovaDialogs.alert("La hora del recordatorio debe ser mayor a la actual", "Hora");
            }

        };
    });
