/**
 * 
 * Magnific Popup Core JS file
 * 
 */


/**
 * Private static constants
 */
var CLOSE_EVENT = 'Close',
	BEFORE_APPEND_EVENT = 'BeforeAppend',
	MARKUP_PARSE_EVENT = 'MarkupParse',
	OPEN_EVENT = 'Open',
	CHANGE_EVENT = 'Change',

	NS = 'mfp',
	EVENT_NS = '.' + NS,

	READY_CLASS = 'mfp-ready',
	REMOVING_CLASS = 'mfp-removing',

	PREVENT_CLOSE_CLASS = 'mfp-prevent-close';


/**
 * Private vars 
 */
var mfp, // As we have only one instance of MagnificPopup, we define it locally to not to use 'this'
	MagnificPopup = function(){},
	_key = 0,
	_prevStatus,
	_window = $(window),
	_body,
	_document,
	_prevContentType,
	_wrapClasses;



/**
 * Private functions
 */
var _mfpOn = function(name, f) {
		mfp.ev.on(NS + name + EVENT_NS, f);
	},
	_getEl = function(className, appendTo, html, raw) {
		var el = document.createElement('div');
		el.className = 'mfp-'+className;
		if(html) {
			el.innerHTML = html;
		}
		if(!raw) {
			el = $(el);
			if(appendTo) {
				el.appendTo(appendTo);
			}
		} else if(appendTo) {
			appendTo.appendChild(el);
		}
		return el;
	},
	_mfpTrigger = function(e, data) {
		mfp.ev.triggerHandler(NS + e, data);

		if(mfp.st.callbacks) {
			// converts mfpEventName to eventName callback and triggers it if it's present
			e = e.charAt(0).toLowerCase() + e.slice(1);
			if(mfp.st.callbacks[e]) {
				mfp.st.callbacks[e].call(mfp, data);
			}
		}
	},
	_setFocus = function() {
		(mfp.st.focus ? mfp.content.find(mfp.st.focus).eq(0) : mfp.wrap).focus();
	};



/**
 * Public functions
 */
