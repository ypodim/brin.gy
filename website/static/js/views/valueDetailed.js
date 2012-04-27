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
        "click a.valpart"    : "toggleUsers",
        'click button#searchBtn'   : 'filterBtn',
        'click button#addBtn'      : 'addBtn',
    },

    initialize: function(options) {
      _.bindAll(this, 'render', 'filterBtn', 'addBtn');
      this.state = options.state;
      this.model.bind('destroy', this.remove);
      this.model.bind('change', this.render);
      this.parentView = options.parentView;
    },

    render: function() {
        var json = this.model.toJSON();
        $(this.el).html(this.template(json))
                  .addClass('slideValueUp')
                  .removeClass('slideValueDown');
        if (this.model.get('haveit'))
            $(this.el).addClass('haveitTag');
        if (this.model.get('selected'))
            $(this.el).addClass('filterTag');
        if (! this.model.get('showControls'))
            $(this.el).css('margin-left', '100px');
        for (var i in json.matches) {
            utoken = $('<a></a>').addClass('userToken').html(json.matches[i]);
            utoken.attr('href','#/u/'+json.matches[i]);
            this.$('div#matches').append(utoken);
        }
        
        return this;
    },

    filterBtn: function(e) {
        this.model.set({selected: !this.model.get('selected')});
        $(this.el).toggleClass('filterTag');
        

        this.state.getMatches(this.matchesClb);
        e.stopPropagation();
        return false;
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

        this.state.mutateKeyValue({key:key, val:val, type:type});

        e.stopPropagation();
        return false;
    },

    toggleUsers: function(e){
        $(this.el).toggleClass('slideValueDown');
        $(this.el).toggleClass('slideValueUp');
        e.stopPropagation();
        return false; 
    },
  });
  return ValueView;
});