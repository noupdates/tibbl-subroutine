/*jshint esversion: 8 */


export default class Tangible {

    constructor() {
        this.variableContainer = {};
        this.variableIncrementer = 0;
        this.commands = {
            "LOOP": "Loop",
            "ENDLOOP": "End Loop",
            "PLAY": "Play",
            "DEFINE": "Define",
            "RUNFUNCTION": "Run Function",
            "SAY": "Say",
            "RETURN": "Return",
            "IF": "If",
            "ELSE": "Else",
            "LET" : "Let",
        };
        // Code library for translations
        // Will be made into its getter/setter
        this.codeLibrary = {
            31: this.commands.PLAY,
            47: "Delay",
            55: this.commands.LOOP,
            59: this.commands.ENDLOOP,
            103: "0",
            107: "1",
            109: "2",
            115: "3",
            117: "4",
            121: "5",
            143: "6",
            151: "7",
            155: "8",
            157: "9",
            167: "A",
            171: "B",
            173: "C",
            179: "D",
            181: "E",
            185: "F",
            199: "G",
            203: "H",
            205: "I",
            211: "J",
            213: "K",
            217: "L",
            227: "M",
            229: "N",
            233: "O",
            241: "P",
            271: "Q",
            279: "R",
            282: "S",
            285: "T",
            295: "U",
            299: "V",
            301: "W",
            307: "X",
            309: "Y",
            313: "Z",
            327: this.commands.DEFINE,
            331: this.commands.RUNFUNCTION,
            333: this.commands.RETURN,
            339: this.commands.SAY,
            341: "+",
            345: "-",
            355: "*",
            357: "/",
            361: this.commands.IF,
            369: this.commands.ELSE,
            391: "==",
            395: "<",
            397: ">",
            409: "!=",
            419: this.commands.LET,
            421: "=",
            // 403, 405, 409, 419, 421, 425, 433, 453, 457
        };
        this.topcodeHeight = 40;
        this.topcodeWidth = 100;
        this.variableIncrementer = 0;
		this.mode = "environment";
        this.declarations = "";
        // Codes currently seen
        this.currentCodes = [];
        this.soundSets = {
            GimmeGimmeGimme: [["A","B","C","D"],['challenge1','challenge2']],
            EyeOfTheTiger: [["A","B","C","D"],['challenge1','challenge2']],
            DoctorFoster: [["A","B","C","D","E","F"],['']],
            JingleBells: [["A","B","C","D","E","F"],['challenge1']],
            Limerick1: [["A","B","C","D","E","F","G","H"],['challenge1']],
            Limerick2: [["A","B","C","D","E","F","G"],['']],
            Limerick3: [["A","B","C","D","E"],['challenge1']],
            Poem: [["A","B","C","D","E","F","G","H"],['']],
            Popcorn: [["A","B","C","D"],['challenge1']],
            RowYourBoat: [["A","B","C","D","E","F","G","H"],['challenge1']],
            Story: [["A","B","C","D","E","F","G","H"],['challenge1']]
        }
    }

    /** Loads assets and data for this set of tiles
     *
     *
     */
    preloads(soundSet) {
		var soundsTemp = {};
		this.soundSets[soundSet][0].forEach(function(element) {
    	soundsTemp[element] = new Audio("/tangible-11ty/assets/sound/"+soundSet+"/"+element+".mp3");
		});
		document.getElementById("challenges").innerHTML = '';
		let challenge = 1;
		if (this.soundSets[soundSet][1] != ''){
		this.soundSets[soundSet][1].forEach(function(element) {
		document.getElementById("challenges").innerHTML += "<h3>Challenge "+challenge+"</h3><audio controls><source src='/tangible-11ty/assets/sound/"+soundSet+"/"+element+".mp3' type='audio/mpeg'></audio>";
		challenge += 1;
		});
		};
		
		this.sounds = soundsTemp;
    }

    playAudio(audio) {
     return new Promise(res => {
            audio.play();
            audio.onended = res;
        });
    }

    /**
     Set the video canvas to the right aspect ratio
     */
    setVideoCanvasHeight(canvasId) {
        let canvas = document.getElementById(canvasId);
        let heightRatio = 1.5;
        canvas.height = canvas.width * heightRatio;
    }


