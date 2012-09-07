define([
  'jquery',
  'underscore', 
  'backbone',
  'app',

  'models/attribute',
  'views/key',
  
  'text!templates/asideAttributes.html',
  ], function($, _, Backbone, appConfig, attrModel, keyView, asideAttributesTemplate){
  var asideAttributesView = Backbone.View.extend({
    el: $('aside'),
    events: {
        // 'click button#addLocation': 'addLocationBtn',
        'click button#newKey': 'newKey',
        // 'click button#addContext': 'addContextBtn',
        // 'click button#backToContext': 'backToContext',
    },
    app: appConfig.getState(),
    template: _.template( asideAttributesTemplate ),

    collection: new Backbone.Collection(),
    selectedKeyModel: null,

    newKey: function() {
        if (! this.app.agent.loggedIn({alert:1})) {
            this.app.navbarView.login();
            return false;
        }
        this.app.modal.render({title: 'newkey'});
    },

    add: function(attr){
        var keymodel = new Backbone.Model(attr);
        var kview = new keyView({model: keymodel});
        var that = this;
        this.collection.add(keymodel);

        kview.render();
        kview.bind('keyclick', function(){
            that.$('a.asideKey').removeClass('highlighted');
            that.$('a.asideKey > i').removeClass('icon-white');
            that.selectedKeyModel = keymodel;
            that.trigger('keyclick', keymodel);
        });

        if (attr.prepend) {
            this.$('aside > div.list').prepend(kview.el);
            kview.keyClick();
            if (attr.type == 'location')
                this.$('button#addLocation').click();
            if (attr.type == 'string')
                this.popup.newAttr();
        } else
            this.$('div.list').append(kview.el);
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
  return asideAttributesView;
});
