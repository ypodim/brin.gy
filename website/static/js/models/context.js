define(['underscore', 'backbone'], function(_, Backbone) {
    var contextModel = Backbone.Model.extend({
    defaults: {
        name: '',
        userno: 0,
        attrno: 0,
        btnclass: 'btn-success',
    },

    initialize: function() {
        
    },

    clear: function() {
        this.destroy();
    }

    });
    return contextModel;
});
