define([
  'jquery', 
  'underscore', 
  'backbone',
  'text!templates/valueDetailed.html'
  ], function($, _, Backbone, valuesTemplate){
  var ValueView = Backbone.View.extend({

    className: 'valcontainer',
    template: _.template(valuesTemplate),

    events: {
        "click a"            : "sink",
        'click #searchBtn'   : 'filterBtn',
        'click #addBtn'      : 'addBtn',
    },

    initialize: function(options) {
      _.bindAll(this, 'render', 'filterBtn', 'addBtn');
      this.state = options.state;
      this.model.bind('destroy', this.remove);
      this.model.bind('change', this.render);
      this.parentView = options.parentView;
    },

    render: function() {
        $(this.el).html(this.template(this.model.toJSON()));
        if (this.model.get('haveit'))
            $(this.el).addClass('haveitTag');
        if (this.model.get('selected'))
            $(this.el).addClass('filterTag');
        if (! this.model.get('showControls'))
            $(this.el).css('margin-left', '100px');
        return this;
    },

    filterBtn: function(e) {
        // var added = $(e.target).toggleClass('btn-primary').hasClass('btn-primary');
        this.model.set({selected: !this.model.get('selected')});
        $(this.el).toggleClass('filterTag');
        e.stopPropagation();

        this.state.getMatches(this.matchesClb);
    },

    addBtn: function(e) {
        if (! this.state.isLoggedin())
            return false;

        var added = $(e.target).toggleClass('btn-success').hasClass('btn-success');
        this.model.set({haveit: added});
        $(this.el).toggleClass('haveitTag');

        var key = this.model.get('key');
        var val = this.model.get('val');
        var type = (added) ? 'POST' : 'DELETE';

        this.state.mutateKeyValue('all', key, val, type, function(json){
            // console.log(json);
        });

        e.stopPropagation();
    },

    sink: function(){ return false; },
  });
  return ValueView;
});