define([
  'jquery',
  'underscore', 
  'backbone',
  'app',

  'text!templates/alerts.html',
  ], function($, _, Backbone, appConfig, alertsViewTemplate){
  var alertsView = Backbone.View.extend({
    // el: $("#container"),
    template: _.template(alertsViewTemplate),
    events: {
        // 'click button#signout': 'signout',
        // 'click button#delete': 'delete',
        // 'change input[type=checkbox]': 'alertOption',
    },
    app: appConfig.getState(),

    render: function(){
        var that = this;
        this.app.agent.loadUserOptions(function(json){
            that.$el.html(that.template());
            for (var i in json.alerts) {
                var alert = json.alerts[i];
                that.$('div.alerts').append(alert);
            }
        });

        return this;
    },

    initialize: function(options){
        _.bindAll(this, 'render');
        return this;
    },
  });
  return alertsView;
});
