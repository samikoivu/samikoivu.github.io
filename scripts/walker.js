/* TODO:
*/   
var pl = planck, Vec2 = pl.Vec2, Rot = pl.Rot;
var _testbed = pl.testbed;
var world;

const UD_GROUND = 1;
const UD_BIKE = 2;
const UD_ME = 3;
const UD_ARROW = 4;
const UD_ZOMBIE = 5;
const UD_ZOMBIEHEAD = 6;

const BODY_HEIGHT = 1.4;
const densityFactor = .8;

var touchingGround = false;

var driver = null;

var canvas = document.getElementById('stage');

_testbed('Car', function(testbed) {
    testbed.speed = 1;
	testbed.hz = 50;
	testbed.ratio = 16
	testbed.scaleY = -1;
	testbed.scaleX = 1;

    world = new pl.World({
	  gravity : Vec2(0, -10)
	});
	
	createWalker();	
	//////////////////////////////////////////
	// GROUND AND OBSTACLES
	//////////////////////////////////////////
	var boxDef = { // def for all ground elements
		friction : 1,
		density: 0
	};

	// add the ground
	var ground = world.createBody(new Vec2(0, 0.5));
	ground.createFixture(pl.Box(500, 0.5), boxDef);
	ground.setUserData(UD_GROUND);
	// end stoppers
	ground.createFixture(pl.Box(1, 5, new Vec2(-500, 0.3), 0), boxDef);
	ground.createFixture(pl.Box(3, 2, new Vec2(500, 0.3), 0), boxDef);
	// first bits
	ground.createFixture(pl.Box(3, 0.5, new Vec2(3.5, 1), Math.PI / 8), boxDef);
	ground.createFixture(pl.Box(3, 0.5, new Vec2(10.5, 1), -Math.PI / 8), boxDef);
	ground.createFixture(pl.Box(2, 3, new Vec2(20, 0.3), 0), boxDef);
	ground.createFixture(pl.Box(2, 2, new Vec2(50, 0.3), 0), boxDef);
	ground.createFixture(pl.Box(5, 5, new Vec2(70, 0.3), Math.PI/4), boxDef);
	// more stuff
	ground.createFixture(pl.Box(3, 0.5, new Vec2(100 + 5, 1.5), Math.PI / 4), boxDef);
	ground.createFixture(pl.Box(3, 0.5, new Vec2(100 + 3.5, 1), Math.PI / 8), boxDef);
	ground.createFixture(pl.Box(3, 0.5, new Vec2(100 + 9, 1.5), -Math.PI / 4), boxDef);
	ground.createFixture(pl.Box(3, 0.5, new Vec2(100 + 10.5, 1), -Math.PI / 8), boxDef);
	// ramp and secondary level
	ground.createFixture(pl.Box(5, 0.5, new Vec2(200 + 25, 2), Math.PI / 8), boxDef);		
	ground.createFixture(pl.Box(15, 0.5, new Vec2(200 + 52, 8), 0), boxDef);
	// obstacles
	ground.createFixture(pl.Box(1, .25, new Vec2(300 + 15, .75), 0), boxDef);
	ground.createFixture(pl.Box(1, .25, new Vec2(300 + 20, .75), 0), boxDef);
	ground.createFixture(pl.Box(1, .25, new Vec2(300 + 22, 1.25), 0), boxDef);
	ground.createFixture(pl.Box(1, .25, new Vec2(300 + 24, 1.75), 0), boxDef);
	ground.createFixture(pl.Box(1, .25, new Vec2(300 + 28, .75), 0), boxDef);
	ground.createFixture(pl.Box(1, .25, new Vec2(300 + 30, 1.25), 0), boxDef);
	ground.createFixture(pl.Box(1, .25, new Vec2(300 + 32, 1.75), 0), boxDef);
	ground.createFixture(pl.Box(1, .25, new Vec2(300 + 34, 1.25), 0), boxDef);
	ground.createFixture(pl.Box(1, .25, new Vec2(300 + 36, .75), 0), boxDef);
	// bigger obstacles
	ground.createFixture(pl.Box(1, .4, new Vec2(340 + 15, .75), 0), boxDef);
	ground.createFixture(pl.Box(1, .4, new Vec2(340 + 20, .75), 0), boxDef);
	ground.createFixture(pl.Box(1, .4, new Vec2(340 + 22, 1.25), 0), boxDef);
	ground.createFixture(pl.Box(1, .4, new Vec2(340 + 24, 1.75), 0), boxDef);
	ground.createFixture(pl.Box(1, .4, new Vec2(340 + 28, .75), 0), boxDef);
	ground.createFixture(pl.Box(1, .4, new Vec2(340 + 30, 1.25), 0), boxDef);
	ground.createFixture(pl.Box(1, .4, new Vec2(340 + 32, 1.75), 0), boxDef);
	ground.createFixture(pl.Box(1, .4, new Vec2(340 + 34, 1.25), 0), boxDef);
	ground.createFixture(pl.Box(1, .4, new Vec2(340 + 36, .75), 0), boxDef);

	// ramp and secondary level
	ground.createFixture(pl.Box(10, 0.5, new Vec2(-200 + 25, 4), -Math.PI / 8), boxDef);		
	ground.createFixture(pl.Box(15, 0.5, new Vec2(-200, 8), 0), boxDef);
	ground.createFixture(pl.Box(15, 0.5, new Vec2(-250, 4), 0), boxDef);

    // Boxes
    var box = pl.Box(0.5, 0.5);
	for (var i = 0; i < 5; i++) {
		world.createDynamicBody(Vec2(-50, i)).createFixture(box, 0.5);
	}

	// Other (non-control) key handling
	testbed.keydown = function(code, char) {
		switch (char) {
		}
  	};

	testbed.step = function() {	
		var pos = driver.getPosition();
		var vel = driver.getLinearVelocity();
		testbed.x = pos.x + 0.15 * vel.x;
		testbed.y = -pos.y + 0.15 * vel.y;
		testbed.info('←/→: Balance bike, ↑/↓: Accelerate');
	}

	world.on('begin-contact', function(contact) { // can't modify the world here
		var fixtureA = contact.getFixtureA();
		var fixtureB = contact.getFixtureB();

		var bodyA = contact.getFixtureA().getBody();
		var bodyB = contact.getFixtureB().getBody();

		if (fixtureA == driverFixture /*&& bodyB.getUserData() != UD_GROUND*/) {
			touchingGround = true;
		}
		if (fixtureB == driverFixture /*&& bodyA.getUserData() != UD_GROUND*/) {
			touchingGround = true;
		}

	});

	world.on('end-contact', function(contact) { // can't modify the world here
		var fixtureA = contact.getFixtureA();
		var fixtureB = contact.getFixtureB();

		var bodyA = contact.getFixtureA().getBody();
		var bodyB = contact.getFixtureB().getBody();

		if (fixtureA == driverFixture /*&& bodyB.getUserData() != UD_GROUND*/) {
			touchingGround = false;
		}
		if (fixtureB == driverFixture /*&& bodyA.getUserData() != UD_GROUND*/) {
			touchingGround = false;
		}
	});
	world.on('post-solve', function(contact, impulse) {
		// Should the body break?
		var count = contact.getManifold().pointCount;	
		var maxImpulse = 0.0;
		for (var i = 0; i < count; ++i) {
		  maxImpulse = Math.max(maxImpulse, impulse.normalImpulses[i]);
		}
	
		if (maxImpulse > 40.0) {
			// something
		}
	  });
	


	return world;
});


function createWalker() {
	var dd = {
		position: Vec2(0, 2),
		type : 'dynamic',
		allowSleep: false
	};
	driver = world.createBody(dd);
	var driverDef = {
		friction: 0.5,
		density: 1 * densityFactor,
		restitution: 0.2
	};
	driverFixture = driver.createFixture(pl.Box(0.15, BODY_HEIGHT-.6, Vec2(0, 0), 0), driverDef);
	//driver.createFixture(pl.Box(0.15, .2, Vec2(0, .8), 0), driverDef);
	driverFixture.setUserData(UD_ME);
}
