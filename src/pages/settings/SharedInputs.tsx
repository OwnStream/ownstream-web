import "./SharedInputs.css"
import {
	Plus,
	Save,
	Trash2,
} from "react-feather";
import type {ChangeEvent, ReactElement} from "react";

interface StringInputProps {
	icon?: ReactElement;
	value: string;
	onChange: (value: string) => void;
	label: string;
	min?: number;
	max?: number;
}

export function StringInput({icon, value, onChange, label, min, max}: StringInputProps) {
	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		onChange(e.target.value);
	};

	return (
		<div className={"settingsInput"}>
			{icon && (
				<span className="settingsInput-icon">
					{icon}
				</span>
			)}
			<label className={"settingsInput-text"}>
				{label}
			</label>
			<input
				type="text"
				value={value}
				onChange={handleInputChange}
				min={min}
				max={max}
				className={"settingsInput-string"}
			/>
		</div>
	);
}

interface NumberInputProps {
	icon?: ReactElement;
	value: number;
	onChange: (value: number) => void;
	label: string;
	min?: number;
	max?: number;
}

export function NumberInput({icon, value, onChange, label, min, max}: NumberInputProps) {
	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		const newValue = parseInt(e.target.value, 10);
		if (!isNaN(newValue)) {
			onChange(newValue);
		}
	};

	return (
		<div className={"settingsInput"}>
			{icon && (
				<span className="settingsInput-icon">
					{icon}
				</span>
			)}
			<label className={"settingsInput-text"}>
				{label}
			</label>
			<input
				type="number"
				value={value}
				onChange={handleInputChange}
				min={min}
				max={max}
				className={"settingsInput-number"}
			/>
		</div>
	);
}

interface EnumInputProps {
	icon?: ReactElement;
	value: string;
	values: Record<string, string>;
	onChange: (value: string) => void;
	label: string;
}

export function EnumInput({icon, value, values, onChange, label}: EnumInputProps) {
	const handleInputChange = (e: ChangeEvent<HTMLSelectElement>) => {
		onChange(e.target.value);
	};

	return (
		<div className={"settingsInput"}>
			{icon && (
				<span className="settingsInput-icon">
					{icon}
				</span>
			)}
			<label className={"settingsInput-text"}>
				{label}
			</label>
			<select onChange={handleInputChange} className={"settingsInput-select"}>
				{Object.entries(values).map(([key, label]) => (
					<option key={key} value={key} selected={value === key}>{label}</option>
				))}
			</select>
		</div>
	);
}

interface ButtonProps {
	onClick: () => void;
}

export function SaveButton({onClick}: ButtonProps) {
	return (
		<button onClick={onClick} className={"settingsInput-button settingsInput-save"}>
			<Save/>
			<span>Save changes</span>
		</button>
	)
}

export function DeleteButton({onClick}: ButtonProps) {
	return (
		<button onClick={onClick} className={"settingsInput-button settingsInput-delete"}>
			<Trash2/>
			<span>Delete</span>
		</button>
	)
}

export function AddButton({onClick}: ButtonProps) {
	return (
		<button onClick={onClick} className={"settingsInput-button settingsInput-save"}>
			<Plus/>
			<span>Add</span>
		</button>
	)
}