MagnificPopup.prototype = {

	constructor: MagnificPopup,

	/**
	 * Initializes Magnific Popup plugin. 
	 * This function is triggered only once when $.fn.magnificPopup or $.magnificPopup is executed
	 */
	init: function() {
		var appVersion = navigator.appVersion;
		mfp.isIE7 = appVersion.indexOf("MSIE 7.") !== -1; 
		mfp.isAndroid = (/android/gi).test(appVersion);
		mfp.isIOS = (/iphone|ipad|ipod/gi).test(appVersion);

		// We disable fixed positioned lightbox on devices that don't handle it nicely.
		// If you know a better way of detecting this - let me know.
		mfp.probablyMobile = (mfp.isAndroid || mfp.isIOS || /Opera Mini|webOS|BlackBerry|Opera Mobi|IEMobile/i.test(navigator.userAgent) );
		_body = $(document.body);
		_document = $(document);

		mfp.popupsCache = {};
		mfp.templates = {};
	},

	/**
	 * Opens popup
	 * @param  data [description]
	 */
	open: function(data) {


		if(mfp.isOpen) return;

		var i;

		mfp.types = []; 
		_wrapClasses = '';

		if(data.isDynamicSource) {
			mfp.ev = _document;
			mfp.index = data.index;
		} else {
			mfp.ev = data.el;
			var items = data.items,
				item;
			for(i = 0; i < items.length; i++) {
				item = items[i];
				if(item.parsed) {
					item = item.el[0];
				}
				if(item === data.el[0]) {
					mfp.index = i;
					break;
				}
			}
		}

		if(!mfp.popupsCache[data.key]) {
			mfp.popupsCache[data.key] = {};
		}
		mfp.templates = mfp.popupsCache[data.key];

		mfp.st = $.extend(true, {}, $.magnificPopup.defaults, data ); 
		mfp.fixedContentPos = mfp.st.fixedContentPos === 'auto' ? !mfp.probablyMobile : mfp.st.fixedContentPos;
		
		mfp.items = data.items;





		// Building markup
		// main containers are created only once
		if(!mfp.bgOverlay) {

			// Dark overlay
			mfp.bgOverlay = _getEl('bg').on('click'+EVENT_NS, function() {
				mfp.close();
			});


			mfp.wrap = _getEl('wrap').attr('tabindex', -1).on('click'+EVENT_NS, function(e) {

				var target = e.target;
				if($(target).hasClass(PREVENT_CLOSE_CLASS)) {
					return;
				}

				if(mfp.st.closeOnContentClick) {
					mfp.close();
				} else {
					// close popup if click is not on a content, on close button, or content does not exist
					if( !mfp.content || 
						$(target).hasClass('mfp-close') ||
						(mfp.preloader && e.target === mfp.preloader[0]) || 
						(target !== mfp.content[0] && !$.contains(mfp.content[0], target)) ) {
						mfp.close();
					}
				}
			});

			mfp.container = _getEl('container', mfp.wrap);
		}
		if(mfp.st.preloader) {
			mfp.preloader = _getEl('preloader', mfp.container, mfp.st.tLoading);
		}
		mfp.contentContainer = _getEl('content', mfp.container);



		// Initializing modules
		var modules = $.magnificPopup.modules;
		for(i = 0; i < modules.length; i++) {
			var n = modules[i];
			n = n.charAt(0).toUpperCase() + n.slice(1);
			mfp['init'+n].call(mfp);
		}
		_mfpTrigger('BeforeOpen');



		// Close button
		if(!mfp.st.closeBtnInside) {
			mfp.wrap.append( mfp._getCloseBtn() );
		} else {
			_mfpOn(MARKUP_PARSE_EVENT, function(e, template, values) {
				if(mfp.st.closeBtnInside) {
					values.close_replaceWith = mfp._getCloseBtn();
				}
			});
			_wrapClasses += ' mfp-close-btn-in';
		}

		if(mfp.st.alignTop) {
			_wrapClasses += ' mfp-align-top';
		}

	

		if(mfp.fixedContentPos) {
			mfp.wrap.css({
				overflow: mfp.st.overflowY,
				overflowX: 'hidden',
				overflowY: mfp.st.overflowY
			});
		} else {
			mfp.wrap.css({ 
				top: _window.scrollTop(),
				position: 'absolute'
			});
		}
		if( mfp.st.fixedBgPos === false || (mfp.st.fixedBgPos === 'auto' && !mfp.fixedContentPos) ) {
			mfp.bgOverlay.css({
				height: _document.height(),
				position: 'absolute'
			});
		}

		

		// Close on ESC key
		_document.on('keyup' + EVENT_NS, function(e) {
			if(e.keyCode === 27) {
				mfp.close();
			}
		});

		_window.on('resize' + EVENT_NS, function() {
			mfp.updateSize();
		});

		


		if(!mfp.st.closeOnContentClick) {
			_wrapClasses += ' mfp-auto-cursor';
		}
		
		if(_wrapClasses)
			mfp.wrap.addClass(_wrapClasses);


		// this triggers recalculation of layout, so we get it once to not to trigger twice
		var windowHeight = mfp.wH = _window.height();

		
		var bodyStyles = {};

		if( mfp.fixedContentPos ) {
			var s = mfp._getScrollbarSize();
			if(s) {
				bodyStyles.paddingRight = s;
			}
		}

		if(mfp.fixedContentPos) {
			if(!mfp.isIE7) {
				bodyStyles.overflow = 'hidden';
			} else {
				// ie7 double-scroll bug
				$('body, html').css('overflow', 'hidden');
			}
		}

		
		
		var classesToadd = mfp.st.mainClass;
		if(mfp.isIE7) {
			classesToadd += ' mfp-ie7';
		}
		if(classesToadd) {
			mfp._addClassToMFP( classesToadd );
		}

		// add content
		mfp.updateItemHTML();

		// remove scrollbar, add padding e.t.c
		_body.css(bodyStyles);
		
		// add everything to DOM
		mfp.bgOverlay.add(mfp.wrap).prependTo( document.body );



		// Save last focused element
		mfp._lastFocusedEl = document.activeElement;
		
		// Wait for next cycle to allow CSS transition
		setTimeout(function() {
			
			if(mfp.content) {
				mfp._addClassToMFP(READY_CLASS);
				_setFocus();
			} else {
				// if content is not defined (not loaded e.t.c) we add class only for BG
				mfp.bgOverlay.addClass(READY_CLASS);
			}
			
			// Lock focus on popup
			_document.on('focusin' + EVENT_NS, function (e) {
				if( e.target !== mfp.wrap[0] && !$.contains(mfp.wrap[0], e.target) ) {
					mfp.wrap.focus();
					return false;
				}
			});

		}, 16);

		mfp.isOpen = true;
		mfp.updateSize(windowHeight);
		_mfpTrigger(OPEN_EVENT);
	},

	/**
	 * Closes the popup
	 */
	close: function() {
		if(!mfp.isOpen) return;

		mfp.isOpen = false;
		// for CSS3 animation
		if(mfp.st.removalDelay)  {
			mfp._addClassToMFP(REMOVING_CLASS);
			setTimeout(function() {
				mfp._close();
			}, mfp.st.removalDelay);
		} else {
			mfp._close();
		}
	},

	/**
	 * Helper for close() function
	 */
	_close: function() {
		_mfpTrigger(CLOSE_EVENT);

		var classesToRemove = REMOVING_CLASS + ' ' + READY_CLASS + ' ';

		mfp.bgOverlay.detach();
		mfp.wrap.detach();
		mfp.container.empty();

		if(mfp.st.mainClass) {
			classesToRemove += mfp.st.mainClass + ' ';
		}

		mfp._removeClassFromMFP(classesToRemove);

		if(mfp.fixedContentPos) {
			var bodyStyles = {paddingRight: 'inherit'};
			if(mfp.isIE7) {
				$('body, html').css('overflow', 'auto');
			} else {
				bodyStyles.overflow = 'visible';
			}
			_body.css(bodyStyles);
		}
		
		_document.off('keyup' + EVENT_NS + ' focusin' + EVENT_NS);
		mfp.ev.off(EVENT_NS);

		// clean up DOM elements that aren't removed
		mfp.wrap.attr('class', 'mfp-wrap').removeAttr('style');
		mfp.bgOverlay.attr('class', 'mfp-bg');
		mfp.container.attr('class', 'mfp-container');

		// remove close button from target element
		if(!mfp.st.closeBtnInside || mfp.templates[mfp.currItem.type] === true ) {
			if(mfp.templates.closeBtn)
				mfp.templates.closeBtn.detach();
		}


		if(mfp._lastFocusedEl) {
			$(mfp._lastFocusedEl).focus(); // put tab focus back
		}	

		mfp.prevHeight = 0;
	},
	
	updateSize: function(winHeight) {

		if(mfp.isIOS) {
			var zoomLevel = document.documentElement.clientWidth / window.innerWidth;
			var height = window.innerHeight * zoomLevel;
			mfp.wrap.css('height', height);
			mfp.wH = height;
		} else {
			mfp.wH = winHeight || _window.height();
		}

		_mfpTrigger('Resize');
	},


	/**
	 * Set content of popup based on current index
	 */
	updateItemHTML: function() {
		var item = mfp.items[mfp.index];

		if(!item.parsed) {
			item = mfp.parseEl( mfp.index );
		}
		
		mfp.currItem = item;

		var type = item.type;
		
		if(!mfp.templates[type]) {
			var markup = mfp.st[type] ? mfp.st[type].markup : false;
			if(markup) {
				_mfpTrigger('FirstMarkupParse', markup);
				mfp.templates[type] = $(markup);
			} else {
				// if there is no markup found we just define that template is parsed
				mfp.templates[type] = true;
			}
		}

		if(_prevContentType && _prevContentType !== item.type) {
			mfp.container.removeClass('mfp-'+_prevContentType+'-holder');
		}

		var newContent = mfp['get' + type.charAt(0).toUpperCase() + type.slice(1)](item, mfp.templates[type]);
		mfp.appendContent(newContent, type);

		item.preloaded = true;

		_mfpTrigger(CHANGE_EVENT, item);
		_prevContentType = item.type;
	},


	/**
	 * Set HTML content of popup
	 */
	appendContent: function(newContent, type) {
		mfp.content = newContent;
		
		if(newContent) {
			if(mfp.st.closeBtnInside && mfp.templates[type] === true) {
				// if there is no markup, we just append close button element inside
				mfp.content.append(mfp._getCloseBtn());
			} else {
				mfp.content = newContent;
			}
		} else {
			mfp.content = '';
		}

		_mfpTrigger(BEFORE_APPEND_EVENT);
		mfp.container.addClass('mfp-'+type+'-holder');
		mfp.contentContainer.html(mfp.content);
	},



	
	/**
	 * Creates Magnific Popup data object based on given data
	 * @param  {int} index Index of item to parse
	 */
	parseEl: function(index) {
		var item = mfp.items[index],
			type = item.type;
		

		if(item.tagName) {
			item = { el: $(item) };
		}

		if(item.el) {
			var types = mfp.types;

			// check for 'mfp-TYPE' class
			for(var i = 0; i < types.length; i++) {
				if( item.el.hasClass('mfp-'+types[i]) ) {
					type = types[i];
					break;
				}
			}

			item.src = item.el.attr('data-mfp-src');
			if(!item.src) {
				item.src = item.el.attr('href');
			}
		}

		item.type = type || mfp.st.type;
		item.index = index;
		item.parsed = true;
		mfp.items[index] = item;
		_mfpTrigger('ElementParse', item);

		return mfp.items[index];
	},


	/**
	 * Initializes single popup or a group of popups
	 */
	addGroup: function(el, options) {
		var eHandler = function(e) {

				var midClick = options.midClick !== undefined ? options.midClick : $.magnificPopup.defaults.midClick;
				if( midClick || e.which !== 2 ) {
					var disableOn = options.disableOn !== undefined ? options.disableOn : $.magnificPopup.defaults.disableOn;

					if(disableOn) {
						if($.isFunction(disableOn)) {
							if( !disableOn.call(mfp) ) {
								return true;
							}
						} else { // else it's number
							if( $(window).width() < disableOn ) {
								return true;
							}
						}
					}

					//if( $(window).width() > (options.disableOn !== undefined ? options.disableOn : $.magnificPopup.defaults.disableOn ) ) {
						e.preventDefault();
						options.el = $(this);
						mfp.open(options);
					//}

				}
				
			};

		if(!options) {
			options = {};
		} 

		var eName = 'click' + '.magnificPopup';
		if(options.delegate) {
			options.items = el.find(options.delegate);
			el.off(eName).on(eName, options.delegate , eHandler);
		} else {
			options.items = el;
			el.off(eName).on(eName, eHandler);
		}
	},


	/**
	 * Updates text on preloader
	 * @param  {String}  txt     Preloader text
	 * @param  {Boolean} isError Adds mfp-img-error class if enabled
	 */
	updateStatus: function(status, text) {

		if(mfp.preloader) {
			if(_prevStatus !== status) {
				mfp.container.removeClass('mfp-s-'+_prevStatus);
			}

			if(!text && status === 'loading') {
				text = mfp.st.tLoading;
			}

			var eObj = {
				status: status,
				text: text
			};
			// allows to modify status
			_mfpTrigger('UpdateStatus', eObj);

			status = eObj.status;
			text = eObj.text;

			

			

			mfp.preloader.html(text);

			mfp.preloader.find('a').click(function(e) {
				e.stopImmediatePropagation();
			});

			mfp.container.addClass('mfp-s-'+status);
			_prevStatus = status;
		}



	},


	
	





	/*
		"Private" helpers that aren't private at all
	 */
	_getCloseBtn: function() {
		if(!mfp.templates.closeBtn)
			mfp.templates.closeBtn = $( mfp.st.closeMarkup.replace('%title%', mfp.st.tClose ) );
		
		return mfp.templates.closeBtn;
	},
	_addClassToMFP: function(cName) {
		mfp.bgOverlay.addClass(cName);
		mfp.wrap.addClass(cName);
	},
	_removeClassFromMFP: function(cName) {
		this.bgOverlay.removeClass(cName);
		mfp.wrap.removeClass(cName);
	},
	_hasScrollBar: function(winHeight) {
		if(document.body.clientHeight > (winHeight || _window.height()) ) {
            return true;    
        }
        return false;
	},

	_parseMarkup: function(template, values, item) {
		var arr;
		_mfpTrigger(MARKUP_PARSE_EVENT, [template, values, item] );
		$.each(values, function(key, value) {
			arr = key.split('_');
			if(arr.length > 1) {
				var el = template.find(EVENT_NS + '-'+arr[0]);
				if(arr[1] === 'replaceWith') {
					if(el[0] !== value[0]) {
						el.replaceWith(value);
					}
				} else {
					el.attr(arr[1], value);
				}
			} else {
				template.find(EVENT_NS + '-'+key).html(value);
			}
		});
	},

	_getScrollbarSize: function() {
		// thx David
		if(mfp.scrollbarSize === undefined) {
			var scrollDiv = document.createElement("div");
			scrollDiv.id = "mfp-sbm";
			scrollDiv.style.cssText = 'width: 99px; height: 99px; overflow: scroll; position: absolute; top: -9999px;';
			document.body.appendChild(scrollDiv);
			mfp.scrollbarSize = scrollDiv.offsetWidth - scrollDiv.clientWidth;
			document.body.removeChild(scrollDiv);
		}
		return mfp.scrollbarSize;
	}

}; /* MagnificPopup core prototype end */




