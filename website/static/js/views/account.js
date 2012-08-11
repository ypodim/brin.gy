define([
  'jquery',
  'underscore', 
  'backbone',
  'app',

  'text!templates/account.html',
  ], function($, _, Backbone, appConfig, accountViewTemplate){
  var accountView = Backbone.View.extend({
    // el: $("#container"),
    template: _.template(accountViewTemplate),
    events: {
        'click button#signout': 'signout',
        'click button#delete': 'delete',
        'change input[type=checkbox]': 'alertOption',
    },
    app: appConfig.getState(),

    alertOption: function(e){
        var input = $(e.target);
        var option = input.attr('name');
        var checked = (input.attr('checked') == 'checked');
        var options = {option: option, value: checked};
        this.app.saveOption(options);
    },

    delete: function(){
        if (confirm('All data associated with '+this.app.agent.id()+'\nwill be lost. Delete?')) {
            this.trigger('delete');
            this.app.trigger('delete');
        }
    },

    signout: function(){
        this.app.trigger('signout');
        this.trigger('signout');
    },

    render: function(){
        var that = this;
        this.app.agent.loadUserOptions(function(json){
            var options = json.options;
            var onvalueadded = options['alert:onvalueadded'];
            var onvaluecreated = options['alert:onvaluecreated'];
            var onattribute = options['alert:onattribute'];
            var onapplication = options['alert:onapplication'];

            var username = that.app.agent.fullInfo().name;
            var email = that.app.agent.fullInfo().email;
            var t = that.template({
                username: username, 
                email: email,
                onvalueadded: (onvalueadded) ? 'checked' : '',
                onvaluecreated: (onvaluecreated) ? 'checked' : '',
                onattribute: (onattribute) ? 'checked' : '',
                onapplication: (onapplication) ? 'checked' : '',
            });
            that.$el.html(t);
        });

        return this;
    },

    initialize: function(options){
        _.bindAll(this, 'render');
        return this;
    },
  });
  return accountView;
});
