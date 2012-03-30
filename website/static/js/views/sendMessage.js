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
        // $('#sendMessageBtn').click(this.send);
        $('#sendMessageBtn').one('click', this.send);
    },
    send: function() {
        
        var models = this.state.personCollection.included();
        var targets = [];
        for (var i in models) {
            var model = models[i];
            targets.push(model.get('username'));
        }

        var args = {
            from: this.state.user.name,
            to: targets,
            msg: this.$('textarea').val(),
        };
        this.state.stats('message', args);

        var url = this.state.agent.baseurl+'/'+this.state.user.name;
        // console.log('send', targets, url);
        var that = this;
        var data = {
            to:JSON.stringify(targets), 
            secret:this.state.user.pwd, 
            user:this.state.user.email, 
            msg:this.$('textarea').val(),
            action:'email',
            context:'all',
            selectedAttrs: JSON.stringify(this.selectedAttrs),
        };
        $.post(url, data, function(json){
            if (json.error.length > 0) {
                result = 'Error sending message: ' + json.error;
                that.$('div.sendMessage').addClass('alert-error').html(result);
            } else {
                result = 'Message sent!';
                that.$('div.sendMessage').addClass('alert-success').html(result);
            }
            that.$('div.sendMessage').slideDown();
            setTimeout(function(){
                that.$('div.sendMessage').fadeOut();
                that.state.router.navigate('#filters', {trigger:true});
            }, 5000);
            return false;
        }, 'json');
    },
    cancel: function() {
        this.state.renderManager = true;
        this.state.router.navigate('#', {trigger:true});
    },

    selectedAttrs: [],

    render: function(){
        var compiled_template = _.template( aboutViewTemplate );
        this.el.html( compiled_template() );
        this.$('span.badge').html(this.state.personCollection.included().length);

        // console.log(this.$('#selectedAttrs'));
        this.$('#selectedAttrs').empty();
        this.selectedAttrs = [];
        var that = this;
        _.each(this.state.attrCollection.selected(), function(model){
            that.selectedAttrs.push({
                key:model.get('key'),
                val:model.get('val'),
            });
            var html = model.get('key')+': '+model.get('val');
            var div = $('<div></div>').html(html).addClass('selectedAttr');
            this.$('#selectedAttrs').append(div);
        });
        
    },
  });
  return messageView;
});
