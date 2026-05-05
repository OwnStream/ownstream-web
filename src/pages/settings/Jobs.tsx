// noinspection ExceptionCaughtLocallyJS

import "./Jobs.css";
import {type JSX, type ReactElement, useEffect, useRef, useState} from "react";
import {client} from "../../api/api.ts";
import {BanIcon, CheckIcon, CopyIcon, HourglassIcon, LoaderIcon, RefreshCwIcon, SquareIcon} from "lucide-react";
import type {Job} from "../../api/types.ts";
import InfiniteScroll from "react-infinite-scroll-component";
import {formatDistanceToNow} from 'date-fns'

function toHhMmSs(timestamp: number) {
	timestamp = timestamp / 1000;
	const hours = Math.floor(timestamp / 3600);
	const minutes = Math.floor(timestamp / 60);
	const seconds = Math.floor(timestamp % 60);
	return hours > 0
		? `${hours}h ${minutes.toString()}m ${seconds.toString()}s`
		: minutes > 0
			? `${minutes.toString()}m ${seconds.toString()}s`
			: `${seconds.toString()}s`;
}

function JobButton({icon, tooltip, onClick}: { icon: JSX.Element, tooltip: string, onClick: () => void }) {
	return (<button onClick={onClick} title={tooltip} className={"jobButton"}>
		{icon}
	</button>);
}

function JobRow({job}: {
	job: Job,
}) {
	let icon = <HourglassIcon/>
	let className = "jobsItem-icon_waiting"
	const buttons: ReactElement[] = [];
	let time = "";
	switch (job.status) {
		case "Pending":
			icon = <HourglassIcon/>
			className = "jobsItem-icon_waiting"
			buttons.push((
				<JobButton key={"wait-stop"} icon={<SquareIcon/>} tooltip={"Cancel Job"}
				           onClick={async () => {
							   try {
								   const res = await client.stopJob(job.id);
								   if (!res.success) throw new Error(res.message);
							   } catch (e) {
								   alert(e);
							   }
						   }}/>));
			time = `Created ${formatDistanceToNow(new Date(job.createdAt))}`;
			break;
		case "Starting":
			icon = <LoaderIcon/>
			className = "jobsItem-icon_running"
			time = "About to start..."
			break;
		case "Processing":
			icon = <LoaderIcon/>
			className = "jobsItem-icon_complete"
			buttons.push((
				<JobButton key={"proc-stop"} icon={<SquareIcon/>} tooltip={"Stop Job"}
				           onClick={async () => {
							   try {
								   const res = await client.stopJob(job.id);
								   if (!res.success) throw new Error(res.message);
							   } catch (e) {
								   alert(e);
							   }
						   }}/>));
			time = `Running... ${toHhMmSs(new Date().getTime() - new Date(job.startedAt!).getTime())}`
			break;
		case "Completed":
			icon = <CheckIcon/>
			className = "jobsItem-icon_complete"
			buttons.push((
				<JobButton key={"complete-requeue"} icon={<RefreshCwIcon/>} tooltip={"Requeue Job"}
				           onClick={async () => {
							   try {
								   const res = await client.requeueJob(job.id);
								   if (!res.success) throw new Error(res.message);
							   } catch (e) {
								   alert(e);
							   }
						   }}/>));
			time = `Finished ${formatDistanceToNow(new Date(job.completedAt ?? ""))} ago (ran for ${toHhMmSs(new Date(job.completedAt!).getTime() - new Date(job.startedAt!).getTime())})`
			break;
		case "Failed":
			icon = <BanIcon/>
			className = "jobsItem-icon_failed"
			buttons.push((
				<JobButton key={"fail-copy"} icon={<CopyIcon/>} tooltip={"Copy Message"}
				           onClick={async () => {
							   try {
								   if (!job.message) {
									   alert("This job has no message to be copied");
								   }
								   await navigator.clipboard.writeText(job.message!);
							   } catch (e) {
								   alert(`Failed to copy: ${e}`);
							   }
						   }}/>));
			buttons.push((
				<JobButton key={"fail-requeue"} icon={<RefreshCwIcon/>} tooltip={"Restart Job"}
				           onClick={async () => {
							   try {
								   const res = await client.requeueJob(job.id);
								   if (!res.success) throw new Error(res.message);
							   } catch (e) {
								   alert(e);
							   }
						   }}/>));
			time = `Failed ${formatDistanceToNow(new Date(job.completedAt ?? job.updatedAt ?? ""))} ago
			(ran for ${toHhMmSs(new Date(job.completedAt!).getTime() - new Date(job.startedAt!).getTime())})`
			break;
	}
	return (
		<div className={"jobsItem-parent"}>
			<div className={"jobsItem"}>
				<div className={`jobsItem-icon ${className}`}>{icon}</div>
				<div className={"jobsItem-info"}>
					<span className={"jobsItem-label"}>{job.jobType}</span>
					<span className={"jobsItem-message"}>
						{job.message?.includes("\n") ? job.message.split("\n")[0] + "..." : job.message}
					</span>
					<span className={"jobsItem-time"}>{time}</span>
				</div>
				<div className={"jobsItem-buttons"}>
					{buttons}
				</div>
			</div>
			{(job.progress != undefined && job.progressMax != undefined) && (
				<div className={"jobsItem-progress"}>
					<div style={{width: (job.progress / job.progressMax * 100).toFixed(2) + "%"}}></div>
				</div>
			)}
		</div>);
}

