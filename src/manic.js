/**
 * Just another JavaScript library.
 * @access public
 * @author Ivan Ilic <me@mrisaacs.org>
 * @version 2.2.0
 */
class Manic {
    /**
     * Initialize events, requests and services. Events
     */
    constructor () {
        let services = Symbol.for('services');
        /**
         * @type {Object}
         * @property {number} major
         * @property {number} minor
         * @property {number} patch
         */
        this._version = {
            major: 2,
            minor: 2,
            patch: 0
        };
        /**
         * @type {Object}
         * @property {string} eventName
         * @property {function} fn
         * @todo Make CustomEvents. See Mozilla documentation link.
         * @see https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Creating_and_triggering_events
         */
        this._events = {};
        /**
         * @type {Object}
         * @property {number} id=1 Id of requested article.
         * @property {string} type=info Defines what type of data is requested.
         *                         `type` can be `info` or `list`.
         * @property {string} slug=home Defines what page is requested to be
         *                         rendered.
         * @todo change request properties
         */
        this._request = {
            id : 1,
            type : "info",
            slug : "home"
        };
        /**
         * @type {Object}
         * @todo Handle response via member.
         */
        this._response = {
            // not in use now
        };
        /**
         * @type {Object}
         * @property {Object} container
         * @property {Object} content
         */
        this._contextMgr = {
            container : "",
            content : ""
        };

        /**
         * Iterable collection of services. Each service contains the `url` and
         * `init` function, which is called in `loadServices`.
         * @type {Service}
         * @property {Service} [framework] - The framework of your desire.
         * @property {Service} [markdown] - The markdown of your wish.
         * @property {Service} [route] - The route service of your use.
         */
        this[services] = {
            /**
             * Service's iterator protocol. Scope of _this_ is attached to the
             * class. However as from _next_ function's scope we can get the
             * scope of the services Symbol and pass it for information
             * gatering.
             */
            [Symbol.iterator]: () => ({
                _first: true,
                _i: 0,
                init: (sthis) => {
                    // because of the arrow function _this_ is not bound to the
                    // Symbol iterator
                    sthis.services = this[Symbol.for('services')];
                    sthis.items = Object.keys(sthis.services);
                },
                next: function next () {
                    // scope of this remains to the symbol
                    if (this._first) {
                        /**
                         * Use to indicate wheter the Service iterator is
                         * running for the first time. If so, then initialize
                         * the services into an item list.
                         * @type {boolean}
                         */
                        this._first = false;
                        this.init(this);
                    }
                    return {
                        done: this.items.length === this._i ,
                        value: this.services[this.items[this._i++]]
                    };
                }
            }),
            framework: {
                url: ["mootools", "mootools-more"],
                init: () => {
                    this._contextMgr.container = $$("div#wrapper ^ div")[0];
                    this._contextMgr.content = $$(".article-layer")[0];
                }
            },
            route: {
                url: "navigo",
                instance : "undefined",
                init: () => {
                    let url = new URL(window.location.href);
                    let searchParams = new URLSearchParams(url.search);

                    /**
                     * @todo If URL changes, pass over search params trigger
                     * reuqestchange with the
                     */
                    this.on("requestchange", () => {
                        /**
                         * @todo This block must be triggerd on urlchange.
                         */
                        searchParams.set("q", this._request.slug);

                        if(this._request.type === "list") {
                            searchParams.set("type", this._request.type || "list");
                        } else {
                            searchParams.delete("type");
                        }

                        if(this._request.id) {
                            searchParams.set("id", this._request.id);
                        } else {
                            searchParams.delete("id");
                        }

                        var stateObj = { foo: "bar" };
                        history.pushState(
                            stateObj,
                            "Manic" + (this._request.slug).toUpperCase(),
                            "?" + searchParams.toString()
                        );

                        /**
                         * @todo: in the end it must render a node, not a slug
                         */
                        this.render(this._request.slug);
                    });
                }
            },
            markdown: {
                url: ["showdown", "moodown"],
                handle: (request, next) => {
                    return next(request);
                },
                refresh: "undefined",
                init: () => {
                    /**
                     * @todo It seems that the click event is trigger twice.
                     * Prevent eventlistener in the same custom event.
                     */
                    this.on("urlchange", () => {
                        let i = document.getElementsByTagName("a").length;

                        for (let j = 0; j < i; j++){
                            document.getElementsByTagName("a")[j].addEventListener("click", event => {
                                event.preventDefault();

                                this._request.id = event.target.dataset.hasOwnProperty("id") ? event.target.dataset.id : null;
                                this._request.type = event.target.dataset.hasOwnProperty("id") ? "info" : "list";
                                this._request.slug = event.target.dataset.link;

                                /**
                                 * @todo move requestchange basics to the core.
                                 * @todo pass over _request parameter
                                 */
                                this.trigger("requestchange", {
                                    id : event.target.dataset.hasOwnProperty("id") ? event.target.dataset.id : null,
                                    type : event.target.dataset.hasOwnProperty("id") ? "info" : "list",
                                    slug : event.target.dataset.link
                                });
                            });
                        }
                    });
                }
            }
        };

        /**
         * requestchange root eventhandler.
         */
        this.on("requestchange", (request) => {
            this._request = request;
        });

        /**
         * Defines the urlchange event. Call requestchange event if url
         * has changed. / Tracks an urlchange event occurs.
         * @todo It seems that the click event is trigger twice. Pprevent same
         * eventlistener in the same custom event.
         */
        this.on("urlchange", () => {
            let url = new URL(window.location.href);
            let searchParams = new URLSearchParams(url.search);

            this._request.id = searchParams.has("id") ? searchParams.get("id") : 1;
            this._request.type = searchParams.has("type") ? searchParams.get("type") : "info";
            this._request.slug = searchParams.has("q") ? searchParams.get("q") : "home";
        });

        document.onreadystatechange = () => {
            /**
             * @todo: write a function for click event handler
             */
            // Core Level 3 Document Object readyState
            if (document.readyState === "complete") {
                var i = document.getElementsByTagName("a").length;
                for (let j = 0; j < i; j++){
                    document.getElementsByTagName("a")[j].addEventListener("click", event => {
                        this.trigger("urlchange");
                        /**
                         * @todo: handle/trigger click events
                         */
                        event.preventDefault();
                    });
                }

                this.scriptCollection;
            }
        };
    }

