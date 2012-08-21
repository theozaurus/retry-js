describe("Retry", function() {

  var subject;
  var Retry = com.jivatechnology.Retry;

  describe("constructor", function(){

    it("should allow configurable max tries", function(){
      var subject = new Retry({max_tries: 5});

      expect(subject.max_tries()).toEqual(5);
    });

    it("should default max tries to 10", function(){
      var subject = new Retry();

      expect(subject.max_tries()).toEqual(10);
    });

    it("should allow configurable interval", function(){
      var subject = new Retry({interval: 5000});

      expect(subject.interval()).toEqual(5000);
    });

    it("should default interval to 1000", function(){
      var subject = new Retry();

      expect(subject.interval()).toEqual(1000);
    });

    it("should allow configurable timeout", function(){
      var subject = new Retry({timeout: 5000});

      expect(subject.timeout()).toEqual(5000);
    });

    it("should default timeout to 32000", function(){
      var subject = new Retry();

      expect(subject.timeout()).toEqual(32000);
    });

    it("should allow configurable fallback", function(){
      var func    = function(){};
      var subject = new Retry({fallback: func});

      expect(subject.fallback()).toEqual(func);
    });

    it("should default fallback to Constant", function(){
      var subject = new Retry();

      expect(subject.fallback()).toEqual(Retry.Fallbacks.Constant);
    });

    it("should allow configurable func", function(){
      var func    = function(){};
      var subject = new Retry({func: func});

      expect(subject.func()).toEqual(func);
    });

    it("should not default func to anything", function(){
      var subject = new Retry();

      expect(subject.func()).toBeUndefined();
    });

    it("should allow configurable 'onSuccess' callbacks", function(){
      var subject = new Retry({onSuccess: function(){}});

      expect( subject.onSuccess.size() ).toEqual( 1 );
    });

  });

  describe("property", function(){

    beforeEach(function(){
      subject = new Retry();
    });

    describe("'onSuccess'", function(){
      it("should be a CallbackList", function(){
        expect( subject.onSuccess ).toBeInstanceOf( com.jivatechnology.CallbackList );
      });
    });

    describe("'onFailure'", function(){
      it("should be a CallbackList", function(){
        expect( subject.onSuccess ).toBeInstanceOf( com.jivatechnology.CallbackList );
      });
    });

  });

  describe("instance method", function(){

    beforeEach(function(){
      subject = new Retry();
    });

    describe("'max_tries'", function(){
      it("should act as a setter when an argument passed in", function(){
        subject.max_tries(200);

        expect(subject.max_tries()).toEqual(200);
      });
    });

    describe("'interval'", function(){
      it("should act as a setter when an argument passed in", function(){
        subject.interval(21);

        expect(subject.interval()).toEqual(21);
      });
    });

    describe("'timeout'", function(){
      it("should act as a setter when an argument passed in", function(){
        subject.timeout(532);

        expect(subject.timeout()).toEqual(532);
      });
    });

    describe("'fallback'", function(){
      it("should act as a setter when an argument passed in", function(){
        var f = function(){};
        subject.fallback(f);

        expect(subject.fallback()).toEqual(f);
      });
    });

    describe("'func'", function(){
      it("should act as a setter when an argument passed in", function(){
        var f = function(){};
        subject.func(f);

        expect(subject.func()).toEqual(f);
      });
    });

    describe("'run'", function(){

      beforeEach(function(){
        subject.func(function(){});
      });

      describe("when object not setup correctly", function(){

        it("should throw an error if 'func' is not a function", function(){
          subject.func(undefined);

          var test = function(){ subject.run(); };
          expect( test ).toThrow("func must be set to a function");
        });

        it("should throw an error if 'fallback' is not a function", function(){
          subject.fallback(1);

          var test = function(){ subject.run(); };
          expect( test ).toThrow("fallback must be set to a function");
        });

        it("should throw an error if 'interval' is not defined", function(){
          subject.interval(undefined);

          var test = function(){ subject.run(); };
          expect( test ).toThrow("interval cannot be undefined");
        });

        it("should throw an error if 'max_tries' is not a number", function(){
          subject.max_tries("string");

          var test = function(){ subject.run(); };
          expect( test ).toThrow("max_tries must be a number");
        });

        it("should throw an error if 'timeout' is not a number", function(){
          subject.timeout("string");

          var test = function(){ subject.run(); };
          expect( test ).toThrow("timeout must be a number");
        });

      });

      describe("when 'func' executes successfully", function(){

        beforeEach(function(){
          subject.func(function(){ subject.success(); });
        });

        it("should run the 'onSuccess' callbacks", function(){
          var ran = false;

          runs(function(){
            subject.onSuccess.add(function(){ ran = true; });

            subject.run();
          });

          waitsFor(function(){
            return ran;
          });

          runs(function(){
            expect(ran).toEqual(true);
          });
        });

        it("should not run the 'onFailure' callbacks", function(){
          var ran1 = false;
          var ran2 = false;

          runs(function(){
            subject.onSuccess.add(function(){ ran1 = true; });
            subject.onFailure.add(function(){ ran2 = true; });

            subject.run();
          });

          waitsFor(function(){
            return ran1;
          });

          runs(function(){
            expect(ran2).toEqual(false);
          });
        });

        it("should only run the 'onSuccess' callbacks once if 'run' is called twice", function(){
          var number_runs = 0;

          runs(function(){
            subject.onSuccess.add(function(){ number_runs++; });

            subject.run();
            subject.run();
          });

          waitsFor(function(){
            return number_runs > 0;
          });

          runs(function(){
            expect(number_runs).toEqual(1);
          });
        });

        it("should only run the 'onSuccess' callbacks once if 'success' is called twice", function(){
          var number_runs = 0;

          runs(function(){
            subject.func(function(){ subject.success(); subject.success(); });

            subject.onSuccess.add(function(){ number_runs++; });

            subject.run();
          });

          waitsFor(function(){
            return number_runs > 0;
          });

          runs(function(){
            expect(number_runs).toEqual(1);
          });
        });

      });

      var testing_failure = function(function_that_fails){
        it("should reattempt max_tries times", function(){
          var func_runs = 0;
          var failed = false;
          var max_tries = 3;

          runs(function(){
            subject.func(function(){ func_runs++; function_that_fails(); });
            subject.onFailure.add(function(){ failed = true; });
            subject.max_tries(max_tries);
            subject.interval(100);
            subject.timeout(500);

            subject.run();
          });

          waitsFor(function(){
            return failed;
          });

          runs(function(){
            expect(func_runs).toEqual(max_tries);
          });

        });

        it("should reattempt max_tries times, even if 'failure' is called multiple times", function(){
          var func_runs = 0;
          var failed = false;
          var max_tries = 3;

          runs(function(){
            subject.func(function(){ func_runs++; function_that_fails(); function_that_fails(); });
            subject.onFailure.add(function(){ failed = true; });
            subject.max_tries(max_tries);
            subject.interval(100);
            subject.timeout(500);

            subject.run();
          });

          waitsFor(function(){
            return failed;
          });

          runs(function(){
            expect(func_runs).toEqual(max_tries);
          });

        });

        it("should not run 'onSuccess' callbacks after subsequent calls to 'success'", function(){
          var failed = false;
          var success = false;
          var max_tries = 3;

          runs(function(){
            subject.func(function(){ function_that_fails(); });
            subject.onSuccess.add(function(){ success = true; });
            subject.onFailure.add(function(){ failed = true; });
            subject.max_tries(max_tries);
            subject.interval(100);
            subject.timeout(500);

            subject.run();
          });

          waitsFor(function(){
            return failed;
          });

          runs(function(){
            subject.success();

            expect( success ).toEqual( false );
          });
        });

        it("should wait the correct interval before attempting to run func again", function(){
          var func_run_times = [];
          var failed = false;
          var max_tries = 3;
          var interval = 300;

          runs(function(){
            subject.func(function(){ func_run_times = func_run_times.concat(new Date()); function_that_fails(); });
            subject.onFailure.add(function(){ failed = true; });
            subject.max_tries(max_tries);
            subject.fallback(Retry.Fallbacks.Constant);
            subject.interval(interval);
            subject.timeout(500);

            subject.run();
          });

          waitsFor(function(){
            return failed;
          });

          runs(function(){
            // Calculate the interval between run the func was run
            var differences = [];
            var last;
            for(var i in func_run_times){
              if(func_run_times.hasOwnProperty(i)){
                if(last){
                  differences = differences.concat(func_run_times[i] - last);
                }
                last = func_run_times[i];
              }
            }

            expect(differences.length).toEqual(max_tries - 1);

            for(var j in differences){
              if(differences.hasOwnProperty(j)){
                var diff = differences[j];
                expect(diff).toBeEqualOrGreaterThan(interval);
                expect(diff).toBeWithin(interval,10);
              }
            }
          });

        });
      };

      describe("when 'func' fails", function(){

        testing_failure(function(){ subject.failure(); });

      });

      describe("when 'func' throws an error", function(){

        testing_failure(function(){ throw "NASTY"; });

      });

      describe("when 'func' does not respond within timeout", function(){

        testing_failure(function(){ /* Does nothing */ });

      });

      describe("when 'fallback' throws an error", function(){

        it("should call 'onFailure' callbacks", function(){
          var fallback_run;
          var on_failure_run;

          runs(function(){
            subject.fallback(function(){ fallback_run = true; throw "tantrum"; } );
            subject.func(function(){ subject.failure(); });
            subject.onFailure.add(function(){ on_failure_run = true; });
            subject.max_tries(100);
            subject.run();
          });

          waitsFor(function(){
            return fallback_run;
          });

          runs(function(){
            expect(subject.attempt()).toEqual(1);
            expect(on_failure_run).toEqual(true);
          });
        });

      });

      describe("when 'fallback' does not return a positive number", function(){

        it("should call 'onFailure' callbacks", function(){
          var fallback_run;
          var on_failure_run;

          runs(function(){
            subject.fallback( function(){ fallback_run = true; return -1; } );
            subject.func(function(){ subject.failure(); });
            subject.onFailure.add(function(){ on_failure_run = true; });
            subject.max_tries(100);
            subject.run();
          });

          waitsFor(function(){
            return fallback_run;
          });

          runs(function(){
            expect(subject.attempt()).toEqual(1);
            expect(on_failure_run).toEqual(true);
          });
        });

      });

      describe("when 'func' initially fails, but then subsequently passes", function(){

        beforeEach(function(){
          subject.func(function(){

            // Reprogram self to succeed next time
            subject.func(function(){
              subject.success();
            });

            subject.failure();
          });

        });

        it("should run 'onSuccess' callbacks", function(){
          var success = false;

          runs(function(){
            subject.onSuccess.add(function(){ success = true; });

            subject.run();
          });

          waitsFor(function(){
            return success;
          });

          runs(function(){
            expect(success).toEqual(true);
          });
        });

        it("should not run 'onFailure' callbacks", function(){
          var success = false;
          var failure = false;

          runs(function(){
            subject.onSuccess.add(function(){ success = true; });
            subject.onFailure.add(function(){ failure = true; });

            subject.run();
          });

          waitsFor(function(){
            return success;
          });

          runs(function(){
            expect(failure).toEqual(false);
          });
        });

        it("should have 'attempt' set to 2", function(){
          var success = false;

          runs(function(){
            subject.onSuccess.add(function(){ success = true; });

            subject.run();
          });

          waitsFor(function(){
            return success;
          });

          runs(function(){
            expect(subject.attempt()).toEqual(2);
          });
        });

      });

      describe("when 'func' is successfull, but then fails later", function(){

        it("should rerun 'func' after the failure until it succeeds", function(){

          var success = 0;
          var failures = 0;
          var calls = 0;


          runs(function(){
            subject.func(function(){
              calls++;
              subject.success();
            });

            subject.onSuccess.add(function(){
              if( success === 0 ){
                setTimeout(function(){
                  subject.failure();
                }, 1000);
              }
              success++;
            });

            subject.onFailure.add(function(){
              failures++;
            });

            subject.run();
          });

          waitsFor(function(){
            return success >= 2;
          });

          runs(function(){
            // Function run twice, first time it works,
            // then later a failure occurs, causing func to be run for a
            // second time, but not the onFailure callbacks
            expect(calls).toEqual(2);
            expect(failures).toEqual(0);
            expect(success).toEqual(2);
          });

        });

      });

      describe("in general", function(){

        it("should set 'this' for 'func' to be the retry", function(){

          var scope;
          var success;

          runs(function(){
            subject.func(function(){
              scope = this;
              subject.success();
            });
            subject.onSuccess.add(function(){
              success = true;
            });

            subject.run();
          });

          waitsFor(function(){
            return success;
          });

          runs(function(){
            expect( scope ).toBe( subject );
          });

        });

        it("should set 'this' for 'fallback' to be the retry", function(){

          var scope;
          var failure;

          runs(function(){

            subject.max_tries(2);
            subject.func(function(){
              subject.failure();
            });
            subject.fallback(function(){
              scope = this;
              return 100;
            });
            subject.onFailure.add(function(){
              failure = true;
            });

            subject.run();
          });

          waitsFor(function(){
            return failure;
          });

          runs(function(){
            expect( scope ).toBe( subject );
          });

        });

      });

    });

    describe("'stop'", function(){

      it("should not trigger any calls to onSuccess if success is called", function(){

        var called_success = false;
        var on_success_called = false;

        subject.func(function(){
          setTimeout(function(){
            subject.success();
            called_success = true;
          }, 500);
        });

        subject.onSuccess.add(function(){
          on_success_called = true;
        });

        runs(function(){
          subject.run();
          subject.stop();
        });

        waitsFor(function(){
          return called_success;
        });

        runs(function(){
          expect(on_success_called).toEqual(false);
        });

      });

      it("should not trigger any calls to onfailure if failure is called", function(){

        var called_failure = false;
        var on_failure_called = false;

        subject.func(function(){
          setTimeout(function(){
            subject.failure();
            called_failure = true;
          }, 500);
        });

        subject.onFailure.add(function(){
          on_failure_called = true;
        });

        runs(function(){
          subject.run();
          subject.stop();
        });

        waitsFor(function(){
          return called_failure;
        });

        runs(function(){
          expect(on_failure_called).toEqual(false);
        });

      });

      it("should make sure the the timeout does not trigger onFailure", function(){
        var timed_out = false;

        subject.onFailure.add(function(){
          timed_out = true;
        });
        subject.timeout(500);
        subject.max_tries(1);
        subject.func(function(){ /* Timesout */ });

        runs(function(){
          subject.run();
          subject.stop();
        });

        waits(700);

        runs(function(){
          expect(timed_out).toEqual(false);
        });
      });

      it("should clear any retries", function(){
        var tries = 0;

        subject.interval(100);
        subject.max_tries(2);
        subject.func(function(){ tries++; subject.failure(); });

        runs(function(){
          subject.run();
          subject.stop();
        });

        waits(700);

        runs(function(){
          expect(tries).toEqual(1);
        });
      });

      it("should reset the attempt counter", function(){

        subject.max_tries(5);
        subject.interval(1000);
        subject.func(function(){ subject.failure(); });

        runs(function(){
          subject.run();
        });

        waitsFor(function(){
          return subject.attempt() == 3;
        });

        runs(function(){
          subject.stop();

          expect(subject.attempt()).toEqual(0);
        });

      });

    });

  });


});
