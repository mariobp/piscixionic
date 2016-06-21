var socket = socket || io('192.168.0.113:1196');
var recive = true;

function Notix(){

}

Notix.prototype = {
	django_id: null,
	event: null,
	callback: null,
	data: {},

	setup: function (session_id){
		this.django_id = session_id;

		socket.on('identify', function (message) {
			if (!message['ID']){
				this.login();
			}else{
				this.do_event();
			}
		}.bind(this));

		socket.on('success-login', function (message) {
			console.log("Ok");
			this.do_event();
		}.bind(this));

		socket.on('error-login', function (message) {
			console.log("Error");
		});

		socket.on('notix', function (message) {
			console.log(message);
			if (recive){
				var noti = notification(message.data.html);
				noti.onclick = function (){
					this.visit(message._id, function(){
						window.location = message.data.url;
					});
				}.bind(this);
			}
		}.bind(this));

		socket.on('visited', function (message) {
			console.log('visited', message);
		});
		this.messages();
	},

	do_event: function (){
		if (this.event){
			socket.emit(this.event, this.data);
			this.event = null;
			this.data = {};
			if (this.callback){
				this.callback();
				this.callback = null;
			}
		}
	},

	emit: function (event, data, callback){
		this.event = event;
		this.data = data;
		socket.emit('identify', {"django_id": this.django_id, "usertype": "WEB"});
	},

	messages: function (){
		console.log("messages");
		this.emit('messages', {
			'django_id': this.django_id ,
			 'usertype': 'WEB',
			 'webuser': username,
			 'type': type
		});
	},

	visit: function (message_id, callback){
		this.callback = callback;
		this.emit('visited', {
			'django_id': this.django_id ,
			 'usertype': 'WEB',
			 'webuser': username,
			 'message_id': message_id,
			 'type': type
		});
	},

	login: function(){
		socket.emit('login', {
			"username": "user1",
			"password": "123456",
			"usertype": "WEB",
			"django_id": this.django_id,
			"webuser": username
		});
	}

};

var notix = new Notix();
var notifications = [];

function notification(html) {
	var notification;
	var opt = {
		'icon': '/static/notificaciones/Icono-s-wb.png'
	};
	if (!("Notification" in window)) {
		alert("This browser does not support desktop notification");
	}
	else if (Notification.permission === "granted") {
		notification = new Notification(html, opt);
		notifications.push(notification);
	} else if (Notification.permission !== 'denied') {
		Notification.requestPermission(function (permission) {
			if (permission === "granted") {
				notification = new Notification(html, opt);
				notifications.push(notification);
			}
		});
	}
	return notification;
}

function closeAll(){
	recive = false;
	for (notification in notifications) {
		notifications[notification].close();
	}
}
window.addEventListener("beforeunload", function (event) {
	closeAll();
});
