import {
	SegmentType,
	type Segment,
	type PresentationCompositionSegment,
	type CompositionObject,
	type WindowDefinitionSegment,
	type SegmentWindow,
	type PaletteDefinitionSegment,
	type Palette,
	type ObjectDefinitionSegment,
	type EndSegment,
	type DisplaySet,
} from "./types.ts";

export default class PgsSubtitlePlayer {
	private attachedPlayer?: HTMLVideoElement;
	private attachedCanvasContext?: CanvasRenderingContext2D;

	private segments: Segment[] = [];

	private enabled: boolean = false;

	setEnabled(enabled: boolean): void {
		if (this.attachedCanvasContext)
			this.attachedCanvasContext.clearRect(
				0,
				0,
				this.attachedCanvasContext.canvas.width,
				this.attachedCanvasContext.canvas.height);
		this.enabled = enabled;
	}

	private parsePgs(byteArray: Uint8Array) {
		let position = 0;
		const segments: Segment[] = [];

		function parseBool(byte: number) {
			if (byte == 0x00) return false;
			if (byte == 0x80) return true;
			throw new Error(`Failed to parse boolean, unexpected value ${byte}`);

		}

		function parsePcs(segment: Uint8Array): PresentationCompositionSegment {
			const view = new DataView(segment.buffer);
			const compositionObjects: CompositionObject[] = [];
			let offset = 11;
			for (let i = 0; i < view.getUint8(10); i++) {
				const croppedFlag = view.getUint8(offset + 2);
				if (croppedFlag === 0x00) {
					compositionObjects.push({
						objectId: view.getUint16(offset, false),
						windowId: view.getUint8(offset + 2),
						objectCroppedFlag: croppedFlag,
						objectHorizontalPosition: view.getUint16(offset + 3, false),
						objectVerticalPosition: view.getUint16(offset + 5, false)
					});
					offset += 8;
				} else if (croppedFlag === 0x40) {
					compositionObjects.push({
						objectId: view.getUint16(offset, false),
						windowId: view.getUint8(offset + 2),
						objectCroppedFlag: croppedFlag,
						objectHorizontalPosition: view.getUint16(offset + 3, false),
						objectVerticalPosition: view.getUint16(offset + 5, false),
						objectCroppingHorizontalPosition: view.getUint16(offset + 7, false),
						objectCroppingVerticalPosition: view.getUint16(offset + 9, false),
						objectCroppingWidth: view.getUint16(offset + 11, false),
						objectCroppingHeight: view.getUint16(offset + 13, false)
					});
					offset += 16;
				} else {
					throw new Error(`Unexpected value for Object Cropped Flag, expected 0x00 or 0x40, got ${croppedFlag.toString(16)}`)
				}
			}
			return {
				width: view.getUint16(0, false),
				height: view.getUint16(2, false),
				frameRate: view.getUint8(4),
				compositionNumber: view.getUint16(5, false),
				compositionState: view.getUint8(7),
				paletteUpdateFlag: parseBool(view.getUint8(8)),
				paletteId: view.getUint8(9),
				compositionObjects: compositionObjects
			}
		}

		function parseWds(segment: Uint8Array): WindowDefinitionSegment {
			const view = new DataView(segment.buffer);
			const count = view.getUint8(0);
			const windows: SegmentWindow[] = [];
			for (let i = 0; i < count; i++) {
				const offset = 1 + i * 9;
				windows.push({
					id: view.getUint8(offset),
					x: view.getUint16(offset + 1, false),
					y: view.getUint16(offset + 3, false),
					w: view.getUint16(offset + 5, false),
					h: view.getUint16(offset + 7, false),
				});
			}
			return {windows};
		}

		function parsePds(segment: Uint8Array): PaletteDefinitionSegment {
			const view = new DataView(segment.buffer);
			const paletteCount = Math.floor((segment.length - 2) / 5)
			const palettes: Palette[] = [];
			for (let i = 0; i < paletteCount; i++) {
				const offset = 2 + i * 5;
				palettes.push({
					entryId: view.getUint8(offset),
					y: view.getUint8(offset + 1),
					cr: view.getUint8(offset + 2),
					cb: view.getUint8(offset + 3),
					alpha: view.getUint8(offset + 4),
				});
			}
			return {
				id: view.getUint8(0),
				version: view.getUint8(1),
				palettes
			}
		}

		function parseOds(segment: Uint8Array): ObjectDefinitionSegment {
			const view = new DataView(segment.buffer);
			const size = (view.getUint8(4) << 16) | (view.getUint8(5) << 8) | view.getUint8(6);
			return {
				id: view.getUint16(0, false),
				version: view.getUint8(2),
				lastInSequenceFlag: view.getUint8(3),
				objectDataLength: size,
				w: view.getUint16(7, false),
				h: view.getUint16(9, false),
				data: segment.slice(10, 10 + size),
			}
		}

		while (position < byteArray.length) {
			if (byteArray[position] == 0x50 && byteArray[position + 1] == 0x47) {
				const headerView = new DataView(byteArray.slice(position, position + 13).buffer);
				const segmentBytes = byteArray.slice(position + 13, position + 13 + headerView.getUint16(11, false));
				const type = headerView.getUint8(10) as SegmentType;
				const segment: Segment = {
					presentationTimestamp: headerView.getUint32(2, false) / 90,
					decodingTimestamp: headerView.getUint32(6, false) / 90,
					segmentType: type,
					data: type == SegmentType.PCS ? parsePcs(segmentBytes) :
						type == SegmentType.WDS ? parseWds(segmentBytes) :
							type == SegmentType.PDS ? parsePds(segmentBytes) :
								type == SegmentType.ODS ? parseOds(segmentBytes) :
									type == SegmentType.END ? ({} as EndSegment) : ({} as EndSegment)
				};
				position += 13 + segmentBytes.length;
				segments.push(segment);
			} else {
				throw new Error(`Failed to parse file: Could not find header at position ${position} (${position.toString(16).padStart(8, "0")}).`);
			}
		}
		return segments;
	}