    /**
     Parse the topcodes that are found.  Each item in the array topCodes has:
     x,y coordinates found and code: the int of topcode
     @param topCodes Found codes
     @return text translations of code
     */
    parseCodesAsText(topCodes) {
        let outputString = "";
        let grid = this.sortTopCodesIntoGrid(topCodes);
        for (let i = 0; i < grid.length; i++) {
            for (let x = 0; x < grid[i].length; x++) {
                outputString += this.codeLibrary[grid[i][x].code] + ", X:" + grid[i][x];
            }
            outputString += "<br/>\n";
        }

        return outputString;
    }

    /** Sort topcodes into a grid using x,y coordinates
     *
     * @param topCodes to sort
     * @return multi-dimensional grid array
     */
    sortTopCodesIntoGrid(topCodes) {
        // Sort topcodes by y, then x
        topCodes.sort(this.sortTopCodeComparator.bind(this));
        //console.log(topCodes);
        let grid = [];
        let line = Array();
        let currentY = -1;
        // loop through, add lines as y changes
        for (let i = 0; i < topCodes.length; i++) {
            if (currentY >= 0 && topCodes[i].y - currentY >= this.topcodeHeight) {
                // New line
                grid.push(line);
                line = Array();
                currentY = topCodes[i].y;
            } else if (currentY < 0) {
                currentY = topCodes[i].y;
            }
            line.push(topCodes[i]);
        }
        // Add last line and return
        grid.push(line);
        return grid;
    }

    /**
     * Sort the top codes y ascending
     * X DESCENDING because the video is mirrorer
     * @param a
     * @param b
     * @return {number}
     */
    sortTopCodeComparator(a, b) {

        if (Math.abs(a.y - b.y) <= this.topcodeHeight) {
            // same line
            if (a.x == b.x) {
                return 0;
            }
            if (a.x < b.x) {
                return 1;
            }
            return -1;
        }
        // Different lines
        if (a.y < b.y) {
            return -1;
        }
        return 1;
    }

    /**
     Parse topcodes as javascript.  Each item in the array topCodes has:
     x,y coordinates found and code: the int of topcode
     @param topCodes Found codes
     @return text translations of code
     */
    parseCodesAsJavascript(topCodes) {

        let outputJS = "";
        let grid = this.sortTopCodesIntoGrid(topCodes);
        //console.log(grid);
        for (let i = 0; i < grid.length; i++) {
            outputJS += this.parseTopCodeLine(grid[i]);
        }
        /*for (let i = 0; i < topCodes.length; i++) {
            if (topCodes[i].code in this.codeLibrary){
                outputJS += this.codeLibrary[topCodes[i].code] + " ";

            }
        }*/
        return outputJS;
    }


