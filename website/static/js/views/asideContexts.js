define([
  'jquery',
  'underscore', 
  'backbone',
  'app',

  'models/attribute',
  'views/context',
  
  'text!templates/asideContexts.html',
  ], function($, _, Backbone, appConfig, attrModel, contextView, asideContextsTemplate){
  var asideContextsView = Backbone.View.extend({
    el: $('aside'),
    events: {
        // 'click button#addLocation': 'addLocationBtn',
        // 'click button#newKey': 'newKey',
        // 'click button#addContext': 'addContextBtn',
        // 'click button#backToContext': 'backToContext',
    },
    app: appConfig.getState(),
    template: _.template( asideContextsTemplate ),

    collection: new Backbone.Collection(),

    newKey: function() {
        if (! this.app.agent.loggedIn({alert:1})) {
            this.app.navbarView.login();
            return false;
        }
        this.app.modal.render({title: 'newkey'});
    },

    add: function(cmodel){
        var cview = new contextView({model: cmodel});
        var that = this;
        this.collection.add(cmodel);

        cview.render();
        cview.bind('appclick', function(){
            that.$('a.asideKey').removeClass('highlighted');
            that.$('a.asideKey > i').removeClass('icon-white');
            that.trigger('appclick', cmodel);
        });

        this.$('div.list').append(cview.el);
        return false;
    },

    render: function(){
        this.collection.reset();
        this.$el.html(this.template());
    },

    initialize: function(options){
        _.bindAll(this, 'render');
    },
  });
  return asideContextsView;
});
