const gameFile = await fetch("/gameData.json");
const gameData = await gameFile.json();

class Drawable {
	constructor(content) {
		this.content = content;

		this.x = 0.00;
		this.y = 0.00;

		this.w = 0.00;
		this.h = 0.00;

		this.ax = 0.00;
		this.ay = 0.00;
	}

	setAnchor(ax, ay) {
		this.ax = ax;
		this.ay = ay;
		return this;
	}

	setPos(x, y) {
		this.x = x;
		this.y = y;
		return this;
	}

	setDims(w, h) {
		this.w = w;
		this.h = h;
		return this;
	}

	setStyles(styles = {}) {
		this.styles = styles;
		return this;
	}

	draw() {
		console.log(`default draw method for ${this.constructor.name}`);
	};
}

class UI_Image extends Drawable {
	setLayout(layout) {
		this.layout = layout;
		return this;
	}

	draw() {
		let ratio = this.content.width / this.content.height;

		switch (this.layout) {
			case "Fit":
				if (this.w / ratio < this.h) {
					this.w = this.w;
					this.h = this.w / ratio;
				} else {
					this.w = this.h * ratio;
					this.h = this.h;
				}
				break;
			case "Fill":
				if (this.w / ratio > this.h) {
					this.w = this.w;
					this.h = this.w / ratio;
				} else {
					this.w = this.h * ratio;
					this.h = this.h;
				}
				break;
			default:
				break;

		}

		renderer.drawImage(this.content, this.x, this.y, this.w, this.h, this.ax, this.ay);

	}
}

class UI_Text extends Drawable {
	draw() {
		renderer.drawText(this.content, this.styles, this.x, this.y, this.w, this.h, this.ax, this.ay);
	}
}

class UI_Button extends Drawable {
	setCallback(callback) {
		this.callback = callback;
		return this;
	}

	draw() {
		renderer.drawButton(this.content, this.callback, this.x, this.y, this.w, this.h, this.ax, this.ay);
	}
}

class UI_Rect extends Drawable {
	draw() {
		renderer.drawRect(this.styles, this.x, this.y, this.w, this.h, this.ax, this.ay);
	}
}

class Renderer {
	constructor(canvasQuerySelector, bgQuerySelector, contentQuerySelector) {
		this.canvas = document.querySelector(canvasQuerySelector);
		this.background = document.querySelector(bgQuerySelector);
		this.content = document.querySelector(contentQuerySelector);

		this.ctx = this.canvas.getContext("2d");
		this.bgCtx = this.background.getContext("2d");

		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		this.background.width = window.innerWidth;
		this.background.height = window.innerHeight;

		this.w = canvas.width;
		this.h = canvas.height;

		this.bgSrc = null;
		this.bgChanged = false;

		this.elements = [];
	}

	drawImage(image, x, y, w, h, ax = 0, ay = 0) {
		this.ctx.drawImage(image, x * this.w - ax * w * this.w, y * this.h - ay * h * this.h, w * this.w, h * this.h);
	}

	drawRect(style, x, y, w, h, ax = 0, ay = 0) {
		this.ctx.save();

		this.ctx.fillStyle = style;
		this.ctx.fillRect(x * this.w - ax * w * this.w, y * this.h - ay * h * this.h, w * this.w, h * this.h);

		this.ctx.restore();
	}

	drawText(text, styles = {}, x, y, w, h, ax = 0, ay = 0) {
		let paragraph = document.createElement("p");

		/* Intentionally insecure to allow text styling (I"m lazy and this is the easiest option) */
		paragraph.innerHTML = text;

		paragraph.style.position = "absolute";
		paragraph.style.left = `${x * this.w}px`;
		paragraph.style.top = `${y * this.h}px`;
		if (w > 0) {
			paragraph.style.width = `${w * this.w}px`;
		}
		if (h > 0) {
			paragraph.style.height = `${h * this.h}px`;
		}
		paragraph.style.transform = `translate(-${ax * 100}%, -${ay * 100}%)`;

		for (const style in styles) {
			paragraph.style[style] = styles[style];
		}

		this.content.append(paragraph);
	}

	drawButton(text, callback, x, y, w = 0, h = 0, ax = 0.5, ay = 0.5) {
		let button = document.createElement("button");

		button.textContent = text;
		button.onclick = callback;

		button.style.position = "absolute";
		button.style.left = `${x * this.w}px`;
		button.style.top = `${y * this.h}px`;
		if (w > 0) {
			button.style.width = `${w * this.w}px`;
		}
		if (h > 0) {
			button.style.height = `${h * this.h}px`;
		}
		button.style.transform = `translate(-${ax * 100}%, -${ay * 100}%)`;

		this.content.append(button);
	}

