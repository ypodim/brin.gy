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
  'views/mapInfoLocation',
  'views/valueFrame',
  'views/chooseloc',
  'views/modal',

  'http://google-maps-utility-library-v3.googlecode.com/svn/tags/infobox/1.1.9/src/infobox.js'
  ], function($, _, Backbone, appConfig, router, attrModel, attrCollection, keyView, mapInfoAttrView, mapInfoContextView, mapInfoLocationView, valueFrameView, chooselocView, modalView, test){
  var welcomeView = Backbone.View.extend({
    el: $('#container'),
    events: {
        'click button#addLocation': 'addLocationBtn',
        'click button#newKey': 'newKey',
        'click button#addContext': 'addContextBtn',
        'click button#backToContext': 'backToContext',
    },
    app: appConfig.getState(),
    
    circles: [],
    collection: new attrCollection(),
    selectedKeyModel: null,
    popup: null,

    backToContext: function(){
        this.app.router.navigate('#/c/'+this.app.getContext().id);
        return false;
    },

    clearMap: function(){
        _.each(this.circles, function(circle){ circle.infowindow.close(); })
        for (var i in this.circles) {
            this.circles[i].circle.setMap(null);
            this.circles[i].marker.setMap(null);
        }
        this.circles = [];
    },

    showAllContexts: function(options){
        if (!(options && options.notoggle))
            this.$('aside').show().toggleClass('hideAside', true);

        // this.app.modal.close();
        this.popup && this.popup.close({force:true});

        this.$('button#addContext').show();
        this.$('button#addLocation').hide();

        this.app.navbarView.toggleContextTitle({flag:false});

        var ctitle = this.app.getContext().title;
        this.$('button#backToContext').html('Back to '+this.app.getContext().title+' >').toggle(ctitle != null);
        console.log((ctitle != null));

        this.clearMap();

        var that = this;
        this.app.getContexts(function(json){
            var bounds = new google.maps.LatLngBounds();

            var locTitles = {};
            for (var i in json.contexts) {
                var c = json.contexts[i];
                if (c.title == 'all')
                    continue;

                var center = new google.maps.LatLng(c.location.lat, c.location.lon);
                var radius = parseInt(c.location.radius);
                var markerPos = center;
                var strokecolor = 
                bounds.extend(center);


                if (locTitles[c.location.title]) {
                    var randomRadius = Math.min( (0.3+Math.random()) * radius, radius*0.8 );
                    var randomAngle = Math.random()*360;
                    markerPos = google.maps.geometry.spherical.computeOffset(
                                    center, 
                                    randomRadius, 
                                    randomAngle
                                )
                } else {
                    locTitles[c.location.title] = c.title;
                }

                var model = new Backbone.Model({
                    title: c.title,
                    description: c.description,
                    haveit: c.userhasit,
                    score: c.count,
                    // strokecolor: (c.userhasit) ? 'red' : 'green',
                    // fillcolor: (c.userhasit) ? 'red' : 'green',
                    location: {
                        title: c.location.title,
                        center: center,
                        radius: radius,
                        markerPos: markerPos,
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

    postLocationAttr: function(circle){
        if (!circle.center)
            return false;
        
        var lat = circle.center.lat();
        var lon = circle.center.lng();
        var xdata = {
            id: circle.id,
            lat:lat, lon:lon, 
            radius:circle.radius, 
            ktype:'location', 
            creator:this.app.agent.id(),
            title: circle.title,
        };

        var model = new attrModel({
            key: circle.key,
            val: circle.title,
            xdata: xdata,
            score: 1,
            haveit: true,
            selected: false,
            display: true,
            matches: [this.app.agent.id()],
            visited: false,
            showControls: true,
            location: {center:circle.center, radius:circle.radius},
            type: 'location',
        });

        this.collection.add(model);
        this.addMapCircle(model);

        this.app.mutateKeyValue({
            type: 'POST',
            key: circle.key,
            val: circle.title,
            xdata: xdata,
        });
    },


    addContextBtn: function(e){
        if (! this.app.agent.loggedIn({alert:1})) {
            this.app.navbarView.login();
            return false;
        }
        $(e.target).hide();

        var that = this;


        this.app.modal.render({
            title: 'newContextOptions', 
            // location: circle.title,
        }).bind('modal:closed', function(){
            console.log('newcontext - modal closed');
            that.showAllContexts({notoggle:true});
        }).bind('newcontext', function(appdic){
            
            var message = 'Choosing location for new application: "'+appdic.title+'"';
            that.app.navbarView.render({message:message})
            that.getLocationInput( function(circle){

                that.app.navbarView.render();

                that.$('button#addContext').show();
                
                if (circle && circle.center) {
                    circle.lat = circle.center.lat();
                    circle.lon = circle.center.lng();

                    console.log('newcontext - modal closed with', appdic, circle);
                    var clb = function(json){
                        console.log('new context post got back:', json);

                        that.app.modal.render({title: 'newkey'});
                        that.app.modal.bind('newkey', function(obj){
                            console.log('new key result', obj)
                        })
                    };
                    that.app.postNewContext(appdic, clb);
                    
                } else
                    that.showAllContexts({notoggle:true});
            });

            

            
            // that.app.postNewContext()
            return false;

            that.app.setContext({
                id: null,
                title: appdic.title,
                description: appdic.description,
                lid: circle.id,
                location: circle,
                expiration: null,
            });

            that.app.navbarView.render();
            // that.backToContext();

            that.render();
            // that.newKey();
            that.app.modal.render({title: 'newkey'});
            that.app.modal.bind('newkey', function(obj){
                console.log('tester', obj)
            })
            // that.showAllContexts({notoggle:true});
        });
    },

    addLocationBtn: function(e) {
        if (! this.app.agent.loggedIn({alert:1})) {
            this.app.navbarView.login();
            return false;
        }
        $(e.target).hide();

        var that = this;
        this.getLocationInput( function(circle){
            that.$('button#addLocation').show();
            
            if (that.selectedKeyModel)
                that.keyClickClb( that.selectedKeyModel );

            if (circle && circle.center) {
                var key = that.selectedKeyModel.get('key');
                circle.key = key;
                console.log('deeeeeep', circle)
                that.postLocationAttr(circle);
            }
        });
    },

    getLocationInput: function(clb) {
        var that = this;

        this.popup && this.popup.close({force:true});
        this.popup = new chooselocView();
        this.popup.render();
        this.popup.unbind('newlocation');
        this.popup.bind('newlocation', function(circle){ 
            clb && clb(circle);
        });
        
        this.clearMap();
        this.app.getAllLocations(function(json){
            for (var i in json.locations){
                var loc = json.locations[i];

                var radius = parseFloat(loc.radius);
                var lat = parseFloat(loc.lat);
                var lng = parseFloat(loc.lon);
                var center = new google.maps.LatLng(lat, lng);
                model = new Backbone.Model({
                    id: loc.id,
                    center: center,
                    radius: radius,
                    title: loc.title,
                    creator: loc.creator || '"unknown"',
                });

                var infowindowView = new mapInfoLocationView({model:model});
                infowindowView.render();
                infowindowView.bind('uselocation', function(model){ 
                    that.popup.useLocation(model);
                });

                options = {
                    center: center,
                    radius: radius,
                    // icon: icon,
                    // markerPos: markerPos,
                    infowindowContent: infowindowView.el,
                    // strokecolor: model.get('strokecolor'),
                    // fillcolor: model.get('fillcolor'),
                    calloutSide: true,
                };
                that.addPlainMapCircle(options);
            }
        });
    },

    keyClickClb: function(kmodel){
        this.clearMap();

        var models = this.collection.where({key: kmodel.get('key')});
        this.selectedKeyModel = kmodel;

        if (kmodel.get('type') == 'location') {
            this.$('button#addLocation').show();
            this.popup && this.popup.close({force:true});
            var bounds = new google.maps.LatLngBounds();
            for (var i in models) {
                var m = models[i];

                var center = m.get('location').center;
                var radius = m.get('location').radius;

                if (radius && center.lat() && center.lng()) {
                    bounds.extend(center);
                    this.addMapCircle(m);
                }
            }

            if (!bounds.isEmpty()) {
                this.app.map.fitBounds(bounds);
            }
            
            this.app.map.setZoom(this.app.map.getZoom()-1);
            if (models.length == 1)
                this.app.map.setZoom(this.app.map.getZoom()-3);

            this.app.map.panBy(130, 0);
        }

        if (kmodel.get('type') == 'string') {
            this.$('button#addLocation').hide();
            this.popup && this.popup.close({force:true});
            this.popup = new valueFrameView({models:models, key:kmodel.get('key')});
            this.popup.render();
        }
    },

    addMapCircle: function(model){
        var markerPos = model.get('location').markerPos;
        if (! markerPos)
            markerPos = model.get('location').center;

        var icon = 'http://www.google.com/intl/en_ALL/mapfiles/marker_';
        icon += (model.get('haveit')) ? 'orange.png':'green.png';

        var infowindowView;
        if (model.get('type') == 'location') {
            var infowindowView = new mapInfoAttrView({model:model});
            infowindowView.render();    
        }
        if (model.get('type') == 'context') {
            var infowindowView = new mapInfoContextView({model:model});
            infowindowView.render();
        }

        options = {
            center: model.get('location').center,
            radius: model.get('location').radius,
            icon: icon,
            markerPos: markerPos,
            infowindowContent: infowindowView.el,
            strokecolor: model.get('strokecolor'),
            fillcolor: model.get('fillcolor'),
        };
        this.addPlainMapCircle(options);
    },

    addPlainMapCircle: function(options){
        var contextOptions = {
            strokeColor: options.strokecolor,
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: options.fillcolor,
            fillOpacity: 0.1,
            map: this.app.map,
            center: options.center,
            radius: options.radius,
        };

        var mapCircle = new google.maps.Circle(contextOptions);
        
        google.maps.event.addListener(mapCircle, 'mouseover', function(event) {
            this.setOptions({strokeColor:'red'});
        });
        google.maps.event.addListener(mapCircle, 'mouseout', function(event) {
            this.setOptions({strokeColor: options.strokecolor});
            this.setOptions({zIndex:0});
        });

        var markerPos = options.markerPos;
        if (! markerPos)
            markerPos = options.center;

        var marker = new google.maps.Marker({
            // icon: options.icon,
            position: markerPos,
            map: this.app.map,
            title: 'options.title',
        });
        if (options.icon)
            marker.setIcon(options.icon);

        var that = this;
        var background = 'url(/static/images/';
        background += (options.calloutSide) ? 'callout_side' : 'callout';
        background += '.png?14)';
        var offsetX = (options.calloutSide) ? 8 : -194;
        var offsetY = (options.calloutSide) ? -83 : -178;
        var padding = (options.calloutSide) ? '0 10px 22px 28px' : '10px';
        var height = (options.calloutSide) ? '100px' : '150px';

        var myOptions = {
            content: options.infowindowContent,
            disableAutoPan: false,
            maxWidth: 0,
            pixelOffset: new google.maps.Size(offsetX, offsetY),
            zIndex: null,
            boxStyle: { 
                background: background,
                'background-repeat': 'no-repeat',
                'background-size': '100%',
                'padding': padding,
                height: height,
                'z-index': 3000,
                closeBoxURL: "http://www.google.com/intl/en_us/mapfiles/close.gif",
                closeBoxMargin: "10px 2px 2px 2px",
            },
            infoBoxClearance: new google.maps.Size(1, 1),
            isHidden: false,
            pane: "floatPane",
            enableEventPropagation: false,
        };

        var ib = new InfoBox(myOptions);

        google.maps.event.addListener(marker, 'click', function() {
            _.each(that.circles, function(circle){ circle.infowindow.close(); })
            ib.open(that.app.map, marker);
        });
        google.maps.event.addListener(mapCircle, 'click', function() {
            _.each(that.circles, function(circle){ circle.infowindow.close(); })
        });

        this.circles.push({circle:mapCircle, marker:marker, infowindow:ib});
    },

    appendKey: function(attr){
        var keymodel = new Backbone.Model(attr);
        var kview = new keyView({model: keymodel});
        var that = this;
        kview.render();
        kview.bind('keyclick', function(){
            that.$('a.asideKey').removeClass('highlighted');
            that.$('a.asideKey > i').removeClass('icon-white');
        });
        kview.bind('keyclick', this.keyClickClb);

        if (attr.prepend) {
            this.$('aside > div.list').prepend(kview.el);
            kview.keyClick();
            if (attr.type == 'location')
                this.$('button#addLocation').click();
            if (attr.type == 'string')
                // this.vFrameView.newAttr();
                this.popup.newAttr();
        } else
            this.$('aside > div.list').append(kview.el);
        return false;
    },

    render: function(){
        this.app.navbarView.enableContextMenu();
        this.app.navbarView.toggleContextTitle({flag:true});
        this.$('aside').toggleClass('hideAside', false);
        this.$('button#addContext').fadeOut();
        this.clearMap();

        if (this.selectedKeyModel) {
            this.keyClickClb( this.selectedKeyModel );
            return false;
        }

        console.log('WORLD render', this.app.getContext().title)

        var that = this;
        this.collection.reset();
        this.$('aside > div.list').empty();
        this.app.getKeyvals(function(json){

            var bounds = new google.maps.LatLngBounds();

            for (var i in json.items) {
                var attr = json.items[i];
                attr.key;
                attr.score;

                that.appendKey(attr);

                for (var v in attr.values) {
                    var val = attr.values[v];
                    val.matches;
                    val.score;
                    val.val;

                    if (attr.type == 'string') {
                        var model = new attrModel({
                            key: attr.key,
                            val: val.val,
                            xdata: xdata,
                            score: val.score,
                            haveit: val.userhasit,
                            // selected: false,
                            // display: true,
                            matches: val.matches,
                            // visited: false,
                            // showControls: true,
                            type: attr.type,
                        });

                        that.collection.add(model);
                    }
                    if (attr.type == 'location') {
                        for (var i in val.xdata) {
                            var xdata = val.xdata[i];
                        
                            var model = new attrModel({
                                key: attr.key,
                                val: val.val,
                                xdata: xdata,
                                score: val.score,
                                haveit: val.userhasit,
                                // selected: false,
                                // display: true,
                                matches: val.matches,
                                // visited: false,
                                // showControls: true,
                                type: attr.type,
                            });

                            // if (attr.type == 'location') {
                                var lat = parseFloat(xdata.lat);
                                var lng = parseFloat(xdata.lon);
                                var center = new google.maps.LatLng(lat, lng);
                                var radius = parseInt(xdata.radius);

                                bounds.extend(center);

                                model.set({location: {center:center, radius:radius}});
                                that.addMapCircle(model);
                            // }
                            
                            that.collection.add(model);
                        }
                    }
                }
            }

            that.app.map.fitBounds(bounds);
            var newZoom = Math.max(that.app.map.getZoom()-3, 3);
            that.app.map.setZoom(newZoom);
            that.app.map.panBy(130,0);
        });
    },

    initialize: function(options){
        _.bindAll(this, 'render', 'keyClickClb', 'showLoginBox', 'showAccount', 'showReminder', 'addAttr', 'remAttr', 'showAllContexts');

        var that = this;
        var centerLatLng = new google.maps.LatLng(42.3604457757343,-71.08734495781516);
        this.app.map = new google.maps.Map(document.getElementById('map_canvas'), {
            'zoom': 11,
            // 'center': centerLatLng,
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