/**
 * Public static functions
 */
$.magnificPopup = {
	instance: null,
	proto: MagnificPopup.prototype,
	modules: [],

	// $.magnificPopup.open({src: "site-assets/img/p1/1.jpg", type: "image"});
	open: function(items, options, index) {
		if(!$.magnificPopup.instance) {
			mfp = new MagnificPopup();
			mfp.init();
			$.magnificPopup.instance = mfp;
		}	
		var el;
		if(!options) {
			options = {};
		}
		if( !$.isArray(items) ){
			el = items;
			items = [items];
			index = 0;
		} else if(index === undefined) {
			index = 0;
		}
		if(!options.key)
			options.key = _key++;
		options.items = items;
		options.index = index;
		options.isDynamicSource = true;
		
		//options.el = items[index];		

		return this.instance.open(options);
	},

	close: function() {
		return $.magnificPopup.instance.close();
	},

	registerModule: function(name, module) {
		if(module.options) {
			$.magnificPopup.defaults[name] = module.options;
		}
		$.extend(this.proto, module.proto);			
		this.modules.push(name);
	},

	defaults: {   
		disableOn: 0,	

		midClick: false,

		mainClass: '',

		minHeight: 200,

		preloader: true,

		focus: '', // CSS selector of input to focus after popup is opened
		
		closeOnContentClick: false,

		closeBtnInside: true,

		alignTop: false,

		overlay: true,
	
		removalDelay: 0,

		mobileMediaQuery: '(max-width: 800px) and (orientation:landscape), screen and (max-height: 300px)',
		
		fixedContentPos: 'auto', // "auto", true, false. "Auto" will automatically disable this option when browser doesn't support fixed position properly.
	
		fixedBgPos: 'auto', // 'auto', true, false. It's recommended to set it to true when you animate background with CSS3 transitions and when content is less likely to be zoomed.

		overflowY: 'auto', // CSS property of slider wrapper: 'auto', 'scroll', 'hidden'. Doesn't apply when fixedContentPos is on.

		closeMarkup: '<button title="%title%" type="button" class="mfp-close">&times;</button>',

		tClose: 'Close (Esc)',
		tLoading: 'Loading...'
	}
};



$.fn.magnificPopup = function(options) {
	// Initialize Magnific Popup only when called at least once
	if(!$.magnificPopup.instance) {
		mfp = new MagnificPopup();
		mfp.init();
		$.magnificPopup.instance = mfp;
	}

	if(!options.key)
		options.key = _key++;

	mfp.addGroup($(this), options);
	return $(this);
};


