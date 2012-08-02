define([
  'jquery', 
  'underscore', 
  'backbone',
  'app',
  'text!templates/valueFrame.html',

  'views/valueDetailed',
  'models/attribute',
  ], function($, _, Backbone, appConfig, valuesFrameTemplate, valueView, attrModel){
  var ValueFrameView = Backbone.View.extend({

    el: $('#popup'),
    template: _.template(valuesFrameTemplate),
    app: appConfig.getState(),

    events: {
        'click button.expand': 'expandBtn',
        'click button#newAttr': 'newAttr',
    },

    initialize: function(options) {
        _.bindAll(this, 'render', 'expandBtn');
        this.model = new Backbone.Model({key:options.key, expanded:false});
        // this.model.bind('change', this.render);
        this.models = options.models;
    },

    close: function(options) {
        this.undelegateEvents();
        this.$el.hide();
    },

    newAttr: function(){
        if (! this.app.agent.loggedIn({alert:1})) {
            this.app.navbarView.login();
            return false;
        }

        var model = new attrModel({
            key: this.model.get('key'),
            val: '',
            score: 0,
            newAttr: 1,
        });
        var vview = new valueView({model:model});
        vview.render({newAttr:true});
        this.$('.header').after(vview.$el);
    },

    expandBtn: function(e){
        var flag = this.model.get('expanded');
        this.model.set({expanded:!flag});
        this.$('i.expand').toggleClass('icon-chevron-down', flag);
        this.$('i.expand').toggleClass('icon-chevron-up', !flag);

        _.each(this.models, function(model){
            model.view.toggleMatches(!flag);
        });
    },

    render: function() {
        this.$el.html(this.template(this.model.toJSON()));
        this.$el.removeClass('transparent').show();

        var that = this;
        _.each(this.models, function(model){
            var vview = new valueView({model:model});
            vview.render();
            model.view = vview;
            that.$el.append(vview.el);
        });

        return this;
    },

  });
  return ValueFrameView;
});