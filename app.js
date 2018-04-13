(function() {
  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  window.requestAnimationFrame = requestAnimationFrame;
})();

/* file input stuff */
var fbutton = document.getElementById("fbutton");
var files = document.getElementById("filesinput");
fbutton.addEventListener("click", function() {
    document.getElementById('filesinput').click();
}, false);
files.addEventListener("change", function (e) {
    document.getElementById('awesome').src = '';     
    document.getElementById('download').style.display = 'none';
    document.getElementById('download').href = '';
    filesarr = e.target.files;
    document.getElementById('donut').style.display = "inline-block";
    readURL(e.target);
}, false);
    
function readURL(input) {
    if (input.files && input.files[0]) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var url = reader.result;
        console.log("url : ", url);
        makeVideo(url);
      };
      console.log(input.files[0]);
      var filename = input.files[0].name.split('.')[0] + '.webm';
      document.getElementById('download').setAttribute('download', filename);
      reader.readAsDataURL(input.files[0]);
    }
}
    
function returnHeightWidth(img, callback){
    var w = img.width;
    var h = img.height;
    console.log("The width of the image is " + w + "px.");
    console.log("The height of the image is " + h + "px.");
    var isPortrait = h > w;
    if(isPortrait){
      if(h > 1280){
        var mult = 1280/h;
        w = Math.floor(mult*w);
        h = 1280;
        } 
    }
    else{
      if(w > 1280){
        var mult = 1280/w;
        h = Math.floor(h * mult);
        w = 1280;
      }   
    }
    callback(w,h);
}

/* whammy stuff */
var compress_stuff = false;
function toggleCompression(){
    compress_stuff = !compress_stuff;
}
function grabImageVideo(url, callback){
    var img = new Image();
    img.onload = function() {
        returnHeightWidth(img, function(w,h){
            img.width = w;
            img.height = h;
            var canvas = document.getElementById('canvas');
            canvas.width =  w;
            canvas.height = h;
            var context = canvas.getContext('2d');
            context.globalAlpha = 1;
            context.drawImage(img, 0, 0, canvas.width, canvas.height);
            if(compress_stuff){
                var newImageData = canvas.toDataURL("image/jpeg", 10/100);
                var result_image_obj = new Image();
                result_image_obj.onload = function() {
                    context.drawImage(result_image_obj, 0, 0, canvas.width, canvas.height);
                    callback(context, canvas);
                }
                result_image_obj.src = newImageData; 
            }
            else{
                callback(context, canvas);
            }
        })   
    }
    img.src = url;
}
    
var whammy_cross = null;
var whammy_ = null;
var framerate = 1;
var frames = [];
var webpUrlRegex = /^data:image\/webp;base64,/ig;
var isChrome = webpUrlRegex.test(document.createElement('canvas').toDataURL('image/webp'));

function grabFrame(url, callback){
	grabImageVideo(url, function(ctxz, canvas){
        var vid = isChrome ? whammy_ : whammy_cross;
        var width = canvas.width;
        var height = canvas.height;
        if(!isChrome){
            vid.setFrameRate(framerate);
            var imagesdata = ctxz.getImageData(0,0,width,height).data;
            vid.addFrame(imagesdata,width,height);
//            vid.addFrame(imagesdata,width,height);
//            vid.addFrame(imagesdata,width,height);
        }
        else{
            vid.add(ctxz,1000);
            vid.add(ctxz,1000);
            vid.add(ctxz,1000);
        }
        
        callback();
    });
};

function makeVideo(url){
    if(isChrome){
        whammy_ = new Whammy.Video();
    }
    else{
        whammy_cross = new WhammyCrs();
        whammy_cross.reset();
        whammy_cross.progress = function(progress){
            console.log("progress : ", progress);
        } 
    }
    grabFrame(url, function(){
        if(isChrome){
            console.log("can handle web p");
            whammy_.compile(undefined, function(videoBlob){
                console.log("videoBlob : ", videoBlob);
                var url = window.URL.createObjectURL(videoBlob);
                document.getElementById('awesome').src = url;     
                document.getElementById('download').style.display = '';
                document.getElementById('donut').style.display = 'none';
                document.getElementById('download').href = url;
              });
        }
        else{
            console.warn("cannot handle web p");
            whammy_cross.encodeWEBM(function(videoBlob){
                var url = window.URL.createObjectURL(videoBlob);
                document.getElementById('awesome').src = url;     
                document.getElementById('download').style.display = '';
                document.getElementById('donut').style.display = 'none';
                document.getElementById('download').href = url;
            });
        }
    });
}
