define([
    'jquery', 
    'underscore', 
    'backbone',
    'scroll',

    'models/key',
    'models/attribute',
    'views/key',
    'views/valueDetailed',

    'text!templates/newContext.html',
    'text!templates/attributeChoice.html',
], function($, _, Backbone, scroll, 
    kModel, attrModel, keyView, valueDetailedView,
    newContextTemplate, attrChoiceTemplate){
    var newAttrView = Backbone.View.extend({

    tagName: 'newcontext',
    template: _.template(newContextTemplate),

    events: {
        'keypress input': 'valueKey',
        'keyup input': 'autocomplete',
        'click #attributes > #buttons > button': 'useBtn',
    },

    getLocation: function() {
        var context = this.$('input#contextName').val();
        $(this.el).html('get location');
        var that = this;

        this.state.router.controlsView.setTitle('Choose Location');
    },
    
    selectedAttrs: {},
    useBtn: function(evt){
        var flag = undefined;
        if ($(evt.target).attr('id') == 'select') 
            flag = true;
        if ($(evt.target).attr('id') == 'deselect') 
            flag = false;

        this.$('i').toggle(flag);
        this.$('#attrList').children().toggleClass('borderSelection', flag);

        
        for (k in this.selectedAttrs)
            for (v in this.selectedAttrs[k])
                if (flag == undefined)
                    this.selectedAttrs[k][v] = !this.selectedAttrs[k][v];
                else
                    this.selectedAttrs[k][v] = flag;
        this.$('span.counter').html(this.countSelected());
    },
    countSelected:function(){
        res = 0;
        for (k in this.selectedAttrs)
            for (v in this.selectedAttrs[k])
                if (this.selectedAttrs[k][v])
                    res++;
        return res;
    },
    chooseAttributes: function(){
        this.state.router.controlsView.setTitle('Choose Attributes');
        

        this.$('form').hide();
        this.$('#suggestions').hide();
        this.$('#attributes').show();

        var that = this;
        that.$('#attrList').empty();
        var url = this.state.agent.baseurl+'/'+this.state.user.name+'/profile';
        $.getJSON(url, function(json){
            for (var i in json.data){
                var attr = json.data[i];

                if (that.selectedAttrs[attr.key] == undefined)
                    that.selectedAttrs[attr.key] = {};
                that.selectedAttrs[attr.key][attr.val] = 1;

                var t = _.template(attrChoiceTemplate);
                html = $(t({key:attr.key, val:attr.val}));
                html.click(function(evt){
                    $(this).children('i').toggle();
                    $(this).toggleClass('borderSelection');

                    var key = $(this).attr('key');
                    var val = $(this).attr('val');
                    that.selectedAttrs[key][val] = !that.selectedAttrs[key][val];

                    that.$('span.counter').html(that.countSelected());
                    return false;
                });
                
                that.$('#attrList').append(html);
                that.$('span.counter').html(that.countSelected());
            }
        });
    },

    step: 0,
    context: {},
    last: 0,
    next: function(){
        console.log(this.step, this.last);
        if (this.step > this.last) {
            var kvlist = [];
            for (k in this.selectedAttrs)
                for (v in this.selectedAttrs[k])
                    if (this.selectedAttrs[k][v])
                        kvlist.push([k,v]);

            if (kvlist.length)
                this.state.setContext(this.context);
            this.state.postMultiKeyVals(this.context, kvlist, function(json){
                console.log(json);
            });

            var frag = '#/attributes';
            this.state.router.navigate(frag, {trigger:true});
            return;
        }

        if (this.step == 0) {
            this.context.name = this.$('input#contextName').val();
            this.context.descr = this.$('textarea#contextDescr').val();
            
            if (this.context.name && this.context.descr)
                this.chooseAttributes();
            else {
                this.$('textarea#contextDescr').focus();
                if (!this.context.name)
                    this.$('input#contextName').focus();
                return false;
            }
        }
        if (this.step == 1)
            this.getLocation();

        if (this.step == this.last)
            this.state.router.controlsView.setRightTitle('Done');

        this.step++;
    },
    previous: function(){
        if (this.step <= 0) {
            this.state.router.navigate('#/context', {trigger:true});
            return;
        }
        this.step -= 2;
        this.next();
    },

    autocomplete: function(evt) {
        var text = $(evt.target).val();
        var regex = new RegExp(text, 'i');
        var matches = [];
        this.$('#autocomplete').empty();

        var url = this.state.satellite.url+'/contexts';

        var that = this;
        $.getJSON(url, function(json){
            for (var i in json.contexts) {
                cntx = json.contexts[i].name;
                if (cntx.match(regex))
                    matches.push(cntx);
            }
            that.$('#suggestions > label').hide();
            _.each(matches, function(entry){
                that.$('#suggestions > label').show();

                var html = $('<a></a>').addClass('suggestion');
                html.html(entry);
                html.click(function(){
                    that.$('.suggestion').css('background-color','inherit');
                    $(this).css('background-color','#aaa');
                    $(evt.target).val($(this).html()).focus();
                    return false;
                });
                this.$('#autocomplete').append(html);
            });
        });
    },

    valueKey: function(evt){
        if ($(evt.target).hasClass('value') && $(evt.target).val().length > 19)
            return false;
        if ($(evt.target).val().length > 22)
            return false;

        if (evt.keyCode == 32 || evt.keyCode == 13 ||(evt.keyCode >= 45 && evt.keyCode <= 126))
            return true;
        return false;
    },

    initialize: function(options) {
        _.bindAll(this, 'render');
        this.state = options.state;
        this.context.name = options.context;
        this.steps = [];
    },
    render: function() {
        html = this.template();
        $(this.el).html(html);
        $("#container").html(this.el);
        this.$('input#contextName').focus();
        if (this.context.name) {
            
            var that = this;
            url = this.state.satellite.url+'/contexts';
            $.getJSON(url, function(json){
                contextExists = false;
                for (var i in json.contexts)
                    if (that.context.name == json.contexts[i].name)
                        contextExists = true;
                
                if (contextExists) {
                    that.step = 1;
                    that.chooseAttributes();
                } else {
                    that.$('input#contextName').val(that.context.name);
                    that.$('textarea#contextDescr').focus();        
                }
            });
        }
        return this;
    },

    });
    return newAttrView;
});