	add(element) {
		this.elements.push(element);
	}

	setBG(bg) {
		this.bgSrc = bg;
		this.bgChanged = true;
	}

	resizeScreen() {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		this.background.width = window.innerWidth;
		this.background.height = window.innerHeight;

		this.w = canvas.width;
		this.h = canvas.height;

		/* Needed to redraw background after a resize */
		this.bgChanged = true;

		this.render();
	}

	render() {
		this.clear();

		if (this.bgSrc && this.bgChanged) {
			this.bgCtx.drawImage(this.bgSrc.content, 0, 0, this.w, this.h);
			this.bgChanged = false;
		}

		for (let element of this.elements) {
			element.draw();
		}
	}

	resetScene() {
		this.elements = [];
	}

	clear() {
		this.ctx.clearRect(0, 0, this.w, this.h);
		this.content.replaceChildren();
	}
}

window.onresize = () => {
	renderer.resizeScreen();
};

/* Javascript doesn't have static variables so this needs to be global */
const imgCache = new Map();

async function getImage(url, allow_cached = true) {
	if (allow_cached && imgCache.has(url)) {
		return imgCache.get(url);
	}

	let img = new Image();
	img.src = url;

	let result = await new Promise((resolve, reject) => {
		img.onload = () => {
			imgCache.set(url, img);
			resolve(img);
		};
		img.onerror = (err) => {
			reject(err);
		}
	});

	return result
}

function getImgUrl(url, width = 0, height = 0) {
	if (width == 0) {
		width = window.innerWidth;
	} else {
		width = width * window.innerWidth;
	}

	if (height == 0) {
		height = window.innerHeight;
	} else {
		height = height * window.innerHeight;
	}

	let size = Math.max(width, height);

	let variant = "";

	if (size <= 360) {
		variant = "sm";
	} else if (size <= 720) {
		variant = "md";
	} else {
		variant = "lg";
	}

	let dotIndex = url.lastIndexOf(".");

	if (dotIndex === -1) {
		return url;
	}

	let newUrl = url.substring(0, dotIndex) + `.${variant}` + url.substring(dotIndex);

	return newUrl;
}

// Initialize a global renderer that is used to draw UI elements
const renderer = new Renderer("#canvas", "#background", "#content");

// Start the game
handleScene(gameData[0]["id"]);

// Preload images and cache them,
// a quick hack to improve performance
//prefetchImgs();

function handleScene(sceneId) {
	let scene = getSceneById(sceneId);

	if (scene["next"]) {
		prefetchImages(getSceneById(scene["next"]));
	} else if (scene["type"] === "choiceScene") {
		for (let choice of scene["choices"]) {
			prefetchImages(getSceneById(choice["next"]));
		}
	}

	switch (scene["type"]) {
		case "startScene":
			startScene(scene);
			break;
		case "dialogScene":
			dialogScene(scene);
			break;
		case "speechScene":
			speechScene(scene);
			break;
		case "choiceScene":
			choiceScene(scene);
			break;
		case "documentScene":
			documentScene(scene);
			break;
		case "infoScene":
			infoScene(scene);
			break;
		case "textScene":
			textScene(scene);
			break;
		case "endScene":
			endScene(scene);
			break;

		default:
			console.log(`Unknown scene type: ${scene["type"]}`);
			break;
	}
}

async function startScene(scene) {
	renderer.resetScene();

	//let bg = await getImage("/images/thumbnail.png");
	//renderer.setBG(new UI_Image(bg).setPos(0, 0).setDims(1, 1));
	renderer.add(new UI_Rect().setPos(0, 0).setDims(1, 1).setStyles("black"));

	renderer.add(new UI_Text(scene["title"]).setPos(0.5, 0.4).setAnchor(0.5, 1.0).setStyles({ "font-size": "2rem", "text-align": "center" }));

	renderer.add(new UI_Button("Spustit").setCallback(() => { handleScene(scene["next"]); }).setPos(0.5, 0.75).setAnchor(0.5, 0.5));

	renderer.render();
}

async function dialogScene(scene) {
	renderer.resetScene();

	let bg = await getImage(getImgUrl(scene["bg"]));
	renderer.setBG(new UI_Image(bg).setPos(0, 0).setDims(1, 1));

	renderer.render();
	handleScene(scene["next"]);
}

