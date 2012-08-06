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
        'click button#useBtn': 'useBtn',
    },
    app: appConfig.getState(),
    template: _.template( mapInfoLocationTemplate ),

    useBtn: function() {
        if (! this.app.agent.loggedIn({alert:1})) {
            this.app.navbarView.login();
            return false;
        }
        this.trigger('uselocation', this.model);
    },

    zoomHere: function() {
        console.log('location zoom')
        var contextOptions = {
            center: this.model.get('center'),
            radius: this.model.get('radius'),
        };
        var circle = new google.maps.Circle(contextOptions);
        this.app.map.fitBounds(circle.getBounds());

        var scale = parseFloat(this.model.get('radius'))/10;
        var log2scale = Math.log(scale) / Math.log(2);
        var zoom = Math.round(20.9-log2scale);
        this.app.map.setZoom(zoom);
        
        var offX = 120;
        var offY = $(this.app.map.getDiv()).height()/2-415;
        this.app.map.panBy(offX,offY);
        return false;
    },

    render: function(){
        this.$el.html( this.template(this.model.toJSON()) );
    },

    initialize: function(){
        _.bindAll(this, 'render');
    },
  });
  return mapInfoLocationView;
});
