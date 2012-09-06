/*
 * L.Handler.DragAndDropMarkerDrag is used internally by L.DragAndDropMarker to make the markers draggable outside of map.
 */

L.Handler.DragAndDropMarkerDrag = L.Handler.MarkerDrag.extend({
	options: {
		/* dropManager: L.DropManager [REQUIRED] */
	},

	initialize: function (marker, options) {
		if (!options.dropManager) {
			throw 'options.dropManager must be set.';
		}

		L.Util.setOptions(this, options);

		L.Handler.MarkerDrag.prototype.initialize.call(this, marker);
	},

	addHooks: function () {
		var icon = this._marker._icon;
		if (!this._draggable) {
			this._draggable = new L.Draggable(this.options.dropManager.getDummyIcon(), icon)
				.on('dragstart', this._onDragStart, this)
				.on('drag', this._onDrag, this)
				.on('dragend', this._onDragEnd, this);
			// Handler to update the dropManagers dummy icon position
			this._marker.on('mouseover', this._onOverMarker, this);
		}
		this._draggable.enable();
	},

	_onDragStart: function (e) {
		this._marker._icon.style.display = 'none';
		if (this._marker._shadow) {
			this._marker._shadow.style.display = 'none';
		}

		this.options.dropManager.startDrag();

		this._marker
			.closePopup()
			.fire('movestart')
			.fire('dragstart');
	},

	_onDrag: function (e) {
		var iconPos = e.target._newPos,
			mousePointOffset = e.target._startPoint.subtract(e.target._startPos),
			mousePos = iconPos.add(mousePointOffset);
			
		this.options.dropManager.checkOverDroppable(mousePos);

		this._marker
			.fire('move')
			.fire('drag');
	},

	_onDragEnd: function () {
		this.options.dropManager.stopDrag();

		// Re-show icon and shadow
		this._marker._icon.style.display = 'block';
		if (this._marker._shadow) {
			this._marker._shadow.style.display = 'block';
		}

		this._marker
			.fire('moveend')
			.fire('dragend');
	},

	// This method is require because of the way Leaflet handles dragging an item. The startPos is calculated
	// onmousedown on the drag start target. This means we need to set the Drop Manager's dummy icon position
	// before the mouse down.
	_onOverMarker: function() {
		// Don't set up marker for drag if we are already dragging
		if (this._draggable && this._draggable._moving) {
			return;
		}

		this.options.dropManager.updateDummyIcon(this._marker);
	},

	_checkOverDropContainer: function (curPos) {
		var scrollOffset = new L.Point(document.body.scrollLeft, document.body.scrollTop);
		curPos = curPos.subtract(scrollOffset);

		// Check to see if the mouse is over the drop container, we hide the marker here so we can check the element beneath
		this._dummyMarker.style.display = 'none';
		if (this._dropContainer === document.elementFromPoint(curPos.x, curPos.y)) {
			this._enteredDropContainer = true;
			this._marker.fire('overdropcontainer');
		}
		else if (this._enteredDropContainer) {
			this._enteredDropContainer = false;
			this._marker.fire('leftdropcontainer');
		}
		this._dummyMarker.style.display = 'block';
	}
});