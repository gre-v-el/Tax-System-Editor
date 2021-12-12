//-------------------------------SHORT FUNCTIONS-----------------------------\\
function lerp(x, y, a) {
	return x * (1 - a) + y * a;
}

function serp(x, y, a) {
	var b = a * a * (3 - 2 * a);
	return lerp(x, y, b);
}

function clamp(a, min = 0, max = 1) {
	return Math.min(max, Math.max(min, a));
}

function invlerp(x, y, a) {
	return clamp((a - x) / (y - x));
}

function map(x1, y1, x2, y2, a) {
	return lerp(x2, y2, invlerp(x1, y1, a));
}


//----------------------------------STRUCTS----------------------------------\\
function Threshold(threshold, percentage) {
	this.threshold = Math.round(threshold * 100) / 100;
	this.percentage = Math.round(percentage * 100) / 100;
}


//----------------------------------CONTEXTS---------------------------------\\
var graph = document.getElementById("salary-graph");
var graphCtx = graph.getContext("2d");

var vertScale = document.getElementById("vertical-scale");
var vertCtx = vertScale.getContext("2d");

var horScale = document.getElementById("horizontal-scale");
var horCtx = horScale.getContext("2d");

var thresholdsHolder = document.getElementById("thresholds-holder");


//------------------------------GLOBAL VARIABLES-----------------------------\\
// mouse
var clicked = false;
var prevMouseX;
var prevMouseY;
var mouseX;
var mouseY;

// animation 
var animationScaleID;
var animationScale0;
var animationScaleTime0;
var animationScale1;
var animationScaleTime1;

var animationBarsID;
var animationBars0;
var animationBarsTime0;
var animationBars1;
var animationBarsTime1;

// graph drawing
var scale = 0.1;
var barWidth;

var currency = "USD";
var bars = [];
var max;

var minSalary = 2750 * 12;
var barCount = 200;
var barIter = 450 * 12;

// thresholds
var thresholds = [new Threshold(0, 17),
new Threshold(85528, 32),
new Threshold(1000000, 4),];

// tools
var randomAmount = 10;

var linearLeft = 110;
var linearRight = 10;

var exponentialLeft = 110;
var exponentialRight = 1;

var normalizePeople = 16555;

//-------------------------------EVENT LISTENERS-----------------------------\\
document.addEventListener("mousedown", setOutcomes);
document.addEventListener("mouseup", setOutcomes);
window.addEventListener("resize", setSize);
document.getElementById("click-space").addEventListener("mousedown", e => {
	clicked = true;
	mouseX = e.pageX - graph.offsetLeft;
	mouseY = e.pageY - graph.offsetTop;
	prevMouseX = mouseX;
	prevMouseY = mouseY;
	updateGraph();
	redrawGraph();
});
document.addEventListener("mousemove", e => {
	if (clicked) {
		prevMouseX = mouseX;
		prevMouseY = mouseY;
		mouseX = e.pageX - graph.offsetLeft;
		mouseY = e.pageY - graph.offsetTop;
		updateGraph();
		redrawGraph();
	}
});
document.addEventListener("mouseup", e => {
	clicked = false;

	var newScale = graph.height / max * 3 / 4;
	newScale = Math.min(Math.max(0.1, newScale), 100);
	animateScale(newScale, 200);

});

function sliderinput(value, id) {
	thresholds[id].percentage = value;

	document.getElementById("percentage-bar-" + id).style.width = value + "%";
	document.getElementById("threshold-percentage-" + id).innerHTML = thresholds[id].percentage + "%";
}

function numberinput(value, id) {
	thresholds[id].threshold = parseInt(Math.round(value));
	resetThresholds();
}

