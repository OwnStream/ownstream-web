import type { User } from "../api/types";

const ACCOUNTS_KEY = "ownstream.accounts";
const ACTIVE_USER_KEY = "ownstream.lastUsedAccount";

export type StoredAccount = {
	user: User;
	token: string;
};

export function loadAccounts(): StoredAccount[] {
	const raw = localStorage.getItem(ACCOUNTS_KEY);
	if (!raw) return [];

	try {
		return JSON.parse(raw) as StoredAccount[];
	} catch {
		return [];
	}
}

export function saveAccounts(accounts: StoredAccount[]) {
	localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function loadLastUsedAccountId(): string | null {
	return localStorage.getItem(ACTIVE_USER_KEY);
}

export function saveLastUsedAccountId(userId: string) {
	localStorage.setItem(ACTIVE_USER_KEY, userId);
}

export function clearLastUsedAccountId() {
	localStorage.removeItem(ACTIVE_USER_KEY);
}