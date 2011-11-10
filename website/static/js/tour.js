
ww = $(window).width();
wh = $(window).height();
Tour = {};
Tour.inTour = false;
Tour.tourSlides = [];
Tour.tourSlides.push({
    left:10, top:160, 
    width:0, height:wh-160, 
    text:"So, you want to find some people. Awesome! <br>This tour will show you how Brin.gy works.",
    btnText: "Start",
    backbtnText: "",
});
Tour.tourSlides.push({
    left:10, top:160, 
    width:110, height:wh-160, 
    text:'This is a list of attributes, like "name", "age", "skills" and "location".',
    btnText: "Next",
    backbtnText: "Back",
});
Tour.tourSlides.push({
    left:10, top:160, 
    width:110, height:wh-160, 
    text:'To look for people who have stated a name (any value for a name), simply click on the "name" box to select those people. Go on click it :)',
    btnText: "Next",
    backbtnText: "Back",
});
Tour.tourSlides.push({
    left:120, top:160, 
    width:120, height:wh-160, 
    text:'This is a list of values for each attribute, like "pol" for "name and "chinese" for "language".',
    btnText: "Next",
    backbtnText: "Back",
});
Tour.tourSlides.push({
    left:120, top:160, 
    width:120, height:wh-160, 
    text:'To look for people who have a specific name click on the name to select those people.',
    btnText: "Next",
    backbtnText: "Back",
});
Tour.tourSlides.push({
    left:130, top:160, 
    width:40, height:wh-160, 
    text:'The red boxes show the number of people who have added the respective attribute or value to their profile.',
    btnText: "Next",
    backbtnText: "Back",
});
Tour.tourSlides.push({
    left:240, top:160, 
    width:40, height:wh-160, 
    text:'You can use these boxes to add or remove values to your profile.',
    btnText: "Next",
    backbtnText: "Back",
});
Tour.tourSlides.push({
    left:10, top:160, 
    width:0, height:wh-160, 
    text:"This is a list of values, like name, age, skills and location.",
    btnText: "Finish",
    backbtnText: "Back",
});

Tour.close_tour = function() {
    Tour.inTour = false;
    $(".cover").fadeOut();
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
}