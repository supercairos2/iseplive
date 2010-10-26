
/**
 * Gettext function
 *
 * @param string name	Name of the variable
 * @param array params	Associative array of strings to be replaced in the text
 * @return string	Value of the variable
 */
function __(name, params){
	if(Translations[name]){
		if(typeof(params) == "object"){
			var text = Translations[name];
			for(key in params)
				text = text.replace('{'+key+'}', params[key]);
			return text;
		}else{
			return Translations[name];
		}
	}else{
		return name;
	}
}


Element.implement({
	// Textarea auto-resizing
	resizable : function(){
		var t = this,
			resize = function(){
				var lines = t.value.replace(/[^\n]/, "").length;
				if(t.lines > lines){
					t.style.height = "1px";
				}
				t.lines = lines;
				
				var sh = Math.max(t.scrollHeight, t.defaultSize);
				if(t.offsetHeight < sh)
					t.style.height = (sh+5)+"px";
				return t;
			};
		if(t.retrieve("resizable"))
			return;
		t	.setStyles({
				overflow : "hidden",
				resize : "none"
			})
			.store("resizable", true)
			.addEvent("focus", resize)
			.addEvent("keyup", resize)
			.addEvent("keypress", resize);
		t.lines = t.value.replace(/[^\n]/, "").length;
		t.defaultSize = t.getStyle("height").toInt();
		return this;
	}
});

String.implement({
	// Deletes spaces before and after the string
	trim : function() {
		return this.replace(/(^\s+|\s+$)/g, "");
	}
});




/* Publication form */

