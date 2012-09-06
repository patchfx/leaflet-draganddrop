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