//-----------------------------------TOOLS-----------------------------------\\
// graph tools
document.getElementById("button-randomize").addEventListener("click", e => {
	var newBars = [];
	var maxNewBar = 0;
	for (var i = 0; i < bars.length; i++) {
		newBars.push(bars[i] * lerp(1 / (1 + randomAmount / 100), 1 * (1 + randomAmount / 100), Math.random())); // (Math.random()*(randomAmount/100)+(1-randomAmount/200)));
		if (newBars[i] > maxNewBar)
			maxNewBar = newBars[i];
	}
	animateBars(newBars, 500);

	calcMax();

	var newScale = graph.height / maxNewBar * 3 / 4;
	newScale = Math.min(Math.max(0.1, newScale), 100);
	animateScale(newScale, 500);
});

document.getElementById("button-linear").addEventListener("click", e => {
	var newBars = [];
	var maxNewBar = 0;
	for (var i = 0; i < bars.length; i++) {
		newBars.push(lerp(linearLeft, linearRight, invlerp(0, barCount, i)));
		if (newBars[i] > maxNewBar)
			maxNewBar = newBars[i];
	}
	animateBars(newBars, 800);

	calcMax();

	var newScale = graph.height / maxNewBar * 3 / 4;
	newScale = Math.min(Math.max(0.1, newScale), 100);
	animateScale(newScale, 800);
});

document.getElementById("button-exponential").addEventListener("click", exponential);
function exponential() {
	var newBars = [];
	var maxNewBar = 0;
	for (var i = 0; i < bars.length; i++) {
		newBars.push(Math.pow(exponentialLeft / exponentialRight, -i / bars.length) * exponentialLeft);
		if (newBars[i] > maxNewBar)
			maxNewBar = newBars[i];
	}
	animateBars(newBars, 800);

	calcMax();

	var newScale = graph.height / maxNewBar * 3 / 4;
	newScale = Math.min(Math.max(0.1, newScale), 100);
	animateScale(newScale, 800);
}

document.getElementById("button-normalize").addEventListener("click", normalize);
function normalize() {

	var allPeople0 = 0;
	for (var i = 0; i < bars.length; i++) {
		allPeople0 += bars[i];
	}

	var multiplier = normalizePeople / allPeople0;


	var newBars = [];
	var maxNewBar = 0;
	for (var i = 0; i < bars.length; i++) {
		newBars.push(bars[i] * multiplier);
		if (newBars[i] > maxNewBar)
			maxNewBar = newBars[i];
	}
	animateBars(newBars, 800);


	calcMax();

	var newScale = graph.height / maxNewBar * 3 / 4;
	newScale = Math.min(Math.max(0.1, newScale), 100);
	animateScale(newScale, 800);
}

// threshold tools
document.getElementById("threshold-add").addEventListener("click", e => {
	var newThreshold = new Threshold(Math.round(thresholds[thresholds.length - 1].threshold * 1.5), thresholds[thresholds.length - 1].percentage);
	thresholds.push(newThreshold);
	resetThresholds();
});

document.getElementById("threshold-remove").addEventListener("click", e => {
	thresholds.pop();
	resetThresholds();
});

//---------------------------------ANIMATIONS--------------------------------\\
function calcMax() {
	max = bars[0];
	for (var i = 1; i < bars.length; i++) {
		if (bars[i] > max) max = bars[i];
	}
}

function animateScale(newScale, duration) {
	clearInterval(animationScaleID);
	animationScaleID = setInterval(animateScaleFrame, 20);

	animationScale0 = scale;
	animationScaleTime0 = Date.now();
	animationScale1 = newScale;
	animationScaleTime1 = Date.now() + duration;
}

function animateScaleFrame() {
	if (Date.now() > animationScaleTime1) {
		clearInterval(animationScaleID);
		scale = animationScale1;
		setOutcomes();
	}
	else {
		scale = serp(animationScale0, animationScale1, invlerp(animationScaleTime0, animationScaleTime1, Date.now()));
		redrawGraph();
	}
}


function animateBars(newBars, duration) {
	clearInterval(animationBarsID);
	animationBarsID = setInterval(animateBarsFrame, 20);

	animationBars0 = bars;
	animationBarsTime0 = Date.now();
	animationBars1 = newBars;
	animationBarsTime1 = Date.now() + duration;
}

