define([
  'underscore', 
  'backbone', 
  'models/person'
  ], function(_, Backbone, Person){
	  
	var personCollection = Backbone.Collection.extend({

    // Reference to this collection's model.
    model: Person,
    initialize: function() {
        this.bind('add', this.added);
    },

    included: function() {
        return this.filter(function(attribute){ return attribute.get('include'); });
    },

    byKey: function(key) {
        return this.filter(function(attribute){ return (attribute.get('username') == key); });
    },

  });
  return personCollection;
});
