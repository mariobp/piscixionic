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
                    scope.lista_id.push(message._id);
                    var id_message = scope.lista_id.indexOf(message._id) + 1;
                    if (message.data.data.tipo == "Reporte") {
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
                        $cordovaLocalNotification.schedule({
                            id: id_message,
                            title: 'Respuesta',
                            text: message.data.html,
                            data: {
                                reporte: message.data.data.reporte_id,
                                tipo: message.data.data.tipo
                            }
                        });
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
                    } else if (message.data.data.tipo == "Asignacion") {
                        $cordovaLocalNotification.schedule({
                            id: id_message,
                            title: 'Asignación',
                            text: message.data.html,
                            data: {
                                reporte: message.data.data.piscinero_id,
                                tipo: message.data.data.tipo
                            }
                        });
                    }
                    $rootScope.$on('$cordovaLocalNotification:click',
                        function(event, notification, state) {
                            if(notification.data){
                              var data = JSON.parse(notification.data);
                            }
                            this.visit(message._id, function() {
                                if (data.tipo == "Reporte") {
                                    $state.go('app.historialR', {
                                        clienteId: data.cliente,
                                        actual: data.reporte
                                    });
                                } else if (data.tipo == "Respuesta") {
                                    $state.go('app.respuestas', {
                                        reporteId: data.reporte
                                    });
                                } else if (data.tipo === "Recordatorio") {
                                    $state.go('app.historialR', {
                                        clienteId: 0,
                                        actual: data.reporte
                                    });
                                } else if (data.tipo === "Solucion") {
                                    $state.go('app.historialM', {
                                        clienteId: data.reporte,
                                        actual: data.solucion
                                    });
                                } else if (data.tipo === "Asignacion") {
                                    $state.go('app.ruta', {
                                        piscineroId: data.piscinero_id
                                    });
                                }
                            });
                        }.bind(this));
                }
            }.bind(this));

            scope.socket.on('visited', function(message) {
							$cordovaLocalNotification.cancel(scope.lista_id.indexOf(message._id) + 1);
            });
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
        }
    };

    return noti;
});
