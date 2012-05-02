
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
    'views/valueDetailed',
    'views/person',

    // 'collections/keys',
    // 'collections/values',
    
    'models/key',
    'models/value',
    'models/attribute',
    'models/person',
    ], function(
        $, _, Backbone, 
        button, alerts, modal, popover, twipsy, 
        manageViewTemplate, 

        keyView, valueDetailedView, personView,
        // Keys, Values,
        kModel, vModel, attrModel, personModel){
  var managerView = Backbone.View.extend({
    el: $("#container"),
    template: _.template(manageViewTemplate),
    events: {
        'click button.newattrbtn': 'newAttribute',
        'click .controlFilters': 'filterBtn',
    },

    _keysInserted: {},
    _keyViews: {},

    filterBtn: function(evt) {
        var btnid = $(evt.target).attr('id');
        if (btnid == 'all') {
            this.state.router.navigate('#/all', {trigger:true});
        }
        if (btnid == 'me') {
            this.state.router.navigate('#/me', {trigger:true});
        }
        if (btnid == 'filters') {
            this.state.router.navigate('#/filters', {trigger:true});
        }
    },
    newAttribute: function() {
        if (! this.state.isLoggedin())
            return false;

        this.state.stats('newattr:btnBottom');
        this.state.router.navigate('#/new/'+this.state.context.name, {trigger:true});
    },
    addOneAttribute: function(model) {
        var key = model.get('key');
        var val = model.get('val');
        var kcnt = model.get('kcnt');

        if (!(key in this._keysInserted)) {
            this._keysInserted[key] = {};

            kmodel = new kModel({
                key:key,
                cnt:kcnt,
            });
            var kv = new keyView({
                model : kmodel,
                state: this.state,
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
        var pv = new personView({
            model : model,
            state: state,
        });
        this.$('#results').append($(pv.render().el));
    },

    showMe: function(){
        this.$('div.scrollableContainer').show();
        this.$('#me').addClass('active');
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
    },

    showFilters: function(){
        this.$('div.scrollableContainer').hide();
        this.$('#filters').addClass('active');
        this.$('attribute').hide();
        this.$('.valcontainer').hide();

        this.$('.filterTag').show();
        _.each(this.$('attribute'), function(attr){
            if ($(attr).children('.valpartdetailed').children('.filterTag').length)
                $(attr).show();
        });
        this.$('.closingpane').hide();
        this.$('#results').show();

        if (this.$('.filterTag').length > 0) {
            // this.$('.resultsTitle').show();
            this.$('#noFilters').hide();
        } else {
            // this.$('.resultsTitle').hide();
            this.$('#noFilters').show();
        }
        this.matchesClb();
    },

    matchesClb: function(arg){
        var that = this;
        that.state.personCollection.reset();
        this.$('#results').empty();
        _.each(this.state.matches, function(username){
            pModel = new personModel({username:username});
            that.state.personCollection.add(pModel);
        });

        this.$('#filtersTitle').html('Filters ('+this.state.filterCount+')');
        this.$('#resultsTitle').html('Results ('+this.state.matches.length+')');
    },

    valueModelChanged: function() {
        var selectedlist = this.state.attrCollection.filter(function(attr){
            return attr.get('selected');
        });
        var melist = this.state.attrCollection.filter(function(attr){
            return attr.get('haveit');
        });

        var count = selectedlist.length;
        var html = (count > 0) ? count : '';
        var badge = this.$('#searchBadge').html(html);
        (count)? badge.show() : badge.hide();
        this.state.filterCount = count;

        count = melist.length;
        html = (count > 0) ? count : '';
        badge = this.$('#meBadge').html(html);
        (count)? badge.show() : badge.hide();
    },

    initialize: function(options) {
        _.bindAll(this, 'addOneAttribute', 'addOnePerson', 'render', 'matchesClb', 'resetCollections', 'newAttribute', 'valueModelChanged');
        this.state = options.state;
        this.controls = options.controls;

        this.state.attrCollection.bind('add', this.addOneAttribute);
        this.state.attrCollection.bind('value:change', this.valueModelChanged);

        this.state.bind('matchesChanged', this.matchesClb);
        this.state.personCollection.bind('add', this.addOnePerson);
    },
    
    showAll: function(){
        this.$('div.scrollableContainer').show();
        this.$('#all').addClass('active');
        this.$('.resultsTitle').hide();
        this.$('#results').hide();
        this.$('.closingpane').show();

        this.$('attribute').show();
        this.$('.valcontainer').show();
    },

    resetCollections: function() {
        this._isRendered = false;
        this._keysInserted = {};
        this.state.attrCollection.ffetch();
        this.state.personCollection.reset();
    },

    _isRendered: false,
    _lastContext: '',
    render: function(){
        console.log(this._lastContext, this.state.context.name);
        console.log(this._isRendered);
        if (this._lastContext != this.state.context.name) {
            this.resetCollections();
            this._lastContext = this.state.context.name;
            this._isRendered = false;
        }
        if (this._isRendered)
            return false;

        $(this.el).html(this.template());
        this._keysInserted = {};
        
        // this.state.attrCollection.each(this.addOneAttribute);
        var models = this.state.attrCollection.models;
        // this.doOneAttribute(0, models);
        
        return this;
    },

    // doOneAttribute: function(mno, models){
    //     if (mno < models.length) {
    //         var model = models[mno];
    //         this.addOneAttribute(model);
    //         var that = this;
    //         attrTimeout = setTimeout(function(){that.doOneAttribute(mno+1, models)}, 10);

    //         console.log(attrTimeout);
    //     } else {
    //         this.state.personCollection.each(this.addOnePerson);
    //         this.state.attrCollection.trigger('value:change');
    //         this._isRendered = true;
    //     }
    // },

  });
  return managerView;
});
/*

TODO:
- CONTEXT with event branding
ok- logged in user indication!
- loading icons when sending message, creating user
ok- account management: pwd reminders, direct url
- return to the same entry in the long list when returning to it.
ok- don't re-render when switching tabs
- realtime updates
- login with twitter

*/

