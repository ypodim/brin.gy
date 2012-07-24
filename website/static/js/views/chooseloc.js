define([
  'jquery',
  'underscore', 
  'backbone',
  'app',
  'router',

  'text!templates/chooseloc.html',
  'views/mapInfoAttribute',
  ], function($, _, Backbone, appConfig, router, mapTemplate, mapInfoAttrView){
  var welcomeView = Backbone.View.extend({
    el: $("#popup"),
    events: {
        'click button#cancel': 'cancelBtn',
        'click button#useloc': 'useBtn',
        'click button#next': 'okBtn',
        'keyup input#locationinput': 'titleChanged',
        'submit form': 'submitLocation',
    },
    app: appConfig.getState(),

    map: null,
    // contexts: {},
    tempCircle: null,
    tempc: 0,
    locationInput: 'locationinput',
    circle: {},

    submitLocation: function(){
        return false;
    },

    titleChanged: function(e){
        var gotText = ($(e.target).val() != '');
        var gotCircle = (this.tempCircle != null);
        var flag = (gotText && gotCircle);
        this.$('button#next').toggleClass('disabled', !flag);
    },

    close: function() {
        this.undelegateEvents();
        this.$('.locationPicker').remove();
        this.tempCircle && this.tempCircle.setMap(null);

        this.circle.key = this.selectedKey;
        this.onCloseClb && this.onCloseClb(this.circle);
    },
    cancelBtn: function() {
        this.circle = {};
        this.close();
    },
    okBtn: function() {
        var locationTitle = this.$('#'+this.locationInput).val();
        if (locationTitle == '')
            return;

        this.circle.title = locationTitle;
        this.close();
    },
    useBtn: function() {
        var zoom = this.app.map.getZoom();
        if (zoom < 10) {
            alert('Such a large area conveys almost no useful information. Please zoom more...');
            return false;
        }

        var header = 40;
        var padding = parseInt(this.$('#crosshair').css('padding-top').replace(/[^-\d\.]/g, ''));
        var top = this.$('#crosshair').offset().top;
        var borderwidth = parseInt(this.$('#crosshair').css('border-width'));

        var x = $(this.app.map.getDiv()).width()/2 + 13;
        var y = top - header + padding + 2*borderwidth + 5;
        var scale = Math.pow(2, 20.9-zoom);
        var radius = 10*scale;
        var center = this.latLngControl.xy2latlng(x,y);
        
        this.circle.center = center;
        this.circle.radius = radius;

        var contextOptions = {
            strokeColor: "pink",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#FF0000",
            fillOpacity: 0.1,
            map: this.app.map,
            center: center,
            radius: 10*scale,
        };

        this.tempCircle && this.tempCircle.setMap(null);
        this.tempCircle = new google.maps.Circle(contextOptions);
        
        google.maps.event.addListener(this.tempCircle, 'click', this.areaClick);
        google.maps.event.addListener(this.tempCircle, 'mouseover', this.areaMouseOver);
        google.maps.event.addListener(this.tempCircle, 'mouseout', this.areaMouseOut);

        if (this.$('#'+this.locationInput).val())
            this.$('button#next').removeClass('disabled');
    },
    areaClick: function(event) {
        // console.log('area', this.cntx)
    },
    areaMouseOver: function(event) {
        this.setOptions({strokeColor:'red'});
    },
    areaMouseOut: function(event) {
        this.setOptions({strokeColor:'pink'});
        this.setOptions({zIndex:0});
    },

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

    render: function(onCloseClb){
        var compiled_template = _.template( mapTemplate );
        var that = this;
        this.$el.html( compiled_template() );

        this.onCloseClb = onCloseClb;

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

        
        // Create new control to display latlng and coordinates under mouse.
        this.latLngControl = new this.LatLngControl(this.app.map);
        // var that = this;


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

        this.doAutocomplete();
    },

    doAutocomplete: function() {
        var input = document.getElementById(this.locationInput);
        var autocomplete = new google.maps.places.Autocomplete(input);
        var that = this;

        autocomplete.bindTo('bounds', this.app.map);

        var marker = new google.maps.Marker({
            map: that.app.map
        });

        
        google.maps.event.addListener(autocomplete, 'place_changed', function() {
            console.log('ok')
            var place = autocomplete.getPlace();
            if (place.geometry == undefined)
                return;

            if (place.geometry.viewport) {
                that.app.map.fitBounds(place.geometry.viewport);
            } else {
                that.app.map.setCenter(place.geometry.location);
                that.app.map.setZoom(17);  // Why 17? Because it looks good.
            }

            var image = new google.maps.MarkerImage(
              place.icon,
              new google.maps.Size(71, 71),
              new google.maps.Point(0, 0),
              new google.maps.Point(17, 34),
              new google.maps.Size(35, 35));
            marker.setIcon(image);
            marker.setPosition(place.geometry.location);

            var address = '';
            if (place.address_components) {
                address = [(place.address_components[0] &&
                            place.address_components[0].short_name || ''),
                            (place.address_components[1] &&
                            place.address_components[1].short_name || ''),
                            (place.address_components[2] &&
                            place.address_components[2].short_name || '')
                        ].join(' ');
            }
            console.log(place.name, address, place);
        });

        // Sets a listener on a radio button to change the filter type on Places
        // Autocomplete.
        function setupClickListener(id, types) {
          var radioButton = document.getElementById(id);
          google.maps.event.addDomListener(radioButton, 'click', function() {
            autocomplete.setTypes(types);
          });
        }

        setupClickListener('changetype-all', []);
        setupClickListener('changetype-establishment', ['establishment']);
        setupClickListener('changetype-geocode', ['geocode']);
    },

    initialize: function(options){
        _.bindAll(this, 'render');
        this.selectedKey = options.key;
    },
  });
  return welcomeView;
});
