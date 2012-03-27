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
        'click attribute': 'clicked',
    },

    initialize: function() {
      _.bindAll(this, 'render');
      this.model.bind('change', this.render);

      // this.model.bind('destroy', this.remove);
      this.model.view = this;
    },

    render: function() {
        html = this.template(this.model.toJSON());
        $(this.el).html(html);
        return this;
    },

    detailedIsHidden: false,
    clicked: function() {
        // var detailedIsHidden = this.$('.valpart').toggle().is(':visible');

        if (this.detailedIsHidden) {
            this.$('.valpartdetailed').slideDown();
            $(this.el).scrollIntoView();
        } else {
            this.$('.valpartdetailed').slideUp();
        }
        this.detailedIsHidden = ! this.detailedIsHidden;

        return false;
    },

    });
    return KeyView;
});