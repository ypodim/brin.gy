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
  'text!templates/feedback.html',
  'text!templates/about.html',
  'text!templates/newContextOptions.html',
  
  ], function($, _, Backbone, appConfig, tooltip, modalTemplate, accountTemplate, reminderTemplate, newkeyTemplate, feedbackTemplate, aboutTemplate, newContextOptionsTemplate){
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
        'submit form.feedback': 'feedbackSubmit',
        'submit form.newContextOptions': 'newContextSubmit',
        'keyup input#title': 'contextTitleChange',
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
    contextTitleChange: function(e){
        var that = this;
        var testTitle = $(e.target).val();
        this.timeout && clearTimeout(this.timeout);
        this.timeout = setTimeout(function(){
            console.log('testing')
            that.app.getContexts(function(json){
                e.target.setCustomValidity('');
                for (var i in json.contexts) {
                    var c = json.contexts[i];
                    if (c.title.toLowerCase() == testTitle.toLowerCase())
                        e.target.setCustomValidity('Application title exists!')
                }
            });    
        }, 200);
    },
    newContextSubmit: function(){
        var title = this.$('input#title').val();
        var description = this.$('textarea#description').val();
        var dic = {title:title, description:description};
        this.close({silent:true});
        this.trigger('newcontext', dic)
        return false;
    },
    feedbackSubmit: function(){
        var text = this.$('textarea').val();
        this.app.doFeedback(text);
        this.close();
        return false;
    },
    newKeySubmit: function(e){
        console.log('modal newky submit')
        var key = this.$('input#key').val();
        var keytype = this.$('[name=keytype]:checked').val();
        this.close();
        this.trigger('newkey', {key:key, type:keytype});
        console.log('newkey triggered?')
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

    close: function(options){
        this.$('[required]').removeAttr('required');
        this.$el.hide();
        if (!(options && options.silent))
            this.trigger('modal:closed');
        return false;
    },

    render: function(options){
        options = options || {};
        options.title = options.title || 'account';

        var that = this;
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
            console.log('modal - newkey')
        }
        if (options.title == 'feedback') {
            this.$('span#title').html('Feedback')
            inner_template = _.template( feedbackTemplate );
            data = {
                
            }
        }
        if (options.title == 'about') {
            this.$('span#title').html('About')
            inner_template = _.template( aboutTemplate );
            data = {
                
            }
        }
        if (options.title == 'newContextOptions') {
            this.$('span#title').html('Application options')
            inner_template = _.template( newContextOptionsTemplate );
            data = {
                location: options.location,
            };
        }

        this.$('.content').html( inner_template(data) );
        return this;
    },

    initialize: function(options) {
        _.bindAll(this, 'render', 'close', 'signoutBtn', 'newKeySubmit');
        var that = this;
        $('body').keydown(function(e){
            if (e.keyCode == 27)
                that.close();
        })
    },
  });
  return modalView;
});
