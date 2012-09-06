/*
 * L.Droppable represents a drop container.
 */

L.Droppable = L.Class.extend({
	initialize: function (element) { //HTMLElement
		this._element = element;
		this.measureElement();
	},

	measureElement: function () {
		this._dimensions = L.DomUtil.dimensions(this._element);
		this._offset = L.DomUtil.offset(this._element);
	},

	getElement: function () {
		return this._element;
	},

	isOver: function (cursorPoint) {
		var l = this._offset.x, r = l + this._dimensions.width,
			t = this._offset.y, b = t + this._dimensions.height;

		return cursorPoint.x > l && cursorPoint.x < r && cursorPoint.y > t && cursorPoint.y < b;
	}
});