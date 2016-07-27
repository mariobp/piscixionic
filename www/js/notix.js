angular.module('starter.socket', [])

.factory('notix', function($rootScope, $cordovaLocalNotification, $state) {
    var scope = $rootScope;
    scope.socket = scope.socket || io('http://104.236.33.228:1196');
    scope.recive = true;
    scope.lista_id = [];

    function Notix() {}

    var noti = Notix.prototype = {
        django_id: null,
        username: null,
        type: null,
        event: null,
        callback: null,
        notixList: [],
        list_actual: [],
        data: {},

        setup: function(session_id, username, type) {
            this.django_id = session_id;
            this.username = username;
            this.type = type;
            scope.socket.on('identify', function(message) {
                if (!message['ID']) {
                    this.login();
                } else {
                    this.do_event();
                }
            }.bind(this));

            scope.socket.on('success-login', function(message) {
                this.do_event();
            }.bind(this));

            scope.socket.on('error-login', function(message) {
                console.log("Error");
            });

            scope.socket.on('notix', function(message) {
                if (scope.recive) {
                    if (message.data.data !== undefined) {
                        this.notixList.push(message);
                        scope.lista_id.push(message._id);
                        this.list_actual = [];
                        var id_message = scope.lista_id.indexOf(message._id) + 1;
                        if (message.data.data.tipo == "Reporte") {
                            if ($state.current.name == "app.historialR") {
                                scope.$broadcast('leer', message.data.data);
                            } else {
                                $cordovaLocalNotification.schedule({
                                    id: id_message,
                                    title: 'Reporte',
                                    text: message.data.html,
                                    data: {
                                        reporte: message.data.data.reporte_id,
                                        cliente: message.data.data.cliente_id,
                                        tipo: message.data.data.tipo
                                    }
                                });
                            }
                        } else if (message.data.data.tipo == "Actividad") {
                            $cordovaLocalNotification.schedule({
                                id: id_message,
                                title: 'Actividad',
                                text: message.data.html,
                                data: {
                                    tipo: message.data.data.tipo
                                }
                            });
                        } else if (message.data.data.tipo == "Respuesta") {
                            if ($state.current.name == "app.respuestas" && message.data.data.reporte_id == parseInt($state.params.reporteId)) {
                                scope.$broadcast('leer', message.data.data);
                            } else {
                                $cordovaLocalNotification.schedule({
                                    id: id_message,
                                    title: 'Respuesta',
                                    text: message.data.html,
                                    data: {
                                        reporte: message.data.data.reporte_id,
                                        tipo: message.data.data.tipo
                                    }
                                });
                            }
                        } else if (message.data.data.tipo == "Recordatorio") {
                            $cordovaLocalNotification.schedule({
                                id: id_message,
                                title: 'Recordatorio',
                                text: message.data.html,
                                data: {
                                    reporte: message.data.data.reporte_id,
                                    tipo: message.data.data.tipo
                                }
                            });
                        } else if (message.data.data.tipo == "Solucion") {
                            if ($state.current.name == "app.historialM") {
                                scope.$broadcast('leer', message.data.data);
                            } else {
                                $cordovaLocalNotification.schedule({
                                    id: id_message,
                                    title: 'Solución de Reporte',
                                    text: message.data.html,
                                    data: {
                                        solucion: message.data.data.solucion_id,
                                        reporte: message.data.data.reporte_id,
                                        tipo: message.data.data.tipo
                                    }
                                });
                            }
                        } else if (message.data.data.tipo == "Asignacion") {
                            $cordovaLocalNotification.schedule({
                                id: id_message,
                                title: 'Asignación',
                                text: message.data.html,
                                data: {
                                    asignacion: message.data.data.asignacion_id,
                                    tipo: message.data.data.tipo
                                }
                            });
                        } else if (message.data.data.tipo == "Reporte informativo") {
                            if ($state.current.name == "app.historialI") {
                                scope.$broadcast('leer', message.data.data);
                            } else {
                              $cordovaLocalNotification.schedule({
                                  id: id_message,
                                  title: 'Reporte informativo',
                                  text: message.data.html,
                                  data: {
                                      actual: message.data.data.reporte_id,
                                      tipo: message.data.data.tipo
                                  }
                              });
                            }
                      }
                    }
                    $rootScope.$on('$cordovaLocalNotification:click',
                        function(event, notification, state) {
                            if (notification.data) {
                                var data = JSON.parse(notification.data);
                            }
                            this.visit(message._id, function() {
                                if (data.tipo == "Reporte") {
                                    $state.go('app.historialR', {
                                        clienteId: data.cliente,
                                        actual: data.reporte
                                    }, {
                                        reload: true
                                    });
                                } else if (data.tipo == "Respuesta") {
                                    $state.go('app.respuestas', {
                                        reporteId: data.reporte
                                    }, {
                                        reload: true
                                    });
                                } else if (data.tipo === "Recordatorio") {
                                    $state.go('app.historialR', {
                                        clienteId: 0,
                                        actual: data.reporte
                                    }, {
                                        reload: true
                                    });
                                } else if (data.tipo === "Solucion") {
                                    $state.go('app.historialM', {
                                        clienteId: data.reporte,
                                        actual: data.solucion
                                    }, {
                                        reload: true
                                    });
                                } else if (data.tipo === "Asignacion") {
                                    $state.go('app.ruta', {
                                        actual: data.asignacion
                                    }, {
                                        reload: true
                                    });
                                } else if (data.tipo === "Actividad") {
                                    $state.go('app.notificaciones');
                                } else if (data.tipo == "Reporte informativo") {
                                    $state.go('app.historialI', {
                                        actual: data.reporte
                                    }, {
                                        reload: true
                                    });
                                }
                            });
                        }.bind(this));
                }
            }.bind(this));

            scope.socket.on('visited', function(message) {
                var elemento = this.notixList.filter(function(element) {
                    return element._id == message.message_id;
                });
                if (elemento.length > 0) {
                    var index = this.notixList.indexOf(elemento[0]);
                    if (index > -1) {
                        this.notixList.splice(index, 1);
                    }
                }
                $cordovaLocalNotification.cancel(scope.lista_id.indexOf(message.message_id) + 1);
            }.bind(this));
            this.messages();
        },

        do_event: function() {
            if (this.event) {
                scope.socket.emit(this.event, this.data);
                this.event = null;
                this.data = {};
                if (this.callback) {
                    this.callback();
                    this.callback = null;
                }
            }
        },

        emit: function(event, data, callback) {
            this.event = event;
            this.data = data;
            scope.socket.emit('identify', {
                "django_id": this.django_id,
                "usertype": "WEB"
            });
        },

        messages: function() {
            this.emit('messages', {
                'django_id': this.django_id,
                'usertype': 'WEB',
                'webuser': this.username,
                'type': this.type
            });
        },

        visit: function(message_id, callback) {
            this.callback = callback;
            this.emit('visited', {
                'django_id': this.django_id,
                'usertype': 'WEB',
                'webuser': this.username,
                'message_id': message_id,
                'type': this.type
            });
        },

        login: function() {
            scope.socket.emit('login', {
                "username": "user1",
                "password": "123456",
                "usertype": "WEB",
                "django_id": this.django_id,
                "webuser": this.username
            });
        },

        limpiar: function(tipo) {
            this.notixList.forEach(function(elemento) {
                if(tipo=="Respuesta"){
                  if (elemento.data.data.tipo == tipo) {
                    if(parseInt($state.params.reporteId) == elemento.data.data.reporte_id) {
                        this.visit(elemento._id);
                    }
                  }
                }
                else{
                  if(elemento.data.data.tipo == tipo) {
                      this.visit(elemento._id);
                  }
                }
            }.bind(this));
        },

        leido: function() {
            if ($state.current.name == "app.historialR") {
                this.limpiar("Reporte");
            } else if ($state.current.name == "app.respuestas") {
                this.limpiar("Respuesta");
            } else if ($state.current.name == "app.historialM") {
                this.limpiar("Solucion");
            } else if ($state.current.name == "app.historialI") {
                this.limpiar("Reporte informativo");
            }
        }
    };

    return noti;
});
