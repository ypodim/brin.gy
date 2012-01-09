define([
  'underscore', 
  'backbone', 
  'models/key'
  ], function(_, Backbone, Key){
	  
	var KeysCollection = Backbone.Collection.extend({

    // Reference to this collection's model.
    model: Key,

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

    getKey: function(key) {
        return this.filter(function(kmodel){ return kmodel.get('key'); });
    },

    // Values are sorted by their original insertion order.
    comparator: function(value) {
        return value.get('order');
    }

  });
  return new KeysCollection;
});
