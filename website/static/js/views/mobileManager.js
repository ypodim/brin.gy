
define([
    'jquery',
    'underscore', 
    'backbone',

    'order!button',
    'alerts',
    'modal',
    'order!twipsy',
    'order!popover',

    'text!templates/mobileManage.html',

    'views/key',
    'views/value',
    'views/valueDetailed',
    'views/person',

    'collections/keys',
    'collections/values',
    
    'models/key',
    'models/value',
    'models/attribute',
    'models/person',
    ], function(
        $, _, Backbone, 
        button, alerts, modal, popover, twipsy, 
        // common, modals, attr_manager, 
        manageViewTemplate, 

        keyView, valueView, valueDetailedView, personView,
        Keys, Values,
        kModel, vModel, attrModel, personModel){
  var managerView = Backbone.View.extend({
    el: $("#container"),
    template: _.template(manageViewTemplate),
    events: {

    },

    _keysInserted: {},
    _keyViews: {},

    addOneAttribute: function(model) {
        var key = model.get('key');
        var val = model.get('val');
        var kcnt = model.get('kcnt');
        var vcnt = model.get('vcnt');
        var haveit = model.get('haveit');
        var newval = model.get('newval');

        if (!(key in this._keysInserted)) {
            this._keysInserted[key] = {};
            // console.log('inserted', key);

            kmodel = new kModel({
                key:key,
                cnt:kcnt,
            });
            var kv = new keyView({
                model : kmodel,
            });
            this.$('#m-choices').append($(kv.render().el));
            this._keyViews[key] = kv;
        }

        var vvdetailed = new valueDetailedView({
            model : model,
            parentView: this._keyViews[key],
            state : this.state,
        });
        this._keyViews[key].$('.valpartdetailed').append(vvdetailed.render().el);
    },

    addOnePerson: function(model){
        // var username = model.get('username');
        var pv = new personView({
            model : model,
        });
        this.$('#results').append($(pv.render().el));
    },

    showMe: function(){
        this.$('attribute').hide();
        this.$('.valcontainer').hide();

        this.$('.haveitTag').show();
        _.each(this.$('attribute'), function(attr){
            if ($(attr).children('.valpartdetailed').children('.haveitTag').length)
                $(attr).show();
        });

        this.$('.resultsTitle').hide();
        this.$('#results').hide();
        this.$('.closingpane').show();
        // this.$('#likemeBtn').show();
    },

    showFilters: function(){
        this.$('attribute').hide();
        this.$('.valcontainer').hide();

        this.$('.filterTag').show();
        _.each(this.$('attribute'), function(attr){
            if ($(attr).children('.valpartdetailed').children('.filterTag').length)
                $(attr).show();
        });
        this.$('.closingpane').hide();
        this.$('#results').show();
        this.$('.resultsTitle').show();

        this.matchesClb();
    },

    matchesClb: function(arg){
        var that = this;
        this.controls.animateMatchesTo(this.state.matches.length);
        that.state.personCollection.reset();
        this.$('#results').empty();
        _.each(this.state.matches, function(username){
            pModel = new personModel({username:username});
            that.state.personCollection.add(pModel);
        });

        this.$('#filtersTitle').html('Filters ('+this.state.filterCount+')');
        this.$('#resultsTitle').html('Results ('+this.state.matches.length+')');
    },

    initialize: function(options) {
        _.bindAll(this, 'addOneAttribute', 'addOnePerson', 'render', 'matchesClb');
        this.state = options.state;
        this.controls = options.controls;

        this.state.attrCollection.bind('add', this.addOneAttribute);
        this.state.bind('matchesChanged', this.matchesClb);
        this.state.personCollection.bind('add', this.addOnePerson);
    },
    
    _isRendered: false,
    render: function(){
        if (this.state.renderManager) {
            this._isRendered = false;
            this.state.renderManager = false;
        }

        this.$('.resultsTitle').hide();
        this.$('#results').hide();
        this.$('.closingpane').show();
        this.controls.doDefault();

        if (this._isRendered) {
            this.$('attribute').show();
            this.$('.valcontainer').show();
        } else {
            $(this.el).html(this.template());
            this._keysInserted = {};
            this.state.attrCollection.ffetch();
            this._isRendered = true;
        }
    },
  });
  return managerView;
});
