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
        'change input#locationinput': 'titleChanged',
        
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

        // this.autoFieldChanged();
    },

    close: function() {
        this.undelegateEvents();
        this.$('.locationPicker').remove();
        this.tempCircle && this.tempCircle.setMap(null);

        this.circle.key = this.selectedKey;
        this.trigger('newlocation', this.circle);
        console.log(this.circle);
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

    useLocation: function(model){
        console.log('uselocaiton', model);
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

        var x = $(this.app.map.getDiv()).width()/2 - 120;
        var y = top - header + padding + 2*borderwidth + 210;
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

    render: function(){
        var compiled_template = _.template( mapTemplate );
        this.$el.html( compiled_template() );

        this.doAutocomplete();
        return this;
    },

    doAutocomplete: function() {
        var input = document.getElementById(this.locationInput);
        var autocomplete = new google.maps.places.Autocomplete(input);
        var that = this;
        
        google.maps.event.addListener(autocomplete, 'place_changed', function() {
            var place = autocomplete.getPlace();
            if (place.geometry == undefined)
                return;

            if (place.geometry.viewport) {
                that.app.map.fitBounds(place.geometry.viewport);
            } else {
                that.app.map.setCenter(place.geometry.location);
                that.app.map.setZoom(17);  // Why 17? Because it looks good.
            }

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
    },

    initialize: function(options){
        _.bindAll(this, 'render');
        this.selectedKey = options.key;

        var that = this;
        LatLngControl = function (map) { this.setMap(that.app.map); }
        LatLngControl.prototype = new google.maps.OverlayView();
        LatLngControl.prototype.draw = function() {};
        LatLngControl.prototype.xy2latlng = function(x,y) {
            var projection = this.getProjection();
            var point = new google.maps.Point(x,y);
            var latlng = projection.fromContainerPixelToLatLng(point);
            return latlng;
        };
        this.latLngControl = new LatLngControl();
    },
  });
  return welcomeView;
});
