define([
  'jquery', 
  'underscore', 
  'backbone',
  'app',
  'text!templates/valueDetailed.html',
  'text!templates/userMatch.html'
  ], function($, _, Backbone, appConfig, valuesTemplate, userMatchTemplate){
  var ValueView = Backbone.View.extend({

    className: 'valcontainer',
    template: _.template(valuesTemplate),
    app: appConfig.getState(),

    events: {
        "click a.valpart"    : "toggleUsers",
        // 'click button#searchBtn'   : 'filterBtn',
        'click button#addBtn'      : 'addBtn',
    },

    initialize: function(model) {
        _.bindAll(this, 'render', 'addBtn', 'toggleUsers');
        this.model = model;
        this.model.bind('change', this.render);
        // this.state = options.state;
        // this.model.bind('destroy', this.remove);
        // this.model.bind('change', this.render);
        // this.parentView = options.parentView;
    },

    render: function() {
        this.$el.html(this.template(this.model.toJSON()));

        var btnCaption = '+ me too';
        var btnClass = 'btn-success';
        if (this.model.get('haveit')) {
            btnCaption = '- remove';
            btnClass = 'btn-warning';
        }
        this.$('button#addBtn').html(btnCaption).addClass(btnClass);
            
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
        
        

        // var haveit = this.model.get('haveit');
        // this.$('button#addBtn').toggleClass('btn-success', haveit);
        // $(this.el).toggleClass('haveitTag', haveit);

        // this.$('span.count > span.cno').html(this.model.get('vcnt'));

        return this;
    },

    // filterBtn: function(e) {
    //     this.model.set({selected: !this.model.get('selected')});
    //     $(this.el).toggleClass('filterTag');
        
    //     this.state.getMatches(this.matchesClb);
    //     e.stopPropagation();
    //     return false;
    // },

    addBtn: function(e) {
        if (! this.app.agent.loggedIn())
            return false;

        haveit = this.model.get('haveit');
        var newhaveit = !haveit;
        var newcount;

        var oldcount = this.model.get('score');
        console.log(oldcount);
        if (haveit) 
            // this.model.set({vcnt: oldcount-1});
            newcount = oldcount-1;
        else
            // this.model.set({vcnt: oldcount+1});
            newcount = oldcount+1;

        this.model.set({haveit: newhaveit, score:newcount});
        console.log(oldcount, newcount, haveit, newhaveit);
        // $(this.el).toggleClass('haveitTag');

        var key = this.model.get('key');
        var val = this.model.get('val');
        var type = (haveit) ? 'DELETE' : 'POST';

        this.app.mutateKeyValue({key:key, val:val, type:type});

        // var body = {key:key, val:val, context:this.state.context.name};
        // if (haveit)
            // this.state.stats('attribute:removed', body)
        // else
            // this.state.stats('attribute:added', body)
        

        e.stopPropagation();
        return false;
    },

    toggleUsers: function(e){
        $(this.el).toggleClass('expand');
    },
  });
  return ValueView;
});