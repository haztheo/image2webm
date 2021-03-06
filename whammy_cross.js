var WhammyCrs;
var Whammy;

(function(root) {
	var InvalidCharacterError = function(message) {
		this.message = message;
	};
	InvalidCharacterError.prototype = new Error;
	InvalidCharacterError.prototype.name = 'InvalidCharacterError';

	var error = function(message) {
		// Note: the error messages used throughout this file match those used by
		// the native `atob`/`btoa` implementation in Chromium.
		throw new InvalidCharacterError(message);
	};

	var TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	// http://whatwg.org/html/common-microsyntaxes.html#space-character
	var REGEX_SPACE_CHARACTERS = /[\t\n\f\r ]/g;

	// `decode` is designed to be fully compatible with `atob` as described in the
	// HTML Standard. http://whatwg.org/html/webappapis.html#dom-windowbase64-atob
	// The optimized base64-decoding algorithm used is based on @atk’s excellent
	// implementation. https://gist.github.com/atk/1020396
	var decode = function(input) {
		input = String(input)
			.replace(REGEX_SPACE_CHARACTERS, '');
		var length = input.length;
		if (length % 4 == 0) {
			input = input.replace(/==?$/, '');
			length = input.length;
		}
		if (
			length % 4 == 1 ||
			// http://whatwg.org/C#alphanumeric-ascii-characters
			/[^+a-zA-Z0-9/]/.test(input)
		) {
			error(
				'Invalid character: the string to be decoded is not correctly encoded.'
			);
		}
		var bitCounter = 0;
		var bitStorage;
		var buffer;
		var output = '';
		var position = -1;
		while (++position < length) {
			buffer = TABLE.indexOf(input.charAt(position));
			bitStorage = bitCounter % 4 ? bitStorage * 64 + buffer : buffer;
			// Unless this is the first of a group of 4 characters…
			if (bitCounter++ % 4) {
				// …convert the first 8 bits to a single ASCII character.
				output += String.fromCharCode(
					0xFF & bitStorage >> (-2 * bitCounter & 6)
				);
			}
		}
		return output;
	};

	// `encode` is designed to be fully compatible with `btoa` as described in the
	// HTML Standard: http://whatwg.org/html/webappapis.html#dom-windowbase64-btoa
	var encode = function(input) {
		input = String(input);
		if (/[^\0-\xFF]/.test(input)) {
			// Note: no need to special-case astral symbols here, as surrogates are
			// matched, and the input is supposed to only contain ASCII anyway.
			error(
				'The string to be encoded contains characters outside of the ' +
				'Latin1 range.'
			);
		}
		var padding = input.length % 3;
		var output = '';
		var position = -1;
		var a;
		var b;
		var c;
		var d;
		var buffer;
		// Make sure any padding is handled outside of the loop.
		var length = input.length - padding;

		while (++position < length) {
			// Read three bytes, i.e. 24 bits.
			a = input.charCodeAt(position) << 16;
			b = input.charCodeAt(++position) << 8;
			c = input.charCodeAt(++position);
			buffer = a + b + c;
			// Turn the 24 bits into four chunks of 6 bits each, and append the
			// matching character for each of them to the output.
			output += (
				TABLE.charAt(buffer >> 18 & 0x3F) +
				TABLE.charAt(buffer >> 12 & 0x3F) +
				TABLE.charAt(buffer >> 6 & 0x3F) +
				TABLE.charAt(buffer & 0x3F)
			);
		}

		if (padding == 2) {
			a = input.charCodeAt(position) << 8;
			b = input.charCodeAt(++position);
			buffer = a + b;
			output += (
				TABLE.charAt(buffer >> 10) +
				TABLE.charAt((buffer >> 4) & 0x3F) +
				TABLE.charAt((buffer << 2) & 0x3F) +
				'='
			);
		} else if (padding == 1) {
			buffer = input.charCodeAt(position);
			output += (
				TABLE.charAt(buffer >> 2) +
				TABLE.charAt((buffer << 4) & 0x3F) +
				'=='
			);
		}

		return output;
	};

	var base64 = {
		'encode': encode,
		'decode': decode,
		'version': '0.1.0'
	};

	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define(function() {
			return base64;
		});
	} else { // in Rhino or a web browser
		root.base64 = base64;
	}

}(this));



(function(){		
		WhammyCrs = function(){
			var self = this;
			this.frames = [];
			this.counterval = 0;
			this.retrival = 0;
			this.framerate = 0;
			this.interaval = null;
			this.progress = null;
			this.onConvert = null;
			this.workers_lenght = 5;
			this.workers = [];
			this.rotation = 0;
			this.framenumber = 0;
			for(var x =0; x < self.workers_lenght; ++x){
				this.workers.push(new Worker('WhammyWorker.js'));
				this.workers[x].addEventListener('message', function(e) {
                    console.log("message : ", e);
					++self.retrival;
					self.onConvert && self.onConvert(++self.counterval);
					self.frames[e.data.frame] = e.data.webp;
				}, false);
			}
		}

		WhammyCrs.prototype.reset = function(){
			this.counterval = 0;
			this.rotation = 0;
			this.retrival = 0;
			this.frames = [];
			this.framerate = 0;
			this.framenumber = 0;
			this.interaval && clearInterval(this.interaval);
			this.interaval = null;
		}

		WhammyCrs.prototype.addFrame = function(imagedata,width,height, repeatNumber){
			var self = this;
			--this.retrival;
			var worker = self.workers[self.rotation];
			worker.postMessage({
				imagedata : imagedata,
				width : width,
				height : height,
				frame: self.framenumber,
                repeatNumber: repeatNumber
			});
			++self.rotation;
			++self.framenumber;
			if(self.rotation == self.workers_lenght){
				self.rotation = 0;
			}
		}

		WhammyCrs.prototype.setFrameRate = function(framerate){
			this.framerate = framerate;
		}

		WhammyCrs.prototype.encodeWEBM = function(success){
			var self = this;
			this.interaval && clearInterval(this.interaval);
			this.interaval = null;
			this.progress && this.progress(0);
			function finish(){
				clearInterval(self.interaval);
				var blob = new Whammy.fromImageArray(self.frames, self.framerate);
				self.progress && self.progress(100);
				success(blob);
			}

			var time = 300;
			if(this.retrival < 0){
				var progresinit = -this.retrival;
				 this.interaval = setInterval(function(){
				 	self.progress && self.progress(((progresinit+self.retrival)/progresinit)*100);
					if(self.retrival >= 0){
						finish();
					}
				},time);
			}else{
				finish();
			}
		}

})();