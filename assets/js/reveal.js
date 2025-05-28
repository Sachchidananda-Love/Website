var element = document.getElementById(logo2);
element.src = "assets/img/Videos/Logo.gif";  
element.src = "assets/img/Videos/Logo.gif"+new Date().getTime();







function Reveal() {
    var g = document.getElementById('art');
    var h = document.getElementById('Photo');
    
    if (g.style.display == 'none') {
        g.style.display = 'block';
        g.style= "art";
    } else {
        g.style.display = 'none';
    }

    if (h.style.display == 'none') {
        h.style.display = 'block';
        h.style= "Photo";
    } else {
        h.style.display = 'none';
    }

}




function ShowAndHide() {

    
    document.getElementById("nav11").style.visibility = "hidden";
    // document.getElementById("nav10").style.animation = "fadeOut 3s";
    // setTimeout(() => {  document.getElementById("nav10").style.display = "none"; }, 3000);
    

    var x = document.getElementById('logo');
    var y = document.getElementById('footer');
    var z = document.getElementById('footer2');
    var h = document.getElementById('footer3');
    var b = document.getElementById('footer4');
    var c = document.getElementById('footer5');
    var d = document.getElementById('footer6');
    var e = document.getElementById('footer7');
    var f = document.getElementById('footer8');
    var g = document.getElementById('footer9');
    
    
    

    if (x.style.display == 'none') {
        x.style.display = 'block';
        x.style= "logo";

    } else {
        x.style.display = 'none';
    }

    if (y.style.display == 'none') {
        y.style.display = 'block';
        y.style= "footer";
    } else {
        y.style.display = 'none';
    }

    if (z.style.display == 'none') {
        z.style.display = 'block';
        z.style= "footer2";
    } else {
        z.style.display = 'none';
    }

    if (h.style.display == 'none') {
        h.style.display = 'block';
        h.style= "footer3";
    } else {
        h.style.display = 'none';
    }

    if (b.style.display == 'none') {
        b.style.display = 'block';
        b.style= "footer4";
    } else {
        b.style.display = 'none';
    }

    if (c.style.display == 'none') {
        c.style.display = 'block';
        c.style= "footer5";
    } else {
        c.style.display = 'none';
    }

    if (d.style.display == 'none') {
        d.style.display = 'block';
        d.style= "footer6";
    } else {
        d.style.display = 'none';
    }

    if (e.style.display == 'none') {
        e.style.display = 'block';
        e.style= "footer7";
    } else {
        e.style.display = 'none';
    }

    if (f.style.display == 'none') {
        f.style.display = 'block';
        f.style= "footer8";
    } else {
        f.style.display = 'none';
    }

    if (g.style.display == 'none') {
        g.style.display = 'block';
        g.style= "footer9";

    } else {
        g.style.display = 'none';
    }

    // if (a.style.display == 'block') {
    //     a.style.display == 'none'
    //     a.style= "socialmedia";
        
        
    // } else {
    //     a.style.display = 'block';
    // }

    

    
}

