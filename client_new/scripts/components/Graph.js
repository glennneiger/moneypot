define([
    'lib/clib',
    'lib/lodash'
], function(
    Clib,
    _
){

    //TODO: Clean this file

    function Graph(width, height) {
        //Canvas settings
        console.assert(width && height);
        this.canvasWidth = width;
        this.canvasHeight = height;

        //Plotting Settings
        this.plotWidth = this.canvasWidth - 30;
        this.plotHeight = this.canvasHeight - 20;
        this.xStart = this.canvasWidth - this.plotWidth;
        this.yStart = this.canvasHeight - this.plotHeight;
        this.XAxisPlotMinValue = 10000;    //10 Seconds
        this.YAxisSizeMultiplier = 2;    //YAxis is x times
        this.YAxisInitialPlotValue = "zero"; //"zero", "betSize"
    }

    Graph.prototype.resize = function(width, height) {

        this.canvasWidth = width;
        this.canvasHeight = height;

        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;

        //Plotting Settings
        this.plotWidth = this.canvasWidth - 30;
        this.plotHeight = this.canvasHeight - 20; //280
        this.xStart = this.canvasWidth - this.plotWidth;
        this.yStart = this.canvasHeight - this.plotHeight;
        this.XAxisPlotMinValue = 10000;    //10 Seconds
        this.YAxisSizeMultiplier = 2;    //YAxis is x times
        this.YAxisInitialPlotValue = "zero"; //"zero", "betSize"
    };

    Graph.prototype.setData = function(ctx, canvas, engine) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.engine = engine;
        this.gameState = engine.gameState;

        this.cashingOut = engine.cashingOut;
        //this.lastWinnings = lastWinnings; //The payout of the last game

        //this.lostConnection = lostConnection; //Changed to lag

        this.lag = engine.lag;

        //this.crashedAt = crashedAt; //Text displaying the crashed amount
        //this.currentCash = currentCash; // Text displaying the current payout

        //this.playersCashedOut = playersCashedOut; //Array to render circles in the players cash out positions

        this.startTime = engine.startTime;

        this.currentTime = Clib.getElapsedTimeWithLag(engine);
        this.currentGamePayout = Clib.calcGamePayout(this.currentTime);

        return this.currentGamePayout;
    };

    Graph.prototype.calculatePlotValues = function() {

        //Plot variables
        this.YAxisPlotMinValue = this.YAxisSizeMultiplier;
        this.YAxisPlotValue = this.YAxisPlotMinValue;

        this.XAxisPlotValue = this.XAxisPlotMinValue;

        //Adjust X Plot's Axis
        if(this.currentTime > this.XAxisPlotMinValue)
            this.XAxisPlotValue = this.currentTime;

        //Adjust Y Plot's Axis
        if(this.currentGamePayout > this.YAxisPlotMinValue)
            this.YAxisPlotValue = this.currentGamePayout;

        //We start counting from cero to plot
        this.YAxisPlotValue-=1;

        //Graph values
        this.widthIncrement = this.plotWidth / this.XAxisPlotValue;
        this.heightIncrement = this.plotHeight / (this.YAxisPlotValue);
        this.currentX = this.currentTime * this.widthIncrement;
    };

    Graph.prototype.clean = function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    };

    Graph.prototype.drawGraph = function() {

        /* Style the line depending on the game states */
        //this.ctx.strokeStyle = "Black";
        this.ctx.strokeStyle = "#b0b3c1";
        //if(this.lastGameWon) {
        if(this.engine.currentlyPlaying()) { //playing and not cashed out
            this.ctx.lineWidth=6;
            this.ctx.strokeStyle = '#7cba00';
        } else if(this.cashingOut) {
            this.ctx.lineWidth=6;
            //this.ctx.strokeStyle = "Grey";
        } else {
            this.ctx.lineWidth=4;
        }

        //var greenSetted = false;

        this.ctx.beginPath();
        //this.ctx.moveTo(this.xStart, this.plotHeight - (this.betSizeAdj * this.heightIncrement));
        Clib.seed(1);

        /* Draw the graph */
        for(var t=0, i=0; t <= this.currentTime; t+= 100, i++) {

            /* Graph */
            var payout = Clib.calcGamePayout(t)-1; //We start counting from one x
            var y = this.plotHeight - (payout * this.heightIncrement);
            var x = t * this.widthIncrement;
            this.ctx.lineTo(x + this.xStart, y);

            /* Draw green line if last game won */ //TODO: Avoid doing the code above this if it will do this
            /*var realPayout = Clib.payout(this.betSize, t);
             if(this.lastGameWon && (Clib.payout(this.betSize, t) > this.lastWinnings) && !greenSetted) {
             var tempStroke = this.ctx.strokeStyle;
             this.ctx.strokeStyle = '#7cba00';
             this.ctx.stroke();

             this.ctx.beginPath();
             this.ctx.lineWidth=3;
             this.ctx.moveTo(x + this.xStart, y);
             this.ctx.strokeStyle = tempStroke;
             greenSetted = true;
             }*/

            /* Avoid crashing the explorer if the cycle is infinite */
            if(i > 5000) {console.log("For 1 too long!");break;}
        }
        this.ctx.stroke();

    };

    Graph.prototype.drawAxes = function() {

        //Function to calculate the plotting values of the Axes
        function stepValues(x) {
            console.assert(_.isFinite(x));
            var c = .4;
            var r = .1;
            while (true) {

                if (x <  c) return r;

                c *= 5;
                r *= 2;

                if (x <  c) return r;
                c *= 2;
                r *= 5;
            }
        }

        //Calculate Y Axis
        this.YAxisPlotMaxValue = this.YAxisPlotMinValue;
        this.payoutSeparation = stepValues(!this.currentGamePayout ? 1 : this.currentGamePayout);

        this.ctx.lineWidth=1;
        //this.ctx.strokeStyle = "Black";
        this.ctx.strokeStyle = "#b0b3c1";
        this.ctx.font="10px Verdana";
        //this.ctx.fillStyle = 'black';
        this.ctx.fillStyle = "#b0b3c1";

        this.ctx.textAlign="center";

        //Draw Y Axis Values
        var heightIncrement =  this.plotHeight/(this.YAxisPlotValue);
        for(var payout = this.payoutSeparation, i = 0; payout < this.YAxisPlotValue; payout+= this.payoutSeparation, i++) {
            var y = this.plotHeight - (payout*heightIncrement);
            this.ctx.fillText((payout+1)+'x', 10, y);

            this.ctx.beginPath();
            this.ctx.moveTo(this.xStart, y);
            this.ctx.lineTo(this.xStart+5, y);
            this.ctx.stroke();

            if(i > 100) { console.log("For 3 too long"); break; }
        }

        //Calculate X Axis
        this.milisecondsSeparation = stepValues(this.XAxisPlotValue);
        this.XAxisValuesSeparation = this.plotWidth / (this.XAxisPlotValue/this.milisecondsSeparation);

        //Draw X Axis Values
        for(var miliseconds = 0, counter = 0, i = 0; miliseconds < this.XAxisPlotValue; miliseconds+=this.milisecondsSeparation, counter++, i++) {
            var seconds = miliseconds/1000;
            var textWidth = this.ctx.measureText(seconds).width;
            var x = (counter*this.XAxisValuesSeparation) + this.xStart;
            this.ctx.fillText(seconds, x - textWidth/2, this.plotHeight + 11);

            if(i > 100) { console.log("For 4 too long"); break; }
        }

        //Draw background Axis
        this.ctx.lineWidth=1;
        this.ctx.beginPath();
        this.ctx.moveTo(this.xStart, 0);
        this.ctx.lineTo(this.xStart, this.canvasHeight - this.yStart);
        this.ctx.lineTo(this.canvasWidth, this.canvasHeight - this.yStart);
        this.ctx.stroke();
    };



    Graph.prototype.drawGameData = function() {

        //Percentage of canvas width
        var onePercent = this.canvasWidth/100;
        function fontSizeNum(times) {
            return onePercent * times;
        }
        function fontSizePx(times) {
            var fontSize = fontSizeNum(times);
            return fontSize.toFixed(2) + 'px';
        }


        this.ctx.textAlign="center";
        this.ctx.textBaseline = 'middle';


        if(this.engine.gameState === 'IN_PROGRESS') {
            var pi = (this.engine.username)? this.engine.playerInfo[this.engine.username]: null; //TODO: Abstract this on engine virtual store?

            if (pi && pi.bet && !pi.stopped_at)
                this.ctx.fillStyle = '#7cba00';
            else
                //this.ctx.fillStyle = "black";
                this.ctx.fillStyle = "#b0b3c1";

            this.ctx.font = fontSizePx(20) + " Verdana";
            this.ctx.fillText(parseFloat(this.currentGamePayout).toFixed(2) + 'x', this.canvasWidth/2, this.canvasHeight/2);
        }

        //If the engine enters in the room @ ENDED it doesn't have the crash value, so we don't display it
        if(this.engine.gameState === 'ENDED') {
            this.ctx.font = fontSizePx(15) + " Verdana";
            this.ctx.fillStyle = "red";
            this.ctx.fillText('Busted', this.canvasWidth/2, this.canvasHeight/2 - fontSizeNum(15)/2);
            this.ctx.fillText('@ ' + Clib.formatDecimals(this.engine.tableHistory[0].game_crash/100, 2) + 'x', this.canvasWidth/2, this.canvasHeight/2 + fontSizeNum(15)/2);
        }

        //if(this.lag) {
        //    this.ctx.fillStyle = "black";
        //    this.ctx.font="20px Verdana";
        //    this.ctx.fillText('Network Lag', 250, 250);
        //}

    };

    return Graph;
});