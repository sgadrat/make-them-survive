var mts = {
	zombies: [],
	survivors: [],

	init: function() {
		var graphics = [
			'img/guardian.png',
			'img/scene.jpg',
			'img/survivor.png',
			'img/zombie.png',
		];
		var animations = {};
		animations['zombie'] = new rtge.Animation();
		animations['zombie'].steps = ['img/zombie.png'];
		animations['zombie'].durations = [600000];
		animations['survivor'] = new rtge.Animation();
		animations['survivor'].steps = ['img/survivor.png'];
		animations['survivor'].durations = [600000];
		mts.zombies = [
			new mts.Zombie(100, 100),
		];
		mts.survivors = [
			new mts.Survivor(1250, 660),
		];
		var objects = mts.zombies.concat(mts.survivors);
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
				'globalTick': mts.globalTick
			},
			camera
		);
	},

	globalTick: function(timeDiff) {
	},

	Zombie: function(x, y) {
		rtge.DynObject.call(this);
		this.x = x;
		this.y = y;
		this.z = 1;
		this.animation = 'zombie';

		this.velocity = {x: 0, y: 0};
		this.maxSpeed = 100;

		this.tick = function(timeDiff) {
			timeDiff /= 1000.;
			var direction = {x: 0, y: 0};
			direction = mts.addVelocities(direction, mts.multiplyVelocity(this.steeringRandom(), this.maxSpeed * timeDiff / 2));
			this.velocity = mts.addVelocities(this.velocity, direction);
			this.velocity = mts.normalizeVelocity(this.velocity, this.maxSpeed * timeDiff);

			this.x += this.velocity.x;
			this.y += this.velocity.y;

			if (this.x < 0) this.x += 1351;
			if (this.y < 0) this.y += 760;
			this.x %= 1351;
			this.y %= 760;
		};

		this.steeringRandom = function() {
			return {x: Math.random() * 2 - 1, y: Math.random() * 2 - 1};
		};
	},

	Survivor: function(x, y) {
		rtge.DynObject.call(this);
		this.x = x;
		this.y = y;
		this.z = 1;
		this.animation = 'survivor';

		this.velocity = {x: 0, y: 0};
		this.maxSpeed = 150;

		this.tick = function(timeDiff) {
			timeDiff /= 1000.;
			var direction = {x: 0, y: 0};
			direction = mts.addVelocities(direction, mts.multiplyVelocity(this.steeringChase(), this.maxSpeed * timeDiff / 2));
			this.velocity = mts.addVelocities(this.velocity, direction);
			this.velocity = mts.normalizeVelocity(this.velocity, this.maxSpeed * timeDiff);

			this.x += this.velocity.x;
			this.y += this.velocity.y;

			if (this.x < 0) this.x += 1351;
			if (this.y < 0) this.y += 760;
			this.x %= 1351;
			this.y %= 760;
		};

		this.steeringChase = function() {
			var res = {x: 0, y: 0};

			nearest_zombie = null;
			nearest_zombie_distance = null;
			for (let i = 0; i < mts.zombies.length; ++i) {
				zombie_distance = mts.computeDistance(mts.zombies[i], this);
				if (nearest_zombie == null || zombie_distance < nearest_zombie_distance) {
					nearest_zombie = i;
					nearest_zombie_distance = zombie_distance;
				}
			}

			if (nearest_zombie !== null) {
				res = mts.computeDirectVector(this, mts.zombies[nearest_zombie]);
				res = mts.normalizeVelocity(res, Math.min(200. / nearest_zombie_distance, 1.));
			}

			return res;
		};
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
};
