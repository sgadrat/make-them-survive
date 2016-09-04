var mts = {
	zombies: [],
	survivors: [],
	spawns: [],
	guardian: null,
	nextSpawn: 8000,
	state: "not-started",

	init: function() {
		var graphics = [
			'img/scene.jpg',
			'img/spawn.png',
		];
		var animations = {};
		['survivor', 'zombie', 'guardian'].forEach(function(kind) {
			['up', 'right', 'down', 'left'].forEach(function(direction) {
				var index = kind+'.'+direction;
				var filename = 'img/'+kind+'_'+direction+'.png';
				graphics.push(filename);
				animations[index] = new rtge.Animation();
				animations[index].steps = [filename];
				animations[index].durations = [600000];
			});
		});
		animations['spawn'] = new rtge.Animation();
		animations['spawn'].steps = ['img/spawn.png'];
		animations['spawn'].durations = [600000];
		mts.zombies = [
			new mts.Zombie(600, 400),
		];
		mts.survivors = [
			new mts.Survivor(1250, 660),
		];
		mts.guardian = new mts.Guardian(675, 380);
		var objects = mts.zombies.concat(mts.survivors).concat(mts.guardian);
		var camera = new rtge.Camera();

		rtge.init(
			'view',
			{
				'terrain': 'img/scene.jpg',
				'objects': objects
			},
			animations,
			[],
			graphics,
			{
				'globalTick': mts.globalTick,
				'renderPostTerrain': mts.drawBarrier
			},
			camera
		);
	},

	globalTick: function(timeDiff) {
		if (mts.state == 'running') {
			mts.nextSpawn -= timeDiff;
			if (mts.nextSpawn <= 0) {
				mts.nextSpawn = 8000;
				let spawn = new mts.SpawnSpot(Math.random() * 1351, Math.random() * 760);
				mts.spawns.push(spawn);
				rtge.addObject(spawn);
			}
		}
	},

	Zombie: function(x, y) {
		rtge.DynObject.call(this);
		this.x = x;
		this.y = y;
		this.z = 2;
		this.animation = 'zombie.down';
		this.anchorX = 25;
		this.anchorY = 50;

		this.velocity = {x: 0, y: 0};
		this.maxSpeed = 80;

		this.tick = function(timeDiff) {
			timeDiff /= 1000.;
			var direction = {x: 0, y: 0};
			direction = mts.addVelocities(direction, mts.multiplyVelocity(this.steeringRandom(), this.maxSpeed * timeDiff / 2));
			for (let i = 0; i < mts.guardian.marks.length; ++i) {
				direction = mts.addVelocities(direction, mts.steeringFlee(this, mts.guardian.marks[i], 200));
			}
			if (mts.survivors.length > 0) {
				direction = mts.addVelocities(direction, mts.steeringFlee(this, mts.survivors[mts.findNearest(this, mts.survivors).index], 500));
			}
			this.velocity = mts.addVelocities(this.velocity, direction);
			this.velocity = mts.normalizeVelocity(this.velocity, this.maxSpeed * timeDiff);

			this.x += this.velocity.x;
			this.y += this.velocity.y;

			if (this.x < 0) this.x += 1351;
			if (this.y < 0) this.y += 760;
			this.x %= 1351;
			this.y %= 760;

			if (Math.abs(this.velocity.x) > Math.abs(this.velocity.y)) {
				if (this.velocity.x < 0) {
					this.animation = 'zombie.left';
				}else {
					this.animation = 'zombie.right';
				}
			}else {
				if (this.velocity.y < 0) {
					this.animation = 'zombie.up';
				}else {
					this.animation = 'zombie.down';
				}
			}
		};

		this.steeringRandom = function() {
			return {x: Math.random() * 2 - 1, y: Math.random() * 2 - 1};
		};
	},

	Survivor: function(x, y) {
		rtge.DynObject.call(this);
		this.x = x;
		this.y = y;
		this.z = 2;
		this.animation = 'survivor.down';
		this.anchorX = 25;
		this.anchorY = 100;

		this.velocity = {x: 0, y: 0};
		this.maxSpeed = 100;

		this.tick = function(timeDiff) {
			timeDiff /= 1000.;

			if (mts.zombies.length > 0) {
				zombie = mts.findNearest(this, mts.zombies);
				if (zombie.distance !== null && zombie.distance < 25) {
					mts.gameover(this, mts.zombies[zombie.index]);
				}
			}

			var direction = {x: 0, y: 0};
			direction = mts.addVelocities(direction, this.steeringChase());
			for (let i = 0; i < mts.guardian.marks.length; ++i) {
				direction = mts.addVelocities(direction, mts.steeringFlee(this, mts.guardian.marks[i], 200));
			}

			this.velocity = mts.addVelocities(this.velocity, direction);
			this.velocity = mts.normalizeVelocity(this.velocity, this.maxSpeed * timeDiff);

			this.x += this.velocity.x;
			this.y += this.velocity.y;

			if (this.x < 0) this.x += 1351;
			if (this.y < 0) this.y += 760;
			this.x %= 1351;
			this.y %= 760;

			if (Math.abs(this.velocity.x) > Math.abs(this.velocity.y)) {
				if (this.velocity.x < 0) {
					this.animation = 'survivor.left';
				}else {
					this.animation = 'survivor.right';
				}
			}else {
				if (this.velocity.y < 0) {
					this.animation = 'survivor.up';
				}else {
					this.animation = 'survivor.down';
				}
			}
		};

		this.steeringChase = function() {
			var res = {x: 0, y: 0};

			nearest_zombie = mts.findNearest(this, mts.zombies);
			if (nearest_zombie.index !== null) {
				res = mts.computeDirectVector(this, mts.zombies[nearest_zombie.index]);
				res = mts.normalizeVelocity(res, Math.min(200. / nearest_zombie.distance, 1.));
			}

			return res;
		};
	},

	findNearest: function(from, entities) {
		res = {index: null, distance: null};
		for (let i = 0; i < entities.length; ++i) {
			entity_distance = mts.computeDistance(entities[i], from);
			if (res.index == null || entity_distance < res.distance) {
				res.index = i;
				res.distance = entity_distance;
			}
		}
		return res;
	},

	steeringFlee: function(actor, fleeFrom, distanceMax) {
		var fleeDirection = mts.multiplyVelocity(mts.computeDirectVector(actor, fleeFrom), -1.);
		var pointDistance = mts.computeMagnitude(fleeDirection);
		if (pointDistance < distanceMax) {
			return mts.normalizeVelocity(fleeDirection, Math.min(Math.pow(50., 10) / Math.pow(pointDistance, 10), 1.));
		} else {
			return {x:0, y:0};
		}
	},

	Guardian: function(x, y) {
		rtge.DynObject.call(this);
		this.x = x;
		this.y = y;
		this.z = 2;
		this.animation = 'guardian.down';
		this.anchorX = 50;
		this.anchorY = 100;

		this.direction = {x: 0, y: -1};
		this.maxSpeed = 350;

		this.marks = [];

		this.tick = function(timeDiff) {
			timeDiff /= 1000.;
			this.x += this.direction.x * this.maxSpeed * timeDiff;
			this.y += this.direction.y * this.maxSpeed * timeDiff;

			if (this.x < 0) this.x += 1351;
			if (this.y < 0) this.y += 760;
			this.x %= 1351;
			this.y %= 760;

			if (this.marks.length == 0 || mts.computeDistance(this.marks[this.marks.length - 1], this) >= 30) {
				let mark = {x: this.x, y: this.y};
				this.marks.push(mark);
				if (this.marks.length > 50) {
					this.marks.shift();
				}
			}

			if (Math.abs(this.direction.x) > Math.abs(this.direction.y)) {
				if (this.direction.x < 0) {
					this.animation = 'guardian.left';
				}else {
					this.animation = 'guardian.right';
				}
			}else {
				if (this.direction.y < 0) {
					this.animation = 'guardian.up';
				}else {
					this.animation = 'guardian.down';
				}
			}
		};
	},

	SpawnSpot: function(x, y) {
		rtge.DynObject.call(this);
		this.x = x;
		this.y = y;
		this.z = 1;
		this.animation = 'spawn';
		this.anchorX = 50;
		this.anchorY = 50;

		this.timer = 5000;
		this.tick = function(timeDiff) {
			this.timer -= timeDiff;
			if (this.timer <= 0) {
				rtge.removeObject(this);
				mts.spawns.splice(mts.spawns.indexOf(this), 1);
				var entity;
				if (Math.random() >= .5) {
					entity = new mts.Zombie(this.x, this.y);
					mts.zombies.push(entity);
				}else {
					entity = new mts.Survivor(this.x, this.y);
					mts.survivors.push(entity);
				}
				rtge.addObject(entity);
			}
		};
	},

	keydown: function(e) {
		if (mts.state == 'not-started') {
			mts.init();
			document.getElementById('intro').style.display = 'none';
			mts.state = 'running';
		}else if (mts.state == 'running') {
			var k = e.key.toLowerCase();
			if (k == 'arrowup' || k == 'z' || k == 'w') {
				mts.guardian.direction = {x: 0, y: -1};
			}
			if (k == 'arrowdown' || k == 's') {
				mts.guardian.direction = {x: 0, y: 1};
			}
			if (k == 'arrowleft' || k == 'q' || k == 'a') {
				mts.guardian.direction = {x: -1, y: 0};
			}
			if (k == 'arrowright' || k == 'd') {
				mts.guardian.direction = {x: 1, y: 0};
			}
		}
	},

	addVelocities: function(v1, v2) {
		return {x: v1.x + v2.x, y: v1.y + v2.y};
	},

	normalizeVelocity: function(velocity, magnitude) {
		var currentMagnitude = mts.computeMagnitude(velocity);
		var ratio = magnitude / currentMagnitude;
		return mts.multiplyVelocity(velocity, ratio);
	},

	multiplyVelocity: function(velocity, scalar) {
		return {x: velocity.x * scalar, y: velocity.y * scalar};
	},

	computeMagnitude: function(velocity) {
		return Math.sqrt(Math.pow(velocity.x, 2) + Math.pow(velocity.y, 2));
	},

	computeDirectVector: function(point1, point2) {
		var x_direct = point2.x - point1.x;
		var y_direct = point2.y - point1.y;
		var x_right = (point2.x + 1351) - point1.x;
		var y_right = (point2.y + 760) - point1.y;
		var x_left = (point2.x - 1351) - point1.x;
		var y_left = (point2.y - 760) - point1.y;
		var x, y;
		if (Math.abs(x_direct) <= Math.abs(x_right) && Math.abs(x_direct) <= Math.abs(x_left)) {
			x = x_direct;
		}else if (Math.abs(x_right) <= Math.abs(x_left)) {
			x = x_right;
		}else {
			x = x_left;
		}
		if (Math.abs(y_direct) <= Math.abs(y_right) && Math.abs(y_direct) <= Math.abs(y_left)) {
			y = y_direct;
		}else if (Math.abs(y_right) <= Math.abs(y_left)) {
			y = y_right;
		}else {
			y = y_left;
		}
		return {x: x, y: y};
	},

	computeDistance: function(point1, point2) {
		return mts.computeMagnitude(mts.computeDirectVector(point1, point2));
	},

	gameover: function(survivor, zombie) {
		// Oponnents face themselves
		if (Math.abs(survivor.x - zombie.x) > Math.abs(survivor.y - zombie.y)) {
			if (survivor.x < zombie.x) {
				survivor.animation = 'survivor.right';
				zombie.animation = 'zombie.left';
			}else {
				survivor.animation = 'survivor.left';
				zombie.animation = 'zombie.right';
			}
		}else {
			if (survivor.y < zombie.y) {
				survivor.animation = 'survivor.down';
				zombie.animation = 'zombie.up';
			}else {
				survivor.animation = 'survivor.up';
				zombie.animation = 'zombie.down';
			}
		}

		// Pause the game
		for (let i = 0; i < mts.zombies.length; ++i) {
			mts.zombies[i].tick = null;
		}
		for (let i = 0; i < mts.survivors.length; ++i) {
			mts.survivors[i].tick = null;
		}
		for (let i = 0; i < mts.spawns.length; ++i) {
			mts.spawns[i].tick = null;
		}
		mts.guardian.tick = null;
		mts.state = 'paused';

		// Show game over screen
		var gameoverScreen = document.getElementById('gameover');
		var scoreField = document.getElementById('score_cnt');

		scoreField.innerHTML = '' + (mts.zombies.length + mts.survivors.length);
		gameoverScreen.style.display = '';
	},

	drawBarrier: function(canvasCtx) {
		if (mts.guardian.marks.length > 0) {
			canvasCtx.lineWidth = 30;
			var path = new Path2D();
			path.moveTo(mts.guardian.marks[0].x, mts.guardian.marks[0].y);
			for (let i = 1; i < mts.guardian.marks.length; ++i) {
				let orig = {x: mts.guardian.marks[i-1].x, y: mts.guardian.marks[i-1].y};
				let dest = {x: mts.guardian.marks[i].x, y: mts.guardian.marks[i].y};
				let moveTo = {x: orig.x, y: orig.y};
				let drawTo = {x: dest.x, y: dest.y};
				if (Math.abs(dest.x - orig.x) > 1351/2) {
					moveTo.x = (dest.x < 1351/2 ? 0 : 1351);
					drawTo.x = (dest.x < 1351/2 ? 1351 : 0);
				}
				if (Math.abs(dest.y - orig.y) > 760/2) {
					moveTo.y = (dest.y < 760/2 ? 0 : 760);
					drawTo.y = (dest.y < 760/2 ? 760 : 0);
				}
				if (moveTo.x != orig.x || moveTo.y != orig.y) {
					path.lineTo(drawTo.x, drawTo.y);
					path.moveTo(moveTo.x, moveTo.y);
				}
				path.lineTo(mts.guardian.marks[i].x, mts.guardian.marks[i].y);
			}
			mts.strokeBarrierLine(canvasCtx, path);
		}
	},

	strokeBarrierLine: function(canvasCtx, path) {
		canvasCtx.strokeStyle = "rgba(0, 255, 160, .4)";
		canvasCtx.lineWidth = 20 + Math.random() * 2;
		canvasCtx.stroke(path);

		canvasCtx.strokeStyle = "rgba(200, 255, 255, .4)";
		canvasCtx.lineWidth = 5 + Math.random() * 2;
		canvasCtx.stroke(path);
	},
};
