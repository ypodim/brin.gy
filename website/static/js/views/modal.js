define([
  'jquery',
  'underscore', 
  'backbone',
  'app',
  'tooltip',
  'text!templates/modal.html',
  'text!templates/account.html',
  'text!templates/reminder.html',
  'text!templates/newKey.html',
  ], function($, _, Backbone, appConfig, tooltip, modalTemplate, accountTemplate, reminderTemplate, newkeyTemplate){
  var modalView = Backbone.View.extend({
    el: $('#modal'),
    events: {
        'click a.close': 'close',
        'click button#signout': 'signoutBtn',
        'click button#delete': 'deleteBtn',
        // 'click button#reminder': 'reminderBtn',
        'submit form.reminder': 'submitReminder',

        'click li > a': 'typeSelection',
        'click button.cancel': 'close',
        'submit form.newKey': 'newKeySubmit',
        // 'click button.cancel': 'newKeyCancel',
    },
    app: appConfig.getState(),

    newKeySubmit: function(e){
        console.log('modal newky submit')
        var key = this.$('input#key').val();
        var keytype = this.$('[name=keytype]:checked').val();
        this.close();
        this.trigger('newkey', {key:key, type:keytype});
        return false;
    },
    typeSelection: function(e){    
        var type = $(e.target).attr('id');
        
        var kclass = 'icon-font';
        if (type == 'location')
            kclass = 'icon-map-marker';
        if (type == 'users')
            kclass = 'icon-user';
        this.$('a.dropdown-toggle > i').attr({class:kclass});

        console.log('oooo')
        return false;
    },

    signoutBtn: function(){
        this.trigger('logout');
        this.close();
    },
    deleteBtn: function(){
        if (confirm('All data associated with '+this.app.agent.id()+'\nwill be lost. Delete?'))
            this.trigger('delete');

        this.close();
    },
    
    submitReminder: function() {
        this.trigger('reminder');
        this.$('div.footer > img').show();
        // this.close();
        return false;
    },

    close: function(){
        // this.undelegateEvents();
        this.$('[required]').removeAttr('required');
        this.$el.hide();
        return false;
    },

    render: function(options){
        options = options || {};
        options.title = options.title || 'account';

        var that = this;
        $('body').keydown(function(e){
            if (e.keyCode == 27)
                that.close();
        })

        var modal_template = _.template( modalTemplate );
        this.$el.html( modal_template({title: options.title}) ).show();
        
        var inner_template;
        var data;
        if (options.title == 'account') {
            inner_template = _.template( accountTemplate );
            data = {
                username: this.app.agent.fullInfo().name, 
                email: this.app.agent.fullInfo().email,
            }
        }
        if (options.title == 'reminder') {
            inner_template = _.template( reminderTemplate );
            data = {
                
            }
            this.$('div.box').addClass('narrow');
        }
        if (options.title == 'newkey') {
            this.$('span#title').html('New attribute')
            inner_template = _.template( newkeyTemplate );
            data = {
                
            }
        }

        this.$('.content').html( inner_template(data) );
    },

    initialize: function(options) {
        _.bindAll(this, 'render', 'close', 'signoutBtn', 'newKeySubmit');
    },
  });
  return modalView;
});
