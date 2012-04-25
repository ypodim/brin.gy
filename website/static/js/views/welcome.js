define([
  'jquery',
  'underscore', 
  'backbone',
  'router',

  'views/nametag',
  'text!templates/welcome.html',
  ], function($, _, Backbone, router, nametagView, welcomeViewTemplate){
  var welcomeView = Backbone.View.extend({
    el: $("#container"),

    render: function(){
        var compiled_template = _.template( welcomeViewTemplate );
        this.el.html( compiled_template() );
    },

    initialize: function(options){
        _.bindAll(this, 'render');
        this.state = options.state;
    },
  });
  return welcomeView;
});
