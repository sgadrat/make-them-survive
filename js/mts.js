var mts = {
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
		var objects = [
			new mts.Zombie(100, 100),
			new mts.Zombie(1250, 100),
			new mts.Zombie(1250, 660),
			new mts.Zombie(100, 660),
			new mts.Zombie(1250, 660),
			new mts.Zombie(1250, 660),
			new mts.Zombie(1250, 660),
			new mts.Zombie(1250, 660),
			new mts.Zombie(1250, 660),
			new mts.Zombie(1250, 660),
			new mts.Zombie(100, 660),
			new mts.Zombie(100, 660),
			new mts.Zombie(100, 660),
			new mts.Zombie(100, 660),
			new mts.Zombie(100, 660),
			new mts.Zombie(100, 660),
		];
		var camera = new rtge.Camera();
		//camera.x = 675;
		//camera.y = 380;

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

	addVelocities: function(v1, v2) {
		return {x: v1.x + v2.x, y: v1.y + v2.y};
	},

	normalizeVelocity: function(velocity, magnitude) {
		var currentMagnitude = Math.sqrt(Math.pow(velocity.x, 2) + Math.pow(velocity.y, 2));
		var ratio = magnitude / currentMagnitude;
		return mts.multiplyVelocity(velocity, ratio);
	},

	multiplyVelocity: function(velocity, scalar) {
		return {x: velocity.x * scalar, y: velocity.y * scalar};
	},
};
