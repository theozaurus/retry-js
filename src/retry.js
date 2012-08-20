//= require callback

if ("undefined" == typeof com) { var com = {}; }
if (!com.jivatechnology) { com.jivatechnology = {}; }

// this module function is called with com.jivatechnology as 'this'
(function(){

  var CallbackList = com.jivatechnology.CallbackList;

  var scope = this;

  this.Retry = (function() {

    // Private class level objects
    var merge_options = function(obj1,obj2){
      obj1 = obj1 || {};
      obj2 = obj2 || {};
      var obj3 = {};
      for (var attr1 in obj1) {
        if( obj1.hasOwnProperty(attr1) ){ obj3[attr1] = obj1[attr1]; }
      }
      for (var attr2 in obj2) {
        if( obj2.hasOwnProperty(attr2) ){ obj3[attr2] = obj2[attr2]; }
      }
      return obj3;
    };

    var create_getter_setter = function(options,name){
      return function(){
        if( arguments.length == 1 ){
          // Setter
          options[name] = arguments[0];
          return options[name];
        } else {
          // Getter
          return options[name];
        }
      };
    };

    var check_options = function(options){
      if( typeof options.func      != "function"  ){ throw "func must be set to a function"; }
      if( typeof options.fallback  != "function"  ){ throw "fallback must be set to a function"; }

      if( typeof options.interval  == "undefined" ){ throw "interval cannot be undefined"; }
      if( typeof options.max_tries != "number"    ){ throw "max_tries must be a number"; }
      if( typeof options.timeout   != "number"    ){ throw "timeout must be a number"; }
    };

    // Return the constructor
    return function(opts) {

      var that = this;

      var defaults = {
        max_tries: 10,
        interval:  1000,
        timeout:   32000,
        fallback:  scope.Retry.Fallbacks.Constant
      };

      var options = merge_options(defaults,opts);

      // Run the function
      var attempt = 0;
      var execute = function(){
        attempt++;
        try {
          create_timeout();
          that.func().call(that);
        } catch (err) {
          that.failure(err);
        }
      };
      var reset_attempt = function(){
        attempt = 0;
      };
      reset_attempt();

      // Monitor function has not timed out

      var timeout;
      var create_timeout = function(){
        if(!timeout){
          timeout = setTimeout(
            function(){ that.failure("timeout"); },
            that.timeout()
          );
        }
      };

      var clear_timeout = function(){
        clearTimeout(timeout);
        timeout = null;
      };

      // Retry logic

      var can_retry = function(){
        return attempt < that.max_tries();
      };

      var retry;
      var schedule_retry = function(){
        if(!retry){
          retry = setTimeout(function(){
            retry = null;
            execute();
          }, wait());
        }
      };

      // Calculate earliest to retry

      var wait = function(){
        try {
          var value = that.fallback().call(that);
          if(typeof value == "number" && value >= 0){
            return value;
          } else {
            that.failure("fallback returned invalid value",false);
          }
        } catch (err) {
          that.failure(err,false);
        }
      };

      // Simple state tracking

      var state = "ready";
      var is_ready = function(){
        return state == "ready";
      };
      var is_completed = function(){
        return state == "completed";
      };
      var is_failed = function(){
        return state == "ready";
      };

      var reset = function(){
        if(is_completed()){
          state = "ready";
          reset_attempt();
        }
      };

      var complete = function(){
        if(is_ready()){
          state = "completed";
        }
      };

      var fail = function(){
        if(is_ready()){
          state = "failed";
        }
      };

      // Privileged methods

      this.failure = function(err,retry){
        if(typeof retry == "undefined"){ retry = true; }

        if(is_completed()){ reset(); }

        if(is_ready()){
          if(retry && can_retry()){
            clear_timeout();
            schedule_retry();
          } else {
            that.onFailure.handle();
            fail();
          }
        }
      };

      this.success = function(){
        if(is_ready()){
          clear_timeout();
          that.onSuccess.handle();
          complete();
        }
      };

      this.run = function(){
        check_options(options);
        if(can_retry()){
          execute();
        } else {
          failure();
        }
      };

      this.max_tries = create_getter_setter(options,"max_tries");
      this.interval  = create_getter_setter(options,"interval");
      this.timeout   = create_getter_setter(options,"timeout");
      this.fallback  = create_getter_setter(options,"fallback");
      this.func      = create_getter_setter(options,"func");
      this.onSuccess = new CallbackList(options.onSuccess || [], {must_keep: true});
      this.onFailure = new CallbackList(options.onFailure || [], {must_keep: true});
      this.attempt   = function(){ return attempt; };

    };

  })();

  this.Retry.Fallbacks = {};
  this.Retry.Fallbacks.Constant = function(){
    return this.interval();
  };

  this.Retry.Fallbacks.Fibonacci = function(){
    if(typeof this.last1 != "number"){ this.last1 = this.interval(); }
    if(typeof this.last2 != "number"){ this.last2 = 0; }

    var value = this.last1 + this.last2;
    this.last2 = this.last1;
    this.last1 = value;

    return value;
  };

}).call(com.jivatechnology);
