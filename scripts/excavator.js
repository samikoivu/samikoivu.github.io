/* TODO:
*Turning around:
 Initial idea was mirroring excavator in the same body, but what about a mat being held or any other arbitrary object

*Make bucket more solid

*Bucket thumb
  Needs to be able to grab mats etc
  Make it more clawy

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
var thumbJoint;
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
	var gDef = { // def for all ground elements
		friction: 1,
		density: 0
	};

	// add the ground, with a hole
	var ground = world.createBody(new Vec2(0, 0.5));
	ground.createFixture(pl.Box(50, 0.5, Vec2(45, 0), 0), gDef);
	ground.createFixture(pl.Box(50, 0.5, Vec2(-90, 0), 0), gDef);
	ground.createFixture(pl.Box(17.5, 0.5, Vec2(-22.5, -5), 0), gDef);
	ground.createFixture(pl.Box(.5, 5, Vec2(-5, -5), 0), gDef);
	ground.createFixture(pl.Box(.5, 5, Vec2(-40, -5), 0), gDef);
	ground.setUserData(UD_GROUND);


	var boxDef = { // def for all ground elements
		friction: .1,
		density: 10
	};

		  
	// Fill hole with boxes
	for (var i = 0; i < 100; i++) {
		world.createDynamicBody(Vec2(-30 + Math.random()*10, i*2)).createFixture(pl.Box(0.4, 0.4, Vec2(0,0), Math.random()*Math.PI), boxDef);
		world.createDynamicBody(Vec2(-30 + Math.random()*10, i*2)).createFixture(pl.Circle(0.4, 0.4, Vec2(0,0), Math.random()*Math.PI), boxDef);
	}
	

	// Other (non-control) key handling
	testbed.keydown = function (code, char) {
		switch (char) {
		}
	};

	testbed.step = function () {
		const t = 70000 / 9;
		if (testbed.activeKeys['I']) { // boom down
			boomJoint.setMotorSpeed(.5);
			boomJoint.setMaxMotorTorque(t);
		} else if (testbed.activeKeys['K']) { // boom up
			boomJoint.setMotorSpeed(-.5);
			boomJoint.setMaxMotorTorque(t);
		} else { // motor to maintain boom position
			boomJoint.setMotorSpeed(0);
			boomJoint.setMaxMotorTorque(t);
		}

		if (testbed.activeKeys['W']) { // arm down
			armJoint.setMotorSpeed(1);
			armJoint.setMaxMotorTorque(t);
		} else if (testbed.activeKeys['S']) { // arm up
			armJoint.setMotorSpeed(-1);
			armJoint.setMaxMotorTorque(t);
		} else { // motor to maintain arm position
			armJoint.setMotorSpeed(0);
			armJoint.setMaxMotorTorque(t);
		}

		if (testbed.activeKeys['J']) { // bucket dump
			bucketJoint.setMotorSpeed(1);
			bucketJoint.setMaxMotorTorque(t);
		} else if (testbed.activeKeys['L']) { // bucket curl
			bucketJoint.setMotorSpeed(-1);
			bucketJoint.setMaxMotorTorque(t);
		} else { // motor to maintain boom position
			bucketJoint.setMotorSpeed(0);
			bucketJoint.setMaxMotorTorque(t*2);
		}

		if (testbed.activeKeys['A']) { // swing left
		} else if (testbed.activeKeys['D']) { // swing right
		}

		if (testbed.activeKeys['R']) { // drive left
			speed = -2;
		} else if (testbed.activeKeys['F']) { // drive right
			speed = 2;
		} else {
			speed = 0;
		}

		if (thumbJoint) { // as this is optional
			if (testbed.activeKeys['Y']) { // thumb comes down			
				thumbJoint.setMotorSpeed(1);
				thumbJoint.setMaxMotorTorque(t);
			} else if (testbed.activeKeys['U']) { // thumb goes up
				thumbJoint.setMotorSpeed(-1);
				thumbJoint.setMaxMotorTorque(t);
			} else {
				thumbJoint.setMotorSpeed(0);
				thumbJoint.setMaxMotorTorque(t);
			}
		}



		var pos = body.getPosition();
		var vel = body.getLinearVelocity();
		testbed.x = pos.x + 0.15 * vel.x;
		testbed.y = -pos.y + 0.15 * vel.y;
		testbed.info('R/F: drive A/D: swing arm J/L: bucket W/S: arm I/K: boom Y/U: thumb');
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
		friction: 5,
		density: 3*18*4/9,
		restitution: 0.2
	};
	var boomFixDef = {
		friction: 5,
		density: .05,
		restitution: 0.2
	};
	var xoffset = 0;
	var yoffset = 0;
	var scale = 3.2;
	var d = 1;

	body = world.createBody(bd);

	// cabin
	body.createFixture(pl.Box((0.21084936+0.3178882)*scale/2, (1.1206796-0.5919421)*scale/2, Vec2(scale*(0.3178882-0.21084936)/2*d, scale*(1.1206796+0.5919421)/2), 0), bodyFixDef);

	body.createFixture(pl.Box((1.1028397-0.3178882)*scale/2, (0.85631084-0.5919421)*scale/2, Vec2(scale*(0.3178882+1.1028397)/2*d, scale*(0.85631084+0.5919421)/2), 0), bodyFixDef);

	// body 5 exhaust motor
	body.createFixture(pl.Box((0.9333616-0.5498057)*scale/2, (0.9678097-0.85631084)*scale/2, Vec2(scale*(0.9333616+0.5498057)/2*d, scale*(0.9678097+0.85631084)/2), 0), bodyFixDef);

	// chains
	chains = body.createFixture(pl.Box((0.908725+0.5073295)*scale/2, (0.5024697-0.25572217)*scale/2, Vec2(scale*(0.908725-0.5073295)/2*d, scale*(0.5024697+0.25572217)/2), 0), bodyFixDef);

	// big arm
	var boom = world.createBody(boomd); // TODO different def as it's less wide so change density?
	boom.createFixture(pl.Polygon([
		Vec2(xoffset + scale * -0.70036227*d, yoffset + scale * 0.92752016),
		Vec2(xoffset + scale * -1.6681718*d, yoffset + scale * 0.57964385),
		Vec2(xoffset + scale * -1.7261512*d, yoffset + scale * 0.655463),
		Vec2(xoffset + scale * -0.68698245*d, yoffset + scale * 1.1817374),
	]), 1.0, boomFixDef);
	boom.createFixture(pl.Polygon([
		Vec2(xoffset + scale * 0.11134894*d, yoffset + scale * 0.8918405),
		Vec2(xoffset + scale * 0.11580889*d, yoffset + scale * 0.79372156),
		Vec2(xoffset + scale * -0.27220687*d, yoffset + scale * 0.8918405),
		Vec2(xoffset + scale * -0.48182464*d, yoffset + scale * 1.1817374),
	]), 1.0, boomFixDef);
	boom.createFixture(pl.Polygon([
		Vec2(xoffset + scale * -0.70036227*d, yoffset + scale * 0.92752016),
		Vec2(xoffset + scale * -0.68698245*d, yoffset + scale * 1.1817374),
		Vec2(xoffset + scale * -0.27220687*d, yoffset + scale * 0.8918405),
		Vec2(xoffset + scale * -0.48182464*d, yoffset + scale * 1.1817374),
	]), 1.0, boomFixDef);

	boomJoint = world.createJoint(pl.RevoluteJoint({
		motorSpeed: 0,
		maxMotorTorque: 1.0,
		enableMotor: true,
		// enableLimit: true,
		// lowerAngle: -1*d,
		// upperAngle: .45*d
	  }, body, boom, Vec2(scale * 0.21819851*d, scale * 0.7898599)));
	
	// small arm
	var arm = world.createBody(boomd); // TODO different def as it's less wide so change density?
	arm.createFixture(pl.Polygon([
		Vec2(xoffset + scale * -0.8207809*d, yoffset + scale * 0.31650668),
		Vec2(xoffset + scale * -1.6904715*d, yoffset + scale * 0.6688429),
		Vec2(xoffset + scale * -2.002668*d, yoffset + scale * 0.58856374),
		Vec2(xoffset + scale * -1.7885904*d, yoffset + scale * 0.42800546),
		Vec2(xoffset + scale * -0.84308064*d, yoffset + scale * 0.3878659),
	]), 1.0, boomFixDef);

	armJoint = world.createJoint(pl.RevoluteJoint({
		motorSpeed: 0,
		maxMotorTorque: 1.0,
		enableMotor: true,
		// enableLimit: true,
		// lowerAngle: -2.4*d,
		// upperAngle: .45*d
	  }, boom, arm, Vec2(scale * -1.6822392*d, scale * 0.6276647)));


	var bucket = world.createBody(boomd);
	bucket.createFixture(pl.Polygon([
		Vec2(scale*-0.95*d+.5/3*scale, scale*0.7+.2/3*scale),
		Vec2(scale*-0.95*d-.5/3*scale, scale*0.7),
		Vec2(scale*-0.95*d+.5/3*scale, scale*0.7-.2/3*scale),
	]), 1.0, boomFixDef);
	bucket.createFixture(pl.Box(.5/3*scale, .2/3*scale, Vec2(scale*-0.67*d, scale*0.44), 1.0*d), boomFixDef);
	bucket.createFixture(pl.Box(.4/3*scale, .2/3*scale, Vec2(scale*-.68*d, scale*0.63), 2.3*d), boomFixDef);

	bucketJoint = world.createJoint(pl.RevoluteJoint({
		motorSpeed: 0,
		maxMotorTorque: 1.0,
		enableMotor: true,
		// enableLimit: true,
		// lowerAngle: -2*d,
		// upperAngle: .45*d
	}, arm, bucket, Vec2(scale * -0.82841934*d, scale * 0.34917862)));

	var thumb = world.createBody(boomd);
	// thumb.createFixture(pl.Box(.3, .05, Vec2(xoffset + scale * -.95*d, yoffset + scale * 0.5), 2.7), boomFixDef);
	thumb.createFixture(pl.Box(.8/6.5*scale/2, .1/6.5*scale/2, Vec2(xoffset + scale * -.95*d, yoffset + scale * 0.45), 2.7), boomFixDef);
	thumb.createFixture(pl.Polygon([
		Vec2(scale*-1.00*d, scale*0.5),
		Vec2(scale*-1.10*d, scale*0.68),
		Vec2(scale*-1.06*d, scale*0.5),
	]), 1.0, boomFixDef);
	thumbJoint = world.createJoint(pl.RevoluteJoint({
		motorSpeed: 0,
		maxMotorTorque: 1.0,
		enableMotor: true,
		// enableLimit: true,
		// lowerAngle: -2,
		// upperAngle: .45
	  }, arm, thumb, Vec2(xoffset + scale * -0.84308064*d, yoffset + scale * 0.4)));

	var matFixDef = {
		friction: 5,
		density: 50,
		restitution: 0.2
	};

	for (var i=0; i < 4; i++) {
		var mat1 = world.createBody(boomd);
		mat1.createFixture(pl.Box(.3, .2, Vec2(20, 1 + i), 0), matFixDef);
		mat1.createFixture(pl.Box(.3, .2, Vec2(21, 1 + i), 0), matFixDef);
		mat1.createFixture(pl.Box(.3, .2, Vec2(22, 1 + i), 0), matFixDef);
		mat1.createFixture(pl.Box(.3, .2, Vec2(23, 1 + i), 0), matFixDef);
	}

}