    /**
     * Returns current version number.
     * @since 2.0.0
     * @return {string} Returns the version number as `major.minor.patch`.
     */
    get version() {
        return this._version.major + "."
             + this._version.minor + "."
             + this._version.patch;
    }

    /**
     * Creates a function on the fly, which can be invoced by the
     * trigger function.
     * @param {string} eventName Functionname to be created
     * @param {function} [fn] Function which will be called with respect to the
     * `eventName`.
     */
    on(eventName, fn) {
        this._events[eventName] = this._events[eventName] || [];
        this._events[eventName].push(fn);
    }

    /**
     * Deletes a function with a given name an its function. It can not be
     * triggered afterwards.
     * @todo events must also be mutable
     * @param {string} eventName `eventName` to be deleted.
     * @param {function} [fn] Function which will be deleted with respect to
     * `eventName`
     */
    off(eventName, fn) {
        if (this._events[eventName]) {
            for (var i = 0; i < this._events[eventName].length; i++) {
                if (this._events[eventName][i] === fn) {
                    this._events[eventName].splice(i, 1);
                    break;
                }
            }
        }
    }

    /**
     * Triggers eventName as a function and assigns data as parameter.
     * @todo: description of data is needed
     * @param {string} eventName Function which will be called
     * @param {Object} [data] Parameter for assigning to function
     */
    trigger(eventName, data) {
        if (this._events[eventName]) {
            this._events[eventName].forEach(function(fn) {
                fn(data);
            });
        }
    }

    /**
     * @since 2.0.0
     * @todo write docs about it...
     */
    isArray(e){
        if (Object.prototype.toString.call( e ) === "[object Array]") {
            return true;
        } else  {
            return false;
        }
    }

    /**
     * @since 2.0.0
     * @todo write docs about it...
     * @see https://stackoverflow.com/questions/27746304/how-do-i-tell-if-an-object-is-a-promise/45762727#45762727
     */
    isPromise(e){
        if (Object.prototype.toString.call(e) === "[object Promise]") {
            return true;
        } else {
            return false;
        }
    }

