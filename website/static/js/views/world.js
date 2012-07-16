define([
  'jquery',
  'underscore', 
  'backbone',
  'router',

  // 'maps',
  'views/key',
  'views/mapInfoAttribute',
  'views/valueDetailed',
  'views/chooseloc',
  ], function($, _, Backbone, router, keyView, mapInfoAttrView, valueView, chooselocView){
  var welcomeView = Backbone.View.extend({
    el: $('#container'),
    events: {
        'click button#addLocation': 'addLocation',
    },

    
    circles: [],

    doSignin: function(e){
        console.log('in')
    },
    doSignup: function(e){
        console.log('up')
        this.$('#popup').html('asdf').show();
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
                APP.map.fitBounds(bounds);
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
            map: APP.map,
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
            map: APP.map,
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
            infowindow.open(APP.map, marker);
        });
        // google.maps.event.addListener(mapCircle, 'click', function() {
        //     _.each(that.circles, function(circle){ circle.infowindow.close(); })
        //     infowindow.open(APP.map, marker);
        // });

        this.circles.push({circle:mapCircle, marker:marker, infowindow:infowindow});
    },

    render: function(){
        

        var centerLatLng = new google.maps.LatLng(37.748582,-122.418411);
        APP.map = new google.maps.Map(document.getElementById('map_canvas'), {
            'zoom': 7,
            'center': centerLatLng,
            'mapTypeId': google.maps.MapTypeId.ROADMAP,
            'zoomControl': false,
            'streetViewControl': false,
            'panControl': false,
        });

        this.$('aside').empty();
        var that = this;
        url = APP.satellite.url+"/profile/"+APP.context.name+"/keyvals";
        $.getJSON(url, {user:APP.user}, function(json){
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
        google.maps.event.addListener(APP.map, 'click', function(event) {
            _.each(that.circles, function(circle){ circle.infowindow.close(); })
        });
    },

    initialize: function(options){
        _.bindAll(this, 'render', 'keyClickClb', 'doSignup');
        this.navbar = options.navbar;
        this.router = options.router;
    },
  });
  return welcomeView;
});
