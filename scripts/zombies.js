/* TODO:
TOP10:
 Add some graphics
 Fix walking (zombies and driver)
 Easy mode driving
 Getting up bug
 Shooting to the driving direction



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


*/   
var pl = planck, Vec2 = pl.Vec2, Rot = pl.Rot;
var _testbed = pl.testbed;
var world;

const BODY_HEIGHT = 1.4;
const densityFactor = .8;

const UD_GROUND = 1;
const UD_BIKE = 2;
const UD_ME = 3;
const UD_ARROW = 4;
const UD_ZOMBIE = 5;
const UD_ZOMBIEHEAD = 6;

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
var touchingGround = false;
var aimAngle = 0;
var drivingDirection = 1;
var changeDirectionTicks = 0;
var bikeTurnTicks = 0;

const arrowLength = .38;
const arrowWidth = .01;
const arrowOffset = new Vec2(.8, 2);
const arrowOffsetReverse = new Vec2(-.8, 2);

var bikeBody = null;
var driver = null;
var liveZombies = [];
var zombieHits = [];
var arrowFixture = null;

var canvas = document.getElementById('stage');
var links = document.getElementById('links');
var frames = new Array(240);
var frameStart = 0;
var frameStoreTick = 0;

_testbed('Car', function(testbed) {
    testbed.speed = 1;
	testbed.hz = 50;
	testbed.ratio = 16
	testbed.scaleY = -1;
	testbed.scaleX = 1;
	//testbed.background = 0xFF0000;

    world = new pl.World({
	  gravity : Vec2(0, -10)
	});
	
	////////////////////////////////////////////////////
	// BIKE
	////////////////////////////////////////////////////
	createBike(0, 2);
		
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

	// big round slope
	ground.createFixture(pl.Circle(new Vec2(-100,-13), 20));

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

	// Other (non-control) key handling
	testbed.keydown = function(code, char) {
		switch (char) {
			case 'R': // save replay as animated gif
				testbed.pause();
				links.innerText = "Creating replay, please wait..."
				var a = document.createElement('a');
				a.appendChild(document.createTextNode("Screen capture"));
				a.title = "Screen capture";
				a.href = canvas.toDataURL();
				links.appendChild(a); 
			
				// --allow-file-access-from-files
				// gif.worker.js: https://samikoivu.github.io/scripts/gif.worker.js
				var gif = new GIF({
					workers: 2,
					quality: 30,
					workerScript: "https://samikoivu.github.io/scripts/gif.worker.js"
				  });
				for (var i=0; i < 240; i++) {
					  if (frames[frameStart]) {
					  	gif.addFrame(frames[frameStart], {delay: 1});
					  }
					  frameStart++;
					if (frameStart > 240) {
						frameStart = 0;
					}
				}
				gif.on('finished', function(blob) {
					var a = document.createElement('a');
      				var linkText = document.createTextNode("Download replay GIF");
      				a.appendChild(linkText);
      				a.title = "Replay GIF";
      				a.href = URL.createObjectURL(blob);
					links.appendChild(a);
				  });
				  
				gif.render();
			break;
		}
  	};

	testbed.step = function() {	
		//////////////////////////
		// store frames for replay
		//////////////////////////
		if (frameStoreTick++ > 30) {
			context = canvas.getContext('2d');
			frames[frameStart++] = context.getImageData(0, 0, canvas.width, canvas.height);
			if (frameStart > 240) {
				frameStart = 0;
			}
			frameStoreTick = 0;
		}
		
		///////////////
		// bike springs
		var j1 = spring1.getJointTranslation();
		spring1.setMaxMotorForce(80);
		if (j1 > .25) {
			spring1.setMotorSpeed((spring1.getMotorSpeed() - 10 * j1) * .8);
		} else {
			spring1.setMotorSpeed((spring1.getMotorSpeed() - 10 * j1) * .1);	
		}
		var j2 = spring2.getJointTranslation();
		spring2.setMaxMotorForce(80);

		if (j2 > .25) {	
			spring2.setMotorSpeed((spring2.getMotorSpeed() - 10 * j2) * .8);
		} else {
			spring2.setMotorSpeed((spring2.getMotorSpeed() - 10 * j2) * .1);
		}		
		
		/////////////
		// collisions
		for (var i=0; i < zombieHits.length; i++) {
			var zh = zombieHits[i];
			if (zh.fixture.getUserData() == UD_ZOMBIEHEAD) {
				// TODO: if we knew how we should calc that the impact is enough to kill
				for (var lz=0; lz < liveZombies.length; lz++) {
					if (liveZombies[lz].alive) {
						if (liveZombies[lz].body == zh.body) {
							liveZombies[lz].alive = false;
						}
					}
				}
			}
			// TODO: if we knew how we should have the arrow bounce off or penetrate according to impact force/speed
			var fd = {};
			// TODO the angle looks right, but the position needs the rotation magic
			var pos = zh.body.getPosition().clone();
			pos.sub(zh.arrow.getPosition());
			var arrowFixture = zh.body.createFixture(pl.Box(arrowLength, arrowWidth, pos, zh.arrow.getAngle()-zh.body.getAngle()), fd);
			arrowFixture.setSensor(true); // TODO not sure if we want this or not
			world.destroyBody(zh.arrow);
		}
		
		zombieHits = [];


		///////////
		// controls
		if (!aim) { // controlling bike
			if (testbed.activeKeys.fire) { // but shift has been pressed, switch to aiming
				testbed.status("Aiming..");
				aim = true;
				createArrow();
			} else { // no shift, controlling bike/driver
				var speed = (bikeBody.getLinearVelocity().length()*3).toFixed();
				if (riding) {
					if (speed < 7 && testbed.activeKeys.right && testbed.activeKeys.left) {
						// bright eyes TODO there should be a delay for turning
						if (changeDirectionTicks > 20) {
							changeDirectionTicks = 0;
							changeDirection();
						} else {
							changeDirectionTicks++;
						}
					} else if (testbed.activeKeys.right) {
						setPose(1);
					} else if (testbed.activeKeys.left) {
						setPose(-1);
					} else {
						setPose(0);
					}

					testbed.status(speed + " km/h");
					// controlling bike
					motor1.setMotorSpeed(drivingDirection * 15 * Math.PI * (testbed.activeKeys.down ? 1 : testbed.activeKeys.up ? -1 : 0));
					motor1.setMaxMotorTorque((testbed.activeKeys.down || testbed.activeKeys.up) ? 17*1 : 0.5);

					motor2.setMotorSpeed(drivingDirection * 15 * Math.PI * (testbed.activeKeys.down ? 1 : testbed.activeKeys.up ? -1 : 0));
					motor2.setMaxMotorTorque((testbed.activeKeys.down || testbed.activeKeys.up) ? 17*1 : 0.5);

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
						if (Vec2.distance(bp, dp) < 4.5) {
							var angle;
							angle = bikeBody.getAngle() % (Math.PI*2);
	
							if (Math.abs(angle) < .1) {
								mountBike();
							} else {
								if (bikeTurnTicks > 20) {
									bikeTurnTicks = 0;
									bikeBody.setAngle(0);
									bikeBody.applyTorque(angle < Math.PI ? -250 : 250); // scale this by the diff so it doesn't spin uncontrollably
								} else {
									bikeTurnTicks++;
								}
							}	
						} else {
							if (touchingGround) {
								var side = testbed.activeKeys.right ? 10 : testbed.activeKeys.left ? -10 : 0;
								driver.applyForceToCenter(Vec2(side, 40));
							}
						}
					}
					if (touchingGround && (testbed.activeKeys.left || testbed.activeKeys.right)) {
						// move driver.. make sure he's upright, otherwise get up first
						var angle;
						angle = driver.getAngle() % (Math.PI*2);
						if (angle > Math.PI) {
							angle -= Math.PI * 2;
						}
						if (angle < -Math.PI) {
							angle += Math.PI * 2;
						}

						if (Math.abs(angle) < .1) {
							// TODO walk
							// Legs could be a rotating block while force maintains balance
							var sign = testbed.activeKeys.right ? 1 : -1;
							driver.applyForceToCenter(Vec2(sign*4, 3));
							testbed.status("Walking.. " + angle);
						} else {
							// get up
							// driver.applyTorque(Math.sign(angle) * -3 * angle * angle);
							driver.setAngle(angle - Math.sign(angle)/5);
							testbed.status("Getting up.. " + angle);
						}
					}
				}
			}
		} else { // aiming
			if (testbed.activeKeys.fire) { // we were aiming and are still aiming
				if (testbed.activeKeys.up && aimAngle < Math.PI*.5) {
					aimAngle += Math.PI / 50;
					updateArrow();
				} if (testbed.activeKeys.down && aimAngle > -Math.PI/3) {
					aimAngle -= Math.PI / 50;
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
	}

	///////////////////////
	// Collision processing
// 'begin-contact' 'end-contact' 'pre-solve' 'post-solve' 'remove-joint' 'remove-fixture' 'remove-body'
	world.on('begin-contact', function(contact) { // can't modify the world here
		var fixtureA = contact.getFixtureA();
		var fixtureB = contact.getFixtureB();

		var bodyA = contact.getFixtureA().getBody();
		var bodyB = contact.getFixtureB().getBody();

		if (riding) {
			if (fixtureA.getUserData() == UD_ME && fixtureB.getUserData() != UD_BIKE) {
				driverHit = true;
			}
			if (fixtureB.getUserData() == UD_ME && fixtureA.getUserData() != UD_BIKE) {
				driverHit = true;
			}
		} else { // not riding
			if (fixtureA == driverFixture /*&& bodyB.getUserData() != UD_GROUND*/) {
				touchingGround = true;
			}
			if (fixtureB == driverFixture /*&& bodyA.getUserData() != UD_GROUND*/) {
				touchingGround = true;
			}
		}

		if (bodyA.getUserData() == UD_ZOMBIE && bodyB.getUserData() == UD_ARROW) {
			zombieHits.push({body: bodyA, fixture: fixtureA, arrow: bodyB});
		} else if (bodyB.getUserData() == UD_ZOMBIE && bodyA.getUserData() == UD_ARROW) {
			zombieHits.push({body: bodyB, fixture: fixtureB, arrow: bodyA});
		}

	});

	world.on('end-contact', function(contact) { // can't modify the world here
		var fixtureA = contact.getFixtureA();
		var fixtureB = contact.getFixtureB();

		var bodyA = contact.getFixtureA().getBody();
		var bodyB = contact.getFixtureB().getBody();

		if (riding) {
		} else { // not riding
			if (fixtureA == driverFixture /*&& bodyB.getUserData() != UD_GROUND*/) {
				touchingGround = false;
			}
			if (fixtureB == driverFixture /*&& bodyA.getUserData() != UD_GROUND*/) {
				touchingGround = false;
			}
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
			driverFixture = bikeBody.createFixture(pl.Box(0.15, BODY_HEIGHT-.6, new Vec2(-.2, .6 + 1), -.3 * drivingDirection - lean*.6), driverDef);
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
		driverFixture = bikeBody.createFixture(pl.Box(0.15, BODY_HEIGHT-.6, new Vec2(-.2, .6 + 1), -.3 * drivingDirection - lean*.6), driverDef);
		driverFixture.setUserData(UD_ME);
	}
}

function separateDriver() {
	if (riding) {
		riding = false;
		bikeBody.destroyFixture(driverFixture);
		var pos = Vec2(-.2, 1.6);
		var rot = Rot(bikeBody.getAngle());
		var rpos = Rot.mulVec2(rot, pos);
		rpos.add(bikeBody.getPosition());
		var dd = {
			position: rpos,
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

		driver.setAngularVelocity(bikeBody.getAngularVelocity());
		driver.setLinearVelocity(bikeBody.getLinearVelocity());
	}
}

function updateArrow() {
	if (arrowFixture != null) {
		if (riding) {
			bikeBody.destroyFixture(arrowFixture);
		} else {
			driver.destroyFixture(arrowFixture);
		}
		arrowFixture = null;
	}
	createArrow();
}


function changeDirection() {
	drivingDirection = drivingDirection * -1;
	var pos = bikeBody.getPosition();
	createBike(pos.x, pos.y);
}

function createBike(x, y) {
	if (bikeBody) {
		world.destroyBody(bikeBody);
		bikeBody = null;
		world.destroyBody(axle1);
		world.destroyBody(axle2);
		world.destroyBody(wheel1);
		world.destroyBody(wheel2);
		world.destroyJoint(spring1);
		world.destroyJoint(spring2);
		world.destroyJoint(motor1);
		world.destroyJoint(motor2);
	}
	bikeBody = world.createBody({
		type : 'dynamic',
		position : new Vec2(x, y),
		allowSleep : false
		})
	bikeBody.setUserData(UD_BIKE);

	var boxDef = {
		friction : 0.5,
		density: 2*densityFactor,
		restitution: 0.2
	};
	var h = 1;

	// main body
	bikeBody.createFixture(pl.Box(1.5, 0.3, new Vec2(0, h), 0), boxDef).setUserData(UD_BIKE);
	boxDef.density = 1 * densityFactor;

	var axleHolderSize = 0.15;
	bikeBody.createFixture(pl.Box(axleHolderSize, 0.15, new Vec2(-.9, -0.15 + h), Math.PI / 3), boxDef).setUserData(UD_BIKE);
	bikeBody.createFixture(pl.Box(axleHolderSize, 0.15, new Vec2(.9, -0.15 + h), -Math.PI / 3), boxDef).setUserData(UD_BIKE);
	bikeBody.resetMassData();

	// add the axles
	axle1 = world.createDynamicBody(new Vec2(x, y));
	axle1.setUserData(UD_BIKE);

	axle1.createFixture(pl.Box(0.8, 0.1, new Vec2(-1 - 0.6 * Math.cos(Math.PI / 3), h - .3 - 0.6 * Math.sin(Math.PI / 3)), Math.PI / 3), boxDef).setUserData(UD_BIKE);
	axle1.resetMassData();

	var prismaticJointDef = {
		lowerTranslation: -0.3,
		upperTranslation: 0.5,
		enableLimit: true,
		enableMotor: true
	};

	var jd = pl.PrismaticJoint(prismaticJointDef, bikeBody, axle1, axle1.getWorldCenter(), new Vec2(Math.cos(Math.PI / 3), Math.sin(Math.PI / 3)));
	spring1 = world.createJoint(jd);

	axle2 = world.createDynamicBody(new Vec2(x, y));
	axle2.setUserData(UD_BIKE);

	axle2.createFixture(pl.Box(0.8, 0.1, new Vec2((1 + 0.6 * Math.cos(-Math.PI / 3)), (h-0.3 + 0.6 * Math.sin(-Math.PI / 3))), -Math.PI / 3), boxDef).setUserData(UD_BIKE);
	axle2.resetMassData();

	jd = pl.PrismaticJoint(prismaticJointDef, bikeBody, axle2, axle2.getWorldCenter(), new Vec2(-Math.cos(Math.PI / 3), Math.sin(Math.PI / 3)));

	spring2 = world.createJoint(jd);

	// add wheels forms
	var circleDef = {
		density: (0.1 * densityFactor),
		friction: 6,
		restitution: 0.2
	}

	// wheel 1	
	var wdist = .7;
	wheel1 = world.createDynamicBody(new Vec2(axle1.getWorldCenter().x - wdist * Math.cos(Math.PI / 3), axle1.getWorldCenter().y - wdist * Math.sin(Math.PI / 3)));
	wheel1.setUserData(UD_BIKE);
	// wheel1.createFixture(pl.Box(.7, .7), .7);
	wheel1.createFixture(pl.Circle(.7), circleDef).setUserData(UD_BIKE);
	wheel1.resetMassData();

	// wheel 2	
	wheel2 = world.createDynamicBody(new Vec2(axle2.getWorldCenter().x + wdist * Math.cos(-Math.PI / 3), axle2.getWorldCenter().y + wdist * Math.sin(-Math.PI / 3)));
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
	driverFixture = bikeBody.createFixture(pl.Box(0.15, BODY_HEIGHT-.6, new Vec2(-.2*drivingDirection, .6 + h), -.3 * drivingDirection), driverDef);
	driverFixture.setUserData(UD_ME);
}

function createArrow() {
	var fd = {};
	var pos = (drivingDirection == 1) ? arrowOffset : arrowOffsetReverse;
	var angle = (drivingDirection == 1) ? aimAngle : (Math.PI * 2 - aimAngle);
	if (riding) {
		arrowFixture = bikeBody.createFixture(pl.Box(arrowLength, arrowWidth, pos, angle), fd);
	} else {
		arrowFixture = driver.createFixture(pl.Box(arrowLength, arrowWidth, pos, angle), fd);		
	}
	arrowFixture.setUserData(UD_BIKE);
}

function launchArrow() {
	var offset = (drivingDirection == 1) ? arrowOffset.clone() : arrowOffsetReverse.clone();
	var rot;
	var angle = (drivingDirection == 1) ? aimAngle : (Math.PI * 2 - aimAngle);

	if (riding) {
		bikeBody.destroyFixture(arrowFixture);
	} else {
		driver.destroyFixture(arrowFixture);
	}

	var pos;
	if (riding) {
		pos = bikeBody.getPosition().clone();
		rot = Rot(bikeBody.getAngle());
	} else {
		pos = driver.getPosition().clone();
		rot = Rot(driver.getAngle());
	}
	var rpos = Rot.mulVec2(rot, offset);
	rpos.add(pos);

	var fd = {
		density: 1.0,
		friction: 100,
		restitution: 0
	};		

	var bd = {
		position: rpos,
		type : 'dynamic',
		allowSleep: true,
		bullet: true
	};

	var arrowBody = world.createBody(bd);
	arrowBody.setUserData(UD_ARROW);
	arrowBody.createFixture(pl.Box(arrowLength, arrowWidth, Vec2(0, 0), angle+rot.getAngle()), fd);

	arrowBody.applyForceToCenter(Vec2(Math.cos(aimAngle)*200, Math.sin(angle + rot.getAngle())*200));
}