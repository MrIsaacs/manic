/**
 * Created by MrIsaacs on 28.05.2016.
 */

var Manic = new function () {
    var self = this;
    this.version = "2.0";
    this.scriptPromise;
    this.testScripts = {
        framework: {
            url: ["mootools", "mootools-more"],
            fn: () => {}
        }
    };
    this.testScripts2 = {
        framework: {
            url: "mootools",
            fn: () => {}
        },
        markdown: {
            url: ["showdown", "moodown"],
            fn: () => {}
        }
    };
    this.scripts = {
        framework: {
            url: ["mootools", "mootools-more"],
            fn: () => {
                console.log('loaded MooTools');
            }
        },
        markdown: {
            url: ["showdown", "moodown"],
            fn: () => {
                console.log('loaded Markdown');
            }
        },
        router: {
            url: "navigo",
            fn: () => {
                var i = document.getElementsByTagName('a').length;
                for (var j = 0; j < i; j++){
                    document.getElementsByTagName('a')[j].addEventListener('click', event => {
                        event.preventDefault();
                    });
                }
                console.log('loaded Navigo');

                return new Navigo('/manic', true).on({
                    // get a list of routing defonitions from
                    // several routing apps/plug-ins
                    'changelog/list': () => {
                        self.getJSON('changelog').then(response => {
                            console.log(response);
                        });

                        console.log('changlog-list');
                    },
                    // provide level separator such as ":" for
                    // extracting information about the connection
                    // e.g. between a category and an individual
                    // data entry
                    'changelog/:id': params => {
                        jsonRequest.options.url = './data/changelog.json';
                        jsonRequest.setHeader('M-Request-Type', 'Info');
                        jsonRequest.setHeader('M-Request-ID', params.id);
                        // console.log(jsonRequest);
                        jsonRequest.get();
                        console.log('article-');
                    },
                    'credits': () => {
                        self.getJSON('changelog').then(response => {
                            console.log(response);
                        });
                        console.log('credits');
                    },
                    '/': () => {
                        self.getJSON('home').then(response => {
                            console.log(response);
                        });

                        console.log('home');
                    }
                }).navigate(window.location.hash);
            }
        }
    };

    this.initialize = () => {
        console.log('Manic Version ' + this.getVersion());
        document.onreadystatechange = () => {
            if (document.readyState === 'complete') {
                var i = document.getElementsByTagName('a').length;
                for (let j = 0; j < i; j++){
                    document.getElementsByTagName('a')[j].addEventListener('click',event => {
                        event.preventDefault();
                    });
                }

                self.getScriptCollection();
            }
        }
    };

    this.getVersion = () => {
        return this.version;
    };
    this.isArray = e => {
        if (Object.prototype.toString.call( e ) === '[object Array]') {
            return true;
        } else  {
            return false;
        }
    };
    this.isPromise = e => {
        if (Object.prototype.toString.call(e) === '[object Promise]') {
            return true;
        } else {
            return false;
        }
    };
    this.getJS = url => {
        "use strict";
        /* activate state requested */
        /* @todo: add eventhandler for handling the request state */
        return new Promise((resolve, reject) => {
            /* Do the usual XHR stuff */
            var req = new XMLHttpRequest();
            req.open('GET', './js/' + url + '.js');

            // @todo: create req.state for eventhandling
            req.onload = () => {
                /* appends index to response  */
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
    };
    this.getJSON = url => {
        return new Promise((resolve, reject) => {
            // Do the usual XHR stuff
            var req = new XMLHttpRequest();
            url = './data/' + url + '.json';
            console.log(url);
            req.open('GET', url);

            req.onload = () => {
                // This is called even on 404 etc
                // so check the status
                if (req.status == 200) {
                    // Resolve the promise with the response text
                    resolve(req.response);

                    //console.log(req.response);
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
    };

    this.getScripts = scripts => {
        "use strict";
        var self = this;

        // check if script - url is an array
        if (self.isArray(scripts.url)) {
            return scripts.url.reduce((sequence, url) => {
                return sequence.then(() => {
                    return self.getJS(url);
                }).then(response => {
                    self.insertScript(response, scripts);

                    if(scripts.url[scripts.url.length-1] === url) {
                        if (scripts.hasOwnProperty('fn')) {
                            scripts.fn(new Function(response.script)());
                        }
                    }
                });
            }, Promise.resolve());
        // otherwise it is a string
        // @todo: needs to be tested for several types
        } else {
            return self.getJS(scripts.url).then(response => {
                self.insertScript(response, scripts);

                if (scripts.hasOwnProperty('fn')) {
                    scripts.fn(new Function(response.script)());
                }
            });
        }
    };

    this.insertScript = (response, script) => {
        var s = document.createElement('script');
        s.innerHTML = response.script;

        document.body.appendChild(s);
    };

    this.getScriptCollection = () => {
        "use strict";
        var self = this;
        var scripts = self.scripts;

        var sequence = Promise.resolve();

        Object.keys(scripts).forEach(script => {
            sequence = sequence.then(() => {
                return self.getScripts(scripts[script]);
            });
        });
    };

    this.initialize();
};
