define([
  'jquery', 
  'underscore', 
  'backbone',
  'app',
  'text!templates/valueDetailed.html',
  'text!templates/userMatch.html',
  ], function($, _, Backbone, appConfig, valuesTemplate, userMatchTemplate){
  var ValueView = Backbone.View.extend({

    className: 'valcontainer',
    template: _.template(valuesTemplate),
    app: appConfig.getState(),

    events: {
        'submit form': 'newAttrSubmit',
        "click a.valpart"    : "toggleUsers",
        'click button#addBtn' : 'addBtn',  
    },

    initialize: function(options) {
        _.bindAll(this, 'render', 'addBtn', 'toggleUsers');
        this.model.bind('change', this.render);
    },

    newAttrSubmit: function() {
        var val = this.$('#val').val();
        this.model.set({
            val:val, 
            score:1, 
            haveit:1, 
            newAttr:0, 
            matches:[this.app.agent.id()]
        });
        this.app.trigger('addattr', this.model);
        return false;
    },

    toggleMatches: function(flag) {
        this.$('#matches').toggle(flag);
        this.$el.toggleClass('expand', flag);
    },

    toggleUsers: function(e){
        if (! this.model.get('newAttr')) {
            var flag = this.$el.hasClass('expand');
            this.toggleMatches(!flag);
        }
    },

    render: function(options) {
        this.$el.html(this.template(this.model.toJSON()));

        if (options && options.newAttr) {
            this.$('div.btn-group').hide();
            this.$('div#matches').hide();
            this.$('span.value').hide();
            return;
        } else 
            this.$('form.newAttr').hide();

        var btnCaption = '+ me too';
        var btnClass = 'btn-success';
        if (this.model.get('haveit')) {
            btnCaption = '- remove';
            btnClass = 'btn-warning';
        }
        this.$('button#addBtn').html(btnCaption).addClass(btnClass);
        this.$('button.dropdown-toggle').addClass(btnClass);
            
        var utemplate = _.template(userMatchTemplate);
        var matches = this.model.get('matches');
        for (var m in matches) {
            var username = matches[m];
            var uhtml = utemplate({username:username});
            this.$('div#matches').append(uhtml);
        }
        if (matches.length > 2000) {
            var uhtml = utemplate({username:'more...'});
            this.$('div#matches').append(uhtml);
            this.$('a.userMatch:last-child > i').css({visibility: 'hidden'});
        }

        return this;
    },

    addBtn: function(e) {
        if (! this.app.agent.loggedIn({alert:1})) {
            this.app.navbarView.login();
            return false;
        }

        haveit = this.model.get('haveit');
        var newhaveit = !haveit;
        var newcount;

        var oldcount = this.model.get('score');
        console.log(oldcount);
        if (haveit)
            newcount = oldcount-1;
        else
            newcount = oldcount+1;

        this.model.set({haveit: newhaveit, score:newcount});
        console.log(oldcount, newcount, haveit, newhaveit);
        // $(this.el).toggleClass('haveitTag');

        // var key = this.model.get('key');
        // var val = this.model.get('val');
        // var type = (haveit) ? 'DELETE' : 'POST';
        var action = (haveit) ? 'remattr' : 'addattr';
        this.app.trigger(action, this.model);
        // this.app.mutateKeyValue({key:key, val:val, type:type});

        e.stopPropagation();
        return false;
    },
  });
  return ValueView;
});