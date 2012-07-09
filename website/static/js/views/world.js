define([
  'jquery',
  'underscore', 
  'backbone',
  'router',

  // 'maps',
  'views/mapInfoAttribute',
  ], function($, _, Backbone, router, mapInfoAttrView){
  var welcomeView = Backbone.View.extend({
    el: $("#container"),
    events: {

    },

    render: function(){
        var that = this;
        url = APP.satellite.url+"/profile/"+APP.context.name+"/keyvals";
        $.getJSON(url, {user:APP.user}, function(json){
            // that.processNextKey(0, json.items);
            console.log(json);
            for (var i in json.items) {
                json.items[i]
            }
        });


        var centerLatLng = new google.maps.LatLng(37.748582,-122.418411);
        APP.map = new google.maps.Map(document.getElementById('map_canvas'), {
            'zoom': 10,
            'center': centerLatLng,
            'mapTypeId': google.maps.MapTypeId.ROADMAP,
            'zoomControl': false,
            'streetViewControl': false,
            'panControl': false,
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
            console.log('map', event)
        });
    },

    initialize: function(options){
        _.bindAll(this, 'render');
        this.router = options.router;
    },
  });
  return welcomeView;
});