    parseTopCodeLine(line) {
        //this.codeLibrary[grid[i][x].code]
        let lineJS = "\n";
        let i = 0;
        while (i < line.length) {
            let parsedCode = this.codeLibrary[line[i].code];
            console.log(parsedCode);
            switch (parsedCode) {
                case this.commands.LOOP:
                    // See if we've got a number next
                    if (line.length > i + 1) {
                        let nextSymbol = this.codeLibrary[line[i + 1].code];
                        if (parseInt(nextSymbol)) {
                            lineJS += "for (let x" + this.variableIncrementer + "=0; x" + this.variableIncrementer + " < " + nextSymbol + "; x" + this.variableIncrementer + "++){";
                            this.variableIncrementer += 1;
                            i += 1;
                        }
                    } else {
                        //console.log("ERROR: No increment or bad increment for for loop!");
                    }
                    break;
                case this.commands.ENDLOOP:
                    lineJS += "} \n";
                    break;
                case this.commands.PLAY:
                    if (line.length > i + 1) {
                        let letter = this.codeLibrary[line[i + 1].code];
                        lineJS += "await context.playAudio(context.sounds." + letter + ");\n";
                        //lineJS += "await new Promise(r => setTimeout(resolve, this.sounds." + letter + ".duration * 100));";
                    }
                    lineJS += "";
                    break;
                case this.commands.DEFINE:
                    // change to define, and add save function
                    let parameters = [];
                    let k = i + 1;
                    while (k < line.length) {
                        // Check if the current code is a command
                        let parameter = this.codeLibrary[line[k].code];

                        if (Object.keys(this.commands).includes(parameter)) {
                            break; 
                        }

                        parameters.push(parameter);
                        k++; 
                    }
                    let parametersText = "";
                    if (parameters.length > 0){
                        for (let param of parameters) {
                            parametersText += param + ", ";
                        }
                        lineJS += "async function myFunction(" + parametersText + "){";
                    } else {
                        lineJS += "async function myFunction(){";
                    }
                    
                    break;
                case this.commands.RUNFUNCTION:
                    let previousSymbol;
                    if (i > 0) {
                        previousSymbol = this.codeLibrary[line[i - 1].code];
                    }
                    if (previousSymbol=="Say") break;

                    let argumentsFunc = [];
                    let l = i + 1;
                    while (l < line.length) {
                        // Check if the current code is a command
                        let argument = this.codeLibrary[line[l].code];

                        // If it's a command, break the loop
                        if (Object.keys(this.commands).includes(argument)) {
                            break; 
                        }


                        argumentsFunc.push(argument);
                        l++; 
                    }
                    let argumentsFuncText = "";
                    if (argumentsFunc.length > 0){
                        for (let args of argumentsFunc) {
                            argumentsFuncText += args + " ";
                        }
                        lineJS += "await myFunction(" + argumentsFuncText + ");";
                    } else {
                        lineJS += "await myFunction();";
                        
                    }
                    break;
                case this.commands.SAY:
                    let lettersToSpeak = [];
                    let j = i + 1;

                    while (j < line.length) {
                        let currentCode = this.codeLibrary[line[j].code];
                        // Check if the current code is a variable and get its value if it exists
                        if (this.variableContainer.hasOwnProperty(currentCode)) {
                            lettersToSpeak.push(this.variableContainer[currentCode]); // Use the variable value
                        } else {
                            lettersToSpeak.push(currentCode); // Use the literal value
                        }
                        j++;
                    }

                    let letters = lettersToSpeak.join('');

                    if (letters.includes("Run Function")) {
                        lineJS += "let res = await myFunction(";
                        let callParameters = "";
                        for (let letter of lettersToSpeak.slice(1)) {
                            callParameters += letter + ",";
                        }
                        lineJS+=callParameters + "); \n";
                        lineJS += "window.speechSynthesis.speak(new SpeechSynthesisUtterance(res)); \n";

                    } else {
                        lineJS += "window.speechSynthesis.speak(new SpeechSynthesisUtterance('" + letters + "')); \n";
                    }

                    lineJS += "window.speechSynthesis.resume(); \n";
                    break;
                case this.commands.RETURN:
                    let codesToReturn = [];

                    let h = i + 1;

                    // Loop through the line array starting from the next index
                    while (h < line.length) {
                        // Check if the current code is a command
                        let currentCode = this.codeLibrary[line[h].code];
                        console.log(`Current Code: ${currentCode}`)

                        // If it's a command, break the loop
                        if (currentCode.includes("Run Function")) {
                            break; 
                        }

                        codesToReturn.push(currentCode);
                        h++; 
                    }

                    // peech synthesis commands for all collected letters
                    let codes = "";
                    for (let code of codesToReturn) {
                        codes += code;
                    }
                    lineJS += "return " + codes;
                    break;   
                case this.commands.IF:
                    // Initialize an array to hold the condition parts
                    let conditionParts = [];
                    let c = i + 1; // Start checking from the next line
                
                    // Loop to gather parts of the condition
                    while (c < line.length) {
                        let part = this.codeLibrary[line[c].code];
                        
                        // Check if the part is a valid code
                        if (part) {
                            conditionParts.push(part);
                            c++;
                        } else {
                            break; // Exit if no valid part is found
                        }
                    }
                
                    // Join the condition parts into a single condition string
                    if (conditionParts.length > 0) {
                        lineJS += "if (" + conditionParts.join(" ") + ") { \n"; // Join with spaces
                        i = c - 1; // Update i to the last processed line
                    } else {
                        console.log("ERROR: No valid conditions provided for if statement!");
                    }
                    break;
                case this.commands.ELSE:
                    lineJS += "} else { \n"; 
                    break;
                case this.commands.LET:
                    let variableAssignments = [];
                    let a = i + 1;

                    while (a < line.length) {
                        let variableName = this.codeLibrary[line[a].code];

                        if (Object.keys(this.commands).includes(variableName)) {
                            break;
                        }

                        if (variableName) {
                            if (line[a + 1] && this.codeLibrary[line[a + 1].code] === '=') {
                                let valueOrExpression = this.codeLibrary[line[a + 2].code];
                                variableAssignments.push(`${variableName} = ${valueOrExpression}`);
                                this.variableContainer[variableName] = valueOrExpression; // Store the variable value
                                a += 2;
                            } else {
                                variableAssignments.push(variableName);
                            }
                        }
                        a++;
                    }

                    if (variableAssignments.length > 0) {
                        lineJS += "let " + variableAssignments.join(", ") + ";\n";
                    } else {
                        console.log("ERROR: No valid variable assignments provided for let statement!");
                    }
                    break;
                                                  
            }
            i += 1;
        }
        //console.log(lineJS);
        return lineJS;
    }

