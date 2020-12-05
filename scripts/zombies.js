/* TODO:
Bike:
	Adjust spring logic
	Lean driver forwards and backwards as a visual cue about weight shift

Zombies:
	Should be slightly soft, but have great friction
	If upright:
	  Move towards player
	Otherwise
	  Work to get upright (should be a small delay)
	Dies from an arrow to head in which case becomes inactive block
	In fact, any hard impact to the head kills the zombie
	ie. falling etc
	An even harder impact to the body might kill zombie too?
	An arrow or hard impact to the legs turns zombie into a crawler, ie, movement speed one third, lower profile

Movement:
	Figure out a way to move bipedals, the sliding isn't great
	"Animate" the shape of the bipedal, esp. for Zombies who move slowly, we can extend second leg in front of current, and then shift upper body there and then the trailing leg.
 
Track:
	Big balls, and maybe loose balls

	A level to level jump with a fall in between

	A big rounded slope

Arrows sticking to Zombies:
		if (!riding) {
			this.bikeBody.destroyFixture(driverFixture);
		}
		
		for (ZombieHit zh : this.zombieHits) {
			if (zh.zombie.m_userData instanceof Zombie.Head) {
				// TODO: if we knew how we should calc that the impact is enough to kill
				Zombie zombie = (Zombie) zh.zombie.m_body.m_userData;
				zh.zombie.m_body.getFixtureList().getNext().setFriction(500f);
				this.liveZombies.remove(zombie);
				this.model.addMessage(new Message("Kill!", zh.zombie.getBody(), Color3f.RED));
			}
			// TODO: if we knew how we should have the arrow bounce off or penetrate according to impact force/speed
			FixtureDef fd = new FixtureDef();
			PolygonShape ps = new PolygonShape();
			ps.setAsBox(arrowLength, arrowWidth, zh.position, zh.angle);
			fd.shape = ps;
			fd.isSensor = true;
			zh.zombie.m_body.createFixture(fd);
			m_world.destroyBody(zh.arrow.m_body);
		}
		
		zombieHits.clear();

*/    
const DEGTORAD = 0.0174532925199432957;
const RADTODEG = 57.295779513082320876;

const BODY_HEIGHT = 1.4;

const PI = 3.14159265;

const densityFactor = .8;

const UD_GROUND = 1;
const UD_BIKE = 2;
const UD_ME = 3;
const UD_ARROW = 4;
const UD_ZOMBIE = 5;

var axle1;
var axle2;
var spring1;
var spring2;
var wheel1;
var wheel2;
var motor1;
var motor2;
var driverFixture;

var riding = true;
var driverHit = false;
var aim = false;
var lean = 0; // -1 lean back, 0 normal, 1 lean forward

var aimAngle = 0;

const arrowLength = .38;
const arrowWidth = .01;

var bikeBody = null;
var driver = null;
var liveZombies = [];
var arrowFixture = null;

var pl = planck, Vec2 = pl.Vec2;
var world;

