define([
  'jquery',
  'underscore', 
  'backbone',
  'app',

  'text!templates/alerts.html',
  'text!templates/alert.html',
  ], function($, _, Backbone, appConfig, alertsViewTemplate, alertViewTemplate){
  var alertsView = Backbone.View.extend({
    template: _.template(alertsViewTemplate),
    alertTemplate: _.template(alertViewTemplate),
    events: {
        'click button#clear': 'clearAll',
    },
    app: appConfig.getState(),

    clearAll: function(){
        this.app.clearAlerts();
    },
    render: function(){
        var that = this;
        this.app.agent.loadUserOptions(function(json){
            that.$el.html(that.template());
            for (var i in json.alerts) {
                
                var alert = json.alerts[i];
                var alerthtml = that.alertTemplate(alert);
                alerthtml = $(alerthtml).children('.'+alert.atype);

                that.$('div.alerts').append(alerthtml);
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
