//var reader_url = "http://tagnet.media.mit.edu/getRfidUserProfiles?callback=?&readerid=charm-3"; //REMOVE!!!!

var call_url = "http://tagnet.media.mit.edu/";

var callUser = function(el, na) {

    $("#container").stopTime();
    
    $("#callpopup").fadeIn();
    
    callee_number = collage.selectedObject.attr("primary_number");
    callee_name = collage.selectedObject.attr("fullname");
    if(! callee_number) {
        
        $("#callpopuptext").html("<H1>We don't have "+callee_name+"'s phone number on file, sorry.</H2>");
        setTimeout(close_popup, 10000);
        return false;
    }
    
    $.getJSON(collage.reader_url, function(json) {

        if (json.error)
            console.log(json.error);
        else {

            console.log(json.tags.length);
            
            if (json.tags.length < 1) {

                $("#callpopuptext").html("<H2>I'm unable to detect your identity at this time. This feature is available to compatible RFID tag holders. If you have a compatible RFID tag, attempt to make it more visible to the reader below and try again.</H2>")

            } else if (json.tags.length > 1) {

                new_html = "<H2>I'm detecting more than one person infront of the screen. Who is the caller?</H2>";

                for (i in json.tags) {

                    tag = json.tags[i]

                    if (json.tags[i].primary_number == undefined) {

                        json.tags[i].primary_number = '';

                    }
                        
                    new_html += '<a href=\'Javascript:completeCall("' + json.tags[i].primary_number + '", "' + json.tags[i].first + '", "' + json.tags[i].last + '", "' + json.tags[i].username + '");\'>' + json.tags[i].first + ' ' + json.tags[i].last + '</a><p>';

                }

            }else {

                if (json.tags[0].primary_number == undefined) {

                       json.tags[0].primary_number= '';

                }

                new_html = "<H2>Please confirm that you are " + json.tags[0].first + ' ' + json.tags[0].last + "</H2>";

                new_html += '<a href=\'Javascript:completeCall("' + json.tags[0].primary_number + '", "' + json.tags[0].first + '", "' + json.tags[0].last + '", "' + json.tags[0].username + '");\'>I Confirm</a><p>';
                
            }
            
            $("#callpopuptext").html(new_html);

            PopUp();

        }

    });
};

var completeCall = function( callerNum, callerFirst, callerLast, callerId )
{    
    callee_number = collage.selectedObject.attr("primary_number");
    callee_number = (callee_number) ? callee_number : "";
    callee_name = collage.selectedObject.attr("fullname");
    
    console.log("calling "+callee_name+" at "+callee_number+" from "+callerNum+" ("+callerLast+")");
    

    if(callerNum.length == 0) {
        
        new_html = "<H1>We don't have your phone number on file!</H1><H2>Text (617) 870-3805 with your userid (it's: " + callerId + ") and try again</H2>";
        
    }
    else {
        new_html = "<H1>Calling ...</H1>";
        
        $.getJSON(call_url + 'call?name=' + callerFirst + '%20' + callerLast + '&caller=' + callerNum + '&number=' + callee_number + '&callback=?', function(cjson) {

            //console.log(cjson.error)

            if (cjson.error)

                $("#callpopuptext").html("<H1>An unspecified error occured ...</H1>");

            else {

                $("#callpopuptext").html("<H1>" + callee_name + " is being located. Your phone will ring once they pick up.</H1>");
                setTimeout(close_popup, 10000);
            }

        });
    }
    
    $("#callpopuptext").html( new_html );
    setTimeout(close_popup, 10000);
}


var close_popup = function()
{
    $("#callpopup").fadeOut();
    $("#fade").fadeOut();
    
    collage.resetAutoPlay();
    
    return false;
}



var PopUp = function(){

    //Pull Query & Variables from href URL
    var popID = "callpopup";
    var popWidth = 600;

    //Fade in the Popup and add close button
    c_btn = $('<img src="/static/images/close-button.png" class="btn_close" title="Close Window" alt="Close" />');
    c_btn.click( close_popup );
    $('#' + popID).fadeIn().css({ 'width': Number( popWidth ) }).prepend(c_btn);

    //Define margin for center alignment (vertical   horizontal) - we add 80px to the height/width to accomodate for the padding  and border width defined in the css
    var popMargTop = ($('#' + popID).height() + 80) / 2;
    var popMargLeft = ($('#' + popID).width() + 80) / 2;

    //Apply Margin to Popup
    $('#' + popID).css({
        'margin-top' : -popMargTop,
        'margin-left' : -popMargLeft
    });

    //Fade in Background
    // $('body').append('<div id="fade"></div>'); //Add the fade layer to bottom of the body tag.
    $('#fade').css({'filter' : 'alpha(opacity=30)'}).fadeIn();

    return false;

}