    /**
     * @since 2.0.0
     * @todo write docs about it...
     * @param {string} url URL is taken from {@Service} to request for its
     * script.
     */
    loadJS(url) {
        "use strict";
        /**
         * activate state requested
         *
         * @todo: add eventhandler for handling the request state
         */
        return new Promise((resolve, reject) => {
            // Do the usual XHR stuff
            var req = new XMLHttpRequest();
            /**
             * @todo: extract paht to library
             */
            req.open("GET", "./js/" + url + ".js");

            /**
             * @todo: create req.state for eventhandling
             */
            req.onload = () => {
                // appends index to response
                if (req.status == 200) {
                    var response = {
                        script : req.response
                    };
                    // Resolve the promise with the response text
                    resolve(response);
                }
                else {
                    // Otherwise reject with the status text
                    // which will hopefully be a meaningful error
                    reject(Error(req.statusText));
                }
            };

            // Handle network errors
            req.onerror = () => {
                reject(Error("Network Error"));
            };

            // Make the request
            req.send();
        });
    }

    /**
     * @since 2.0.0
     * @todo write docs about it...
     */
    loadJSON(url) {
        return new Promise(function(resolve, reject){
            // Do the usual XHR stuff
            var req = new XMLHttpRequest();
            /**
             * @todo: extract paht to library
             */
            url = "./data/" + url + ".json";
            req.open("GET", url);

            req.onload = () => {
                // This is called even on 404 etc
                // so check the status
                if (req.status == 200) {
                    // Resolve the promise with the response text
                    resolve(req.response);
                }
                else {
                    // Otherwise reject with the status text
                    // which will hopefully be a meaningful error
                    reject(Error(req.statusText));
                }
            };

            // Handle network errors
            req.onerror = () => {
                reject(Error("Network Error"));
            };

            // Make the request
            req.send();
        }).then(JSON.parse);
    }

    /**
     * @deprecated
     * @since 2.0.0
     * @param {Service} service
     */
    loadScripts(service) {
        loadServices(service)
    }

    /**
     * Load service and initialize if function _init_ exists. If `service.url`
     * is an array of URL's, then load every index, before calling _init_
     * @since 2.2.0
     * @param {Service} service
     */
    loadServices(service) {
        if (this.isArray(service.url)) {
            return service.url.reduce((sequence, url) => {
                return sequence.then(() => {
                    return this.loadJS(url);
                }).then(response => {
                    this.addScript(response, service);

                    if(service.url[service.url.length-1] === url) {
                        if (service.hasOwnProperty("init")) {
                            service.init(new Function(response.script)());
                        }
                    }
                });
            }, Promise.resolve());
        } else {
            return this.loadJS(service.url).then(response => {
                this.addScript(response, service);

                if (service.hasOwnProperty("init")) {
                    service.init(new Function(response.script)());
                }
            });
        }
    }

    /**
     * @deprecated Use `addScript` instead.
     * @since 2.0.0
     */
    insertScript(response, script) {
        this.addScript(response, script);
    }

    /**
     * Adds script to document before body ends. Called by `loadServices`.
     * @todo Bind each script with its service.
     * @since 2.2.0
     * @param {Object} response
     * @param script !NOT USED! Passed over parameter doesn't do anything.
     * @see https://stackoverflow.com/questions/950087/how-do-i-include-a-javascript-file-in-another-javascript-file/950146#950146
     */
    addScript(response, script) {
        var s = document.createElement("script");
        s.innerHTML = response.script;

        document.body.appendChild(s);
    }

    /**
     * Iterate through services and call `loadServices` for each service.
     * @since 2.0.0
     * @todo redefine scriptCollection
     * @return {string} Injects scrtipts for each needed service at the
     *                  bottom of the document, before body ends.
     */
    get scriptCollection() {
        var services = this[Symbol.for('services')];
        var sequence = Promise.resolve();

        for (let service of services) {
            sequence = sequence.then(() => {
                return this.loadServices(service);
            });
        }
    }

