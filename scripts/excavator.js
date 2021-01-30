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

var canvas = document.getElementById('stage');

_testbed('Excavator', function (testbed) {
	testbed.speed = 1;
	testbed.hz = 50;
	testbed.ratio = 16
	testbed.scaleY = -1;
	testbed.scaleX = 1;

	world = new pl.World({
		gravity: Vec2(0, -10)
	});

	createExcavator();
	//////////////////////////////////////////
	// GROUND AND OBSTACLES
	//////////////////////////////////////////
	var boxDef = { // def for all ground elements
		friction: 1,
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
	ground.createFixture(pl.Box(5, 5, new Vec2(70, 0.3), Math.PI / 4), boxDef);
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
	testbed.keydown = function (code, char) {
		switch (char) {
		}
	};

	testbed.step = function () {
		// var pos = driver.getPosition();
		// var vel = driver.getLinearVelocity();
		// testbed.x = pos.x + 0.15 * vel.x;
		// testbed.y = -pos.y + 0.15 * vel.y;
		testbed.info('←/→/↑/↓: Arm & Bucket A/D/W/S: Move & Turn');
	}

	world.on('begin-contact', function (contact) { // can't modify the world here
		var fixtureA = contact.getFixtureA();
		var fixtureB = contact.getFixtureB();

		var bodyA = contact.getFixtureA().getBody();
		var bodyB = contact.getFixtureB().getBody();

		// if (fixtureA == driverFixture /*&& bodyB.getUserData() != UD_GROUND*/) {
		// 	touchingGround = true;
		// }
		// if (fixtureB == driverFixture /*&& bodyA.getUserData() != UD_GROUND*/) {
		// 	touchingGround = true;
		// }

	});

	world.on('end-contact', function (contact) { // can't modify the world here
		var fixtureA = contact.getFixtureA();
		var fixtureB = contact.getFixtureB();

		var bodyA = contact.getFixtureA().getBody();
		var bodyB = contact.getFixtureB().getBody();

		// if (fixtureA == driverFixture /*&& bodyB.getUserData() != UD_GROUND*/) {
		// 	touchingGround = false;
		// }
		// if (fixtureB == driverFixture /*&& bodyA.getUserData() != UD_GROUND*/) {
		// 	touchingGround = false;
		// }
	});
	world.on('post-solve', function (contact, impulse) {
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


function createExcavator() {
	var dd = {
		position: Vec2(0, 2),
		type: 'dynamic',
		allowSleep: false
	};
	var driver = world.createBody(dd);
	var driverDef = {
		friction: 0.5,
		density: 1,
		restitution: 0.2
	};
	var xoffset = 0;
	var yoffset = 0;
	var scale = 6;
	//driverFixture = driver.createFixture(pl.Box(0.15, BODY_HEIGHT-.6, Vec2(0, 0), 0), driverDef);

	// cabin
	driver.createFixture(pl.Polygon([
		Vec2(xoffset + scale * -0.21084936, yoffset + scale * 0.85631084),
		Vec2(xoffset + scale * 0.3178882, yoffset + scale * 0.85631084),
		Vec2(xoffset + scale * 0.3178882, yoffset + scale * 1.1206796),
		Vec2(xoffset + scale * -0.21084936, yoffset + scale * 1.1206796),
	]), 1.0, driverDef);
	// driver.createFixture(pl.Polygon([
	// 	Vec2(xoffset + scale * -0.21084936, yoffset + scale * 0.85631084),
	// 	Vec2(xoffset + scale * 0.3178882, yoffset + scale * 1.1206796),
	// 	Vec2(xoffset + scale * -0.21084936, yoffset + scale * 1.1206796),
	// ]), 1.0, driverDef);

	// body 1 front
	driver.createFixture(pl.Polygon([
		Vec2(xoffset + scale * -0.21084936, yoffset + scale * 0.5919421),
		Vec2(xoffset + scale * 0.3178882, yoffset + scale * 0.5919421),
		Vec2(xoffset + scale * 0.3178882, yoffset + scale * 0.85631084),
		Vec2(xoffset + scale * -0.21084936, yoffset + scale * 0.85631084),
	]), 1.0, driverDef);
	// driver.createFixture(pl.Polygon([
	// 	Vec2(xoffset + scale * -0.21084936, yoffset + scale * 0.5919421),
	// 	Vec2(xoffset + scale * 0.3178882, yoffset + scale * 0.85631084),
	// 	Vec2(xoffset + scale * -0.21084936, yoffset + scale * 0.85631084),
	// ]), 1.0, driverDef);

	// body 2 tail
	driver.createFixture(pl.Polygon([
		Vec2(xoffset + scale * 0.9333616, yoffset + scale * 0.85631084),
		Vec2(xoffset + scale * 0.9333616, yoffset + scale * 0.5919421),
		Vec2(xoffset + scale * 1.1028397, yoffset + scale * 0.5919421),
	]), 1.0, driverDef);
	driver.createFixture(pl.Polygon([
		Vec2(xoffset + scale * 0.9333616, yoffset + scale * 0.85631084),
		Vec2(xoffset + scale * 1.1028397, yoffset + scale * 0.5919421),
		Vec2(xoffset + scale * 1.1028397, yoffset + scale * 0.85631084),
	]), 1.0, driverDef);

	// body 3 mid
	driver.createFixture(pl.Polygon([
		Vec2(xoffset + scale * 0.3178882, yoffset + scale * 0.85631084),
		Vec2(xoffset + scale * 0.3178882, yoffset + scale * 0.5919421),
		Vec2(xoffset + scale * 0.5498057, yoffset + scale * 0.5919421),
	]), 1.0, driverDef);
	driver.createFixture(pl.Polygon([
		Vec2(xoffset + scale * 0.3178882, yoffset + scale * 0.85631084),
		Vec2(xoffset + scale * 0.5498057, yoffset + scale * 0.5919421),
		Vec2(xoffset + scale * 0.5498057, yoffset + scale * 0.85631084),
	]), 1.0, driverDef);

	// body 4 back
	driver.createFixture(pl.Polygon([
		Vec2(xoffset + scale * 0.5498057, yoffset + scale * 0.85631084),
		Vec2(xoffset + scale * 0.5498057, yoffset + scale * 0.5919421),
		Vec2(xoffset + scale * 0.9333616, yoffset + scale * 0.5919421),
	]), 1.0, driverDef);
	driver.createFixture(pl.Polygon([
		Vec2(xoffset + scale * 0.5498057, yoffset + scale * 0.85631084),
		Vec2(xoffset + scale * 0.9333616, yoffset + scale * 0.5919421),
		Vec2(xoffset + scale * 0.9333616, yoffset + scale * 0.85631084),
	]), 1.0, driverDef);

	// body 5 exhaust motor
	driver.createFixture(pl.Polygon([
		Vec2(xoffset + scale * 0.5498057, yoffset + scale * 0.85631084),
		Vec2(xoffset + scale * 0.9333616, yoffset + scale * 0.85631084),
		Vec2(xoffset + scale * 0.9333616, yoffset + scale * 0.9678097),
	]), 1.0, driverDef);
	driver.createFixture(pl.Polygon([
		Vec2(xoffset + scale * 0.5498057, yoffset + scale * 0.85631084),
		Vec2(xoffset + scale * 0.9333616, yoffset + scale * 0.9678097),
		Vec2(xoffset + scale * 0.5498057, yoffset + scale * 0.9678097),
	]), 1.0, driverDef);

	// chains
	driver.createFixture(pl.Polygon([
		Vec2(xoffset + scale * -0.5073295, yoffset + scale * 0.25572217),
		Vec2(xoffset + scale * 0.908725, yoffset + scale * 0.25572217),
		Vec2(xoffset + scale * 0.908725, yoffset + scale * 0.5024697),
	]), 1.0, driverDef);
	driver.createFixture(pl.Polygon([
		Vec2(xoffset + scale * -0.5073295, yoffset + scale * 0.25572217),
		Vec2(xoffset + scale * 0.908725, yoffset + scale * 0.5024697),
		Vec2(xoffset + scale * -0.5073295, yoffset + scale * 0.5024697),
	]), 1.0, driverDef);

	// big arm 1 top
	driver.createFixture(pl.Polygon([
		Vec2(xoffset + scale * -0.70036227, yoffset + scale * 0.92752016),
		Vec2(xoffset + scale * -1.6681718, yoffset + scale * 0.57964385),
		Vec2(xoffset + scale * -1.7261512, yoffset + scale * 0.655463),
	]), 1.0, driverDef);
	driver.createFixture(pl.Polygon([
		Vec2(xoffset + scale * -1.7261512, yoffset + scale * 0.655463),
		Vec2(xoffset + scale * -0.68698245, yoffset + scale * 1.1817374),
		Vec2(xoffset + scale * -0.48182464, yoffset + scale * 1.1817374),
	]), 1.0, driverDef);

	// big arm 2 root
	driver.createFixture(pl.Polygon([
		Vec2(xoffset + scale * -0.48182464, yoffset + scale * 1.1817374),
		Vec2(xoffset + scale * 0.11134894, yoffset + scale * 0.8918405),
		Vec2(xoffset + scale * 0.11580889, yoffset + scale * 0.79372156),
	]), 1.0, driverDef);
	driver.createFixture(pl.Polygon([
		Vec2(xoffset + scale * -0.48182464, yoffset + scale * 1.1817374),
		Vec2(xoffset + scale * 0.11580889, yoffset + scale * 0.79372156),
		Vec2(xoffset + scale * -0.27220687, yoffset + scale * 0.8918405),
	]), 1.0, driverDef);

	// big arm 3 mid
	driver.createFixture(pl.Polygon([
		Vec2(xoffset + scale * -0.70036227, yoffset + scale * 0.92752016),
		Vec2(xoffset + scale * -1.7261512, yoffset + scale * 0.655463),
		Vec2(xoffset + scale * -0.48182464, yoffset + scale * 1.1817374),
	]), 1.0, driverDef);
	driver.createFixture(pl.Polygon([
		Vec2(xoffset + scale * -0.70036227, yoffset + scale * 0.92752016),
		Vec2(xoffset + scale * -0.48182464, yoffset + scale * 1.1817374),
		Vec2(xoffset + scale * -0.27220687, yoffset + scale * 0.8918405),
	]), 1.0, driverDef);

	// small arm 1 bottom
	driver.createFixture(pl.Polygon([
		Vec2(xoffset + scale * -2.002668, yoffset + scale * 0.58856374),
		Vec2(xoffset + scale * -1.7885904, yoffset + scale * 0.42800546),
		Vec2(xoffset + scale * -0.8207809, yoffset + scale * 0.31650668),
	]), 1.0, driverDef);
	driver.createFixture(pl.Polygon([
		Vec2(xoffset + scale * -0.8207809, yoffset + scale * 0.31650668),
		Vec2(xoffset + scale * -0.84308064, yoffset + scale * 0.3878659),
		Vec2(xoffset + scale * -1.6904715, yoffset + scale * 0.6688429),
	]), 1.0, driverDef);

	// small arm 2 top
	driver.createFixture(pl.Polygon([
		Vec2(xoffset + scale * -0.8207809, yoffset + scale * 0.31650668),
		Vec2(xoffset + scale * -1.6904715, yoffset + scale * 0.6688429),
		Vec2(xoffset + scale * -2.002668, yoffset + scale * 0.58856374),
	]), 1.0, driverDef);
	driver.createFixture(pl.Polygon([
		Vec2(xoffset + scale * -0.6792845, yoffset + scale * 1.0767076),
		Vec2(xoffset + scale * -0.6592845, yoffset + scale * 1.0767076),
		Vec2(xoffset + scale * -0.6592845, yoffset + scale * 1.0967076),
	]), 1.0, driverDef);

	// bucket TODO remove lid and create a thumb
	driver.createFixture(pl.Polygon([
		Vec2(xoffset + scale * -1.101758, yoffset + scale * 0.72236234),
		Vec2(xoffset + scale * -0.91444, yoffset + scale * 0.72236234),
		Vec2(xoffset + scale * -0.731582, yoffset + scale * 0.6866827),
	]), 1.0, driverDef);
	driver.createFixture(pl.Polygon([
		Vec2(xoffset + scale * -0.731582, yoffset + scale * 0.6866827),
		Vec2(xoffset + scale * -0.633463, yoffset + scale * 0.6197834),
		Vec2(xoffset + scale * -0.63792294, yoffset + scale * 0.5216645),
	]), 1.0, driverDef);
	driver.createFixture(pl.Polygon([
		Vec2(xoffset + scale * -0.63792294, yoffset + scale * 0.5216645),
		Vec2(xoffset + scale * -0.6736026, yoffset + scale * 0.44138533),
		Vec2(xoffset + scale * -0.7360419, yoffset + scale * 0.37448603),
	]), 1.0, driverDef);
	driver.createFixture(pl.Polygon([
		Vec2(xoffset + scale * -0.7360419, yoffset + scale * 0.37448603),
		Vec2(xoffset + scale * -0.820781, yoffset + scale * 0.31650668),
		Vec2(xoffset + scale * -1.101758, yoffset + scale * 0.72236234),
	]), 1.0, driverDef);
	driver.createFixture(pl.Polygon([
		Vec2(xoffset + scale * -1.101758, yoffset + scale * 0.72236234),
		Vec2(xoffset + scale * -0.731582, yoffset + scale * 0.6866827),
		Vec2(xoffset + scale * -0.63792294, yoffset + scale * 0.5216645),
	]), 1.0, driverDef);
	driver.createFixture(pl.Polygon([
		Vec2(xoffset + scale * -0.63792294, yoffset + scale * 0.5216645),
		Vec2(xoffset + scale * -0.7360419, yoffset + scale * 0.37448603),
		Vec2(xoffset + scale * -1.101758, yoffset + scale * 0.72236234),
	]), 1.0, driverDef);


	// markers for joints and pistons
	// 	driver.createFixture(pl.Polygon([
	// 	Vec2(xoffset + scale * -0.6792845, yoffset + scale * 1.0767076),
	// 	Vec2(xoffset + scale * -0.6592845, yoffset + scale * 1.0967076),
	// 	Vec2(xoffset + scale * -0.6792845, yoffset + scale * 1.0967076),
	// ]), 1.0, driverDef);
	// driver.createFixture(pl.Polygon([
	// 	Vec2(xoffset + scale * 0.20819847, yoffset + scale * 0.7798599),
	// 	Vec2(xoffset + scale * 0.22819851, yoffset + scale * 0.7798599),
	// 	Vec2(xoffset + scale * 0.22819851, yoffset + scale * 0.7998599),
	// ]), 1.0, driverDef);
	// driver.createFixture(pl.Polygon([
	// 	Vec2(xoffset + scale * 0.20819847, yoffset + scale * 0.7798599),
	// 	Vec2(xoffset + scale * 0.22819851, yoffset + scale * 0.7998599),
	// 	Vec2(xoffset + scale * 0.20819847, yoffset + scale * 0.7998599),
	// ]), 1.0, driverDef);
	// driver.createFixture(pl.Polygon([
	// 	Vec2(xoffset + scale * -0.11925213, yoffset + scale * 0.642147),
	// 	Vec2(xoffset + scale * -0.09925209, yoffset + scale * 0.642147),
	// 	Vec2(xoffset + scale * -0.09925209, yoffset + scale * 0.662147),
	// ]), 1.0, driverDef);
	// driver.createFixture(pl.Polygon([
	// 	Vec2(xoffset + scale * -0.11925213, yoffset + scale * 0.642147),
	// 	Vec2(xoffset + scale * -0.09925209, yoffset + scale * 0.662147),
	// 	Vec2(xoffset + scale * -0.11925213, yoffset + scale * 0.662147),
	// ]), 1.0, driverDef);
	// driver.createFixture(pl.Polygon([
	// 	Vec2(xoffset + scale * -1.6922393, yoffset + scale * 0.6176647),
	// 	Vec2(xoffset + scale * -1.6722392, yoffset + scale * 0.6176647),
	// 	Vec2(xoffset + scale * -1.6722392, yoffset + scale * 0.6376647),
	// ]), 1.0, driverDef);
	// driver.createFixture(pl.Polygon([
	// 	Vec2(xoffset + scale * -1.6922393, yoffset + scale * 0.6176647),
	// 	Vec2(xoffset + scale * -1.6722392, yoffset + scale * 0.6376647),
	// 	Vec2(xoffset + scale * -1.6922393, yoffset + scale * 0.6376647),
	// ]), 1.0, driverDef);
	// driver.createFixture(pl.Polygon([
	// 	Vec2(xoffset + scale * -1.9860266, yoffset + scale * 0.5870618),
	// 	Vec2(xoffset + scale * -1.9660267, yoffset + scale * 0.5870618),
	// 	Vec2(xoffset + scale * -1.9660267, yoffset + scale * 0.6070618),
	// ]), 1.0, driverDef);
	// driver.createFixture(pl.Polygon([
	// 	Vec2(xoffset + scale * -1.9860266, yoffset + scale * 0.5870618),
	// 	Vec2(xoffset + scale * -1.9660267, yoffset + scale * 0.6070618),
	// 	Vec2(xoffset + scale * -1.9860266, yoffset + scale * 0.6070618),
	// ]), 1.0, driverDef);
	// driver.createFixture(pl.Polygon([
	// 	Vec2(xoffset + scale * -0.8384193, yoffset + scale * 0.33917862),
	// 	Vec2(xoffset + scale * -0.81841934, yoffset + scale * 0.33917862),
	// 	Vec2(xoffset + scale * -0.81841934, yoffset + scale * 0.35917866),
	// ]), 1.0, driverDef);
	// driver.createFixture(pl.Polygon([
	// 	Vec2(xoffset + scale * -0.8384193, yoffset + scale * 0.33917862),
	// 	Vec2(xoffset + scale * -0.81841934, yoffset + scale * 0.35917866),
	// 	Vec2(xoffset + scale * -0.8384193, yoffset + scale * 0.35917866),
	// ]), 1.0, driverDef);
	// driver.createFixture(pl.Polygon([
	// 	Vec2(xoffset + scale * -1.6555158, yoffset + scale * 0.37284178),
	// 	Vec2(xoffset + scale * -1.6355158, yoffset + scale * 0.37284178),
	// 	Vec2(xoffset + scale * -1.6355158, yoffset + scale * 0.3928418),
	// ]), 1.0, driverDef);
	// driver.createFixture(pl.Polygon([
	// 	Vec2(xoffset + scale * -1.6555158, yoffset + scale * 0.37284178),
	// 	Vec2(xoffset + scale * -1.6355158, yoffset + scale * 0.3928418),
	// 	Vec2(xoffset + scale * -1.6555158, yoffset + scale * 0.3928418),
	// ]), 1.0, driverDef);
	// driver.createFixture(pl.Polygon([
	// 	Vec2(xoffset + scale * -0.80781645, yoffset + scale * 0.25043035),
	// 	Vec2(xoffset + scale * -0.78781646, yoffset + scale * 0.25043035),
	// 	Vec2(xoffset + scale * -0.78781646, yoffset + scale * 0.27043033),
	// ]), 1.0, driverDef);
	// driver.createFixture(pl.Polygon([
	// 	Vec2(xoffset + scale * -0.80781645, yoffset + scale * 0.25043035),
	// 	Vec2(xoffset + scale * -0.78781646, yoffset + scale * 0.27043033),
	// 	Vec2(xoffset + scale * -0.80781645, yoffset + scale * 0.27043033),
	// ]), 1.0, driverDef);
	// driver.createFixture(pl.Polygon([
	// 	Vec2(xoffset + scale * -0.9057456, yoffset + scale * 1.1256721),
	// 	Vec2(xoffset + scale * -0.88574564, yoffset + scale * 1.1256721),
	// 	Vec2(xoffset + scale * -0.88574564, yoffset + scale * 1.1456721),
	// ]), 1.0, driverDef);
	// driver.createFixture(pl.Polygon([
	// 	Vec2(xoffset + scale * -0.9057456, yoffset + scale * 1.1256721),
	// 	Vec2(xoffset + scale * -0.88574564, yoffset + scale * 1.1456721),
	// 	Vec2(xoffset + scale * -0.9057456, yoffset + scale * 1.1456721),
	// ]), 1.0, driverDef);
	// driver.createFixture(pl.Polygon([
	// 	Vec2(xoffset + scale * -1.4994413, yoffset + scale * 0.8380052),
	// 	Vec2(xoffset + scale * -1.4794413, yoffset + scale * 0.8380052),
	// 	Vec2(xoffset + scale * -1.4794413, yoffset + scale * 0.8580053),
	// ]), 1.0, driverDef);
	// driver.createFixture(pl.Polygon([
	// 	Vec2(xoffset + scale * -1.4994413, yoffset + scale * 0.8380052),
	// 	Vec2(xoffset + scale * -1.4794413, yoffset + scale * 0.8580053),
	// 	Vec2(xoffset + scale * -1.4994413, yoffset + scale * 0.8580053),
	// ]), 1.0, driverDef);
	// driver.createFixture(pl.Polygon([
	// 	Vec2(xoffset + scale * -0.43752187, yoffset + scale * 0.8869698),
	// 	Vec2(xoffset + scale * -0.4175219, yoffset + scale * 0.8869698),
	// 	Vec2(xoffset + scale * -0.4175219, yoffset + scale * 0.90696985),
	// ]), 1.0, driverDef);
	// driver.createFixture(pl.Polygon([
	// 	Vec2(xoffset + scale * -0.43752187, yoffset + scale * 0.8869698),
	// 	Vec2(xoffset + scale * -0.4175219, yoffset + scale * 0.90696985),
	// 	Vec2(xoffset + scale * -0.43752187, yoffset + scale * 0.90696985),
	// ]), 1.0, driverDef);
	// driver.createFixture(pl.Polygon([
	// 	Vec2(xoffset + scale * -0.96083075, yoffset + scale * 0.36366087),
	// 	Vec2(xoffset + scale * -0.9408308, yoffset + scale * 0.36366087),
	// 	Vec2(xoffset + scale * -0.9408308, yoffset + scale * 0.3836609),
	// ]), 1.0, driverDef);
	// driver.createFixture(pl.Polygon([
	// 	Vec2(xoffset + scale * -0.96083075, yoffset + scale * 0.36366087),
	// 	Vec2(xoffset + scale * -0.9408308, yoffset + scale * 0.3836609),
	// 	Vec2(xoffset + scale * -0.96083075, yoffset + scale * 0.3836609),
	// ]), 1.0, driverDef);
	// driver.createFixture(pl.Polygon([
	// 	Vec2(xoffset + scale * -0.7028486, yoffset + scale * 0.39273357),
	// 	Vec2(xoffset + scale * -0.6828487, yoffset + scale * 0.39273357),
	// 	Vec2(xoffset + scale * -0.6828487, yoffset + scale * 0.4127336),
	// ]), 1.0, driverDef);
	// driver.createFixture(pl.Polygon([
	// 	Vec2(xoffset + scale * -0.7028486, yoffset + scale * 0.39273357),
	// 	Vec2(xoffset + scale * -0.6828487, yoffset + scale * 0.4127336),
	// 	Vec2(xoffset + scale * -0.7028486, yoffset + scale * 0.4127336),
	// ]), 1.0, driverDef);
	// driver.createFixture(pl.Polygon([
	// 	Vec2(xoffset + scale * -1.1863738, yoffset + scale * 0.30092502),
	// 	Vec2(xoffset + scale * -1.166374, yoffset + scale * 0.30092502),
	// 	Vec2(xoffset + scale * -1.166374, yoffset + scale * 0.32092506),
	// ]), 1.0, driverDef);
	// driver.createFixture(pl.Polygon([
	// 	Vec2(xoffset + scale * -1.1863738, yoffset + scale * 0.30092502),
	// 	Vec2(xoffset + scale * -1.166374, yoffset + scale * 0.32092506),
	// 	Vec2(xoffset + scale * -1.1863738, yoffset + scale * 0.32092506),
	// ]), 1.0, driverDef);


}
