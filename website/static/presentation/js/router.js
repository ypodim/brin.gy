define([
    'jquery',
    'underscore',
    'backbone',
    'views/welcome',
], function($, _, Backbone, welcomeView){
  var AppRouter = Backbone.Router.extend({
    routes: {
        "*actions": "defaultRoute",
    },
    
    initialize: function(options){
        
    },

    defaultRoute: function( cntx ){
        var wview = new welcomeView();
        wview.render();
    },
  });

  return AppRouter;
});