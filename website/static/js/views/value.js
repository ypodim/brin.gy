define([
  'jquery', 
  'underscore', 
  'backbone',
  'text!templates/value.html'
  ], function($, _, Backbone, valuesTemplate){
  var ValueView = Backbone.View.extend({

    //... is a list tag.
    // tagName:  "div",
    // el: $(".valpart"),

    // Cache the template function for a single item.
    template: _.template(valuesTemplate),

    // The DOM events specific to an item.
    events: {
      "click .add_btn"            : "toggle",
      "click a"                   : "select",
    },

    // The TodoView listens for changes to its model, re-rendering. Since there's
    // a one-to-one correspondence between a **Todo** and a **TodoView** in this
    // app, we set a direct reference on the model for convenience.
    initialize: function() {
      _.bindAll(this, 'render', 'close', 'remove');
      this.model.bind('change', this.render);
      this.model.bind('destroy', this.remove);
    },

    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      return this;
    },

    // Toggle the `"done"` state of the model.
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
      console.log("select", this.model);
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