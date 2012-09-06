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