function animateBarsFrame() {
	if (Date.now() > animationBarsTime1) {
		clearInterval(animationBarsID);
		bars = animationBars1;
		calcMax();
	}
	else {
		for (var i = 0; i < animationBars1.length; i++) {
			bars[i] = serp(animationBars0[i], animationBars1[i], invlerp(animationBarsTime0, animationBarsTime1, Date.now()));
		}
		redrawGraph();
	}
}


//---------------------------------UPDATE BARS-------------------------------\\
function updateGraph() {
	mouseX = clamp(mouseX, 0, graph.width - 1);
	mouseY = clamp(mouseY, 0, graph.height - 1);

	var previd = Math.floor(prevMouseX / graph.width * bars.length);
	var id = Math.floor(mouseX / graph.width * bars.length);

	if (previd == id)
		bars[id] = (graph.height - mouseY) / scale;

	else      // bar skipping -> interpolate
	{
		if (id > previd)
			for (var i = previd; i < id; i++) {
				bars[i] = (graph.height - lerp(prevMouseY, mouseY, (i - previd) / (id - previd))) / scale;
			}

		else
			for (var i = previd; i > id; i--) {
				var a = (i - previd) / (id - previd);
				bars[i] = (graph.height - lerp(prevMouseY, mouseY, invlerp(previd, id, i))) / scale;
			}
	}


	bars.length = barCount;


	calcMax();
}


//----------------------------------DRAW GRAPH-------------------------------\\
function redrawGraph() {
	// bars
	graphCtx.clearRect(0, 0, graph.width, graph.height);
	vertCtx.clearRect(0, 0, vertScale.width, vertScale.height);
	horCtx.clearRect(0, 0, horScale.width, horScale.height);

	barWidth = graph.width / bars.length;

	for (var i = 0; i < bars.length; i++) {
		graphCtx.beginPath();
		graphCtx.rect(i * barWidth, graph.height, Math.max(barWidth - Math.max(barWidth / 4, 1), 1), -bars[i] * scale);
		graphCtx.fill();
	}

	// vertical scale
	var linesValIncrements = Number(((graph.height * 3 / 4 / scale)) / 7).toPrecision(1);
	var linesPxIncrements = linesValIncrements * scale;

	for (var i = 0; i < vertScale.height; i += linesPxIncrements) {
		vertCtx.beginPath();
		vertCtx.moveTo(0, vertScale.height - i - 1);
		vertCtx.lineTo(50, vertScale.height - i - 1);
		vertCtx.stroke();

		vertCtx.fillText((Math.round(i / linesPxIncrements * linesValIncrements * 1000) / 1000).toLocaleString(), 5, vertScale.height - i - 4);
	}

	// horizontal scale
	var linesBarIncrements = Math.floor(horScale.width / horCtx.measureText("000000").width / 2);
	linesPxIncrements = Math.ceil(horScale.width / linesBarIncrements / barWidth) * barWidth;
	var linesBarIncrements = linesPxIncrements / barWidth;

	for (var i = 0; i < horScale.width; i += linesPxIncrements) {
		horCtx.beginPath();
		horCtx.moveTo(i + Math.max(barWidth - Math.max(barWidth / 4, 1), 1) / 2 - 2, 0);
		horCtx.lineTo(i + Math.max(barWidth - Math.max(barWidth / 4, 1), 1) / 2 - 2, 50);
		horCtx.stroke();

		horCtx.fillText(Math.round(minSalary + linesBarIncrements * i / linesPxIncrements * barIter).toLocaleString(), 5 + i + Math.max(barWidth - Math.max(barWidth / 4, 1), 1) / 2, 40);
	}

}


//------------------------------------SETUP----------------------------------\\
for (var i = 0; i < barCount; i++) {
	bars.push(Math.floor(Math.random() * 90) + 10);
}
exponential();
setOutcomes();