var Post = {
	
	pageOfficial : 1,
	pageNonOfficial : 1,
	busy : false,
	
	init : function(){
		if($("publish-message"))
			this.initForm();
		
		$$(".posts-more-link").each(function(link){
			var url_more = link.get("href"),
				is_official = link.hasClass("official");
			link.set("href", "javascript:;")
				.addEvent("click", function(){
					if(Post.busy)
						return;
					Post.busy = true;
					var page = Post[is_official ? "pageOfficial" : "pageNonOfficial"] + 1;
					new Request({
						url: url_more.replace("{page}", page),
						onSuccess: function(data){
							var el = new Element("div", {html: data}).inject(link, "before");
							if(el.get("html").trim() == ""){
								link.tween("opacity", 0);
							}else{
								Comment.init(el.getElements(".post-comments"));
								Survey.init(el.getElements(".survey"));
								Slimbox.scan(el);
							}
							Post[is_official ? "pageOfficial" : "pageNonOfficial"]++;
							Post.busy = false;
						}
					}).post();
				});
		});
	},
	
	
	formEnable : true,
	
	initForm : function(){
		var options = $$("#publish-categories, #publish-association, #publish-private").addClass("hidden");
		$("publish-message")
			.resizable()
			.addEvent("focus", function(){
				if(this.hasClass("publish-message-default")){
					this.removeClass("publish-message-default")
						.store("overtext", this.value);
					this.value = "";
					options.removeClass("hidden");
				}
			})
			.addEvent("blur", function(){
				if(this.value.trim() == ""){
					this.value = this.retrieve("overtext");
					this.addClass("publish-message-default")
						.setStyle("height", 0)
						.fireEvent("keyup");
					options.addClass("hidden");
				}
			});
		var associationOfficial = $("publish-association-official").addClass("hidden");
		$("publish-association-select").addEvent("change", function(){
			if(this.options[this.options.selectedIndex].hasClass("publish-association-admin"))
				associationOfficial.removeClass("hidden");
			else
				associationOfficial.addClass("hidden");
		});
	},
	
	attach : function(type){
		var e = $("publish-stock-attachment-"+type)
			.clone()
			.setStyle("opacity", 0)
			.inject("publish-attachments");
		e	.get('tween', {
				duration: 300,
				property : "opacity"
			})
			.start(1);
		e.getElements(".publish-attachment-delete")[0].addEvent("click", function(){
			e.get('tween', {
				duration: 300,
				property : "opacity",
				onComplete : function(){
					e.destroy();
				}
			})
			.start(0);
		});
		return e;
	},
	
	
	attachEvent : function(){
		if($$("#publish-form input[name=event_title]").length != 0)
			return;
		this.attach("event");
		new DatePicker(["#publish-form input[name=event_start]", "#publish-form input[name=event_end]"], {
			pickerClass: "datepicker_jqui",
			format: __("PUBLISH_EVENT_DATE_FORMAT"),
			timePicker : true
		});
	},
	
	
	attachSurvey : function(){
		if($$("#publish-form input[name=survey_question]").length != 0)
			return;
		this.attach("survey");
		new DatePicker("#publish-form input[name=survey_end]", {
			pickerClass: "datepicker_jqui",
			format: __("PUBLISH_SURVEY_DATE_FORMAT"),
			timePicker : true
		});
		$$("#publish-form .publish-survey-mulitple")[0]
			.addEvent("click", function(){
				$$("#publish-form .publish-survey-answers")[0]
					.removeClass(this.checked ? "publish-survey-answers-unique" : "publish-survey-answers-multiple")
					.addClass(this.checked ? "publish-survey-answers-multiple" : "publish-survey-answers-unique");
			});
		Post.surveyAddAnswer();
	},
	surveyAddAnswer : function(){
		var e = $$("#publish-form .publish-survey-answers li");
		if(e.length == 0)
			return;
		if(e.length > 2)
			$$("#publish-form .publish-survey-anwser-delete").removeClass("hidden");
		e = e[0].clone().inject(e[e.length-1], "before");
		e.getElements("input").set("value", "");
	},
	surveyDelAnswer : function(a){
		var n = $$("#publish-form .publish-survey-answers li").length;
		if(n > 3){
			$(a.parentNode).destroy();
			if(n == 4)
				$$("#publish-form .publish-survey-anwser-delete").addClass("hidden");
		}
	},
	
	
	submitForm : function(){
		$("publish-error").set("html", "").addClass("hidden");
		setTimeout(function(){
			Post.disableForm();
		}, 1);
		return true;
	},
	
	disableForm : function(){
		if(!this.formEnable)
			return;
		this.formEnable = false;
		$$("#publish-form input, #publish-form textarea, #publish-form select").set("disabled", true);
		new Element("div", {
			id : "publish-disabled",
			styles : $merge({
				"position" : "absolute",
				"background-color" : "black",
				"opacity" : 0.2
			}, $("publish-form").getCoordinates())
		}).inject($("publish-form"), "after");
	},
	
	enableForm : function(){
		if(this.formEnable)
			return;
		this.formEnable = true;
		$$("#publish-form input, #publish-form textarea, #publish-form select").set("disabled", false);
		$("publish-disabled").destroy();
	},
	
	errorForm : function(errMsg){
		$("publish-error").set("html", errMsg).removeClass("hidden");
		this.enableForm();
	}
};


var Comment = {
	init : function(e){
		if(!$defined(e))
			e = $$(".post-comments");
		if($type(e) == 'array'){
			e.each(function(e){
				Comment.init(e);
			});
			return;
		}
		
		if(e.getElements(".post-comment").length==0)
			e.addClass("hidden");
		
		// Submit form
		var f = e.getElements("form");
		if(f.length == 0)
			return;
		f = f[0];
		var t = f.getElements("textarea")[0];
		f.addEvent("submit", function(){
			// Disabling form
			f.getElements("input, textarea").set("disabled", true);
			// Sending form trough AJAX
			new Request({
				url: f.action,
				onSuccess: function(data){
					var el = new Element("div", {html: data}).getElements("div")[0];
					el.inject(f, "before");
					f.getElements("input, textarea").set("disabled", false);
					t.set("value", "").fireEvent("blur");
				}
			}).post({message: t.value});
			return false;
		});
	},
	
	write : function(post_id){
		var e = $$("#post-"+post_id+" .post-comments")[0].removeClass("hidden"),
			placeholder = e.getElements(".post-comment-write-placeholder")[0].addClass("hidden"),
			avatar = e.getElements(".post-comment-write .avatar")[0].removeClass("hidden"),
			message = e.getElements(".post-comment-write-message")[0].removeClass("hidden");
			t = message.getElements("textarea")[0]
				.setStyle("height", 20);
			t.focus();
			if(t.retrieve("initiated"))
				return;
			t	.store("initiated", true)
				.resizable()
				.addEvent("blur", function(){
					if(this.value.trim() == ""){
						placeholder.removeClass("hidden");
						avatar.addClass("hidden");
						message.addClass("hidden");
					}
				});
	},
	
	showAll : function(post_id){
		$("post-"+post_id+"-comment-show-all").destroy();
		$$("#post-"+post_id+" .post-comment").removeClass("hidden");
	}
};


