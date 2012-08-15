describe("Retry.Fallbacks", function(){

  var subject;
  var Retry = com.jivatechnology.Retry;

  describe("Constant", function(){

    beforeEach(function(){
      subject = Retry.Fallbacks.Constant;
    });

    it("should always return the interval", function(){
      scope = {
        interval: function(){return 123;}
      };

      var calc = function(){ return subject.call(scope); };

      expect( calc() ).toEqual( 123 );
      expect( calc() ).toEqual( 123 );
      expect( calc() ).toEqual( 123 );
    });

  });

  describe("Fibonacci", function(){

    beforeEach(function(){
      subject = Retry.Fallbacks.Fibonacci;
    });

    it("should always return the interval + the previous interval", function(){
      scope = {
        interval: function(){return 1;}
      };

      var calc = function(){ return subject.call(scope); };

      // Yes, yes I know this is not truly a fibonacci sequence, but it allows
      // the interval to be varied to change the starting position
      expect( calc() ).toEqual( 1 );
      expect( calc() ).toEqual( 2 );
      expect( calc() ).toEqual( 3 );
      expect( calc() ).toEqual( 5 );
      expect( calc() ).toEqual( 8 );
      expect( calc() ).toEqual( 13 );
      expect( calc() ).toEqual( 21 );
      expect( calc() ).toEqual( 34 );
    });

  });

});
