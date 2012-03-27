define(['underscore', 'backbone'], function(_, Backbone) {
    var attrModel = Backbone.Model.extend({

    initialize: function() {
        
    },

    clear: function() {
        this.destroy();
    }

    });
    return attrModel;
});
