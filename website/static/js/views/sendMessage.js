define([
  'jquery',
  'underscore', 
  'backbone',
  'text!templates/sendMessage.html'
  ], function($, _, Backbone, aboutViewTemplate){
  var messageView = Backbone.View.extend({
    el: $("#container"),
    events: {
        
    },
    initialize: function(options) {
        _.bindAll(this, 'render', 'send', 'cancel');
        this.state = options.state;
        $('#cancelMessageBtn').click(this.cancel);
        $('#sendMessageBtn').click(this.send);
    },
    send: function() {
        console.log('send');

        var url = this.state.website_url;
        var data = {to:to, secret:pwd, user:user, msg:msg};
        $.post(url, data, function(json){
            console.log(json);
        }, 'json');
    },
    cancel: function() {
        this.state.renderManager = true;
        this.state.router.navigate('#', {trigger:true});
    },
    render: function(){
        var compiled_template = _.template( aboutViewTemplate );
        this.el.html( compiled_template() );
        this.$('span.badge').html(this.state.matches.length);
    },
  });
  return messageView;
});
