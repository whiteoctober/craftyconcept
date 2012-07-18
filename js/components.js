!function(Crafty, App){

	Crafty.sprite(16, "sprite.png", {
	        player: [0, 3],
	});
    	
	Crafty.c('Ape', {
        Ape: function() {
                //setup animations
                this.requires("SpriteAnimation, Collision")
                .animate("walk_left", 6, 3, 8)
                .animate("walk_right", 9, 3, 11)
                .animate("walk_up", 3, 3, 5)
                .animate("walk_down", 0, 3, 2)
                //change direction when a direction change event is received
                .bind("NewDirection",
                    function (direction) {
                        if (direction.x < 0) {
                            if (!this.isPlaying("walk_left"))
                                this.stop().animate("walk_left", 10, -1);
                        }
                        if (direction.x > 0) {
                            if (!this.isPlaying("walk_right"))
                                this.stop().animate("walk_right", 10, -1);
                        }
                        if (direction.y < 0) {
                            if (!this.isPlaying("walk_up"))
                                this.stop().animate("walk_up", 10, -1);
                        }
                        if (direction.y > 0) {
                            if (!this.isPlaying("walk_down"))
                                this.stop().animate("walk_down", 10, -1);
                        }
                        if(!direction.x && !direction.y) {
                            this.stop();
                        }
                })
                // A rudimentary way to prevent the user from passing solid areas
                .bind('Moved', function(from) {
                    if(this.hit('solid')){
                        this.attr({x: from.x, y:from.y});
                    }
                })
            return this;
        }
    });

	Crafty.c("platform", {
		init: function() {
	        this.requires('2D, DOM, solid');
	    }
	});

	/**@
	* #KeyReceiver
	* @category Input
	* Used to bind to directions and have the entity move acordingly
	* @trigger NewDirection - triggered when direction changes - { x:Number, y:Number } - New direction
	* @trigger Moved - triggered on movement on either x or y axis. If the entity has moved on both axes for diagonal movement the event is triggered twice - { x:Number, y:Number } - Old position
	*/
	Crafty.c("KeyReceiver", {
		_speed: 3,

	  _rkeydown: function (key) {
			if (this._keys[key]) {
				this._movement.x = Math.round((this._movement.x + this._keys[key].x) * 1000) / 1000;
				this._movement.y = Math.round((this._movement.y + this._keys[key].y) * 1000) / 1000;
				this.trigger('NewDirection', this._movement);
			}
		},

	  _rkeyup: function (key) {
			if (this._keys[key]) {
				this._movement.x = Math.round((this._movement.x - this._keys[key].x) * 1000) / 1000;
				this._movement.y = Math.round((this._movement.y - this._keys[key].y) * 1000) / 1000;
				this.trigger('NewDirection', this._movement);
			}
		},

	  _renterframe: function () {
			if (this.disableControls) return;

			if (this._movement.x !== 0) {
				this.x += this._movement.x;
				this.trigger('Moved', { x: this.x - this._movement.x, y: this.y });
			}
			if (this._movement.y !== 0) {
				this.y += this._movement.y;
				this.trigger('Moved', { x: this.x, y: this.y - this._movement.y });
			}
		},

		init: function () {
			this._keyDirection = {};
			this._keys = {};
			this._movement = { x: 0, y: 0 };
			this._speed = { x: 3, y: 3 };
		},

		/**@
		* 
		* @example
		* ~~~
		* this.multiway(3, {UP_ARROW: -90, DOWN_ARROW: 90, RIGHT_ARROW: 0, LEFT_ARROW: 180});
		* this.multiway({x:3,y:1.5}, {UP_ARROW: -90, DOWN_ARROW: 90, RIGHT_ARROW: 0, LEFT_ARROW: 180});
		* this.multiway({W: -90, S: 90, D: 0, A: 180});
		* ~~~
		*/
		receiver: function (speed, keys) {
			if (keys) {
				if (speed.x && speed.y) {
					this._speed.x = speed.x;
					this._speed.y = speed.y;
				} else {
					this._speed.x = speed;
					this._speed.y = speed;
				}
			} else {
				keys = speed;
			}

			this._keyDirection = keys;
			this.rspeed(this._speed);
			this.enableReceiverControl();

			return this;
		},

		/**@
		* #.enableControl
		* @comp Multiway
		* @sign public this .enableControl()
		* 
		* Enable the component to listen to key events.
		*
		* @example
		* ~~~
	    * this.enableControl();
		* ~~~
		*/
	  	enableReceiverControl: function() {
			this.bind("KeyDownReceive", this._rkeydown)
			.bind("KeyUpReceive", this._rkeyup)
			.bind("EnterFrame", this._renterframe);
			return this;
	  	},

		/**@
		* #.disableControl
		* @comp Multiway
		* @sign public this .disableControl()
		* 
		* Disable the component to listen to key events.
		*
		* @example
		* ~~~
	    * this.disableControl();
		* ~~~
		*/

	  	disableReceiverControl: function() {
			this.unbind("KeyDownReceive", this._keydown)
			.unbind("KeyUpReceive", this._keyup)
			.unbind("EnterFrame", this._enterframe);
			return this;
	  	},

		rspeed: function (speed) {
			for (var k in this._keyDirection) {
				var keyCode = Crafty.keys[k] || k;
				this._keys[keyCode] = {
					x: Math.round(Math.cos(this._keyDirection[k] * (Math.PI / 180)) * 1000 * speed.x) / 1000,
					y: Math.round(Math.sin(this._keyDirection[k] * (Math.PI / 180)) * 1000 * speed.y) / 1000
				};
			}
			return this;
		}
	});
	
	Crafty.c("KeySender", {

	  	_keydown: function (e) {
			if (this._keys[e.key]) {
				App.sendMessage({
			    	'action' : 'player_keydown',
		        	'info' : App.current_player.info,
		        	'key' : e.key,
		        	'speed' : this._keys[e.key]
			    });
			}
		},

	  	_keyup: function (e) {
			if (this._keys[e.key]) {
				App.sendMessage({
			    	'action' : 'player_keyup',
		        	'info' : App.current_player.info,
		        	'key' : e.key,
		        	'speed' : this._keys[e.key]
			    });
			}
		},
		init: function () {
			this._keyDirection = {};
			this._keys = {};
			this._movement = { x: 0, y: 0 };
			this._speed = { x: 3, y: 3 };
		},

		/**@
		* 
		* @example
		* ~~~
		* this.sender(3, {UP_ARROW: -90, DOWN_ARROW: 90, RIGHT_ARROW: 0, LEFT_ARROW: 180});
		* this.sender({x:3,y:1.5}, {UP_ARROW: -90, DOWN_ARROW: 90, RIGHT_ARROW: 0, LEFT_ARROW: 180});
		* this.sender({W: -90, S: 90, D: 0, A: 180});
		* ~~~
		*/
		sender: function (speed, keys) {
			if (keys) {
				if (speed.x && speed.y) {
					this._speed.x = speed.x;
					this._speed.y = speed.y;
				} else {
					this._speed.x = speed;
					this._speed.y = speed;
				}
			} else {
				keys = speed;
			}

			this._keyDirection = keys;
			this.speed(this._speed);

			this.enableControl();

			return this;
		},

		/**@
		* #.enableControl
		* @comp Multiway
		* @sign public this .enableControl()
		* 
		* Enable the component to listen to key events.
		*
		* @example
		* ~~~
	    * this.enableControl();
		* ~~~
		*/
	  	enableControl: function() {
			this.bind("KeyDown", this._keydown)
			.bind("KeyUp", this._keyup);
			return this;
	  	},

		/**@
		* #.disableControl
		* @comp Multiway
		* @sign public this .disableControl()
		* 
		* Disable the component to listen to key events.
		*
		* @example
		* ~~~
	    * this.disableControl();
		* ~~~
		*/

	  	disableControl: function() {
			this.unbind("KeyDown", this._keydown)
			.unbind("KeyUp", this._keyup);
			return this;
	  	},

		speed: function (speed) {
			for (var k in this._keyDirection) {
				var keyCode = Crafty.keys[k] || k;
				this._keys[keyCode] = {
					x: Math.round(Math.cos(this._keyDirection[k] * (Math.PI / 180)) * 1000 * speed.x) / 1000,
					y: Math.round(Math.sin(this._keyDirection[k] * (Math.PI / 180)) * 1000 * speed.y) / 1000
				};
			}
			return this;
		}
	});
}(window.Crafty, window.APP || (window.APP = {}));