	private attachPlayerEvents(newPlayer: HTMLVideoElement) {
		if (this.attachedPlayer) {
			this.attachedPlayer.removeEventListener("timeupdate", this.playerTimeUpdate)
		}
		this.attachedPlayer = newPlayer;
		this.attachedPlayer.addEventListener("timeupdate", this.playerTimeUpdate);
	}

	private playerTimeUpdate = (ev: Event) => {
		this.renderToCanvas((ev.target as HTMLVideoElement).currentTime * 1000)
	}

	private renderToCanvas(timestamp: number) {
		if (this.segments.length === 0 || !this.enabled) return;
		if (!this.attachedCanvasContext) return;

		const displaySet = this.getDisplaySetAtTimestamp(timestamp);

		this.attachedCanvasContext.clearRect(0, 0, this.attachedCanvasContext.canvas.width, this.attachedCanvasContext.canvas.height);

		if (!displaySet || !displaySet.pcs) return;

		const composition = displaySet.pcs;

		this.attachedCanvasContext.canvas.width = composition.width;
		this.attachedCanvasContext.canvas.height = composition.height;
		if (composition.compositionObjects.length === 0) return;

		const paletteSegment = displaySet.pds;
		const windowSegment = displaySet.wds;
		const objectSegments = displaySet.ods;

		if (!paletteSegment) return;

		const rgbaPalette = new Map<number, number[]>();
		for (const palette of paletteSegment.palettes) {
			rgbaPalette.set(palette.entryId, this.yCrCbToRgba(palette));
		}

		for (const compositionObject of composition.compositionObjects) {
			const object = objectSegments.find(x => x.id === compositionObject.objectId);
			if (!object) continue;

			const window = windowSegment?.windows.find(x => x.id === compositionObject.objectId);
			const imageData = this.decodeObjectImageData(object, rgbaPalette);
			if (imageData == null) return;

			const cropX = compositionObject.objectCroppingHorizontalPosition ?? 0;
			const cropY = compositionObject.objectCroppingVerticalPosition ?? 0;
			const cropWidth = compositionObject.objectCroppingWidth ?? object.w;
			const cropHeight = compositionObject.objectCroppingHeight ?? object.h;

			const targetX = window ? window.x : compositionObject.objectHorizontalPosition;
			const targetY = window ? window.y : compositionObject.objectVerticalPosition;

			if (cropX === 0 && cropY === 0 && cropWidth === object.w && cropHeight === object.h) {
				this.attachedCanvasContext.putImageData(imageData, targetX, targetY);
			} else {
				const cropped = this.attachedCanvasContext.createImageData(cropWidth, cropHeight);

				for (let y = 0; y < cropHeight; y++) {
					for (let x = 0; x < cropWidth; x++) {
						const sourceOffset = ((cropY + y) * object.w + cropX + x) * 4;
						const targetOffset = (y * cropWidth + x) * 4;

						cropped.data[targetOffset] = imageData.data[sourceOffset];
						cropped.data[targetOffset + 1] = imageData.data[sourceOffset + 1];
						cropped.data[targetOffset + 2] = imageData.data[sourceOffset + 2];
						cropped.data[targetOffset + 3] = imageData.data[sourceOffset + 3];
					}
				}

				this.attachedCanvasContext.putImageData(cropped, targetX, targetY);
			}
		}
	}

