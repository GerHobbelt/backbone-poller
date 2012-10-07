describe("Triggering the right events", function(){
  Backbone.sync = function(method, model, options){
    options.success(model.toJSON());
  };

  beforeEach(function() {
    this.model = new Backbone.Model();
    this.collection = new Backbone.Collection();
    this.mPoller = PollingManager.getPoller(this.model, {delay: 50});
    this.cPoller = PollingManager.getPoller(this.collection, {delay: 50});
  });

  afterEach(function(){
    this.model.destroy();
    this.collection.reset();
    
    delete this.model;
    delete this.collection;

    PollingManager.reset();
  });

  it("Should fire a start event once", function() {
    var counter = 0,
        startSpy = sinon.spy(),
        fetchSpy = sinon.spy(this.collection, 'fetch');

    this.cPoller.on('start', startSpy);
    this.cPoller.on('start', function(){ counter += 1; });

    this.cPoller.start();

    waitsFor(function(){
      return startSpy.calledOnce;
    });

    expect(counter).toEqual(1);
    expect(this.cPoller.active()).toBe(true);


    waitsFor(function(){
      return fetchSpy.calledThrice;
    });

    runs(function () {
      expect(counter).toEqual(1);
      expect(this.cPoller.active()).toBe(true);
    });

  });

  it("Should fire a stop event", function() {
    var stopSpy = sinon.spy();
    this.cPoller.on('stop', stopSpy).start().stop();

    waitsFor(function(){
      return stopSpy.calledOnce;
    });

    runs(function () {
      expect(this.cPoller.active()).toBe(false);
    });

  });

  it("Should fire a fetch event before each fetch", function() {
    var pFetchSpy = sinon.spy();
    var mFetchSpy = sinon.spy(this.model, 'fetch');
    
    this.mPoller.on('fetch', pFetchSpy);
    this.mPoller.start();

    waitsFor(function(){
      return pFetchSpy.callCount === 1;
    });

    runs(function () {
      expect(pFetchSpy.calledBefore(mFetchSpy)).toEqual(true);
    });

  });

  it("Should fire a success event after each successfull fetch", function() {
    var spy = sinon.spy();
    
    this.mPoller.on('success', spy);
    this.mPoller.start();

    waitsFor(function(){
      return spy.callCount === 3;
    });

    runs(function () {
      expect(spy.callCount).toEqual(3);
    });

  });


  it("Should fire a complete event when condition is satisfied", function() {
     var bool = true,
         spy = sinon.spy();

    this.mPoller.set({ delay: 50, condition: function(model){ return bool; } });
    this.mPoller.on('complete', spy);
    this.mPoller.start();

    bool = false;
    waits(50);

    runs(function(){
      expect(this.mPoller.active()).toBe(false);
      expect(spy.calledOnce).toBe(true);
    });

  });

  it("Should fire an error event when fetch fails", function() {
      
    this.model.sync = function(method, model, options){
      options.error("ERROR");
    };

    var spy = sinon.spy();
    var poller = this.mPoller.on('error', spy);

    poller.start();

    waitsFor(function(){
      return spy.calledOnce;
    });

    runs(function(){
      expect(poller.active()).toBe(false);
    });

  });

});
