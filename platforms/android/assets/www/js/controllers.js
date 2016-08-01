angular.module('starter.controllers', [])

.controller('AppCtrl', function($http, $scope, $state, $cordovaDialogs, $cordovaToast, $timeout, notix, $cordovaLocalNotification) {
    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionic+-View.enter event:
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
                url: $scope.server + '/usuarios/login/supervisor/',
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
.controller('InfoC', function($http, $scope, $stateParams, $state, $timeout, $cordovaToast, $ionicLoading, $ionicHistory, $cordovaDialogs, $location, $ionicModal, Camera) {
    var id = $stateParams.clienteId;
    $scope.posicion($location.path());
    $scope.dataReady = false;
    $scope.infoPiscina = null;
    $scope.noFoto = "img/camera_alt.svg";
    $scope.change = false;
    $scope.edit = false;

    $scope.single = function() {
        $http.get($scope.server + '/usuarios/single/cliente/' + id + '/')
            .then(function successCallback(response) {
                $scope.info = response.data;
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
        $scope.modal2.remove();
    });

    $scope.abrirModal = function(piscina) {
        $scope.modal.show();
        $scope.infoPiscina = piscina;
        if ($scope.infoPiscina.imagen === null) {
            $scope.change = true;
            $scope.edit = true;
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

    $scope.takePicture = function(piscina) {
        var options = {
            quality: 75,
            targetWidth: 1280,
            targetHeight: 720,
            sourceType: 1
        };
        Camera.getPicture(options).then(function(imageData) {
            $scope.enviarFotos(piscina, imageData);
        }, function(err) {
            console.log("Error", err);
        });
    };

    $scope.enviarFotos = function(piscina, imagen) {
        function win(r) {
            $scope.noFoto = imagen;
            $scope.change = true;
            $ionicLoading.hide();
            $cordovaToast.show("Subida exitosa", 'short', 'center');
        }

        function fail(error) {
            $cordovaDialogs.alert("Se ha producido un error: Code = " + error.code, 'Error');
        }

        $scope.loading = $ionicLoading.show({
            template: '<ion-spinner class="spinner-light"></ion-spinner><br/>Subiendo...',
        });
        var serve = encodeURI($scope.server + "/usuarios/service/form/piscina/" + piscina + "/");
        var options = new FileUploadOptions();
        options.fileKey = "imagen";
        options.httpMethod = "POST";
        var ft = new FileTransfer();
        options.fileName = imagen.substr(imagen.lastIndexOf('/') + 1);
        ft.upload(imagen, serve, win, fail, options);
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
        $scope.disableEnviar = false;
        $scope.max = 0;
        var id = $stateParams.clienteId;
        //Angular Document Ready
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
        /*
            Obteniendo el gps.
        */

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

        $scope.count = function() {
            $scope.max += 1;
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
                                $scope.takePicture();
                                $scope.disableEnviar = false;
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
            nuevo = {},
            url = '';
        $scope.reportes = [];
        if (id === '0') {
            url = '/reportes/reporte/list/?';
        } else {
            url = '/reportes/reporte/list/?piscina__casa__cliente=' + id + '&';
        }

        $scope.loadMore = function() {
            $http.get($scope.server + url + 'page=' + num)
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

        function arraymove(arr, fromIndex, toIndex) {
            var element = arr[fromIndex];
            arr.splice(fromIndex, 1);
            arr.splice(toIndex, 0, element);
        }

        $scope.$on('leer', function(event, data) {
            console.log("Reporte");
            console.log(data);
            nuevo.nombre = data.nombre;
            nuevo.nombreC = data.cliente;
            nuevo.apellidosC = "";
            nuevo.descripcion = data.descripcion;
            nuevo.fecha = data.fecha;
            nuevo.user = data.usuario;
            nuevo.estado = data.estado;
            nuevo.piscina__nombre = data.piscina;
            nuevo.tipo_n = data.tipo_n;
            nuevo.cierre = data.cierre;
            nuevo.id = data.reporte_id;
            $scope.actual = data.reporte_id;
            $scope.reportes.push(nuevo);
            arraymove($scope.reportes, $scope.reportes.indexOf(nuevo), 0);
            $scope.notify.leido();
            $scope.$apply();
        });

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

        function keyboardShowHandler(e){
            $(".scrollR").animate({'scrollTop': $("#content").height()}, 10);
        }
      /*
        window.addEventListener('native.keyboardhide', keyboardHideHandler);

        function keyboardHideHandler(e){
            $scope.reporteInfo = true;
        }
      */
        $scope.onfocus = function() {
            $(".scrollR").animate({'scrollTop': $("#content").height()}, 10);
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
        $scope.tipos = [];
        $scope.cargando = false;
        $scope.carga = 0;
        $scope.disableEnviar = false;
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
            console.log("Resume");
            console.log($scope.data.latitud);
            console.log($scope.data.longitud);
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
                                $scope.takePicture();
                                $scope.disableEnviar = false;
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
            nuevo = {},
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
                        $cordovaDialogs.alert('No se han encontrado resultados.', 'Información')
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

        $scope.reload2 = function() {
            $scope.lista = [];
            num = 1;
            max = 0;
            $scope.noMoreItemsAvailable = false;
            $scope.loadMore();
        };

        function arraymove(arr, fromIndex, toIndex) {
            var element = arr[fromIndex];
            arr.splice(fromIndex, 1);
            arr.splice(toIndex, 0, element);
        }

        $scope.$on('leer', function(event, data) {
            nuevo.nombre = data.nombre;
            nuevo.nombreC = data.cliente;
            nuevo.apellidosC = "";
            nuevo.descripcion = data.descripcion;
            nuevo.fecha = data.fecha;
            nuevo.user = data.emisor;
            nuevo.reporte__nombre = data.reporte;
            nuevo.id = data.solucion_id;
            $scope.actual = data.solucion_id
            $scope.lista.push(nuevo);
            arraymove($scope.lista, $scope.lista.indexOf(nuevo), 0);
            $scope.notify.leido();
            $scope.$apply();
      });
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
    .controller('MapCtrl', function($scope, $ionicHistory, $ionicLoading, $stateParams, $cordovaGeolocation, $cordovaDialogs, $timeout, $http, $cordovaToast, $state, $location) {
        var latitud = $stateParams.latitud,
            longitud = $stateParams.longitud,
            id = $stateParams.casaId,
            marker = null;
        var posOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };
        $scope.Ready = true;
        $scope.posicion($location.path());

        $scope.confirmar = function() {
            $cordovaDialogs.confirm('Esta aplicación solo funciona con el gps en Alta presición.', 'Gps', ['Activar GPS', 'Salir'])
                .then(function(result) {
                    if (result === 1) {
                        cordova.plugins.diagnostic.switchToLocationSettings();
                    } else {
                        $ionicHistory.goBack();
                    }
                });
        };

        $scope.validar = function(metodo) {
            if (longitud === "" && latitud === "") {
                $cordovaDialogs.confirm('No hay ningún gps asignado.', 'Gps', ['Asignar gps', 'Cancelar'])
                    .then(function(res) {
                        if (res === 1) {
                            $scope.centerOnMe();
                        }
                    });
            } else {
                if (metodo) {
                    metodo();
                }
            }
        };

        $scope.mapCreated = function(map) {
            $scope.map = map;
            $scope.validar(function() {
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
                marker.addListener('click', function() {
                    infowindow.open($scope.map, marker);
                });
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

            cordova.plugins.diagnostic.getLocationMode(function(state) {
                if (state == "high_accuracy") {
                    $cordovaGeolocation.getCurrentPosition(posOptions).then(function(pos) {
                        latitud = pos.coords.latitude;
                        longitud = pos.coords.longitude;
                        $scope.colocarMarker(latitud, longitud);
                        $ionicLoading.hide();
                    }, function(error) {
                        $ionicLoading.hide();
                        $cordovaToast.show('No se puede obtener la ubicación, posiblemente el gps este desactivado: ' + error.message, 'Gps', 'short', 'center')
                            .then(function(res) {
                                $scope.confirmar();
                            });
                    });
                } else if (state == "battery_saving") {
                    $ionicLoading.hide();
                    $scope.confirmar();
                } else if (state == "device_only") {
                    $ionicLoading.hide();
                    $scope.confirmar();
                } else {
                    $ionicLoading.hide();
                    $scope.confirmar();
                }
            });
        };

        $scope.guardar = function() {
            $scope.validar(function() {
                $scope.enviando = $ionicLoading.show({
                    template: '<ion-spinner class="spinner-light"></ion-spinner><br/>Enviando...',
                    noBackdrop: true
                });
                var data = {};
                data.latitud = latitud;
                data.longitud = longitud;
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

    $scope.loadMore = function() {
        $http.get($scope.server + '/usuarios/service/list/piscinero/?page=' + num + "&search=" + $scope.search)
            .then(function successCallback(response) {
                var data = response.data.object_list;
                if (response.data.num_rows === 0) {
                    $cordovaToast.show('No se han encontrado resultados.', 'short', 'center');
                }
                data.forEach(function(data) {
                    if (data.imagen === "") {
                        data.imagen = "";
                    }
                    if (data.imagen === null) {
                        data.imagen = "";
                    }
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
        num = 1;
        max = 0;
        $scope.noMoreItemsAvailable = false;
        $scope.piscineros = [];
        $scope.$broadcast('scroll.refreshComplete');
    };

    $scope.reload2 = function() {
        num = 1;
        max = 0;
        $scope.noMoreItemsAvailable = false;
        $scope.piscineros = [];
        $scope.loadMore();
    };
})

.controller('PiscinaAsignacion', function($scope, $stateParams, $http, $cordovaToast, $ionicLoading, $state, $cordovaDialogs, $timeout, $location) {
        var id = $stateParams.piscineroId;
        $scope.piscinas = [];
        $scope.checkes = [];
        $scope.search = "";
        $scope.data = {};
        $scope.noMoreItemsAvailable = false;
        $scope.posicion($location.path());
        var num = 1,
            max = 0;
        $scope.loadMore = function() {
            $http.get($scope.server + '/usuarios/service/asignacion/piscinero/' + id + '/?page=' + num + "&search=" + $scope.search)
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
                        console.log(data);
                        if (data.piscinero) {
                            $cordovaToast.show("Piscinero: " + data.piscinero[0], 'short', 'botton');
                        }
                        if (data.piscina) {
                            $cordovaToast.show("Piscina: " + data.piscina[0], 'short', 'botton');
                        }
                        if (data.asigna) {
                            $cordovaToast.show("Asigna: " + data.asigna[0], 'short', 'botton');
                        }
                        if (data.__all__) {
                            $cordovaToast.show(data.__all__[0], 'short', 'botton');
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
    .controller('Ruta', function($scope, $http, $stateParams, $cordovaToast, $cordovaDialogs, $timeout, $ionicLoading, $state, $location) {
        $scope.piscinero = $stateParams.piscineroId;
        $scope.noMoreItemsAvailable = false;
        $scope.items = [];
        $scope.data = {};
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

        $scope.cambio = function(item) {
            $scope.loading = $ionicLoading.show({
                template: '<ion-spinner class="spinner-light"></ion-spinner><br/>Guardando ruta...',
                noBackdrop: true
            });
            $http({
                method: 'PUT',
                url: $scope.server + '/usuarios/service/asignacion/form/piscinero/' + item + '/',
                data: $scope.data,
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
                            $scope.cambio(item);
                        });
                    }, 10000);
                }
            });
        };

        $scope.moveItem = function(item, fromIndex, toIndex) {
            $scope.items.splice(fromIndex, 1);
            $scope.items.splice(toIndex, 0, item);
            var move = toIndex - fromIndex;
            if (move > 0) {
                $scope.data.orden = $scope.items[toIndex - 1].orden;
            } else if (move < 0) {
                $scope.data.orden = $scope.items[toIndex + 1].orden;
            }
            if (toIndex !== fromIndex) {
                $scope.cambio(item.id);
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
        var ruta = [];
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
                        $cordovaDialogs.alert('Este piscinero no tiene ningúna ruta asignada.', 'Ruta');
                    } else {
                        data.forEach(function(element, index) {
                            if (element.latitud !== null && element.longitud !== null) {
                                ruta.push(element);
                            }
                        });
                        if (ruta.length === 0) {
                            $cordovaDialogs.alert('No se puede mostrar la ruta, porque ninguna casa tiene GPS.', 'Ruta');
                        } else if (ruta.length === 1) {
                            $scope.map.setCenter(new google.maps.LatLng(ruta[0].latitud, ruta[0].longitud));
                            var myLatLng = {
                                lat: parseFloat(ruta[0].latitud),
                                lng: parseFloat(ruta[0].longitud)
                            };
                            if (marker !== null) {
                                marker.setMap(null);
                            }

                            marker = new google.maps.Marker({
                                map: $scope.map,
                                position: myLatLng,
                                animation: google.maps.Animation.DROP,
                                title: ruta[0].nombreP
                            });

                            var infowindow = new google.maps.InfoWindow({
                                content: "Piscix"
                            });

                            $timeout(function() {
                                infowindow.open($scope.map, marker);
                            }, 2000);
                        } else if (ruta.length === 2) {
                            directionsService.route({
                                origin: {
                                    lat: parseFloat(ruta[0].latitud),
                                    lng: parseFloat(ruta[0].longitud)
                                },
                                destination: {
                                    lat: parseFloat(ruta[1].latitud),
                                    lng: parseFloat(ruta[1].longitud)
                                },
                                travelMode: google.maps.TravelMode.WALKING
                            }, function(response, status) {
                                if (status === google.maps.DirectionsStatus.OK) {
                                    directionsDisplay.setDirections(response);
                                    //var route = response.routes[0];
                                } else {
                                    $cordovaDialogs.alert('Solicitud de direcciones suspendida debido a la ' + status);
                                }
                            });
                        } else if (ruta.length > 2) {
                            var count = ruta.length - 1;
                            ruta.forEach(function(element, index) {
                                if (element.latitud !== null && element.longitud !== null) {
                                    if (index !== 0 && index !== count) {
                                        waypts.push({
                                            location: {
                                                lat: parseFloat(element.latitud),
                                                lng: parseFloat(element.longitud)
                                            },
                                            stopover: true
                                        });
                                    }
                                }
                            });
                            directionsService.route({
                                origin: {
                                    lat: parseFloat(ruta[0].latitud),
                                    lng: parseFloat(ruta[0].longitud)
                                },
                                destination: {
                                    lat: parseFloat(ruta[count].latitud),
                                    lng: parseFloat(ruta[count].longitud)
                                },
                                waypoints: waypts,
                                optimizeWaypoints: true,
                                travelMode: google.maps.TravelMode.WALKING
                            }, function(response, status) {
                                if (status === google.maps.DirectionsStatus.OK) {
                                    directionsDisplay.setDirections(response);
                                    //var route = response.routes[0];
                                } else {
                                    $cordovaDialogs.alert('Solicitud de direcciones suspendida debido a la ' + status);
                                }
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

.controller('HistorialIn', function($scope, $rootScope, $http, $state, $location, $cordovaToast, $timeout, $cordovaDialogs, $cordovaGeolocation, $ionicModal, $ionicLoading, $stateParams) {
        $scope.posicion($location.path());
        $scope.search = "";
        $scope.noMoreItemsAvailable = false;
        $scope.disableEnviar = false;
        $scope.actual = $stateParams.actual;
        var num = 1,
            max = 0,
            nuevo = {},
            url = '';
        $scope.reportes = [];
        $scope.data = {};
        $scope.notify.leido();

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
            document.addEventListener("resume", function() {
                if ($scope.data.latitud === undefined && $scope.data.longitud === undefined) {
                    $scope.tomarUbicacion();
                }
            }, false);
        };


        var posOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        function arraymove(arr, fromIndex, toIndex) {
            var element = arr[fromIndex];
            arr.splice(fromIndex, 1);
            arr.splice(toIndex, 0, element);
        }

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
                $cordovaToast.show("No se ha tomado aun la ubicación, por favor espere e intente de nuevo", 'short', 'center').then(function() {
                    $scope.disableEnviar = false;
                });
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
                $scope.disableEnviar = false;
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

        $scope.$on('leer', function(event, data) {
            nuevo.nombre = data.nombre;
            nuevo.descripcion = data.descripcion;
            nuevo.fecha = data.fecha;
            nuevo.nombreU = data.nombreU;
            nuevo.apellidosU = data.apellidosU;
            nuevo.id = data.reporte_id;
            $scope.actual = data.reporte_id;
            $scope.reportes.push(nuevo);
            arraymove($scope.reportes, $scope.reportes.indexOf(nuevo), 0);
            $scope.notify.leido();
            $scope.$apply();
        });
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
                } else if (data.tipo === "Reporte informativo") {
                    $state.go('app.historialI', {
                        actual: data.reporte_id
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
    });
