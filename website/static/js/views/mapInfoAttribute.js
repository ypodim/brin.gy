define([
  'jquery',
  'underscore', 
  'backbone',
  'app',
  'router',

  'text!templates/mapInfoAttribute.html',
  'text!templates/userMatch.html'
  ], function($, _, Backbone, appConfig, router, mapInfoAttrTemplate, userMatchTemplate){
  var welcomeView = Backbone.View.extend({
    // el: $('div'),
    className: 'infobox',
    events: {
        'click a': 'zoomHere',
    },
    app: appConfig.getState(),
    template: _.template( mapInfoAttrTemplate ),

    zoomHere: function() {
        var contextOptions = {
            center: this.options.center,
            radius: this.options.radius,
        };
        var circle = new google.maps.Circle(contextOptions);
        this.app.map.fitBounds(circle.getBounds());
    },

    render: function(){
        console.log(this.options);
        $(this.el).html( this.template(this.options) );
        var utemplate = _.template(userMatchTemplate);
        for (var m in this.options.val.matches) {
            var username = this.options.val.matches[m];
            var uhtml = utemplate({username:username});
            this.$('div#matches').append(uhtml);
        }

        
    },

    initialize: function(options){
        _.bindAll(this, 'render');
        this.options = options;
    },
  });
  return welcomeView;
});
