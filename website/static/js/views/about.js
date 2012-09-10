define([
  'jquery',
  'underscore', 
  'backbone',
  'text!templates/about.html'
  ], function($, _, Backbone, aboutViewTemplate){
  var aboutView = Backbone.View.extend({
    el: $("#modal"),
    events: {
        
    },
    initialize: function() {
//         _.bindAll(this, 'render');
    },
    render: function(){
        var compiled_template = _.template( aboutViewTemplate );
        this.el.html( compiled_template() );        
    },
  });
  return new aboutView;
});