    // await new Promise(resolve => setTimeout(resolve, 1500));

    async evalTile(tileCode, context) {
        //console.log(tileCode);

        eval('(async (context) => {"use strict";' + tileCode + '})(context)');
        return true;
    }


    async runCode() {
        this.variableContainer = {};
        if (this.currentCodes && this.currentCodes.length > 0) {
            let parsedJS = this.declarations + this.parseCodesAsJavascript(this.currentCodes);
            //console.log(parsedJS);
            let parsedText = this.parseCodesAsText(this.currentCodes);
            document.getElementById("codes").innerHTML = parsedText;
            document.getElementById("result").innerHTML = parsedJS;
            //parsedJS = "await this.playAudio(this.sounds.A); await this.playAudio(this.sounds.B); return true";
            let parsedLines = [];
            parsedLines.push(this.evalTile(parsedJS, this));
            let done = await Promise.all(parsedLines);
        }
    }

    setupTangible() {
        //add
        //this.setVideoCanvasHeight('video-canvas');
        let tangible = this;
        // register a callback function with the TopCode library
        TopCodes.setVideoFrameCallback("video-canvas", function (jsonString) {
            // convert the JSON string to an object
            var json = JSON.parse(jsonString);
            // get the list of topcodes from the JSON object
            var topcodes = json.topcodes;
            //console.log(topcodes);
            // obtain a drawing context from the <canvas>
            var ctx = document.querySelector("#video-canvas").getContext('2d');
            // draw a circle over the top of each TopCode
            //document.querySelector("#codes").innerHTML = '';
            ctx.fillStyle = "rgba(255, 0, 0, 0.3)";   // very translucent red
            for (let i = 0; i < topcodes.length; i++) {
                ctx.beginPath();
                ctx.arc(topcodes[i].x, topcodes[i].y, topcodes[i].radius, 0, Math.PI * 2, true);
                ctx.fill();
                ctx.font = "26px Arial";
                ctx.fillText(topcodes[i].code, topcodes[i].x, topcodes[i].y);
                //console.log(topcodes[i].code +', x:'+topcodes[i].x, topcodes[i].y)
                //document.querySelector("#result").innerHTML += '<br/>' + topcodes[i].code + ', x:' + topcodes[i].x + ', y:' + topcodes[i].y;
            }

            //document.querySelector("#result").innerHTML = tangible.parseCodesAsText(topcodes);
            tangible.currentCodes = topcodes;
            tangible.once = true;


        }, this);

        // Setup buttons
        //console.log(document.getElementById('run'));
        let runButton = document.getElementById('run');
        runButton.onclick = function () {
            this.runCode();
        }.bind(this);
        
        let switchBtn = document.getElementById('switch-view');
        switchBtn.onclick = function () {
        	TopCodes.stopVideoScan('video-canvas');
        	if (this.mode === "user") {
        		this.mode = "environment";
        	} else {
        		this.mode = "user";
        	}
        	TopCodes.startStopVideoScan('video-canvas',this.mode);
        }.bind(this);
        
        let cameraBtn = document.getElementById('camera-button');
        cameraBtn.onclick = function () {
            TopCodes.startStopVideoScan('video-canvas',this.mode);
        }.bind(this);
        
        let setSelect = document.getElementById('soundSets');
        setSelect.onchange = function () {
        	this.preloads(setSelect.value);
        }.bind(this);

        // Run preloads
        this.preloads("GimmeGimmeGimme");
        
        
        
    }

}