async function speechScene(scene) {
	renderer.resetScene();

	renderer.add(new UI_Rect().setPos(0, 0.75).setDims(1, 0.25).setStyles("black"));

	if (scene["person"] !== "") {
		let person = await getImage(getImgUrl(scene["person"], 0.3, 0.5));
		renderer.add(new UI_Image(person).setPos(0.25, 0.75).setDims(0.3, 0.5).setAnchor(0.5, 1).setLayout("Fit"));
	}

	renderer.add(new UI_Text(`${scene["name"]}:`).setPos(0.25, 0.8).setDims(0.5, 0.05).setAnchor(0, 1));
	renderer.add(new UI_Text(scene["text"]).setPos(0.25, 0.8).setDims(0.5, 0.15).setAnchor(0, 0));

	renderer.add(new UI_Button("Pokračovat").setCallback(() => { handleScene(scene["next"]); }).setPos(0.8, 0.85));
	renderer.render();
}

async function choiceScene(scene) {
	renderer.resetScene();

	renderer.add(new UI_Rect().setPos(0, 0.75).setDims(1, 0.25).setStyles("black"));

	if (scene["person"] !== "") {
		let person = await getImage(getImgUrl(scene["person"], 0.3, 0.5));
		renderer.add(new UI_Image(person).setPos(0.25, 0.75).setDims(0.3, 0.5).setAnchor(0.5, 1).setLayout("Fit"));
	}

	scene["choices"].forEach((choice, index) => {
		renderer.add(new UI_Button(choice["text"]).setCallback(() => { handleScene(choice["next"]); }).setPos(0.5, 0.7525 + index * 0.085).setDims(0.95, 0.075).setAnchor(0.5, 0));
	});

	renderer.render();
}

async function documentScene(scene) {
	renderer.resetScene();

	renderer.add(new UI_Rect().setPos(0, 0).setDims(1, 1).setStyles("#0000007E"));

	renderer.add(new UI_Text(scene["document"]).setPos(0.5, 0.45).setDims(0.4, 0.75).setAnchor(0.5, 0.5).setStyles({ "padding": "0.5em", "backgroundColor": "white", "color": "black" }));

	renderer.add(new UI_Button("Pokračovat").setCallback(() => { handleScene(scene["next"]); }).setPos(0.5, 0.9).setAnchor(0.5, 0));

	renderer.render();
}

async function infoScene(scene) {
	renderer.resetScene();

	renderer.add(new UI_Rect().setPos(0, 0).setDims(1, 1).setStyles("black"));

	let image = await getImage(getImgUrl(scene["image"], 0.8, 0.7));
	renderer.add(new UI_Image(image).setPos(0.5, 0.45).setDims(0.8, 0.7).setAnchor(0.5, 0.5).setLayout("Fit"));

	renderer.add(new UI_Text(scene["text"]).setPos(0.5, 0.85).setDims(0.5, 0.1).setAnchor(0.5, 0));

	renderer.add(new UI_Button("Pokračovat").setCallback(() => { handleScene(scene["next"]); }).setPos(0.8, 0.85).setAnchor(0, 0));

	renderer.render();
}

async function textScene(scene) {
	renderer.resetScene();

	renderer.add(new UI_Rect().setPos(0, 0).setDims(1, 1).setStyles("black"));

	if (scene["date"] !== undefined) {
		renderer.add(new UI_Text(scene["date"]).setPos(0.5, 0.1).setAnchor(0.5, 0).setStyles({ "font-size": "1rem", "color": "gray" }));
	}

	renderer.add(new UI_Text(scene["text"]).setPos(0.5, 0.5).setDims(0.6, 0).setAnchor(0.5, 0.5).setStyles({ "textAlign": "justify", "font-size": "0.825rem", "animation": "fadeIn 0.25s linear" }));

	renderer.add(new UI_Button("Pokračovat").setCallback(() => { handleScene(scene["next"]); }).setPos(0.5, 0.85).setAnchor(0.5, 0));

	renderer.render();
}

async function endScene(scene) {
	renderer.resetScene();


	renderer.add(new UI_Rect().setPos(0, 0).setDims(1, 1).setStyles("black"));

	renderer.add(new UI_Text(scene["title"]).setPos(0.5, 0.5).setDims(0, 0).setAnchor(0.5, 1).setStyles({ "fontSize": "2rem" }));
	renderer.add(new UI_Text(scene["ending"]).setPos(0.5, 0.6).setDims(0, 0).setAnchor(0.5, 0));

	renderer.render();
}

async function prefetchImages(scene) {
	if (scene["bg"]) {
		getImage(getImgUrl(scene["bg"]));
	}
	if (scene["person"]) {
		getImage(getImgUrl(scene["person"]));
	}
	if (scene["image"]) {
		getImage(getImgUrl(scene["image"]));
	}

}

function getSceneById(id) {
	let scene = gameData.find((scene) => scene["id"] == id);

	if (scene !== null) {
		return scene;
	} else {
		return gameData[0];
	}
}
