define([
  'underscore', 
  'backbone', 
  'models/value'
  ], function(_, Backbone, Value){
	  
	var ValuesCollection = Backbone.Collection.extend({

    // Reference to this collection's model.
    model: Value,

    haveit: function() {
        return this.filter(function(value){ return value.get('haveit'); });
    },

    // Filter down the list to only value items that are still not finished.
    remaining: function() {
        return this.without.apply(this, this.done());
    },

    nextOrder: function() {
        if (!this.length) return 1;
        return this.last().get('order') + 1;
    },

    // Values are sorted by their original insertion order.
    comparator: function(value) {
        return value.get('order');
    }

  });
  return new ValuesCollection;
});
