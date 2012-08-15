Retry [![Build status](https://secure.travis-ci.org/theozaurus/retry-js.png)](http://travis-ci.org/theozaurus/retry-js)
========

[Retry.js](http://github.com/theozaurus/retry-js) for when things don't go to
plan. This is a library that aims to make it easy to create asychronous retry
logic.

Usage
=====

In order to avoid any namespace conflicts `Retry` uses the public namespace
`com.jivatechnology` (reverse DNS scheme). You can import this into your local
scope with something like:

    var Retry = com.jivatechnology.Retry;

We can not start configuring it from the constructor:

    var retry = new Retry({
      timeout:   3000,                     // specified in ms, how long to wait for a success
      interval:  1000,                     // How long to wait between failures before retrying initially
      max_tries: 4,                        // How many times to attempt retrying before failing
      fallback:  Retry.Fallbacks.Constant, // The scheme to use for calculating the wait between retries

      func:      function(){},             // The function to retry

      onSuccess: function(){ console.info("Yay") },
      onFailure: function(){ console.warn("Nay") },
    })

To start attempting the function we can then do:

    retry.run();

It's possible to customise it once the object has been instantiated:

    var retry = new Retry({timeout: 400});
    retry.timeout();
    => 400
    retry.timeout(500);
    => 500

We can add arbitary callbacks for success or failure as well (see [callback-js](http://github.com/theozaurus/callback-js)):

    retry.onSuccess.add(function(){ console.info("Me too")});
    retry.onSuccess.add(function(){ console.info("and me!")});

The function to retry will be checked to make sure it doesn't

 - Timeout
 - Throw an error
 - Fail (it must call `retry.failure()` if it does)

If the function has succeeded it must call `retry.success()`.

For example:

    var retry = new Retry();
    retry.func( function(){
      if(Math.random() > 0.5){
        retry.success();
      } else {
        retry.failure();
      }
    });
    retry.onSuccess.add(function(){
      console.info("Done!");
    });

    retry.run() // Start attempting to run func

This is useful for situations where you have non blocking code that uses
callback when a result is returned (e.g. a jQuery AJAX request).

The fallback logic is totally customisable, and has `this` set to the retry
object. For example if we wanted a fallback mechanism that increases the
wait by interval for each attempt we could write:

    var retry = new Retry();
    retry.fallback(function(){
      return this.attempt() * this.interval();
    });

There are some standard fallback functions to get you started.

    - `Retry.Fallbacks.Constant`, will always return the interval.
    - `Retry.Fallbacks.Fibonacci`, will increase the interval in a similar way to a fibonacci sequence

Tests
=====

All of the tests are written in [Jasmine](http://pivotal.github.com/jasmine/).
[Sprockets](https://github.com/sstephenson/sprockets) is used to describe
dependencies between the files. To run the tests, you will first need to
install [Ruby](http://ruby-lang.org) and [Bundler](http://gembundler.com/).
Once you have this:

    $ bundle install
    $ bundle exec rake jasmine

Open your browser to [http://localhost:8888](http://localhost:8888)

If you want to run the tests directly in the console just type:

    $ bundle exec rake jasmine:ci
    /Users/theo/.rvm/rubies/ruby-1.9.3-p0/bin/ruby -S rspec spec/javascripts/support/jasmine_runner.rb --colour --format progress
    [2012-03-15 15:46:50] INFO  WEBrick 1.3.1
    [2012-03-15 15:46:50] INFO  ruby 1.9.3 (2011-10-30) [x86_64-darwin11.1.0]
    [2012-03-15 15:46:50] INFO  WEBrick::HTTPServer#start: pid=39919 port=63714
    Waiting for jasmine server on 63714...
    jasmine server started.
    Waiting for suite to finish in browser ...
    ..........................................

Or you can check the current status of master using [Travis](http://travis-ci.org/#!/theozaurus/retry-js)

Building
========

Provided you have all of the software installed to run the tests (see above).
You can build the code using:

    $ bundle exec rake build

This will create a copy of the code in the `build` folder. It will also package
up any external dependencies (such as [callback-js](http://github.com/theozaurus/callback-js)).
If you are already using `Sprockets` then it is best to copy the `src` folder
to your project and let that deal with the build dependencies (avoids
duplication).

Future
======

- Flap detection
- More fallback functions
