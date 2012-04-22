define([
    'jquery',
    'underscore', 
    'backbone', 
    'models/context'
  ], function($, _, Backbone, Attr){
	  
	var contextCollection = Backbone.Collection.extend({

    model: Attr,
    initialize: function(models, options) {
        // _.bindAll(this, 'modelChange');
    },

  });
  return contextCollection;
});
