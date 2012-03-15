define([
  'jquery',
  'underscore', 
  'backbone',
  'common/ego_website',
  'text!templates/about.html'
  ], function($, _, Backbone, common, aboutViewTemplate){
  var aboutView = Backbone.View.extend({
    el: $("#container"),
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
  return aboutView;
});
