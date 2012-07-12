define([
  'jquery',
  'underscore', 
  'backbone',
  'router',

  'text!templates/mapInfoAttribute.html',
  ], function($, _, Backbone, router, mapInfoAttrTemplate){
  var welcomeView = Backbone.View.extend({
    // el: $('div'),
    className: 'infobox',
    events: {
        'click a': 'zoomHere',
    },

    template: _.template( mapInfoAttrTemplate ),

    zoomHere: function() {
        var contextOptions = {
            center: this.options.center,
            radius: this.options.radius,
        };
        var circle = new google.maps.Circle(contextOptions);
        APP.map.fitBounds(circle.getBounds());
    },

    render: function(){
        $(this.el).html( this.template(this.options) );
    },

    initialize: function(options){
        _.bindAll(this, 'render');
        this.options = options;
    },
  });
  return welcomeView;
});
