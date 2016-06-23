angular.module('starter.socket', [])

.factory('notix', function($rootScope, $cordovaLocalNotification, $state) {
    var scope = $rootScope;
    scope.socket = scope.socket || io('http://192.168.0.113:1196');
    scope.recive = true;
    scope.lista_id = {};
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
                    if (message.data.data.tipo == "Reporte") {
                        scope.lista_id[message._id] = 3;
                        $cordovaLocalNotification.schedule({
                            id: 3,
                            title: 'Reporte',
                            text: message.data.html,
                            data: {
                                reporte: message.data.data.reporte_id,
                                cliente: message.data.data.cliente_id
                            }
                        });
                    } else if (message.data.data.tipo == "Actividad") {
                        scope.lista_id[message._id] = 4;
                        $cordovaLocalNotification.schedule({
                            id: 4,
                            title: 'Actividad',
                            text: message.data.html
                        });
                    } else if (message.data.data.tipo == "Respuesta") {
                        scope.lista_id[message._id] = 5;
                        $cordovaLocalNotification.schedule({
                            id: 5,
                            title: 'Respuesta',
                            text: message.data.html,
                            data: {
                                reporte: message.data.data.reporte_id
                            }
                        });
                    } else if (message.data.data.tipo == "Recordatorio") {
                        scope.lista_id[message._id] = 6;
                        $cordovaLocalNotification.schedule({
                            id: 6,
                            title: 'Recordatorio',
                            text: message.data.html,
                            data: {
                                reporte: message.data.data.reporte_id
                            }
                        });
                    } else if (message.data.data.tipo == "Solucion") {
                        scope.lista_id[message._id] = 7;
                        $cordovaLocalNotification.schedule({
                            id: 7,
                            title: 'Solución de Reporte',
                            text: message.data.html,
                            data: {
                                solucion: message.data.data.solucion_id,
                                cliente: message.data.data.cliente_id
                            }
                        });
                    } else if (message.data.data.tipo == "Asignacion") {
                        scope.lista_id[message._id] = 8;
                        $cordovaLocalNotification.schedule({
                            id: 8,
                            title: 'Asignación',
                            text: message.data.html,
                            data: {
                                reporte: message.data.data.piscinero_id
                            }
                        });
                    }
                    $rootScope.$on('$cordovaLocalNotification:click',
                        function(event, notification, state) {
                            var data = JSON.parse(notification.data);
                            this.visit(message._id, function() {
                                if (notification.id === 3) {
                                    $state.go('app.historialR', {
                                        clienteId: data.cliente,
                                        actual: data.reporte
                                    });
                                } else if (notification.id === 5) {
                                    $state.go('app.respuestas', {
                                        reporteId: data.reporte
                                    });
                                } else if (notification.id === 6) {
                                    $state.go('app.historialR', {
                                        clienteId: 0,
                                        actual: data.reporte
                                    });
                                } else if (notification.id === 7) {
                                    $state.go('app.historialM', {
                                        clienteId: data.cliente,
                                        actual: data.solucion
                                    });
                                } else if (notification.id === 8) {
                                    $state.go('app.ruta', {
                                        piscineroId: data.piscinero_id
                                    });
                                }
                            });
                        }.bind(this));
                }
            }.bind(this));

            scope.socket.on('visited', function(message) {
							$cordovaLocalNotification.cancel(scope.lista_id[message.message_id]);
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
