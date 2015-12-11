function Log () {
    var self = this;
    this.elt = $(".log .content");
    this.db = null;
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: "readwrite"}; // This line should only be needed if it is needed to support the object's constants for older browsers
    window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
    if (!window.indexedDB) {
        $log.danger("Vous pouvez changer de navigateur :-) !");
        return;
    }
    this.db = window.indexedDB.open("LogDB", 3);
    this.db.onsuccess = function(event) {
        $log.debug("DB OK> ",event.toString());
    };
    this.db.onsuccess = function(event) {
        $log.debug("DB OK> ",event.toString());
    };

    var logEntry = [
        { message: "", level:"", date:0 }
    ];
    this.db.onupgradeneeded = function(event) {
        var db = event.target.result;
        var objectStore = db.createObjectStore("logEntries", {keyPath: "line"});
        objectStore.createIndex("level", "level", {unique: false});
        objectStore.createIndex("date", "date", {unique: false});
        self.info("La base de donnée est initialisée.");
    };
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
Log.prototype.toggle = function() {
    $(".log .content").fadeToggle( function() {
        if ($(".log .toggle .open").hasClass("show")) {
            $(".log .toggle .open").removeClass("show").addClass("hide");
            $(".log .toggle .closed").removeClass("hide").addClass("show");
        } else {
            $(".log .toggle .closed").removeClass("show").addClass("hide");
            $(".log .toggle .open").removeClass("hide").addClass("show");
        }
    });
//    if ($(this).find(".show").css("display"))
};
var $log = new Log();
$(".log .toggle").on("click", function() {
    $log.toggle();
})
