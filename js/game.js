!function($, Crafty, App){


	var channel = 'A-game';

	var players = (function(){
	    var players_obj = {};
	    return {
	        add : function(player) {
	            players_obj[player['uuid']] = player;
	            return player;
	        },
	        get : function(uuid) {
	            return players_obj[uuid];
	        },
	        all : function() {
	            return players_obj;
	        }
	    };
	})();

	function current_player(ready) {
	    function is_ready() {
	        if (player['uuid'] && player['joined']) {
	            players.add(player);
	            ready(player)
	        }
	    }

	    var player = {
	        'uuid' : PUBNUB.uuid(function(uuid){
	            player['uuid'] = uuid;
	            is_ready();
	        }),
	        'joined' : PUBNUB.time(function(time){
	            player['joined'] = time;
	            is_ready();
	        })
	    };
	};

	var player = {
    	'players' : players,
    	'current_player' : current_player
	};

	App.current_player = { ready : 0 };
	var manPos = {};
	var thePlayers = {};

	// Create New Player
	player.current_player(function(self){
	    App.current_player.info = self;
	    App.current_player.ready = 1;

	    // Call Ready Function
	    game_ready();
	});

	App.sendMessage = function(message) {
	    PUBNUB.publish({
	        'channel' : channel,
	        'message' : message
	    });
	}	

	function add_player(message) {
    	var uuid = message.info['uuid']
	    , self = false;
	    

	   	var setup = '2D, DOM, Ape, player, Gravity, KeyReceiver';
	   	if (self = (uuid == App.current_player.info.uuid)) {
	   		setup += ', KeySender';
	   	}
		var player1 = Crafty.e(setup)
                 .attr(manPos)
                 .Ape().gravity("platform");
  
        if (self) {
        	player1.sender(1, {
				RIGHT_ARROW: 0,
				LEFT_ARROW: 180,
				D: 0,
				A: 180,
				Q: 180
			});
        }
        
        player1.receiver(1, {
			RIGHT_ARROW: 0,
			LEFT_ARROW: 180,
			D: 0,
			A: 180,
			Q: 180
		});

        if (!players.get(uuid)) {
        	var player = message['info'];
    		players.add(player);
	    } 

	    thePlayers[uuid] = player1;
	}

	function move_player(message) {
		var uuid = message.info['uuid'];
		//New movement? Add the player...needs work is broken..
		if (!players.get(uuid)) {
			add_player(message);
		}
    	switch (message['action']) {
            case 'player_keydown' :
            	thePlayers[uuid].trigger("KeyDownReceive", message.key);
            	break;
            case 'player_keyup' :
            	thePlayers[uuid].trigger("KeyUpReceive", message.key);
            	break;
        }
	}

	function game_ready() {

	    PUBNUB.subscribe( { 
	    	'channel' : channel,
	    	callback   : function(message) {

		        switch (message['action']) {
		            case 'player_arrive' :
		                add_player(message);
		                break;
	                case 'player_keydown' :
	                	move_player(message);
	                	break;
	                case 'player_keyup' :
	                	move_player(message);
	                	break;
		        }
	    	},
        	connect : function() {        // CONNECTION ESTABLISHED.
	            App.sendMessage({
			    	'action' : 'player_arrive',
		        	'info' : App.current_player.info
			    })
 
        	}
	     });
	    
	};

	$(function(){
		var documentHeight = $(document).height();
		var documentWidth = $(document).width();
		
		Crafty.init(documentWidth, documentHeight);

		Crafty.scene("main", function () {

		    $('.row .well').each(function(i){

				var $this = $(this);
				var pos = $this.offset();
				var height = $this.outerHeight();
				var width = $this.outerWidth();
				var attrs = {w: width-8, h: height, x: pos['left']+4, y: pos["top"]};
				if (i == 1){
		    		manPos = {x: pos['left']+16, y: pos["top"]-16, z:1}
		    	}
				Crafty.e('platform').attr(attrs);
			});

			Crafty.e('Color, platform').attr({w: documentWidth, h: 1, x: 0, y: documentHeight}).color('#000000');
		    
		});

		Crafty.scene("main");

	});
}(window.jQuery, window.Crafty, window.APP || (window.APP = {}));