import formatDistance from "https://cdn.jsdelivr.net/npm/date-fns@2.28.0/esm/formatDistance/index.js";

const URL = 'https://cdn.arks-layer.com/api/events_na.txt';
const TIMEZONE_OFFSET = '-07:00';
const USER_AGENT = 'github:intrnl/pso2-alerts-linux';

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

		// skip events that are more than 30 minutes ago,
		// it seems that the events are not always updated
		if ((now - date) > 30 * 60 * 1000) {
			console.log(`[SKIP] ${event.event_name}`);
			continue;
		}

		console.log(`[${event.type}] ${event.event_name}`);

		desc && (desc += '\n');
		desc += `<i>${formatDistance(date, now, { addSuffix: true })}</i> - ${event.event_name}`;
	}

	// nothing to actually report, let's skip
	if (!desc) {
		return;
	}

	const command = [
		'notify-send',
		`--app-name=${'PSO2 Alerts'}`,
		'Reporting in-game events',
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

		const hour24 = h12to24(hour, period);
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

function h12to24 (hours, period) {
	if (hours === '12') {
		hours = '00';
	}

	if (period === 'PM') {
		hours = +hours + 12;
	}

	return hours;
}
