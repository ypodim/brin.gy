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
      // "click a"            : "select",
      'click #searchBtn'   : 'filterBtn',
      'click #addBtn'      : 'addBtn',
    },

    initialize: function(options) {
      _.bindAll(this, 'render', 'filterBtn', 'addBtn');
      this.state = options.state;
      this.model.bind('destroy', this.remove);
      this.parentView = options.parentView;
    },

    render: function() {
        $(this.el).append(this.template(this.model.toJSON()));
        if (this.model.get('haveit'))
            $(this.el).addClass('haveitTag');
        return this;
    },

    filterBtn: function(e) {
        var added = $(e.target).toggleClass('btn-primary').hasClass('btn-primary');
        this.model.set({selected: added});
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
        var url = this.state.agent.baseurl+'/'+this.state.user.name+'/profile';
        var data = JSON.stringify([[key, val]]);
        var type = (added) ? 'POST' : 'DELETE';

        $.ajax({
            type: type,
            url: url,
            data: {data:data, secret:this.state.user.pwd},
            success: function(json){},
            dataType: "json",
        });

        e.stopPropagation();
    },
  });
  return ValueView;
});