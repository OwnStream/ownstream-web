import "./WatchScreen.css";
import {type JSX, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode, useEffect, useRef, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import type {PreviewFile, SubtitleFile, Video, WatchProgress} from "../api/types.ts";
import {client} from "../api/api.ts";
import Hls, {type ErrorData} from "hls.js";
import {
	CaptionsIcon,
	ChevronLeftIcon,
	MaximizeIcon,
	MinimizeIcon,
	PauseIcon,
	PlayIcon,
	SpeechIcon,
	Volume1Icon,
	Volume2Icon,
	VolumeIcon,
	VolumeXIcon
} from "lucide-react";
import PgsSubtitlePlayer from "../pgs";
// @ts-expect-error libass-wasm does not come with TypeScript definitions
import SubtitlesOctopus from "libass-wasm";

function PlayerButton(props: { icon: JSX.Element, tooltip: string, onclick: () => void }) {
	return (<div className={"videoPlayer-button"} title={props.tooltip} onClick={props.onclick}>
		{props.icon}
	</div>);
}

function PlayerVolumeButton(props: {
	icon: JSX.Element,
	tooltip: string,
	volume: number,
	onChange: (newVolume: number) => void,
	onclick: () => void
}) {
	const barRef = useRef<HTMLDivElement | null>(null);

	function setVolumeFromClientX(clientX: number) {
		const bar = barRef.current;
		if (!bar) return;

		const rect = bar.getBoundingClientRect();
		const rawVolume = (clientX - rect.left) / rect.width;
		const newVolume = Math.max(0, Math.min(1, rawVolume));

		props.onChange(newVolume);
	}

	function handleVolumeClick(e: MouseEvent<HTMLDivElement>) {
		const bar = barRef.current;
		if (!bar) return;

		const parentRect = bar.parentElement!.getBoundingClientRect();

		if (e.clientX - parentRect.left < 48) {
			props.onclick();
		} else {
			setVolumeFromClientX(e.clientX);
		}
	}

	function handleVolumePointerDown(e: PointerEvent<HTMLDivElement>) {
		const bar = barRef.current;
		if (!bar) return;

		const parentRect = bar.parentElement!.getBoundingClientRect();

		if (e.clientX - parentRect.left < 48) return;

		e.preventDefault();
		e.currentTarget.setPointerCapture(e.pointerId);
		setVolumeFromClientX(e.clientX);

		function handlePointerMove(event: globalThis.PointerEvent) {
			setVolumeFromClientX(event.clientX);
		}

		function handlePointerUp() {
			document.removeEventListener("pointermove", handlePointerMove);
			document.removeEventListener("pointerup", handlePointerUp);
		}

		document.addEventListener("pointermove", handlePointerMove);
		document.addEventListener("pointerup", handlePointerUp);
	}

	return (<div className={"videoPlayer-button videoPlayer-volume-button"}
	             title={props.tooltip}
	             onClick={handleVolumeClick}
	             onPointerDown={handleVolumePointerDown}>
		{props.icon}
		<div className={"videoPlayer-volume-bar"} ref={barRef}>
			<div style={{width: (props.volume * 100) + "%"}}></div>
		</div>
	</div>);
}

function PlayerMenuButton(props: {
	icon: JSX.Element,
	tooltip: string,
	onclick: () => void,
	isOpen: boolean,
	children: ReactNode
}) {
	return (<div className={"videoPlayer-menuButton"}>
		<div className={"videoPlayer-button"} title={props.tooltip} onClick={props.onclick}>
			{props.icon}
		</div>
		{props.isOpen && <div className={"videoPlayer-button-menu"}>
			{props.children}
		</div>}
	</div>);
}

function PlayerMenuItem(props: {
	label: string,
	onclick: () => void,
	active: boolean
}) {
	return (<div className={`videoPlayer-button-menu-item ${props.active && "active"}`.trim()} onClick={props.onclick}>
		{props.label}
	</div>)
}

function toHhMmSs(timestamp: number) {
	const hours = Math.floor(timestamp / 3600);
	const minutes = Math.floor(timestamp / 60) % 60;
	const seconds = Math.floor(timestamp % 60);
	return hours > 0
		? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
		: `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export default function WatchScreen() {
	const navigate = useNavigate();
	const {videoId} = useParams();
	const [video, setVideo] = useState<Video | null>(null);
	const [watchProgress, setWatchProgress] = useState<WatchProgress | null>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<Error | ErrorData | null>(null);
	const [playing, setPlaying] = useState<boolean>(false);
	const [time, setTime] = useState<number>(0);
	const [buffers, setBuffers] = useState<{ from: number, to: number }[]>([]);
	const [duration, setDuration] = useState<number>(0);
	const [volume, setVolume] = useState<number>(1);
	const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
	const [hls, setHls] = useState<Hls | null>(null);
	const [hlsLoadStarted, setHlsLoadStarted] = useState<boolean>(false);
	const [openTab, setOpenTab] = useState<string | null>(null);
	const [lastActiveSubtitle, setLastActiveSubtitle] = useState<SubtitleFile | null>(null);
	const [activeSubtitle, setActiveSubtitle] = useState<SubtitleFile | null>(null);
	const [pgs] = useState<PgsSubtitlePlayer>(new PgsSubtitlePlayer());
	const [libass, setLibass] = useState<SubtitlesOctopus | null>(null);
	const [controlsVisible, setControlsVisible] = useState(true);
	const hideTimeoutRef = useRef<number>(null);
	const scrubberRef = useRef<HTMLDivElement>(null);
	const scrubberCanvasRef = useRef<HTMLCanvasElement>(null);
	const scrubberCanvasCtxRef = useRef<CanvasRenderingContext2D>(null);
	const scrubberTextRef = useRef<HTMLDivElement>(null);
	const [imageCache, setImageCache] = useState<Record<string, HTMLImageElement>>({});

	function togglePlay() {
		showControls();
		setOpenTab(null);
		if (playing)
			videoRef.current?.pause();
		else
			videoRef.current?.play();
	}

	function toggleMuted() {
		setOpenTab(null);
		if (videoRef.current)
			videoRef.current.muted = !videoRef.current.muted;

		if (videoRef.current?.muted) setVolume(0);
	}

	function adjustVolume(dir: number) {
		showControls();
		setOpenTab(null);
		if (videoRef.current) {
			if (dir > 0) {
				try {
					videoRef.current.volume += .05;
				} catch (e) {
					videoRef.current.volume = 1;
				}
			} else {
				try {
					videoRef.current.volume -= .05;
				} catch (e) {
					videoRef.current.volume = 0;
				}
			}
		}
	}

	async function toggleFullscreen() {
		setOpenTab(null);
		const playerParentElement = videoRef.current?.parentElement?.parentElement;
		if (document.fullscreenElement === playerParentElement)
			await document.exitFullscreen();
		else
			await playerParentElement?.requestFullscreen();
	}

	function handleHotkey(e: KeyboardEvent) {
		showControls();
		let handled = true;
		switch (e.code) {
			case "KeyF":
				toggleFullscreen();
				break;
			case "KeyM":
				toggleMuted();
				break;
			case "ArrowLeft":
				if (e.altKey || e.shiftKey || e.metaKey || e.ctrlKey) {
					handled = false;
					break;
				}
				videoRef.current!.currentTime -= 5;
				break;
			case "ArrowRight":
				if (e.altKey || e.shiftKey || e.metaKey || e.ctrlKey) {
					handled = false;
					break;
				}
				videoRef.current!.currentTime += 5;
				break;
			case "ArrowUp":
				adjustVolume(1);
				break;
			case "ArrowDown":
				adjustVolume(0);
				break;
			case "Space":
				togglePlay();
				break;
			case "Digit0":
			case "Alpha0":
				if (e.shiftKey) videoRef.current!.currentTime = 0; else handled = false;
				break;
			case "Digit1":
			case "Alpha1":
				if (e.shiftKey) videoRef.current!.currentTime = videoRef.current!.duration * 0.1; else handled = false;
				break;
			case "Digit2":
			case "Alpha2":
				if (e.shiftKey) videoRef.current!.currentTime = videoRef.current!.duration * 0.2; else handled = false;
				break;
			case "Digit3":
			case "Alpha3":
				if (e.shiftKey) videoRef.current!.currentTime = videoRef.current!.duration * 0.3; else handled = false;
				break;
			case "Digit4":
			case "Alpha4":
				if (e.shiftKey) videoRef.current!.currentTime = videoRef.current!.duration * 0.4; else handled = false;
				break;
			case "Digit5":
			case "Alpha5":
				if (e.shiftKey) videoRef.current!.currentTime = videoRef.current!.duration * 0.5; else handled = false;
				break;
			case "Digit6":
			case "Alpha6":
				if (e.shiftKey) videoRef.current!.currentTime = videoRef.current!.duration * 0.6; else handled = false;
				break;
			case "Digit7":
			case "Alpha7":
				if (e.shiftKey) videoRef.current!.currentTime = videoRef.current!.duration * 0.7; else handled = false;
				break;
			case "Digit8":
			case "Alpha8":
				if (e.shiftKey) videoRef.current!.currentTime = videoRef.current!.duration * 0.8; else handled = false;
				break;
			case "Digit9":
			case "Alpha9":
				if (e.shiftKey) videoRef.current!.currentTime = videoRef.current!.duration * 0.9; else handled = false;
				break;
			default:
				handled = false;
				break;
		}
		if (handled) e.preventDefault();
	}

	function getSubtitleType(x: SubtitleFile | null): "pgs" | "webvtt" | "libass" | null {
		if (x === null) return null;
		const keys = Object.keys(x.files);
		if (keys.includes("sup")) return "pgs";
		if (keys.includes("ass")) return "libass";
		if (keys.includes("ssa")) return "libass";
		if (keys.includes("vtt")) return "webvtt";
		return null;
	}

	function subtitleSupported(x: SubtitleFile) {
		const keys = Object.keys(x.files);
		return keys.includes("sup") || keys.includes("vtt") || keys.includes("ass") || keys.includes("ssa");
	}

	function showControls() {
		setControlsVisible(true);

		if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);

		hideTimeoutRef.current = setTimeout(() => {
			setControlsVisible(false);
		}, 5000);
	}

	function pasteTemplateIntoImage(preview: PreviewFile, time: number, duration: number) {
		if (!scrubberCanvasCtxRef.current || !scrubberCanvasRef.current) return;
		const period = preview.period || duration / 100;
		const frame = Math.floor(time / period);
		const image = Math.floor(frame / (preview.columns * preview.rows));
		const frameInImage = frame % (preview.columns * preview.rows);
		const y = Math.floor(frameInImage / preview.rows);
		const x = Math.floor(frameInImage % preview.columns);
		const fileName = preview.template.replace("%d", (image + 1).toString());
		const img = imageCache[fileName];
		const frameW = img.width / preview.columns;
		const frameH = img.height / preview.rows;
		if (img) {
			scrubberCanvasRef.current.width = frameW;
			scrubberCanvasRef.current.height = frameH;
			scrubberCanvasCtxRef.current.drawImage(img, x * frameW, y * frameH, frameW, frameH, 0, 0, frameW, frameH);
		}
	}

	function onScrubberHover(e: MouseEvent<HTMLDivElement>) {
		if (!scrubberRef.current || !scrubberTextRef.current) return;
		const prog = e.clientX / e.currentTarget.clientWidth;
		const time = (videoRef.current?.duration || 0) * prog;
		const imgWidth = scrubberRef.current.clientWidth / 2;
		const padding = 16;
		const left =
			// If too much to the left, keep on the left side
			(e.clientX - padding) < imgWidth ? padding
				// If too much to the right, keep on the right side
				: (e.clientX + imgWidth + padding) > document.body.clientWidth
					? document.body.clientWidth - padding - imgWidth * 2
					// Otherwise, keep on top of the cursor
					: e.clientX - imgWidth;
		scrubberRef.current.style.left = left + "px";
		scrubberTextRef.current.innerText = toHhMmSs(time);
		const hqPreview = video?.previewFiles?.find(x => x.template.startsWith("medium"));
		if (hqPreview != undefined) {
			pasteTemplateIntoImage(hqPreview, time, videoRef.current?.duration ?? 100);
		}
	}

	function onScrubberClick(e: MouseEvent<HTMLDivElement>) {
		if (!videoRef.current) return;
		const newTime = (videoRef.current?.duration || 0) * (e.clientX / e.currentTarget.clientWidth);
		videoRef.current.currentTime = newTime;
		setTime(newTime);
	}

	// Loads the video info & last watch progress
	useEffect(() => {
		(async () => {
			try {
				const [progress, video] = await Promise.all([
					client.getProgress(videoId!),
					client.getVideo(videoId!)
				]);
				setWatchProgress(progress);
				setVideo(video);
				video.previewFiles?.forEach(file => {
					if (!file.template.startsWith("medium_")) return;
					for (let i = 1; i <= file.frameCount; i++) {
						const name = file.template.replace("%d", i.toString());
						const img = new Image();
						img.src = client.getMediaUrl(videoId!, "trickplay", name);
						setImageCache(x => {
							x[name] = img;
							return x;
						});
					}
				});
			} catch (e) {
				setError(e as Error);
			}
		})();
	}, [videoId]);

	// Loads the video into Hls.JS
	useEffect(() => {
		if (!video) return;
		(() => {
			setLoading(false);

			if (videoRef.current && !hlsLoadStarted) {
				setHlsLoadStarted(true);
				if (Hls.isSupported()) {
					const hls = new Hls();
					setHls(hls);
					hls.loadSource(client.getMediaUrl(videoId!));
					hls.attachMedia(videoRef.current);
					hls.on(Hls.Events.ERROR, (_, e) => {
						setError(e);
					});
				} else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
					// For Safari (native HLS support)
					videoRef.current.src = client.getMediaUrl(videoId!);
				} else {
					setError(new Error("Your client does not support HLS playlists."))
				}
				videoRef.current.addEventListener('loadedmetadata', () => {
					if (videoRef.current && watchProgress) {
						videoRef.current.currentTime = watchProgress.position / 1000;
						videoRef.current?.play();
					}
				});
			}
		})();

		return () => {
			videoRef.current?.pause();
			if (hls) {
				hls.destroy();
			}
		};
	}, [video]);

	// Handles subtitle switching with native WebVTT, PGS & SubtitlesOctopus
	useEffect(() => {
		if (lastActiveSubtitle == null && activeSubtitle == null) return;

		const lastType = getSubtitleType(lastActiveSubtitle);
		const newType = getSubtitleType(activeSubtitle);

		if (lastType !== newType) {
			switch (lastType) {
				case "pgs":
					pgs.setEnabled(false);
					break;
				case "webvtt":
					if (videoRef.current) {
						for (let i = 0; i < videoRef.current.textTracks.length; i++) {
							videoRef.current.textTracks[i].mode = "disabled";
						}
					}
					break;
				case "libass":
					if (libass) {
						libass.dispose();
						libass.ctx.clearRect(
							0,
							0,
							libass.ctx.canvas.width,
							libass.ctx.canvas.height);
						// eslint-disable-next-line react-hooks/set-state-in-effect
						setLibass(null);
					}
					break;
			}

			switch (newType) {
				case "pgs":
					pgs.setEnabled(true);
					if (videoRef.current) pgs.attachTo(videoRef.current);
					if (canvasRef.current) pgs.attachTo(canvasRef.current);
					break;
			}
		}

		switch (newType) {
			case "pgs":
				pgs.loadSubtitle(client.getMediaUrl(videoId!, "captions", activeSubtitle!.files["sup"])).then();
				break;
			case "libass":
				if (libass)
					libass.dispose();
				canvasRef.current!.width = videoRef.current!.videoWidth;
				canvasRef.current!.height = videoRef.current!.videoHeight;
				setLibass(new SubtitlesOctopus({
					canvas: canvasRef.current,
					subUrl: client.getMediaUrl(videoId!, "captions", activeSubtitle!.files["ass"] || activeSubtitle!.files["ssa"]),
					workerUrl: "/node_modules/libass-wasm/dist/js/subtitles-octopus-worker.js",
					legacyWorkerUrl: "/node_modules/libass-wasm/dist/js/subtitles-octopus-worker-legacy.js",
					fallbackFont: "/assets/fonts/noto_sans/NotoSans-VariableFont_wdth,wght.ttf",
					fonts: video?.attachments?.map(x => client.getMediaUrl(videoId!, "attachments", x))
				}));
				break;
			case "webvtt":
				if (videoRef.current) {
					for (let i = 0; i < videoRef.current.textTracks.length; i++) {
						videoRef.current.textTracks[i].mode = "disabled";
					}
					const track = videoRef.current.textTracks.getTrackById(`subtitle_${videoId!}_${activeSubtitle?.id}`)
					if (track) track.mode = "showing";
				}
				break;
		}

		setLastActiveSubtitle(activeSubtitle);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeSubtitle]);

	// For SubtitlesOctopus, updates the video time & play status,
	// since we're not connected to the player, and share the canvas
	// with our PGS renderer.
	useEffect(() => {
		if (libass) {
			libass.setCurrentTime(time);
			libass.setIsPaused(!playing, time)
		}
	}, [libass, time, playing]);

	// Fullscreen event handler, updates the isFullscreen value
	useEffect(() => {
		document.addEventListener("fullscreenchange", (_) => {
			setIsFullscreen(document.fullscreenElement === videoRef.current?.parentElement?.parentElement)
		});
	}, []);

	// Get the scrubber canvas context
	useEffect(() => {
		if (scrubberCanvasRef.current)
			scrubberCanvasCtxRef.current = scrubberCanvasRef.current.getContext("2d");
	}, [scrubberCanvasRef]);

	// Save playback progress
	useEffect(() => {
		const intervalId = window.setInterval(async () => {
			const currentTime = Math.floor((videoRef.current?.currentTime || 0) * 1000);
			const duration = Math.floor((videoRef.current?.duration || 0) * 1000);
			if (currentTime === 0 || duration === 0) return;

			await client.updateWatchProgress(videoId!, duration, currentTime, null)
		}, 5000);

		return () => {
			window.clearInterval(intervalId);
		};
	}, [videoId]);

	if (error) {
		if (error instanceof Error) return <div>{error.message}</div>;
		else return <div>{JSON.stringify(error)}</div>;
	}

	return (<div className={`videoPlayer ${controlsVisible && "controls-visible"}`.trim()}
	             tabIndex={0}
	             onMouseMove={showControls}
	             onKeyDown={handleHotkey}>
			<div className={"videoPlayer-player"}
			     onClick={togglePlay}
			     onDoubleClick={toggleFullscreen}
			     onWheel={event => {
					 if (event.deltaY < 0)
						 adjustVolume(1)
					 else
						 adjustVolume(-1)
				 }}>
				<video
					ref={videoRef}
					onPlay={() => setPlaying(true)}
					onPause={() => setPlaying(false)}
					onTimeUpdate={e => {
						setTime(e.currentTarget.currentTime);
						const buffers = e.currentTarget.buffered;
						const b: { from: number; to: number }[] = [];
						for (let i = 0; i < buffers.length; i++) {
							b.push({
								from: buffers.start(i),
								to: buffers.end(i)
							})
						}
						setBuffers(b);
					}}
					onDurationChange={e => setDuration(e.currentTarget.duration)}
					onVolumeChange={e => setVolume(e.currentTarget.muted ? 0 : e.currentTarget.volume)}
				>
					{(video?.subtitles ?? [])
						.filter(x => getSubtitleType(x) == "webvtt")
						.map(x => (
							<track
								id={`subtitle_${videoId!}_${x.id}`}
								key={x.id}
								kind="captions"
								srcLang={x.language}
								label={x.title}
								src={client.getMediaUrl(videoId!, "captions", x.files["vtt"])}/>
						))}
				</video>
				<canvas ref={canvasRef}/>
			</div>
			<div className={"videoPlayer-info"}>
				<PlayerButton icon={<ChevronLeftIcon/>} tooltip={"Go Back"} onclick={() => {
					navigate(-1);
				}}/>
				{loading
					? (<div className={"videoPlayer-meta"}>
						<div className={"videoPlayer-title"}>Loading...</div>
					</div>)
					: video
						? (<div className={"videoPlayer-meta"}>
							<div
								className={"videoPlayer-title"}>{video.content ? (video.content.translatedTitle ?? video.content.originalTitle) : "Video"}</div>
							<div
								className={"videoPlayer-subtitle"}>{(video.episode && video.content?.type == "Tv") ? (`S${video.episode.seasonNumber.toString().padStart(2, '0')} E${video.episode.episodeNumber.toString().padStart(2, '0')}: ${video.episode.translatedTitle ?? video.episode.originalTitle}`) : ""}
							</div>
						</div>)
						: (<div className={"videoPlayer-meta"}>
							<div className={"videoPlayer-title"}>Video</div>
						</div>)}
			</div>
			<div className={"videoPlayer-scrubber"}>
				<div className={"videoPlayer-scrubber-bar"} onMouseMove={onScrubberHover} onClick={onScrubberClick}>
					{buffers.map(b =>
						(<div className={"buffered"}
						      style={{
								  left: `${b.from / duration * 100}%`,
								  width: `${(b.to - b.from) / duration * 100}%`
							  }}></div>)
					)}
					<div className={"played"} style={{width: `${time / duration * 100}%`}}></div>
				</div>
				<div className={"videoPlayer-scrubber-overlay"} ref={scrubberRef}>
					<canvas ref={scrubberCanvasRef}/>
					<div ref={scrubberTextRef}/>
				</div>
			</div>
			<div className={"videoPlayer-controls"}>
				<PlayerButton icon={playing ? <PauseIcon/> : <PlayIcon/>}
				              tooltip={playing ? "Pause" : "Play"}
				              onclick={togglePlay}/>
				<PlayerVolumeButton
					icon={volume > .7 ? <Volume2Icon/> : volume > .2 ? <Volume1Icon/> : volume > 0 ? <VolumeIcon/> :
						<VolumeXIcon/>}
					tooltip={"Mute"}
					volume={volume}
					onChange={x => {
						if (videoRef.current) videoRef.current.volume = x;
					}}
					onclick={toggleMuted}/>
				<div className={"videoPlayer-currentTime"}>{toHhMmSs(time)}</div>
				<span>/</span>
				<div className={"videoPlayer-duration"}>{toHhMmSs(duration)}</div>
				<div className={"flex-divider"}/>
				{(video?.subtitles?.length ?? 0) > 0 &&
					<PlayerMenuButton
						icon={<CaptionsIcon/>}
						tooltip={"Subtitles"}
						isOpen={openTab == "captions"}
						onclick={() => {
							setOpenTab(openTab == "captions" ? null : "captions");
						}}>
						<div className={"videoPlayer-button-menu-title"}>Subtitles</div>
						<div className={"videoPlayer-button-menu-list"}>
							<PlayerMenuItem
								label={`None`}
								onclick={() => {
									setOpenTab(null);
									setActiveSubtitle(null);
								}}
								active={activeSubtitle === null}/>
							{video?.subtitles
								?.filter(subtitleSupported)
								?.map(x => (
									<PlayerMenuItem
										label={x.title}
										onclick={() => {
											setOpenTab(null);
											setActiveSubtitle(x);
										}}
										active={activeSubtitle == x}
									/>
								))}
						</div>
					</PlayerMenuButton>
				}
				{(hls?.allAudioTracks.length ?? 0) > 1 &&
					<PlayerMenuButton icon={<SpeechIcon/>}
					                  tooltip={"Audio Track"}
					                  isOpen={openTab == "audio"}
					                  onclick={() => {
										  setOpenTab(openTab == "audio" ? null : "audio");
									  }}>
						<div className={"videoPlayer-button-menu-title"}>Audio Tracks</div>
						<div className={"videoPlayer-button-menu-list"}>
							{hls ? (hls.allAudioTracks.map(x => (
								<PlayerMenuItem label={`${x.name} ${(x.default) ? "(Default)" : ""}`} onclick={() => {
									setOpenTab(null);
									hls.setAudioOption(x);
								}} active={hls.audioTrack == hls.audioTracks.indexOf(x)}/>
							))) : <div></div>}
						</div>
					</PlayerMenuButton>
				}
				<PlayerButton icon={isFullscreen ? <MinimizeIcon/> : <MaximizeIcon/>}
				              tooltip={isFullscreen ? "Exit Full Screen" : "Full Screen"} onclick={toggleFullscreen}/>
			</div>
		</div>
	)
}