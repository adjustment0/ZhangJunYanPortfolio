export default async (req, context) => {
  // 1. 只允許 POST 請求
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const userMessage = body.message || "你好";

    // 2. 取得 API Key (改用 process.env 比較穩定)
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error("Error: API Key is missing.");
      return new Response(JSON.stringify({ reply: "系統設定錯誤：找不到 API Key。" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. 設定 AI 人設
    const systemPrompt = `
      你現在是「張俊彥 (Jayen Z.)」個人作品集的專屬 AI 導覽員。
      
      【關於張俊彥】
      - 身份：崑山科大資管系學生、遊戲開發者、自媒體經營。
      - 經歷：擁有 5-6 年傳產物流經驗，目前積極轉職工程師。
      - 核心技能：Unity,Unreal Engine,C#,Python,Generative AI。
      - 影音技能：Adobe After Effects (國際證照),Premiere。      
      - 作品亮點：Shadow Archer (Unity3D RPG),RUNIMON (Unity2D 跑酷),Visual Portfolio (AE),Fire Dragon VFX,IMS 庫存管理系統 (WinForms)。
      
      【你的任務】
      - 請用「繁體中文」回答。
      - 語氣要專業、熱情且友善。
      - 若訪客詢問聯絡方式，請引導至 Email: a0965332528@gmail.com。
    `;

    // 4. 呼叫 OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://zhangjunyan-portfolio.netlify.app/",
        "X-Title": "Jayen Portfolio AI",
      },
      body: JSON.stringify({
        "model": "amazon/nova-2-lite-v1:free", 
        "messages": [
          {"role": "system", "content": systemPrompt},
          {"role": "user", "content": userMessage}
        ],
        "temperature": 0.7,
      })
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("OpenRouter Error:", errText);
        throw new Error(`OpenRouter API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiReply = data.choices[0].message.content;

    return new Response(JSON.stringify({ reply: aiReply }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Server Function Error:", error);
    return new Response(JSON.stringify({ reply: "AI 目前連線繁忙，請稍後再試。" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};







