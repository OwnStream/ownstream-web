export enum SegmentType {
	PDS = 0x14,
	ODS = 0x15,
	PCS = 0x16,
	WDS = 0x17,
	END = 0x80,
}

export type Segment = {
	presentationTimestamp: number;
	decodingTimestamp: number;
	segmentType: SegmentType;
	data?: PresentationCompositionSegment | WindowDefinitionSegment | PaletteDefinitionSegment | ObjectDefinitionSegment | EndSegment;
}

export type PresentationCompositionSegment = {
	width: number;
	height: number;
	frameRate: number;
	compositionNumber: number;
	compositionState: CompositionState;
	paletteUpdateFlag: boolean;
	paletteId: number;
	compositionObjects: CompositionObject[];
}

export enum CompositionState {
	/**
	 * This defines a display update, and contains only functional
	 * segments with elements that are different from the preceding
	 * composition. It’s mostly used to stop displaying objects on
	 * the screen by defining a composition with no composition
	 * objects (a value of zero in the Number of Composition Objects
	 * flag) but also used to define a new composition with new
	 * objects and objects defined since the Epoch Start.
	 * From: https://blog.thescorpius.com/index.php/2017/07/15/presentation-graphic-stream-sup-files-bluray-subtitle-format/#tablepress-2
	 */
	Normal = 0x00,
	/**
	 * This defines a display refresh. This is used to compose in
	 * the middle of the Epoch. It includes functional segments
	 * with new objects to be used in a new composition, replacing
	 * old objects with the same Object ID.
	 * From: https://blog.thescorpius.com/index.php/2017/07/15/presentation-graphic-stream-sup-files-bluray-subtitle-format/#tablepress-2
	 */
	AcquisitionPoint = 0x40,
	/**
	 *  This defines a new display. The Epoch Start contains all
	 *  functional segments needed to display a new composition
	 *  on the screen.
	 * From: https://blog.thescorpius.com/index.php/2017/07/15/presentation-graphic-stream-sup-files-bluray-subtitle-format/#tablepress-2
	 */
	EpochStart = 0x80,
}

export type CompositionObject = {
	objectId: number;
	windowId: number;
	objectCroppedFlag: number;
	objectHorizontalPosition: number;
	objectVerticalPosition: number;
	objectCroppingHorizontalPosition?: number;
	objectCroppingVerticalPosition?: number;
	objectCroppingWidth?: number;
	objectCroppingHeight?: number;
}

export type WindowDefinitionSegment = {
	windows: SegmentWindow[];
};

export type SegmentWindow = {
	id: number;
	x: number;
	y: number;
	w: number;
	h: number;
}

export type PaletteDefinitionSegment = {
	id: number;
	version: number;
	palettes: Palette[];
}

export type Palette = {
	entryId: number;
	y: number;
	cr: number;
	cb: number;
	alpha: number;
}

export type ObjectDefinitionSegment = {
	id: number;
	version: number;
	lastInSequenceFlag: LastInSequenceFlag;
	objectDataLength: number;
	w: number;
	h: number;
	data: Uint8Array;
}

export enum LastInSequenceFlag {
	LastInSequence = 0x40,
	FirstInSequence = 0x80,
	FirstAndLastInSequence = 0xC0 // 0x40 | 0x80
}

export type EndSegment = {}

export type DisplaySet = {
	pcs?: PresentationCompositionSegment,
	wds?: WindowDefinitionSegment,
	pds?: PaletteDefinitionSegment,
	ods: ObjectDefinitionSegment[]
}