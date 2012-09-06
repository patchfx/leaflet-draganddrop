/*
 * L.DragAndDropMarker is used to make L.Markers draggable outside of map container.
 */

L.DragAndDropMarker = L.Marker.extend({
	defaults: {
		draganddrop: true
	},

	initialize: function (latlng, options) {
		options = L.Util.extend({}, this.defaults, options);
		// Can't have both drag and drop enabled as well as draggable
		options.draggable = !options.draganddrop ? options.draggable : false;

		L.Marker.prototype.initialize.call(this, latlng, options);
	},

	_initInteraction: function () {
		L.Marker.prototype._initInteraction.call(this);

		if (L.Handler.DragAndDropMarkerDrag) {
			this.dragging = new L.Handler.DragAndDropMarkerDrag(this, this.options);

			if (this.options.draganddrop) {
				this.dragging.enable();
			}
		}
	}
});