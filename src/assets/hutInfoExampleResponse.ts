const example = {
	hutWebsite: "http://www.windegghuette.ch",
	hutId: 214,
	tenantCode: "SAC",
	hutUnlocked: true,
	maxNumberOfNights: 20,
	hutName: "Windegghütte SAC",
	hutWarden: "Adrienne Thommen \r\nMarkus Röthlisberger",
	phone: "+41339751110",
	coordinates: "46.69500,8.34803",
	altitude: "1887 m",
	totalBedsInfo: "36",
	tenantCountry: "CH",
	picture: {
		fileType: "HUT_PICTURE",
		blobPath: "https://www.hut-reservation.org/data/files/hut_picture_214.jpg",
		fileName: "picture_214.jpg",
		fileData: null,
	},
	hutLanguages: ["DE_CH"],
	hutBedCategories: [
		{
			index: 1,
			categoryID: 503,
			rooms: [],
			isVisible: true,
			totalSleepingPlaces: 36,
			reservationMode: "ROOM",
			hutBedCategoryLanguageData: [
				{
					language: "DE_CH",
					label: "Massenlager",
					shortLabel: "ML",
					description:
						"Alle Schlafplätze sind mit Duvets ausgestattet. Hüttenschlafsack ist obligatorisch.",
				},
			],
			isLinkedToReservation: false,
			tenantBedCategoryId: 1,
		},
		{
			index: 11,
			categoryID: 4319,
			rooms: [],
			isVisible: true,
			totalSleepingPlaces: 9,
			reservationMode: "UNSERVICED",
			hutBedCategoryLanguageData: [
				{
					language: "DE_CH",
					label: "Schutzraum/Winterraum",
					shortLabel: "SrWr",
					description: "",
				},
			],
			isLinkedToReservation: false,
			tenantBedCategoryId: 43,
		},
	],
	providerName: "NO_EPAYMENT",
	hutGeneralDescriptions: [
		{
			description:
				"Online-Reservationen können längstens bis 18.00 Uhr am Vortag des Ankunftsdatums getätigt werden. Spätere Reservationen sind nur per Telefon direkt bei der Hütte möglich.",
			language: "DE_CH",
		},
		{
			description:
				"Online reservations can be made at the latest until 18.00 on the day before the arrival date. Later reservations are only possible by phone directly at the hut.",
			language: "EN",
		},
		{
			description:
				"Les réservations en ligne peuvent être faites jusqu&#39;au plus tard 18h le jour avant votre arrivée. Passé ce délai, merci de contacter directement la cabane par téléphone.",
			language: "FR",
		},
		{
			description:
				"Le prenotazioni online possono essere inoltrate al più tardi fino alle ore 18.00 del giorno precedente l&#39;arrivo. Oltre tale termine, contatta telefonicamente il rifugio.",
			language: "IT",
		},
	],
	supportLink: null,
	waitingListEnabled: false,
};

// create a type from the above example
export type HutInfo = typeof example;
