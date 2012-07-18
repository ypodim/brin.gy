define([
  'jquery',
  'underscore', 
  'backbone',
  'tooltip',
  'text!templates/modal.html',
  'text!templates/account.html',
  'text!templates/reminder.html',
  ], function($, _, Backbone, tooltip, modalTemplate, accountTemplate, reminderTemplate){
  var modalView = Backbone.View.extend({
    el: $('#modal'),
    events: {
        'click a.close': 'close',
        'click button#signout': 'signoutBtn',
        'click button#delete': 'deleteBtn',
        // 'click button#reminder': 'reminderBtn',
        'submit form.reminder': 'submitReminder'
    },

    signoutBtn: function(){
        this.trigger('logout');
        this.close();
    },
    deleteBtn: function(){
        this.trigger('delete');
        this.close();
    },
    // reminderBtn: function(){
    //     // this.$('form.reminder').submit();
    // },
    submitReminder: function() {
        this.trigger('reminder');
        this.$('div.footer > img').show();
        // this.close();
        return false;
    },

    close: function(){
        // this.undelegateEvents();
        this.el.hide();
    },

    render: function(options){
        options = options || {};
        options.title = options.title || 'account';
        // if (!options || !opti)
        //     options.title = 'account'

        var that = this;
        $('body').keydown(function(e){
            if (e.keyCode == 27)
                that.close();
        })

        var modal_template = _.template( modalTemplate );
        this.el.html( modal_template({title: options.title}) ).show();
        
        var inner_template;
        var data;
        if (options.title == 'account') {
            inner_template = _.template( accountTemplate );
            data = {
                username: APP.usernames[APP.user].name, 
                email: APP.usernames[APP.user].email,
            }
        }
        if (options.title == 'reminder') {
            inner_template = _.template( reminderTemplate );
            data = {
                
            }
            this.$('div.box').addClass('narrow');
        }

        this.$('.content').html( inner_template(data) );
    },

    initialize: function(options) {
        _.bindAll(this, 'render', 'close', 'signoutBtn');
    },
  });
  return modalView;
});
