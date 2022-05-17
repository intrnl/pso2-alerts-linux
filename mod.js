import formatDistance from "https://cdn.jsdelivr.net/npm/date-fns@2.28.0/esm/formatDistance/index.js";

const URL = 'https://cdn.arks-layer.com/api/events_na.txt';
const TIMEZONE_OFFSET = '-07:00';
const USER_AGENT = 'github:intrnl/pso2-alerts-linux';

const CACHE_FILE = './current.txt';

const RE_EVENTS = /^(?<date>.+)\|(?<type>.+)\|(?<event>.+)\|(?<battle_power>.+)$/gm;
const RE_DATE = /^(?<month>\d{2})\/(?<day>\d{2})\/(?<year>\d{4}) (?<hour>\d{2}):(?<minute>\d{2}) (?<period>AM|PM)$/;

await main();

async function main () {
	console.log(`fetching schedule`);
	
	const response = await fetch(URL, { headers: { 'user-agent': USER_AGENT } });
	const next = await response.text();

	if (!next) {
		return;
	}

	const events = parseEvents(next);

	console.log(`reporting ${events.length} events`);

	const now = new Date();
	let desc = '';

	for (let i = 0; i < events.length; i++) {
		const event = events[i];
		const date = new Date(event.timestamp);

		if (i > 0) {
			desc += '\n';
		}

		console.log(now, date, event.timestamp);
		desc += `<i>${formatDistance(date, now, { addSuffix: true })}</i> - ${event.event_name}`;
	}

	const command = [
		'notify-send',
		`--app-name=${'PSO2 Alerts'}`,
		`--hint=string:desktop-entry:org.kde.konsole`,
		`--icon=dialog-information`,
		'Upcoming urgent quests',
		desc,
	];

	const p = Deno.run({ cmd: command });
	await p.status();
}

function parseEvents (source) {
	const events = [];

	for (const match of source.matchAll(RE_EVENTS)) {
		const { date, type, event, battle_power } = match.groups;
		const { month, day, year, hour, minute, period } = RE_DATE.exec(date).groups;

		const hour24 = ('' + (+hour + ((period === 'PM' ? 12 : 0) % 24))).padStart(2, '0');
		const timestamp = `${year}-${month}-${day}T${hour24}:${minute}:00.000${TIMEZONE_OFFSET}`;

		events.push({
			type: type,
			timestamp: timestamp,
			event_name: event,
			minimum_power: battle_power,
		});
	}

	return events;
}
