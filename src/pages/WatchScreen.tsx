import "./WatchScreen.css";
import {type JSX, type ReactNode, useEffect, useRef, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import type {SubtitleFile, Video, WatchProgress} from "../api/types.ts";
import {client} from "../api/api.ts";
import Hls, {type ErrorData} from "hls.js";
import {
	BoltIcon,
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

function PlayerButton(props: { icon: JSX.Element, tooltip: string, onclick: () => void }) {
	return (<div className={"videoPlayer-button"} title={props.tooltip} onClick={props.onclick}>
		{props.icon}
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

	useEffect(() => {
		(async () => {
			try {
				const [progress, video] = await Promise.all([
					client.getProgress(videoId!),
					client.getVideo(videoId!)
				]);
				setWatchProgress(progress);
				setVideo(video);
			} catch (e) {
				setError(e as Error);
			}
		})();
	}, [videoId]);

	useEffect(() => {
		if (!video) return;
		(() => {
			setLoading(false);

			if (videoRef.current && !hlsLoadStarted) {
				setHlsLoadStarted(true);
				if (Hls.isSupported()) {
					const hls = new Hls();
					setHls(hls);
					console.log(new Date(), "Loading...")
					hls.loadSource(client.getMediaUrl(videoId!));
					hls.attachMedia(videoRef.current);
					hls.on(Hls.Events.ERROR, (_, e) => {
						setError(e);
					});
					window.hls = hls;
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

	function togglePlay() {
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

	async function toggleFullscreen() {
		setOpenTab(null);
		const playerParentElement = videoRef.current?.parentElement?.parentElement;
		if (document.fullscreenElement === playerParentElement)
			await document.exitFullscreen();
		else
			await playerParentElement?.requestFullscreen();
	}

	function adjustVolume(dir: number) {
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

	useEffect(() => {
		document.addEventListener("fullscreenchange", (_) => {
			setIsFullscreen(document.fullscreenElement === videoRef.current?.parentElement?.parentElement)
		});
	}, []);

	function getSubtitleType(x: SubtitleFile | null): "pgs" | "webvtt" | null {
		if (x === null) return null;
		const keys = Object.keys(x.files);
		if (keys.includes("pgs")) return "pgs";
		//if (keys.includes("ass")) return "subtitlesoctopus";
		if (keys.includes("vtt")) return "webvtt";
		return null;
	}

	function subtitleSupported(x: SubtitleFile) {
		const keys = Object.keys(x.files);
		return keys.includes("pgs") || /*keys.includes("ass") ||*/ keys.includes("vtt");
	}

	useEffect(() => {
		if (lastActiveSubtitle == null && activeSubtitle == null) return;

		const lastType = getSubtitleType(lastActiveSubtitle);
		const newType = getSubtitleType(activeSubtitle);

		if (lastType !== newType) {
			// TODO: Dispose old subtitle player, deploy new one
		}

		// TODO: Load the subtitle track

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeSubtitle]);

	if (error) {
		if (error instanceof Error) return <div>{error.message}</div>;
		else return <div>{error.toString()}</div>;
	}

	return (<div className={"videoPlayer"}>
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
				/>
				<canvas/>
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
				<div className={"videoPlayer-scrubber-bar"}>
					{buffers.map(b =>
						(<div className={"buffered"}
						      style={{
								  left: `${b.from / duration * 100}%`,
								  width: `${(b.to - b.from) / duration * 100}%`
							  }}></div>)
					)}
					<div className={"played"} style={{width: `${time / duration * 100}%`}}></div>
				</div>
			</div>
			<div className={"videoPlayer-controls"}>
				<PlayerButton icon={playing ? <PauseIcon/> : <PlayIcon/>}
				              tooltip={playing ? "Pause" : "Play"}
				              onclick={togglePlay}/>
				<PlayerButton
					icon={volume > .7 ? <Volume2Icon/> : volume > .2 ? <Volume1Icon/> : volume > 0 ? <VolumeIcon/> :
						<VolumeXIcon/>}
					tooltip={"Mute"} onclick={toggleMuted}/>
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
										label={`${x.title} (${x.language}, ${Object.keys(x.files).join(", ")})`}
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
				<PlayerButton icon={<BoltIcon/>} tooltip={"Settings"} onclick={() => {

				}}/>
				<PlayerButton icon={isFullscreen ? <MinimizeIcon/> : <MaximizeIcon/>}
				              tooltip={isFullscreen ? "Exit Full Screen" : "Full Screen"} onclick={toggleFullscreen}/>
			</div>
		</div>
	)
}