	private decodeObjectImageData(object: ObjectDefinitionSegment, rgbaPalette: Map<number, number[]>) {
		if (this.attachedCanvasContext == null) return;
		const imageData = this.attachedCanvasContext.createImageData(object.w, object.h);
		const bytes = object.data;

		let source = 0;
		let x = 0;
		let y = 0;

		while (source < bytes.length && y < object.h) {
			const first = bytes[source++];

			if (first !== 0) {
				this.writePixels(imageData, object.w, object.h, x, y, 1, rgbaPalette.get(first));
				x++;
				continue;
			}

			const second = bytes[source++];

			if (second === 0) {
				x = 0;
				y++;
				continue;
			}

			const mode = second >> 6;
			let length = second & 0x3f;
			let colorIndex = 0;

			if (mode === 0) {
				// 00LLLLLL: L transparent pixels.
			} else if (mode === 1) {
				// 01LLLLLL LLLLLLLL: L transparent pixels.
				length = (length << 8) | bytes[source++];
			} else if (mode === 2) {
				// 10LLLLLL CCCCCCCC: L pixels in color C.
				colorIndex = bytes[source++];
			} else {
				// 11LLLLLL LLLLLLLL CCCCCCCC: L pixels in color C.
				length = (length << 8) | bytes[source++];
				colorIndex = bytes[source++];
			}

			this.writePixels(imageData, object.w, object.h, x, y, length, rgbaPalette.get(colorIndex));
			x += length;

			// Keep exact line boundaries for explicit 0x00 0x00 end-of-line markers.
			while (x > object.w) {
				x -= object.w;
				y++;
			}
		}

		return imageData;
	}

	private writePixels(imageData: ImageData, width: number, height: number, startX: number, startY: number, length: number, color = [0, 0, 0, 0]) {
		let x = startX;
		let y = startY;

		for (let i = 0; i < length && y < height; i++) {
			if (x >= width) {
				x = 0;
				y++;
				if (y >= height) break;
			}

			const offset = (y * width + x) * 4;
			imageData.data[offset] = color[0];
			imageData.data[offset + 1] = color[1];
			imageData.data[offset + 2] = color[2];
			imageData.data[offset + 3] = color[3];

			x++;
		}
	}

	private yCrCbToRgba({y, cr, cb, alpha}: { y: number, cr: number, cb: number, alpha: number }): number[] {
		const yy = Math.max(0, y - 16);
		const cbb = cb - 128;
		const crr = cr - 128;

		const r = 1.164 * yy + 1.793 * crr;
		const g = 1.164 * yy - 0.213 * cbb - 0.533 * crr;
		const b = 1.164 * yy + 2.112 * cbb;

		return [
			Math.max(0, Math.min(255, Math.floor(r))),
			Math.max(0, Math.min(255, Math.floor(g))),
			Math.max(0, Math.min(255, Math.floor(b))),
			alpha
		];
	}

	private getDisplaySetAtTimestamp(timestamp: number): DisplaySet | undefined {
		let pcsIndex = -1;

		for (let i = 0; i < this.segments.length; i++) {
			const segment = this.segments[i];

			if (segment.presentationTimestamp > timestamp) break;

			if (segment.segmentType === SegmentType.PCS) {
				pcsIndex = i;
			}
		}

		if (pcsIndex === -1) return undefined;

		const result: DisplaySet = {
			ods: []
		};

		for (let i = pcsIndex; i < this.segments.length; i++) {
			const segment = this.segments[i];

			switch (segment.segmentType) {
				case SegmentType.PCS:
					result.pcs = segment.data as PresentationCompositionSegment;
					break;
				case SegmentType.WDS:
					result.wds = segment.data as WindowDefinitionSegment;
					break;
				case SegmentType.PDS:
					result.pds = segment.data as PaletteDefinitionSegment;
					break;
				case SegmentType.ODS:
					result.ods.push(segment.data as ObjectDefinitionSegment);
					break;
				case SegmentType.END:
					return result;
			}
		}

		return result;
	}

	attachTo(obj: HTMLVideoElement | HTMLCanvasElement | CanvasRenderingContext2D | string) {
		const el = typeof obj === "string" ? document.querySelector(obj) : obj;
		if (el instanceof HTMLVideoElement) {
			this.attachPlayerEvents(el)
		} else if (el instanceof HTMLCanvasElement) {
			this.attachedCanvasContext = el.getContext("2d") ?? undefined;
		} else if (el instanceof CanvasRenderingContext2D) {
			this.attachedCanvasContext = el;
		} else {
			throw new Error("Unsupported element. `obj` must be either a direct reference to an HTMLVideoElement, HTMLCanvasElement, CanvasRenderingContext2D, or a querySelector string that resolves to one of the supported elements.")
		}
	}

	/**
	 * Load a subtitle from either a URL or a Uint8Array. If the subtitle is successfully
	 * loaded, the player will be enabled, and subtitle rendering will start as long as
	 * there is an assigned player & canvas
	 * @param arg {string | Uint8Array} URL or a Uint8Array
	 */
	async loadSubtitle(arg: string | Uint8Array) {
		if (arg instanceof Uint8Array) {
			this.segments = this.parsePgs(arg);
			this.enabled = true;
		} else if (typeof arg === "string") {
			const res = await fetch(arg)
				.then(x => x.blob())
				.then(x => x.arrayBuffer())
				.then(x => new Uint8Array(x))
				.catch(err => {
					this.enabled = false;
					throw err;
				});
			this.segments = this.parsePgs(res);
			this.enabled = true;
		} else {
			this.enabled = false;
			throw new Error("`obj` must be a string or an Uint8Array");
		}
	}
}