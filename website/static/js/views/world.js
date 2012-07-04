define([
  'jquery',
  'underscore', 
  'backbone',
  'router',

  // 'maps',
  'text!templates/world.html',
  ], function($, _, Backbone, router, mapTemplate){
  var welcomeView = Backbone.View.extend({
    el: $("#container"),
    events: {
        'click button#useloc': 'useBtn',
        'click button#next': 'nextBtn',
    },

    contexts: {},
    contextCircle: null,
    page: 1,

    nextBtn: function() {
        if (this.page == 1) {
            this.page = 2;
            this.$('div.pickLocation > div.caption').html('Choose title and description for your application');
            this.$('button#useloc').html('< Back');
            this.$('button#next').html('Create app');
            this.$('#page1').toggle();
            this.$('#page2').toggle();
        } else {
            // submit
        }
    },
    useBtn: function() {
        if (this.page == 2) {
            this.page = 1;
            this.$('div.pickLocation > div.caption').html('Choose the area in which your application is relevant');
            this.$('button#useloc').html('Use this area');
            this.$('button#next').html('Next >');

            this.$('#page1').toggle();
            this.$('#page2').toggle();

            return;
        }

        var padding = parseInt(this.$('#crosshair').css('padding-top').replace(/[^-\d\.]/g, ''));
        var top = this.$('#crosshair').offset().top;
        var borderwidth = parseInt(this.$('#crosshair').css('border-width'));

        var x = this.$('#map_canvas').width()/2;
        var y = top + padding + 2*borderwidth + 5;
        var scale = Math.pow(2, 21-this.map.getZoom());

        var center = this.latLngControl.xy2latlng(x,y);
        this.contexts['chicago'] = {
            center: center,
            radius: 10*scale,
        };


        var city = 'chicago';

        var populationOptions = {
            strokeColor: "#FF0000",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#FF0000",
            fillOpacity: 0.1,
            map: this.map,
            center: this.contexts[city].center,
            radius: this.contexts[city].radius,
        };

        if (this.contextCircle != null)
            this.contextCircle.setMap(null)
        this.contextCircle = new google.maps.Circle(populationOptions);

        this.$('button#next').removeClass('disabled').html('Next >');
    },

    map: null,

    LatLngControl: function (map) {
        /**
         * Offset the control container from the mouse by this amount.
         */
        this.ANCHOR_OFFSET_ = new google.maps.Point(8, 8);

        /**
         * Pointer to the HTML container.
         */
        this.node_ = this.createHtmlNode_();

        // Add control to the map. Position is irrelevant.
        map.controls[google.maps.ControlPosition.TOP].push(this.node_);

        // Bind this OverlayView to the map so we can access MapCanvasProjection
        // to convert LatLng to Point coordinates.
        this.setMap(map);

        // Register an MVC property to indicate whether this custom control
        // is visible or hidden. Initially hide control until mouse is over map.
        this.set('visible', false);
    },

    render: function(){
        // Extend OverlayView so we can access MapCanvasProjection.
        this.LatLngControl.prototype = new google.maps.OverlayView();
        this.LatLngControl.prototype.draw = function() {};

        /**
        * @private
        * Helper function creates the HTML node which is the control container.
        * @return {HTMLDivElement}
        */
        this.LatLngControl.prototype.createHtmlNode_ = function() {
            var divNode = document.createElement('div');
            divNode.id = 'latlng-control';
            divNode.index = 100;
            return divNode;
        };

        /**
        * MVC property's state change handler function to show/hide the
        * control container.
        */
        this.LatLngControl.prototype.visible_changed = function() {
            this.node_.style.display = this.get('visible') ? '' : 'none';
        };

        /**
        * Specified LatLng value is used to calculate pixel coordinates and
        * update the control display. Container is also repositioned.
        * @param {google.maps.LatLng} latLng Position to display
        */
        this.LatLngControl.prototype.updatePosition = function(latLng) {
            var projection = this.getProjection();
            var point = projection.fromLatLngToContainerPixel(latLng);

            // Update control position to be anchored next to mouse position.
            point.x -= 100;
            this.node_.style.left = point.x + this.ANCHOR_OFFSET_.x + 'px';
            this.node_.style.top = point.y + this.ANCHOR_OFFSET_.y + 'px';

            // Update control to display latlng and coordinates.
            this.node_.innerHTML = [
              latLng.toUrlValue(4),
              '<br/>',
              point.x,
              'px, ',
              point.y,
              'px'
            ].join('');
        };
        this.LatLngControl.prototype.xy2latlng = function(x,y) {
            var projection = this.getProjection();
            var point = new google.maps.Point(x,y);
            var latlng = projection.fromContainerPixelToLatLng(point);
            return latlng;
        };

        var centerLatLng = new google.maps.LatLng(37.748582,-122.418411);
        this.map = new google.maps.Map(document.getElementById('map_canvas'), {
            'zoom': 10,
            'center': centerLatLng,
            'mapTypeId': google.maps.MapTypeId.ROADMAP,
            'zoomControl': false,
            'streetViewControl': false,
            'panControl': false,
        });
        
        // Create new control to display latlng and coordinates under mouse.
        this.latLngControl = new this.LatLngControl(this.map);
        var that = this;

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
    
        

        // google.maps.event.addListener(map, 'click', function(event) {
        //     console.log('map', event)
        // });
    },

    initialize: function(options){
        _.bindAll(this, 'render');
        this.router = options.router;

        

        var compiled_template = _.template( mapTemplate );
        var that = this;
        this.el.html( compiled_template() );
    },
  });
  return welcomeView;
});
