define([
  'jquery',
  'underscore', 
  'backbone',
  'app',

  'text!templates/sendMessage.html'
  ], function($, _, Backbone, appConfig, messageTemplate){
  var messageView = Backbone.View.extend({
    
    app: appConfig.getState(),
    template: _.template( messageTemplate ),
    events: {
        'submit form.sendMessage': 'sendMessage',
    },

    initialize: function(options) {
        _.bindAll(this, 'render', 'sendMessage');
    },

    sendMessage: function() {
        this.undelegateEvents();

        if (! this.app.agent.loggedIn({alert:1})) {
            this.app.navbarView.login();
            return false;
        }

        var that = this;        
        var dstusername = this.model.get('username');
        var message = this.$('textarea').val();
        var key = this.model.get('key');
        var val = this.model.get('val');
        this.app.sendMessage(dstusername, message, key, val, function(){
            // if (json.error.length > 0) {
            //     result = 'Error sending message: ' + json.error;
            //     that.$('div.sendMessage').addClass('alert-error').html(result);
            // } else {
            //     result = 'Message sent!';
            //     that.$('div.sendMessage').addClass('alert-success').html(result);
            // }
            // that.$('div.sendMessage').slideDown();
            // setTimeout(function(){
            //     that.$('div.sendMessage').fadeOut();
            //     that.state.router.navigate('#filters', {trigger:true});
            // }, 5000);
            console.log('sent');
            that.trigger('sent:message');
        });
    },

    render: function(){
        this.$el.html( this.template({username: this.model.get('username')}) ); 
    },
  });
  return messageView;
});
