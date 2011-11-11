
ww = $(window).width();
wh = $(window).height();
Tour = {};
Tour.inTour = false;
Tour.tourSlides = [];
Tour.tourSlides.push({
    left:10, top:155, 
    width:0, height:wh-155, 
    text:"So, you want to find some people. Awesome! <br>This tour will show you how Brin.gy works.",
    btnText: "Start",
    backbtnText: "",
});
Tour.tourSlides.push({
    left:10, top:155, 
    width:110, height:wh-155, 
    text:'This is a list of attributes, like "name", "age", "skills" and "location".',
    btnText: "Next",
    backbtnText: "Back",
});
Tour.tourSlides.push({
    left:120, top:155, 
    width:120, height:wh-155, 
    text:'This is a list of values for each attribute, like "pol" for "name and "chinese" for "language".',
    btnText: "Next",
    backbtnText: "Back",
});
Tour.tourSlides.push({
    left:125, top:155, 
    width:40, height:wh-155, 
    text:'The red boxes show the number of people that have added the attribute next to them.',
    btnText: "Next",
    backbtnText: "Back",
});
Tour.tourSlides.push({
    left:240, top:155, 
    width:40, height:wh-155, 
    text:'You can use these boxes to add or remove values to your profile.',
    btnText: "Next",
    backbtnText: "Back",
});


Tour.tourSlides.push({
    left:130, top:155, 
    width:0, height:wh-155, 
    text:'Let\'s look for people who know python and their respective location.',
    btnText: "Next",
    backbtnText: "Back",
});
Tour.tourSlides.push({
    left:120, top:155, 
    width:120, height:wh-155,
    text:'First, look for people with the "python" skill by clicking on "python".',
    btnText: "Next",
    backbtnText: "Back",
    select_key: "skill",
    select_val: "python",
});
Tour.tourSlides.push({
    left:10, top:155, 
    width:110, height:wh-155,  
    text:'Intersect that with people who reported location by clicking on "my location" attribute.',
    btnText: "Next",
    backbtnText: "Back",
    select_key: "my location",
});

Tour.tourSlides.push({
    left:290, top:90, 
    width:165, height:wh-110, 
    text:'This is a list of results in the intersection.',
    btnText: "Next",
    backbtnText: "Back",
});
Tour.tourSlides.push({
    left:455, top:90, 
    width:ww-355, height:wh-110, 
    text:'... and these are the results on the map. Happy hunting!',
    btnText: "Finish",
    backbtnText: "Back",
});



Tour.close_tour = function() {
    Tour.inTour = false;
    $(".cover").fadeOut();
}

Tour.select_key = function(key){
    selector = "pill[key='"+key+"']";
    
    offset = $(selector).offset();
    if (offset != undefined) {
        $('#choices').animate({scrollTop: offset.top},'slow');
        $(selector).children("a").click();
        return $(selector).children("a").children("span.attr_counters").html();
    }
}

Tour.select_val = function(key, val){
    selector = "div.valcontainer a[key='"+key+"'][val='"+val+"']";
    console.log($(selector));
    offset = $(selector).offset();
    if (offset != undefined) {
        $('#choices').animate({scrollTop: offset.top},'slow');
        $(selector).click();
        return $(selector).children("span.attr_counters").html();
    }
}

Tour.do_tour = function(index){
    Tour.inTour = true;
    if (index==undefined)
        index = 0;
        
    slide = Tour.tourSlides[index];

    $("#covernextbtn").html(slide.btnText).attr("index",index);
    $("#coverbackbtn").attr("index",index);
    if (slide.backbtnText.length)
        $("#coverbackbtn").show().html(slide.backbtnText);
    else
        $("#coverbackbtn").hide();
        
    $("#coverbanner").show();
    $("#covertext").show().html(slide.text);
    
    ww = $(window).width();
    wh = $(window).height();
    $("#covertop").show().css({height:slide.top});
    $("#coverleft").show().css({width:slide.left, top:slide.top, height:slide.height});
    $("#coverright").show().css({left:slide.left+slide.width, top:slide.top, width:ww-slide.left-slide.width, height:slide.height});
    $("#coverbottom").show().css({height:wh-slide.top-slide.height});
    
    console.log("select_key", slide.select_key);
    console.log("select_val", slide.select_val);
    if (slide.select_key) {
        if (slide.select_val == undefined) {
            count = Tour.select_key(slide.select_key);
        } else {
            count = Tour.select_val(slide.select_key, slide.select_val);
        }
        $("#covertext").append('<br>('+count+' people found)');
    }
}