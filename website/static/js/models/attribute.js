define(['underscore', 'backbone'], function(_, Backbone) {
    var attrModel = Backbone.Model.extend({
    defaults: {
        key: '',
        val: '',
        cnt: 0,
        haveit: false,
        selected: false,
        display: true,
        matches: {},
        visited: false,
        showControls: true,
    },

    initialize: function() {
        
    },

    clear: function() {
        this.destroy();
    }

    });
    return attrModel;
});
