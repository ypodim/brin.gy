define([
    'jquery',
    'underscore',
    'backbone',
    'views/welcome',
], function($, _, Backbone, welcomeView){
  var AppRouter = Backbone.Router.extend({
    routes: {
        "s:slideno": "gotoSlide",
        "*actions": "defaultRoute",
    },
    
    initialize: function(options){
        this.wview = new welcomeView({
            router:this,
        });
    },
    gotoSlide: function(sno){
        sno = parseInt(sno);
        this.wview.slide = sno;
        this.wview.showSlide(sno);
    },
    defaultRoute: function( cntx ){
        this.wview.render();
    },
  });

  return AppRouter;
});