//--------------------------------SET AND RESET------------------------------\\
function setSize() {
	// managing width
	graph.width = document.getElementById("graph-space").offsetWidth - 53;
	horScale.width = document.getElementById("graph-space").offsetWidth - 53;

	// gradient
	var gradient = graphCtx.createLinearGradient(0, 0, graph.width, graph.height);

	gradient.addColorStop(0.0, "rgb(255, 0, 40)");
	gradient.addColorStop(0.5, "rgb(255, 0, 255)");
	gradient.addColorStop(1.0, "rgb(0, 100, 255)");

	graphCtx.fillStyle = gradient;

	//text for scales
	vertCtx.font = "100 12px Arial";
	horCtx.font = "12px Arial";
	vertCtx.strokeStyle = "white";
	horCtx.strokeStyle = "white";
	vertCtx.fillStyle = "white";
	horCtx.fillStyle = "white";

	redrawGraph();
}

function resetThresholds() {
	if (thresholds.length == 0) {
		thresholds.push(new Threshold(0, 0));
	}


	thresholdsHolder.innerHTML = "";
	for (var i = 0; i < thresholds.length - 1; i++) {
		//<input style="z-index: 2;" type="number" value="${thresholds[i].threshold}" min="0" step="1">${currency}
		thresholdsHolder.innerHTML += `

    <div id="threshold-unit-${i}" class="threshold-unit">
      <div id="percentage-bar-${i}" class="percentage-bar" style="width: ${thresholds[i].percentage}%;"></div>
      <input type="range" min="0" max="100" value="${thresholds[i].percentage}" class="percentage-slider" oninput="sliderinput(this.value, ${i})">
      <span id="threshold-text-${i}" style="display: block; text-align: left; margin-left: 90px;">
        <input style="z-index: 2;" type="number" value="${thresholds[i].threshold}" min="0" step="1" onblur="numberinput(this.value, ${i})">${currency} - 
        ${thresholds[i + 1].threshold.toLocaleString()} ${currency} <br>
      </span>
      <span id="threshold-percentage-${i}">${thresholds[i].percentage}%</span>
    </div>

    `;
	}
	var i = thresholds.length - 1;
	thresholdsHolder.innerHTML += `

    <div id="threshold-unit-${i}" class="threshold-unit">
      <div id="percentage-bar-${i}" class="percentage-bar" style="width: ${thresholds[i].percentage}%;"></div>
      <input type="range" min="0" max="100" value="${thresholds[i].percentage}" class="percentage-slider" oninput="sliderinput(this.value, ${i})">
      <span id="threshold-text-${i}">
        ><input style="z-index: 2;" type="number" value="${thresholds[i].threshold}" min="0" step="1" onblur="numberinput(this.value, ${i})">${currency} <br>
      </span>
      <span id="threshold-percentage-${i}">${thresholds[i].percentage}%</span>
    </div>

  `;
}


//-----------------------------------SET OUTCOMES--------------------------------\\
function setOutcomes() {
	var stateIncome = 0;
	var sumWage = 0;
	var sumPeople = 0;
	for (var i = 0; i < bars.length; i++) {

		var avgSalary = minSalary + (i+0.5)*barIter;
		var salarySummed = avgSalary*bars[i];
		var threshold = thresholds.length-1;
		for (let i = 0; i < thresholds.length-1; i++) {
			if(thresholds[i].threshold < avgSalary && thresholds[i+1].threshold >= avgSalary){
				threshold = i;
			}
		}


		stateIncome += salarySummed*thresholds[threshold].percentage/100;

		sumWage += salarySummed;
		sumPeople += bars[i]*1000;
	}

	document.getElementById("state-income").innerHTML = Math.round(stateIncome).toLocaleString() + " K " + currency;
	document.getElementById("average-wage").innerHTML = Math.round(sumWage/sumPeople).toLocaleString() + " K " + currency;

	
	var medianWage = 0;
	sumPeople/=2;
	for (var i = 0; i < bars.length; i++) {
		sumPeople -= bars[i]*1000;
		if(sumPeople < 0) {
			medianWage = (minSalary + (i+0.5)*barIter)/1000;
			break;
		}
	}
	document.getElementById("median-wage").innerHTML = Math.round(medianWage).toLocaleString() + " K " + currency;

}


