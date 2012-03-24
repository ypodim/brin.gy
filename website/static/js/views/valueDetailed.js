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
      "click .add_btn"     : "toggle",
      "click a"            : "select",
      'click #searchBtn'   : 'searchBtn',
      'click #addBtn'      : 'addBtn',
    },

    initialize: function(options) {
      _.bindAll(this, 'render', 'close', 'remove', 'searchBtn', 'addBtn');
      this.model.bind('change', this.render);
      this.model.bind('destroy', this.remove);
      this.state = options.state;
    },

    render: function() {
        $(this.el).append(this.template(this.model.toJSON()));
        return this;
    },

    searchBtn: function(e) {
        var added = $(e.target).toggleClass('btn-primary').hasClass('btn-primary');
        this.state.trigger('change', {btn:'search', added:added});
        e.stopPropagation();
    },

    addBtn: function(e) {
        var added = $(e.target).toggleClass('btn-success').hasClass('btn-success');
        this.state.trigger('change', {btn:'me', added:added});
        e.stopPropagation();
    },

    toggleDone: function() {
      this.model.toggle();
    },

    // Switch this view into `"editing"` mode, displaying the input field.
    edit: function() {
      $(this.el).addClass("editing");
      this.input.focus();
    },

    close: function() {
      this.model.save({content: this.input.val()});
      $(this.el).removeClass("editing");
    },

    select: function() {
      // console.log("select", this.model);
    },

    toggle: function() {
      console.log("toggle", this.model);
    },

    // If you hit `enter`, we're through editing the item.
    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },

    // Remove the item, destroy the model.
    clear: function() {
      this.model.clear();
    }

  });
  return ValueView;
});