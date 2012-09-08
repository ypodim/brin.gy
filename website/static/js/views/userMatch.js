define([
  'jquery',
  'underscore', 
  'backbone',
  'app',

  'tooltip',

  'views/modal',

  'text!templates/userMatch.html',
  ], function($, _, Backbone, appConfig, tooltipjs, modalView, userMatchTemplate){
  var userMatchView = Backbone.View.extend({
    // className: 'userMatch',
    // el: $("<a href='#' class='userMatch'></a>"),

    events: {
        'click a.userMatch': 'clicked',
    },
    app: appConfig.getState(),
    template: _.template( userMatchTemplate ),

    clicked: function() {
        this.app.modal.render({title: 'send message', model: this.model});
        // this.trigger('usermatch:clicked', this.model.get('title'));
        return false;
    },

    render: function(){
        this.$el.html( this.template(this.model.toJSON()) );
        // email = 'ypo'
        // this.$('a.userMatch').attr({href: 'mailto:'+email})
    },

    initialize: function(){
        _.bindAll(this, 'render');
    },
  });
  return userMatchView;
});