    /**
     * @todo should be possible: `content.addClass()`, `progressbar.addClass()`
     * or `progressbar.removeClass()`
     * @since 2.2.0
     * @todo template should be configured in settings
     * @todo `render` use _mootools_ selector to get a desired element. These
     * functions must be provided hy the `[services]` middleware stack for a
     * given service.
     */
    render(site) {
        this.loadJSON(site).then(response => {
            // start loading animation
            if(this._request.type === "info") {
                // show shimmer animation
                $$(".article-layer").addClass("hidden no-anim");
                $$(".shimmer-layer").addClass("no-anim");
                $$(".shimmer-layer").removeClass("hidden");

                /**
                 * @todo: check if the same info were requested
                 */
                if ($("list")) {
                    $("list").destroy();
                }
            } else if (this._request.type === "list") {
                /**
                 * @todo: check if the same list were requested
                 */
                if ($("detail")) {
                    $("detail").destroy();
                }
            }
            return response;
        }).then(response => {
            /**
             * @todo: extract info and list as functions
             */
            // INFO
            if(this._request.type === "info") {
                var requestID   = this._request.id;
                var index       = response.index[requestID.toString()];
                var article     = response.data[index];
                var content = "<div class=\"one-third column\">" +
                    "<a class=\"avatar-wrapper\">" +
                    "<span class=\"initial\">" +
                    "M" +
                    "</span>" +
                    "<span class=\"integral\">" +
                    "∫" +
                    "</span>" +
                    "</a>" +
                    "</div>";

                /**
                 * @todo: prevent a second detail-element is being created
                 *        when one already exists
                 *
                 * @todo: sketch an algorithm for realtime-template-validation(RTV/TVONF).
                 */
                if (!$("detail")) {
                    var detail = new Element("div",{
                        "id"    : "detail",
                        "class" : "row section content",
                        html    : content
                    }).inject(this._contextMgr.container, "bottom");
                    new Element("div",{
                        "class" : "main-article two-thirds column",
                        html    : "<div class=\"article-layer\">" +
                        "<h1 id=\"main-title\"></h1>" +
                        "<p id=\"main-date\"></p>" +
                        "<p id=\"main-body\"></p>" +
                        "</div>"
                    }).inject(detail);
                }

                /**
                 * @todo: exchange document title with a variable
                 */
                document.title = "Manic - " + article.title;

                $("main-title").set("text", article.title);
                $("main-date").set("text", new Date(article.date).timeDiffInWords());
                $("main-date").set("title", article.date);

                new MooDown("main-body", {
                    markdown    : article.body
                });
            }
            // LIST
            else if(this._request.type === "list") {
                // last added content in json files must go to data[0]
                var id = response.data[0].id;
                var container = [];

                if (!$("list")) {
                    for(let i = 0; i < response.data.length; i++) {
                        var index   = response.index[id];
                        var content = "";
                        // push a section to the container
                        if(!(i % 3)) {
                            container.push(new Element("div", {
                                "class" : "row section list"
                            }));
                        }
                        content += "<h3><a data-navigo data-id=\"";
                        content += response.data[index].id;
                        content += "\" href=\"";
                        content += response.data[index].link + "/" + response.data[index].id;
                        content += "\" data-link=\"";
                        content += response.data[index].link;
                        content += "\">";
                        content += response.data[index].title;
                        content += "</a></h3>";
                        content += "<p>";
                        content += response.data[index].short;
                        content += "</p>";
                        /**
                         * add new element to the bottom in the
                         * current container
                         */
                        new Element("div",{
                            "class" : "short-article one-third column",
                            html    : content
                        }).inject(container[container.length - 1], "bottom");
                        // if the previous id isn't null get previous
                        if(this.prev(response, id) !== null) {
                            id = this.prev(response, id).id;
                        }
                    }
                    new Element("div",{
                        "id"    : "list"
                    }).inject($("wrapper").getFirst());
                    for(let i = container.length - 1; i >= 0; i--) {
                        container[i].inject($("list"), "top");
                    }
                }

                /**
                 * @todo: exchange document title with a variable
                 */
                document.title = "Manic - ";// + article.title;
            }

            // hide shimmer animation
            $$(".shimmer-layer").removeClass("no-anim");
            $$(".shimmer-layer").addClass("hidden");
            $$(".article-layer").removeClass("hidden no-anim");

            if (typeof this[Symbol.for('services')].markdown.refresh === "function") {
                // safe to use the function
            } else {
                // function do not exist
            }
        });
    }

    /**
     * @deprecated User render instead.
     * @since 2.1.0
     */
    getContent(site) {
        this.render(site);
    }

    /**
     * @since 1.1.2
     * @param {Object} db
     * @param {string} key
     * @return {?Object} Returns the next data payload of given key.
     */
    next (db, key) {
        "use strict";
        var next = db.index[key] - 1;
        if(next < 0) {
            return null;
        }
        return db.data[next];
    }

    /**
     * @since 1.1.2
     * @param {Object} db
     * @param {string} key
     * @return {?Object} Returns the previous data payload of given key.
     */
    prev(db, key) {
        "use strict";
        var next = db.index[key] + 1;
        if(next >= db.data.length) {
            return null;
        }
        return db.data[next];
    }

}
const manic = new Manic();
