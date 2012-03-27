define(['underscore', 'backbone'], function(_, Backbone) {
    var KeyModel = Backbone.Model.extend({

    // Default attributes for the todo.
    defaults: {
        key: 'nokey',
        cnt: 0,
        selected: false,
        display: true,
        matches: {},
     },

    // Ensure that each todo created has `content`.
    initialize: function() {
    //       if (!this.get("content")) {
    //         this.set({"content": this.defaults.content});
    //       }
    },

    toggleSelected: function() {
        this.save({selected: !this.get("selected")});
    },

    toggle: function() {
        this.save({selected: !this.get("selected")});
    },

    clear: function() {
        this.destroy();
    }

    });
    return KeyModel;
});
