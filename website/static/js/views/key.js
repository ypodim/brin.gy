define([
    'jquery', 
    'underscore', 
    'backbone',
    'scroll',

    'views/valueDetailed',
    'text!templates/key.html',
], function($, _, Backbone, scroll, valueDetailedView, keyTemplate){
    var KeyView = Backbone.View.extend({

    tagName: 'attribute',
    template: _.template(keyTemplate),
    detailViewRendered: false,

    events: {
        "click a.keypart" : "toggleSelected",
        'click attribute': 'clicked',
    },

    initialize: function() {
      _.bindAll(this, 'render', 'close', 'toggleSelected');
      this.model.bind('change', this.render);

      // this.model.bind('destroy', this.remove);
      this.model.view = this;
    },

    render: function() {
        html = this.template(this.model.toJSON());
        $(this.el).html(html);
        return this;
    },

    clicked: function() {
        if (! this.detailViewRendered) {
            _.each(this.values, function(vmodel){
                var vvdetailed = new valueDetailedView({
                    model : vmodel,
                    // state : that.state,
                });
                this.$('.valpartdetailed').append(vvdetailed.render().el);
            });
            this.detailViewRendered = true;
        }


        var detailedIsHidden = this.$('.valpart').toggle().is(':visible');
        if (detailedIsHidden) {
            this.$('.valpartdetailed').hide();
            // $('.controls').slideUp();
            $(this.el).scrollIntoView();
        } else {
            this.$('.valpartdetailed').slideDown();
            // $('.controls').slideDown();
        }
        return false;
    },

    toggleSelected: function() {
        // console.log('toggleSelected', this.model.attributes.key);
        // this.model.toggleSelected();
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

    // If you hit `enter`, we're through editing the item.
    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },

    // Remove the item, destroy the model.
    clear: function() {
      this.model.clear();
    }

    });
    return KeyView;
});