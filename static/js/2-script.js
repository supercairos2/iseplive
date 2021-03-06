
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
    }
    else{
        return name;
    }
}

Locale.use('fr-FR');


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
    },
	
    // Convert special characters to HTML entities
    htmlspecialchars : function(){
        return this
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }
});




/* Publication form */

var Post = {
	
    pageOfficial : 1,
    pageNonOfficial : 1,
    busy : false,
	
    currentPhoto : -1,
	
    init : function(){
        if($("publish-message"))
            this.initForm();
        if($("attachment-photo"))
            this.initPhoto();
        this.initDelete();
		
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
                        var el = new Element("div", {
                            html: data
                        }).inject(link, "before");
                        if(el.get("html").trim() == ""){
                            link.tween("opacity", 0);
                        }else{
                            Post.initDelete(el);
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
	
	
    // Viewing a photo gallery
    initPhoto : function(){
		
        window.addEvent('hashchange', function(hash){
            var photos = $$('.photos');
            if(photos.length == 0)
                return;
			
            var m = hash.match(/^photo-([0-9]+)$/);
            if(m){
                photos[0].addClass('hidden');
                $("attachment-photo").removeClass('hidden');
				
                var i = -1;
                for(var j=0; j < Post.photos.length; j++){
                    if(Post.photos[j].id == m[1]){
                        i = j;
                        break;
                    }
                }
                if(i == -1){
                    location.hash = '';
                }else{
					
                    Post.currentPhoto = i;
                    var photo = Post.photos[i],
                    img = $("attachment-photo-img");
                    if(img)
                        img.set("src", photo.url);
                    else
                        new Element("img", {
                            "id" : "attachment-photo-img",
                            "src" : photo.url
                        })
                        .addEvent("click", function(){
                            $("attachment-photo-next").fireEvent("click");
                        })
                        .inject($("attachment-photo"));
                    // Cas de base : On a jamais aimé    
                    $$('.like-link').removeClass('hidden');
                    $$('.unlike-link').addClass('hidden');
                    // Pour chaques Likes :
                    $$(".post-like").each(function(l){
                        // Cas ou quelqu'un a deja aimé && c'est la photo affiché.
                        if(l.hasClass("post-like-attachment-"+photo.id)){
                            // On affiche la "Like Box"
                            l.removeClass("hidden");
                            // Cas ou on a personnellement aimé
                            if($('like-it-'+photo.id) === null){
                                // On affiche "Je n'aime plus !"
                                $$('.like-link').removeClass('hidden');
                                $$('.unlike-link').addClass('hidden');
                            } else {
                                // On affiche "J'aime"
                                $$('.like-link').addClass('hidden');
                                $$('.unlike-link').removeClass('hidden');
                            }
                        } else {
                            // C'est pas la bonne photo, on cache la "Like Box"
                            l.addClass("hidden");
                        }
                    });
                    $$(".post-comment").each(function(e){
                        if(e.hasClass("post-comment-attachment"+photo.id))
                            e.removeClass("hidden");
                        else
                            e.addClass("hidden");
                    });
                    $$(".post-delete").addClass("hidden");
                }
				
            }else if(photos[0].hasClass('hidden')){
                photos[0].removeClass('hidden');
                $("attachment-photo").addClass('hidden');
				
                Post.currentPhoto = -1;
		$$(".post-like").each(function(l){
                        if(l.hasClass("post-like-attachment-0"))
                            l.removeClass("hidden");
                        else
                            l.addClass("hidden");
                });		
                $$(".post-comment").each(function(e){
                    if(e.hasClass("post-comment-attachment0"))
                        e.removeClass("hidden");
                    else
                        e.addClass("hidden");
                });
            }
        });
        if(location.hash.indexOf('#') == 0)
            window.fireEvent('hashchange', location.hash.substr(1));
		
        var prev = function(){
            var i = Post.currentPhoto-1;
            if(i < 0)
                i = Post.photos.length-1;
            location.hash = '#photo-'+Post.photos[i].id;
        };
        var next = function(){
            var i = Post.currentPhoto+1;
            if(i >= Post.photos.length)
                i = 0;
            location.hash = '#photo-'+Post.photos[i].id;
        };
        $("attachment-photo-prev").addEvent("click", prev);
        $("attachment-photo-next").addEvent("click", next);
        $("attachment-photo-album").addEvent("click", function(){
            location.hash = '';
        });
        window.addEvent("keydown", function(e){
            if(e.target && ["INPUT", "SELECT", "TEXTAREA"].contains(e.target.tagName))
                return;
            if(e.key == 'right' || e.key == 'space'){
                next();
                return false;
            }
            if(e.key == 'left' || e.key == 'backspace'){
                prev();
                return false;
            }
            if(e.key == 'up'){
                location.hash = '';
                return false;
            }
        });
    },
	
    initDelete : function(el){
        if(el == null)
            el = $$(".post");
        if(typeOf(el) == "elements"){
            el.each(function(e){
                Post.initDelete(e);
            });
            return;
        }
        if(!el.hasClass("post")){
            Post.initDelete(el.getElements(".post"));
            return;
        }
        var d = el.getElements(".post-delete")[0];
        if(!d || d.retrieve("ajax_url"))
            return;
        d.addEvent("click", function(){
            if(!confirm(__('POST_DELETE_CONFIRM')))
                return;
            new Request.JSON({
                url: this.retrieve("ajax_url"),
                onSuccess: function(data){
                    if(data.success && el){
                        el.set('tween', {
                            property : "opacity",
                            onComplete : function(){
                                el.destroy();
                            }
                        })
                        .get('tween')
                        .start(0);
                    }
                }
            }).get();
        })
        .store("ajax_url", d.href)
        .set("href", "javascript:;");
    },
	
	
    formEnable : true,
	
    initForm : function(){
        var options = $$("#publish-categories, #publish-group, #publish-private").addClass("hidden");
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
		
        if($("publish-group")){
            var groupOfficial = $("publish-group-official").addClass("hidden");
            $("publish-group-select").addEvent("change", function(){
                if(this.options[this.options.selectedIndex].hasClass("publish-group-admin"))
                    groupOfficial.removeClass("hidden");
                else
                    groupOfficial.addClass("hidden");
            });
        }
    },
	
    attach : function(type){
        var e = $("publish-stock-attachment-"+type)
        .clone()
        .setStyle("opacity", 0)
        .inject("publish-attachments");
        e.set('tween', {
            duration: 300,
            property : "opacity"
        })
        .get('tween')
        .start(1);
        e.getElements(".publish-attachment-delete")[0].addEvent("click", function(){
            e.set('tween', {
                duration: 300,
                property : "opacity",
                onComplete : function(){
                    e.destroy();
                }
            })
            .get('tween')
            .start(0);
        });
        return e;
    },
	
	
    attachEvent : function(){
        if($$("#publish-form input[name=event_title]").length != 0)
            return;
        this.attach("event");
        new Picker.Date($$("#publish-form input[name=event_start], #publish-form input[name=event_end]"), {
            pickerClass: "datepicker_jqui",
            format: __("PUBLISH_EVENT_DATE_FORMAT"),
            timePicker : true,
            draggable : false
        });
    },
	
	
    attachSurvey : function(){
        if($$("#publish-form input[name=survey_question]").length != 0)
            return;
        this.attach("survey");
        new Picker.Date($$("#publish-form input[name=survey_end]"), {
            pickerClass: "datepicker_jqui",
            format: __("PUBLISH_SURVEY_DATE_FORMAT"),
            timePicker : true,
            draggable : false
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
            styles : {
                "position" : "absolute",
                "background-color" : "black",
                "opacity" : 0.2
            }
        })
        .setStyles($("publish-form").getCoordinates())
        .inject($("publish-form"), "after");
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

var Like = {
    initPostLike: function(post_id){
        var URL_ROOT = $('header-title').getProperty('href');
        var obj = {};
        if(Post.currentPhoto != -1)
            obj.attachment = Post.photos[Post.currentPhoto].id;
        else
            obj.attachment = 0;
        new Request({
            url: URL_ROOT+'ajax/like/'+post_id+'/add',
            onSuccess: function(data){
                if(data == 'true'){
                    // On Change de Bouton de Like->Unlike
                    $('post-like-link-'+post_id).toggleClass('hidden');
                    $('post-unlike-link-'+post_id).toggleClass('hidden');
                    // On Affiche le tout
                    if($('post-like-'+post_id+'-'+obj.attachment) != null){
                        $('post-like-'+post_id+'-'+obj.attachment).removeClass('hidden');
                        $('new-like-container-'+post_id+'-'+obj.attachment).removeClass('hidden');
                        $('like-grammar-'+post_id+'-'+obj.attachment).set('text', 'z');
                    } else {
                        $('post-like-'+post_id+'-all').clone()
                                                      .set('id', 'post-like-'+post_id+'-'+obj.attachment)
                                                      .addClass("post-like-attachment-"+obj.attachment)
                                                      .inject('post-like-'+post_id+'-all','after');
                        $('post-like-'+post_id+'-'+obj.attachment).removeClass('hidden');
                        $$('#post-like-'+post_id+'-'+obj.attachment+' .like-last').set('id', 'like-last-'+post_id+'-'+obj.attachment);
                    }
                } else {
                    alert('Erreur, ajout impossible.');
                }
            }
        }).post(obj);
    },
    initPostComLike: function(post_id, comment_id){
        var URL_ROOT = $('header-title').getProperty('href');
        var obj = {
            comment_id : comment_id
        };
        if(Post.currentPhoto != -1)
                obj.attachment = Post.photos[Post.currentPhoto].id;
        new Request({
            url: URL_ROOT+'ajax/likecom/'+post_id+'/add',
            onSuccess: function(data){
                if(data == 'true'){
                    // On Change de Bouton de Like->Unlike
                    $('post-com-like-link-'+comment_id).toggleClass('hidden');
                    $('post-com-unlike-link-'+comment_id).toggleClass('hidden');
                    // On Affiche le tout
                    var value = parseInt($('post-com-like-val-'+comment_id).get('text'));
                    $('post-com-like-val-'+comment_id).set('text', (++value));
                    $('post-com-like-new-'+comment_id).removeClass('hidden');
                    if(value > 1)
                        $('like-com-conj-'+comment_id).removeClass('hidden');
                    else
                        $('like-com-conj-'+comment_id).addClass('hidden');
                } else {
                    alert('Erreur, ajout impossible.');
                }
            }
        }).post(obj);
    },
    initPostUnlike: function(post_id){
        var URL_ROOT = $('header-title').getProperty('href');
        var obj = {};
        if(Post.currentPhoto != -1)
            obj.attachment = Post.photos[Post.currentPhoto].id;
        else
            obj.attachment = 0;
        new Request({
            url: URL_ROOT+'ajax/like/'+post_id+'/delete',
            onSuccess: function(data){
                if(data  == 'true'){
                    $('post-like-link-'+post_id).toggleClass('hidden');
                    $('post-unlike-link-'+post_id).toggleClass('hidden');
                    // Stuff
                    if(parseInt($('like-last-'+post_id+'-'+obj.attachment).get('text')) == 0)
                        $('post-like-'+post_id+'-'+obj.attachment).destroy();
                    else if(parseInt($('like-last-'+post_id+'-'+obj.attachment).get('text')) > 2) {
                        $('like-grammar-'+post_id+'-'+obj.attachment).set('text', 'nt');
                        $('new-like-container-'+post_id+'-'+obj.attachment).addClass('hidden');
                    } else{
                        $('like-grammar-'+post_id+'-'+obj.attachment).set('text', '');
                        $('new-like-container-'+post_id+'-'+obj.attachment).addClass('hidden');
                    }
                }else {
                    alert('Erreur, ajout impossible.');
                }
            } 
        }).post(obj);
    },
    initPostComUnlike: function(post_id, comment_id){
        var URL_ROOT = $('header-title').getProperty('href');
        var obj = {
            comment_id : comment_id
        };
        if(Post.currentPhoto != -1)
                obj.attachment = Post.photos[Post.currentPhoto].id;
        new Request({
            url: URL_ROOT+'ajax/likecom/'+post_id+'/delete',
            onSuccess: function(data){
                if(data  == 'true'){
                    $('post-com-like-link-'+comment_id).toggleClass('hidden');
                    $('post-com-unlike-link-'+comment_id).toggleClass('hidden');
                    var value = parseInt($('post-com-like-val-'+comment_id).get('text'));
                    $('post-com-like-val-'+comment_id).set('text', (--value));
                    if(value < 1)
                        $('post-com-like-new-'+comment_id).addClass('hidden');
                    else if(value == 1)
                        $('like-com-conj-'+comment_id).addClass('hidden');
                    else
                        $('like-com-conj-'+comment_id).removeClass('hidden');
                } else {
                    alert('Erreur, ajout impossible.');
                }
            }
        }).post(obj);
    },
        
    showAll : function(post_id){
        var photo_id;
        if(Post.currentPhoto != -1)
            photo_id = Post.photos[Post.currentPhoto].id;
        else
            photo_id = 0;
        $('like-show-short-'+post_id+'-'+photo_id).destroy();
        $('like-show-all-'+post_id+'-'+photo_id).removeClass("hidden");
    },
    
    showAllCom : function(){
        var customTips = $$('.likeTooltips');
        var toolTips = new Tips(customTips, {
            offsets: {
                'x': 0, //par défaut : 16
                'y': 0 //par défaut : 16
            },
            fixed: true
        });
    }
};

var Comment = {
    init : function(e){
        if(e == null)
            e = $$(".post-comments");
        this.initDelete(e);
        if(typeOf(e) == "elements"){
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
            var obj = {
                message: t.value
            };
            if(Post.currentPhoto != -1)
                obj.attachment = Post.photos[Post.currentPhoto].id;
            new Request({
                url: f.action,
                onSuccess: function(data){
                    var el = new Element("div", {
                        html: data
                    }).getElements("div")[0];
                    el.inject(f, "before");
                    Comment.initDelete(el);
                    f.getElements("input, textarea").set("disabled", false);
                    t.set("value", "").fireEvent("blur");
                }
            }).post(obj);
            return false;
        });
    },
	
    initDelete : function(el){
        if(el == null)
            el = $$(".post-comment");
        if(typeOf(el) == "elements"){
            el.each(function(e){
                Comment.initDelete(e);
            });
            return;
        }
        if(!el.hasClass("post-comment")){
            Comment.initDelete(el.getElements(".post-comment"));
            return;
        }
		
        el.getElements(".post-comment-delete").each(function(d){
            if(d.retrieve("ajax_url"))
                return;
            d.addEvent("click", function(){
                if(!confirm(__('POST_COMMENT_DELETE_CONFIRM')))
                    return;
                new Request.JSON({
                    url: this.retrieve("ajax_url"),
                    onSuccess: function(data){
                        if(data.success && el){
                            el.set('tween', {
                                property : "opacity",
                                onComplete : function(){
                                    el.destroy();
                                }
                            })
                            .get('tween')
                            .start(0);
                        }
                    }
                }).get();
            })
            .store("ajax_url", d.href)
            .set("href", "javascript:;");
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
        if(e == null)
            e = $$(".survey");
        if(typeOf(e) == "elements"){
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
                    var el = new Element("div", {
                        html: data
                    }).getElements("div")[0],
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

var Group = {
    initEdit : function(){
        if(!$("group_edit_name"))
            return;
		
        $("group_edit_description").resizable();
        this.initDeleteMember();
		
        // Creation date
        new Picker.Date($("group_edit_creation_date"), {
            pickerClass: "datepicker_jqui",
            format: __("GROUP_EDIT_FORM_CREATION_DATE_FORMAT_PARSE"),
            draggable : false
        });
		
        // Sortable list of members
        this.sortableMembers = new Sortables('#group-edit-members ul', {
            constrain: true,
            clone: true,
            revert: true,
            handle: '.group-member-handle'
        });
		
        // User name auto-completion
        new Meio.Autocomplete('group_edit_add_member', $('group_edit_add_member_url').value, {
            delay: 200,
            minChars: 1,
            cacheLength: 100,
            maxVisibleItems: 10,
			
            onSelect: function(elements, data){
                var i = $('group_edit_add_member').set('value', '');
                i.blur();
                setTimeout(function(){
                    i.focus();
                }, 0);
				
                var e = new Element('li', {
                    html: $("group-edit-member-stock").innerHTML
                });
                e.getElements('.group-member-name')[0]
                .set('html', data.value.htmlspecialchars())
                .set('href', data.url)
                .removeClass('group-member-name');
                e.getElements('input[name=members_ids[]]')[0]
                .set('value', data.user_id);
                e.getElements('input[name=member_title]')[0]
                .set('name', 'member_title_'+data.user_id);
                e.getElements('input[name=member_admin]')[0]
                .set('name', 'member_admin_'+data.user_id);
                Group.initDeleteMember(e);
                e.inject($$('#group-edit-members ul')[0]);
                Group.sortableMembers.addItems(e);
            },
			
            urlOptions: { 
                queryVarName: 'q',
                max: 10
            },
            filter: {
                filter: function(text, data){
                    return true;
                },
                formatMatch: function(text, data, i){
                    return data.value;
                },
                formatItem: function(text, data){
                    return data.value;
                }
            }
        });

    },
	
    initDeleteMember : function(el){
        if(el == null)
            el = $$("#group-edit-members li");
        if(typeOf(el) == "elements"){
            el.each(function(e){
                Group.initDeleteMember(e);
            });
            return;
        }
        el.getElements(".group-member-delete")[0].addEvent("click", function(){
            Group.sortableMembers.removeItems(el);
            el.destroy();
        });
    }
};




var User = {
    initEdit : function(){
        if(!$("user_edit_mail"))
            return;
		
        // Creation date
        new Picker.Date($("user_edit_birthday"), {
            pickerClass: "datepicker_jqui",
            format: __("USER_EDIT_FORM_BIRTHDAY_FORMAT_PARSE"),
            draggable : false
        });
		
    }
};

var data = [
    {identifier: 1, value: 'some1'},
    {identifier: 2, value: 'some2'},
    {identifier: 3, value: 'some3'}
];
        
var Extra = {
    init : function(){
        var URL_ROOT = $('header-title').getProperty('href');
        $$('#isepor .autocomplete').each(function(el){
            var val = el.getParent().get('itemid');
            var type = $('question-'+val+'-type').get('value');
            var extra = $('question-'+val+'-extra').get('value');
            extra = (extra.length == 0) ? '': extra;
            new Meio.Autocomplete(el, URL_ROOT+'ajax/isepor/autocomplete', {
                delay: 200,
                minChars: 0,
                cacheType: 'own',
                cacheLength: 100,
                maxVisibleItems: 10,
                onNoItemToList: function(elements){
                   // alert('Not Found :'+elements.toSource());
                   $('question-'+val+'-valid').set('value', '');
                   $('question-'+val+'-input').addClass('form-error');
                   $('question-'+val+'-error-com').addClass('hidden');
                   $('question-'+val+'-error-emp').addClass('hidden');
                   $('question-'+val+'-error-nan').removeClass('hidden');
                }, // this event is fired when theres no option to list
                onSelect: function(elements, value){
                    //alert('Selected ! Val :'+value.toSource());
                    $('question-'+val+'-input').set('class', '');
                    $('question-'+val+'-error-com').addClass('hidden');
                    $('question-'+val+'-error-emp').addClass('hidden');
                    $('question-'+val+'-error-nan').addClass('hidden');
                    $('question-'+val+'-valid').set('value', value.valid);
                    if($('question-'+val+'-extra'))
                        var has_extra = '-extra';
                    else 
                        var has_extra = '';
                    $('question-'+val+'-valid').set('name', 'valid-'+value.tableName+'-'+val+has_extra);
                }, // this event is fired when you select an option
                onDeselect: function(elements){
                    //alert('Deselected : '+elements);
                    $('question-'+val+'-valid').set('value', '');
                    $('question-'+val+'-input').addClass('form-error');
                    $('question-'+val+'-error-com').removeClass('hidden');
                    $('question-'+val+'-error-emp').addClass('hidden');
                    $('question-'+val+'-error-nan').addClass('hidden');
                }, // this event is fired when you deselect an option 	
                urlOptions: { 
                    queryVarName: 'q',
                    extraParams: [{
                            name: 'type',
                            value: type
                        }, {
                            name: 'extra',
                            value: extra
                    }],
                    max: 10
                },
                filter: {
                    filter: function(text, data){
                        return true;
                    },// filters the data array
                    formatMatch: function(text, data, i){
                        return data.shows;
                    },// this function should return the text value of the data element
                    formatItem: function(text, data){
                        return data.shows;
                    }// the return of this function will be applied to the 'html' of the li's
                },
                fieldOptions: {
                    classes: {
                        loading: 'form-loading', // applied to the field when theres an ajax call being made
                        selected: 'form-ok' // applied to the field when theres a selected value
                    }
                }, 
                listOptions: {
                    width: 'field', // you can pass any other value settable by set('width') to the list container

                    classes: {
                        container: 'ma-container',
                        hover: 'ma-hover', // applied to the focused options
                        odd: 'ma-odd', // applied to the odd li's
                        even: 'ma-even' // applied to the even li's
                    }
                },
                requestOptions: {
                    formatResponse: function(jsonResponse){ // this function should return the array of autocomplete data from your jsonResponse
                        return jsonResponse;
                    }
                }
            });
        });
    }
}

var Search = {
    init : function(){
        // Search field auto-completion
        new Meio.Autocomplete('search', $('search-ajax-url').value, {
            delay: 200,
            minChars: 1,
            cacheLength: 100,
            maxVisibleItems: 20,
			
            onSelect: function(elements, data){
                document.location = data.url
                $('search').set('value', '').blur();
            },
			
            urlOptions: { 
                queryVarName: 'q',
                max: 20
            },
            filter: {
                filter: function(text, data){
                    return true;
                },
                formatMatch: function(text, data, i){
                    return data.value;
                },
                formatItem: function(text, data){
                    return data.value;
                }
            },
            listOptions: { 
                width: 300
            }
        });
		
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
	
    // Extra
    
    Extra.init();
    
    // Posts
    Post.init();
	
    // Comments
    Comment.init();
	
    // Surveys
    Survey.init();
	
    // Calendar
    Calendar.init();
	
    // Search
    Search.init();
	
    // Likes 
    Like.showAllCom();
    
    // Video resizing
    resizeVideos();
});

// Video auto-resizing
window.addEvent("resize", resizeVideos);

// Field Verif For Isep Live's poll Isep D'Or

window.addEvent('submit', function(e) {
    if($('form-isepor-first')){
        $$('#isepor .valid').each(function(el){
            if (typeOf(el.get('value'))=='undefined' || !el.get('value') || el.get('value').trim().length == 0) {
                var val = el.getParent().get('itemid');
                $('question-'+val+'-error-com').addClass('hidden');
                $('question-'+val+'-error-nan').addClass('hidden');
                $('question-'+val+'-error-emp').removeClass('hidden');
                new Event(e).stop();
            }
        });
    } else if($('form-isepor-final')){
//        $$('#isepor .valid').each(function(el){
//            var val = el.get('itemid');
//            var valid = false;
//            $$('#question-'+val+' input[type=radio]').each(function(el){
//                if(el.checked)
//                    valid = true;
//            });
//            if(!valid) {
//                $('question-'+val+'-error-emp').removeClass('hidden');
//                new Event(e).stop();
//            } else {
//                $('question-'+val+'-error-emp').addClass('hidden');
//            }
//        });
    }
});