define([
  'jquery',
  'underscore', 
  'backbone',
  'app',

  'text!templates/mapInfoContext.html',
  'text!templates/userMatch.html'
  ], function($, _, Backbone, appConfig, mapInfoContextTemplate, userMatchTemplate){
  var mapinfoContextView = Backbone.View.extend({
    
    className: 'infoboxContext',
    events: {
        'click a.zoom': 'zoomHere',
        'click button#enterBtn': 'enterBtn',
    },
    app: appConfig.getState(),
    template: _.template( mapInfoContextTemplate ),

    enterBtn: function() {
        window.location.href = '/'+this.model.get('cid');
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
        // var score = this.model.get('score');
    },

    initialize: function(){
        _.bindAll(this, 'render');
        this.model.bind('change', this.render);
    },
  });
  return mapinfoContextView;
});
