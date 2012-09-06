L.Util.extend(L.DomUtil, {
	supportsBoxModel: (document.compatMode === "CSS1Compat"),

	dimensions: function (element) {
		return {
			width: element.offsetWidth,
			height: element.offsetHeight
		};
	},
	
	offset: function (element) {
		var box = element.getBoundingClientRect(),
			body = document.body,
			docElem = document.documentElement,
			clientTop  = docElem.clientTop  || body.clientTop  || 0,
			clientLeft = docElem.clientLeft || body.clientLeft || 0,
			scrollTop  = window.pageYOffset || this.supportsBoxModel && docElem.scrollTop  || body.scrollTop,
			scrollLeft = window.pageXOffset || this.supportsBoxModel && docElem.scrollLeft || body.scrollLeft,
			top  = box.top  + scrollTop  - clientTop,
			left = box.left + scrollLeft - clientLeft;
		return new L.Point(left, top);
	}
});

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

/*
 * L.DropManager is used to determine if a L.DragAndDropMarker is over a droppable container.
 */

L.DropManager = L.Class.extend({
	options: {
		zIndex: 999
	},

	_droppables: [],

	initialize: function (elements, options) {
		L.Util.setOptions(this, options);

		// Build list of L.Droppable objects
		for (var i = 0, l = elements.length; i < l; i++) {
			this._droppables.push(new L.Droppable(elements[i]));
		}

		// Create the dummy icon, used to display the dragged marker's icon
		this._createDummyIcon();

		// Elements can move when the page is resize, will need to recalculate
		L.DomEvent.on(window, 'resize', this._onResize, this);
	},

	getDummyIcon: function () {
		return this._dummyIcon;
	},

	updateDummyIcon: function (sourceMarker) {
		var iconPos = L.DomUtil.offset(sourceMarker._icon),
			src = sourceMarker.options.icon._getIconUrl('icon');

		// Save reference to the current marker we are dragging from
		this._sourceMarker = sourceMarker;

		// Update the position
		L.DomUtil.setPosition(this._dummyIcon, iconPos);

		// Copy over the marker's icon properties to the dummy icon
		if (!L.Browser.ie6) {
			this._dummyIcon.src = src;
		} else {
			this._dummyIcon.style.filter = 'progid:DXImageTransform.Microsoft.AlphaImageLoader(src="' + src + '")';
		}
		this._dummyIcon.className = this._sourceMarker._icon.className;
		//this._dummyIcon.style.marginLeft = this._sourceMarker._icon.style.marginLeft;
		//this._dummyIcon.style.marginTop = this._sourceMarker._icon.style.marginTop;
		this._dummyIcon.style.width = this._sourceMarker._icon.style.width;
		this._dummyIcon.style.height = this._sourceMarker._icon.style.height;

		// For some unknown reason translate3d is always off by 15 pixels. Need to investigate.
		// May just be how the page is layed out. TODO: check different page layouts.
		if (L.Browser.any3d) {
			this._dummyIcon.style.marginTop = '-15px';
		}
	},

	startDrag: function () {
		// Show the dummy icon
		this._dummyIcon.style.display = 'block';

		// Calculate the dimensions of the marker. Done here as must be displayed in order to measure
		this._dummyIconDimensions = L.DomUtil.dimensions(this._dummyIcon);
	},

	stopDrag: function () {
		// Hide the dummy icon
		this._dummyIcon.style.display = 'none';

		// Fire dropped and left if we are currently over a droppable
		if (this._overDroppable) {
			this._sourceMarker
				.fire('dropped', { container: this._overDroppable.getElement(), data: this._sourceMarker.options.data })
				.fire('leftdropcontainer', { container: this._overDroppable.getElement() });
		}

		// Clear internal variables
		this._sourceMarker = this._overDroppable = null;
	},

	checkOverDroppable: function (cursorPoint) {
		var offset = L.DomUtil.offset(this._dummyIcon),
			droppable;

		if (this._overDroppable) {
			// If we are still over the same droppable then we don't need to do anything -> return
			if (this._overDroppable.isOver(cursorPoint)) {
				return;
			}
			else { // We are no longer over the droppable so fire an 'out'
				this._sourceMarker.fire('leftdropcontainer', { container: this._overDroppable.getElement() });
				this._overDroppable = null;
			}
		}

		// Check other droppable objects to see if we are over one
		for (var i = 0, l = this._droppables.length; i < l; i++) {
			droppable = this._droppables[i];
			if (droppable.isOver(cursorPoint)) {
				this._sourceMarker.fire('overdropcontainer', { container: droppable.getElement() });
				this._overDroppable = droppable;
				break;
			}
		}
	},

	_createDummyIcon: function () {
		if (!L.Browser.ie6) {
			this._dummyIcon = document.createElement('img');
		} else {
			this._dummyIcon = document.createElement('div');
		}
		this._dummyIcon.setAttribute('id', 'leaflet-dummy-icon');
		this._dummyIcon.style.zIndex = this.options.zIndex;
		this._dummyIcon.style.display = 'none';
		document.body.insertBefore(this._dummyIcon, document.body.firstChild);
	},

	_onResize: function () {
		console.log('_onResize');
		if (this._resizeTimeout) {
			clearTimeout(this._resizeTimeout);
		}
		this._resizeTimeout = setTimeout(L.Util.bind(this._remeasureDroppables, this), 200);
	},

	_remeasureDroppables: function () {
		// The window has resized so we should recalculate the droppable proportions
		for (var i = 0, l = this._droppables.length; i < l; i++) {
			this._droppables[i].measureElement();
		}
	}
});

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