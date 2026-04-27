import "./Benchmark.css";
import {useEffect, useState} from "react";
import {client} from "../../api/api.ts";
import {Check, Clock, Play, PlayCircle, Slash, StopCircle} from "react-feather";


function StartBenchmarkButton({onClick}: {onClick: () => void}) {
	return (
		<button onClick={onClick} className={"settingsInput-button settingsInput-save"}>
			<Play/>
			<span>Start Benchmark</span>
		</button>
	)
}

function StopBenchmarkButton({onClick}: {onClick: () => void}) {
	return (
		<button onClick={onClick} className={"settingsInput-button settingsInput-delete"}>
			<StopCircle/>
			<span>Stop Benchmark</span>
		</button>
	)
}

function EncoderRow(props: {
	encoder: string,
	label: string,
	state: "RUNNING" | "FAIL" | "COMPLETE" | "WAITING",
	score?: number
}) {
	let icon = <Clock/>
	let className = "encoderBenchmarkItem-icon_waiting"
	switch (props.state) {
		case "RUNNING":
			icon = <PlayCircle/>
			className = "encoderBenchmarkItem-icon_running"
			break;
		case "FAIL":
			icon = <Slash/>
			className = "encoderBenchmarkItem-icon_failed"
			break;
		case "COMPLETE":
			icon = <Check/>
			className = "encoderBenchmarkItem-icon_complete"
			break;
		case "WAITING":
			icon = <Clock/>
			className = "encoderBenchmarkItem-icon_waiting"
			break;
	}
	return (<div className={"encoderBenchmarkItem"}>
		<div className={`encoderBenchmarkItem-icon ${className}`}>{icon}</div>
		<div className={"encoderBenchmarkItem-info"}>
			<span className={"encoderBenchmarkItem-label"}>{props.label}</span>
			<span className={"encoderBenchmarkItem-stats"}>
				<code>{props.encoder}</code> &bull; {props.score == -1
				? <>Unsupported</>
				: props.score != null
					? (<>{(30000 / props.score).toFixed(2)}x</>)
					: props.state == "WAITING"
						? (<>Waiting...</>)
						: props.state == "FAIL"
							? (<>Skipped</>)
							: (<>Running...</>)}
			</span>
		</div>
	</div>);
}

export default function BenchmarkTab() {
	const [running, setRunning] = useState(false);
	const [encoders, setEncoders] = useState<Record<string, string>>({});
	const [encoderStates, setEncoderStates] = useState<Record<string, "RUNNING" | "FAIL" | "COMPLETE" | "WAITING">>({});
	const [results, setResults] = useState<Record<string, number | undefined>>({});
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!running) {
			return;
		}

		// eslint-disable-next-line react-hooks/set-state-in-effect
		setError(null);

		const eventSource = new EventSource(`${client.baseUrl}/api/settings/benchmark?access_token=${client.token}`, {});

		eventSource.addEventListener("encoders", (event) => {
			const encoders: Record<string, string> = JSON.parse(event.data);
			console.log("[Benchmark] Got encoders", encoders)
			setEncoders(encoders);
			const encoderStates: Record<string, "RUNNING" | "FAIL" | "COMPLETE" | "WAITING"> = {};
			Object.entries(encoders).forEach(([encoder]) => {
				encoderStates[encoder] = "WAITING";
			})
			setEncoderStates(encoderStates);
		});

		eventSource.addEventListener("results", (event) => {
			const results = JSON.parse(event.data);
			console.log("[Benchmark] Results were updated", results)
			setResults(results);
		});

		eventSource.addEventListener("state", (event) => {
			const data = JSON.parse(event.data);
			console.log(`[Benchmark] ${data.encoder}: ${data.state}`)
			setEncoderStates((prev) => ({...prev, [data.encoder]: data.state}));
		});

		eventSource.addEventListener("done", () => {
			console.log(`[Benchmark] Complete`)
			setRunning(false);
			eventSource.close();
		});

		eventSource.onerror = () => {
			console.log(`[Benchmark] Failed`)
			setError("Benchmark stream disconnected.");
			setRunning(false);
			eventSource.close();
		};

		return () => {
			eventSource.close();
		};
	}, [running]);

	const all = Object.entries(encoders).length;
	const complete = Object.entries(encoderStates).filter(([_, state]) => state === "FAIL" || state === "COMPLETE").length;

	return (<>
		<h2>Benchmark</h2>
		{running ?
			<StopBenchmarkButton onClick={() => {
				setEncoderStates((prev) => {
					const updated = {...prev};
					Object.entries(updated).forEach(([encoder, state]) => {
						if (state === "RUNNING" || state === "WAITING") {
							updated[encoder] = "FAIL";
						}
					});
					return updated;
				});
				setRunning(false);
			}}/>
			:
			<StartBenchmarkButton onClick={() => {
				setRunning(true);
			}}/>
		}

		{running && <div>{complete} / {all} benchmarks complete.</div>}

		{error && <div>{error}</div>}

		<div className={"encoderBenchmark"}>
			{Object.entries(encoders)
				.sort(([encoderA], [encoderB]) => {
					const stateA = encoderStates[encoderA] || "WAITING";
					const stateB = encoderStates[encoderB] || "WAITING";
					const scoreA = results[encoderA];
					const scoreB = results[encoderB];
					if (stateA === "RUNNING" && stateB !== "RUNNING") return -1;
					if (stateA !== "RUNNING" && stateB === "RUNNING") return 1;
					if (stateA === "WAITING" && stateB !== "WAITING") return 1;
					if (stateA !== "WAITING" && stateB === "WAITING") return -1;
					if (stateA === "FAIL" && stateB !== "FAIL" && stateB !== "WAITING") return 1;
					if (stateA !== "FAIL" && stateB === "FAIL" && stateA !== "WAITING") return -1;
					if (stateA === "COMPLETE" && stateB === "COMPLETE") {
						if (scoreA === -1 && scoreB === -1) return 0;
						if (scoreA === -1) return 1;
						if (scoreB === -1) return -1;
						// @ts-expect-error If both are complete, scores should never be null.
						return scoreA - scoreB;
					}

					return 0;
				})
				.map(([encoder, label]) => (
					<EncoderRow encoder={encoder} label={label} state={encoderStates[encoder] || "WAITING"}
					            score={results[encoder]}/>
				))}
		</div>
	</>);
}