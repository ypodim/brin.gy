define([
  'jquery', 
  'underscore', 
  'backbone',
  'text!templates/contextEntry.html'
  ], function($, _, Backbone, contextEntryTemplate){
  var ValueView = Backbone.View.extend({
    id: 'contextEntry',
    template: _.template(contextEntryTemplate),

    events: {
        'click #actionBtn': 'toggleMembership',
        'click a': 'expandName',
    },

    initialize: function(options) {
      _.bindAll(this, 'render', 'toggleMembership');
      this.state = options.state;
      this.model.bind('destroy', this.remove);
      this.model.bind('change', this.render);
      this.parentView = options.parentView;
    },

    render: function() {
        $(this.el).html(this.template(this.model.toJSON()));
        if (this.model.get('name')=='all')
            this.$('button').hide();
        // if (this.model.get('haveit'))
        //     $(this.el).addClass('haveitTag');
        // if (this.model.get('selected'))
        //     $(this.el).addClass('filterTag');
        // if (! this.model.get('showControls'))
        //     $(this.el).css('margin-left', '100px');
        return this;
    },

    expandName: function(){
        context = {
            name: this.model.get('name'),
            descr: this.model.get('description'),
        };
        this.state.setContext(context)
        this.state.router.navigate('#/all', {trigger:true});
        return false;

        this.$('.description').slideToggle(100);
        return false;
    },
    toggleMembership: function(e) {
        if (! this.state.isLoggedin())
            return false;

        if (this.model.get('joined')) {
            var answer = confirm('Leave #'+this.model.get('name')+'?')
            if (answer) {
                this.model.set({joined: !this.model.get('joined')});
                this.state.toggleContext(this.model.get('name'), this.model.get('joined'));
                this.state.setContext({name:'all'});
            }
        } else {
            this.state.router.navigate('#/newcontext/'+this.model.get('name'), {trigger:true});
        }
    },
  });
  return ValueView;
});