module.exports = [
	{
		title: "demo",
		filename: "index.html",
		template: "views/index.ejs", 
		chunks:["z","g","h"],
		chunksSortMode: 'manual',
		hash: true,
		cache: true
	},
	{
		title: "demo",
		filename: "2.html",
		template: "views/2.ejs", 
		chunksSortMode: 'manual',
		chunks:["2"],
		hash: true,
		cache: true
	}
];