export default function JobsTab() {
	const [jobs, setJobs] = useState<Job[]>([]);
	const [hasMore, setHasMore] = useState(true);
	const [count, setCount] = useState(0);
	const [page, setPage] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [lastDelta, setLastDelta] = useState(0);
	const lastDeltaRef = useRef(lastDelta);

	const updateJobs = (currentJobs: Job[], updates: Job[]): Job[] => {
		if (updates.length === 0) {
			return currentJobs;
		}

		const updatesById = new Map(updates.map(job => [job.id, job]));
		const updatedJobs = currentJobs.map(job => {
			let j: Job;
			if (updatesById.has(job.id)) {
				j = updatesById.get(job.id)!;
				updatesById.delete(job.id);
			} else {
				j = job;
			}
			return j;
		});
		updatesById.forEach((job) => {
			updatedJobs.push(job);
		})
		return updatedJobs.sort((a, b) => {
			return new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime();
		});
	};

	const fetchMore = async () => {
		try {
			const resp = await client.listJobs(0, page);
			setHasMore(resp.hasMore);
			setCount(resp.count);
			setPage(prevPage => prevPage + 1);
			setJobs(prevJobs => [...prevJobs, ...resp.items]);
		} catch (e) {
			console.error("Failed to load jobs", e);
			setError("Failed to load jobs: " + e)
		}
	}

	useEffect(() => {
		lastDeltaRef.current = lastDelta;
	}, [lastDelta]);

	useEffect(() => {
		let isCancelled = false;
		const pollJobs = async () => {
			const delta = lastDeltaRef.current;
			const nextDelta = Date.now();
			try {
				const resp = await client.listJobs(delta);
				if (isCancelled) return;
				setJobs(currentJobs => updateJobs(currentJobs, resp.items));
				setLastDelta(nextDelta);
			} catch (e) {
				if (isCancelled) return;
				console.error("Failed to poll jobs", e);
				setError("Failed to poll jobs: " + e)
			}
		};

		const interval = window.setInterval(pollJobs, 1000);
		return () => {
			isCancelled = true;
			window.clearInterval(interval);
		};
	}, []);

	return (<>
		<h2>Jobs</h2>
		<p><b>{count}</b> jobs.</p>

		<InfiniteScroll
			className={"jobs"}
			dataLength={jobs.length}
			next={fetchMore}
			hasMore={hasMore}
			loader={<p>Loading...</p>}
			endMessage={<p style={{textAlign: 'center'}}>All items loaded.</p>}
		>
			{jobs.map(job => (
				<JobRow key={job.id} job={job}/>
			))}
			{error && <div>{error}</div>}
		</InfiniteScroll>
	</>);
}
