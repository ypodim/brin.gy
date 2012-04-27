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
        'click button#includeBtn': 'includeBtn',
        'click button#moreBtn': 'moreBtn',
    },

    initialize: function(options) {
      _.bindAll(this, 'render');
      this.state = options.state;
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
        this.state.stats('profile', this.model.get('username'));
        this.state.router.navigate('/u/'+this.model.get('username'), {trigger:true});
        return false;
    },

    });
    return PersonView;
});