planck.testbed('Car', function(testbed) {
    testbed.speed = 1;
    testbed.hz = 50;
  
    world = new pl.World({
      gravity : Vec2(0, -10)
	});
	
	////////////////////////////////////////////////////
	// BIKE
	////////////////////////////////////////////////////
	bikeBody = world.createBody({
		type : 'dynamic',
		position : new Vec2(0, 2),
		allowSleep : false
		})
	bikeBody.setUserData(UD_BIKE);

	var boxDef = {
		friction : 0.5,
		density: 2*densityFactor,
		restitution: 0.2
	};
	var h = 1;
	
	// show center point
	//bikeBody.createFixture(pl.Box(.1, .1, new Vec2(0, 0), 0)).setSensor(true);

	// main body
	bikeBody.createFixture(pl.Box(1.5, 0.3, new Vec2(0, h), 0), boxDef).setUserData(UD_BIKE);
	boxDef.density = 1 * densityFactor;

	var axleHolderSize = 0.15;
	bikeBody.createFixture(pl.Box(axleHolderSize, 0.15, new Vec2(-.9, -0.15 + h), PI / 3), boxDef).setUserData(UD_BIKE);
	bikeBody.createFixture(pl.Box(axleHolderSize, 0.15, new Vec2(.9, -0.15 + h), -Math.PI / 3), boxDef).setUserData(UD_BIKE);
	bikeBody.resetMassData();

	// add the axles
	axle1 = world.createDynamicBody(new Vec2(0, h+1));
	axle1.setUserData(UD_BIKE);

	axle1.createFixture(pl.Box(0.8, 0.1, new Vec2(-1 - 0.6 * Math.cos(PI / 3), h - .3 - 0.6 * Math.sin(PI / 3)), PI / 3), boxDef).setUserData(UD_BIKE);
	axle1.resetMassData();

	var prismaticJointDef = {
		lowerTranslation: -0.3,
		upperTranslation: 0.5,
		enableLimit: true,
		enableMotor: true
	};

	var jd = pl.PrismaticJoint(prismaticJointDef, bikeBody, axle1, axle1.getWorldCenter(), new Vec2(Math.cos(PI / 3), Math.sin(PI / 3)));
	spring1 = world.createJoint(jd);

	axle2 = world.createDynamicBody(new Vec2(0, h+1));
	axle2.setUserData(UD_BIKE);

	axle2.createFixture(pl.Box(0.8, 0.1, new Vec2((1 + 0.6 * Math.cos(-PI / 3)), (h-0.3 + 0.6 * Math.sin(-PI / 3))), -PI / 3), boxDef).setUserData(UD_BIKE);
	axle2.resetMassData();

	jd = pl.PrismaticJoint(prismaticJointDef, bikeBody, axle2, axle2.getWorldCenter(), new Vec2(-Math.cos(PI / 3), Math.sin(PI / 3)));

	spring2 = world.createJoint(jd);

	// add wheels forms
	var circleDef = {
		density: (0.1 * densityFactor),
		friction: 6,
		restitution: 0.2
	}

	// wheel 1	
	var wdist = .7;
	wheel1 = world.createDynamicBody(new Vec2(axle1.getWorldCenter().x - wdist * Math.cos(PI / 3), axle1.getWorldCenter().y - wdist * Math.sin(PI / 3)));
	wheel1.setUserData(UD_BIKE);
	// wheel1.createFixture(pl.Box(.7, .7), .7);
	wheel1.createFixture(pl.Circle(.7), circleDef).setUserData(UD_BIKE);
	wheel1.resetMassData();

	// wheel 2	
	wheel2 = world.createDynamicBody(new Vec2(axle2.getWorldCenter().x + wdist * Math.cos(-PI / 3), axle2.getWorldCenter().y + wdist * Math.sin(-PI / 3)));
	wheel2.setUserData(UD_BIKE);
	// wheel2.createFixture(pl.Box(.7, .7), .7);
	wheel2.createFixture(pl.Circle(.7), circleDef).setUserData(UD_BIKE);
	wheel2.resetMassData();
	
	// add revolute joints which drive the wheels
	motor1 = world.createJoint(pl.RevoluteJoint({enableMotor : true}, axle1, wheel1, wheel1.getPosition()));
	motor2 = world.createJoint(pl.RevoluteJoint({enableMotor : true}, axle2, wheel2, wheel2.getPosition()));
						
	// add driver
	riding = true;
	var driverDef = {
		friction : 0.5,
		density : .03 * densityFactor,
		restitution : 0.2
	}
	driverFixture = bikeBody.createFixture(pl.Box(0.15, BODY_HEIGHT-.6, new Vec2(-.2, .6 + h), -.3), driverDef);
	driverFixture.setUserData(UD_ME);
	//driverFixture.setSensor(true);
		
	///////////////////////////////
	// ZOMBIES
	///////////////////////////////
	var zombieBody = world.createDynamicBody(new Vec2(-10, 3.5));
	zombieBody.setUserData(UD_ZOMBIE);

	var zFixDef = {
		friction: 0.05,
		density: 2*densityFactor,
		restitution: 0.2
	};
	var zFixture = zombieBody.createFixture(pl.Box(.2, 1), zFixDef);

	var zombie = {
		alive: true,
		body: zombieBody,
		fixture: zFixture
	};

	liveZombies = [];
	liveZombies.push(zombie);
	
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
	ground.createFixture(pl.Box(3, 0.5, new Vec2(3.5, 1), PI / 8), boxDef);
	ground.createFixture(pl.Box(3, 0.5, new Vec2(10.5, 1), -PI / 8), boxDef);
	ground.createFixture(pl.Box(2, 3, new Vec2(20, 0.3), 0), boxDef);
	ground.createFixture(pl.Box(2, 2, new Vec2(50, 0.3), 0), boxDef);
	ground.createFixture(pl.Box(5, 5, new Vec2(70, 0.3), PI/4), boxDef);
	// more stuff
	ground.createFixture(pl.Box(3, 0.5, new Vec2(100 + 5, 1.5), PI / 4), boxDef);
	ground.createFixture(pl.Box(3, 0.5, new Vec2(100 + 3.5, 1), PI / 8), boxDef);
	ground.createFixture(pl.Box(3, 0.5, new Vec2(100 + 9, 1.5), -PI / 4), boxDef);
	ground.createFixture(pl.Box(3, 0.5, new Vec2(100 + 10.5, 1), -PI / 8), boxDef);
	// ramp and secondary level
	ground.createFixture(pl.Box(5, 0.5, new Vec2(200 + 25, 2), PI / 8), boxDef);		
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

    // Spinning Teeter
    teeter = world.createDynamicBody(Vec2(-50.0, 1.0));
    teeter.createFixture(pl.Box(10.0, 0.25), 1.0);
    teeterJoint = world.createJoint(pl.RevoluteJoint({
      enableMotor : true
    },  ground, teeter, teeter.getPosition()));
  
	var groundFD = boxDef; // clear up
	ground.createFixture(pl.Edge(Vec2(500 + -20.0, -20.0), Vec2(500 + 20.0, -20.0)), groundFD);
			
	var hs = [ 0.25, 1.0, 4.0, 0.0, 0.0, -1.0, -2.0, -2.0, -1.25, 0.0 ];
			
	var x = 500 + 20.0, y1 = -20.0, dx = 5.0;
			
	for (var i = 0; i < 10; ++i) {
		var y2 = hs[i] -20;
		ground.createFixture(pl.Edge(Vec2(x, y1), Vec2(x + dx, y2)), groundFD);
		y1 = y2;
		x += dx;
	}
		
	for (var i = 0; i < 10; ++i) {
		var y2 = hs[i] - 20;
		ground.createFixture(pl.Edge(Vec2(x, y1), Vec2(x + dx, y2)), groundFD);
		y1 = y2;
		x += dx;
	}

	ground.createFixture(pl.Edge(Vec2(x, -20.0), Vec2(x + 40.0, -20.0)), groundFD);
	x += 80.0;
	ground.createFixture(pl.Edge(Vec2(x, -20.0), Vec2(x + 40.0, -20.0)), groundFD);
	x += 40.0;
	ground.createFixture(pl.Edge(Vec2(x, -20.0), Vec2(x + 10.0, -15.0)), groundFD);
	x += 20.0;
	ground.createFixture(pl.Edge(Vec2(x, -20.0), Vec2(x + 40.0, -20.0)), groundFD);
	x += 40.0;
	ground.createFixture(pl.Edge(Vec2(x, -20.0), Vec2(x, -20.0)), groundFD);

	/////////////////////////////////////////
	// RANDOM TERRAIN
	/////////////////////////////////////////
	y1 = -20.0;
	dx = 5.0;
	// straight
	for (var i = 0; i < 50; ++i) {
		var y2 = y1 + Math.random() * 10 -5;
		ground.createFixture(pl.Edge(Vec2(x, y1), Vec2(x + dx, y2)), groundFD);
		y1 = y2;
		x += dx;
	}
	// uphill
	for (var i = 0; i < 50; ++i) {
		var y2 = y1 + Math.random() * 5;
		ground.createFixture(pl.Edge(Vec2(x, y1), Vec2(x + dx, y2)), groundFD);
		y1 = y2;
		x += dx;
	}
	// downhill
	for (var i = 0; i < 50; ++i) {
		var y2 = y1 - Math.random() * 5;
		ground.createFixture(pl.Edge(Vec2(x, y1), Vec2(x + dx, y2)), groundFD);
		y1 = y2;
		x += dx;
	}

    // Teeter
    var teeter = world.createDynamicBody(Vec2(500 + 140.0, -19.0));
    teeter.createFixture(pl.Box(10.0, 0.25), 1.0);
    world.createJoint(pl.RevoluteJoint({
      lowerAngle : -8.0 * Math.PI / 180.0,
      upperAngle : 8.0 * Math.PI / 180.0,
      enableLimit : true
    }, ground, teeter, teeter.getPosition()));
  
    teeter.applyAngularImpulse(100.0, true);
  
    // Bridge
    var bridgeFD = {};
    bridgeFD.density = 1.0;
	bridgeFD.friction = 0.6;
	
	var bridgeh = -19.5;
  
    var prevBody = ground;
    for (var i = 0; i < 20; ++i) {
      var bridgeBlock = world.createDynamicBody(Vec2(500 + 161.0 + 2.0 * i, bridgeh));
      bridgeBlock.createFixture(pl.Box(1.0, 0.125), bridgeFD);
  
      world.createJoint(pl.RevoluteJoint({}, prevBody, bridgeBlock, Vec2(500 + 160.0 + 2.0 * i, bridgeh)));
  
      prevBody = bridgeBlock;
    }
  
    world.createJoint(pl.RevoluteJoint({}, prevBody, ground, Vec2(500 + 160.0 + 2.0 * i, bridgeh)));
  
    // Boxes
    var box = pl.Box(0.5, 0.5);
	for (var i = 0; i < 5; i++) {
		world.createDynamicBody(Vec2(500 + 230.0, i - 19.5)).createFixture(box, 0.5);
	}


	// in case we need more keys
	testbed.keydown = function(code, char) {
		switch (char) {
			case 'Z':
			break;
		}
  	};

	testbed.step = function() {	
		// bike springs
		var j1 = spring1.getJointTranslation();
		spring1.setMaxMotorForce((800 * j1*j1));
		// testbed.status(spring1.getMotorSpeed() + " " + j1);
		if (j1 > .25) {
			console.log(spring1.getMotorSpeed() + " " + j1 + " " + (spring1.getMotorSpeed() - 10 * j1) + " " + (800 * j1*j1));
			spring1.setMotorSpeed((spring1.getMotorSpeed() - 10 * j1) * .8);
		} else {
			spring1.setMotorSpeed((spring1.getMotorSpeed() - 10 * j1) * .1);	
		}
		var j2 = spring2.getJointTranslation();
		spring2.setMaxMotorForce((800 * j2*j2));

		if (j2 > .25) {	
			spring2.setMotorSpeed((spring2.getMotorSpeed() - 10 * j2) * .8);
		} else {
			spring2.setMotorSpeed((spring2.getMotorSpeed() - 10 * j2) * .1);
		}		

		if (!aim) { // controlling bike
			if (testbed.activeKeys.fire) { // but shift has been pressed, switch to aiming
				testbed.status("Aiming..");
				aim = true;
				createArrow();
			} else { // no shift, controlling bike/driver
				if (riding) {
					if (testbed.activeKeys.right) {
						setPose(1);
					} else if (testbed.activeKeys.left) {
						setPose(-1);
					} else {
						setPose(0);
					}

					// testbed.status(Math.abs(bikeBody.getLinearVelocity().x.toFixed())*3 + " km/h");
					// controlling bike
					motor1.setMotorSpeed(15 * PI * (testbed.activeKeys.down ? 1 : testbed.activeKeys.up ? -1 : 0));
					motor1.setMaxMotorTorque((testbed.activeKeys.down || testbed.activeKeys.up) ? 17*1 : 0.5);

					motor2.setMotorSpeed(15 * PI * (testbed.activeKeys.down ? 1 : testbed.activeKeys.up ? -1 : 0));
					motor2.setMaxMotorTorque((testbed.activeKeys.down || testbed.activeKeys.up) ? 12*1 : 0.5);

					// torque approach
					bikeBody.applyTorque((testbed.activeKeys.left ? 45 : testbed.activeKeys.right ? -45 : 0));
				} else {
					motor1.setMotorSpeed(0);
					motor2.setMotorSpeed(0);
					// controlling driver
					if (testbed.activeKeys.up) {
						// if bike is near by, mount 
						var bp = bikeBody.getPosition();
						var dp = driver.getPosition();
						var distSquared = Math.pow(dp.x-bp.x, 2) + Math.pow(dp.y-bp.y, 2);
						if (distSquared < 20) {
							var angle;
							angle = bikeBody.getAngle() % (Math.PI*2);
							if (angle < 0) {
								angle = Math.PI * 2 + angle;
							}
							testbed.status("Mounting " + angle);
	
							if (angle < .2 || angle > Math.PI*2 - .2) {
								mountBike();
							} else {
								// get up
								bikeBody.applyTorque(angle < Math.PI ? -250 : 250); // scale this by the diff so it doesn't spin uncontrollably
							}	
						} else {
							// TODO only jump if on ground
							driver.applyForceToCenter(Vec2(0, 20));
							testbed.status("Jumping");
						}
					}
					if (testbed.activeKeys.left || testbed.activeKeys.right) {
						// move driver.. make sure he's upright, otherwise get up first
						var angle;
						angle = driver.getAngle() % (Math.PI*2);
						if (angle < 0) {
							angle = Math.PI * 2 + angle;
						}

						if (angle < .1 || angle > Math.PI*2 - .1) {
							// TODO walk
							var sign = testbed.activeKeys.right ? 1 : -1;
							driver.applyForceToCenter(Vec2(sign*4, 3));
							testbed.status("Walking..");
						} else {
							// get up
							driver.applyTorque(angle < Math.PI ? -5 : 5);
							testbed.status("Getting up.. " + angle);
						}
					}
				}
			}
		} else { // aiming
			if (testbed.activeKeys.fire) { // we were aiming and are still aiming
				if (testbed.activeKeys.up && aimAngle < PI*1.25) {
					aimAngle += PI / 50;
					updateArrow();
				} if (testbed.activeKeys.down && aimAngle > -PI*.25) {
					aimAngle -= PI / 50;
					updateArrow();
				}
			} else { // we were aiming but shift is no longer pressed, ie. it's been released
				launchArrow();
				aim = false;
			}
		}

		if (driverHit) {
			driverHit = false;
			separateDriver();
		}
		
		
		//if (!mouseDown) {
		var pos = bikeBody.getPosition();
		var vel = bikeBody.getLinearVelocity();
		if (!riding) {
			pos = driver.getPosition();
			vel = driver.getLinearVelocity();
		}
		testbed.x = pos.x + 0.15 * vel.x;
		testbed.y = -pos.y + 0.15 * vel.y;
		//}

		testbed.info('←/→: Balance bike, ↑/↓: Accelerate');
		//testbed.status("Status " + pos);
	}

	world.on('pre-solve', function(contact) { // can't modify the world here
		var fixtureA = contact.getFixtureA();
		var fixtureB = contact.getFixtureB();

		var bodyA = contact.getFixtureA().getBody();
		var bodyB = contact.getFixtureB().getBody();

		var aship = bodyA === bikeBody;
		var bship = bodyB === bikeBody;
		//var abullet = fixtureA.getFilterCategoryBits() & BULLET;
		//var bbullet = fixtureB.getFilterCategoryBits() & BULLET;

		if (aship || bship) {
			//console.log(aship + " " + bship);
		}
		if (riding) {
			if (fixtureA.getUserData() == UD_ME && fixtureB.getUserData() != UD_BIKE) {
				driverHit = true;
			}
			if (fixtureB.getUserData() == UD_ME && fixtureA.getUserData() != UD_BIKE) {
				driverHit = true;
			}
		}
	});



	return world;
});


