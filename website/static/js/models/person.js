define(['underscore', 'backbone'], function(_, Backbone) {
    var userModel = Backbone.Model.extend({
    defaults: {
        username: '',
        include: true,
     },

    clear: function() {
        this.destroy();
    }

    });
    return userModel;
});