//------------------------------------MODALS---------------------------------\\
// randomize settings
var modalRandom = document.getElementById("modal-randomize");
var btnRandom = document.getElementById("settings-randomize");
var spanRandom = document.getElementsByClassName("close")[0];

btnRandom.addEventListener("mousedown", e => {
	modalRandom.style.display = "block";
});
spanRandom.addEventListener("mousedown", e => {
	modalRandom.style.display = "none";
});
window.addEventListener("mousedown", e => {
	if (e.target == modalRandom) {
		modalRandom.style.display = "none";
	}
});

document.getElementById("input-0-randomize").addEventListener("input", e => {
	var input = parseInt(e.target.value, 10);

	if (input > 99) e.target.value = 99;
	if (input < 1) e.target.value = 1;

	randomAmount = parseInt(e.target.value, 10);
});

// linear settings
var modalLinear = document.getElementById("modal-linear");
var btnLinear = document.getElementById("settings-linear");
var spanLinear = document.getElementsByClassName("close")[1];

btnLinear.addEventListener("mousedown", e => {
	modalLinear.style.display = "block";
});
spanLinear.addEventListener("mousedown", e => {
	modalLinear.style.display = "none";
});
window.addEventListener("mousedown", e => {
	if (e.target == modalLinear) {
		modalLinear.style.display = "none";
	}
});

document.getElementById("input-0-linear").addEventListener("input", e => {
	var input = parseInt(e.target.value, 10);
	if (input < 1) e.target.value = 1;

	linearLeft = parseInt(e.target.value, 10);
});
document.getElementById("input-1-linear").addEventListener("input", e => {
	var input = parseInt(e.target.value, 10);
	if (input < 1) e.target.value = 1;



	linearRight = parseInt(e.target.value, 10);
});

// exponential settings
var modalExponential = document.getElementById("modal-exponential");
var btnExponential = document.getElementById("settings-exponential");
var spanExponential = document.getElementsByClassName("close")[2];

btnExponential.addEventListener("mousedown", e => {
	modalExponential.style.display = "block";
});
spanExponential.addEventListener("mousedown", e => {
	modalExponential.style.display = "none";
});
window.addEventListener("mousedown", e => {
	if (e.target == modalExponential) {
		modalExponential.style.display = "none";
	}
});

document.getElementById("input-0-exponential").addEventListener("input", e => {
	var input = parseInt(e.target.value, 10);
	if (input < 1) e.target.value = 1;

	exponentialLeft = parseInt(e.target.value, 10);
});
document.getElementById("input-1-exponential").addEventListener("input", e => {
	var input = parseInt(e.target.value, 10);
	if (input < 1) e.target.value = 1;

	exponentialRight = parseInt(e.target.value, 10);
});

// normalize settings
var modalNormalize = document.getElementById("modal-normalize");
var btnNormalize = document.getElementById("settings-normalize");
var spanNormalize = document.getElementsByClassName("close")[3];

btnNormalize.addEventListener("mousedown", e => {
	modalNormalize.style.display = "block";
});
spanNormalize.addEventListener("mousedown", e => {
	modalNormalize.style.display = "none";
});
window.addEventListener("mousedown", e => {
	if (e.target == modalNormalize) {
		modalNormalize.style.display = "none";
	}
});

document.getElementById("input-0-normalize").addEventListener("input", e => {
	var input = parseInt(e.target.value, 10);
	if (input < 1) e.target.value = 1;

	normalizePeople = parseInt(e.target.value, 10);
});