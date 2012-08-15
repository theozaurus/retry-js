if ("undefined" == typeof com) { var com = {}; }
if (!com.jivatechnology) { com.jivatechnology = {}; }

// this module function is called with com.jivatechnology as 'this'
(function(){

  var scope = this;

  this.Callback = (function(){

    // Return the constructor
    return function(opts){

      var options = opts;

      // Checks
      if(typeof options.func != "function"){
        throw("Callback created without a func");
      }

      // Private methods
      var marshal_to_function = function(value){
        if(typeof value != "function"){
          return function(){ return value; };
        } else {
          return value;
        }
      };

      options.must_keep = marshal_to_function(options.must_keep || false);

      // Privileged methods
      this.func = function(){
        return options.func.apply(options,arguments);
      };

      this.must_keep = function(){
        return options.must_keep.apply(options,arguments);
      };
    };

  })();

  this.CallbackList = (function(){

    // Private class level objects


    // Return the constructor
    return function(){

      // Private variables
      var list;

      // Private functions
      make_array = function(callbacks){
        if(!(callbacks instanceof Array)){
          callbacks = [callbacks];
        }
        return callbacks;
      };

      marshal = function(c){
        if(c instanceof scope.Callback){
          return c;
        }else{
          return new scope.Callback({func: c});
        }
      };

      marshal_array = function(callbacks){
        results = []
        for(var c in callbacks){
          if(callbacks.hasOwnProperty(c)){
            var marshalled = marshal(callbacks[c]);
            results = results.concat(marshalled);
          }
        }

        return results;
      };

      // Privileged functions
      this.size = function(){
        return list.length;
      };

      this.add = function(callbacks){
        // Make sure callbacks is always an array
        callbacks = make_array(callbacks);

        // Make sure callbacks are com.jivatechnology.Callback
        callbacks = marshal_array(callbacks);

        // Add them
        list = list.concat.apply(list,callbacks);
        return callbacks;
      };

      this.clear = function(){
        list = [];
      };

      this.handle = function(issuccess){
        // Scan list in reverse order so we can delete elements
        // without causing problems
        var args = Array.prototype.slice.call(arguments);
        for(var i = list.length - 1; i >= 0; i--){
          // Call handle on each callback
          list[i].func.apply(this,args);
          // Check if it should be kept
          var keep = list[i].must_keep(this,args);
          if(!keep){ list.splice(i,1); }
        }
      };

      // Initialize list
      this.clear();

      // Add callbacks if any specified on creation
      if(arguments.length >= 1){ this.add(arguments[0]); }
    };

  })();

}).call(com.jivatechnology);