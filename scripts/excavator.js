/* TODO:
*Movement

*Turning

*Limits

*Adjust
 Speeds
 Torques
 Weights

*Bucket lid

*Bucket thumb
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

var body;
var boomJoint;
var armJoint;
var bucketJoint;
var chains;
var speed = 0;

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
		ground.createFixture(pl.Box(5, 5, new Vec2(70, 0.3), Math.PI/4), boxDef);
		// more stuff
		ground.createFixture(pl.Box(3, 0.5, new Vec2(100 + 5, 1.5), Math.PI / 4), boxDef);
		ground.createFixture(pl.Box(3, 0.5, new Vec2(100 + 3.5, 1), Math.PI / 8), boxDef);
		ground.createFixture(pl.Box(3, 0.5, new Vec2(100 + 9, 1.5), -Math.PI / 4), boxDef);
		ground.createFixture(pl.Box(3, 0.5, new Vec2(100 + 10.5, 1), -Math.PI / 8), boxDef);
		  
	    // Boxes
		var box = pl.Box(0.5, 0.5);
		for (var i = 0; i < 5; i++) {
			world.createDynamicBody(Vec2(-20, i+1)).createFixture(box, 0.5);
		}
	

	// Other (non-control) key handling
	testbed.keydown = function (code, char) {
		switch (char) {
		}
	};

	testbed.step = function () {
		if (testbed.activeKeys['I']) { // boom down
			boomJoint.setMotorSpeed(1);
			boomJoint.setMaxMotorTorque(12000);
		} else if (testbed.activeKeys['K']) { // boom up
			boomJoint.setMotorSpeed(-1);
			boomJoint.setMaxMotorTorque(12000);
		} else { // motor to maintain boom position
			boomJoint.setMotorSpeed(0);
			boomJoint.setMaxMotorTorque(6000);
		}

		if (testbed.activeKeys['W']) { // arm down
			armJoint.setMotorSpeed(1);
			armJoint.setMaxMotorTorque(200);
		} else if (testbed.activeKeys['S']) { // arm up
			armJoint.setMotorSpeed(-1);
			armJoint.setMaxMotorTorque(2000);
		} else { // motor to maintain arm position
			armJoint.setMotorSpeed(0);
			armJoint.setMaxMotorTorque(2000);
		}

		if (testbed.activeKeys['J']) { // bucket dump
			bucketJoint.setMotorSpeed(1);
			bucketJoint.setMaxMotorTorque(800);
		} else if (testbed.activeKeys['L']) { // bucket curl
			bucketJoint.setMotorSpeed(-1);
			bucketJoint.setMaxMotorTorque(800);
		} else { // motor to maintain boom position
			bucketJoint.setMotorSpeed(0);
			bucketJoint.setMaxMotorTorque(1000);
		}

		if (testbed.activeKeys['A']) { // swing left
		} else if (testbed.activeKeys['D']) { // swing right
		}

		if (testbed.activeKeys['R']) { // drive left
			speed = -5;
		} else if (testbed.activeKeys['F']) { // drive right
			speed = 5;
		} else {
			speed = 0;
		}



		var pos = body.getPosition();
		var vel = body.getLinearVelocity();
		testbed.x = pos.x + 0.15 * vel.x;
		testbed.y = -pos.y + 0.15 * vel.y;
		testbed.info('R/F: drive A/D: swing arm J/L: bucket W/S: arm I/K: boom');
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
	world.on('pre-solve', function(contact, oldManifold) {
			var fixtureA = contact.getFixtureA();
			var fixtureB = contact.getFixtureB();
		
			if (fixtureA == chains) {
			contact.setTangentSpeed(speed);
			}
		
			if (fixtureB == chains) {
			contact.setTangentSpeed(-speed);
			}
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
	var bd = {
		position: Vec2(0, 0),
		type: 'dynamic',
		allowSleep: false
	};
	var boomd = {
		position: Vec2(0, 0),
		type: 'dynamic',
		allowSleep: false
	};
	var bodyFixDef = {
		friction: 0.5,
		density: 3,
		restitution: 0.2
	};
	var boomFixDef = {
		friction: 0.5,
		density: .05,
		restitution: 0.2
	};
	var xoffset = 0;
	var yoffset = 0;
	var scale = 10;

	body = world.createBody(bd);

	// cabin
	body.createFixture(pl.Box((0.21084936+0.3178882)*scale/2, (1.1206796-0.5919421)*scale/2, Vec2(scale*(0.3178882-0.21084936)/2, scale*(1.1206796+0.5919421)/2), 0), bodyFixDef);

	body.createFixture(pl.Box((1.1028397-0.3178882)*scale/2, (0.85631084-0.5919421)*scale/2, Vec2(scale*(0.3178882+1.1028397)/2, scale*(0.85631084+0.5919421)/2), 0), bodyFixDef);

	// body 5 exhaust motor
	body.createFixture(pl.Box((0.9333616-0.5498057)*scale/2, (0.9678097-0.85631084)*scale/2, Vec2(scale*(0.9333616+0.5498057)/2, scale*(0.9678097+0.85631084)/2), 0), bodyFixDef);

	// chains
	chains = body.createFixture(pl.Box((0.908725+0.5073295)*scale/2, (0.5024697-0.25572217)*scale/2, Vec2(scale*(0.908725-0.5073295)/2, scale*(0.5024697+0.25572217)/2), 0), bodyFixDef);

	// big arm
	var boom = world.createBody(boomd); // TODO different def as it's less wide so change density?
	boom.createFixture(pl.Polygon([
		Vec2(xoffset + scale * -0.70036227, yoffset + scale * 0.92752016),
		Vec2(xoffset + scale * -1.6681718, yoffset + scale * 0.57964385),
		Vec2(xoffset + scale * -1.7261512, yoffset + scale * 0.655463),
		Vec2(xoffset + scale * -0.68698245, yoffset + scale * 1.1817374),
	]), 1.0, boomFixDef);
	boom.createFixture(pl.Polygon([
		Vec2(xoffset + scale * 0.11134894, yoffset + scale * 0.8918405),
		Vec2(xoffset + scale * 0.11580889, yoffset + scale * 0.79372156),
		Vec2(xoffset + scale * -0.27220687, yoffset + scale * 0.8918405),
		Vec2(xoffset + scale * -0.48182464, yoffset + scale * 1.1817374),
	]), 1.0, boomFixDef);
	boom.createFixture(pl.Polygon([
		Vec2(xoffset + scale * -0.70036227, yoffset + scale * 0.92752016),
		Vec2(xoffset + scale * -0.68698245, yoffset + scale * 1.1817374),
		Vec2(xoffset + scale * -0.27220687, yoffset + scale * 0.8918405),
		Vec2(xoffset + scale * -0.48182464, yoffset + scale * 1.1817374),
	]), 1.0, boomFixDef);

	boomJoint = world.createJoint(pl.RevoluteJoint({
		motorSpeed: 0,
		maxMotorTorque: 1.0,
		enableMotor: true,
		enableLimit: true,
		lowerAngle: -1,
		upperAngle: .45
	  }, body, boom, Vec2(scale * 0.21819851, scale * 0.7898599)));
	
	// small arm
	var arm = world.createBody(boomd); // TODO different def as it's less wide so change density?
	arm.createFixture(pl.Polygon([
		Vec2(xoffset + scale * -0.8207809, yoffset + scale * 0.31650668),
		Vec2(xoffset + scale * -1.6904715, yoffset + scale * 0.6688429),
		Vec2(xoffset + scale * -2.002668, yoffset + scale * 0.58856374),
		Vec2(xoffset + scale * -1.7885904, yoffset + scale * 0.42800546),
		Vec2(xoffset + scale * -0.84308064, yoffset + scale * 0.3878659),
	]), 1.0, boomFixDef);

	armJoint = world.createJoint(pl.RevoluteJoint({
		motorSpeed: 0,
		maxMotorTorque: 1.0,
		enableMotor: true,
		enableLimit: true,
		lowerAngle: -2.4,
		upperAngle: .45
	  }, boom, arm, Vec2(scale * -1.6822392, scale * 0.6276647)));


	// bucket TODO remove lid and create a thumb, maybe have to create this as edges rather than a polygon
	var bucket = world.createBody(boomd);
	// bucket.createFixture(pl.Edge(Vec2(xoffset + scale * -1.101758, yoffset + scale * 0.72236234), Vec2(xoffset + scale * -0.91444, yoffset + scale * 0.72236234)), boomFixDef);
	// bucket.createFixture(pl.Edge(Vec2(xoffset + scale * -0.91444, yoffset + scale * 0.72236234), Vec2(xoffset + scale * -0.731582, yoffset + scale * 0.6866827)), boomFixDef);
	// bucket.createFixture(pl.Edge(Vec2(xoffset + scale * -0.731582, yoffset + scale * 0.6866827), Vec2(xoffset + scale * -0.633463, yoffset + scale * 0.6197834)), boomFixDef);
	// bucket.createFixture(pl.Edge(Vec2(xoffset + scale * -0.633463, yoffset + scale * 0.6197834), Vec2(xoffset + scale * -0.63792294, yoffset + scale * 0.5216645)), boomFixDef);
	// bucket.createFixture(pl.Edge(Vec2(xoffset + scale * -0.63792294, yoffset + scale * 0.5216645), Vec2(xoffset + scale * -0.6736026, yoffset + scale * 0.44138533)), boomFixDef);
	// bucket.createFixture(pl.Edge(Vec2(xoffset + scale * -0.6736026, yoffset + scale * 0.44138533), Vec2(xoffset + scale * -0.7360419, yoffset + scale * 0.37448603)), boomFixDef);
	// bucket.createFixture(pl.Edge(Vec2(xoffset + scale * -0.7360419, yoffset + scale * 0.37448603), Vec2(xoffset + scale * -0.820781, yoffset + scale * 0.31650668)), boomFixDef);

	bucket.createFixture(pl.Polygon([
		Vec2(xoffset + scale * -1.101758, yoffset + scale * 0.72236234),
		Vec2(xoffset + scale * -0.91444, yoffset + scale * 0.72236234),
		Vec2(xoffset + scale * -0.731582, yoffset + scale * 0.6866827),
		Vec2(xoffset + scale * -0.633463, yoffset + scale * 0.6197834),
		Vec2(xoffset + scale * -0.63792294, yoffset + scale * 0.5216645),
		Vec2(xoffset + scale * -0.6736026, yoffset + scale * 0.44138533),
		Vec2(xoffset + scale * -0.7360419, yoffset + scale * 0.37448603),
		Vec2(xoffset + scale * -0.820781, yoffset + scale * 0.31650668)
	]), 1.0, boomFixDef);

	bucketJoint = world.createJoint(pl.RevoluteJoint({
		motorSpeed: 0,
		maxMotorTorque: 1.0,
		enableMotor: true,
		enableLimit: true,
		lowerAngle: -2,
		upperAngle: .45
	  }, arm, bucket, Vec2(scale * -0.82841934, scale * 0.34917862)));

}
