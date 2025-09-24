export default function formatDateString(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();

	// Helper function to get ordinal suffix
	const getOrdinalSuffix = (day: number) => {
		if (day > 3 && day < 21) return "th";
		switch (day % 10) {
			case 1:
				return "st";
			case 2:
				return "nd";
			case 3:
				return "rd";
			default:
				return "th";
		}
	};

	// Format as "January 15th, 2025 4:45pm EST"
	const formatter = new Intl.DateTimeFormat("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
		timeZone: "America/New_York",
	});

	const parts = formatter.formatToParts(date);
	const month = parts.find((part) => part.type === "month")?.value;
	const day = parseInt(parts.find((part) => part.type === "day")?.value || "0");
	const year = parts.find((part) => part.type === "year")?.value;
	const hour = parts.find((part) => part.type === "hour")?.value;
	const minute = parts.find((part) => part.type === "minute")?.value;
	const dayPeriod = parts.find((part) => part.type === "dayPeriod")?.value?.toLowerCase();

	// Determine if it's EST or EDT based on the date
	const isEST = date.getTimezoneOffset() === 300; // EST is UTC-5 (300 minutes)
	const timeZone = isEST ? "EST" : "EDT";

	return `${month} ${day}${getOrdinalSuffix(
		day
	)}, ${year} ${hour}:${minute}${dayPeriod} ${timeZone}`;
};