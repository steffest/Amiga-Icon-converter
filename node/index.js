var PNG = require("pngjs").PNG;
var fs = require("fs");
var Icon = require("../icon.js");
var BinaryStream = require("../lib/file.js");

var basePath = "../test-icons";
var outPath = "out";

if (!fs.existsSync(outPath)){
	fs.mkdirSync(outPath);
}

processDir("");

function processDir(path){
	var fullPath = basePath + path;
	fs.readdir(fullPath,function(err,files){
		files.forEach(function(file){
			
			if (file.indexOf(".info")>0){
				processFile(fullPath + "/" + file);
			}

			if (fs.lstatSync(fullPath + "/" + file).isDirectory()){
				processDir(path + "/" + file)
			}
		});
		
		
	});
}

function processFile(path){
	
	var parts = path.split("/");
	var filename = parts.pop();
	var dirname = parts.pop();
	
	fs.readFile(path,function(err,buffer){
		console.log("processing " + filename);
		if (!err){
			var ab = new ArrayBuffer(buffer.length);
			var view = new Uint8Array(ab);
			for (var i = 0; i < buffer.length; ++i) {
				view[i] = buffer[i];
			}

			var file = BinaryStream(ab,true);
			var isIcon = Icon.detect(file);
			if (isIcon){
				console.log("converting icon");
				Icon.parse(file,icon=>{
					var png = icon2Png(icon,0);

					if (png){
						var pngName = filename.split(".info").join("_0.png");
						png.pack().pipe(fs.createWriteStream(outPath + "/" + dirname + "_" + pngName))
							.on('finish', function() {
								console.log(pngName + ' saved');
							});
					}

					var png2 = icon2Png(icon,1);

					if (png2){
						var pngName2 = filename.split(".info").join("_1.png");
						png2.pack().pipe(fs.createWriteStream(outPath + "/" + dirname + "_" + pngName2))
							.on('finish', function() {
								console.log(pngName2 + ' saved');
							});
					}
				});
			}else{
				console.log("no valid icon");
			}
		}
	});

	
	
	
	
}


function icon2Png(icon,stateIndex){

	stateIndex = stateIndex || 0;
	if (icon.colorIcon){
		var w = icon.colorIcon.width;
		var h = icon.colorIcon.height;
		var state = icon.colorIcon.states[stateIndex];

		if (state){
			var png = new PNG({width:w,height:h});

			for (var y=0;y<h;y++){
				for (var x=0;x<w;x++){
					var index = y*w + x;
					var pixel = state.pixels[index];
					if (state.rgba){
						var color = pixel;
					}else{
						color = state.palette[pixel] || [0,0,0,0];
					}
					if (color.length < 4) color[3] = 1;
					if (pixel === 0) color = [0,0,0,0];

					var idx = index << 2;

					png.data[idx] = color[0];
					png.data[idx + 1] = color[1];
					png.data[idx + 2] = color[2];
					png.data[idx + 3] = Math.ceil(color[3] * 255);
				}
			}

			return png;

		}
	}else{
		Icon.setPalette(icon,stateIndex);
		var img = stateIndex?icon.img2:icon.img;
		
		if (!img) return;

		var w = img.width;
		var h = img.height;
		var png = new PNG({width:w,height:h});
		
		for (var y=0;y<img.height;y++){
			for (var x=0;x<img.width;x++){
				var index = y*w + x;
				var pixel = img.pixels[y][x];
				var color = img.palette[pixel] || [0,0,0,0];
				if (color.length < 4) color[3] = 1;
				if (pixel === 0) color = [0,0,0,0];
				var idx = index << 2;
				png.data[idx] = color[0];
				png.data[idx + 1] = color[1];
				png.data[idx + 2] = color[2];
				png.data[idx + 3] = Math.ceil(color[3] * 255);
			}
		}
	}
}

console.log("ok");