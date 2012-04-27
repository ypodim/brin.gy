define([
    'jquery',
    'underscore', 
    'backbone', 
    'models/attribute'
  ], function($, _, Backbone, Attr){
	  
	var attrCollection = Backbone.Collection.extend({

    model: Attr,
    initialize: function(models, options) {
        _.bindAll(this, 'modelChange');
        this.bind('remove', this.removed);
    },

    modelChange: function(model) {
        this.trigger('value:change');
    },

    ffetch: function() {
        console.log('ffetch');
        this.reset();
        this.state.progress('fetching attributes');
        $('#progressbar').children().width('10%');

        var that = this;
        url = this.state.satellite.url+"/profile/"+this.state.context.name+"/keyvals";
        $.getJSON(url, {user:this.state.user.name}, function(json){
            that.state.progress('fetched '+json.items.length+' attribute groups');
            that.processNextKey(0, json.items);
            that.state.hideSplash();
        });
    },
    processNextKey: function(kno, keys){
        if (kno < keys.length) {
            var key = keys[kno].key;
            var score = keys[kno].score;
            var values = keys[kno].values;
            this.renderValues(key, score, values);

            var that = this;
            setTimeout(function(){that.processNextKey(kno+1, keys)}, 100);
        } else {
            console.log('ffetch done.');
        }
        this.modelChange();
    },
    renderValues: function(key, kscore, values){
        for (j in values) {
            val = values[j].val;
            cnt = values[j].score;
            haveit = (values[j].userhasit==1);
            // matches = json.items[i].values[j].matches;

            var attr = new Attr({
                key:key,
                val:val,
                kcnt:parseInt(kscore), 
                vcnt:parseInt(cnt), 
                selected:false,
                display:true,
                haveit:haveit, 
                matches:{},
                new:true,
            });
            attr.bind('change', this.modelChange);
            this.add(attr);
        }
    },

    removed: function(obj) {
        console.log('removed', obj);
    },

    byKey: function(key) {
        return this.filter(function(attribute){ return (attribute.get('key') == key); });
    },

    haveit: function() {
        return this.filter(function(attribute){ return attribute.get('haveit'); });
    },

    selected: function() {
        return this.filter(function(attribute){ return attribute.get('selected'); });
    },

    remaining: function() {
        return this.without.apply(this, this.done());
    },

    byCnt: function(descending) {
        if (descending==undefined)
            descending = -1;

        return this.sortBy(function(model){
            return descending * model.get('cnt');
        });
    },

  });
  return attrCollection;
});
