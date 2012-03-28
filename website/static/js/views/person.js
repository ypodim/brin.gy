define([
    'jquery', 
    'underscore', 
    'backbone',
    'scroll',

    'views/valueDetailed',
    'text!templates/person.html',
], function($, _, Backbone, scroll, valueDetailedView, personTemplate){
    var PersonView = Backbone.View.extend({

    tagName: 'person',
    template: _.template(personTemplate),

    events: {
        'click #includeBtn': 'includeBtn',
        'click #moreBtn': 'moreBtn',
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

    includeBtn: function() {
        this.model.set({include:!this.model.get('include')});
        return false;
    },
    moreBtn: function() {
        return false;
    },

    });
    return PersonView;
});