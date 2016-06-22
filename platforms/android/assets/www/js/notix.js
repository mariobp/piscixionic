angular.module('starter.socket', [])

.factory('notix', function($rootScope, $cordovaLocalNotification) {
	var scope = $rootScope;
	scope.socket = scope.socket || io('http://192.168.0.113:1196');
	scope.recive = true;

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
	            console.log("Ok");
	            this.do_event();
	        }.bind(this));

	        scope.socket.on('error-login', function(message) {
	            console.log("Error");
	        });

	        scope.socket.on('notix', function(message) {
	            console.log(message);
	            if (recive) {
	                var noti = notification(message.data.html);
	                noti.onclick = function() {
	                    this.visit(message._id, function() {
	                        window.location = message.data.url;
	                    });
	                }.bind(this);
	            }
	        }.bind(this));

	        scope.socket.on('visited', function(message) {
	            console.log('visited', message);
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
