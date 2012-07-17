define([
  'jquery',
  'underscore', 
  'backbone',
  'tooltip',
  'text!templates/modal.html',
  'text!templates/account.html',
  ], function($, _, Backbone, tooltip, modalTemplate, accountTemplate){
  var modalView = Backbone.View.extend({
    el: $('#modal'),
    events: {
        'click a.close': 'close',
        'click button#signout': 'signoutBtn',
        'click button#delete': 'deleteBtn',
    },

    signoutBtn: function(){
        this.trigger('logout');
        this.close();
    },
    deleteBtn: function(){
        this.trigger('delete');
        this.close();
    },
    
    close: function(){
        // this.undelegateEvents();
        this.el.hide();
    },

    render: function(options){
        var that = this;
        $('body').keydown(function(e){
            if (e.keyCode == 27)
                that.close();
        })
        var account_template = _.template( accountTemplate );
        var modal_template = _.template( modalTemplate );
        this.el.html( modal_template({title:'account'}) ).show();

        this.$('.content').html( account_template({
            username: APP.usernames[APP.user].name, 
            email: APP.usernames[APP.user].email,
        }) );
    },

    initialize: function(options) {
        _.bindAll(this, 'render', 'close', 'signoutBtn');
    },
  });
  return modalView;
});
