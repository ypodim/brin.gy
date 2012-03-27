
define([
    'jquery',
    'underscore', 
    'backbone',

    'order!button',
    'alerts',
    'modal',
    'order!twipsy',
    'order!popover',

    'text!templates/controls.html',
    ], function($, _, Backbone, 
        button, alerts, modal, popover, twipsy, 
        controlsViewTemplate){
  var controlsView = Backbone.View.extend({
    el: $("#controls")[0],
    template: _.template(controlsViewTemplate),
    events: {
        // "click #clear-filters-btn": "clearFilters",
        // "click nav > a": "navFilter",
        // "search #searchinput": "searchAttributes",
        // "keyup #searchinput": "searchAttributes",
        // "click div.controls > button": "newAttributeModal",
        // "submit #searchbox": "submitNewAttribute", 

        'click .controlFilters': 'filterBtn',
        'click .controlSorters': 'sortBtn',
        'click #resultsBtn': 'showResults',
    },

    filterBtn: function(evt) {
        var bid = $(evt.target).attr('id');
        this.$('.secondOrder').hide();
        if (bid == 'all')
            this.$('.controlSorters').show();
        if (bid == 'me')
            this.$('#likemeBtn').show();
        if (bid == 'filters')
            this.$('#resultsBtn').show();
    },
    sortBtn: function(evt) {
        var bid = $(evt.target).attr('id');
        if (bid == 'all');
        if (bid == 'me');
        if (bid == 'filters');
    },

    showResults: function() {
        console.log('results');
    },

    // filtersChange: function(evt) {
    //     var count = this.state.filters.length;
    //     var html = (count > 0) ? count : '';
    //     var badge = this.$('#searchBadge').html(html);
    //     (count)? badge.show() : badge.hide();
    // },
    // myattrsChange: function(evt) {
    //     var count = this.state.myattrs.length;
    //     var html = (count > 0) ? count : '';
    //     var badge = this.$('#meBadge').html(html);
    //     (count)? badge.show() : badge.hide();
    // },

    initialize: function(options) {
        // _.bindAll(this, 'render', 'filtersChange', 'myattrsChange');
        this.state = options.state;
        this.attrCollection = options.attrCollection;


        // this.model.bind('change', this.render);
        // this.state.bind('change:filters', this.filtersChange);
        // this.state.bind('change:myattrs', this.myattrsChange);
        $(this.el).append(this.template());
    },
    
    render: function(){
        console.log("controls view rendered");
    },
  });
  return controlsView;
});
