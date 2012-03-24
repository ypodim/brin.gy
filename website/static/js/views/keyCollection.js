define([
    'jquery',
    'underscore', 
    'backbone',

    'alerts',
    'modal',
    'order!twipsy',
    'order!popover',

    'common/ego_website',
    'common/setup_modals',
    'common/attr_manager',

    'text!templates/mobileManage.html',

    'views/key',
    'views/value',

    'collections/keys',
    'collections/values',
], function($, _, Backbone, 
alerts, modal, popover, twipsy, 
common, modals, attr_manager, 
manageViewTemplate, 
keyView, valueView,
Keys, Values){

var managerView = Backbone.View.extend({
    // el: $('#m-choices'),

    initialize : function(options) {
        // bind the functions 'add' and 'remove' to the view.
        _.bindAll(this, 'render', 'add');

        // create an array of donut views to keep track of children
        this._keyViews = [];

        // add each donut to the view
        this.collection.each(this.add);

        // bind this view to the add and remove events of the collection!
        this.collection.bind('add', this.add);
    },

    addValue : function(model) {
        var vv = new valueView({
          tagName : 'div',
          model : model,
        });

        this._keyViews.push(kv);
        $(this.el).append(kv.render().el);
    },

    add : function(model) {
        console.log('a', this.el)
        var that = this;
        var kv = new keyView({
          // tagName : 'attribute',
          // el: $(that.el),
          model : model,
        });

        this._keyViews.push(kv);
        $(this.el).append(kv.render().el);
    },

    // render : function() {
    //     // Render each Donut View and append them.
    //     _(this._donutViews).each(function(kv) {
    //        $(this.el).append(kv.render().el);
    //     });

    //     return this;
    // },

    });
    return managerView;
});

