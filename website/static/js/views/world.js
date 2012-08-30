define([
  'jquery',
  'underscore', 
  'backbone',
  'app',

  'models/attribute',
  'collections/attributes',

  'views/key',
  'views/mapInfoAttribute',
  'views/mapInfoContext',
  'views/mapInfoLocation',
  'views/mapInfoPreview',
  'views/valueFrame',
  
  'views/modal',
  'views/chooseloc',

  'text!templates/frame.html',
  'text!templates/explorerMatch.html',

  'http://google-maps-utility-library-v3.googlecode.com/svn/tags/infobox/1.1.9/src/infobox.js'
  ], function($, _, Backbone, appConfig, attrModel, attrCollection, 
    keyView, mapInfoAttrView, mapInfoContextView, mapInfoLocationView, mapInfoPreviewView, valueFrameView, modalView, chooselocView, 
    frameTemplate, explorerMatchTemplate,
    test){
  var welcomeView = Backbone.View.extend({
    el: $('body'),
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

    showExplorer: function(){
        var that = this;

        this.$('aside').empty();
        this.app.navbarView.toggleContextTitle({flag:false});

        this.$('button#addContext').hide();
        this.$('button#addLocation').hide();
        this.$('button#backToContext').hide();

        this.$('aside').show().toggleClass('hideAside', false);

        this.populateAllLocations();

        var heatMapData = [
            {location: new google.maps.LatLng(37.782, -122.447), weight: 0.5},
            new google.maps.LatLng(37.782, -122.445),
            {location: new google.maps.LatLng(37.782, -122.443), weight: 2},
            {location: new google.maps.LatLng(37.782, -122.441), weight: 3},
            {location: new google.maps.LatLng(37.782, -122.439), weight: 2},
            new google.maps.LatLng(37.782, -122.437),
            {location: new google.maps.LatLng(37.782, -122.435), weight: 0.5},

            {location: new google.maps.LatLng(37.785, -122.447), weight: 3},
            {location: new google.maps.LatLng(37.785, -122.445), weight: 2},
            new google.maps.LatLng(37.785, -122.443),
            {location: new google.maps.LatLng(37.785, -122.441), weight: 0.5},
            new google.maps.LatLng(37.785, -122.439),
            {location: new google.maps.LatLng(37.785, -122.437), weight: 2},
            {location: new google.maps.LatLng(37.785, -122.435), weight: 3}
        ];

        // var heatmap = new google.maps.visualization.HeatmapLayer({
            // data: heatMapData,
        // });
        // heatmap.setMap(this.app.map);

        var emTemplate = _.template( explorerMatchTemplate );

        this.popup && this.popup.close({force:true});
        this.popup = new chooselocView({el: this.$('#popup')});
        this.popup.render({explore: true});
        this.popup.bind('explorer:match', function(obj){

            that.$('aside').empty();

            this.app.getAllLocations(function(json){
                for (var i in json.locations) {
                    var revlocation = json.locations[i];
                    for (var j in revlocation.reversePointers) {
                        var match = revlocation.reversePointers[j];
                        // console.log(JSON.stringify(match))

                        var str = '';
                        if (match.type == 'context') 
                            str = 'application: <b>'+match.cdata.title+'</b>';
                        else
                            str = '<b>'+match.val+'</b> ('+match.key+')';
                        that.$('aside').append( emTemplate({match:str}) );
                    }
                }
            }, obj);
        });
    },

    backToContext: function(){
        this.app.router.navigate('#/c/'+this.app.context().id);
        return false;
    },

    clearMap: function(){
        _.each(this.circles, function(circle){ 
            circle.infowindow.close();
            circle.infopreviewwindow.close();
        })
        for (var i in this.circles) {
            this.circles[i].circle.setMap(null);
            this.circles[i].marker.setMap(null);
        }
        this.circles = [];
    },

    updateAlertsIndication: function(alerts) {
        var title = 'Brin.gy';
        if (alerts > 0)
            title = 'Brin.gy ('+alerts+')';
        $('title').html(title);
    },

    showAllContexts: function(options){
        console.log('showAllContexts');
        this.renderFrame();

        if (!(options && options.notoggle))
            this.$('aside').show().toggleClass('hideAside', true);

        // this.app.modal.close();
        this.popup && this.popup.close({force:true, close:true});

        this.$('button#addContext').show();
        this.$('button#addLocation').hide();

        this.app.navbarView.toggleContextTitle({flag:false});

        var ctitle = this.app.context().title;
        this.$('button#backToContext').html('Back to '+this.app.context().title+' >').toggle(ctitle != null);
        
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

    showReminder: function(argument) {
        this.app.modal.render({title: 'reminder'});
    },

    onLogin: function(){
        this.app.navbarView.render();
    },

    onDeleteAccount: function(){
        // console.log('del');
    },

    postLocationAttr: function(key, val, circle){
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
            key: key,
            val: val,
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
            key: key,
            val: val,
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
            // console.log('newcontext - modal closed');
            that.showAllContexts({notoggle:true});
        }).bind('newcontext', function(appdic){
            
            var message = 'Choosing location for new application: "'+appdic.title+'"';
            that.app.navbarView.render({message:message})
            that.getLocationInput( function(circle){

                that.app.navbarView.render();

                that.$('button#addContext').show();
                
                if (circle && circle.center) {
                    // console.log('newcontext - modal closed with', appdic, circle);

                    contextOptions = {
                        id: null,
                        title: appdic.title,
                        description: appdic.description,
                        permissions: appdic.permissions,
                        location: {
                            id: circle.id,
                            title: circle.title,
                            lat: circle.center.lat(),
                            lon: circle.center.lng(),
                            radius: circle.radius,
                            creator: circle.creator,
                        },
                    }

                    var clb = function(json){
                        // console.log('new context post got back:', json);
                        if (json.error) {
                            alert(json.error);
                            return false;
                        }

                        that.app.router.navigate('#/c/'+json.cid);
                        that.app.modal.render({title: 'newkey'});
                        that.app.modal.bind('newkey', function(obj){
                            // console.log('new key result', obj)
                        })
                    };
                    that.app.postNewContext(contextOptions, clb);
                    
                } else
                    that.showAllContexts({notoggle:true});
            });
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
                that.app.modal.render({
                    title: 'getLocTitle',
                    location: circle.title,
                }).unbind('modal:closed').unbind('newlocationattr');
                that.app.modal.bind('modal:closed', function(){
                    // console.log('newcontext - modal closed');
                }).bind('newlocationattr', function(options){
                    var val = options.val;
                    // console.log('modal closed submit', key, circle, val);
                    that.postLocationAttr(key, val, circle);
                });
            }
        });
    },

    getLocationInput: function(clb) {
        this.popup && this.popup.close({force:true});
        this.popup = new chooselocView({el: this.$('#popup')});
        this.popup.render();
        this.popup.unbind('newlocation');
        this.popup.bind('newlocation', function(circle){ 
            clb && clb(circle);
        });
        
        this.populateAllLocations();
    },

    populateAllLocations: function(){
        var that = this;
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
                title: loc.title,
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
            this.popup = new valueFrameView({el: this.$('#popup'), models:models, key:kmodel.get('key')});
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
            title: model.get('val') || model.get('title'),
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
            strokeWeight: 1,
            fillColor: options.fillcolor,
            fillOpacity: 0.05,
            map: this.app.map,
            center: options.center,
            radius: options.radius,
        };

        var mapCircle = new google.maps.Circle(contextOptions);

        var markerPos = options.markerPos;
        if (! markerPos)
            markerPos = options.center;

        var marker = new google.maps.Marker({
            // icon: options.icon,
            position: markerPos,
            map: this.app.map,
            title: options.title,
        });
        if (options.icon)
            marker.setIcon(options.icon);

        // google.maps.event.addListener(mapCircle, 'mouseover', function(event) {
        //     this.setOptions({strokeColor:'red'});
        // });
        // google.maps.event.addListener(mapCircle, 'mouseout', function(event) {
        //     this.setOptions({strokeColor: options.strokecolor});
        //     this.setOptions({zIndex:0});
        // });

        var that = this;
        var offsetX = (options.calloutSide) ? 20 : -195;
        var offsetY = (options.calloutSide) ? -95 : -193;

        var myOptions = {
            content: options.infowindowContent,
            maxWidth: 0,
            pixelOffset: new google.maps.Size(offsetX, offsetY),
            infoBoxClearance: new google.maps.Size(1, 1),
            // pane: "floatPane",
            // boxClass: 'infoBox',
            // enableEventPropagation: false,
        };

        var ib = new InfoBox(myOptions);

        var pmodel = new Backbone.Model({title: options.title});
        var infowindowPreviewView = new mapInfoPreviewView({model: pmodel});
        infowindowPreviewView.bind('preview:clicked', function(title){
            _.each(that.circles, function(circle){ 
                circle.infowindow.close(); 
                circle.circle.setOptions({strokeColor: options.strokecolor, strokeWeight: 1});
            })
            ib.open(that.app.map, marker);
            mapCircle.setOptions({strokeColor: 'red', strokeWeight: 3});
        });

        infowindowPreviewView.render();
        var myOptions = {
            content: infowindowPreviewView.el,
            // maxWidth: 0,
            pixelOffset: new google.maps.Size(-61, -68),
            infoBoxClearance: new google.maps.Size(1, 1),
            boxClass: 'infoBoxPreview',
        };
        var ibpreview = new InfoBox(myOptions);
        ibpreview.open(that.app.map, marker);
        
        google.maps.event.addListener(marker, 'click', function() {
            _.each(that.circles, function(circle){ 
                circle.infowindow.close(); 
                circle.circle.setOptions({strokeColor: options.strokecolor, strokeWeight: 1});
            })
            ib.open(that.app.map, marker);
            mapCircle.setOptions({strokeColor: 'red', strokeWeight: 3});
        });
        google.maps.event.addListener(mapCircle, 'click', function() {
            _.each(that.circles, function(circle){ circle.infowindow.close(); })
        });

        this.circles.push({circle:mapCircle, marker:marker, infowindow:ib, infopreviewwindow:ibpreview});
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

    renderFrame: function(){
        this.$('#container').html(_.template( frameTemplate ));
    },

    render: function(){
        this.renderFrame();

        this.app.navbarView.enableContextMenu();
        this.app.navbarView.toggleContextTitle({flag:true});
        this.$('aside').toggleClass('hideAside', false);
        this.$('button#addContext').fadeOut();
        this.clearMap();

        if (this.selectedKeyModel) {
            this.keyClickClb( this.selectedKeyModel );
            return false;
        }

        // console.log('WORLD render', this.app.context().title)

        var that = this;
        this.collection.reset();
        this.$('aside > div.list').empty();
        this.app.getKeyvals(function(json){
            var bounds = new google.maps.LatLngBounds();
            var locTitles = {};

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

                                var markerPos = center;
                                var lid = xdata.id;

                                if (locTitles[lid]) {
                                    var randomRadius = Math.min( (0.3+Math.random()) * radius, radius*0.8 );
                                    var randomAngle = Math.random()*360;
                                    markerPos = google.maps.geometry.spherical.computeOffset(
                                                    center, 
                                                    randomRadius, 
                                                    randomAngle
                                                )
                                } else {
                                    locTitles[lid] = lid;
                                }

                                bounds.extend(markerPos);

                                model.set({location: {
                                    center:center, 
                                    radius:radius,
                                    markerPos: markerPos,
                                }});
                                that.addMapCircle(model);
                            // }
                            
                            that.collection.add(model);
                        }
                    }
                }
            }

            that.app.map.fitBounds(bounds);
            var newZoom = Math.max(that.app.map.getZoom()-0, 3);
            that.app.map.setZoom(newZoom);
            that.app.map.panBy(130,0);
        });
    },

    initialize: function(options){
        _.bindAll(this, 'render', 'keyClickClb', 'showLoginBox', 'showReminder', 'addAttr', 'remAttr', 'showAllContexts');

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


        // var moonTypeOptions = {
        //     getTileUrl: function(coord, zoom) {
        //         return 'http://localhost:8889/static/images/tile256.png';
        //     },
        //     isPng: true,
        //     tileSize: new google.maps.Size(256, 256),
        //     maxZoom: 9,
        //     minZoom: 0,
        //     radius: 1738000,
        //     name: 'Moon'
        // };
        // var moonMapType = new google.maps.ImageMapType(moonTypeOptions);
        // this.app.map.mapTypes.set('moon', moonMapType);
        // this.app.map.setMapTypeId('moon');

        google.maps.event.addListener(this.app.map, 'click', function(event) {
            _.each(that.circles, function(circle){ circle.infowindow.close(); })
        });
    },
  });
  return welcomeView;
});
