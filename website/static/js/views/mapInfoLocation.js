define([
  'jquery',
  'underscore', 
  'backbone',
  'app',

  'text!templates/mapInfoLocation.html'
  ], function($, _, Backbone, appConfig, mapInfoLocationTemplate){
  var mapInfoLocationView = Backbone.View.extend({
    
    className: 'infoboxContext',
    events: {
        'click a.zoom': 'zoomHere',
        'click button#addBtn': 'useBtn',
    },
    app: appConfig.getState(),
    template: _.template( mapInfoLocationTemplate ),

    useBtn: function() {
        if (! this.app.agent.loggedIn({alert:1})) {
            this.app.navbarView.login();
            return false;
        }
        console.log('use', this.model);
    },

    zoomHere: function() {
        var contextOptions = {
            center: this.model.get('location').center,
            radius: this.model.get('location').radius,
        };
        var circle = new google.maps.Circle(contextOptions);
        this.app.map.fitBounds(circle.getBounds());
        this.app.map.setZoom(this.app.map.getZoom()-2);
    },

    render: function(){
        this.$el.html( this.template(this.model.toJSON()) );
    },

    initialize: function(model){
        _.bindAll(this, 'render');
    },
  });
  return mapInfoLocationView;
});
