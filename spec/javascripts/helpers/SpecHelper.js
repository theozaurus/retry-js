beforeEach(function() {
  this.addMatchers({
    toBeInstanceOf: function(expected) {
      return this.actual instanceof expected;
    },
    toBeEqualOrGreaterThan: function(expected) {
      return this.actual >= expected;
    },
    toBeWithin: function(expected, range) {
      return this.actual > (expected - range) || this.actual < (expected + range);
    }
  });
});
