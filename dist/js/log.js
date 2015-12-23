function Log () {
    var self = this;
    this.elt = $(".log .content");
};
Log.prototype.out = function(message, level, date) {
    level = level || "info";
    date = date || Date.now();
    //this.store( { message:message, level:level, date:date});
    var now = new Date(date);
    var sDate = now.toLocaleString("fr-FR", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false
    });
    this.elt.prepend(
        $("<div/>")
            .addClass("entry clearfix")
            .addClass(level)
            .append( $("<div/>").addClass("date").html(sDate) )
            .append( $("<div/>").addClass("message").html(message) )
    );

};
Log.prototype.info = function(message) {
    this.out('<i class="fa fa-fw fa-info"></i> '+message, "info");
};
Log.prototype.debug = function(message) {
    this.out('<i class="fa fa-fw fa-cogs"></i> '+message, "debug");
};
Log.prototype.warning = function(message) {
    this.out('<i class="fa fa-fw fa-exclamation-circle"></i> '+message, "warning");
};
Log.prototype.danger = function(message) {
    this.out('<i class="fa fa-fw fa-exclamation-triangle"></i> '+message, "danger");
};
var $log = new Log();
