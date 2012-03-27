define(['underscore', 'backbone'], function(_, Backbone) {
    var userModel = Backbone.Model.extend({
    defaults: {
        username: '',
     },

    clear: function() {
        this.destroy();
    }

    });
    return userModel;
});
