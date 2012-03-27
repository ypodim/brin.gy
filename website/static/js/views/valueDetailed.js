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
      "click a"            : "select",
      'click #searchBtn'   : 'filterBtn',
      'click #addBtn'      : 'addBtn',
    },

    initialize: function(options) {
      _.bindAll(this, 'render', 'close', 'filterBtn', 'addBtn');
      // this.model.bind('change', this.render);
      this.model.bind('destroy', this.remove);
      // this.state = options.state;
    },

    render: function() {
        $(this.el).append(this.template(this.model.toJSON()));
        return this;
    },

    filterBtn: function(e) {
        var added = $(e.target).toggleClass('btn-primary').hasClass('btn-primary');
        // var attr = {key:this.model.get('key'), val:this.model.get('val')};
        // this.state.toggle(attr, 'filters', added);
        this.model.set({selected: added});
        e.stopPropagation();
    },

    addBtn: function(e) {
        var added = $(e.target).toggleClass('btn-success').hasClass('btn-success');
        // var attr = {key:this.model.get('key'), val:this.model.get('val')};
        // this.state.toggle(attr, 'myattrs', added);
        this.model.set({haveit: added});
        e.stopPropagation();
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