define(['underscore', 'backbone'], function(_, Backbone) {
    var attrModel = Backbone.Model.extend({
    defaults: {
        key: '',
        val: '',
        xdata: {},
        score: 0,
        haveit: false,
        selected: false,
        display: true,
        matches: {},
        visited: false,
        showControls: true,
    },

    initialize: function() {
        
    },
    
    toggleSelected: function() {
        this.save({selected: !this.get("selected")});
    },

    toggle: function() {
        this.save({haveit: !this.get("haveit")});
    },

    clear: function() {
        this.destroy();
    }

    });
    return attrModel;
});
