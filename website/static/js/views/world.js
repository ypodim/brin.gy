define([
  'jquery',
  'underscore', 
  'backbone',
  'app',
  'router',

  // 'maps',
  'common/ego_website',

  'views/key',
  'views/mapInfoAttribute',
  'views/valueDetailed',
  'views/chooseloc',
  'views/login',
  'views/modal',
  ], function($, _, Backbone, appConfig, router, common, keyView, mapInfoAttrView, valueView, chooselocView, loginView, modalView){
  var welcomeView = Backbone.View.extend({
    el: $('#container'),
    events: {
        'click button#addLocation': 'addLocation',
    },
    app: appConfig.getState(),
    
    circles: [],
    modal: new modalView(),

    showLoginBox: function(action){
        this.login.render({action:action});
        
        var that = this;
        $('body').one('click', function(e){
            // that.login.undelegateEvents();
            $('#login').hide();
            that.navbar.render();
        });
    },

    showAccount: function(){
        if (!this.app.user) {
            console.log('Error: no user found while trying to display account info.');
            return false;
        }

        var that = this;
        // var modal = new modalView();
        this.modal.render();
    },

    showReminder: function(argument) {
        this.modal.render({title: 'reminder'});
    },

    onLogin: function(){
        this.navbar.render();
    },

    // onLogout: function(){
    //     console.log('onLogout')
    //     var username = APP.user;
    //     APP.usernames[username] = {};
    //     APP.user = '';
    //     common.cookies.del_cookie(username);
    //     this.navbar.render();
    // },

    onDeleteAccount: function(){
        console.log('del')
        // var username = APP.user;
        // APP.usernames[username] = {};
        // APP.user = '';
        // common.cookies.del_cookie(username);
        // that.navbar.render();
    },

    addLocation: function(e) {
        this.$('#popup').empty().addClass('transparent').show();
        var locView = new chooselocView();
        locView.render(function(){
            $(e.target).removeClass('disabled');    
        });
        $(e.target).addClass('disabled');
    },

    keyClickClb: function(model){
        for (var i in this.circles) {
            this.circles[i].circle.setMap(null);
            this.circles[i].marker.setMap(null);
        }
        this.circles = [];

        if (model.type == 'location') {
            this.$('button').show();
            $('#popup').hide();
            var bounds = new google.maps.LatLngBounds();
            for (var i in model.values) {
                var xdata = model.values[i].xdata;
                var lat = parseFloat(xdata.lat);
                var lng = parseFloat(xdata.lon);
                var center = new google.maps.LatLng(lat, lng);
                var radius = parseInt(xdata.radius);
                bounds.extend(center);
                this.addMapCircle({
                    center:center, 
                    radius:radius, 
                    val: model.values[i],
                    key: model.key,
                });
            }
            
            if (!bounds.isEmpty()) {
                this.app.map.fitBounds(bounds);
            }
        }

        if (model.type == 'string') {
            this.$('button').hide();
            var header = $('<div></div>').addClass('header').html(model.key);
            var expandBtn = $('<button class="btn"></button>').html('<i class="icon-chevron-down"></i>');
            expandBtn.css({float:'right'}).click(function(){
                var flag = $(this).children().hasClass('icon-chevron-down');
                $('div.valcontainer').toggleClass('expand', flag);
                $(this).children().toggleClass('icon-chevron-down', !flag);
                $(this).children().toggleClass('icon-chevron-up', flag);
            });
            header.append(expandBtn);

            $('#popup').empty().show().removeClass('transparent').html(header);
            for (var i in model.values) {
                var val = model.values[i];
                
                var vview = new valueView();
                vview.render(val);
                $('#popup').append(vview.el);
            }
            
        }
    },

    addMapCircle: function(options){
        var contextOptions = {
            strokeColor: "pink",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#FF0000",
            fillOpacity: 0.1,
            map: this.app.map,
            center: options.center,
            radius: options.radius,
        };

        var mapCircle = new google.maps.Circle(contextOptions);
        // this.contextCircle.cntx = this.tempc++;
        
        // google.maps.event.addListener(this.contextCircle, 'click', this.areaClick);
        google.maps.event.addListener(mapCircle, 'mouseover', function(event) {
            this.setOptions({strokeColor:'red'});
        });
        google.maps.event.addListener(mapCircle, 'mouseout', function(event) {
            this.setOptions({strokeColor:'pink'});
            this.setOptions({zIndex:0});
        });


        var marker = new google.maps.Marker({
            position: options.center,
            map: this.app.map,
            title: options.title,
        });

        var that = this;
        var attrView = new mapInfoAttrView(options);
        attrView.render();

        var infowindow = new google.maps.InfoWindow({
            content: attrView.el,
        });
        google.maps.event.addListener(marker, 'click', function() {
            _.each(that.circles, function(circle){ circle.infowindow.close(); })
            infowindow.open(this.app.map, marker);
        });
        // google.maps.event.addListener(mapCircle, 'click', function() {
        //     _.each(that.circles, function(circle){ circle.infowindow.close(); })
        //     infowindow.open(this.app.map, marker);
        // });

        this.circles.push({circle:mapCircle, marker:marker, infowindow:infowindow});
    },

    render: function(){

        var centerLatLng = new google.maps.LatLng(37.748582,-122.418411);
        this.app.map = new google.maps.Map(document.getElementById('map_canvas'), {
            'zoom': 7,
            'center': centerLatLng,
            'mapTypeId': google.maps.MapTypeId.ROADMAP,
            'zoomControl': false,
            'streetViewControl': false,
            'panControl': false,
        });

        this.$('aside').empty();
        var that = this;
        url = this.app.satellite.url+"/profile/"+this.app.context.name+"/keyvals";
        $.getJSON(url, {user:this.app.user}, function(json){
            // that.processNextKey(0, json.items);
            for (var i in json.items) {
                var attr = json.items[i];
                attr.key;
                attr.score;

                var kview = new keyView({keyClickClb:that.keyClickClb});
                kview.render(attr);
                that.$('aside').append(kview.el);
                for (var v in attr.values) {
                    var val = attr.values[v];
                    val.matches;
                    val.score;
                    val.val;

                    if (attr.type == 'location') {
                        var lat = parseFloat(val.xdata.lat);
                        var lng = parseFloat(val.xdata.lon);
                        var center = new google.maps.LatLng(lat, lng);
                        var radius = parseInt(val.xdata.radius);
                        that.addMapCircle({
                            center:center, 
                            radius:radius, 
                            val: val,
                            key: attr.key,
                        });
                    }
                }
            }
        });

        // Register event listeners
        // google.maps.event.addListener(this.map, 'mouseover', function(mEvent) {
        //   that.latLngControl.set('visible', true);
        // });
        // google.maps.event.addListener(this.map, 'mouseout', function(mEvent) {
        //   that.latLngControl.set('visible', false);
        // });
        // google.maps.event.addListener(this.map, 'mousemove', function(mEvent) {
        //   that.latLngControl.updatePosition(mEvent.latLng);
        // });
        google.maps.event.addListener(this.app.map, 'click', function(event) {
            _.each(that.circles, function(circle){ circle.infowindow.close(); })
        });
    },

    initialize: function(options){
        _.bindAll(this, 'render', 'keyClickClb', 'showLoginBox', 'showAccount', 'showReminder');
        this.navbar = options.navbar;
        
        var that = this;

        this.modal.bind('logout', function(){
            var username = that.app.user;
            that.app.usernames[username] = {};
            that.app.user = '';
            common.cookies.del_cookie(username);
            that.navbar.render();
        });

        this.modal.bind('reminder', function(){
            var email = that.modal.$('input#email').val();
            that.login.doReminder(email);
            that.modal.close();
        });

        this.modal.bind('delete', this.app.doDelete);

        // this.router = options.router;
    },
  });
  return welcomeView;
});
