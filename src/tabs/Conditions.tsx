const links = [
  {
    name: "CampToCamp",
    url: "https://www.camptocamp.org/outings?qa=draft,great&act=snow_ice_mixed,mountain_climbing,ice_climbing,paragliding,rock_climbing&bbox=701975,5629671,1250633,6070960",
    emoji: "🇫🇷",
    description: "French Alps conditions",
  },
  {
    name: "Gipfelbuch",
    url: "https://www.gipfelbuch.ch/verhaeltnisse/uebersicht",
    emoji: "🇨🇭",
    description: "Swiss conditions",
  },
  {
    name: "Chamoniarde",
    url: "https://www.chamoniarde.com/montagne/fil-info?activity=toutes&id=#",
    emoji: "🏔️",
    description: "Chamonix conditions",
  },
  {
    name: "Gulliver",
    url: "https://www.gulliver.it/search/",
    emoji: "🇮🇹",
    description: "Italian conditions",
  },
];

const Conditions = () => {
  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl">
      {links.map((link) => (
        <a
          key={link.url}
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-4 p-6 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
        >
          <span className="text-5xl">{link.emoji}</span>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-white">{link.name}</span>
            <span className="text-gray-400">{link.description}</span>
          </div>
          <span className="ml-auto text-3xl text-gray-500">↗</span>
        </a>
      ))}
    </div>
  );
};

export default Conditions;
