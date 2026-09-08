import {type ChangeEvent, useState} from "react";

interface StringInputProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
	min?: number;
	max?: number;
	type?: string;
	placeholder?: string;
}

interface NumberInputProps {
	label: string;
	value: number;
	onChange: (value: number) => void;
	min?: number;
	max?: number;
	placeholder?: string;
}

export function LanguageInput({value, onChange, label, min, max, type, placeholder}: StringInputProps) {
	const [localValue, setLocalValue] = useState<string>(value);
	return (
		<div className={"metadataInput-side"}>
			<label className={"metadataInput-text"}>
				{label}
			</label>
			<input
				type={type || "text"}
				value={localValue}
				onChange={(e: ChangeEvent<HTMLInputElement>) => {
					setLocalValue(e.target.value);
				}}
				onBlur={(_: ChangeEvent<HTMLInputElement>) => {
					onChange(localValue)
				}}
				placeholder={placeholder}
				min={min}
				max={max}
				className={"metadataInput-string"}
			/>
		</div>
	);
}

export function StringInput({value, onChange, label, min, max, type, placeholder}: StringInputProps) {
	return (
		<div className={"metadataInput"}>
			<label className={"metadataInput-text"}>
				{label}
			</label>
			<input
				type={type || "text"}
				value={value}
				onChange={(e: ChangeEvent<HTMLInputElement>) => {
					onChange(e.target.value);
				}}
				placeholder={placeholder}
				min={min}
				max={max}
				className={"metadataInput-string"}
			/>
		</div>
	);
}

export function TextAreaInput({value, onChange, label, min, max, placeholder}: StringInputProps) {
	return (
		<div className={"metadataInput"}>
			<label className={"metadataInput-text"}>
				{label}
			</label>
			<textarea
				value={value}
				onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
					onChange(e.target.value);
				}}
				placeholder={placeholder}
				minLength={min}
				maxLength={max}
				className={"metadataInput-string"}
			/>
		</div>
	);
}

export function DateInput({value, onChange, label, min, max}: StringInputProps) {
	return (
		<div className={"metadataInput"}>
			<label className={"metadataInput-text"}>
				{label}
			</label>
			<input
				type={"datetime-local"}
				value={value}
				onChange={(e: ChangeEvent<HTMLInputElement>) => {
					onChange(e.target.value);
				}}
				min={min}
				max={max}
				className={"metadataInput-string"}
			/>
		</div>
	);
}

export function NumberInput({value, onChange, label, min, max, placeholder}: NumberInputProps) {
	return (
		<div className={"metadataInput"}>
			<label className={"metadataInput-text"}>
				{label}
			</label>
			<input
				type={"number"}
				value={value}
				onChange={(e: ChangeEvent<HTMLInputElement>) => {
					onChange(Number.parseInt(e.target.value));
				}}
				placeholder={placeholder}
				min={min}
				max={max}
				className={"metadataInput-string"}
			/>
		</div>
	);
}