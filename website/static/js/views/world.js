define([
  'jquery',
  'underscore', 
  'backbone',
  'app',
  'router',

  'models/attribute',
  'collections/attributes',

  'views/key',
  'views/mapInfoAttribute',
  'views/mapInfoContext',
  'views/valueFrame',
  'views/chooseloc',
  'views/modal',
  ], function($, _, Backbone, appConfig, router, attrModel, attrCollection, keyView, mapInfoAttrView, mapInfoContextView, valueFrameView, chooselocView, modalView){
  var welcomeView = Backbone.View.extend({
    el: $('#container'),
    events: {
        'click button#addLocation': 'addLocation',
        'click button#newKey': 'newKey',
        
    },
    app: appConfig.getState(),
    
    circles: [],
    collection: new attrCollection(),
    selectedKey: '',

    showAllContexts: function(){
        this.$('aside').toggleClass('hideAside');
        this.app.modal.close();
        $('#popup').hide();

        // clear map
        _.each(this.circles, function(circle){ circle.infowindow.close(); })
        for (var i in this.circles) {
            this.circles[i].circle.setMap(null);
            this.circles[i].marker.setMap(null);
        }
        this.circles = [];

        var that = this;
        this.app.getContexts(function(json){
            var bounds = new google.maps.LatLngBounds();
            for (var i in json.contexts) {
                var c = json.contexts[i];
                if (c.name == 'all')
                    continue;
                
                var center = new google.maps.LatLng(c.location.lat, c.location.lon);
                var radius = parseInt(c.location.radius);
                bounds.extend(center);

                var model = new Backbone.Model({
                    name: c.name,
                    description: c.description,
                    haveit: c.userhasit,
                    score: c.count,
                    location: {
                        center: center,
                        radius: radius,
                    },
                    type: 'context',
                    cid: c.id,
                });
                that.addMapCircle(model);        
            }

            if (!bounds.isEmpty()) {
                that.app.map.fitBounds(bounds);
            }
        });
    },
    newKey: function() {
        if (! this.app.agent.loggedIn({alert:1})) {
            this.app.navbarView.login();
            return false;
        }
        this.app.modal.render({title: 'newkey'});
    },

    addAttr: function (model) {
        this.app.mutateKeyValue({
            type: 'POST',
            key: model.get('key'),
            val: model.get('val'),
        });
        this.collection.add(model);
    },
    remAttr: function (model) {
        this.app.mutateKeyValue({
            type: 'DELETE',
            key: model.get('key'),
            val: model.get('val'),
        });
        this.collection.remove(model);
    },

    showLoginBox: function(options){
        this.app.loginView.render(options);
        
        var that = this;
        $('body').one('click', function(e){
            // that.login.undelegateEvents();
            that.app.loginView.close();
            that.app.navbarView.render();
        });
    },

    showAccount: function(){
        if (!this.app.agent.loggedIn()) {
            console.log('Error: no user found while trying to display account info.');
            return false;
        }

        var that = this;
        this.app.modal.render({title: 'account'});
    },

    showReminder: function(argument) {
        this.app.modal.render({title: 'reminder'});
    },

    onLogin: function(){
        this.app.navbarView.render();
    },

    onDeleteAccount: function(){
        // console.log('del');
    },

    addLocation: function(e) {
        if (! this.app.agent.loggedIn({alert:1})) {
            this.app.navbarView.login();
            return false;
        }

        _.each(this.circles, function(circle){ circle.infowindow.close(); })

        var that = this;
        this.$('#popup').empty().addClass('transparent').show();
        var locView = new chooselocView({key:this.selectedKey});
        locView.render(function(circle){
            $(e.target).removeClass('disabled');
            if (!circle.center)
                return false;
            
            var lat = circle.center.lat();
            var lon = circle.center.lng();
            var xdata = {lat:lat, lon:lon, radius:circle.radius, ktype:'location'};

            var model = new attrModel({
                key: circle.key,
                val: circle.title,
                xdata: xdata,
                score: 1,
                haveit: true,
                selected: false,
                display: true,
                matches: [that.app.agent.id()],
                visited: false,
                showControls: true,
                location: {center:circle.center, radius:circle.radius},
            });

            that.collection.add(model);
            that.addMapCircle(model);

            that.app.mutateKeyValue({
                type: 'POST',
                key: circle.key,
                val: circle.title,
                xdata: xdata,
            });
        });
        $(e.target).addClass('disabled');
    },

    keyClickClb: function(model){
        this.$('a.asideKey').removeClass('highlighted');
        this.$('a.asideKey > i').removeClass('icon-white');

        for (var i in this.circles) {
            this.circles[i].circle.setMap(null);
            this.circles[i].marker.setMap(null);
        }
        this.circles = [];

        var models = this.collection.where({key: model.get('key')});
        this.selectedKey = model.get('key');

        if (model.get('type') == 'location') {
            this.$('button#addLocation').show();
            $('#popup').hide();
            var bounds = new google.maps.LatLngBounds();
            for (var i in models) {
                var m = models[i];
                var center = m.get('location').center;
                var radius = m.get('location').radius;
                bounds.extend(center);
                this.addMapCircle(m);
            }

            if (!bounds.isEmpty()) {
                this.app.map.fitBounds(bounds);
            }

            this.app.map.setZoom(this.app.map.getZoom()-1);
            if (models.length == 1)
                this.app.map.setZoom(this.app.map.getZoom()-3);
            
        }

        if (model.get('type') == 'string') {
            this.$('button#addLocation').hide();
            this.vFrameView && this.vFrameView.undelegateEvents();
            vFrameView = new valueFrameView({models:models, key:model.get('key')});
            vFrameView.render();
            this.vFrameView = vFrameView;
        }
    },

    addMapCircle: function(model){
        var contextOptions = {
            strokeColor: model.get('strokecolor'),
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: model.get('fillcolor'),
            fillOpacity: 0.1,
            map: this.app.map,
            center: model.get('location').center,
            radius: model.get('location').radius,
        };

        var mapCircle = new google.maps.Circle(contextOptions);
        
        // google.maps.event.addListener(this.contextCircle, 'click', this.areaClick);
        google.maps.event.addListener(mapCircle, 'mouseover', function(event) {
            this.setOptions({strokeColor:'red'});
        });
        google.maps.event.addListener(mapCircle, 'mouseout', function(event) {
            this.setOptions({strokeColor: model.get('strokecolor')});
            this.setOptions({zIndex:0});
        });


        var marker = new google.maps.Marker({
            position: model.get('location').center,
            map: this.app.map,
            title: 'options.title',
        });

        var that = this;
        var infowindowView;
        
        if (model.get('type') == 'location') {
            var infowindowView = new mapInfoAttrView(model);
            infowindowView.render();    
        }
        if (model.get('type') == 'context') {
            var infowindowView = new mapInfoContextView(model);
            infowindowView.render();    
        }
        console.log(model.get('type'))

        var infowindow = new google.maps.InfoWindow({
            content: infowindowView.el,
        });
        google.maps.event.addListener(marker, 'click', function() {
            _.each(that.circles, function(circle){ circle.infowindow.close(); })
            infowindow.open(that.app.map, marker);
        });
        google.maps.event.addListener(mapCircle, 'click', function() {
            _.each(that.circles, function(circle){ circle.infowindow.close(); })
        //     infowindow.open(this.app.map, marker);
        });

        this.circles.push({circle:mapCircle, marker:marker, infowindow:infowindow});
    },

    appendKey: function(attr){
        var keymodel = new Backbone.Model(attr);
        var kview = new keyView({model: keymodel});
        kview.render();
        kview.bind('keyclick', this.keyClickClb);

        if (attr.prepend) {
            this.$('aside > div.list').prepend(kview.el);
            kview.keyClick();
            if (attr.type == 'location')
                this.$('button#addLocation').click();
            if (attr.type == 'string')
                this.vFrameView.newAttr();
        } else
            this.$('aside > div.list').append(kview.el);
        return false;
    },

    render: function(){

        this.$('aside > div.list').empty();
        this.collection.reset();

        var that = this;
        url = this.app.satellite.url+"/profile/"+this.app.context.name+"/keyvals";
        $.getJSON(url, {user:this.app.agent.id()}, function(json){
            // that.processNextKey(0, json.items);

            for (var i in json.items) {
                var attr = json.items[i];
                attr.key;
                attr.score;

                that.appendKey(attr);
                // var keymodel = new Backbone.Model(attr);
                // var kview = new keyView({model: keymodel});
                // kview.render();
                // kview.bind('keyclick', that.keyClickClb);
                // that.$('aside > div.list').append(kview.el);

                for (var v in attr.values) {
                    var val = attr.values[v];
                    val.matches;
                    val.score;
                    val.val;

                    var model = new attrModel({
                        key: attr.key,
                        val: val.val,
                        xdata: val.xdata,
                        score: val.score,
                        haveit: val.userhasit,
                        selected: false,
                        display: true,
                        matches: val.matches,
                        visited: false,
                        showControls: true,
                        type: attr.type,
                    });

                    if (attr.type == 'location') {
                        var lat = parseFloat(val.xdata.lat);
                        var lng = parseFloat(val.xdata.lon);
                        var center = new google.maps.LatLng(lat, lng);
                        var radius = parseInt(val.xdata.radius);

                        model.set({location: {center:center, radius:radius}});
                        that.addMapCircle(model);
                    }
                    
                    that.collection.add(model);
                }
            }
        });
    },

    initialize: function(options){
        _.bindAll(this, 'render', 'keyClickClb', 'showLoginBox', 'showAccount', 'showReminder', 'addAttr', 'remAttr', 'showAllContexts');

        var that = this;
        var centerLatLng = new google.maps.LatLng(37.748582,-122.418411);
        this.app.map = new google.maps.Map(document.getElementById('map_canvas'), {
            'zoom': 7,
            'center': centerLatLng,
            'mapTypeId': google.maps.MapTypeId.ROADMAP,
            'zoomControl': false,
            'streetViewControl': false,
            'panControl': false,
            'mapTypeControlOptions': {position: google.maps.ControlPosition.TOP_CENTER},
        });
        google.maps.event.addListener(this.app.map, 'click', function(event) {
            _.each(that.circles, function(circle){ circle.infowindow.close(); })
        });
    },
  });
  return welcomeView;
});