var Survey = {
	init : function(e){
		if(!$defined(e))
			e = $$(".survey");
		if($type(e) == 'array'){
			e.each(function(e){
				Survey.init(e);
			});
			return;
		}
		
		var inputs = e.getElements("input[type=checkbox], input[type=radio]"),
			nb_votes = inputs.filter(function(el){
				return !! el.checked;
			}).length;
		Survey.showResults(e, nb_votes > 0 || inputs.length == 0);
		if(inputs.length == 0)
			return;
		e.getElements(".survey-choice-vote a")[0].addEvent("click", function(){
			Survey.showResults(e, true);
		});
		e.getElements(".survey-choice-results a")[0].addEvent("click", function(){
			Survey.showResults(e, false);
		});
		
		// Submit form
		e.addEvent("submit", function(){
			var o = {};
			e.getElements("input[type=checkbox], input[type=radio]").filter(function(el){
				return !! el.checked;
			}).each(function(i){
				o[i.name] = i.value;
			});
			// Disabling form
			e	.addClass("survey-disabled")
				.getElements("input").set("disabled", true);
			// Sending form trough AJAX
			new Request({
				url: e.action,
				onSuccess: function(data){
					var el = new Element("div", {html: data}).getElements("div")[0],
						ex = $(el.id);
					el.inject(ex, "after");
					ex.destroy();
					Survey.init(el.getElements(".survey"));
				}
			}).post(o);
			return false;
		});
	},
	
	/**
	 * Change the view of th survey
	 *
	 * @param Element e		Form element of the survey
	 * @param boolean b		If true, results are shown, if false, form is shown
	 */
	showResults : function(e, b){
		e.getElements(b	 ? ".survey-answer-vote, .survey-choice-vote" : ".survey-answer-result, .survey-choice-results").addClass("hidden");
		e.getElements(!b ? ".survey-answer-vote, .survey-choice-vote" : ".survey-answer-result, .survey-choice-results").removeClass("hidden");
	}
};



var Calendar = {
	init : function(){
		var e = $$('#calendar table a');
		e.each(function(el){
			var content = el.get('title').split(' :: ');
			el.store('tip:title', content.splice(0, 1)[0]);
			el.store('tip:text', '<ul><li>'+content.join('</li><li>')+'</li></ul>');
		});
		new Tips(e);
	}
};


// Set the width of videos in the timelines to 100%
function resizeVideos(){
	$$(".timeline .video").each(function(e){
		e	.setStyle("width", "100%")
			.setStyle("height", e.offsetWidth * 3/4);
	});
}



window.addEvent("domready", function(){

	// Search form
	$("search").addEvent("focus", function(){
			if(this.hasClass("search-default")){
				this.removeClass("search-default")
					.store("overtext", this.value);
				this.value = "";
			}
		})
		.addEvent("blur", function(){
			if(this.value.trim() == ""){
				this.value = this.retrieve("overtext");
				this.addClass("search-default");
			}
		});
	
	// Posts
	Post.init();
	
	// Comments
	Comment.init();
	
	// Surveys
	Survey.init();
	
	// Calendar
	Calendar.init();
	
	// Video resizing
	resizeVideos();
});

// Video auto-resizing
window.addEvent("resize", resizeVideos);