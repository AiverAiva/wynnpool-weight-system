export async function sendToWebhook(data: {
    action: "created" | "updated" | "deleted";
    author: string;
    item_id: string;
    weight_name: string;
    weight_id: string;
    description?: string;
    diff?: Record<string, { old?: number; new?: number }>;
  }) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;
  
    const { action, author, item_id, weight_name, weight_id, diff, description } = data;
  
    const fields =
      diff &&
      Object.entries(diff).map(([key, val]) => ({
        name: key.replace(/([A-Z])/g, " $1"),
        value:
          action === "deleted"
            ? `**${(val.old! * 100).toFixed(1)}%**`
            : val.old != null && val.new != null
            ? `~~${(val.old * 100).toFixed(1)}%~~ → **${(val.new * 100).toFixed(1)}%**`
            : `**${(val.new! * 100).toFixed(1)}%**`,
        inline: true,
      }));
  
    const payload = {
      embeds: [
        {
          title: `Weight ${action.charAt(0).toUpperCase() + action.slice(1)}`,
          description: `**${weight_name}** for *${item_id}* (${weight_id})`,
          color: action === "created" ? 0x57f287 : action === "updated" ? 0xfaa61a : 0xed4245,
          fields: fields?.length ? fields : undefined,
          footer: { text: `By ${author}` },
          timestamp: new Date().toISOString(),
        },
      ],
    };
  
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }