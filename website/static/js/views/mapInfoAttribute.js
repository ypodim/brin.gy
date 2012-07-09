define([
  'jquery',
  'underscore', 
  'backbone',
  'router',

  'text!templates/mapInfoAttribute.html',
  ], function($, _, Backbone, router, mapInfoAttrTemplate){
  var welcomeView = Backbone.View.extend({
    // el: $("#container"),
    events: {
        
    },

    template: _.template( mapInfoAttrTemplate ),

    render: function(options){
        this.el.html( this.template(options) );
    },

    initialize: function(options){
        _.bindAll(this, 'render');
    },
  });
  return welcomeView;
});