function setNiceViewCenter() {
    PTM = 28;
    setViewCenterWorld( new Vec2(0,1), true );
}

function setPose(newPose) {
	if (riding) {
		if (newPose != lean) {
			lean = newPose;
			bikeBody.destroyFixture(driverFixture);

			var driverDef = {
				friction : 0.5,
				density : .03 * densityFactor,
				restitution : 0.2
			}
			driverFixture = bikeBody.createFixture(pl.Box(0.15, BODY_HEIGHT-.6, new Vec2(-.2, .6 + 1), -.3 - lean*.6), driverDef);
			driverFixture.setUserData(UD_ME);	
		}
	}
}

function mountBike() {
	if (!riding) {
		riding = true;
		world.destroyBody(driver);

		var driverDef = {
			friction : 0.5,
			density : .03 * densityFactor,
			restitution : 0.2
		}
		driverFixture = bikeBody.createFixture(pl.Box(0.15, BODY_HEIGHT-.6, new Vec2(-.2, .6 + 1), -.3), driverDef);
		driverFixture.setUserData(UD_ME);
		}
}

function separateDriver() {
	if (riding) {
		// TODO transfer momentum
		//      fix relative position
		//      fix rotation
		//		make centerpoint of body be in the center of the body fixture so it rotates around that
		riding = false;
		bikeBody.destroyFixture(driverFixture);
		var dd = {
			position: Vec2(bikeBody.getPosition().x-.2, bikeBody.getPosition().y + 1.6),
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
		driverFixture.setUserData(UD_ME);
	}
}

function updateArrow() {
	if (arrowFixture != null) {
		bikeBody.destroyFixture(arrowFixture);
		arrowFixture = null;
	}
	createArrow();
}

function createArrow() {
	var fd = {};
	arrowFixture = bikeBody.createFixture(pl.Box(arrowLength, arrowWidth, new Vec2(0, 3.5 + 1), aimAngle), fd);
	arrowFixture.setUserData(UD_BIKE); // while aiming have arrow be part of bike.. doesn't help tho, the problem is once we release it
}

function launchArrow() {
	bikeBody.destroyFixture(arrowFixture);

	var fd = {
		density: 1.0,
		friction: 100,
		restitution: 0
	};		

	var bd = {
		position: bikeBody.getWorldCenter(),
		type : 'dynamic',
		allowSleep: true,
		bullet: true
	};

	var arrowBody = world.createBody(bd);
	arrowBody.setUserData(UD_ARROW);
	arrowBody.createFixture(pl.Box(arrowLength, arrowWidth, new Vec2(-0, 1), aimAngle), fd);

	arrowBody.applyForceToCenter(new Vec2(Math.cos(aimAngle)*200, Math.sin(aimAngle)*200));
}