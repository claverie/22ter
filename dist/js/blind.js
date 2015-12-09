function Blind(id) {
    this.param = {
        interval: 30,  // => computed from data-blind-delay on blind (in seconds)
        step:30  // step per second
    };
    this.timer = null;
    var $current = $("#" + id + ".blind");
    if ($current.length === 0) {
        console.log("Blind [#" + id + ".blind" + "] not found.");
    }
    this.param.step = typeof $current.data('blind-step') !== "undefined" ? parseInt($current.data('blind-step')) : this.param.step;
    this.param.interval = typeof $current.data('blind-delay') !== "undefined" ? parseInt($current.data('blind-delay')*1000)/this.param.step : this.param.step;
    $current.html('<div class="blind-concrete"><div class="blind-line"></div><div class="blind-line"></div><div class="blind-line"></div><div class="blind-line"></div><div class="blind-line"></div><div class="blind-line"></div><div class="blind-line"></div></div>');
    this.me = $("#" + id + ".blind > .blind-concrete");
    var open = $current.data("blind-state") === "open";
    if ($current.data("blind-state") === "open") this.raised();
    else if ($current.data("blind-state") === "closed") this.lowered();
    else this.middle();
    return this;
};
Blind.prototype.cancelMove = function() {
    if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
    }
    return this;
};
Blind.prototype.move = function(to) {
    var self = this;
    var start = null;
    var base = parseInt(this.me.attr("data-position"));
    $(".position").html(base);
    var direction = 0;
    if (base > to) direction = -1;
    else if (base < to) direction = 1;
    else {
        this.cancelMove();
        return this;
    };
    var nextPosition = Math.floor(base + (direction * (100/this.param.step)));
    if (nextPosition < 0 || nextPosition > 100) {
        this.cancelMove();
        return this;
    }
    this.me.each( function() {
        $(this).css({bottom:nextPosition+"%"});
        self.me.attr("data-position",nextPosition);
        self.timer = setTimeout( function() {
            self.move(to);
        }, self.param.interval);
    });
    return this;
};
Blind.prototype.lowered = function() {
    return this.me.attr("data-position", "0").css({"bottom":"0"});
};
Blind.prototype.raised = function() {
    return this.me.attr("data-position", "100").css({"bottom":"100%"});
};
Blind.prototype.middle = function() {
    return this.me.attr("data-position", "50").css({"bottom":"50%"});
};
Blind.prototype.down = function() {
    return this.cancelMove().move(0);
};
Blind.prototype.my = function() {
    if (this.timer) {
        this.cancelMove();
    } else {
        this.cancelMove().move(50);
    }
    return this;
};
Blind.prototype.up = function() {
    return this.cancelMove().move(100);
};
var Blinds = function() {
    $blinds = [];
    $(".blind").each( function() {
        if ($(this).attr("id") === "undefined") {
            console.log("Please, set an Id to "+$(this));
            return;
        } else {
            $blinds[$(this).attr("id")] = new Blind($(this).attr("id"));
        }
    });
    return $blinds;
};