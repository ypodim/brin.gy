
define(['underscore', 'backbone'], function(_, Backbone) {
    Backbone.sync = function(method, model) {
        // console.log("SYNC", method + ": " + JSON.stringify(model));
        model.id = 1;

        // console.log("model", model);
    };


    var ValueModel = Backbone.Model.extend({

    // Default attributes for the todo.
    defaults: {
        key: 'nokey',
        val: 'noval',
        cnt: 0,
        haveit: false,
        selected: false,
        display: true,
        matches: {},
        visited: false,
     },

    // Ensure that each todo created has `content`.
    initialize: function() {
    //       if (!this.get("content")) {
    //         this.set({"content": this.defaults.content});
    //       }
    },

    toggleSelect: function() {
        this.save({selected: !this.get("selected")});
    },

    clear: function() {
        this.destroy();
    }

    });
    return ValueModel;
});
