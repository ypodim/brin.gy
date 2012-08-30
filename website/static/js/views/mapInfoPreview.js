define([
  'jquery',
  'underscore', 
  'backbone',
  'app',

  'tooltip',

  'text!templates/mapInfoPreview.html',
  ], function($, _, Backbone, appConfig, tooltipjs, mapInfoPreviewTemplate){
  var mapInfoPreviewView = Backbone.View.extend({
    className: 'previewTitle',
    events: {
        'click a.title': 'clicked',
    },
    app: appConfig.getState(),
    template: _.template( mapInfoPreviewTemplate ),

    clicked: function() {
        this.trigger('preview:clicked', this.model.get('title'));
        return false;
    },

    render: function(){
        this.$el.html( this.template(this.model.toJSON()) );
    },

    initialize: function(){
        _.bindAll(this, 'render');
    },
  });
  return mapInfoPreviewView;
});
