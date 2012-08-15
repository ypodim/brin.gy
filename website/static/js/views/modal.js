define([
  'jquery',
  'underscore', 
  'backbone',
  'app',
  'tooltip',

  'views/account',
  'views/alerts',

  'text!templates/modal.html',
  'text!templates/reminder.html',
  'text!templates/newKey.html',
  'text!templates/feedback.html',
  'text!templates/about.html',
  'text!templates/newContextOptions.html',
  'text!templates/newLocationAttr.html',
  // 'text!templates/alerts.html',
  
  ], function($, _, Backbone, appConfig, tooltip, accountView, alertsView, modalTemplate, reminderTemplate, newkeyTemplate, feedbackTemplate, aboutTemplate, newContextOptionsTemplate, newLocationAttrTemplate){
  var modalView = Backbone.View.extend({
    el: $('#modal'),
    events: {
        'click a.close': 'close',
        // 'click button#reminder': 'reminderBtn',
        'submit form.reminder': 'submitReminder',

        'click li > a': 'typeSelection',
        'click button.cancel': 'close',
        'submit form.newKey': 'newKeySubmit',
        'submit form.feedback': 'feedbackSubmit',
        'submit form.newContextOptions': 'newContextSubmit',
        'keyup input#title': 'contextTitleChange',
        'submit form.newLocationAttr': 'newLocationAttr',

        'click a.help': 'showHelp',
    },
    app: appConfig.getState(),

    showHelp: function(e){
        var helpContent = $(e.target).parent().children('.helpContent');
        var caption = 'hide';
        var helpVisible = helpContent.is(':visible');
        if (helpVisible)
            caption = 'show help!';
        $(e.target).html(caption);
        helpContent.slideToggle(helpVisible);
        return false;
    },
    newLocationAttr: function(){
        var dic = {
            val: this.$('input#title').val(),
        };
        this.close({silent:true});
        this.trigger('newlocationattr', dic);
        return false;
    },
    
    contextTitleChange: function(e){
        var that = this;
        var testTitle = $(e.target).val();
        this.timeout && clearTimeout(this.timeout);
        this.timeout = setTimeout(function(){
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
    newContextSubmit: function(form){
        var title = this.$('input#title').val();
        var description = this.$('textarea#description').val();
        var permissions = this.$('input[name=permissions]:checked').val();
        var dic = {title:title, description:description, permissions:permissions};
        this.close({silent:true});
        this.trigger('newcontext', dic);
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

    submitReminder: function() {
        this.trigger('reminder');
        this.$('div.footer > img').show();
        // this.close();
        return false;
    },

    close: function(options){
        // this.undelegateEvents();
        this.$('[required]').removeAttr('required');
        this.$el.hide();
        if (!(options && options.silent))
            this.trigger('modal:closed');
        console.log('modal close')
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
        if (options.title == 'settings') {
            // inner_template = _.template( accountTemplate );
            // data = {
            //     username: this.app.agent.fullInfo().name, 
            //     email: this.app.agent.fullInfo().email,
            // }
            var that = this;
            var aview = new accountView();
            aview.render();
            
            aview.unbind('delete');
            aview.bind('delete', function(){that.close()});

            aview.unbind('signout');
            aview.bind('signout', function(){that.close({silent:true})});
            
            this.$('.content').html( aview.$el );
            return this;
        }
        if (options.title == 'alerts') {
            var that = this;
            var aview = new alertsView({el:this.$('.content')});
            aview.render();

            // this.$('.footer').html("<button class='account btn btn-success cancel'>Close</button>")
            return this;
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
                // location: options.location,
            };
        }
        if (options.title == 'getLocTitle') {
            this.$('span#title').html('about this place')
            inner_template = _.template( newLocationAttrTemplate );
            data = {
                location: options.location,
            };
            this.$('div.box').addClass('mid-narrow');
        }
        

        this.$('.content').html( inner_template(data) );
        return this;
    },

    initialize: function(options) {
        _.bindAll(this, 'render', 'close', 'newKeySubmit');
        var that = this;
        $('body').keydown(function(e){
            if (e.keyCode == 27)
                that.close();
        })
    },
  });
  return modalView;
});
