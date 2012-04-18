define([
  'jquery',
  'underscore', 
  'backbone',
  'router',

  'views/nametag',
  'text!templates/presentation/slide1.html',
  'text!templates/presentation/lastSlide.html',
  'text!templates/presentation/mapSlide.html',
  ], function($, _, Backbone, router, nametagView, 
    slidePicTemplate, lastSlideTemplate, mapTemplate){
  var welcomeView = Backbone.View.extend({
    el: $("#cover"),
    events: {
        // 'click body':'nextSlide',
        // 'keydown body':'keyPressed',
        // 'click div#nametag':'internalTransition',
    },

    slide: 0,
    slides: [],

    pointer: 0,
    taglist: [],

    internalSlideCounter: 0,

    hide: function(){
        $('#cover').hide();
    },
    show: function(){
        $('#cover').show();
    },

    slide1: function(){
        var compiled_template = _.template( slidePicTemplate );
        this.elContent.html( compiled_template() );
        $('#caption').html('What skills do the people in this building have?<br> Which talk did people like best at the conference?<br> Who around me is interested in startups?');
    },

    throwTag: function(tag){
        var nview = new nametagView({attr:tag.key, value:tag.val});
        nview.render(tag.x*200, tag.y*110);
        $(this.elContent).append(nview.el);
        var isException = (tag.x==0 && tag.y==1);
        isException = (isException || (tag.x==3 && tag.y==2));
        nview.animate(20, 0.4, isException);
    },
    processNext: function(){
        if (this.pointer < this.taglist.length &&
            this.slides[this.slide] == 'slideManyTags') {

            this.throwTag(this.taglist[this.pointer]);
            this.pointer++;
            setTimeout(this.processNext, 100);
        }
    },
    slideManyTags: function(){
        $('#caption').html('The personal information that a single person can broadcast may be richer and more unexpected.');
        // $(this.elContent).css('background-color','rgba(0,0,0,0.1)');
        var that = this;
        var x = -1;
        var y = -1;
        
        var xlimit = $(window).width()/200;
        var ylimit = $(window).height()/120;
        $.getJSON("http://satellite.brin.gy/profile/all/keyvals", function(json){
            for (var i in json.items) {
                var attr = json.items[i];
                for (var j in attr.values){
                    var val = attr.values[j];

                    if (y < ylimit-1)
                        that.taglist.push({key:attr.key, val:val.val, x:x, y:y});

                    x++;
                    if (x >= xlimit-1) {
                        y += 1;
                        x = -1;
                    }
                }
            }
            that.processNext();
        });
    },

    slide2: function(){
        $('#caption').html('Name and affiliation is the information that people usually broadcast about themselves at public events.');

        // $(this.elContent).css('background-color','rgba(0,0,0,0.1)');
        var nview = new nametagView({attr:'name', value:'Pol<br>MIT Media Lab'});
        nview.render('25%', '25%', true);
        $(this.elContent).append(nview.el);
        nview.$('div').css('padding-top','30px');
        nview.animate(0, 0.7);
    },

    slideMap: function(){
        $('#caption').html('How do we generalize the solution to make it useful in different contexts?');
        var compiled_template = _.template( mapTemplate );
        var that = this;
        this.elContent.html( compiled_template() );
        if (GBrowserIsCompatible()) {
            var map = new GMap2(document.getElementById("map_canvas"));
            map.setCenter(new GLatLng(37.4419, -122.1419), 15);
            // map.setUIToDefault();
        }
        setTimeout(function(){
            map.panBy(new GSize(-1600, -450));
        },10)
        setTimeout(function(){
            that.$('.mapCaption').show();
            that.$('.mapSlide').css('border','5px solid red');
        },1500)
    },

    lastSlide: function(){
        // window.location = 'http://brin.gy/';
        var compiled_template = _.template( lastSlideTemplate );
        this.elContent.html( compiled_template() );
    },

    // internalTransition:function(evt){
        // if (this.slides[this.slide-1] == 'slideManyTags') {
            // this.$('div#nametag:not(.exception)').css('opacity',0.05);
            // this.internalSlideCounter++;
        // }
    // },
    keyPressed:function(evt){
        if (evt.keyCode == 39)
            this.nextSlide();
        if (evt.keyCode == 37)
            this.previousSlide();
        if (evt.keyCode == 27)
            this.router.navigate('#/all', {trigger:true});
    },
    previousSlide:function(){
        this.internalSlideCounter = 0;
        this.slide--;
        this.slide = Math.max(this.slide, 0);
        this.router.navigate('#/presentation/'+this.slide, {trigger:true});
    },
    nextSlide:function(){
        if (this.slides[this.slide] == 'slideManyTags') {
            if (this.internalSlideCounter < 1) {
                $('#caption').html('But how do we extract it? How do we query it?');

                this.$('div#nametag:not(.exception)').css('opacity',0.05);
                this.internalSlideCounter++;
                return;
            }
        }

        this.slide++;
        if (this.slide >= this.slides.length)
            this.slide = 0;
        this.router.navigate('#/presentation/'+this.slide, {trigger:true});
    },
    showSlide:function(sno){        
        var newone = $(this.elContent).clone(true).empty();
        this.elContent.before(newone);
        this.elContent.addClass('anime slideLeft');
        // $(this.router.contents_view.el).hide();
        // $(this.router.controlsView.el).hide();

        var that = this;
        setTimeout(function(){
            $(that.elContent).remove();
            that.elContent = newone.css('opacity',1);
            
            // newone.attr('tabindex',0);
            // newone.keydown(this.keyPressed);

            that[that.slides[sno]]();
            console.log(that.elContent.css('opacity'), newone.css('opacity'));
        }, 700);
    },
    slide5: function(){
        $('#caption').html('Brin.gy is a tool that helps people broadcast information about themselves by making the process efficient and fun.');
        var html = '<img src="/static/images/brin.gy.png" class="slide5" />';
        this.elContent.css('opacity',0.5);
        this.router.contents_view.render().showAll();
        this.router.controlsView.doAll();
    },
    slide6: function(){
        $('#caption').html('The information that gets generated grows organically through user participation and is relevant to the context at hand.');
        var html = '<img src="/static/images/newattr.png" class="slide6" />';
        this.elContent.html(html);
    },
    slide7: function(){
        $('#caption').html('A context can represent a physical venue (e.g. company X\'s HQ), or a more abstract concept (e.g. company X).');
    },
    slide8: function(){
        $('#caption').html('Like with personal attributes, users can fluidly create, join and leave contexts.');
    },
    render: function(){
        console.log('next');
        this.showSlide(0);
    },
    initialize: function(options){
        _.bindAll(this, 'render', 'slide1', 'slide2', 'slideManyTags', 'slideMap', 'throwTag', 'processNext', 'nextSlide', 'showSlide', 'keyPressed');
        this.router = options.router;

        this.elContent = this.$('#coverContent');
        this.el.keydown(this.keyPressed);
        this.el.attr('tabindex',0).focus();

        this.slides.push('slide1');
        this.slides.push('slide2');
        this.slides.push('slideManyTags');
        // this.slides.push('slideMap');
        this.slides.push('slide5');
        this.slides.push('slide6');
        this.slides.push('slide7');
        this.slides.push('slide8');
        this.slides.push('lastSlide');
    },
  });
  return welcomeView;
});
