export async function POST() {
    const response = await fetch("https://api.wynncraft.com/v3/item/search?fullResult", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ tier: "Mythic", type: ['weapon', 'armour'] }),
    });

    const data = await response.json();
    return Response.json(data);
}
